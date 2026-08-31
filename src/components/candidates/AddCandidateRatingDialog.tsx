import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddCandidateRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  existingRating?: {
    id: string;
    soft_skills: number;
    hard_skills: number;
    salary_match: number;
    culture_fit: number;
    experience: number;
    notes: string | null;
  } | null;
  onSuccess: () => void;
}

const RATING_CATEGORIES = [
  { key: 'soft_skills', label: 'Soft Skills', description: 'Communication, teamwork, leadership' },
  { key: 'hard_skills', label: 'Hard Skills', description: 'Technical abilities, expertise' },
  { key: 'salary_match', label: 'Salary Match', description: 'Expectations vs. budget alignment' },
  { key: 'culture_fit', label: 'Culture Fit', description: 'Values and team compatibility' },
  { key: 'experience', label: 'Experience', description: 'Relevant background and history' },
] as const;

type RatingKey = typeof RATING_CATEGORIES[number]['key'];

export const AddCandidateRatingDialog = ({
  open,
  onOpenChange,
  candidateId,
  existingRating,
  onSuccess,
}: AddCandidateRatingDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    soft_skills: 3,
    hard_skills: 3,
    salary_match: 3,
    culture_fit: 3,
    experience: 3,
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingRating) {
      setRatings({
        soft_skills: existingRating.soft_skills,
        hard_skills: existingRating.hard_skills,
        salary_match: existingRating.salary_match,
        culture_fit: existingRating.culture_fit,
        experience: existingRating.experience,
      });
      setNotes(existingRating.notes || '');
    } else {
      setRatings({
        soft_skills: 3,
        hard_skills: 3,
        salary_match: 3,
        culture_fit: 3,
        experience: 3,
      });
      setNotes('');
    }
  }, [existingRating, open]);

  const handleSubmit = async () => {
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

      if (existingRating) {
        const { error } = await supabase
          .from('candidate_ratings')
          .update({
            ...ratings,
            notes: notes || null,
          })
          .eq('id', existingRating.id);

        if (error) throw error;
        toast({ title: 'Rating updated successfully' });
      } else {
        const { error } = await supabase
          .from('candidate_ratings')
          .insert({
            candidate_id: candidateId,
            user_id: user.id,
            org_id: profile.org_id,
            ...ratings,
            notes: notes || null,
          });

        if (error) throw error;
        toast({ title: 'Rating added successfully' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error saving rating',
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
          <DialogTitle>{existingRating ? 'Edit Rating' : 'Rate Candidate'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {RATING_CATEGORIES.map((category) => (
            <div key={category.key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{category.label}</Label>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
              <StarRating
                value={ratings[category.key]}
                onChange={(value) => setRatings((prev) => ({ ...prev, [category.key]: value }))}
              />
            </div>
          ))}

          <div className="space-y-2 pt-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional comments about this candidate..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : existingRating ? 'Update' : 'Save Rating'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
