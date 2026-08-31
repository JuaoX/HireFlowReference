import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  messageId: z.string().uuid('Invalid message ID format'),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
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

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate input
    const body = await req.json();
    const { messageId } = requestSchema.parse(body);
    console.log("Processing email for message:", messageId);

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch message details
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      throw new Error(`Message not found: ${messageError?.message}`);
    }

    console.log("Sending email to:", message.to_addresses);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "HireFlow <onboarding@resend.dev>", // Update with your verified domain
      to: message.to_addresses,
      cc: message.cc_addresses && message.cc_addresses.length > 0 ? message.cc_addresses : undefined,
      subject: message.subject,
      html: message.body_html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update message status
    const { error: updateError } = await supabase
      .from("messages")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        external_id: emailResponse.data?.id || null,
      })
      .eq("id", messageId);

    if (updateError) {
      console.error("Failed to update message status:", updateError);
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);

    // Try to update message status to failed if we have the messageId
    try {
      const { messageId } = await req.clone().json();
      if (messageId) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("messages")
          .update({
            status: "failed",
            failed_reason: error.message,
          })
          .eq("id", messageId);
      }
    } catch (updateError) {
      console.error("Failed to update message status to failed:", updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
