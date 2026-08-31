import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Scorecard {
  id: string;
  user_id: string;
  recommendation: string;
  ratings_json: {
    [key: string]: {
      score: number;
      comment: string;
    };
  };
  notes?: string;
  submitted_at?: string;
  user: {
    full_name: string;
  };
}

interface ScorecardsDialogProps {
  interviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RATING_LABELS: { [key: string]: string } = {
  technical_skills: 'Technical Skills',
  problem_solving: 'Problem Solving',
  communication: 'Communication',
  culture_fit: 'Culture Fit',
  experience: 'Experience',
};

const getRecommendationColor = (recommendation: string) => {
  switch (recommendation) {
    case 'advance':
      return 'default';
    case 'hold':
      return 'secondary';
    case 'no':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getRecommendationText = (recommendation: string) => {
  switch (recommendation) {
    case 'advance':
      return 'Advance';
    case 'hold':
      return 'Hold';
    case 'no':
      return 'No';
    default:
      return recommendation;
  }
};

export const ScorecardsDialog = ({ interviewId, open, onOpenChange }: ScorecardsDialogProps) => {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && interviewId) {
      fetchScorecards();
    }
  }, [open, interviewId]);

  const fetchScorecards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scorecards')
        .select(`
          id,
          user_id,
          recommendation,
          ratings_json,
          notes,
          submitted_at,
          user:profiles(full_name)
        `)
        .eq('interview_id', interviewId)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setScorecards((data as any) || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load scorecards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageScore = () => {
    if (scorecards.length === 0) return 0;
    
    let totalScore = 0;
    let totalRatings = 0;

    scorecards.forEach((scorecard) => {
      Object.values(scorecard.ratings_json).forEach((rating) => {
        totalScore += rating.score;
        totalRatings++;
      });
    });

    return totalRatings > 0 ? (totalScore / totalRatings).toFixed(1) : 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview Scorecards Summary</DialogTitle>
          <DialogDescription>
            Review feedback from all interviewers
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : scorecards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No scorecards submitted yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reviews</p>
                    <p className="text-2xl font-bold">{scorecards.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{calculateAverageScore()}</p>
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <span className="text-sm text-muted-foreground">/ 5.0</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Recommendations</p>
                  <div className="flex gap-2">
                    {['advance', 'hold', 'no'].map((rec) => {
                      const count = scorecards.filter((s) => s.recommendation === rec).length;
                      return count > 0 ? (
                        <Badge key={rec} variant={getRecommendationColor(rec)}>
                          {getRecommendationText(rec)}: {count}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="">Individual Feedback</h3>
              {scorecards.map((scorecard) => (
                <Card key={scorecard.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{scorecard.user.full_name}</CardTitle>
                      <Badge variant={getRecommendationColor(scorecard.recommendation)}>
                        {getRecommendationText(scorecard.recommendation)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(scorecard.ratings_json).map(([key, rating]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {RATING_LABELS[key] || key}
                            </p>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold">{rating.score}</span>
                              <Star className="h-3 w-3 fill-primary text-primary" />
                            </div>
                          </div>
                          {rating.comment && (
                            <p className="text-xs text-muted-foreground">{rating.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {scorecard.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Overall Notes</p>
                        <p className="text-sm text-muted-foreground">{scorecard.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
