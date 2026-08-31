import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
}

interface ManagerAssignmentDropdownProps {
  applicationId: string;
  currentManagerId: string | null;
  currentManagerName: string | null;
  onUpdate?: () => void;
}

export const ManagerAssignmentDropdown = ({
  applicationId,
  currentManagerId,
  currentManagerName,
  onUpdate,
}: ManagerAssignmentDropdownProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen]);

  const fetchTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;

      if (!profile) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('org_id', profile.org_id)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleAssign = async (userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ owner_user_id: userId === 'unassign' ? null : userId })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Manager Updated',
        description: userId === 'unassign' 
          ? 'Manager has been unassigned' 
          : 'Manager has been assigned successfully',
      });

      onUpdate?.();
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
    <Select
      value={currentManagerId || ''}
      onValueChange={handleAssign}
      onOpenChange={setIsOpen}
      disabled={loading}
    >
      <SelectTrigger 
        className="w-[160px] h-8 text-sm border-none bg-transparent hover:bg-accent/50 focus:ring-0"
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue>
          <div className="flex items-center gap-2 text-left">
            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className={`truncate ${currentManagerName ? 'font-medium' : 'text-muted-foreground'}`}>
              {currentManagerName || 'Assign...'}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        <SelectItem value="unassign">
          <span className="text-muted-foreground">Unassign</span>
        </SelectItem>
        {teamMembers.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            {member.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
