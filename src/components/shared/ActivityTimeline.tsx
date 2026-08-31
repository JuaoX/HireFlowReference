import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, FileText, Briefcase, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Activity {
  id: string;
  actor_id: string | null;
  entity: string;
  entity_id: string;
  action: string;
  before_json: any;
  after_json: any;
  created_at: string;
  actor?: {
    full_name: string;
    email: string;
  };
}

interface ActivityTimelineProps {
  entityType?: string;
  entityId?: string;
  limit?: number;
}

const getEntityIcon = (entity: string) => {
  switch (entity) {
    case 'application':
      return FileText;
    case 'candidate':
      return User;
    case 'job':
      return Briefcase;
    case 'message':
      return Mail;
    case 'interview':
      return Calendar;
    default:
      return FileText;
  }
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
    stage_moved: 'Moved stage',
    state_changed: 'Changed state',
    sent: 'Sent',
    scheduled: 'Scheduled',
  };
  return labels[action] || action;
};

const getActionColor = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (action) {
    case 'created':
    case 'scheduled':
      return 'default';
    case 'stage_moved':
    case 'state_changed':
      return 'secondary';
    case 'deleted':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const ActivityTimeline = ({ entityType, entityId, limit = 20 }: ActivityTimelineProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [candidateActivities, setCandidateActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    if (entityType === 'candidate' && entityId) {
      fetchCandidateActivities();
    }
  }, [entityType, entityId]);

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          actor:profiles!activities_actor_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('entity', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setActivities(data || []);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateActivities = async () => {
    try {
      // Fetch applications for this candidate
      const { data: applications } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          state,
          job:jobs(title),
          current_stage:job_stages(name, type)
        `)
        .eq('candidate_id', entityId)
        .order('created_at', { ascending: false });

      // Fetch interviews
      const { data: interviews } = await supabase
        .from('interviews')
        .select(`
          id,
          title,
          start_at,
          created_at,
          status,
          application:applications!interviews_application_id_fkey(
            id,
            job:jobs(title)
          )
        `)
        .in('application_id', applications?.map(a => a.id) || [])
        .order('created_at', { ascending: false });

      // Fetch offers
      const { data: offers } = await supabase
        .from('offers')
        .select(`
          id,
          state,
          created_at,
          base_amount,
          currency,
          application:applications!offers_application_id_fkey(
            id,
            job:jobs(title)
          )
        `)
        .in('application_id', applications?.map(a => a.id) || [])
        .order('created_at', { ascending: false });

      const combined: any[] = [
        ...(applications?.map(app => ({
          type: 'application',
          data: app,
          created_at: app.created_at,
        })) || []),
        ...(interviews?.map(int => ({
          type: 'interview',
          data: int,
          created_at: int.created_at,
        })) || []),
        ...(offers?.map(off => ({
          type: 'offer',
          data: off,
          created_at: off.created_at,
        })) || []),
      ];

      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCandidateActivities(combined);
    } catch (error: any) {
      console.error('Error fetching candidate activities:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasActivities = activities.length > 0 || candidateActivities.length > 0;

  if (!hasActivities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No activity yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {candidateActivities.map((item, index) => {
            const isLast = index === candidateActivities.length - 1;
            let icon, label, description, badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

            if (item.type === 'application') {
              icon = FileText;
              const jobTitle = Array.isArray(item.data.job) ? item.data.job[0]?.title : item.data.job?.title;
              label = 'Applied to Job';
              description = jobTitle || 'Unknown position';
              
              if (item.data.state === 'rejected') {
                badgeVariant = 'destructive';
                label = 'Application Rejected';
              } else if (item.data.current_stage?.type === 'hired') {
                badgeVariant = 'default';
                label = 'Hired';
                description = `${jobTitle} - ${item.data.current_stage.name}`;
              } else if (item.data.current_stage) {
                badgeVariant = 'secondary';
                label = item.data.current_stage.name;
              }
            } else if (item.type === 'interview') {
              icon = Calendar;
              const jobTitle = Array.isArray(item.data.application?.job) 
                ? item.data.application?.job[0]?.title 
                : item.data.application?.job?.title;
              label = 'Interview Scheduled';
              description = `${item.data.title} - ${jobTitle}`;
              badgeVariant = 'secondary';
              
              if (item.data.status === 'completed') {
                label = 'Interview Completed';
              } else if (item.data.status === 'cancelled') {
                label = 'Interview Cancelled';
                badgeVariant = 'destructive';
              }
            } else if (item.type === 'offer') {
              icon = Mail;
              const jobTitle = Array.isArray(item.data.application?.job) 
                ? item.data.application?.job[0]?.title 
                : item.data.application?.job?.title;
              const amount = item.data.base_amount?.toLocaleString();
              const currency = item.data.currency || 'USD';
              description = `${jobTitle} - ${currency} ${amount}`;
              
              if (item.data.state === 'draft') {
                label = 'Offer Being Prepared';
                badgeVariant = 'secondary';
              } else if (item.data.state === 'pending_approval') {
                label = 'Offer Pending Approval';
                badgeVariant = 'secondary';
              } else if (item.data.state === 'approved') {
                label = 'Offer Approved';
                badgeVariant = 'default';
              } else if (item.data.state === 'sent') {
                label = 'Offer Sent';
                badgeVariant = 'default';
              } else if (item.data.state === 'accepted') {
                label = 'Offer Accepted';
                badgeVariant = 'default';
              } else if (item.data.state === 'declined') {
                label = 'Offer Declined';
                badgeVariant = 'destructive';
              } else if (item.data.state === 'expired') {
                label = 'Offer Expired';
                badgeVariant = 'destructive';
              }
            }

            const Icon = icon || FileText;

            return (
              <div key={`${item.type}-${item.data.id}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {!isLast && <div className="w-px h-full bg-border mt-1" />}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={badgeVariant} className="text-xs">
                      {label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {description}
                  </div>

                  {item.type === 'interview' && item.data.start_at && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Scheduled for: {format(new Date(item.data.start_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {activities.map((activity, index) => {
            const Icon = getEntityIcon(activity.entity);
            const isLast = index === activities.length - 1 && candidateActivities.length === 0;

            return (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {!isLast && <div className="w-px h-full bg-border mt-1" />}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getActionColor(activity.action)} className="text-xs">
                      {getActionLabel(activity.action)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>

                  <div className="text-sm">
                    {activity.actor ? (
                      <span>
                        <span className="font-medium">{activity.actor.full_name}</span>
                        {' '}
                        {activity.action === 'created' && `created a new ${activity.entity}`}
                        {activity.action === 'updated' && `updated the ${activity.entity}`}
                        {activity.action === 'stage_moved' && `moved the application to a new stage`}
                        {activity.action === 'state_changed' && `changed the application state`}
                        {activity.action === 'sent' && `sent a message`}
                        {activity.action === 'scheduled' && `scheduled an interview`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">System action</span>
                    )}
                  </div>

                  {activity.action === 'stage_moved' && activity.after_json?.current_stage_id && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Stage changed
                    </div>
                  )}

                  {activity.action === 'state_changed' && activity.after_json?.state && (
                    <div className="text-xs text-muted-foreground mt-1">
                      New state: <span className="font-medium">{activity.after_json.state}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
