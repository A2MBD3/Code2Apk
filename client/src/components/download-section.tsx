import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, QrCode, Share, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BuildProject } from "@shared/schema";

interface DownloadSectionProps {
  project: BuildProject | null;
}

export default function DownloadSection({ project }: DownloadSectionProps) {
  const { toast } = useToast();

  if (!project || project.status !== "completed") {
    return null;
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (project.downloadUrl) {
      // In a real implementation, this would trigger the actual download
      window.open(project.downloadUrl, '_blank');
      toast({
        title: "Download Started",
        description: "Your APK download has begun.",
      });
    }
  };

  const handleQRCode = () => {
    toast({
      title: "QR Code",
      description: "QR code functionality would be implemented here.",
    });
  };

  const handleShare = () => {
    if (navigator.share && project.downloadUrl) {
      navigator.share({
        title: `${project.name} APK`,
        text: `Download ${project.name} v${project.version}`,
        url: project.downloadUrl,
      });
    } else {
      toast({
        title: "Share Link",
        description: "Share functionality would be implemented here.",
      });
    }
  };

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Download APK</h3>
        
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-secondary bg-opacity-10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-secondary w-8 h-8" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Build Completed!</p>
            <p className="text-sm text-gray-500">Your APK is ready for download</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleDownload}
              className="w-full bg-secondary text-white hover:bg-green-700"
            >
              <Download className="mr-2 w-4 h-4" />
              Download APK ({formatFileSize(project.apkSize)})
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                variant="secondary"
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={handleQRCode}
              >
                <QrCode className="mr-1 w-4 h-4" />
                QR Code
              </Button>
              <Button 
                variant="secondary"
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={handleShare}
              >
                <Share className="mr-1 w-4 h-4" />
                Share Link
              </Button>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <AlertTriangle className="inline mr-1 w-4 h-4" />
              This APK will be available for download for 24 hours
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
