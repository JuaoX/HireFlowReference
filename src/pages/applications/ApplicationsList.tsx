import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Search, X, ChevronRight, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Application {
  id: string;
  applied_at: string;
  state: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
  };
  job: {
    id: string;
    title: string;
    department: string;
  };
  current_stage?: {
    id: string;
    name: string;
  };
}

const ApplicationsList = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          applied_at,
          state,
          candidate:candidates(id, full_name, email),
          job:jobs(id, title, department),
          current_stage:job_stages(id, name)
        `)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
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

  const getStateBadgeColor = (state: string) => {
    const colors: Record<string, string> = {
      active: 'bg-blue-50 text-blue-700 border-blue-300',
      hired: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      rejected: 'bg-rose-50 text-rose-700 border-rose-300',
      withdrawn: 'bg-slate-50 text-slate-700 border-slate-300',
    };
    return colors[state] || 'bg-slate-50 text-slate-700 border-slate-300';
  };

  const filteredApplications = applications
    .filter((app) => {
      // Filter out applications with missing candidate or job data
      if (!app.candidate || !app.job) return false;

      const matchesSearch =
        app.candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || app.state === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      } else {
        return a.candidate?.full_name.localeCompare(b.candidate?.full_name) || 0;
      }
    });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('date');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || sortBy !== 'date';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Applications</h1>
        </div>
        <Button onClick={() => navigate('/applications/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by candidate name, email, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-input"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: 'date' | 'name') => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date (Newest)</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg mb-2">No applications found</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating your first application'}
          </p>
          {!hasActiveFilters && (
            <Button onClick={() => navigate('/applications/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-lg p-4">
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead>Candidate</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Current Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="space-y-1">
              {filteredApplications.map((app) => (
                <TableRow 
                  key={app.id}
                  className="cursor-pointer hover:bg-accent/50 border-0 mb-1"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderRadius: '8px',
                    display: 'table-row'
                  }}
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <TableCell className="font-medium rounded-l-lg">{app.candidate.full_name}</TableCell>
                  <TableCell>{app.candidate.email}</TableCell>
                  <TableCell className="text-blue-600 font-medium">{app.job.title}</TableCell>
                  <TableCell>{app.job.department || '-'}</TableCell>
                  <TableCell>{app.current_stage?.name || 'Not assigned'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${getStateBadgeColor(app.state)}`}>
                      {app.state}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(app.applied_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="rounded-r-lg">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ApplicationsList;
