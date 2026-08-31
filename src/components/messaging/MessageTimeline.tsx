import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Mail, Clock, CheckCircle, XCircle } from "lucide-react";

interface Message {
  id: string;
  subject: string;
  to_addresses: string[];
  status: string;
  created_at: string;
  sent_at: string | null;
  sender_user_id: string;
  body_html: string;
}

interface MessageTimelineProps {
  applicationId?: string;
  candidateId?: string;
}

export const MessageTimeline = ({ applicationId, candidateId }: MessageTimelineProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();

    // Set up realtime subscription for inserts and updates
    const channel = supabase
      .channel('message-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: applicationId 
            ? `application_id=eq.${applicationId}` 
            : candidateId 
            ? `candidate_id=eq.${candidateId}`
            : undefined,
        },
        (payload) => {
          setMessages((current) => [payload.new as Message, ...current]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: applicationId 
            ? `application_id=eq.${applicationId}` 
            : candidateId 
            ? `candidate_id=eq.${candidateId}`
            : undefined,
        },
        (payload) => {
          setMessages((current) =>
            current.map((msg) =>
              msg.id === payload.new.id ? (payload.new as Message) : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, candidateId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (applicationId) {
        query = query.eq("application_id", applicationId);
      } else if (candidateId) {
        query = query.eq("candidate_id", candidateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "queued":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sent: "default",
      failed: "destructive",
      queued: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message History</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages sent yet</p>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 min-h-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="border-l-2 border-border pl-4 pb-4 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(message.status)}
                      <h4 className="text-sm">{message.subject}</h4>
                    </div>
                    {getStatusBadge(message.status)}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    To: {message.to_addresses.join(", ")}
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    {message.sent_at
                      ? `Sent ${formatDistanceToNow(new Date(message.sent_at))} ago`
                      : `Created ${formatDistanceToNow(new Date(message.created_at))} ago`}
                  </p>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-primary cursor-pointer hover:underline">
                      View content
                    </summary>
                    <div
                      className="mt-2 text-xs p-2 bg-muted rounded"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.body_html, { USE_PROFILES: { html: true } }) }}
                    />
                  </details>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
