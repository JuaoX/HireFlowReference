import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Video, User, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface QuickScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: {
    id: string;
    title: string;
    start_at: string;
    end_at: string;
    status: string;
    location?: string;
    meeting_link?: string;
    panel_user_ids?: string[];
  } | null;
  interviewers?: Array<{ id: string; full_name: string; email: string }>;
}

export function QuickScheduleDialog({ 
  open, 
  onOpenChange, 
  interview,
  interviewers = []
}: QuickScheduleDialogProps) {
  const navigate = useNavigate();

  if (!interview) return null;

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: <Badge>Scheduled</Badge>,
      completed: <Badge variant="secondary">Completed</Badge>,
      no_show: <Badge variant="outline">No Show</Badge>,
      cancelled: <Badge variant="destructive">Cancelled</Badge>,
    };
    return statusMap[status as keyof typeof statusMap] || <Badge>{status}</Badge>;
  };

  const handleViewDetails = () => {
    onOpenChange(false);
    navigate(`/interviews/${interview.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{interview.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {getStatusBadge(interview.status)}
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Date & Time</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(interview.start_at), 'EEEE, MMMM d, yyyy')}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {format(new Date(interview.start_at), 'h:mm a')} - {format(new Date(interview.end_at), 'h:mm a')}
                </p>
              </div>
            </div>
          </div>

          {interview.meeting_link ? (
            <div className="flex items-start gap-3">
              <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Interview Type</p>
                <a
                  href={interview.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Virtual - Join Meeting <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ) : interview.location ? (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Interview Type</p>
                <p className="text-sm text-muted-foreground">Onsite - {interview.location}</p>
              </div>
            </div>
          ) : null}

          {interviewers.length > 0 && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm mb-2">Panel</p>
                <div className="flex flex-wrap gap-2">
                  {interviewers.map((interviewer) => (
                    <Badge key={interviewer.id} variant="secondary">
                      {interviewer.full_name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-2">
            <Button 
              className="flex-1" 
              onClick={handleViewDetails}
            >
              View Complete Details
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
