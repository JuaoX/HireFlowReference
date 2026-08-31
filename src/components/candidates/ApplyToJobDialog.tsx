import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Briefcase, Loader2 } from 'lucide-react';
import { notifyNewApplication } from '@/lib/notifications';

interface Job {
  id: string;
  title: string;
  location: string | null;
  status: string;
}

interface ApplyToJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  existingJobIds: string[];
  onSuccess?: () => void;
}

export const ApplyToJobDialog = ({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  existingJobIds,
  onSuccess,
}: ApplyToJobDialogProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (open) {
      fetchAvailableJobs();
    }
  }, [open, existingJobIds]);

  const fetchAvailableJobs = async () => {
    setFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Check if user is a site_admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const isSiteAdmin = roleData?.role === 'site_admin';

      let availableJobs: Job[] = [];

      if (isSiteAdmin) {
        // Site admins can see all open jobs
        const { data, error } = await supabase
          .from('jobs')
          .select('id, title, location, status')
          .eq('org_id', profile.org_id)
          .eq('status', 'open')
          .order('title');

        if (error) throw error;
        availableJobs = data || [];
      } else {
        // Other users can only see jobs they have access to via job_acl
        const { data: aclData, error: aclError } = await supabase
          .from('job_acl')
          .select('job_id')
          .eq('user_id', user.id)
          .eq('can_view', true);

        if (aclError) throw aclError;

        const accessibleJobIds = (aclData || []).map(a => a.job_id);

        if (accessibleJobIds.length > 0) {
          const { data, error } = await supabase
            .from('jobs')
            .select('id, title, location, status')
            .eq('org_id', profile.org_id)
            .eq('status', 'open')
            .in('id', accessibleJobIds)
            .order('title');

          if (error) throw error;
          availableJobs = data || [];
        }
      }

      // Filter out jobs the candidate has already applied to
      availableJobs = availableJobs.filter(job => !existingJobIds.includes(job.id));
      setJobs(availableJobs);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available jobs',
        variant: 'destructive',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleApply = async () => {
    if (!selectedJobId) {
      toast({
        title: 'Error',
        description: 'Please select a job',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the first stage for the job
      const { data: stages, error: stagesError } = await supabase
        .from('job_stages')
        .select('id, name, order_idx')
        .eq('job_id', selectedJobId)
        .order('order_idx');

      if (stagesError) throw stagesError;

      const firstStage = stages?.find(s => s.name.toLowerCase().includes('applied')) || stages?.[0];

      if (!firstStage) {
        throw new Error('No pipeline stage found for this job');
      }

      // Create the application
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .insert({
          candidate_id: candidateId,
          job_id: selectedJobId,
          current_stage_id: firstStage.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (applicationError) throw applicationError;

      // Send notification
      if (applicationData) {
        notifyNewApplication(selectedJobId, candidateName, applicationData.id).catch(console.error);
      }

      const selectedJob = jobs.find(j => j.id === selectedJobId);
      toast({
        title: 'Application Created',
        description: `${candidateName} has been applied to ${selectedJob?.title}`,
      });

      setSelectedJobId('');
      onOpenChange(false);
      onSuccess?.();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Apply to Job
          </DialogTitle>
          <DialogDescription>
            Select a job to apply {candidateName} to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {fetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No available jobs to apply to.</p>
              <p className="text-sm mt-1">This candidate may already be applied to all open positions.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="job">Select Job Position</Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a job..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        <div className="flex flex-col items-start">
                          <span>{job.title}</span>
                          {job.location && (
                            <span className="text-xs text-muted-foreground">{job.location}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={loading || !selectedJobId}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply to Job'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
