import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Edit, Eye, Share2, Trash2, CheckCircle2, XCircle, Users, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PipelineBoard from '@/components/pipeline/PipelineBoard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { AddCandidateDialog } from '@/components/pipeline/AddCandidateDialog';
import { ViewJobDialog } from '@/components/jobs/ViewJobDialog';
import { EditJobDialog } from '@/components/jobs/EditJobDialog';
import { ShareJobDialog } from '@/components/jobs/ShareJobDialog';
import { JobTeamManager } from '@/components/jobs/JobTeamManager';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string;
  status: string;
  openings: number;
  description_md: string | null;
  requirements_md: string | null;
  salary_range: string | null;
  about_us: string | null;
  role_overview: string | null;
  what_you_will_do: string | null;
  nice_to_have: string | null;
  benefits: string | null;
  created_at: string;
}

interface JobStage {
  id: string;
  name: string;
  order_idx: number;
}

interface HiredCandidate {
  id: string;
  full_name: string;
  email: string | null;
  hired_at: string;
  application_id: string;
}

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, loading: permissionsLoading } = useUserPermissions();
  const [job, setJob] = useState<Job | null>(null);
  const [stages, setStages] = useState<JobStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [hiredCandidates, setHiredCandidates] = useState<HiredCandidate[]>([]);
  const [hiredCount, setHiredCount] = useState(0);

  // Only site_admin and job_admin can add candidates
  const canAddCandidate = role === 'site_admin' || role === 'job_admin';
  useEffect(() => {
    fetchJob();
    fetchHiredCandidates();
  }, [id]);

  const fetchJob = async () => {
    try {
      // Get user's org_id to verify access
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/jobs');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        navigate('/jobs');
        return;
      }

      const [jobResponse, stagesResponse] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', id).single(),
        supabase.from('job_stages').select('id, name, order_idx').eq('job_id', id).order('order_idx'),
      ]);

      if (jobResponse.error) throw jobResponse.error;
      if (stagesResponse.error) throw stagesResponse.error;

      // Verify job belongs to user's organization
      if (jobResponse.data.org_id !== profile.org_id) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this job.',
          variant: 'destructive',
        });
        navigate('/jobs');
        return;
      }

      setJob(jobResponse.data);
      setStages(stagesResponse.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchHiredCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          updated_at,
          candidate:candidates(id, full_name, email)
        `)
        .eq('job_id', id)
        .eq('state', 'hired');

      if (error) throw error;

      const hired = (data || []).map(app => ({
        id: app.candidate?.id || '',
        full_name: app.candidate?.full_name || 'Unknown',
        email: app.candidate?.email || null,
        hired_at: app.updated_at,
        application_id: app.id,
      }));

      setHiredCandidates(hired);
      setHiredCount(hired.length);
    } catch (error: any) {
      console.error('Error fetching hired candidates:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const { error, count } = await supabase
        .from('jobs')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) throw error;
      
      if (count === 0) {
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to delete this job.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });

      navigate('/jobs');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleClose = async () => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Job Cancelled',
        description: 'Job has been cancelled and is no longer accepting applications.',
      });

      fetchJob();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsFilled = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({ status: 'filled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data || data.status !== 'filled') {
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to update this job status.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Job Filled!',
        description: `Successfully filled ${hiredCount} position(s). Job is now marked as complete.`,
      });

      fetchJob();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
    open: { label: 'Open', className: 'bg-green-100 text-green-700 border-green-200', dotColor: 'bg-green-500' },
    paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', dotColor: 'bg-yellow-500' },
    filled: { label: 'Filled', className: 'bg-blue-100 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
    closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700 border-gray-200', dotColor: 'bg-gray-500' },
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200', dotColor: 'bg-gray-400' },
    pending_approval: { label: 'Pending Approval', className: 'bg-orange-100 text-orange-700 border-orange-200', dotColor: 'bg-orange-500' },
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({ status: newStatus as 'open' | 'paused' | 'filled' | 'closed' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to update job status.',
          variant: 'destructive',
        });
        return;
      }

      const statusLabels: Record<string, string> = {
        open: 'Open',
        paused: 'Paused',
        filled: 'Filled',
        closed: 'Closed',
      };

      toast({
        title: 'Status Updated',
        description: `Job status changed to ${statusLabels[newStatus] || newStatus}.`,
      });

      fetchJob();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading job details...</div>;
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-4">Job not found</h2>
        <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/jobs" className="hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Jobs
          </Link>
          <span>{'>'}</span>
          <span className="text-foreground">Details</span>
        </div>
        <div className="flex items-center gap-3">
          {canAddCandidate && job.status !== 'filled' && job.status !== 'closed' && (
            <Button
              variant="outline"
              className="gap-2 font-medium text-destructive hover:text-destructive"
              onClick={() => setCloseDialogOpen(true)}
            >
              <XCircle className="h-4 w-4" />
              Cancel Job
            </Button>
          )}
          {canAddCandidate && (
            <Button
              variant="outline"
              className="gap-2 font-medium"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Remove Listing
            </Button>
          )}
          {canAddCandidate && job.status !== 'filled' && job.status !== 'closed' && (
            <AddCandidateDialog 
              jobId={id!} 
              stages={stages}
              onSuccess={() => {
                fetchJob();
                fetchHiredCandidates();
              }}
            />
          )}
        </div>
      </div>

      {/* Header with Job Title, Status and Actions */}
      <div className="bg-card rounded-2xl p-8 flex items-start justify-between border border-border shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl">{job.title}</h1>
            {canAddCandidate ? (
              <Select value={job.status} onValueChange={handleStatusChange}>
                <SelectTrigger className={`w-[130px] h-8 text-sm font-medium border ${statusConfig[job.status]?.className || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[job.status]?.dotColor || 'bg-gray-400'}`} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="open">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Open
                    </div>
                  </SelectItem>
                  <SelectItem value="paused">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Paused
                    </div>
                  </SelectItem>
                  <SelectItem value="filled">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Filled
                    </div>
                  </SelectItem>
                  <SelectItem value="closed">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      Closed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              getStatusBadge(job.status)
            )}
          </div>
          <p className="text-muted-foreground text-base">{job.location}</p>
          
          {/* Hiring Progress */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Openings:</span>
              <span className="font-semibold">{job.openings}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Hired:</span>
              <span className={`font-semibold ${hiredCount >= job.openings ? 'text-green-600' : ''}`}>
                {hiredCount} / {job.openings}
              </span>
            </div>
            {hiredCount >= job.openings && job.status === 'open' && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                All positions filled!
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mark as Filled Button - Show when hired count >= openings and job is open */}
          {canAddCandidate && hiredCount >= job.openings && job.status === 'open' && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white font-medium gap-2 h-12 px-6 rounded-xl"
              onClick={() => setFillDialogOpen(true)}
            >
              <CheckCircle2 className="h-5 w-5" />
              Mark as Filled
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl border-2 border-border hover:bg-muted"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl border-2 border-border hover:bg-muted"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="h-5 w-5" />
          </Button>
          <Button
            className="bg-[#A8E6CF] hover:bg-[#8FD9B6] text-gray-900 font-medium gap-2 h-12 px-6 rounded-xl"
            onClick={() => setViewDialogOpen(true)}
          >
            <Eye className="h-5 w-5" />
            View
          </Button>
        </div>
      </div>

      {/* Hired Candidates Section - Show when there are hired candidates */}
      {hiredCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Hired Candidates ({hiredCandidates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {hiredCandidates.map((candidate) => (
                <Link
                  key={candidate.id}
                  to={`/candidates/${candidate.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
                >
                  <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{candidate.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Hired on {format(new Date(candidate.hired_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Board */}
      <div className="bg-background rounded-lg">
        <PipelineBoard jobId={id!} />
      </div>

      {/* Job Team Management */}
      <JobTeamManager jobId={id!} />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Job"
        description="Are you sure you want to delete this job? This will also delete all associated applications, interviews, and offers. This action cannot be undone."
        confirmText="Delete Job"
        variant="destructive"
      />

      <ConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onConfirm={handleClose}
        title="Cancel Job"
        description="Are you sure you want to cancel this job? It will no longer accept new applications and won't be visible on the careers site. This is different from marking a job as filled."
        confirmText="Cancel Job"
        variant="destructive"
      />

      <ConfirmDialog
        open={fillDialogOpen}
        onOpenChange={setFillDialogOpen}
        onConfirm={handleMarkAsFilled}
        title="Mark Job as Filled"
        description={`This will mark the job as successfully filled with ${hiredCount} candidate(s). The job will be closed to new applications. You can still view all hiring data.`}
        confirmText="Mark as Filled"
      />

      {job && (
        <>
          <ViewJobDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            job={job}
            onSuccess={fetchJob}
            hiredCount={hiredCount}
          />
          <EditJobDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            job={job}
            onSuccess={fetchJob}
          />
          <ShareJobDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            job={job}
          />
        </>
      )}
    </div>
  );
};

export default JobDetail;
