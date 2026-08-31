import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const formatDate = (date: string): string => {
  // Convert to UTC and format as YYYYMMDDTHHMMSSZ
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const escapeICSText = (text: string): string => {
  // Escape special characters for ICS format
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  interviewId: z.string().uuid('Invalid interview ID format'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Use user-scoped client so RLS enforces access on interviews/applications/jobs
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate input
    const body = await req.json();
    const { interviewId } = requestSchema.parse(body);

    // Fetch interview details - RLS enforces caller has access
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(`
        *,
        application:applications(
          candidate:candidates(full_name, email),
          job:jobs(title)
        )
      `)
      .eq('id', interviewId)
      .maybeSingle();

    if (interviewError || !interview) {
      return new Response(JSON.stringify({ error: 'Interview not found or forbidden' }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }


    // Generate ICS content
    const startDate = formatDate(interview.start_at);
    const endDate = formatDate(interview.end_at);
    const candidateName = interview.application?.candidate?.full_name || 'Candidate';
    const jobTitle = interview.application?.job?.title || 'Position';
    const title = escapeICSText(interview.title || `Interview with ${candidateName}`);
    const location = escapeICSText(interview.location || interview.meeting_link || '');
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HireFlow//Interview Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:interview-${interviewId}@hireflow.app`,
      `DTSTAMP:${formatDate(new Date().toISOString())}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Interview for ${escapeICSText(jobTitle)} with ${escapeICSText(candidateName)}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="interview-${interviewId}.ics"`,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error generating ICS:', error);
    
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
      JSON.stringify({ error: error.message || 'Failed to generate ICS file' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
