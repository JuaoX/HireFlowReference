import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, note: string) => void;
}

const REJECTION_REASONS = [
  'Qualifications not met',
  'Position filled',
  'Salary expectations mismatch',
  'Cultural fit concerns',
  'Other',
];

export const RejectDialog = ({ open, onOpenChange, onConfirm }: RejectDialogProps) => {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    onConfirm(reason, note);
    setReason('');
    setNote('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Application</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the application as rejected. This action can be reversed later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rejection Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional context..."
              rows={4}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!reason}>
            Reject Application
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
