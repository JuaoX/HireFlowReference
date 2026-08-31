import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') {
      toast({
        title: 'Invalid confirmation',
        description: 'Please type DELETE to confirm account deletion',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to delete your account',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete account');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Sign out locally after successful deletion
      await supabase.auth.signOut();

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });

      navigate('/auth/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive">
          <AlertDescription>
            Warning: All your data including applications, interviews, and offers will be permanently deleted.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <span className="font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading || confirmation !== 'DELETE'}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
