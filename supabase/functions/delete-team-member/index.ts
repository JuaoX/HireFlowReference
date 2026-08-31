import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller is authenticated and has site_admin role
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: "Unable to authenticate caller" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is site_admin
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single();

    if (!callerRole || callerRole.role !== 'site_admin') {
      return new Response(
        JSON.stringify({ error: "Only site admins can remove team members" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent deleting yourself
    if (userId === caller.id) {
      return new Response(
        JSON.stringify({ error: "You cannot remove yourself from the team" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the target user's profile to verify same org
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', caller.id)
      .single();

    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('org_id, email')
      .eq('id', userId)
      .single();

    if (!callerProfile || !targetProfile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (callerProfile.org_id !== targetProfile.org_id) {
      return new Response(
        JSON.stringify({ error: "Cannot remove users from other organizations" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent demo account deletion
    if (targetProfile.email === "demo@hireflow.app") {
      return new Response(
        JSON.stringify({ error: "Demo account cannot be removed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete user from auth.users (cascades to profiles due to foreign key)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to remove team member: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Team member removed successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
