import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Star } from 'lucide-react';

interface ScorecardCardProps {
  scorecard: {
    id: string;
    user: {
      full_name: string;
    };
    recommendation: string;
    ratings_json: any;
    notes?: string;
    submitted_at?: string;
  };
}

const RECOMMENDATION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  advance: { label: 'Advance', variant: 'default' },
  hold: { label: 'Hold', variant: 'secondary' },
  no: { label: 'Do Not Advance', variant: 'destructive' },
};

export const ScorecardCard = ({ scorecard }: ScorecardCardProps) => {
  const recInfo = RECOMMENDATION_LABELS[scorecard.recommendation] || { label: scorecard.recommendation, variant: 'default' as const };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{scorecard.user.full_name}</CardTitle>
          <Badge variant={recInfo.variant}>{recInfo.label}</Badge>
        </div>
        {scorecard.submitted_at && (
          <p className="text-sm text-muted-foreground">
            Submitted {format(new Date(scorecard.submitted_at), 'MMM d, yyyy')}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {scorecard.ratings_json && Object.keys(scorecard.ratings_json).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm">Ratings</h4>
            {Object.entries(scorecard.ratings_json).map(([key, value]: [string, any]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (value.score || 0)
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {value.comment && (
                  <p className="text-xs text-muted-foreground">{value.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
        
        {scorecard.notes && (
          <div className="space-y-2">
            <h4 className="text-sm">Overall Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{scorecard.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
