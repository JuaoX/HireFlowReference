import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  candidate_id: z.string().min(1, 'Please select a candidate'),
  job_id: z.string().min(1, 'Please select a job'),
});

type FormValues = z.infer<typeof formSchema>;

const ApplicationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidate_id: '',
      job_id: '',
    },
  });

  useEffect(() => {
    fetchData();
    
    // Refetch data when window gains focus to catch newly created jobs
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchData = async () => {
    try {
      const [candidatesRes, jobsRes] = await Promise.all([
        supabase.from('candidates').select('id, full_name, email').order('full_name'),
        supabase.from('jobs')
          .select('id, title, department, status')
          .in('status', ['draft', 'pending_approval', 'open'])
          .order('title'),
      ]);

      if (candidatesRes.error) {
        console.error('Error fetching candidates:', candidatesRes.error);
        throw candidatesRes.error;
      }
      if (jobsRes.error) {
        console.error('Error fetching jobs:', jobsRes.error);
        throw jobsRes.error;
      }

      console.log('Candidates loaded:', candidatesRes.data?.length || 0);
      console.log('Jobs loaded:', jobsRes.data?.length || 0);

      setCandidates(candidatesRes.data || []);
      setJobs(jobsRes.data || []);
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Get the first stage for the job
      const { data: stages, error: stagesError } = await supabase
        .from('job_stages')
        .select('id')
        .eq('job_id', values.job_id)
        .order('order_idx')
        .limit(1);

      if (stagesError) throw stagesError;

      const { error } = await supabase.from('applications').insert({
        candidate_id: values.candidate_id,
        job_id: values.job_id,
        current_stage_id: stages?.[0]?.id || null,
        state: 'active',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Application created successfully',
      });

      navigate('/applications');
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl">New Application</h1>
        <p className="text-muted-foreground">Create a new job application</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="candidate_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a candidate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {candidates.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No candidates found
                          </div>
                        ) : (
                          candidates.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {candidate.full_name} ({candidate.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="job_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {jobs.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No jobs found
                          </div>
                        ) : (
                          jobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title} {job.department && `- ${job.department}`}
                              {job.status !== 'open' && ` (${job.status})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Application
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/applications')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationForm;
