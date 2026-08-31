import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserX, UserCheck, UserMinus } from 'lucide-react';
import { RejectDialog } from './RejectDialog';
import { WithdrawDialog } from './WithdrawDialog';
import { HireDialog } from './HireDialog';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface ApplicationActionsProps {
  applicationState: string;
  onReject: (reason: string, note: string) => void;
  onWithdraw: () => void;
  onHire: () => void;
  offerState?: string;
  applicationId?: string;
}

export const ApplicationActions = ({
  applicationState,
  onReject,
  onWithdraw,
  onHire,
  offerState,
  applicationId,
}: ApplicationActionsProps) => {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [offerId, setOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (applicationId && offerState === 'accepted') {
      fetchOfferId();
    }
  }, [applicationId, offerState]);

  const fetchOfferId = async () => {
    if (!applicationId) return;

    try {
      const { data, error } = await supabase
        .from('offers')
        .select('id')
        .eq('application_id', applicationId)
        .single();

      if (error) throw error;
      setOfferId(data?.id || null);
    } catch (error) {
      console.error('Error fetching offer:', error);
    }
  };

  if (applicationState !== 'active') {
    return null;
  }

  // If offer is accepted, show different actions
  if (offerState === 'accepted') {
    return (
      <div className="flex gap-2">
        <Button onClick={onHire} variant="default">
          Mark as Hired
        </Button>
        {offerId && (
          <Button asChild variant="outline">
            <Link to={`/offers/${offerId}`}>
              View Offer
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setRejectOpen(true)}
        >
          <UserX className="h-4 w-4 mr-2" />
          Reject
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWithdrawOpen(true)}
        >
          <UserMinus className="h-4 w-4 mr-2" />
          Withdraw
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => setHireOpen(true)}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Hire
        </Button>
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={(reason, note) => {
          onReject(reason, note);
          setRejectOpen(false);
        }}
      />

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        onConfirm={() => {
          onWithdraw();
          setWithdrawOpen(false);
        }}
      />

      <HireDialog
        open={hireOpen}
        onOpenChange={setHireOpen}
        onConfirm={() => {
          onHire();
          setHireOpen(false);
        }}
      />
    </>
  );
};
