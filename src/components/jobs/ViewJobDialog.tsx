import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Users, UserCheck } from 'lucide-react';
import { EditJobDialog } from './EditJobDialog';
import { supabase } from '@/integrations/supabase/client';
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
interface ViewJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onSuccess?: () => void;
  hiredCount?: number;
}
export function ViewJobDialog({
  open,
  onOpenChange,
  job,
  onSuccess,
  hiredCount = 0
}: ViewJobDialogProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCanEdit(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      // Only job_admin and site_admin can edit
      setCanEdit(roleData?.role === 'job_admin' || roleData?.role === 'site_admin');
    };

    if (open) {
      checkUserRole();
    }
  }, [open]);
  const handleEditClick = () => {
    setEditDialogOpen(true);
  };
  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    onSuccess?.();
  };
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader className="flex flex-row items-center justify-between pr-12">
            <DialogTitle className="text-2xl font-semibold">{job.title}</DialogTitle>
            {canEdit && (
              <Button onClick={handleEditClick} variant="outline" className="bg-foreground text-background hover:bg-foreground/90">
                Edit Listing
              </Button>
            )}
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {job.location && <Badge variant="secondary" className="bg-[#E8F5E9] text-foreground border-none px-4 py-3 rounded-xl flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5 text-[#45CE99]" />
                <span className="font-semibold">{job.location}</span>
              </Badge>}
            <Badge variant="secondary" className="bg-[#E8F5E9] text-foreground border-none px-4 py-3 rounded-xl flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-[#45CE99]" />
              <span className="font-semibold">{job.employment_type.replace('_', ' ')}</span>
            </Badge>
            {job.salary_range && <Badge variant="secondary" className="bg-[#E8F5E9] text-foreground border-none px-4 py-3 rounded-xl flex items-center justify-center gap-2">
                <DollarSign className="h-5 w-5 text-[#45CE99]" />
                <span className="font-semibold">{job.salary_range}</span>
              </Badge>}
            <Badge variant="secondary" className={`${hiredCount >= job.openings ? 'bg-blue-100' : 'bg-[#E8F5E9]'} text-foreground border-none px-4 py-3 rounded-xl flex items-center justify-center gap-2`}>
              <UserCheck className={`h-5 w-5 ${hiredCount >= job.openings ? 'text-blue-600' : 'text-[#45CE99]'}`} />
              <span className="font-semibold">{hiredCount}/{job.openings} filled</span>
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-12 rounded-lg p-8 bg-primary-foreground border-transparent border-0">
            <div className="space-y-8">
              {job.about_us && <div>
                  <h3 className="text-lg mb-3 text-foreground">About Us</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.about_us}</p>
                </div>}
              
              {job.role_overview && <div>
                  <h3 className="text-lg mb-3 text-foreground">Role Overview</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.role_overview}</p>
                </div>}
              
              {job.what_you_will_do && <div>
                  <h3 className="text-lg mb-3 text-foreground">What You'll Do</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.what_you_will_do}</p>
                </div>}

              {job.description_md && !job.about_us && !job.role_overview && !job.what_you_will_do && <div>
                  <h3 className="text-lg mb-3 text-foreground">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description_md}</p>
                </div>}
            </div>

            <div className="space-y-8">
              {job.requirements_md && <div>
                  <h3 className="text-lg mb-3 text-foreground">Requirements</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.requirements_md}</p>
                </div>}
              
              {job.nice_to_have && <div>
                  <h3 className="text-lg mb-3 text-foreground">Nice to Have</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.nice_to_have}</p>
                </div>}
              
              {job.benefits && <div>
                  <h3 className="text-lg mb-3 text-foreground">Benefits</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.benefits}</p>
                </div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditJobDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} job={job} onSuccess={handleEditSuccess} />
    </>;
}