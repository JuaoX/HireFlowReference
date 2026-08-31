import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import { EditAccountDialog } from './EditAccountDialog';

export const AccountInformation = () => {
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
      setRole(roleData?.role === 'site_admin' ? 'Organization Admin' : 
              roleData?.role === 'job_admin' ? 'Job Admin' : 'Basic User');
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

  const handleTwoFactorToggle = async (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    toast({
      title: 'Two-Factor Authentication',
      description: enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg">Account Information</h3>
      </div>

      <div className="space-y-6">
        {/* User Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl">{profile?.full_name || 'User'}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Account Details */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Email Address</span>
            <span className="text-sm font-medium text-primary">{profile?.email}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Phone Number</span>
            <span className="text-sm font-medium text-primary">(123) 456-7890</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-sm font-medium">{role}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Password</span>
            <span className="text-sm font-medium">••••••••••••</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Recovery Email Address</span>
            <span className="text-sm font-medium text-primary">{profile?.email}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-muted-foreground">Two-Factor Authentication</span>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
            />
          </div>
        </div>
      </div>

      <EditAccountDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchProfile}
      />
    </div>
  );
};
