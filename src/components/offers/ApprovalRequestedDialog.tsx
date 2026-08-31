import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PendingApproval {
  id: string;
  offer_id: string;
  approver_user_id: string;
  approver_name: string;
  approver_avatar: string | null;
  candidate_name: string;
  candidate_avatar: string | null;
  job_title: string;
  base_amount: number;
  variable_amount: number | null;
  currency: string;
  offer_created_at: string;
}

interface ApprovalRequestedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApprovalRequestedDialog({ open, onOpenChange }: ApprovalRequestedDialogProps) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchPendingApprovals();
    }
  }, [open]);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      // Get current user's org_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) {
        setLoading(false);
        return;
      }

      // Only fetch approvals where the current user is the approver
      const { data, error } = await supabase
        .from('approvals')
        .select(`
          id,
          offer_id,
          approver_user_id,
          state,
          offers!inner (
            id,
            base_amount,
            variable_amount,
            currency,
            created_at,
            application_id,
            applications!inner (
              candidate_id,
              job_id,
              candidates (
                full_name,
                avatar_url
              ),
              jobs!inner (
                title,
                org_id
              )
            )
          ),
          profiles!approvals_approver_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('state', 'pending')
        .eq('approver_user_id', user.id)
        .eq('offers.applications.jobs.org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: PendingApproval[] = (data || []).map((approval: any) => ({
        id: approval.id,
        offer_id: approval.offers.id,
        approver_user_id: approval.approver_user_id,
        approver_name: approval.profiles?.full_name || 'Unknown',
        approver_avatar: approval.profiles?.avatar_url || null,
        candidate_name: approval.offers.applications.candidates?.full_name || 'Unknown Candidate',
        candidate_avatar: approval.offers.applications.candidates?.avatar_url || null,
        job_title: approval.offers.applications.jobs?.title || 'Unknown Position',
        base_amount: approval.offers.base_amount,
        variable_amount: approval.offers.variable_amount,
        currency: approval.offers.currency || 'USD',
        offer_created_at: approval.offers.created_at,
      }));

      setApprovals(formattedData);
    } catch (error: any) {
      console.error('Error fetching approvals:', error);
      toast({
        title: "Error",
        description: "Failed to load pending approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (approvalId: string, offerId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('approvals')
        .update({ 
          state: action,
          acted_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) throw error;

      // If approved, also update the offer state
      if (action === 'approved') {
        const { error: offerError } = await supabase
          .from('offers')
          .update({ state: 'approved' })
          .eq('id', offerId);

        if (offerError) throw offerError;
      }

      toast({
        title: action === 'approved' ? "Offer Approved" : "Offer Rejected",
        description: action === 'approved' 
          ? "The offer has been approved successfully" 
          : "The offer has been rejected",
      });

      fetchPendingApprovals();
    } catch (error: any) {
      console.error('Error updating approval:', error);
      toast({
        title: "Error",
        description: `Failed to ${action === 'approved' ? 'approve' : 'reject'} offer`,
        variant: "destructive",
      });
    }
  };

  const formatSalary = (base: number, variable: number | null, currency: string) => {
    const total = base + (variable || 0);
    return `${currency === 'USD' ? '$' : currency}${total.toLocaleString()}/yr`;
  };

  const formatStartDate = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[790px] max-w-[90vw] p-5 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Approval Requested</DialogTitle>
        </DialogHeader>

        <div className="py-5 flex flex-col gap-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading approvals...</div>
          ) : approvals.length === 0 ? (
            <div className="text-center text-muted-foreground">No pending approvals</div>
          ) : (
            approvals.map((approval) => (
              <div key={approval.id} className="flex flex-col gap-4">
                <div className="text-sm text-foreground">By {approval.approver_name}</div>
                <div className="px-4 py-3 bg-[#f8faff] rounded-lg flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-[55px] w-[55px]">
                      <AvatarImage src={approval.candidate_avatar || undefined} />
                      <AvatarFallback>
                        {approval.candidate_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="text-xl leading-[26px]">{approval.candidate_name}</div>
                      <div className="text-sm text-[#5d6174] leading-[18.20px]">{approval.job_title}</div>
                    </div>

                    <div className="px-2 flex flex-col items-end gap-1">
                      <div className="text-xl leading-[26px]">
                        {formatSalary(approval.base_amount, approval.variable_amount, approval.currency)}
                      </div>
                      <div className="text-sm text-[#5d6174] leading-[18.20px]">
                        Starting: {formatStartDate(approval.offer_created_at)}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => navigate(`/offers/${approval.offer_id}`)}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-[41px] text-lg font-bold"
                      onClick={() => handleApprovalAction(approval.id, approval.offer_id, 'rejected')}
                    >
                      Reject
                    </Button>
                    <Button
                      className="flex-1 h-[41px] text-base font-bold bg-[#45ce99]/30 text-foreground border-2 border-[#45ce99] hover:bg-[#45ce99]/40"
                      onClick={() => handleApprovalAction(approval.id, approval.offer_id, 'approved')}
                    >
                      Approve & Send
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
