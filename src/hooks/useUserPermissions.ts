import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface JobPermissions {
  [jobId: string]: {
    can_view: boolean;
    can_move_pipeline: boolean;
    can_message: boolean;
    can_view_offer: boolean;
  };
}

export interface UserPermissions {
  role: 'basic' | 'job_admin' | 'site_admin' | null;
  jobPermissions: JobPermissions;
  assignedJobIds: string[];
  loading: boolean;
}

export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions>({
    role: null,
    jobPermissions: {},
    assignedJobIds: [],
    loading: true,
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPermissions({ role: null, jobPermissions: {}, assignedJobIds: [], loading: false });
        return;
      }

      // Fetch all user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      // Determine highest priority role (site_admin > job_admin > basic)
      const roles = (rolesData || []).map(r => r.role);
      let role: 'basic' | 'job_admin' | 'site_admin' | null = null;
      if (roles.includes('site_admin')) {
        role = 'site_admin';
      } else if (roles.includes('job_admin')) {
        role = 'job_admin';
      } else if (roles.includes('basic')) {
        role = 'basic';
      }

      // Fetch job ACL permissions
      const { data: aclData } = await supabase
        .from('job_acl')
        .select('job_id, can_view, can_move_pipeline, can_message, can_view_offer')
        .eq('user_id', user.id);

      const jobPermissions: JobPermissions = {};
      const assignedJobIds: string[] = [];

      (aclData || []).forEach((acl) => {
        jobPermissions[acl.job_id] = {
          can_view: acl.can_view || false,
          can_move_pipeline: acl.can_move_pipeline || false,
          can_message: acl.can_message || false,
          can_view_offer: acl.can_view_offer || false,
        };
        if (acl.can_view) {
          assignedJobIds.push(acl.job_id);
        }
      });

      setPermissions({
        role,
        jobPermissions,
        assignedJobIds,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions({ role: null, jobPermissions: {}, assignedJobIds: [], loading: false });
    }
  };

  const canViewOffers = () => {
    if (permissions.role === 'site_admin') return true;
    // Check job_acl for ALL roles (including basic) - if any job has can_view_offer, user can access offers
    return Object.values(permissions.jobPermissions).some(p => p.can_view_offer);
  };

  const canMovePipeline = (jobId: string) => {
    if (permissions.role === 'site_admin') return true;
    return permissions.jobPermissions[jobId]?.can_move_pipeline || false;
  };

  const canMessage = (jobId: string) => {
    if (permissions.role === 'site_admin') return true;
    return permissions.jobPermissions[jobId]?.can_message || false;
  };

  const canViewOffer = (jobId: string) => {
    if (permissions.role === 'site_admin') return true;
    return permissions.jobPermissions[jobId]?.can_view_offer || false;
  };

  return {
    ...permissions,
    canViewOffers,
    canMovePipeline,
    canMessage,
    canViewOffer,
    refresh: fetchPermissions,
  };
};
