import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Mail, Check, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Job {
  id: string;
  title: string;
  location: string | null;
  employment_type: string;
}

interface ShareJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
}

export function ShareJobDialog({ open, onOpenChange, job }: ShareJobDialogProps) {
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailData, setEmailData] = useState({
    recipientEmail: '',
    recipientName: '',
    message: '',
  });

  // Generate the public job posting URL
  const jobUrl = `${window.location.origin}/careers/jobs/${job.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(jobUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Job posting link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to share jobs');
      }

      const { error } = await supabase.functions.invoke('share-job', {
        body: {
          jobId: job.id,
          jobTitle: job.title,
          jobUrl,
          recipientEmail: emailData.recipientEmail,
          recipientName: emailData.recipientName,
          senderMessage: emailData.message,
        },
      });

      if (error) throw error;

      toast({
        title: 'Email sent!',
        description: `Job posting shared with ${emailData.recipientEmail}`,
      });

      // Reset form
      setEmailData({
        recipientEmail: '',
        recipientName: '',
        message: '',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Share Job Posting</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Copy Link Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LinkIcon className="h-4 w-4" />
              <span>Shareable Link</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={jobUrl}
                readOnly
                className="flex-1 bg-muted"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the job posting
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or share via email</span>
            </div>
          </div>

          {/* Email Form Section */}
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              <span>Send via Email</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="colleague@company.com"
                value={emailData.recipientEmail}
                onChange={(e) => setEmailData({ ...emailData, recipientEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                type="text"
                placeholder="John Doe"
                value={emailData.recipientName}
                onChange={(e) => setEmailData({ ...emailData, recipientName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="I thought you might be interested in this opportunity..."
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={sendingEmail}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
