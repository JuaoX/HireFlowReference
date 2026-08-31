import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface FileUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = '.pdf,.doc,.docx';

export const FileUpload = ({
  value,
  onChange,
  accept = ACCEPTED_TYPES,
  maxSize = MAX_FILE_SIZE,
  disabled = false,
}: FileUploadProps) => {
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) {
      onChange(null);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
      onChange(null);
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(t => t.trim());
    
    if (!acceptedTypes.includes(fileExtension)) {
      setError(`Only ${accept} files are accepted`);
      onChange(null);
      return;
    }

    onChange(file);
  };

  const handleRemove = () => {
    onChange(null);
    setError('');
  };

  return (
    <div className="space-y-2">
      {!value ? (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled}
            className="cursor-pointer"
          />
          <Upload className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{value.name}</span>
          <span className="text-xs text-muted-foreground">
            {(value.size / 1024).toFixed(1)} KB
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        PDF or Word document (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
      </p>
    </div>
  );
};
