import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const candidateSchema = z.object({
  full_name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  linkedin_url: z.string().url().max(500).optional().or(z.literal('')),
});

const applicationSchema = z.object({
  jobId: z.string().uuid(),
  candidate: candidateSchema,
  cover_letter: z.string().max(5000).optional(),
  resumeFile: z.object({
    name: z.string(),
    size: z.number().max(5 * 1024 * 1024), // 5MB max
    type: z.string(),
  }).optional(),
  responses: z.array(z.object({
    question_id: z.string().uuid(),
    response_text: z.string().max(5000),
  })).optional(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    const body = await req.json();
    const validatedData = applicationSchema.parse(body);

    // Verify job exists and is open
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, org_id, status')
      .eq('id', validatedData.jobId)
      .eq('status', 'open')
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found or not accepting applications' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get the first stage (Applied) for this job
    const { data: firstStage, error: stageError } = await supabase
      .from('job_stages')
      .select('id')
      .eq('job_id', validatedData.jobId)
      .eq('type', 'applied')
      .order('order_idx', { ascending: true })
      .limit(1)
      .single();

    if (stageError || !firstStage) {
      return new Response(
        JSON.stringify({ error: 'Job stages not configured properly' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check for duplicate application (same email for same job)
    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('id, applications!inner(id, job_id)')
      .eq('email', validatedData.candidate.email)
      .eq('org_id', job.org_id);

    if (existingCandidate && existingCandidate.length > 0) {
      const hasApplied = existingCandidate.some((c: any) => 
        c.applications?.some((a: any) => a.job_id === validatedData.jobId)
      );
      
      if (hasApplied) {
        return new Response(
          JSON.stringify({ error: 'You have already applied for this position' }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Create candidate with validated org_id from job
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        ...validatedData.candidate,
        org_id: job.org_id,
        source: 'careers_page',
        consent: true,
        consent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (candidateError || !candidate) {
      console.error('Error creating candidate:', candidateError);
      return new Response(
        JSON.stringify({ error: 'Failed to create candidate profile' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Handle resume upload if provided
    let resumeUrl = null;
    if (validatedData.resumeFile && body.resumeBase64) {
      try {
        const fileExt = validatedData.resumeFile.name.split('.').pop();
        const fileName = `${candidate.id}-${Date.now()}.${fileExt}`;
        const filePath = `${job.org_id}/${fileName}`;

        // Decode base64 and upload
        const base64Data = body.resumeBase64.split(',')[1] || body.resumeBase64;
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, binaryData, {
            contentType: validatedData.resumeFile.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading resume:', uploadError);
        } else {
          // Store just the path, not public URL
          resumeUrl = filePath;

          // Create attachment record
          await supabase.from('attachments').insert({
            org_id: job.org_id,
            owner_id: candidate.id,
            owner_type: 'candidate',
            file_name: validatedData.resumeFile.name,
            file_url: filePath,
            mime_type: validatedData.resumeFile.type,
            size_bytes: validatedData.resumeFile.size,
          });
        }
      } catch (uploadError) {
        console.error('Error processing resume:', uploadError);
        // Continue without resume
      }
    }

    // Create application in the first stage
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .insert({
        candidate_id: candidate.id,
        job_id: validatedData.jobId,
        current_stage_id: firstStage.id,
        state: 'active',
        cover_letter: validatedData.cover_letter || null,
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (applicationError || !application) {
      console.error('Error creating application:', applicationError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit application' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create application responses if provided
    if (validatedData.responses && validatedData.responses.length > 0) {
      // Validate that questions belong to this job
      const { data: jobQuestions } = await supabase
        .from('application_questions')
        .select('id')
        .eq('job_id', validatedData.jobId);

      const validQuestionIds = new Set(jobQuestions?.map(q => q.id) || []);
      const validResponses = validatedData.responses.filter(r => 
        validQuestionIds.has(r.question_id)
      );

      if (validResponses.length > 0) {
        await supabase.from('application_responses').insert(
          validResponses.map(r => ({
            application_id: application.id,
            question_id: r.question_id,
            response_text: r.response_text,
          }))
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        applicationId: application.id,
        candidateId: candidate.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-application function:", error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: error.errors 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
