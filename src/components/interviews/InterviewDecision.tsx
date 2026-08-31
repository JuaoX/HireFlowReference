import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { RejectCandidateDialog } from './RejectCandidateDialog';

interface InterviewDecisionProps {
  scorecards: Array<{
    recommendation: string;
    user: { full_name: string };
  }>;
  interviewStatus: string;
  applicationState: string;
  onAdvance: () => void;
  onReject: (reason: string, notes: string) => void;
}

export const InterviewDecision = ({ 
  scorecards, 
  interviewStatus,
  applicationState,
  onAdvance,
  onReject 
}: InterviewDecisionProps) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleReject = (reason: string, notes: string) => {
    onReject(reason, notes);
    setShowRejectDialog(false);
  };

  if (scorecards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Decision</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <p>Waiting for scorecards to be submitted</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate recommendation counts
  const recommendations = {
    advance: scorecards.filter(s => s.recommendation === 'advance').length,
    hold: scorecards.filter(s => s.recommendation === 'hold').length,
    no: scorecards.filter(s => s.recommendation === 'no').length,
  };

  const totalScores = scorecards.length;
  const majorityRecommendation = 
    recommendations.advance > recommendations.no ? 'advance' :
    recommendations.no > recommendations.advance ? 'reject' : 'mixed';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="">Scorecard Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {recommendations.advance}
              </div>
              <div className="text-sm text-muted-foreground">Advance</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {recommendations.hold}
              </div>
              <div className="text-sm text-muted-foreground">Hold</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {recommendations.no}
              </div>
              <div className="text-sm text-muted-foreground">Do Not Advance</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalScores} scorecard{totalScores !== 1 ? 's' : ''} submitted
          </p>
        </div>

        {interviewStatus === 'completed' && applicationState === 'active' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Recommended Action:</span>
              {majorityRecommendation === 'advance' && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Move to Next Stage
                </Badge>
              )}
              {majorityRecommendation === 'reject' && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Do Not Advance
                </Badge>
              )}
              {majorityRecommendation === 'mixed' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Mixed Reviews - Needs Discussion
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={onAdvance} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Advance Candidate
              </Button>
              <Button onClick={() => setShowRejectDialog(true)} variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Reject Candidate
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <RejectCandidateDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={handleReject}
      />
    </Card>
  );
};
