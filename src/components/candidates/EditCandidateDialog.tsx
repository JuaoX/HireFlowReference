import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Paperclip, FileText } from 'lucide-react';
import { parseResume } from '@/lib/resume-parser';

// Format phone number as (XXX) XXX-XXXX
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10);
  
  // Format based on length
  if (limitedDigits.length === 0) return '';
  if (limitedDigits.length <= 3) return `(${limitedDigits}`;
  if (limitedDigits.length <= 6) return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
};

interface EditCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin_url: string | null;
    source: string;
    consent: boolean | null;
  } | null;
  onUpdateSuccess: () => void;
}

export const EditCandidateDialog = ({ open, onOpenChange, candidate, onUpdateSuccess }: EditCandidateDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
  });
  const [errors, setErrors] = useState({
    phone: '',
    linkedin_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [currentResume, setCurrentResume] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && candidate) {
      setFormData({
        full_name: candidate.full_name,
        email: candidate.email || '',
        phone: candidate.phone || '',
        linkedin_url: candidate.linkedin_url || '',
      });
      setErrors({ phone: '', linkedin_url: '' });
      setResumeFile(null);
      fetchCurrentResume();
    }
  }, [open, candidate]);

  const fetchCurrentResume = async () => {
    if (!candidate) return;

    try {
      const { data: attachments } = await supabase
        .from('attachments')
        .select('file_name')
        .eq('owner_type', 'candidate')
        .eq('owner_id', candidate.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (attachments && attachments.length > 0) {
        setCurrentResume(attachments[0].file_name);
      } else {
        setCurrentResume(null);
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or Word document',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setResumeFile(file);
    toast({
      title: 'Resume selected',
      description: 'Resume will be uploaded when you update the candidate',
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpdate = async () => {
    if (!candidate) return;

    // Reset errors
    setErrors({ phone: '', linkedin_url: '' });

    // Validate form data
    if (!formData.full_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Invalid email format',
        variant: 'destructive',
      });
      return;
    }

    // Validate phone - either empty or properly formatted US number
    if (formData.phone && formData.phone !== '' && !/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.phone)) {
      setErrors(prev => ({ ...prev, phone: 'Please enter a valid US phone number' }));
      return;
    }

    // Validate LinkedIn URL
    if (formData.linkedin_url && formData.linkedin_url.trim() !== '') {
      if (!formData.linkedin_url.startsWith('http') || !formData.linkedin_url.includes('linkedin.com')) {
        setErrors(prev => ({ ...prev, linkedin_url: 'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)' }));
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // Update candidate data (preserving source and consent)
      const candidateData = {
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        linkedin_url: formData.linkedin_url || null,
      };

      const { data: updatedCandidate, error } = await supabase
        .from('candidates')
        .update(candidateData)
        .eq('id', candidate.id)
        .select('id, full_name')
        .maybeSingle();

      if (error) throw error;
      
      // Check if update actually affected a row (RLS might silently block it)
      if (!updatedCandidate) {
        throw new Error('You do not have permission to update this candidate. Contact your administrator.');
      }
      
      // Verify the update actually applied
      if (updatedCandidate.full_name !== formData.full_name) {
        throw new Error('Update was blocked. You may not have permission to modify this candidate.');
      }

      // Upload new resume if provided
      if (resumeFile) {
        setUploading(true);
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${candidate.id}-${Date.now()}.${fileExt}`;
        const filePath = `${profile.org_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, resumeFile);

        if (uploadError) throw uploadError;

        // Delete old attachment records
        await supabase
          .from('attachments')
          .delete()
          .eq('owner_type', 'candidate')
          .eq('owner_id', candidate.id);

        // Create new attachment record
        await supabase.from('attachments').insert({
          owner_type: 'candidate',
          owner_id: candidate.id,
          file_name: resumeFile.name,
          file_url: filePath,
          mime_type: resumeFile.type,
          size_bytes: resumeFile.size,
          org_id: profile.org_id,
          uploaded_by: user.id,
        });

        // Parse resume in background
        parseResume(filePath, candidate.id).catch(console.error);
        setUploading(false);
      }

      toast({
        title: 'Success',
        description: 'Candidate updated successfully',
      });

      onOpenChange(false);
      onUpdateSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Candidate</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Current Resume Section */}
          {currentResume && !resumeFile && (
            <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Current Resume</p>
                  <p className="text-sm text-muted-foreground">{currentResume}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>
            </div>
          )}

          {/* Upload Resume Section */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging ? 'border-primary bg-accent/20' : uploading ? 'border-primary bg-accent/10' : 'border-border'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className={`h-6 w-6 text-muted-foreground ${uploading ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">
                  {uploading ? 'Uploading resume...' : currentResume ? 'Replace Resume' : 'Upload Resume'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {uploading ? 'Please wait...' : (
                    <>
                      Drag a file here or click to browse your computer files
                    </>
                  )}
                </p>
              </div>
              {resumeFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  <span>{resumeFile.name}</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Candidate Information
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="full_name"
                placeholder="Name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Input
                id="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setFormData({ ...formData, phone: formatted });
                  setErrors(prev => ({ ...prev, phone: '' }));
                }}
                className="h-11"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="linkedin_url"
                placeholder="LinkedIn URL"
                value={formData.linkedin_url}
                onChange={(e) => {
                  setFormData({ ...formData, linkedin_url: e.target.value });
                  setErrors(prev => ({ ...prev, linkedin_url: '' }));
                }}
                className="h-11"
              />
              {errors.linkedin_url && (
                <p className="text-sm text-destructive">{errors.linkedin_url}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading || !formData.full_name}
              className="px-6 bg-foreground text-background hover:bg-foreground/90"
            >
              {loading ? 'Updating...' : 'Update Candidate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
