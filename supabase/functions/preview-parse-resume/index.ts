import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface PreviewParseRequest {
  fileContent: string;
  fileName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated caller (prevent unauth AI quota abuse)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fileContent, fileName }: PreviewParseRequest = await req.json();

    if (!fileContent || !fileName) {
      return new Response(
        JSON.stringify({ error: "Missing fileContent or fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Parsing resume preview: ${fileName}`);


    // Call Lovable AI to parse the resume with multimodal input
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a resume parser. Extract contact information accurately from resumes.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the candidate's full name, email address, phone number, and LinkedIn URL from this resume. Be accurate and return empty string if information is not found."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${fileContent}`
                }
              }
            ]
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_resume_info",
              description: "Extract basic contact information from resume",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string", description: "Full name of the candidate" },
                  email: { type: "string", description: "Email address" },
                  phone: { type: "string", description: "Phone number" },
                  linkedin_url: { type: "string", description: "LinkedIn profile URL" },
                },
                required: ["full_name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_resume_info" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI parsing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData));

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "No tool call in AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsedData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          full_name: parsedData.full_name || "",
          email: parsedData.email || "",
          phone: parsedData.phone || "",
          linkedin_url: parsedData.linkedin_url || "",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in preview-parse-resume:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
