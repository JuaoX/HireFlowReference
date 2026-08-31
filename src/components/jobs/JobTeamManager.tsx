import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2, Shield, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PERMISSION_PRESETS, getPresetById, detectPresetFromPermissions, PermissionPreset } from '@/lib/permission-presets';

type AppRole = 'basic' | 'job_admin' | 'site_admin';

interface JobTeamMember {
  id: string;
  user_id: string;
  can_view: boolean;
  can_move_pipeline: boolean;
  can_message: boolean;
  can_view_offer: boolean;
  user: {
    full_name: string;
    email: string;
  } | null;
  role?: AppRole;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role?: AppRole;
}

interface JobTeamManagerProps {
  jobId: string;
}

// Permission matrix: which permissions can each role have toggled
const ROLE_PERMISSION_MATRIX: Record<AppRole, Record<string, boolean>> = {
  basic: {
    can_view: true,
    can_move_pipeline: false,
    can_message: false,
    can_view_offer: false,
  },
  job_admin: {
    can_view: true,
    can_move_pipeline: true,
    can_message: true,
    can_view_offer: true,
  },
  site_admin: {
    can_view: true,
    can_move_pipeline: true,
    can_message: true,
    can_view_offer: true,
  },
};

// Which presets are available for each role
const ROLE_PRESET_FILTER: Record<AppRole, string[]> = {
  basic: ['viewer', 'custom'], // Basic users can only be Viewer or Custom (with view only)
  job_admin: ['viewer', 'interviewer', 'recruiter', 'hiring_manager', 'custom'],
  site_admin: ['viewer', 'interviewer', 'recruiter', 'hiring_manager', 'custom'],
};

const canTogglePermission = (role: AppRole | undefined, permission: string): boolean => {
  if (!role) return true; // Default to allowing if role unknown
  return ROLE_PERMISSION_MATRIX[role]?.[permission] ?? false;
};

const getRoleBadgeVariant = (role: AppRole | undefined): "default" | "secondary" | "outline" => {
  switch (role) {
    case 'site_admin':
      return 'default';
    case 'job_admin':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getRoleLabel = (role: AppRole | undefined): string => {
  switch (role) {
    case 'site_admin':
      return 'Site Admin';
    case 'job_admin':
      return 'Job Admin';
    case 'basic':
      return 'Basic';
    default:
      return 'Unknown';
  }
};

export const JobTeamManager = ({ jobId }: JobTeamManagerProps) => {
  const [teamMembers, setTeamMembers] = useState<JobTeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('recruiter');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    can_view: true,
    can_move_pipeline: false,
    can_message: false,
    can_view_offer: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
    fetchAvailableUsers();
  }, [jobId]);

  // When selected user changes, reset preset to an appropriate default for their role
  useEffect(() => {
    if (selectedUser) {
      const user = availableUsers.find(u => u.id === selectedUser);
      const role = user?.role || 'basic';
      const availablePresets = ROLE_PRESET_FILTER[role];
      
      // If current preset is not available for this role, reset to first available
      if (!availablePresets.includes(selectedPreset)) {
        setSelectedPreset(availablePresets[0] || 'viewer');
      }
    }
  }, [selectedUser, availableUsers]);

  const fetchTeamMembers = async () => {
    try {
      // First fetch job_acl with user profiles
      const { data: aclData, error: aclError } = await supabase
        .from('job_acl')
        .select(`
          *,
          user:profiles!job_acl_user_id_fkey(full_name, email)
        `)
        .eq('job_id', jobId);

      if (aclError) throw aclError;

      // Then fetch roles for all users in the team
      const userIds = (aclData || []).map(m => m.user_id);
      
      if (userIds.length > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) throw rolesError;

        // Create a map of user_id to role
        const roleMap = new Map<string, AppRole>();
        rolesData?.forEach(r => roleMap.set(r.user_id, r.role as AppRole));

        // Merge roles into team members
        const membersWithRoles = (aclData || []).map(member => ({
          ...member,
          role: roleMap.get(member.user_id) || 'basic' as AppRole,
        }));

        setTeamMembers(membersWithRoles);
      } else {
        setTeamMembers([]);
      }
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

  const fetchAvailableUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('org_id', profile.org_id);

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const userIds = (profilesData || []).map(p => p.id);
      
      if (userIds.length > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) throw rolesError;

        // Create a map of user_id to role
        const roleMap = new Map<string, AppRole>();
        rolesData?.forEach(r => roleMap.set(r.user_id, r.role as AppRole));

        // Merge roles into users
        const usersWithRoles = (profilesData || []).map(user => ({
          ...user,
          role: roleMap.get(user.id) || 'basic' as AppRole,
        }));

        setAvailableUsers(usersWithRoles);
      } else {
        setAvailableUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;

    try {
      const selectedUserData = availableUsers.find(u => u.id === selectedUser);
      const userRole = selectedUserData?.role || 'basic';
      
      // Get preset permissions or custom permissions
      let perms = selectedPreset === 'custom'
        ? permissions
        : getPresetById(selectedPreset)?.permissions || permissions;

      // Enforce role restrictions - basic users cannot have certain permissions
      if (userRole === 'basic') {
        perms = {
          ...perms,
          can_move_pipeline: false,
          can_message: false,
          can_view_offer: false,
        };
      }

      const { error } = await supabase
        .from('job_acl')
        .insert({
          job_id: jobId,
          user_id: selectedUser,
          ...perms,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team member added successfully',
      });

      setDialogOpen(false);
      setSelectedUser('');
      setSelectedPreset('recruiter');
      setPermissions({
        can_view: true,
        can_move_pipeline: false,
        can_message: false,
        can_view_offer: false,
      });
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePermission = async (
    memberId: string,
    field: keyof typeof permissions,
    value: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('job_acl')
        .update({ [field]: value })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permission updated',
      });

      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async () => {
    if (!deletingMemberId) return;

    try {
      const { error } = await supabase
        .from('job_acl')
        .delete()
        .eq('id', deletingMemberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team member removed',
      });

      setDeleteDialogOpen(false);
      setDeletingMemberId(null);
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getAvailableUsersForAdd = () => {
    const existingUserIds = new Set(teamMembers.map(m => m.user_id));
    return availableUsers.filter(u => !existingUserIds.has(u.id));
  };

  const getAvailablePresetsForSelectedUser = (): PermissionPreset[] => {
    const user = availableUsers.find(u => u.id === selectedUser);
    const role = user?.role || 'basic';
    const allowedPresetIds = ROLE_PRESET_FILTER[role];
    return PERMISSION_PRESETS.filter(p => allowedPresetIds.includes(p.id));
  };

  const selectedUserRole = availableUsers.find(u => u.id === selectedUser)?.role || 'basic';

  const renderPermissionCell = (
    member: JobTeamMember,
    permission: keyof typeof permissions,
    tooltipText: string
  ) => {
    const canToggle = canTogglePermission(member.role, permission);
    
    if (!canToggle) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Checkbox
        checked={member[permission]}
        onCheckedChange={(checked) =>
          handleUpdatePermission(member.id, permission, checked as boolean)
        }
      />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Job Team</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Grant a user access to this job with specific permissions
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User</label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableUsersForAdd().map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <span>{user.full_name}</span>
                              <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                {getRoleLabel(user.role)}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePresetsForSelectedUser().map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{preset.name}</span>
                              <span className="text-xs text-muted-foreground">{preset.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedUser && selectedUserRole === 'basic' && (
                      <p className="text-xs text-muted-foreground">
                        Basic users can only have view permissions
                      </p>
                    )}
                  </div>

                  {selectedPreset === 'custom' && (
                    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                      <label className="text-sm font-medium">Custom Permissions</label>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can_view"
                          checked={permissions.can_view}
                          onCheckedChange={(checked) =>
                            setPermissions({ ...permissions, can_view: checked as boolean })
                          }
                        />
                        <label htmlFor="can_view" className="text-sm cursor-pointer">
                          Can view applications
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canTogglePermission(selectedUserRole, 'can_move_pipeline') ? (
                          <Checkbox
                            id="can_move_pipeline"
                            checked={permissions.can_move_pipeline}
                            onCheckedChange={(checked) =>
                              setPermissions({ ...permissions, can_move_pipeline: checked as boolean })
                            }
                          />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50" />
                        )}
                        <label 
                          htmlFor="can_move_pipeline" 
                          className={`text-sm ${!canTogglePermission(selectedUserRole, 'can_move_pipeline') ? 'text-muted-foreground/50 line-through' : 'cursor-pointer'}`}
                        >
                          Can move applications in pipeline
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canTogglePermission(selectedUserRole, 'can_message') ? (
                          <Checkbox
                            id="can_message"
                            checked={permissions.can_message}
                            onCheckedChange={(checked) =>
                              setPermissions({ ...permissions, can_message: checked as boolean })
                            }
                          />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50" />
                        )}
                        <label 
                          htmlFor="can_message" 
                          className={`text-sm ${!canTogglePermission(selectedUserRole, 'can_message') ? 'text-muted-foreground/50 line-through' : 'cursor-pointer'}`}
                        >
                          Can message candidates
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canTogglePermission(selectedUserRole, 'can_view_offer') ? (
                          <Checkbox
                            id="can_view_offer"
                            checked={permissions.can_view_offer}
                            onCheckedChange={(checked) =>
                              setPermissions({ ...permissions, can_view_offer: checked as boolean })
                            }
                          />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50" />
                        )}
                        <label 
                          htmlFor="can_view_offer" 
                          className={`text-sm ${!canTogglePermission(selectedUserRole, 'can_view_offer') ? 'text-muted-foreground/50 line-through' : 'cursor-pointer'}`}
                        >
                          Can view and create offers
                        </label>
                      </div>
                    </div>
                  )}

                  {selectedPreset !== 'custom' && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Permissions for {getPresetById(selectedPreset)?.name}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {getPresetById(selectedPreset)?.permissions.can_view && <div>✓ View applications</div>}
                        {getPresetById(selectedPreset)?.permissions.can_move_pipeline && 
                          (canTogglePermission(selectedUserRole, 'can_move_pipeline') 
                            ? <div>✓ Move pipeline</div>
                            : <div className="line-through text-muted-foreground/50">✗ Move pipeline (not available for basic users)</div>
                          )
                        }
                        {getPresetById(selectedPreset)?.permissions.can_message && 
                          (canTogglePermission(selectedUserRole, 'can_message')
                            ? <div>✓ Message candidates</div>
                            : <div className="line-through text-muted-foreground/50">✗ Message candidates (not available for basic users)</div>
                          )
                        }
                        {getPresetById(selectedPreset)?.permissions.can_view_offer && 
                          (canTogglePermission(selectedUserRole, 'can_view_offer')
                            ? <div>✓ View & create offers</div>
                            : <div className="line-through text-muted-foreground/50">✗ View & create offers (not available for basic users)</div>
                          )
                        }
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMember} disabled={!selectedUser}>
                    Add Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No team members assigned to this job yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">View</TableHead>
                  <TableHead className="text-center">Move Pipeline</TableHead>
                  <TableHead className="text-center">Message</TableHead>
                  <TableHead className="text-center">View Offers</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.filter(member => member.user).map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{member.user?.full_name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">
                          {member.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionCell(member, 'can_view', 'View permission')}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionCell(member, 'can_move_pipeline', 'Basic users cannot move pipeline')}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionCell(member, 'can_message', 'Basic users cannot message candidates')}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionCell(member, 'can_view_offer', 'Basic users cannot view offers')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingMemberId(member.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        description="Are you sure you want to remove this user from the job team? They will lose access to this job's applications and data."
        confirmText="Remove"
        variant="destructive"
      />
    </>
  );
};
