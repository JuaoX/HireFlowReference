import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  offerId: z.string().uuid('Invalid offer ID format'),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { offerId } = requestSchema.parse(await req.json());

    // Authorization via RLS - ensures user can read this offer
    const { data: authCheck, error: authzError } = await userClient
      .from("offers")
      .select("id")
      .eq("id", offerId)
      .maybeSingle();
    if (authzError || !authCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(`
        id, state, base_amount, variable_amount, currency, equity,
        benefits_md, expires_at, pdf_url, application_id
      `)
      .eq("id", offerId)
      .single();
    if (offerError || !offer) throw new Error("Offer not found");

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        candidate:candidates (id, full_name, email),
        job:jobs (id, title, org_id)
      `)
      .eq("id", offer.application_id)
      .single();
    if (appError || !application) throw new Error("Application not found");

    if (offer.state !== "approved") {
      return new Response(JSON.stringify({ message: "Offer is not in approved state" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let pdfPath = offer.pdf_url;
    if (!pdfPath) {
      const { data: pdfData } = await supabase.functions.invoke("generate-offer-pdf", {
        body: { offerId },
        headers: { Authorization: authHeader },
      });
      pdfPath = pdfData?.pdfPath;
    }

    const candidate = Array.isArray(application.candidate) ? application.candidate[0] : application.candidate;
    const job = Array.isArray(application.job) ? application.job[0] : application.job;

    let pdfLinkHtml = '';
    if (pdfPath) {
      const { data: signed } = await supabase.storage.from("documents").createSignedUrl(pdfPath, 60 * 60 * 24 * 7);
      if (signed?.signedUrl) pdfLinkHtml = `<p><a href="${signed.signedUrl}">Download Offer Letter (PDF)</a></p>`;
    }

    const totalCompensation = offer.base_amount + (offer.variable_amount || 0);
    const emailBody = `
      <h1>Job Offer</h1>
      <p>Dear ${candidate.full_name},</p>
      <p>We are pleased to extend an offer for the position of <strong>${job.title}</strong>.</p>
      <h2>Compensation Details:</h2>
      <ul>
        <li>Base Salary: ${offer.currency} ${offer.base_amount.toLocaleString()}</li>
        ${offer.variable_amount ? `<li>Variable/Bonus: ${offer.currency} ${offer.variable_amount.toLocaleString()}</li>` : ''}
        ${offer.equity ? `<li>Equity: ${offer.equity}</li>` : ''}
        <li><strong>Total Compensation: ${offer.currency} ${totalCompensation.toLocaleString()}</strong></li>
      </ul>
      ${offer.benefits_md ? `<h2>Benefits:</h2><pre>${offer.benefits_md}</pre>` : ''}
      ${offer.expires_at ? `<p><em>This offer expires on ${new Date(offer.expires_at).toLocaleDateString()}.</em></p>` : ''}
      ${pdfLinkHtml}
      <p>We look forward to having you on our team!</p>
    `;

    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        org_id: job.org_id,
        application_id: application.id,
        candidate_id: candidate.id,
        to_addresses: [candidate.email],
        subject: `Job Offer - ${job.title}`,
        body_html: emailBody,
        status: "queued",
      })
      .select()
      .single();
    if (messageError) throw messageError;

    await supabase.functions.invoke("send-email", { body: { messageId: message.id } });
    await supabase.from("offers").update({ state: "sent" }).eq("id", offerId);

    return new Response(JSON.stringify({ success: true, message: "Offer notification sent" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error processing offer approval:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
