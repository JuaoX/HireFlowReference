import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RejectCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, notes: string) => void;
}

const REJECTION_REASONS = [
  { value: 'not_qualified', label: 'Not Qualified for Position' },
  { value: 'failed_technical', label: 'Failed Technical Assessment' },
  { value: 'cultural_fit', label: 'Not a Cultural Fit' },
  { value: 'communication_skills', label: 'Poor Communication Skills' },
  { value: 'experience_mismatch', label: 'Experience Mismatch' },
  { value: 'salary_expectations', label: 'Salary Expectations Too High' },
  { value: 'availability', label: 'Availability Issues' },
  { value: 'other', label: 'Other' },
];

export const RejectCandidateDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: RejectCandidateDialogProps) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (reason) {
      onConfirm(reason, notes);
      setReason('');
      setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reject Candidate</DialogTitle>
          <DialogDescription>
            Please select a reason for rejecting this candidate and provide any additional notes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional context or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!reason}
          >
            Reject Candidate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
