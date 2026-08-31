import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  fileUrl: z.string().min(1).max(1024),
  candidateId: z.string().uuid(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { fileUrl, candidateId } = requestSchema.parse(await req.json());

    // Authorization: confirm caller can access the candidate (via RLS)
    const { data: candidateAuth, error: candAuthErr } = await userClient
      .from("candidates")
      .select("id, org_id")
      .eq("id", candidateId)
      .maybeSingle();
    if (candAuthErr || !candidateAuth) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // fileUrl must live under the candidate's org folder
    const orgPrefix = `${candidateAuth.org_id}/`;
    if (!fileUrl.startsWith(orgPrefix)) {
      return new Response(JSON.stringify({ error: 'Invalid file path' }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes').download(fileUrl);
    if (downloadError || !fileData) throw new Error("Failed to download resume");

    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Content = btoa(String.fromCharCode(...uint8Array));

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a resume parser. Extract structured information accurately." },
          { role: "user", content: [
            { type: "text", text: "Extract: full name, email, phone, LinkedIn URL, location, current role, years of experience, skills, work experience, education, summary." },
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64Content}` } },
          ]},
        ],
        tools: [{ type: "function", function: {
          name: "extract_resume_data",
          description: "Extract structured information from a resume",
          parameters: {
            type: "object",
            properties: {
              full_name: { type: "string" }, email: { type: "string" }, phone: { type: "string" },
              location: { type: "string" }, linkedin_url: { type: "string" },
              current_role: { type: "string" }, experience_years: { type: "number" },
              skills: { type: "array", items: { type: "string" } },
              experience: { type: "array", items: { type: "object", properties: {
                company: { type: "string" }, title: { type: "string" }, duration: { type: "string" }, description: { type: "string" }
              }}},
              education: { type: "array", items: { type: "object", properties: {
                institution: { type: "string" }, degree: { type: "string" }, field: { type: "string" }, year: { type: "string" }
              }}},
              summary: { type: "string" },
            },
            required: ["full_name"], additionalProperties: false,
          },
        }}],
        tool_choice: { type: "function", function: { name: "extract_resume_data" } },
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${await aiResponse.text()}`);
    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Failed to parse resume data");
    const parsedData = JSON.parse(toolCall.function.arguments);

    const updateData: any = { parsed_resume_json: parsedData };
    if (parsedData.email) updateData.email = parsedData.email;
    if (parsedData.phone) updateData.phone = parsedData.phone;
    if (parsedData.location) updateData.location = parsedData.location;
    if (parsedData.linkedin_url) updateData.linkedin_url = parsedData.linkedin_url;

    const { error: updateError } = await supabase.from("candidates").update(updateData).eq("id", candidateId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, data: parsedData }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in parse-resume function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
