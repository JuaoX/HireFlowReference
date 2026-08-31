import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import { EditOrganizationDialog } from './EditOrganizationDialog';

interface OrgSettings {
  company_email?: string;
  salary_currency?: string;
}

export const OrganizationProfile = () => {
  const [org, setOrg] = useState<any>(null);
  const [settings, setSettings] = useState<OrgSettings>({});
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.org_id)
        .single();

      if (error) throw error;

      setOrg(data);
      setSettings((data.settings_json as OrgSettings) || {});
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

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      const updatedSettings = { ...settings, salary_currency: newCurrency };
      const { error } = await supabase
        .from('organizations')
        .update({ settings_json: updatedSettings })
        .eq('id', org.id);

      if (error) throw error;

      setSettings(updatedSettings);
      toast({ title: 'Currency updated' });
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

  const orgInitials = org?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'O';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg">Organization Profile & Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Organization Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-primary">
              <AvatarFallback className="text-lg text-primary-foreground">{orgInitials}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl">{org?.name || 'Organization'}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Organization Details */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Company Email Address</span>
            <span className="text-sm font-medium text-primary">
              {settings.company_email || 'Not set - click Edit to add'}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Rejection Email Template</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/templates')}
              >
                Manage Templates
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Offer Email Template</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/templates')}
              >
                Manage Templates
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-muted-foreground">Salary Currency</span>
            <Select value={settings.salary_currency || 'USD'} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">$ US Dollar</SelectItem>
                <SelectItem value="EUR">€ Euro</SelectItem>
                <SelectItem value="GBP">£ British Pound</SelectItem>
                <SelectItem value="JPY">¥ Japanese Yen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <EditOrganizationDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchOrganization}
      />
    </div>
  );
};
