import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';

interface BrandingData {
  platform_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

export const BrandingSettings = () => {
  const [branding, setBranding] = useState<BrandingData>({
    platform_name: 'HiringPlatform',
    logo_url: null,
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;
      setOrgId(profile.org_id);

      const { data: org } = await supabase
        .from('organizations')
        .select('branding_json')
        .eq('id', profile.org_id)
        .single();

      if (org?.branding_json) {
        const brandingJson = org.branding_json as Record<string, unknown>;
        setBranding({
          platform_name: (brandingJson.platform_name as string) || 'HiringPlatform',
          logo_url: (brandingJson.logo_url as string) || null,
          primary_color: (brandingJson.primary_color as string) || '#3B82F6',
          secondary_color: (brandingJson.secondary_color as string) || '#10B981',
        });
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !orgId) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, SVG, or WebP image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orgId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      // Add cache buster
      const logoUrlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      setBranding(prev => ({ ...prev, logo_url: logoUrlWithCacheBuster }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!orgId) return;

    try {
      // List all files in the org's folder and delete them
      const { data: files } = await supabase.storage
        .from('logos')
        .list(orgId);

      if (files && files.length > 0) {
        const filesToDelete = files.map(f => `${orgId}/${f.name}`);
        await supabase.storage.from('logos').remove(filesToDelete);
      }

      setBranding(prev => ({ ...prev, logo_url: null }));
      toast.success('Logo removed');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleSave = async () => {
    if (!orgId) return;

    setIsSaving(true);
    try {
      const brandingToSave = {
        platform_name: branding.platform_name,
        logo_url: branding.logo_url,
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
      };
      
      const { error } = await supabase
        .from('organizations')
        .update({
          branding_json: brandingToSave,
        })
        .eq('id', orgId);

      if (error) throw error;

      toast.success('Branding settings saved');
      // Dispatch a custom event so the sidebar can update
      window.dispatchEvent(new CustomEvent('branding-updated', { detail: branding }));
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Failed to save branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg">Platform Branding</h3>
        <p className="text-sm text-muted-foreground">
          Customize how your platform appears to users
        </p>
      </div>

      <div className="grid gap-6">
        {/* Platform Name */}
        <div className="space-y-2">
          <Label htmlFor="platform-name">Platform Name</Label>
          <Input
            id="platform-name"
            value={branding.platform_name}
            onChange={(e) => setBranding(prev => ({ ...prev, platform_name: e.target.value }))}
            placeholder="Enter platform name"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            This name appears in the sidebar and browser title
          </p>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Platform Logo</Label>
          <div className="flex items-start gap-4">
            {branding.logo_url ? (
              <div className="relative">
                <div className="h-16 w-16 rounded-lg border bg-background flex items-center justify-center overflow-hidden">
                  <img
                    src={branding.logo_url}
                    alt="Platform logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG, or WebP. Max 2MB. Recommended: 200x200px
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>

        {/* Colors */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="primary-color"
                value={branding.primary_color}
                onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={branding.primary_color}
                onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary-color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="secondary-color"
                value={branding.secondary_color}
                onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={branding.secondary_color}
                onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                placeholder="#10B981"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="p-4 rounded-lg border bg-sidebar">
            <div className="flex items-center gap-3">
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt="Logo preview"
                  className="h-8 w-8 rounded object-contain"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: branding.primary_color }}
                >
                  {branding.platform_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-sidebar-foreground">
                {branding.platform_name || 'Platform Name'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
