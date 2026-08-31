import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Users, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string;
  openings: number;
  description_md: string | null;
  requirements_md: string | null;
  created_at: string;
}

const CareersJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('status', 'open')
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEmploymentType = (type: string) => {
    return type.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl">Job not found</h2>
          <p className="text-muted-foreground">This position may no longer be available</p>
          <Button onClick={() => navigate('/careers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Careers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/careers')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to all jobs
          </Button>
          
          <h1 className="text-3xl md:text-4xl mb-4">{job.title}</h1>
          
          <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
            {job.department && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>{job.department}</span>
              </div>
            )}
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Posted {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline">{formatEmploymentType(job.employment_type)}</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {job.description_md && (
              <Card>
                <CardHeader>
                  <CardTitle>About the Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {job.description_md}
                  </div>
                </CardContent>
              </Card>
            )}

            {job.requirements_md && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {job.requirements_md}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Apply CTA */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Apply for this position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Join our team and make an impact. We're excited to review your application.
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate(`/careers/jobs/${job.id}/apply`)}
                >
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareersJobDetail;
