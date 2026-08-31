import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Clock, Users, Calendar, MapPin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface Interview {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  meeting_link: string | null;
  location: string | null;
  panel_user_ids: string[] | null;
  applications: {
    candidates: {
      full_name: string;
    };
    jobs: {
      title: string;
    };
  };
}

const NextMeetingCard = () => {
  const [nextInterview, setNextInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNextInterview();
  }, []);

  const fetchNextInterview = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          id,
          title,
          start_at,
          end_at,
          meeting_link,
          location,
          panel_user_ids,
          applications!inner(
            candidates!inner(full_name),
            jobs!inner(title)
          )
        `)
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setNextInterview(data);
    } catch (error) {
      console.error('Error fetching next interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    if (nextInterview?.meeting_link) {
      window.open(nextInterview.meeting_link, '_blank');
    }
  };

  const handleViewDetails = () => {
    if (nextInterview) {
      navigate(`/interviews/${nextInterview.id}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="w-[120px] h-[140px] rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nextInterview) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Next Interview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming interviews scheduled</p>
        </CardContent>
      </Card>
    );
  }

  const interviewDate = new Date(nextInterview.start_at);
  const isToday = format(interviewDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const panelCount = nextInterview.panel_user_ids?.length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Next Interview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Left side - Date/Time box */}
          <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-6 py-4 min-w-[120px]">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-3">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div className="text-sm font-semibold text-foreground">
              {isToday ? 'Today' : format(interviewDate, 'MMM d')}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(interviewDate, 'h:mm a')}
            </div>
          </div>

          {/* Right side - Interview details */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-base text-foreground mb-2">
              {nextInterview.title}
            </h3>
            
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span>{format(interviewDate, 'MMM d, yyyy')} at {format(interviewDate, 'h:mm a')}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {nextInterview.applications.candidates.full_name} - {nextInterview.applications.jobs.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              {nextInterview.meeting_link ? (
                <>
                  <Video className="w-4 h-4" />
                  <span>Online Meeting</span>
                  <Badge variant="secondary" className="ml-1">Virtual</Badge>
                </>
              ) : nextInterview.location ? (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>{nextInterview.location}</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>No location specified</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
              {panelCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{panelCount} {panelCount === 1 ? 'interviewer' : 'interviewers'}</span>
                </div>
              )}
              {panelCount === 0 && <div />}
              <div className="flex items-center gap-2">
                {nextInterview.meeting_link && (
                  <Button 
                    onClick={handleJoinMeeting}
                    size="sm"
                    className="gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join Meeting
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewDetails}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NextMeetingCard;
