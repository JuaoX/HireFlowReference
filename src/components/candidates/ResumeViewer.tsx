import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface ResumeViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeUrl: string | null;
  candidateName: string;
}

export const ResumeViewer = ({
  open,
  onOpenChange,
  resumeUrl,
  candidateName,
}: ResumeViewerProps) => {
  if (!resumeUrl) return null;

  const handleDownload = () => {
    window.open(resumeUrl, '_blank');
  };

  const handleOpenInNewTab = () => {
    window.open(resumeUrl, '_blank');
  };

  // Parse URL to check pathname without query params (signed URLs have tokens)
  const isPdf = (() => {
    try {
      const url = new URL(resumeUrl);
      return url.pathname.toLowerCase().endsWith('.pdf');
    } catch {
      return resumeUrl.toLowerCase().includes('.pdf');
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-xl font-semibold">
            {candidateName}'s Resume
          </DialogTitle>
          <div className="flex items-center gap-2 mr-12">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isPdf ? (
            <iframe
              src={resumeUrl}
              className="w-full h-full border-0"
              title={`${candidateName}'s Resume`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Preview not available for this file type
                </p>
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Resume
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
