import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  offerId: z.string().uuid('Invalid offer ID'),
  expiresIn: z.number().int().min(30).max(3600).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { offerId, expiresIn } = requestSchema.parse(await req.json());

    // RLS-checked fetch: only succeeds if user can read this offer
    const { data: offer, error } = await userClient
      .from("offers")
      .select("id, pdf_url")
      .eq("id", offerId)
      .maybeSingle();
    if (error || !offer?.pdf_url) {
      return new Response(JSON.stringify({ error: 'Not found or no PDF' }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: signed, error: signErr } = await admin.storage
      .from("documents")
      .createSignedUrl(offer.pdf_url, expiresIn ?? 300);
    if (signErr || !signed?.signedUrl) {
      return new Response(JSON.stringify({ error: 'Failed to sign URL' }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ url: signed.signedUrl }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
