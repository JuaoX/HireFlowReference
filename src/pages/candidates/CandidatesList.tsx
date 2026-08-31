import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, ChevronRight, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddCandidateDialog } from '@/components/pipeline/AddCandidateDialog';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { CandidatesListSkeleton } from '@/components/candidates/CandidatesListSkeleton';
import { ManagerAssignmentDropdown } from '@/components/candidates/ManagerAssignmentDropdown';
import { getStageColorClasses } from '@/lib/stage-colors';

interface ApplicationWithDetails {
  id: string;
  applied_at: string;
  current_stage_id: string | null;
  owner_user_id: string | null;
  candidate: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  job: {
    id: string;
    title: string;
  };
  owner: {
    full_name: string;
  } | null;
  current_stage: {
    name: string;
    type: string;
  } | null;
  state: string;
}

const CandidatesList = () => {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [stages, setStages] = useState<Array<{ id: string; name: string; order_idx: number }>>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { role, assignedJobIds, loading: permissionsLoading } = useUserPermissions();

  useEffect(() => {
    fetchUserRole();
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!permissionsLoading) {
      fetchApplications();
    }
  }, [permissionsLoading, role, assignedJobIds, statusFilter]);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesData && rolesData.length > 0) {
        setUserRole(rolesData[0].role);
      }
    } catch (error: any) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Fetch only jobs from user's organization
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('org_id', profile.org_id)
        .eq('status', 'open')
        .order('title');

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Non-site_admin users with no job assignments see nothing
      if (role !== 'site_admin' && assignedJobIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('applications')
        .select(`
          id,
          applied_at,
          current_stage_id,
          job_id,
          owner_user_id,
          state,
          candidate:candidates(id, full_name, avatar_url),
          job:jobs(id, title),
          current_stage:job_stages(name, type),
          owner:profiles!applications_owner_user_id_fkey(full_name)
        `);

      // Basic users (Collaborators) - only see candidates assigned to them
      if (role === 'basic') {
        query = query.eq('owner_user_id', user.id);
        // Also filter by their accessible jobs
        if (assignedJobIds.length > 0) {
          query = query.in('job_id', assignedJobIds);
        }
      } 
      // Job admins - see all candidates for their assigned jobs
      else if (role === 'job_admin' && assignedJobIds.length > 0) {
        query = query.in('job_id', assignedJobIds);
      }
      // Site admins - no filter (see all)

      // Apply status filter
      if (statusFilter === 'active') {
        query = query.eq('state', 'active');
      } else if (statusFilter === 'rejected') {
        query = query.eq('state', 'rejected');
      } else if (statusFilter === 'withdrawn') {
        query = query.eq('state', 'withdrawn');
      }
      // Note: 'hired' filter is handled post-query since we need to check stage type

      const { data, error } = await query.order('applied_at', { ascending: false });

      if (error) throw error;

      // Filter out null candidates/jobs and apply hired filter
      let filteredData = (data || [])
        .filter((app: any) => app.candidate && app.job)
        .map((app: any) => ({
          ...app,
          owner: app.owner || null,
        }));

      // Handle hired filter - check both state='hired' and stage type='hired'
      if (statusFilter === 'hired') {
        filteredData = filteredData.filter((app: any) => 
          app.state === 'hired' || app.current_stage?.type === 'hired'
        );
      }
      
      // Exclude hired candidates from "Active" filter
      if (statusFilter === 'active') {
        filteredData = filteredData.filter((app: any) => 
          app.current_stage?.type !== 'hired'
        );
      }

      setApplications(filteredData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl">Candidates</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Candidates</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {userRole && userRole !== 'basic' && (
          <AddCandidateDialog 
            jobs={jobs}
            onSuccess={fetchApplications}
          />
        )}
      </div>

      {loading || permissionsLoading ? (
        <CandidatesListSkeleton />
      ) : applications.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg mb-2">No candidates found</h3>
          <p className="text-muted-foreground">
            {role !== 'site_admin' && assignedJobIds.length === 0
              ? "You haven't been assigned to any jobs yet. Contact your administrator to get access."
              : statusFilter !== 'all' 
                ? `No ${statusFilter} candidates found`
                : "Get started by adding your first candidate"}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg p-4 flex-1">
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="w-[220px]">Candidate</TableHead>
                <TableHead className="w-[240px]">Position Applied for</TableHead>
                <TableHead className="w-[160px]">Date Applied</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[180px]">Manager</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="space-y-1">
              {applications.map((application) => (
                <TableRow
                  key={application.id}
                  className="cursor-pointer hover:bg-accent/50 border-0 mb-1"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderRadius: '8px',
                    display: 'table-row'
                  }}
                  onClick={() => window.location.href = `/candidates/${application.candidate?.id}`}
                >
                  <TableCell className="rounded-l-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={application.candidate?.avatar_url || ''} />
                        <AvatarFallback>
                          {application.candidate?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'NA'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{application.candidate?.full_name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-primary font-medium">
                    {application.job?.title || 'Unknown Position'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(application.applied_at).toLocaleDateString('en-US', { 
                      month: '2-digit', 
                      day: '2-digit', 
                      year: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`capitalize border ${getStageColorClasses(application.current_stage?.name || 'Applied')}`}
                    >
                      {application.current_stage?.name || 'Applied'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium" onClick={(e) => e.stopPropagation()}>
                    <ManagerAssignmentDropdown
                      applicationId={application.id}
                      currentManagerId={application.owner_user_id}
                      currentManagerName={application.owner?.full_name || null}
                      onUpdate={fetchApplications}
                    />
                  </TableCell>
                  <TableCell className="rounded-r-lg">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CandidatesList;
