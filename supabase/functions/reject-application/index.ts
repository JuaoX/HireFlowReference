import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { corsHeaders } from '../_shared/cors.ts';

type RejectApplicationPayload = {
  applicationId: string;
  reason: string;
  note?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header is required');

    const payload = (await req.json()) as RejectApplicationPayload;
    if (!payload?.applicationId) throw new Error('applicationId is required');
    if (!payload?.reason) throw new Error('reason is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl) throw new Error('Backend misconfigured: SUPABASE_URL is missing');
    if (!anonKey) throw new Error('Backend misconfigured: SUPABASE_ANON_KEY is missing');
    if (!serviceRoleKey) {
      throw new Error(
        'Backend misconfigured: SUPABASE_SERVICE_ROLE_KEY is missing (cannot update applications)'
      );
    }

    // Auth client (validates the end-user JWT)
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    // Admin DB client (bypasses RLS for server-side updates)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the requesting user
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) throw new Error('Unauthorized');
    // Load application + job org
    const { data: app, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, job_id')
      .eq('id', payload.applicationId)
      .maybeSingle();

    if (appError) throw appError;
    if (!app) throw new Error('Application not found');

    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, org_id')
      .eq('id', app.job_id)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!job) throw new Error('Job not found');

    // Ensure user is in the same org
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.org_id || profile.org_id !== job.org_id) {
      throw new Error('Forbidden');
    }

    // Permission: site_admin/job_admin OR job ACL can_move_pipeline
    const [{ data: roles, error: rolesError }, { data: acl, error: aclError }] = await Promise.all([
      supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id),
      supabaseAdmin
        .from('job_acl')
        .select('can_move_pipeline')
        .eq('user_id', user.id)
        .eq('job_id', job.id)
        .maybeSingle(),
    ]);

    if (rolesError) throw rolesError;
    if (aclError) throw aclError;

    const isAdmin = (roles ?? []).some((r) => r.role === 'site_admin' || r.role === 'job_admin');
    const canMovePipeline = acl?.can_move_pipeline === true;

    if (!isAdmin && !canMovePipeline) {
      throw new Error('Rejection is not permitted for this job');
    }

    // Find rejected stage for this job
    const { data: rejectedStage, error: stageError } = await supabaseAdmin
      .from('job_stages')
      .select('id')
      .eq('job_id', job.id)
      .eq('type', 'rejected')
      .maybeSingle();

    if (stageError) throw stageError;
    if (!rejectedStage) throw new Error('Rejected stage not found for this job');

    // Update application
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        current_stage_id: rejectedStage.id,
        state: 'rejected',
        rejection_reason: payload.reason,
        rejection_note: payload.note ?? null,
      })
      .eq('id', payload.applicationId)
      .select('id');

    if (updateError) throw updateError;
    if (!updated || updated.length === 0) {
      throw new Error('Rejection failed (no rows updated)');
    }

    // Cancel any scheduled interviews for this application
    const { error: interviewError } = await supabaseAdmin
      .from('interviews')
      .update({ status: 'cancelled', stage_id: rejectedStage.id })
      .eq('application_id', payload.applicationId)
      .eq('status', 'scheduled');

    if (interviewError) throw interviewError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
