import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Calendar, Clock, MapPin, Video, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { MessageComposer } from '@/components/messaging/MessageComposer';
import { MessageTimeline } from '@/components/messaging/MessageTimeline';
import { ApplicationActions } from '@/components/applications/ApplicationActions';
import { ActivityTimeline } from '@/components/shared/ActivityTimeline';
import { ScorecardsDialog } from '@/components/interviews/ScorecardsDialog';
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog';
import { TasksList } from '@/components/tasks/TasksList';

interface ApplicationDetail {
  id: string;
  applied_at: string;
  state: string;
  rejection_reason?: string;
  rejection_note?: string;
  cover_letter?: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
    org_id: string;
  };
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
  };
  current_stage?: {
    id: string;
    name: string;
  };
}

interface Interview {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  location: string;
  meeting_link?: string;
  status: string;
  timezone?: string;
  panel_user_ids?: string[];
}

interface Offer {
  id: string;
  state: string;
}

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [scorecardsDialogOpen, setScorecardsDialogOpen] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchApplication();
      fetchInterviews();
      fetchOffer();
    }
  }, [id]);

  useEffect(() => {
    if (application?.candidate?.id) {
      fetchTasks();
    }
  }, [application?.candidate?.id]);

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          applied_at,
          state,
          rejection_reason,
          rejection_note,
          cover_letter,
          candidate:candidates(id, full_name, email, phone, location, linkedin_url, org_id),
          job:jobs(id, title, department, location),
          current_stage:job_stages(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setApplication(data);
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

  const fetchInterviews = async () => {
    if (!id) return;
    
    try {
      setLoadingInterviews(true);
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('application_id', id)
        .order('start_at', { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error: any) {
      console.error('Error fetching interviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interviews',
        variant: 'destructive',
      });
    } finally {
      setLoadingInterviews(false);
    }
  };

  const fetchOffer = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('id, state')
        .eq('application_id', id)
        .maybeSingle();

      if (error) throw error;
      setOffer(data);
    } catch (error: any) {
      console.error('Error fetching offer:', error);
    }
  };

  const fetchTasks = async () => {
    if (!application?.candidate?.id) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('candidate_id', application.candidate.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRejectionReasonText = (reason: string) => {
    switch (reason) {
      case 'not_qualified':
        return 'Not Qualified';
      case 'position_filled':
        return 'Position Filled';
      case 'withdrawn':
        return 'Withdrawn by Candidate';
      case 'failed_assessment':
        return 'Failed Assessment';
      case 'cultural_fit':
        return 'Cultural Fit';
      case 'compensation':
        return 'Compensation Mismatch';
      case 'experience':
        return 'Insufficient Experience';
      case 'skills':
        return 'Skills Mismatch';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
  };

  const handleReject = async (reason: string, note: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          state: 'rejected',
          rejection_reason: reason,
          rejection_note: note,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Application Rejected',
        description: 'The application has been marked as rejected.',
      });

      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async () => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ state: 'withdrawn' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Application Withdrawn',
        description: 'The application has been marked as withdrawn.',
      });

      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleHire = async () => {
    try {
      // Try to move the application to the "Hired" stage for this job
      let hiredStageId: string | null = null;
      if (application?.job?.id) {
        const { data: stage, error: stageError } = await supabase
          .from('job_stages')
          .select('id')
          .eq('job_id', application.job.id)
          .eq('type', 'hired')
          .maybeSingle();

        if (stageError) throw stageError;
        hiredStageId = stage?.id ?? null;
      }

      const updates: { state: 'hired'; current_stage_id?: string | null } = { state: 'hired' };
      if (hiredStageId) {
        updates.current_stage_id = hiredStageId;
      }

      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .select('id')
        .single();

      if (error) throw error;
      
      // Check if update actually affected a row
      if (!data) {
        throw new Error('You do not have permission to hire this candidate');
      }

      toast({
        title: 'Candidate Hired',
        description: hiredStageId ? 'Moved to the Hired stage.' : 'Marked as hired. (No Hired stage configured)'
      });

      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEndContract = async () => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ state: 'withdrawn' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Contract Ended',
        description: 'The employment contract has been terminated.',
      });

      fetchApplication();
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

  if (!application || !application.candidate || !application.job) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          {!application 
            ? 'Application not found' 
            : 'Unable to load application details. The candidate or job may have been deleted or you may not have permission to view this application.'}
        </p>
        <Button onClick={() => navigate('/applications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl">{application.candidate.full_name}</h1>
          <Link to={`/jobs/${application.job.id}`} className="text-muted-foreground hover:text-primary transition-colors">
            {application.job.title}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {application.state === 'hired' ? (
            <>
              {offer && (
                <Button asChild variant="default">
                  <Link to={`/offers/${offer.id}`}>
                    View Offer Details
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleEndContract}>
                End Contract
              </Button>
            </>
          ) : (
            <ApplicationActions
              applicationState={application.state}
              onReject={handleReject}
              onWithdraw={handleWithdraw}
              onHire={handleHire}
              offerState={offer?.state}
              applicationId={application.id}
            />
          )}
          <Badge 
            className={application.state === 'active' ? 'bg-green-500 text-white hover:bg-green-600 border-transparent' : undefined}
          >
            {application.state}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{application.candidate.email}</p>
                </div>
                {application.candidate.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{application.candidate.phone}</p>
                  </div>
                )}
                {application.candidate.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{application.candidate.location}</p>
                  </div>
                )}
                {application.candidate.linkedin_url && (
                  <div>
                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                    <a
                      href={application.candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Job</p>
                  <p className="font-medium">{application.job.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{application.job.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Stage</p>
                  <p className="font-medium">{application.current_stage?.name || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applied Date</p>
                  <p className="font-medium">
                    {format(new Date(application.applied_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {application.cover_letter && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap text-foreground">{application.cover_letter}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {application.state === 'rejected' && (
            <Card>
              <CardHeader>
                <CardTitle>Rejection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {application.rejection_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="font-medium">{getRejectionReasonText(application.rejection_reason)}</p>
                  </div>
                )}
                {application.rejection_note && (
                  <div>
                    <p className="text-sm text-muted-foreground">Note</p>
                    <p className="font-medium">{application.rejection_note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <AddTaskDialog 
                candidateId={application.candidate.id} 
                orgId={application.candidate.org_id} 
                onTaskAdded={fetchTasks} 
              />
            </CardHeader>
            <CardContent>
              <TasksList tasks={tasks} onTasksChange={fetchTasks} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <MessageComposer 
              candidateId={application.candidate.id}
              applicationId={application.id}
              defaultTo={application.candidate.email ? [application.candidate.email] : []}
            />
            <MessageTimeline applicationId={application.id} />
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <ActivityTimeline entityType="application" entityId={application.id} />
        </TabsContent>

        <TabsContent value="interviews">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Interviews</CardTitle>
              <Button asChild size="sm">
                <Link to={`/interviews/new?applicationId=${application.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingInterviews ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No interviews scheduled yet</p>
                  <Button asChild variant="outline">
                    <Link to={`/interviews/new?applicationId=${application.id}`}>
                      Schedule First Interview
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className={interviews.length > 1 ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}>
                  {interviews.map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <Link 
                              to={`/interviews/${interview.id}`}
                              className="text-lg font-semibold hover:text-primary transition-colors inline-flex items-center gap-2"
                            >
                              {interview.title}
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <Badge 
                              variant={getStatusBadgeVariant(interview.status)} 
                              className="ml-3"
                            >
                              {interview.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{format(new Date(interview.start_at), 'MMM d, yyyy')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>
                              {format(new Date(interview.start_at), 'h:mm a')} - {format(new Date(interview.end_at), 'h:mm a')}
                              {interview.timezone && ` (${interview.timezone})`}
                            </span>
                          </div>
                          
                          {interview.location && !interview.meeting_link && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span>{interview.location}</span>
                            </div>
                          )}
                          
                          {interview.meeting_link && (
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <a 
                                href={interview.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                              >
                                Join Virtual Meeting
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button asChild variant="outline" size="sm" className="w-full">
                            <Link to={`/interviews/${interview.id}`}>
                              View Details
                            </Link>
                          </Button>
                          {interview.status === 'completed' && (
                            <Button 
                              asChild={false}
                              variant="default" 
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedInterviewId(interview.id);
                                setScorecardsDialogOpen(true);
                              }}
                            >
                              View Scorecards
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedInterviewId && (
        <ScorecardsDialog
          interviewId={selectedInterviewId}
          open={scorecardsDialogOpen}
          onOpenChange={setScorecardsDialogOpen}
        />
      )}
    </div>
  );
};

export default ApplicationDetail;
