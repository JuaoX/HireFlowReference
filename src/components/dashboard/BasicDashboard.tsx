import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NextMeetingCard from "@/components/dashboard/NextMeetingCard";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import listIcon from "@/assets/icons/list-icon.svg";
import usersIcon from "@/assets/icons/users-icon.svg";
import messageIcon from "@/assets/icons/message-icon.svg";
import checkVerifiedIcon from "@/assets/icons/check-verified-icon.svg";
import { MetricCardSkeleton } from "@/components/dashboard/MetricCardSkeleton";
import { CandidatesCardSkeleton } from "@/components/dashboard/CandidatesCardSkeleton";
import { JobListingsCardSkeleton } from "@/components/dashboard/JobListingsCardSkeleton";

export function BasicDashboard() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoadingDemo, setIsLoadingDemo] = useState(() => {
    return sessionStorage.getItem('demo-reset-in-progress') === 'true';
  });
  const [metrics, setMetrics] = useState({
    currentListings: 0,
    totalApplicants: 0,
    interviewing: 0,
    shortlisted: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const userRole = roleData?.role;

      // Fetch assigned jobs through job_acl
      const { data: aclData } = await supabase
        .from('job_acl')
        .select('job_id, jobs(id, title, location, created_at, status)')
        .eq('user_id', user.id)
        .eq('can_view', true);

      const assignedJobs = aclData?.map(acl => acl.jobs).filter(Boolean) || [];
      setJobs(assignedJobs as any);

      // Fetch candidates for assigned jobs
      const jobIds = assignedJobs.map((j: any) => j.id);
      if (jobIds.length > 0) {
        // Build applications query
        let applicationsQuery = supabase
          .from('applications')
          .select('*, candidates(*), jobs(title)')
          .in('job_id', jobIds)
          .eq('state', 'active')
          .order('applied_at', { ascending: false })
          .limit(10);

        // For basic users (Collaborators), only show candidates assigned to them
        if (userRole === 'basic') {
          applicationsQuery = applicationsQuery.eq('owner_user_id', user.id);
        }

        const { data: applicationsData } = await applicationsQuery;
        setCandidates(applicationsData || []);

        // Build metrics query
        let metricsQuery = supabase
          .from('applications')
          .select('id, state, current_stage_id, owner_user_id, job_stages(type)')
          .in('job_id', jobIds);

        // For basic users, only count their assigned candidates
        if (userRole === 'basic') {
          metricsQuery = metricsQuery.eq('owner_user_id', user.id);
        }

        const { data: allApplications } = await metricsQuery;

        const activeApplications = allApplications?.filter(a => a.state === 'active') || [];
        const interviewing = activeApplications.filter(a => 
          ['phone', 'onsite'].includes(a.job_stages?.type || '')
        ).length;
        const shortlisted = activeApplications.filter(a => 
          a.job_stages?.type === 'offer'
        ).length;

        setMetrics({
          currentListings: assignedJobs.length,
          totalApplicants: allApplications?.length || 0,
          interviewing,
          shortlisted,
        });
      }
    };

    // If demo reset in progress, wait for the event
    if (isLoadingDemo) {
      const handleDemoDataRefresh = () => {
        setIsLoadingDemo(false);
        fetchData();
      };
      window.addEventListener('demo-data-refreshed', handleDemoDataRefresh);
      return () => window.removeEventListener('demo-data-refreshed', handleDemoDataRefresh);
    } else {
      fetchData();
    }

    // Also listen for future demo data refresh events
    const handleDemoDataRefresh = () => {
      fetchData();
    };
    window.addEventListener('demo-data-refreshed', handleDemoDataRefresh);
    return () => window.removeEventListener('demo-data-refreshed', handleDemoDataRefresh);
  }, [isLoadingDemo]);

  const metricCards = [
    {
      title: "Current Listings",
      value: metrics.currentListings,
      bgColor: "bg-[#D4F4DD]",
      iconColor: "text-[#4A7C59]",
      hoverBorder: "hover:border-[#2E7D32]",
      link: "/jobs",
      icon: listIcon,
    },
    {
      title: "Total Applicants",
      value: metrics.totalApplicants,
      bgColor: "bg-[#FFE5CC]",
      iconColor: "text-[#CC7A3D]",
      hoverBorder: "hover:border-[#F57C00]",
      link: "/candidates",
      icon: usersIcon,
    },
    {
      title: "Interviewing",
      value: metrics.interviewing,
      bgColor: "bg-[#CCE5FF]",
      iconColor: "text-[#3D7ACC]",
      hoverBorder: "hover:border-[#1976D2]",
      link: "/interviews",
      icon: messageIcon,
    },
    {
      title: "Shortlisted",
      value: metrics.shortlisted,
      bgColor: "bg-[#FFD9E5]",
      iconColor: "text-[#CC5C7A]",
      hoverBorder: "hover:border-[#C2185B]",
      link: "/candidates",
      icon: checkVerifiedIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Dashboard</h1>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {isLoadingDemo ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          metricCards.map((metric) => (
            <Card /* theme-exempt: decorative pastel cards */
              key={metric.title}
              className={`hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-2 border-transparent ${metric.hoverBorder} ${metric.bgColor}`}
              onClick={() => navigate(metric.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <img src={metric.icon} alt="" className="w-4 h-4 flex-shrink-0" />
                  <CardTitle className="text-sm font-medium !text-black">{metric.title}</CardTitle>
                </div>
                <ChevronRight className={`h-4 w-4 ${metric.iconColor}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-4xl font-bold !text-black">{metric.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Candidates to Review and Job Listings */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Candidates to Review */}
        {isLoadingDemo ? (
          <CandidatesCardSkeleton />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Candidates to Review</CardTitle>
                <Badge variant="secondary" className="rounded-full">
                  {candidates.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No candidates to review</p>
              ) : (
                candidates.map((application) => (
                  <div 
                    key={application.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/applications/${application.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={application.candidates?.avatar_url} />
                        <AvatarFallback>
                          {application.candidates?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{application.candidates?.full_name}</p>
                        <p className="text-sm text-muted-foreground">Applying for: {application.jobs?.title}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      {application.state === 'active' ? (
                        <>
                          <Clock className="h-3 w-3" />
                          Pending
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Reviewed
                        </>
                      )}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Job Listings */}
        {isLoadingDemo ? (
          <JobListingsCardSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Job Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div>Title</div>
                  <div>Location</div>
                  <div>Date Opened</div>
                  <div className="text-right"># of Candidates</div>
              </div>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No jobs assigned</p>
              ) : (
                jobs.map((job: any) => (
                  <div 
                    key={job.id}
                    className="grid grid-cols-4 gap-4 text-sm py-3 hover:bg-accent rounded-lg px-2 cursor-pointer transition-colors items-center"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="font-medium">{job.title}</div>
                    <div className="text-muted-foreground">{job.location || 'Remote'}</div>
                    <div className="text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-primary font-semibold">
                        {metrics.totalApplicants}
                      </Badge>
                      <ChevronRight className="h-4 w-4 inline ml-2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Next Meeting and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <NextMeetingCard />
        <RecentActivityFeed />
      </div>
    </div>
  );
}
