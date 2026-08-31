import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Plus, X } from "lucide-react";

export default function TemplateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState("");

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setName(data.name);
      setSubject(data.subject);
      setBodyHtml(data.body_html);
      setVariables(data.variables || []);
    } catch (error: any) {
      toast({
        title: "Error loading template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable("");
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable));
  };

  const handleSubmit = async () => {
    if (!name || !subject || !bodyHtml) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const templateData = {
        org_id: profile.org_id,
        name,
        subject,
        body_html: bodyHtml,
        variables,
      };

      if (id) {
        const { error } = await supabase
          .from("message_templates")
          .update(templateData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Template updated",
          description: "Your template has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert(templateData);

        if (error) throw error;

        toast({
          title: "Template created",
          description: "Your template has been created successfully",
        });
      }

      navigate("/templates");
    } catch (error: any) {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/templates")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl">
            {id ? "Edit Template" : "New Template"}
          </h1>
          <p className="text-muted-foreground">
            Create reusable email templates with variable support
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Interview Invitation"
            />
          </div>

          <div>
            <Label htmlFor="subject">Email Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Interview Invitation for {{position}}"
            />
          </div>

          <div>
            <Label htmlFor="body">Email Body (HTML) *</Label>
            <Textarea
              id="body"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="<p>Hi {{candidate_name}},</p>"
              rows={15}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {"{{"} and {"}}"} to insert variables (e.g., {"{{candidate_name}}"})
            </p>
          </div>

          <div>
            <Label>Template Variables</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Add variables that can be dynamically replaced when sending emails
            </p>
            <div className="flex gap-2 mb-3">
              <Input
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                placeholder="e.g., candidate_name, job_title"
                onKeyPress={(e) => e.key === "Enter" && handleAddVariable()}
              />
              <Button onClick={handleAddVariable} size="icon" type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {variables.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                {variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="font-mono">
                    {"{{"}{variable}{"}}"}
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(variable)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No variables added yet. Common variables: candidate_name, job_title, interview_date
              </p>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : id ? "Update Template" : "Create Template"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
