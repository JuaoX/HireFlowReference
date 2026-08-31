import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { InviteUserDialog } from './InviteUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { notifyRoleChanged } from '@/lib/notifications';

interface User {
  id: string;
  full_name: string;
  email: string;
  status: string;
  role: string;
  department: string;
  listings_count: number;
  avatar_url?: string | null;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setCurrentUserEmail(user.email);
    }
  };

  const fetchUsers = async () => {
    try {
      // Get current user's org_id first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!currentProfile) {
        setLoading(false);
        return;
      }

      // Filter profiles by same org_id
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', currentProfile.org_id)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();

          // If user has no role, auto-fix by assigning 'basic' role
          let role = roleData?.role;
          if (!role) {
            const { error: fixRoleError } = await supabase
              .from('user_roles')
              .insert({ user_id: profile.id, role: 'basic' });
            
            if (!fixRoleError) {
              role = 'basic';
              console.log(`Auto-fixed missing role for user ${profile.email}`);
            }
          }

          // Get job assignments count
          const { data: jobAcl } = await supabase
            .from('job_acl')
            .select('job_id')
            .eq('user_id', profile.id);

          const department = profile.department || '-';
          const listings_count = jobAcl?.length || 0;

          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            status: profile.status,
            role: role || 'basic',
            department,
            listings_count,
            avatar_url: profile.avatar_url,
          };
        })
      );

      setUsers(usersWithRoles);
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

  const handleRoleChange = async (userId: string, newRole: 'basic' | 'job_admin' | 'site_admin') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get target user info for notification
      const targetUser = users.find(u => u.id === userId);

      // Delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      // Send notification about role change
      if (targetUser) {
        notifyRoleChanged(userId, targetUser.full_name, newRole, user.id);
      }

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      basic: 'Can View',
      job_admin: 'Can Edit',
      site_admin: 'Admin',
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl">Team Members</h1>
        </div>
        <InviteUserDialog onInviteSuccess={fetchUsers} />
      </div>

      <div className="bg-card rounded-lg p-4">
        <Table className="border-separate border-spacing-y-2">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-0">
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[220px]">Email</TableHead>
              <TableHead className="w-[150px]">Department</TableHead>
              <TableHead className="w-[100px]"># of Listings</TableHead>
              <TableHead className="w-[130px]">Permissions</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer hover:bg-accent/50 border-0"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderRadius: '8px',
                }}
                onClick={() => {
                  setEditingUser(user);
                  setEditDialogOpen(true);
                }}
              >
                <TableCell className="rounded-l-lg">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-[30px] w-[30px]">
                      <AvatarImage src={user.avatar_url || ''} alt={user.full_name} />
                      <AvatarFallback className="text-xs">
                        {user.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-[14px]">{user.full_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-primary font-semibold text-[14px]">{user.email}</span>
                </TableCell>
                <TableCell>
                  <span className="text-foreground font-medium text-[14px]">{user.department}</span>
                </TableCell>
                <TableCell>
                  <span className="text-foreground font-medium text-[14px]">{user.listings_count}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-between">
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as 'basic' | 'job_admin' | 'site_admin')}
                      disabled={user.email === 'demo@hireflow.app' && currentUserEmail === 'demo@hireflow.app'}
                    >
                      <SelectTrigger 
                        className="w-[106px] h-[30px] text-[12px] font-medium border-border"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue>{getRoleLabel(user.role)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Can View</SelectItem>
                        <SelectItem value="job_admin">Can Edit</SelectItem>
                        <SelectItem value="site_admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
                <TableCell className="rounded-r-lg">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={editingUser}
        onUpdateSuccess={fetchUsers}
      />
    </div>
  );
};
