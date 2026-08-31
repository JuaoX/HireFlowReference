import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Star } from 'lucide-react';

const RATING_CATEGORIES = [
  { key: 'technical_skills', label: 'Technical Skills' },
  { key: 'communication', label: 'Communication' },
  { key: 'problem_solving', label: 'Problem Solving' },
  { key: 'culture_fit', label: 'Culture Fit' },
  { key: 'experience', label: 'Relevant Experience' },
];

const ScorecardForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recommendation, setRecommendation] = useState('');
  const [ratings, setRatings] = useState<Record<string, { score: number; comment: string }>>({});
  const [overallNotes, setOverallNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRatingChange = (category: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: { score, comment: prev[category]?.comment || '' },
    }));
  };

  const handleCommentChange = (category: string, comment: string) => {
    setRatings((prev) => ({
      ...prev,
      [category]: { score: prev[category]?.score || 0, comment },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recommendation) {
      toast({
        title: 'Recommendation Required',
        description: 'Please select a recommendation',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('scorecards').insert([{
        interview_id: id!,
        user_id: user.id,
        recommendation: recommendation as 'advance' | 'hold' | 'no',
        ratings_json: ratings as any,
        notes: overallNotes,
        submitted_at: new Date().toISOString(),
      }]);

      if (error) throw error;

      toast({
        title: 'Scorecard Submitted',
        description: 'Your interview feedback has been recorded.',
      });

      navigate(`/interviews/${id}`);
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/interviews/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl">Interview Scorecard</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Rating Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {RATING_CATEGORIES.map((category) => (
              <div key={category.key} className="space-y-3">
                <Label>{category.label}</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleRatingChange(category.key, score)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          (ratings[category.key]?.score || 0) >= score
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground hover:text-primary'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {ratings[category.key]?.score || 0}/5
                  </span>
                </div>
                <Textarea
                  placeholder="Add comments about this area..."
                  value={ratings[category.key]?.comment || ''}
                  onChange={(e) => handleCommentChange(category.key, e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={recommendation} onValueChange={setRecommendation}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advance" id="advance" />
                <Label htmlFor="advance" className="font-normal">
                  Advance - Move to next round
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hold" id="hold" />
                <Label htmlFor="hold" className="font-normal">
                  Hold - Need more information
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="font-normal">
                  Do Not Advance
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Provide overall feedback about the candidate..."
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              rows={6}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Scorecard'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/interviews/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ScorecardForm;
