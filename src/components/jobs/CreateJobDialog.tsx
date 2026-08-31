import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateJobDialog({ open, onOpenChange, onSuccess }: CreateJobDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    employment_type: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'internship',
    salary_range: '',
    openings: 1,
    about_us: '',
    requirements_md: '',
    role_overview: '',
    nice_to_have: '',
    what_you_will_do: '',
    benefits: '',
    required_skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          ...formData,
          org_id: profile.org_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator to job_acl with full permissions
      if (newJob) {
        const { error: aclError } = await supabase
          .from('job_acl')
          .insert({
            job_id: newJob.id,
            user_id: user.id,
            can_view: true,
            can_move_pipeline: true,
            can_message: true,
            can_view_offer: true,
          });

        if (aclError) {
          console.error('Error adding creator to job ACL:', aclError);
        }
      }

      toast({
        title: 'Success',
        description: 'Job listing created successfully',
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: '',
        location: '',
        employment_type: 'full_time',
        salary_range: '',
        openings: 1,
        about_us: '',
        requirements_md: '',
        role_overview: '',
        nice_to_have: '',
        what_you_will_do: '',
        benefits: '',
        required_skills: [],
      });
      setSkillInput('');
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-6 pr-12">
          <DialogTitle className="text-3xl font-semibold">New Listing</DialogTitle>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-foreground text-background hover:bg-foreground/90 gap-2"
          >
            <Check className="h-4 w-4" />
            Create Listing
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title */}
          <fieldset className="border border-border rounded-lg p-4 relative">
            <legend className="text-xs text-muted-foreground px-2 -ml-2">Job Title</legend>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter job title"
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              required
            />
          </fieldset>

          {/* Location, Employment Type, Compensation, Openings Row */}
          <div className="grid grid-cols-4 gap-4">
            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">Location</legend>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Remote, New York"
                className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </fieldset>

            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">Employment Type</legend>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({ ...formData, employment_type: value as 'full_time' | 'part_time' | 'contract' | 'internship' })}
              >
                <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </fieldset>

            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">Compensation</legend>
              <Input
                value={formData.salary_range}
                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                placeholder="e.g., $80k - $120k"
                className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </fieldset>

            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">Number of Openings</legend>
              <Input
                type="number"
                min={1}
                value={formData.openings}
                onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
                placeholder="1"
                className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </fieldset>
          </div>

          {/* Required Skills */}
          <fieldset className="border border-border rounded-lg p-4 relative">
            <legend className="text-xs text-muted-foreground px-2 -ml-2">Required Skills</legend>
            <div className="flex gap-2 mb-3">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g. React, TypeScript, CSS"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
                      setFormData({ ...formData, required_skills: [...formData.required_skills, skillInput.trim()] });
                      setSkillInput('');
                    }
                  }
                }}
                className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
                    setFormData({ ...formData, required_skills: [...formData.required_skills, skillInput.trim()] });
                    setSkillInput('');
                  }
                }}
              >
                Add
              </Button>
            </div>
            {formData.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.map((skill: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground rounded-md"
                  >
                    <span className="text-sm">{skill}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          required_skills: formData.required_skills.filter((_: string, i: number) => i !== index)
                        });
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {/* About Us & Requirements Row */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">About Us</legend>
              <Textarea
                value={formData.about_us}
                onChange={(e) => setFormData({ ...formData, about_us: e.target.value })}
                placeholder="Tell candidates about your company..."
                className="border-0 p-0 min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </fieldset>

            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">Requirements</legend>
              <Textarea
                value={formData.requirements_md}
                onChange={(e) => setFormData({ ...formData, requirements_md: e.target.value })}
                placeholder="List the key requirements..."
                className="border-0 p-0 min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </fieldset>
          </div>

          {/* Role Overview & Nice to Haves Row */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">Role Overview</legend>
              <Textarea
                value={formData.role_overview}
                onChange={(e) => setFormData({ ...formData, role_overview: e.target.value })}
                placeholder="Provide an overview of the role..."
                className="border-0 p-0 min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </fieldset>

            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">Nice to Haves</legend>
              <Textarea
                value={formData.nice_to_have}
                onChange={(e) => setFormData({ ...formData, nice_to_have: e.target.value })}
                placeholder="Optional qualifications..."
                className="border-0 p-0 min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </fieldset>
          </div>

          {/* What You'll Do & Benefits Row */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">What You'll Do</legend>
              <Textarea
                value={formData.what_you_will_do}
                onChange={(e) => setFormData({ ...formData, what_you_will_do: e.target.value })}
                placeholder="Describe the responsibilities..."
                className="border-0 p-0 min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </fieldset>

            <fieldset className="border border-border rounded-lg p-4 relative">
              <legend className="text-xs text-muted-foreground px-2 -ml-2">Benefits</legend>
              <Textarea
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="List the benefits offered..."
                className="border-0 p-0 min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </fieldset>
          </div>
        </form>

        {/* Footer with duplicate submit button */}
        <div className="flex justify-end pt-6 border-t mt-6">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-foreground text-background hover:bg-foreground/90 gap-2"
          >
            <Check className="h-4 w-4" />
            Create Listing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
