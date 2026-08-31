import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  orgId: string;
  title: string;
  message: string;
  type: 'application' | 'interview' | 'offer' | 'message' | 'system';
  entityType?: string;
  entityId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      org_id: params.orgId,
      title: params.title,
      message: params.message,
      type: params.type,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function notifyNewApplication(
  jobId: string,
  candidateName: string,
  applicationId: string
) {
  try {
    // First get the job's org_id
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('org_id, title')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error('Error fetching job:', jobError);
      return;
    }

    // Get all users with access to this job
    const { data: jobAcl, error: aclError } = await supabase
      .from('job_acl')
      .select('user_id')
      .eq('job_id', jobId)
      .eq('can_view', true);

    if (aclError) {
      console.error('Error fetching job ACL:', aclError);
      return;
    }

    // If no team members have access, try to notify all admins in the org
    let userIds: string[] = [];
    
    if (!jobAcl || jobAcl.length === 0) {
      const { data: admins, error: adminsError } = await supabase
        .from('user_roles')
        .select('user_id, profiles!inner(org_id)')
        .in('role', ['site_admin', 'job_admin'])
        .eq('profiles.org_id', job.org_id);

      if (adminsError) {
        console.error('Error fetching admins:', adminsError);
        return;
      }

      userIds = admins?.map(a => a.user_id) || [];
    } else {
      userIds = jobAcl.map(acl => acl.user_id);
    }

    if (userIds.length === 0) {
      console.log('No users to notify for new application');
      return;
    }

    // Create notifications for all team members/admins
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      org_id: job.org_id,
      title: 'New Application',
      message: `${candidateName} applied for ${job.title}`,
      type: 'application' as const,
      entity_type: 'application',
      entity_id: applicationId,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) {
      console.error('Error inserting notifications:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error notifying new application:', error);
  }
}

export async function notifyInterviewScheduled(
  applicationId: string,
  interviewId: string,
  candidateName: string,
  interviewDate: string
) {
  try {
    // Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('job:jobs!applications_job_id_fkey(org_id)')
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    const orgId = (application.job as any).org_id;

    // Get all users with access to this job
    const { data: jobAcl, error: aclError } = await supabase
      .from('job_acl')
      .select('user_id, job_id')
      .eq('job_id', (application as any).job_id)
      .eq('can_view', true);

    if (aclError) throw aclError;

    if (!jobAcl || jobAcl.length === 0) return;

    const notifications = jobAcl.map((acl) => ({
      user_id: acl.user_id,
      org_id: orgId,
      title: 'Interview Scheduled',
      message: `Interview with ${candidateName} scheduled for ${interviewDate}`,
      type: 'interview' as const,
      entity_type: 'interview',
      entity_id: interviewId,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) throw error;
  } catch (error) {
    console.error('Error notifying interview scheduled:', error);
  }
}

export async function notifyOfferCreated(
  applicationId: string,
  offerId: string,
  candidateName: string
) {
  try {
    // Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('job:jobs!applications_job_id_fkey(org_id, id)')
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    const orgId = (application.job as any).org_id;
    const jobId = (application.job as any).id;

    // Get all users with offer viewing permission
    const { data: jobAcl, error: aclError } = await supabase
      .from('job_acl')
      .select('user_id')
      .eq('job_id', jobId)
      .eq('can_view_offer', true);

    if (aclError) throw aclError;

    if (!jobAcl || jobAcl.length === 0) return;

    const notifications = jobAcl.map((acl) => ({
      user_id: acl.user_id,
      org_id: orgId,
      title: 'New Offer Created',
      message: `An offer has been created for ${candidateName}`,
      type: 'offer' as const,
      entity_type: 'offer',
      entity_id: offerId,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) throw error;
  } catch (error) {
    console.error('Error notifying offer created:', error);
  }
}

// Settings-related notifications
export async function notifyRoleChanged(
  targetUserId: string,
  targetUserName: string,
  newRole: string,
  changedByUserId: string
) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', targetUserId)
      .single();

    if (!profile) return;

    const roleLabels: Record<string, string> = {
      basic: 'Can View',
      job_admin: 'Can Edit',
      site_admin: 'Admin',
    };

    // Notify the target user about their role change
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      org_id: profile.org_id,
      title: 'Role Updated',
      message: `Your role has been changed to "${roleLabels[newRole] || newRole}"`,
      type: 'system',
      entity_type: 'user',
      entity_id: targetUserId,
    });

    // Also notify all site admins (except the one who made the change)
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'site_admin');

    if (admins) {
      const adminNotifications = admins
        .filter(a => a.user_id !== changedByUserId && a.user_id !== targetUserId)
        .map(admin => ({
          user_id: admin.user_id,
          org_id: profile.org_id,
          title: 'User Role Changed',
          message: `${targetUserName}'s role was changed to "${roleLabels[newRole] || newRole}"`,
          type: 'system' as const,
          entity_type: 'user',
          entity_id: targetUserId,
        }));

      if (adminNotifications.length > 0) {
        await supabase.from('notifications').insert(adminNotifications);
      }
    }
  } catch (error) {
    console.error('Error notifying role change:', error);
  }
}

export async function notifyUserCreated(
  newUserId: string,
  newUserName: string,
  orgId: string,
  createdByUserId: string
) {
  try {
    // Notify all site admins about the new user
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'site_admin');

    if (admins) {
      const notifications = admins
        .filter(a => a.user_id !== createdByUserId)
        .map(admin => ({
          user_id: admin.user_id,
          org_id: orgId,
          title: 'New Team Member',
          message: `${newUserName} has joined the team`,
          type: 'system' as const,
          entity_type: 'user',
          entity_id: newUserId,
        }));

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
    }
  } catch (error) {
    console.error('Error notifying user created:', error);
  }
}

export async function notifyUserDeleted(
  deletedUserName: string,
  orgId: string,
  deletedByUserId: string
) {
  try {
    // Notify all site admins about the deleted user
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'site_admin');

    if (admins) {
      const notifications = admins
        .filter(a => a.user_id !== deletedByUserId)
        .map(admin => ({
          user_id: admin.user_id,
          org_id: orgId,
          title: 'Team Member Removed',
          message: `${deletedUserName} has been removed from the team`,
          type: 'system' as const,
        }));

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
    }
  } catch (error) {
    console.error('Error notifying user deleted:', error);
  }
}
