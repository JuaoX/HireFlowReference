import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Users, Briefcase, LayoutGrid, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateJobDialog } from '@/components/jobs/CreateJobDialog';
import { useUserPermissions } from '@/hooks/useUserPermissions';
interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string;
  status: string;
  openings: number;
  created_at: string;
  candidatesCount?: number;
  shortlistedCount?: number;
  hiredCount?: number;
}
type StatusFilter = 'all' | 'open' | 'paused' | 'filled' | 'closed';

const JobsList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { role, assignedJobIds, loading: permissionsLoading } = useUserPermissions();

  const filteredJobs = statusFilter === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === statusFilter);
  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (!permissionsLoading) {
      fetchJobs();
    }
  }, [permissionsLoading, role, assignedJobIds]);
  const fetchUserRole = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
      if (error) throw error;
      setUserRole(data?.role || null);
    } catch (error: any) {
      console.error('Error fetching user role:', error.message);
    }
  };
  const fetchJobs = async () => {
    try {
      // Get user's org_id first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Filter by organization for ALL users
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('org_id', profile.org_id);
      
      // Additionally filter by assigned jobs for basic users
      if (role === 'basic') {
        if (assignedJobIds.length === 0) {
          setJobs([]);
          setLoading(false);
          return;
        }
        query = query.in('id', assignedJobIds);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch application counts for each job (only active, exclude hired/withdrawn/rejected)
      const jobsWithCounts = await Promise.all((data || []).map(async job => {
        const {
          count: totalCount
        } = await supabase.from('applications').select('*', {
          count: 'exact',
          head: true
        }).eq('job_id', job.id).eq('state', 'active');
        const {
          count: shortlistedCount
        } = await supabase.from('applications').select('*', {
          count: 'exact',
          head: true
        }).eq('job_id', job.id).not('current_stage_id', 'is', null).in('state', ['active', 'hired']);
        const {
          count: hiredCount
        } = await supabase.from('applications').select('*', {
          count: 'exact',
          head: true
        }).eq('job_id', job.id).eq('state', 'hired');
        return {
          ...job,
          candidatesCount: totalCount || 0,
          shortlistedCount: shortlistedCount || 0,
          hiredCount: hiredCount || 0
        };
      }));
      setJobs(jobsWithCounts);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const formatStatusLabel = (status: string) => {
    if (status === 'closed') return 'Cancelled';
    if (status === 'filled') return 'Filled';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      pending_approval: 'bg-orange-100 text-orange-700 border-orange-200',
      open: 'bg-green-100 text-green-700 border-green-200',
      paused: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      filled: 'bg-blue-100 text-blue-700 border-blue-200',
      closed: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Jobs</h1>
        </div>
        <div className="flex items-center gap-[17px]">
          <div className="inline-flex items-center rounded-[6px] bg-muted p-1 shadow-sm px-[2px] py-[2.5px] gap-[6px]">
            <button onClick={() => setViewMode('list')} className={`inline-flex items-center justify-center rounded transition-all w-[30px] h-[30px] ${viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} aria-label="List view">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 13.5C1.5 12.6716 2.17157 12 3 12C3.82843 12 4.5 12.6716 4.5 13.5C4.5 14.3284 3.82843 15 3 15C2.17157 15 1.5 14.3284 1.5 13.5ZM15.75 12.75L15.8269 12.7537C16.205 12.7922 16.5 13.1117 16.5 13.5C16.5 13.8883 16.205 14.2078 15.8269 14.2463L15.75 14.25H6.75C6.33579 14.25 6 13.9142 6 13.5C6 13.0858 6.33579 12.75 6.75 12.75H15.75ZM1.5 9C1.5 8.17157 2.17157 7.5 3 7.5C3.82843 7.5 4.5 8.17157 4.5 9C4.5 9.82843 3.82843 10.5 3 10.5C2.17157 10.5 1.5 9.82843 1.5 9ZM15.75 8.25L15.8269 8.25366C16.205 8.29216 16.5 8.61174 16.5 9C16.5 9.38826 16.205 9.70784 15.8269 9.74634L15.75 9.75H6.75C6.33579 9.75 6 9.41421 6 9C6 8.58579 6.33579 8.25 6.75 8.25H15.75ZM1.5 4.5C1.5 3.67157 2.17157 3 3 3C3.82843 3 4.5 3.67157 4.5 4.5C4.5 5.32843 3.82843 6 3 6C2.17157 6 1.5 5.32843 1.5 4.5ZM15.75 3.75L15.8269 3.75366C16.205 3.79216 16.5 4.11174 16.5 4.5C16.5 4.88826 16.205 5.20784 15.8269 5.24634L15.75 5.25H6.75C6.33579 5.25 6 4.91421 6 4.5C6 4.08579 6.33579 3.75 6.75 3.75H15.75Z" fill="currentColor" />
              </svg>
            </button>
            <button onClick={() => setViewMode('grid')} className={`inline-flex items-center justify-center rounded transition-all w-[30px] h-[30px] ${viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} aria-label="Grid view">
              <LayoutGrid className="w-[18px] h-[18px]" />
            </button>
          </div>
          {userRole && userRole !== 'basic' && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          )}
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2">
        {(['all', 'open', 'paused', 'filled', 'closed'] as StatusFilter[]).map((status) => {
          const count = status === 'all' ? jobs.length : jobs.filter(j => j.status === status).length;
          const labels: Record<StatusFilter, string> = {
            all: 'All',
            open: 'Open',
            paused: 'Paused',
            filled: 'Filled',
            closed: 'Closed'
          };
          return (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="gap-2"
            >
              {labels[status]}
              <Badge variant="secondary" className={`ml-1 ${statusFilter === status ? 'bg-card/20 text-white' : 'bg-muted'}`}>
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {loading || permissionsLoading ? <div className="text-center py-12">Loading jobs...</div> : filteredJobs.length === 0 ? <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg mb-2">
              {jobs.length === 0 ? 'No jobs found' : `No ${statusFilter} jobs`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {jobs.length === 0 
                ? (role === 'basic' && assignedJobIds.length === 0
                  ? "You haven't been assigned to any jobs yet. Contact your administrator to get access."
                  : "Get started by creating your first job")
                : `There are no jobs with "${statusFilter}" status.`}
            </p>
            {jobs.length === 0 && userRole && userRole !== 'basic' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            )}
          </CardContent>
        </Card> : viewMode === 'grid' ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map(job => <Link key={job.id} to={`/jobs/${job.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <Badge className={`capitalize ${getStatusColor(job.status)}`}>
                      {formatStatusLabel(job.status)}
                    </Badge>
                  </div>
                  <CardDescription className="space-y-1 min-h-[40px]">
                    {job.department && <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{job.department}</span>
                      </div>}
                    {job.location && <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{job.location}</span>
                      </div>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className={job.hiredCount && job.hiredCount >= job.openings ? 'text-green-600 font-medium' : ''}>
                        {job.hiredCount || 0}/{job.openings} filled
                      </span>
                    </div>
                    <span className="text-muted-foreground capitalize">
                      {job.employment_type.replace('_', ' ')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>)}
        </div> : <div className="bg-card rounded-lg p-4 flex-1">
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="w-[200px]">Title</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">Positions</TableHead>
                <TableHead className="w-[140px]">Date Opened</TableHead>
                <TableHead className="w-[100px] text-center">Candidates</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="space-y-1">
              {filteredJobs.map(job => <TableRow key={job.id} className="cursor-pointer hover:bg-accent/50 border-0 mb-1" style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: '8px',
            display: 'table-row'
          }} onClick={() => navigate(`/jobs/${job.id}`)}>
                  <TableCell className="font-medium rounded-l-lg">{job.title}</TableCell>
                  <TableCell>
                    <Badge className={`capitalize text-xs ${getStatusColor(job.status)}`}>
                      {formatStatusLabel(job.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={job.hiredCount && job.hiredCount >= job.openings ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      {job.hiredCount || 0}/{job.openings} filled
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(job.created_at), 'MM/dd/yyyy')}
                  </TableCell>
                  <TableCell className="text-primary font-bold text-center">{job.candidatesCount || 0}</TableCell>
                  <TableCell className="rounded-r-lg">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>}

      <CreateJobDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          fetchJobs();
        }}
      />
    </div>;
};
export default JobsList;