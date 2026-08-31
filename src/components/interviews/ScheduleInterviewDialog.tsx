import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TimePickerAMPM } from '@/components/ui/time-picker-ampm';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  application_id: z.string().min(1, 'Application is required'),
  title: z.string().min(1, 'Title is required'),
  date: z.date({ required_error: 'Date is required' }),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  interview_type: z.enum(['onsite', 'virtual']),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
  panel_user_ids: z.array(z.string()).min(1, 'Select at least one interviewer'),
  status: z.enum(['scheduled', 'completed', 'no_show', 'cancelled']),
}).refine((data) => {
  if (data.interview_type === 'onsite') {
    return !!data.location;
  }
  return true;
}, {
  message: 'Location is required for onsite interviews',
  path: ['location'],
}).refine((data) => {
  if (data.interview_type === 'virtual') {
    return !!data.meeting_link && data.meeting_link.length > 0;
  }
  return true;
}, {
  message: 'Meeting link is required for virtual interviews',
  path: ['meeting_link'],
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  onSuccess,
}: ScheduleInterviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      interview_type: 'virtual',
      status: 'scheduled',
      panel_user_ids: [],
      start_time: '09:00',
      end_time: '10:00',
    },
  });

  const interviewType = form.watch('interview_type');

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [applicationsRes, usersRes] = await Promise.all([
        supabase
          .from('applications')
          .select('id, candidate:candidates(full_name), job:jobs(title)')
          .eq('state', 'active'),
        supabase.from('profiles').select('id, full_name'),
      ]);

      if (applicationsRes.error) throw applicationsRes.error;
      if (usersRes.error) throw usersRes.error;

      setApplications(applicationsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const startDateTime = new Date(values.date);
      const [startHour, startMinute] = values.start_time.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

      const endDateTime = new Date(values.date);
      const [endHour, endMinute] = values.end_time.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

      const { error } = await supabase.from('interviews').insert({
        application_id: values.application_id,
        title: values.title,
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        status: values.status,
        location: values.interview_type === 'onsite' ? values.location : null,
        meeting_link: values.interview_type === 'virtual' ? values.meeting_link : null,
        panel_user_ids: values.panel_user_ids,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Interview scheduled successfully',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="application_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Candidate Application</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select application" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {(app.candidate?.full_name || 'Unknown candidate')}
                          {' - '}
                          {(app.job?.title || 'Unknown role')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Technical Interview" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDatePickerOpen(false);
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <TimePickerAMPM value={field.value || "09:00"} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <TimePickerAMPM value={field.value || "10:00"} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interview_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {interviewType === 'virtual' && (
              <FormField
                control={form.control}
                name="meeting_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://meet.google.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {interviewType === 'onsite' && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Office address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="panel_user_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Panel</FormLabel>
                  <Popover open={panelPickerOpen} onOpenChange={setPanelPickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-between font-normal',
                            !field.value?.length && 'text-muted-foreground'
                          )}
                        >
                          {field.value?.length
                            ? `${field.value.length} interviewer(s) selected`
                            : 'Select interviewers'}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <div className="max-h-64 overflow-auto">
                        {users.filter(user => user != null).map((user) => {
                          const isSelected = field.value?.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                const currentValues = field.value || [];
                                if (isSelected) {
                                  field.onChange(currentValues.filter((v) => v !== user.id));
                                } else {
                                  field.onChange([...currentValues, user.id]);
                                }
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  isSelected ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {user.full_name}
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t p-2">
                        <Button
                          type="button"
                          size="sm"
                          className="w-full"
                          onClick={() => setPanelPickerOpen(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Schedule Interview
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
