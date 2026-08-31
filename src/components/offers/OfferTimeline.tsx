import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, Send, FileCheck, FileX, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Activity {
  id: string;
  action: string;
  created_at: string;
  before_json: any;
  after_json: any;
  actor_id: string;
  profiles?: {
    full_name: string;
  };
}

interface OfferTimelineProps {
  offerId: string;
}

export function OfferTimeline({ offerId }: OfferTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [offerId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          action,
          created_at,
          before_json,
          after_json,
          actor_id,
          profiles:actor_id(full_name)
        `)
        .eq('entity', 'offer')
        .eq('entity_id', offerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStateIcon = (state: string) => {
    const icons = {
      draft: <Clock className="h-5 w-5 text-muted-foreground" />,
      pending_approval: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      approved: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      sent: <Send className="h-5 w-5 text-blue-500" />,
      accepted: <FileCheck className="h-5 w-5 text-green-600" />,
      declined: <FileX className="h-5 w-5 text-red-500" />,
      expired: <XCircle className="h-5 w-5 text-gray-500" />,
    };
    return icons[state as keyof typeof icons] || <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  const getStateBadge = (state: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
      draft: 'outline',
      pending_approval: 'secondary',
      approved: 'success',
      sent: 'default',
      accepted: 'success',
      declined: 'destructive',
      expired: 'secondary',
    };
    return (
      <Badge variant={variants[state] || 'outline'}>
        {state.replace('_', ' ')}
      </Badge>
    );
  };

  const getActivityDescription = (activity: Activity) => {
    const beforeState = activity.before_json?.state;
    const afterState = activity.after_json?.state;

    if (activity.action === 'insert') {
      return (
        <div>
          <p className="font-medium">Offer created</p>
          <p className="text-sm text-muted-foreground">Initial state: {getStateBadge('draft')}</p>
        </div>
      );
    }

    if (activity.action === 'update' && beforeState !== afterState) {
      return (
        <div>
          <p className="font-medium">Status changed</p>
          <div className="flex items-center gap-2 mt-1">
            {beforeState && getStateBadge(beforeState)}
            <span className="text-muted-foreground">→</span>
            {afterState && getStateBadge(afterState)}
          </div>
        </div>
      );
    }

    if (activity.action === 'update') {
      return (
        <div>
          <p className="font-medium">Offer updated</p>
          <p className="text-sm text-muted-foreground">Details modified</p>
        </div>
      );
    }

    return (
      <div>
        <p className="font-medium capitalize">{activity.action}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No activity history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity, index) => {
            const currentState = activity.after_json?.state || activity.before_json?.state;
            
            return (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                    {getStateIcon(currentState)}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  {getActivityDescription(activity)}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{format(new Date(activity.created_at), 'MMM d, yyyy · h:mm a')}</span>
                    {activity.profiles?.full_name && (
                      <span>by {activity.profiles.full_name}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
