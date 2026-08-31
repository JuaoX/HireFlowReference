import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    email: string;
    department: string;
  } | null;
  onUpdateSuccess: () => void;
}

export const EditUserDialog = ({ open, onOpenChange, user, onUpdateSuccess }: EditUserDialogProps) => {
  const [department, setDepartment] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      setDepartment(user.department || '');
      fetchJobs();
      fetchUserJobs();
      fetchCurrentUser();
    }
  }, [open, user]);

  const fetchCurrentUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      setCurrentUserId(currentUser.id);
    }
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('status', 'open')
      .order('title');

    if (!error && data) {
      setJobs(data);
    }
  };

  const fetchUserJobs = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('job_acl')
      .select('job_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setSelectedJobs(data.map(acl => acl.job_id));
    }
  };

  const handleUpdate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update department
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ department: department || null })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Delete existing job assignments
      const { error: deleteError } = await supabase
        .from('job_acl')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert new job assignments
      if (selectedJobs.length > 0) {
        const jobAclEntries = selectedJobs.map(jobId => ({
          user_id: user.id,
          job_id: jobId,
          can_view: true,
          can_move_pipeline: true,
          can_message: true,
          can_view_offer: false,
        }));

        const { error: insertError } = await supabase
          .from('job_acl')
          .insert(jobAclEntries);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      onOpenChange(false);
      onUpdateSuccess();
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

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-team-member', {
        body: { userId: user.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Success',
        description: 'Team member removed successfully',
      });

      setShowDeleteConfirm(false);
      onOpenChange(false);
      onUpdateSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleJob = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const canDelete = user && user.id !== currentUserId && user.email !== 'demo@hireflow.app';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl">Edit Team Member</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-6 py-5">
            <div className="space-y-5">
              {/* User Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm text-foreground uppercase tracking-wide">
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <div className="text-sm font-medium">{user?.full_name}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <div className="text-sm font-medium truncate">{user?.email}</div>
                  </div>
                </div>
              </div>

              {/* Department Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm text-foreground uppercase tracking-wide">
                  Role & Access
                </h3>
                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department
                  </Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Job Assignment Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm text-foreground uppercase tracking-wide">
                    Assign to Jobs
                  </h3>
                  {selectedJobs.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {selectedJobs.length} selected
                    </span>
                  )}
                </div>
                <div className="border rounded-lg p-3 max-h-[140px] overflow-y-auto bg-muted/20">
                  {jobs.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No open jobs to assign
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {jobs.map((job) => (
                        <div key={job.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`edit-${job.id}`}
                            checked={selectedJobs.includes(job.id)}
                            onCheckedChange={() => toggleJob(job.id)}
                          />
                          <label
                            htmlFor={`edit-${job.id}`}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {job.title}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              {canDelete && (
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-sm text-destructive uppercase tracking-wide">
                    Danger Zone
                  </h3>
                  <Button
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove from Team
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading} className="flex-1">
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${user?.full_name} from your team? This action cannot be undone and will delete their account.`}
        confirmText={deleting ? 'Removing...' : 'Remove'}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
};
