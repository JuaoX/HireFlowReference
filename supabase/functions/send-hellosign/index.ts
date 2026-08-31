import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const HELLOSIGN_API_KEY = Deno.env.get("HELLOSIGN_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  offerId: z.string().uuid(),
  candidateEmail: z.string().email(),
  candidateName: z.string().min(1).max(255),
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

    const { offerId, candidateEmail, candidateName } = requestSchema.parse(await req.json());

    if (!HELLOSIGN_API_KEY) {
      return new Response(JSON.stringify({ error: "HelloSign API key not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Authorization via RLS - confirms caller can access the offer
    const { data: offerAuth, error: offerAuthError } = await userClient
      .from("offers")
      .select("id, pdf_url")
      .eq("id", offerId)
      .maybeSingle();
    if (offerAuthError || !offerAuth) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!offerAuth.pdf_url) {
      return new Response(JSON.stringify({ error: 'Offer PDF not generated yet' }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Mint short-lived signed URL for the PDF so HelloSign can fetch it
    const { data: signed } = await supabase.storage
      .from("documents")
      .createSignedUrl(offerAuth.pdf_url, 60 * 60);
    if (!signed?.signedUrl) {
      return new Response(JSON.stringify({ error: 'Failed to access offer PDF' }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const formData = new FormData();
    formData.append("test_mode", "1");
    formData.append("title", `Offer Letter - ${candidateName}`);
    formData.append("subject", "Please sign your offer letter");
    formData.append("message", "Please review and sign your offer letter.");
    formData.append("signers[0][email_address]", candidateEmail);
    formData.append("signers[0][name]", candidateName);
    formData.append("file_url[0]", signed.signedUrl);

    const response = await fetch("https://api.hellosign.com/v3/signature_request/send", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(HELLOSIGN_API_KEY + ":")}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HelloSign API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    await supabase.from("offers").update({
      state: "sent",
      notes: `HelloSign Signature Request ID: ${result.signature_request.signature_request_id}`,
    }).eq("id", offerId);

    return new Response(JSON.stringify({
      success: true,
      signatureRequestId: result.signature_request.signature_request_id,
    }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-hellosign function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
