import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { notifyUserCreated } from '@/lib/notifications';

interface InviteUserDialogProps {
  onInviteSuccess: () => void;
}

type Mode = 'create' | 'transfer';

export const InviteUserDialog = ({ onInviteSuccess }: InviteUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<'basic' | 'job_admin' | 'site_admin'>('basic');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchJobs();
    }
  }, [open]);

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPassword('');
    setConfirmPassword('');
    setDepartment('');
    setRole('basic');
    setSelectedJobs([]);
    setMode('create');
  };

  const fetchJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const { data, error } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('org_id', profile.org_id)
      .eq('status', 'open')
      .order('title');

    if (!error && data) {
      setJobs(data);
    }
  };

  const toggleJob = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleInvite = async () => {
    if (!email || !fullName || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to invite users');
      }

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          fullName,
          password,
          department: department || null,
          role,
          jobIds: selectedJobs,
        },
      });

      let errorMessage: string | undefined;
      
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        errorMessage = data.error as string;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      }
      
      if (errorMessage || !data?.success) {
        throw new Error(errorMessage || 'Failed to invite user');
      }

      toast({
        title: 'Success',
        description: `User created successfully. They can now log in with their email and password.`,
      });

      // Send notification about new user
      if (data?.userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          notifyUserCreated(data.userId, fullName, profile.org_id, session.user.id);
        }
      }

      setOpen(false);
      resetForm();
      onInviteSuccess();
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

  const handleTransfer = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter the email of the user to transfer',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to transfer users');
      }

      const { data, error } = await supabase.functions.invoke('transfer-user', {
        body: {
          email,
          role,
          department: department || null,
          jobIds: selectedJobs,
        },
      });

      let errorMessage: string | undefined;
      
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        errorMessage = data.error as string;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      }
      
      if (errorMessage || !data?.success) {
        throw new Error(errorMessage || 'Failed to transfer user');
      }

      toast({
        title: 'Success',
        description: `User "${data.user?.full_name || email}" has been transferred to your organization.`,
      });

      setOpen(false);
      resetForm();
      onInviteSuccess();
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
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {mode === 'create' ? 'Create New User' : 'Add Existing User'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'create' 
              ? 'Create a new account for a team member'
              : 'Transfer an existing user from another organization'
            }
          </p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Mode Toggle */}
          <div className="flex rounded-lg border p-1 bg-muted/30 mb-6">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                mode === 'create'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create New
            </button>
            <button
              type="button"
              onClick={() => setMode('transfer')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                mode === 'transfer'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Add Existing
            </button>
          </div>

          <div className="space-y-5">
            {/* Account Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm text-foreground uppercase tracking-wide">
                Account Details
              </h3>
              
              {/* Name field - only for create mode */}
              {mode === 'create' && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                />
              </div>

              {/* Password fields - only for create mode */}
              {mode === 'create' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Role & Access Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm text-foreground uppercase tracking-wide">
                Role & Access
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Department */}
                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department
                  </Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Permission Level
                  </Label>
                  <Select value={role} onValueChange={(value: any) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="job_admin">Job Admin</SelectItem>
                      <SelectItem value="site_admin">Site Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Job Assignment Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-foreground uppercase tracking-wide">
                  Assign to Jobs
                </h3>
                {selectedJobs.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {selectedJobs.length} selected
                  </span>
                )}
              </div>
              <div className="border rounded-lg p-3 max-h-[140px] overflow-y-auto bg-muted/20">
                {jobs.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No open jobs to assign
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <div key={job.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={job.id}
                          checked={selectedJobs.includes(job.id)}
                          onCheckedChange={() => toggleJob(job.id)}
                        />
                        <label
                          htmlFor={job.id}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                        >
                          {job.title}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="flex gap-3 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={mode === 'create' ? handleInvite : handleTransfer} 
            disabled={loading} 
            className="flex-1"
          >
            {loading 
              ? (mode === 'create' ? 'Creating...' : 'Transferring...') 
              : (mode === 'create' ? 'Create User' : 'Transfer User')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
