import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from './StarRating';
import { AddCandidateRatingDialog } from './AddCandidateRatingDialog';
import { format } from 'date-fns';

interface CandidateRating {
  id: string;
  soft_skills: number;
  hard_skills: number;
  salary_match: number;
  culture_fit: number;
  experience: number;
  notes: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface RatingsSectionProps {
  candidateId: string;
}

const CATEGORIES = [
  { key: 'soft_skills', label: 'Soft Skills' },
  { key: 'hard_skills', label: 'Hard Skills' },
  { key: 'salary_match', label: 'Salary Match' },
  { key: 'culture_fit', label: 'Culture Fit' },
  { key: 'experience', label: 'Experience' },
] as const;

type RatingKey = typeof CATEGORIES[number]['key'];

export const RatingsSection = ({ candidateId }: RatingsSectionProps) => {
  const [ratings, setRatings] = useState<CandidateRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState<CandidateRating | null>(null);

  useEffect(() => {
    fetchRatings();
    fetchCurrentUser();
  }, [candidateId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_ratings')
        .select(`
          id,
          soft_skills,
          hard_skills,
          salary_match,
          culture_fit,
          experience,
          notes,
          created_at,
          user:profiles!candidate_ratings_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings((data as any) || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = (key: RatingKey): number => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r[key], 0);
    return sum / ratings.length;
  };

  const userRating = ratings.find(r => r.user.id === currentUserId);

  const handleAddOrEdit = () => {
    if (userRating) {
      setEditingRating(userRating);
    } else {
      setEditingRating(null);
    }
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading ratings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Ratings</CardTitle>
          <Button size="sm" variant="outline" onClick={handleAddOrEdit}>
            {userRating ? (
              <>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Rate
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ratings yet. Be the first to rate this candidate.</p>
          ) : (
            <>
              {/* Average Scores */}
              <div className="space-y-2 pb-3 border-b">
                <p className="text-sm font-medium text-muted-foreground">Average Scores</p>
                {CATEGORIES.map((cat) => {
                  const avg = calculateAverage(cat.key);
                  return (
                    <div key={cat.key} className="flex items-center justify-between">
                      <span className="text-sm">{cat.label}</span>
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(avg)} readonly size="sm" />
                        <span className="text-xs text-muted-foreground w-8">({avg.toFixed(1)})</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Individual Ratings */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Individual Ratings</p>
                {ratings.map((rating) => (
                  <div key={rating.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={rating.user.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {rating.user.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{rating.user.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(rating.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {CATEGORIES.map((cat) => (
                        <div key={cat.key} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{cat.label}:</span>
                          <StarRating value={rating[cat.key]} readonly size="sm" />
                        </div>
                      ))}
                    </div>
                    {rating.notes && (
                      <p className="text-xs text-muted-foreground italic pt-1 border-t">
                        "{rating.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddCandidateRatingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidateId={candidateId}
        existingRating={editingRating}
        onSuccess={fetchRatings}
      />
    </>
  );
};
