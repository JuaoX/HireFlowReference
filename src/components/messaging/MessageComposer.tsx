import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Lock } from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MessageComposerProps {
  candidateId?: string;
  applicationId?: string;
  defaultTo?: string[];
  onSent?: () => void;
  jobId?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
}

export const MessageComposer = ({
  candidateId,
  applicationId,
  defaultTo = [],
  onSent,
  jobId,
}: MessageComposerProps) => {
  const { toast } = useToast();
  const { canMessage } = useUserPermissions();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [to, setTo] = useState<string>(defaultTo.join(", "));
  const [cc, setCc] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [applicationData, setApplicationData] = useState<any>(null);
  const [detectedJobId, setDetectedJobId] = useState<string | undefined>(jobId);

  useEffect(() => {
    fetchTemplates();
    if (applicationId) {
      fetchApplicationData();
    }
  }, [applicationId]);

  const fetchApplicationData = async () => {
    if (!applicationId) return;

    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        candidate:candidates(full_name, email),
        job:jobs(id, title, department)
      `)
      .eq("id", applicationId)
      .single();

    if (error) {
      console.error("Error fetching application:", error);
      return;
    }

    setApplicationData(data);
    setDetectedJobId(data?.job_id || jobId);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching templates:", error);
      return;
    }

    setTemplates(data || []);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body_html);
      
      // Initialize variables with auto-populated values
      const vars: Record<string, string> = {};
      template.variables.forEach((v) => {
        if (v === "candidate_name" && applicationData?.candidate?.full_name) {
          vars[v] = applicationData.candidate.full_name;
        } else if (v === "job_title" && applicationData?.job?.title) {
          vars[v] = applicationData.job.title;
        } else {
          vars[v] = "";
        }
      });
      setVariables(vars);
    }
  };

  const interpolateVariables = (text: string): string => {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return result;
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get user profile for org_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const interpolatedSubject = interpolateVariables(subject);
      const interpolatedBody = interpolateVariables(body);

      // Create message record
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          org_id: profile.org_id,
          sender_user_id: user.id,
          candidate_id: candidateId,
          application_id: applicationId,
          to_addresses: to.split(",").map((e) => e.trim()),
          cc_addresses: cc ? cc.split(",").map((e) => e.trim()) : [],
          subject: interpolatedSubject,
          body_html: interpolatedBody,
          status: "queued",
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Send email via edge function
      const { error: sendError } = await supabase.functions.invoke("send-email", {
        body: { messageId: message.id },
      });

      if (sendError) throw sendError;

      toast({
        title: "Email sent",
        description: "Your message has been sent successfully",
      });

      // Reset form
      setTo(defaultTo.join(", "));
      setCc("");
      setSubject("");
      setBody("");
      setSelectedTemplate("");
      setVariables({});

      onSent?.();
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission to message
  const hasPermission = !detectedJobId || canMessage(detectedJobId);

  if (!hasPermission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to send messages for this job. Please contact your administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="template">Template (optional)</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger id="template">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTemplate && templates.find((t) => t.id === selectedTemplate)?.variables.length > 0 && (
          <div className="space-y-2">
            <Label>Template Variables</Label>
            {templates.find((t) => t.id === selectedTemplate)?.variables.map((variable) => (
              <div key={variable}>
                <Label htmlFor={variable} className="text-sm">{variable}</Label>
                <Input
                  id={variable}
                  value={variables[variable] || ""}
                  onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <Label htmlFor="to">To *</Label>
          <Input
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@email.com"
          />
        </div>

        <div>
          <Label htmlFor="cc">CC</Label>
          <Input
            id="cc"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="cc@email.com"
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>

        <div>
          <Label htmlFor="body">Message *</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body (HTML supported)"
            rows={10}
          />
        </div>

        <Button onClick={handleSend} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
