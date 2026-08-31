import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Calendar, MapPin, Video, User, Briefcase, ExternalLink, Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ScorecardCard } from '@/components/interviews/ScorecardCard';
import { InterviewDecision } from '@/components/interviews/InterviewDecision';

interface Scorecard {
  id: string;
  user_id: string;
  user: {
    full_name: string;
  };
  recommendation: string;
  ratings_json: any;
  notes?: string;
  submitted_at?: string;
}

interface InterviewDetail {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  status: string;
  location?: string;
  meeting_link?: string;
  panel_user_ids?: string[];
  application: {
    id: string;
    state: string;
    candidate: {
      id: string;
      full_name: string;
      email: string;
      phone?: string;
    };
    job: {
      id: string;
      title: string;
      department: string;
    };
  };
}

const InterviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [interviewers, setInterviewers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    
    getCurrentUser();
    
    if (id) {
      fetchInterview();
      fetchScorecards();
    }
  }, [id]);

  const fetchInterviewers = async (panelUserIds: string[]) => {
    if (!panelUserIds || panelUserIds.length === 0) {
      setInterviewers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", panelUserIds);

      if (error) throw error;
      setInterviewers(data || []);
    } catch (error) {
      console.error("Error fetching interviewers:", error);
    }
  };

  const fetchInterview = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          id,
          title,
          start_at,
          end_at,
          status,
          location,
          meeting_link,
          panel_user_ids,
          application:applications(
            id,
            state,
            candidate:candidates(id, full_name, email, phone),
            job:jobs(id, title, department)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setInterview(data);

      // Fetch interviewers if panel_user_ids exists
      if (data?.panel_user_ids && data.panel_user_ids.length > 0) {
        await fetchInterviewers(data.panel_user_ids);
      }
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

  const fetchScorecards = async () => {
    try {
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
        .eq('interview_id', id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setScorecards(data || []);
    } catch (error: any) {
      console.error('Error fetching scorecards:', error);
    }
  };

  const handleDownloadICS = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-ics', {
        body: { interviewId: id },
      });

      if (error) throw error;

      // Create a blob and download
      const blob = new Blob([data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-${id}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Calendar Event Downloaded',
        description: 'ICS file has been downloaded',
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (newStatus: 'completed' | 'cancelled' | 'no_show' | 'scheduled') => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Interview marked as ${newStatus}`,
      });

      fetchInterview();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAdvanceCandidate = async () => {
    try {
      // Get the next stage for the application
      const { data: stages } = await supabase
        .from('job_stages')
        .select('id, order_idx')
        .eq('job_id', interview?.application.job.id)
        .order('order_idx');

      if (!stages || stages.length === 0) {
        toast({
          title: 'Error',
          description: 'No stages found for this job',
          variant: 'destructive',
        });
        return;
      }

      const { data: currentApp } = await supabase
        .from('applications')
        .select('current_stage_id')
        .eq('id', interview?.application.id)
        .single();

      const currentStage = stages.find(s => s.id === currentApp?.current_stage_id);
      const nextStage = stages.find(s => s.order_idx === (currentStage?.order_idx || 0) + 1);

      if (!nextStage) {
        toast({
          title: 'Already at Final Stage',
          description: 'This candidate is already at the final stage',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('applications')
        .update({ current_stage_id: nextStage.id })
        .eq('id', interview?.application.id);

      if (error) throw error;

      toast({
        title: 'Candidate Advanced',
        description: 'Successfully moved to next stage',
      });

      // Navigate to application detail to see the updated status
      navigate(`/applications/${interview?.application.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRejectCandidate = async (reason: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          state: 'rejected',
          rejection_reason: reason,
          rejection_note: notes
        })
        .eq('id', interview?.application.id);

      if (error) throw error;

      toast({
        title: 'Candidate Rejected',
        description: 'Application marked as rejected',
      });

      // Navigate to application detail to see the updated status
      navigate(`/applications/${interview?.application.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Interview not found</p>
        <Button onClick={() => navigate('/interviews')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interviews
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/interviews')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl">{interview.title}</h1>
          <p className="text-muted-foreground">{interview.application.candidate.full_name}</p>
        </div>
        <Badge>{interview.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{format(new Date(interview.start_at), 'EEEE, MMMM d, yyyy')}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(interview.start_at), 'h:mm a')} - {format(new Date(interview.end_at), 'h:mm a')}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadICS}
              >
                <Download className="h-4 w-4 mr-2" />
                Add to Calendar
              </Button>
            </div>

            {interview.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{interview.location}</p>
                </div>
              </div>
            )}

            {interview.meeting_link && (
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Video Call</p>
                  <a
                    href={interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Join Meeting <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {interviewers.length > 0 && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-2">Interview Panel</p>
                  <div className="space-y-2">
                    {interviewers.map((interviewer) => (
                      <div key={interviewer.id} className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {interviewer.full_name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {interviewer.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Candidate Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{interview.application.candidate.full_name}</p>
                <p className="text-sm text-muted-foreground">{interview.application.candidate.email}</p>
                {interview.application.candidate.phone && (
                  <p className="text-sm text-muted-foreground">{interview.application.candidate.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{interview.application.job.title}</p>
                <p className="text-sm text-muted-foreground">{interview.application.job.department}</p>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/candidates/${interview.application.candidate.id}`)}
              >
                View Candidate Profile
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/applications/${interview.application.id}`)}
              >
                View Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {interview.status === 'scheduled' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => handleStatusUpdate('completed')}>
              Mark as Completed
            </Button>
            <Button variant="outline" onClick={() => handleStatusUpdate('cancelled')}>
              Cancel Interview
            </Button>
          </CardContent>
        </Card>
      )}

      <InterviewDecision 
        scorecards={scorecards}
        interviewStatus={interview.status}
        applicationState={interview.application.state}
        onAdvance={handleAdvanceCandidate}
        onReject={handleRejectCandidate}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Interview Feedback</h2>
          <Button 
            onClick={() => navigate(`/interviews/${id}/scorecard`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Scorecard
          </Button>
        </div>

        {scorecards.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {scorecards.map((scorecard) => (
              <ScorecardCard key={scorecard.id} scorecard={scorecard} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No scorecards submitted yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InterviewDetail;
