import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Mail, Trash2 } from 'lucide-react';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreference {
  type: string;
  email: boolean;
  push: boolean;
}

export const NotificationSettings = () => {
  const [notifications, setNotifications] = useState<NotificationPreference[]>([
    { type: 'New Candidate', email: true, push: true },
    { type: 'Candidate Applied', email: true, push: true },
    { type: 'Candidate Moved Stage', email: false, push: true },
    { type: 'Offer Made', email: false, push: true },
    { type: 'Offer Accepted', email: true, push: true },
  ]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDemoAccount, setIsDemoAccount] = useState(false);

  useEffect(() => {
    const checkDemoAccount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email?.toLowerCase().includes('demo')) {
        setIsDemoAccount(true);
      }
    };
    checkDemoAccount();
  }, []);

  const handleToggle = (index: number, channel: 'email' | 'push', value: boolean) => {
    const updated = [...notifications];
    updated[index][channel] = value;
    setNotifications(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg">Notifications</h3>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr,1fr,1fr] gap-4 bg-muted px-6 py-3 border-b">
          <div className="text-sm font-medium">Notification Type</div>
          <div className="text-sm font-medium text-center">Email</div>
          <div className="text-sm font-medium text-center">Push</div>
        </div>

        {/* Rows */}
        {notifications.map((notification, index) => (
          <div
            key={notification.type}
            className="grid grid-cols-[2fr,1fr,1fr] gap-4 px-6 py-4 border-b last:border-b-0 items-center"
          >
            <div className="text-sm">{notification.type}</div>
            <div className="flex justify-center">
              <Switch
                checked={notification.email}
                onCheckedChange={(value) => handleToggle(index, 'email', value)}
              />
            </div>
            <div className="flex justify-center">
              <Switch
                checked={notification.push}
                onCheckedChange={(value) => handleToggle(index, 'push', value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => window.location.href = 'mailto:support@hireflow.app'}
        >
          <Mail className="h-4 w-4 mr-2" />
          Contact Us
        </Button>
        {!isDemoAccount && (
          <Button 
            variant="outline" 
            className="flex-1 text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        )}
      </div>

      <DeleteAccountDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
};
