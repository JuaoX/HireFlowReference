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
    
    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify their identity
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Unable to authenticate user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify requesting user is a site_admin
    const { data: requestingUserRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single();

    if (!requestingUserRole || requestingUserRole.role !== 'site_admin') {
      return new Response(
        JSON.stringify({ success: false, error: "Only site admins can transfer users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get requesting user's org_id
    const { data: requestingProfile } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', requestingUser.id)
      .single();

    if (!requestingProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "Unable to find your organization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetOrgId = requestingProfile.org_id;

    // Parse request body
    const { email, role, department, jobIds } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find existing user by email
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, org_id, full_name, email')
      .eq('email', email.toLowerCase())
      .single();

    if (profileError || !existingProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "No user found with this email address" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is already in the target organization
    if (existingProfile.org_id === targetOrgId) {
      return new Response(
        JSON.stringify({ success: false, error: "This user is already in your organization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = existingProfile.id;

    console.log(`Transferring user ${userId} from org ${existingProfile.org_id} to org ${targetOrgId}`);

    // Step 1: Update profile's org_id and department
    const profileUpdate: { org_id: string; department?: string } = { org_id: targetOrgId };
    if (department) {
      profileUpdate.department = department;
    }

    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (updateProfileError) {
      console.error("Error updating profile:", updateProfileError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update user's organization" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Delete old job_acl entries (from previous org's jobs)
    const { error: deleteAclError } = await supabaseAdmin
      .from('job_acl')
      .delete()
      .eq('user_id', userId);

    if (deleteAclError) {
      console.error("Error deleting old job_acl:", deleteAclError);
      // Continue anyway - not critical
    }

    // Step 3: Update user role if specified
    if (role) {
      // Delete existing role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (roleError) {
        console.error("Error updating role:", roleError);
        // Continue anyway - role update is not critical
      }
    }

    // Step 4: Create new job_acl entries for selected jobs
    if (jobIds && jobIds.length > 0) {
      const aclEntries = jobIds.map((jobId: string) => ({
        user_id: userId,
        job_id: jobId,
        can_view: true,
        can_move_pipeline: role === 'job_admin' || role === 'site_admin',
        can_message: role === 'job_admin' || role === 'site_admin',
        can_view_offer: role === 'site_admin',
      }));

      const { error: aclError } = await supabaseAdmin
        .from('job_acl')
        .insert(aclEntries);

      if (aclError) {
        console.error("Error creating job_acl:", aclError);
        // Continue anyway - job access can be set up later
      }
    }

    console.log(`Successfully transferred user ${userId} to org ${targetOrgId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User transferred successfully",
        user: {
          id: userId,
          email: existingProfile.email,
          full_name: existingProfile.full_name,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
