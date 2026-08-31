import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
interface ActivityItemProps {
  avatarUrl: string | null;
  username: string;
  action: string;
  timeAgo: string;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const ActivityItem: React.FC<ActivityItemProps> = ({
  avatarUrl,
  username,
  action,
  timeAgo
}) => {
  return (
    <div className="flex w-full items-start gap-3 py-2 first:pt-0">
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          className="w-8 h-8 rounded-md shrink-0 object-cover" 
          alt={`${username} avatar`} 
        />
      ) : (
        <div className="w-8 h-8 rounded-md shrink-0 bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-medium text-primary">
            {getInitials(username)}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">
          <span className="text-primary font-semibold">{username}</span>
          {' '}
          <span className="text-muted-foreground">{action}</span>
        </p>
      </div>
      <span className="text-muted-foreground text-xs whitespace-nowrap shrink-0">
        {timeAgo}
      </span>
    </div>
  );
};
const RecentActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchActivities();
  }, []);
  const fetchActivities = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('activities').select(`
          *,
          actor:profiles(full_name, avatar_url)
        `).order('created_at', {
        ascending: false
      }).limit(6);
      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }
      const formattedActivities = await Promise.all(data?.map(async activity => {
        const action = await formatAction(activity);
        return {
          avatarUrl: activity.actor?.avatar_url || null,
          username: activity.actor?.full_name || 'System',
          action,
          timeAgo: formatDistanceToNow(new Date(activity.created_at), {
            addSuffix: true
          })
        };
      }) || []);
      console.log('Formatted activities:', formattedActivities);
      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };
  const formatAction = async (activity: any): Promise<string> => {
    const {
      entity,
      action,
      after_json,
      before_json
    } = activity;
    console.log('Formatting activity:', {
      entity,
      action,
      after_json,
      before_json
    });

    // Handle stage_moved for applications
    if (entity === 'application' && action === 'stage_moved') {
      try {
        const oldStageId = before_json?.current_stage_id;
        const newStageId = after_json?.current_stage_id;
        const candidateId = after_json?.candidate_id;
        const jobId = after_json?.job_id;
        console.log('Fetching stage_moved data:', {
          oldStageId,
          newStageId,
          candidateId,
          jobId
        });

        // Fetch old stage, new stage, candidate, and job details
        const [oldStageData, newStageData, candidateData, jobData] = await Promise.all([oldStageId ? supabase.from('job_stages').select('name').eq('id', oldStageId).single() : Promise.resolve(null), newStageId ? supabase.from('job_stages').select('name').eq('id', newStageId).single() : Promise.resolve(null), candidateId ? supabase.from('candidates').select('full_name').eq('id', candidateId).single() : Promise.resolve(null), jobId ? supabase.from('jobs').select('title').eq('id', jobId).single() : Promise.resolve(null)]);
        console.log('Fetched stage_moved details:', {
          oldStage: oldStageData,
          newStage: newStageData,
          candidate: candidateData,
          job: jobData
        });
        const oldStageName = oldStageData?.data?.name;
        const newStageName = newStageData?.data?.name || 'new stage';
        const candidateName = candidateData?.data?.full_name || 'candidate';
        const jobTitle = jobData?.data?.title || 'job';
        if (oldStageName) {
          return `moved ${candidateName} from "${oldStageName}" to "${newStageName}" for ${jobTitle}`;
        }
        return `moved ${candidateName} to "${newStageName}" for ${jobTitle}`;
      } catch (error) {
        console.error('Error formatting stage_moved action:', error);
        return 'moved an application to a new stage';
      }
    }

    // Handle other application actions
    if (entity === 'application') {
      const candidateId = after_json?.candidate_id;
      const jobId = after_json?.job_id;
      if (candidateId && jobId) {
        try {
          const [candidateData, jobData] = await Promise.all([supabase.from('candidates').select('full_name').eq('id', candidateId).single(), supabase.from('jobs').select('title').eq('id', jobId).single()]);
          const candidateName = candidateData?.data?.full_name || 'candidate';
          const jobTitle = jobData?.data?.title || 'job';
          if (action === 'created') {
            return `received application from ${candidateName} for ${jobTitle}`;
          }
          if (action === 'state_changed') {
            const newState = after_json?.state;
            return `changed ${candidateName}'s application for ${jobTitle} to ${newState}`;
          }
          if (action === 'updated') {
            return `updated ${candidateName}'s application for ${jobTitle}`;
          }
        } catch (error) {
          console.error('Error formatting application action:', error);
        }
      }
    }

    // Handle interview actions
    if (entity === 'interview') {
      const applicationId = after_json?.application_id;
      if (applicationId) {
        try {
          const {
            data: appData
          } = await supabase.from('applications').select('candidate:candidates(full_name), job:jobs(title)').eq('id', applicationId).single();
          const candidateName = appData?.candidate?.full_name || 'candidate';
          const jobTitle = appData?.job?.title || 'job';
          if (action === 'created') return `scheduled interview with ${candidateName} for ${jobTitle}`;
          if (action === 'updated') return `updated interview with ${candidateName} for ${jobTitle}`;
          if (action === 'deleted') return `cancelled interview with ${candidateName} for ${jobTitle}`;
        } catch (error) {
          console.error('Error formatting interview action:', error);
        }
      }
    }

    // Handle job actions
    if (entity === 'job') {
      const jobTitle = after_json?.title;
      if (action === 'created' && jobTitle) {
        return `posted "${jobTitle}"`;
      }
      if (action === 'status_changed' && jobTitle) {
        const newStatus = after_json?.status || 'updated';
        return `changed "${jobTitle}" status to ${newStatus}`;
      }
    }

    // Handle offer actions
    if (entity === 'offer') {
      const applicationId = after_json?.application_id;
      if (applicationId) {
        try {
          const {
            data: appData
          } = await supabase.from('applications').select('candidate:candidates(full_name), job:jobs(title)').eq('id', applicationId).single();
          const candidateName = appData?.candidate?.full_name || 'candidate';
          const jobTitle = appData?.job?.title || 'job';
          if (action === 'insert') return `created offer for ${candidateName} - ${jobTitle}`;
          if (action === 'update') {
            const oldState = before_json?.state;
            const newState = after_json?.state;
            if (oldState !== newState) {
              return `changed offer for ${candidateName} to ${newState}`;
            }
            return `updated offer for ${candidateName}`;
          }
        } catch (error) {
          console.error('Error formatting offer action:', error);
        }
      }
    }

    // Fallback to simple action mapping
    const actionMap: Record<string, Record<string, string>> = {
      application: {
        created: 'submitted an application',
        updated: 'updated an application',
        deleted: 'withdrew an application'
      },
      candidate: {
        created: 'added a new candidate',
        updated: 'updated a candidate profile',
        deleted: 'removed a candidate'
      },
      job: {
        created: 'posted a new job',
        updated: 'updated a job listing',
        deleted: 'closed a job listing'
      },
      interview: {
        created: 'scheduled an interview',
        updated: 'updated an interview',
        deleted: 'cancelled an interview'
      },
      offer: {
        created: 'created an offer',
        updated: 'updated an offer',
        deleted: 'withdrew an offer'
      }
    };
    return actionMap[entity]?.[action] || `${action} ${entity}`;
  };
  if (loading) {
    return <section className="justify-end items-stretch flex min-w-60 flex-col overflow-hidden flex-1 shrink basis-[0%] bg-card pt-[17px] px-4 rounded-xl max-md:max-w-full">
        <h2 className="text-foreground text-sm font-[590]">
          Recent Activity
        </h2>
        <div className="w-full mt-4 space-y-4 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-md flex-shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-16 flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>;
  }
  return <section className="justify-end items-stretch flex min-w-60 flex-col overflow-hidden flex-1 shrink basis-[0%] bg-card pt-[17px] px-4 rounded-xl max-md:max-w-full">
      <h2 className="text-foreground text-sm font-[590]">
        Recent Activity
      </h2>
      <div className="w-full mt-4 max-h-[400px] overflow-y-auto max-md:max-w-full my-px mx-0 py-[12px]">
        {activities.length === 0 ? <p className="text-muted-foreground text-sm py-4">No recent activity</p> : activities.map((activity, index) => <ActivityItem key={index} avatarUrl={activity.avatarUrl} username={activity.username} action={activity.action} timeAgo={activity.timeAgo} />)}
      </div>
    </section>;
};
export default RecentActivityFeed;