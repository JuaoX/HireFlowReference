import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BasicDashboard } from "@/components/dashboard/BasicDashboard";
import { JobAdminDashboard } from "@/components/dashboard/JobAdminDashboard";
import { SiteAdminDashboard } from "@/components/dashboard/SiteAdminDashboard";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesData && rolesData.length > 0) {
        // Prioritize site_admin > job_admin > basic
        if (rolesData.some(r => r.role === 'site_admin')) {
          setUserRole('site_admin');
        } else if (rolesData.some(r => r.role === 'job_admin')) {
          setUserRole('job_admin');
        } else {
          setUserRole('basic');
        }
      } else {
        setUserRole('basic');
      }
      
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Render different dashboard based on role
  if (userRole === 'site_admin') {
    return <SiteAdminDashboard />;
  }

  if (userRole === 'job_admin') {
    return <JobAdminDashboard />;
  }

  return <BasicDashboard />;
};

export default Dashboard;
