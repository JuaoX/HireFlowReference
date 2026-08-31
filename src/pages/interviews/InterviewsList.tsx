import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Calendar, MapPin, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isFuture, isPast } from 'date-fns';
import { ScheduleInterviewDialog } from '@/components/interviews/ScheduleInterviewDialog';
import { QuickScheduleDialog } from '@/components/interviews/QuickScheduleDialog';

interface Interview {
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
    candidate: {
      full_name: string;
      email: string;
    };
    job: {
      title: string;
    };
  };
}

const InterviewsList = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [interviewers, setInterviewers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
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
            candidate:candidates(full_name, email),
            job:jobs(title)
          )
        `)
        .order('start_at', { ascending: true });

      if (error) throw error;
      setInterviews(data || []);
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

  const handleInterviewClick = async (interview: Interview) => {
    setSelectedInterview(interview);
    if (interview.panel_user_ids && interview.panel_user_ids.length > 0) {
      await fetchInterviewers(interview.panel_user_ids);
    } else {
      setInterviewers([]);
    }
    setShowQuickView(true);
  };

  const getStatusBadge = (interview: Interview) => {
    if (interview.status === 'completed') {
      return <Badge variant="secondary">Completed</Badge>;
    }
    if (interview.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (interview.status === 'no_show') {
      return <Badge variant="outline">No Show</Badge>;
    }
    if (isPast(new Date(interview.start_at))) {
      return <Badge variant="outline">Past</Badge>;
    }
    return <Badge>Scheduled</Badge>;
  };

  const upcomingInterviews = interviews.filter(i => 
    isFuture(new Date(i.start_at)) && i.status === 'scheduled'
  );
  const pastInterviews = interviews.filter(i => 
    isPast(new Date(i.start_at)) || i.status !== 'scheduled'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Interviews</h1>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      <ScheduleInterviewDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSuccess={fetchInterviews}
      />

      <QuickScheduleDialog
        open={showQuickView}
        onOpenChange={setShowQuickView}
        interview={selectedInterview}
        interviewers={interviewers}
      />

      {upcomingInterviews.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl">Upcoming Interviews</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingInterviews.map((interview) => (
              <Card
                key={interview.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-l-4 border-l-primary overflow-hidden group"
                onClick={() => handleInterviewClick(interview)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(interview)}
                      </div>
                      <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {interview.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                        {interview.application?.candidate?.full_name || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {interview.application?.job?.title || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-3">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">
                        {format(new Date(interview.start_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(interview.start_at), 'h:mm a')} - {format(new Date(interview.end_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  {interview.meeting_link && (
                    <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-lg p-2.5">
                      <Video className="h-4 w-4 text-primary shrink-0" />
                      <p className="font-medium text-primary">Virtual Interview</p>
                    </div>
                  )}
                  
                  {interview.location && !interview.meeting_link && (
                    <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-2.5">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-medium text-foreground line-clamp-1">{interview.location}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastInterviews.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl">Past Interviews</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pastInterviews.map((interview) => (
              <Card
                key={interview.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-l-4 border-l-muted-foreground/30 overflow-hidden group opacity-75 hover:opacity-100"
                onClick={() => handleInterviewClick(interview)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(interview)}
                      </div>
                      <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {interview.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                        {interview.application?.candidate?.full_name || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {interview.application?.job?.title || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-3">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="text-muted-foreground font-medium">
                      {format(new Date(interview.start_at), 'MMM d, yyyy · h:mm a')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {interviews.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No interviews scheduled</p>
            <Button onClick={() => setShowScheduleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Interview
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InterviewsList;
