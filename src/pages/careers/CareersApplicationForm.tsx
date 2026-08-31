import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Upload, CheckCircle } from 'lucide-react';
import { sendApplicationConfirmation } from '@/lib/email-notifications';
import { parseResume } from '@/lib/resume-parser';
import { notifyNewApplication } from '@/lib/notifications';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const formSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  resume: z.any().refine(
    (file) => file?.length > 0,
    'Resume is required'
  ).refine(
    (file) => file?.[0]?.size <= MAX_FILE_SIZE,
    'Resume must be less than 5MB'
  ).refine(
    (file) => ACCEPTED_FILE_TYPES.includes(file?.[0]?.type),
    'Only PDF and Word documents are accepted'
  ),
  cover_letter: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the privacy policy',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const CareersApplicationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [orgId, setOrgId] = useState<string>('');
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      location: '',
      linkedin_url: '',
      cover_letter: '',
      consent: false,
    },
  });

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, org_id')
        .eq('id', id)
        .eq('status', 'open')
        .single();

      if (error) throw error;
      setJob(data);
      setOrgId(data.org_id);

      // Fetch custom questions
      const { data: questions, error: questionsError } = await supabase
        .from('application_questions')
        .select('*')
        .eq('job_id', id)
        .order('order_idx');

      if (questionsError) throw questionsError;
      setCustomQuestions(questions || []);
    } catch (error) {
      console.error('Error fetching job:', error);
      navigate('/careers');
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Use new secure edge function for public applications
      const file = values.resume[0];
      
      // Convert resume file to base64
      let resumeBase64 = null;
      if (file) {
        const reader = new FileReader();
        resumeBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      const { data, error } = await supabase.functions.invoke('submit-application', {
        body: {
          jobId: id!,
          candidate: {
            full_name: values.full_name,
            email: values.email,
            phone: values.phone || null,
            location: values.location || null,
            linkedin_url: values.linkedin_url || null,
          },
          cover_letter: values.cover_letter || null,
          resumeFile: file ? {
            name: file.name,
            size: file.size,
            type: file.type,
          } : null,
          resumeBase64,
        },
      });

      if (error) throw error;

      toast({
        title: "Application submitted!",
        description: "We've received your application and will be in touch soon.",
      });

      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h2 className="text-2xl">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for applying to the <strong>{job.title}</strong> position. 
              We've received your application and will review it shortly.
            </p>
            <div className="pt-4 space-y-2">
              <Button
                className="w-full"
                onClick={() => navigate('/careers')}
              >
                View More Jobs
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Submit Another Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/careers/jobs/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to job
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Apply for {job.title}</CardTitle>
            <p className="text-muted-foreground">
              Fill out the form below to submit your application
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco, CA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn Profile</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="resume"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Resume *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => onChange(e.target.files)}
                            {...field}
                          />
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        PDF or Word document (max 5MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cover_letter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Letter (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us why you're a great fit for this role..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {customQuestions.length > 0 && (
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="">Additional Questions</h3>
                    {customQuestions.map((question) => (
                      <div key={question.id} className="space-y-2">
                        <Label>
                          {question.question_text}
                          {question.is_required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        
                        {question.question_type === 'text' && (
                          <Input
                            value={customAnswers[question.id] || ''}
                            onChange={(e) => setCustomAnswers({ ...customAnswers, [question.id]: e.target.value })}
                            required={question.is_required}
                          />
                        )}

                        {question.question_type === 'textarea' && (
                          <Textarea
                            value={customAnswers[question.id] || ''}
                            onChange={(e) => setCustomAnswers({ ...customAnswers, [question.id]: e.target.value })}
                            rows={4}
                            required={question.is_required}
                          />
                        )}

                        {question.question_type === 'yes_no' && (
                          <Select
                            value={customAnswers[question.id] || ''}
                            onValueChange={(value) => setCustomAnswers({ ...customAnswers, [question.id]: value })}
                            required={question.is_required}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {question.question_type === 'multiple_choice' && question.options && (
                          <Select
                            value={customAnswers[question.id] || ''}
                            onValueChange={(value) => setCustomAnswers({ ...customAnswers, [question.id]: value })}
                            required={question.is_required}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option..." />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.map((option: string, index: number) => (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the processing of my personal data *
                        </FormLabel>
                        <FormDescription>
                          We'll use your information only for recruitment purposes
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Application
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CareersApplicationForm;
