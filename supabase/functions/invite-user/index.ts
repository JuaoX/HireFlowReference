import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, fullName, password, department, role, jobIds } = await req.json();

    if (!email || !fullName) {
      throw new Error('Email and full name are required');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Verify the requesting user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    // Verify the requesting user has site_admin role
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id);

    if (roleError) throw roleError;

    const isSiteAdmin = roles?.some(r => r.role === 'site_admin');
    if (!isSiteAdmin) {
      throw new Error('Only site admins can invite users');
    }

    // Get the requesting user's org
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', requestingUser.id)
      .single();

    if (profileError) throw profileError;

    // Create the new user using admin API with provided password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      // Check if it's a duplicate email error
      if (createError.message?.includes('already') || createError.message?.includes('registered')) {
        throw new Error('A user with this email address already exists. Please use a different email.');
      }
      throw createError;
    }

    if (!newUser.user) {
      throw new Error('Failed to create user');
    }

    // Update the profile with the correct org_id and department
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        org_id: profile.org_id,
        department: department || null,
      })
      .eq('id', newUser.user.id);

    if (updateProfileError) throw updateProfileError;

    // Update role if not basic
    if (role && role !== 'basic') {
      // Delete existing role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', newUser.user.id);

      // Insert new role
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role });

      if (roleInsertError) throw roleInsertError;
    }

    // Assign to jobs if any specified
    if (jobIds && Array.isArray(jobIds) && jobIds.length > 0) {
      const aclEntries = jobIds.map((jobId: string) => ({
        user_id: newUser.user.id,
        job_id: jobId,
        can_view: true,
        can_move_pipeline: role === 'job_admin' || role === 'site_admin',
        can_message: role === 'job_admin' || role === 'site_admin',
        can_view_offer: role === 'site_admin',
      }));

      const { error: aclError } = await supabaseAdmin
        .from('job_acl')
        .insert(aclEntries);

      if (aclError) throw aclError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error inviting user:', error);
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
