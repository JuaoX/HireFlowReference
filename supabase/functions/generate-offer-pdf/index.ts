import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

    // User-scoped client to enforce RLS-based access checks
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const { offerId } = requestSchema.parse(body);

    // Authorization via RLS: this returns row only if user can view the offer
    const { data: offerAuth, error: offerAuthError } = await userClient
      .from("offers")
      .select("id, application_id")
      .eq("id", offerId)
      .maybeSingle();
    if (offerAuthError || !offerAuth) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Service client for full data fetch + storage upload
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(`
        *,
        application:applications(
          id,
          candidate:candidates(id, full_name, email, phone, location),
          job:jobs(id, title, department, location, employment_type, org_id)
        )
      `)
      .eq("id", offerId)
      .single();

    if (offerError || !offer) throw new Error(`Offer not found`);

    const orgId = offer.application.job.org_id;
    const { data: org } = await supabase
      .from("organizations").select("name").eq("id", orgId).single();
    const orgName = org?.name || "Company";
    const candidate = offer.application.candidate;
    const job = offer.application.job;

    const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", {
      style: "currency", currency: offer.currency, minimumFractionDigits: 0,
    }).format(amount);
    const totalComp = offer.base_amount + (offer.variable_amount || 0);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();
    const margin = 60;
    let y = height - 80;
    const draw = (t: string, s: number, f: any, yp: number, o: any = {}) =>
      page.drawText(t, { x: margin, y: yp, size: s, font: f, color: rgb(0.2,0.2,0.2), ...o });

    draw(orgName, 18, boldFont, y); y -= 20;
    draw("OFFER LETTER", 16, boldFont, y, { x: width / 2 - 60 }); y -= 40;
    draw(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 11, font, y); y -= 30;
    draw(candidate.full_name, 11, font, y); y -= 15;
    draw(candidate.email, 11, font, y); y -= 15;
    if (candidate.phone) { draw(candidate.phone, 11, font, y); y -= 15; }
    if (candidate.location) { draw(candidate.location, 11, font, y); y -= 15; }
    y -= 20;
    draw(`Dear ${candidate.full_name},`, 11, font, y); y -= 30;
    draw(`We are pleased to offer you the position of ${job.title}${job.department ? ` in the ${job.department} department` : ""} at ${orgName}.`, 11, font, y); y -= 40;
    draw("COMPENSATION", 14, boldFont, y); y -= 20;
    draw(`• Base Salary: ${formatCurrency(offer.base_amount)} per year`, 11, font, y); y -= 15;
    if (offer.variable_amount) { draw(`• Variable Compensation: ${formatCurrency(offer.variable_amount)} per year`, 11, font, y); y -= 15; }
    if (offer.equity) { draw(`• Equity: ${offer.equity}`, 11, font, y); y -= 15; }
    draw(`• Total Annual Compensation: ${formatCurrency(totalComp)}`, 11, boldFont, y); y -= 30;
    draw("EMPLOYMENT DETAILS", 14, boldFont, y); y -= 20;
    draw(`• Employment Type: ${job.employment_type.replace("_", " ").toUpperCase()}`, 11, font, y); y -= 15;
    if (job.location) { draw(`• Location: ${job.location}`, 11, font, y); y -= 15; }
    y -= 20;
    if (offer.benefits_md) { draw("BENEFITS", 14, boldFont, y); y -= 20; draw(offer.benefits_md, 11, font, y); y -= 30; }
    if (offer.expires_at) { draw(`This offer is valid until ${new Date(offer.expires_at).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}.`, 11, font, y); y -= 40; }
    draw("Sincerely,", 11, font, y); y -= 30;
    draw(orgName, 11, boldFont, y);

    const pdfBytes = await pdfDoc.save();
    // Store under org-scoped folder in private bucket
    const storagePath = `${orgId}/offer-${offerId}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw uploadError;

    // Store only the storage path; signed URLs are minted on demand
    await supabase.from("offers").update({ pdf_url: storagePath }).eq("id", offerId);

    return new Response(JSON.stringify({ success: true, pdfPath: storagePath }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
