import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Approval {
  id: string;
  approver_user_id: string;
  state: string;
  comment: string | null;
  acted_at: string | null;
  created_at: string;
  approver: {
    full_name: string;
    email: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface ApprovalSectionProps {
  offerId: string;
  offerState: string;
  onApprovalChange?: () => void;
}

export const ApprovalSection = ({ offerId, offerState, onApprovalChange }: ApprovalSectionProps) => {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [actionComment, setActionComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [pendingOffers, setPendingOffers] = useState<any[]>([]);

  useEffect(() => {
    fetchApprovals();
    fetchProfiles();
    getCurrentUser();
    fetchPendingOffers();
  }, [offerId]);

  const fetchPendingOffers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("approvals")
        .select(`
          id,
          offer_id,
          state,
          offers (
            id,
            base_amount,
            variable_amount,
            currency,
            state,
            created_at,
            application:applications (
              candidate:candidates (
                full_name,
                email
              ),
              job:jobs (
                title
              )
            )
          )
        `)
        .eq("approver_user_id", user.id)
        .eq("state", "pending")
        .neq("offer_id", offerId);

      if (error) throw error;
      setPendingOffers(data || []);
    } catch (error: any) {
      console.error("Error fetching pending offers:", error);
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("approvals")
        .select(`
          *,
          approver:profiles!approver_user_id(full_name, email)
        `)
        .eq("offer_id", offerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching approvals",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
    }
  };

  const handleAddApproval = async () => {
    if (!selectedApprover) {
      toast({
        title: "Select an approver",
        description: "Please select a user to approve this offer",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("approvals").insert({
        offer_id: offerId,
        approver_user_id: selectedApprover,
        state: "pending",
      });

      if (error) throw error;

      toast({
        title: "Approver added",
        description: "Approval request has been sent",
      });

      setSelectedApprover("");
      fetchApprovals();
      onApprovalChange?.();
    } catch (error: any) {
      toast({
        title: "Error adding approver",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApprovalAction = async (approvalId: string, action: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("approvals")
        .update({
          state: action,
          comment: actionComment || null,
          acted_at: new Date().toISOString(),
        })
        .eq("id", approvalId);

      if (error) throw error;

      toast({
        title: action === "approved" ? "Offer approved" : "Offer rejected",
        description: `You have ${action} this offer`,
      });

      setActionComment("");
      
      // Fetch updated approvals to check if all are complete
      const { data: updatedApprovals } = await supabase
        .from("approvals")
        .select("state")
        .eq("offer_id", offerId);

      // If all approvals are approved, trigger email notification
      if (updatedApprovals?.every(a => a.state === "approved")) {
        try {
          await supabase.functions.invoke("handle-offer-approval", {
            body: { offerId },
          });
          toast({
            title: "Offer sent to candidate",
            description: "All approvals complete. Offer notification has been sent.",
          });
        } catch (emailError: any) {
          console.error("Failed to send offer notification:", emailError);
          toast({
            title: "Approval complete",
            description: "Offer approved but email notification failed. Please send manually.",
            variant: "destructive",
          });
        }
      }

      fetchApprovals();
      onApprovalChange?.();
    } catch (error: any) {
      toast({
        title: "Error updating approval",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (state: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      approved: "default",
      rejected: "destructive",
      pending: "secondary",
    };
    return <Badge variant={variants[state] || "secondary"}>{state}</Badge>;
  };

  const pendingApproval = approvals.find(
    (a) => a.state === "pending" && a.approver_user_id === currentUserId
  );

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading approvals...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approvals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingOffers.length > 0 && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <h4 className="mb-3">Other Offers Awaiting Your Approval</h4>
            <div className="space-y-2">
              {pendingOffers.map((approval) => (
                <div key={approval.id} className="p-3 bg-background border rounded flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {approval.offers?.application?.candidate?.full_name || "Unknown Candidate"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {approval.offers?.application?.job?.title || "Unknown Position"} • 
                      {approval.offers?.currency} {approval.offers?.base_amount?.toLocaleString()}
                      {approval.offers?.variable_amount ? ` + ${approval.offers.variable_amount.toLocaleString()} bonus` : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/offers/${approval.offer_id}`}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {offerState === "draft" && (
          <div className="space-y-2">
            <Label>Add Approver</Label>
            <div className="flex gap-2">
              <Select value={selectedApprover} onValueChange={setSelectedApprover}>
                <SelectTrigger>
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  {profiles
                    .filter((p) => !approvals.find((a) => a.approver_user_id === p.id))
                    .map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name} ({profile.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddApproval} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {approvals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approvals required</p>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(approval.state)}
                    <div>
                      <p className="font-medium">{approval.approver.full_name}</p>
                      <p className="text-xs text-muted-foreground">{approval.approver.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(approval.state)}
                </div>

                {approval.comment && (
                  <div className="bg-muted p-2 rounded text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Comment:</p>
                    <p>{approval.comment}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {approval.acted_at
                    ? `${approval.state} ${formatDistanceToNow(new Date(approval.acted_at))} ago`
                    : `Requested ${formatDistanceToNow(new Date(approval.created_at))} ago`}
                </p>

                {approval.state === "pending" && approval.approver_user_id === currentUserId && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor={`comment-${approval.id}`}>Comment (optional)</Label>
                    <Textarea
                      id={`comment-${approval.id}`}
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprovalAction(approval.id, "approved")}
                        size="sm"
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleApprovalAction(approval.id, "rejected")}
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
