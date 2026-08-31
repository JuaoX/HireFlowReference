import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/shared/FileUpload';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { parseResume } from '@/lib/resume-parser';

const CandidateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    source: 'manual' as 'careers_site' | 'referral' | 'linkedin' | 'agency' | 'job_fair' | 'manual',
    consent: false,
  });

  useEffect(() => {
    if (id) {
      fetchCandidate();
    }
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFormData({
        ...data,
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        linkedin_url: data.linkedin_url || '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const candidateData = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        location: formData.location || null,
        linkedin_url: formData.linkedin_url || null,
        consent_at: formData.consent ? new Date().toISOString() : null,
      };

      let candidateId = id;

      if (id) {
        const { error } = await supabase
          .from('candidates')
          .update(candidateData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data: newCandidate, error } = await supabase
          .from('candidates')
          .insert({
            ...candidateData,
            org_id: profile.org_id,
          })
          .select()
          .single();

        if (error) throw error;
        candidateId = newCandidate.id;
      }

      // Upload resume if provided
      if (resumeFile && candidateId) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${profile.org_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, resumeFile);

        if (uploadError) throw uploadError;

        // Store the storage path, not a public URL
        await supabase
          .from('attachments')
          .insert({
            org_id: profile.org_id,
            owner_type: 'candidate',
            owner_id: candidateId,
            file_url: filePath, // Store path for private bucket
            file_name: resumeFile.name,
            mime_type: resumeFile.type,
            size_bytes: resumeFile.size,
          });

        // Parse resume in the background - use the file path
        parseResume(filePath, candidateId).catch((error) => {
          console.error('Resume parsing failed:', error);
        });
      }

      toast({
        title: 'Success',
        description: id ? 'Candidate updated successfully' : 'Candidate added successfully',
      });

      navigate('/candidates');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/candidates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl">{id ? 'Edit Candidate' : 'Add New Candidate'}</h1>
          <p className="text-muted-foreground">
            {id ? 'Update candidate information' : 'Add a new candidate to your talent pool'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Information</CardTitle>
          <CardDescription>Basic details about the candidate</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Jane Smith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: any) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="careers_site">Careers Site</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="job_fair">Job Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Resume (Optional)</Label>
              <FileUpload
                value={resumeFile}
                onChange={setResumeFile}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent"
                checked={formData.consent}
                onCheckedChange={(checked) => setFormData({ ...formData, consent: checked as boolean })}
              />
              <Label
                htmlFor="consent"
                className="text-sm font-normal cursor-pointer"
              >
                Candidate has given consent to process their data
              </Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : id ? 'Update Candidate' : 'Add Candidate'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/candidates')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateForm;
