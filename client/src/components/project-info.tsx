import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Github, FileText, ExternalLink } from "lucide-react";
import type { BuildProject } from "@shared/schema";

interface ProjectInfoProps {
  project: BuildProject | null;
}

export default function ProjectInfo({ project }: ProjectInfoProps) {
  if (!project) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
          <p className="text-gray-500 text-sm">No project uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Source Type:</span>
            <div className="flex items-center gap-1">
              {project.sourceType === 'github' ? (
                <Github className="w-4 h-4 text-gray-600" />
              ) : (
                <FileText className="w-4 h-4 text-gray-600" />
              )}
              <span className="font-medium text-gray-900 capitalize">{project.sourceType}</span>
            </div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Project Name:</span>
            <span className="font-medium text-gray-900">{project.name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Package:</span>
            <span className="font-medium text-gray-900">{project.packageName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Version:</span>
            <span className="font-medium text-gray-900">{project.version}</span>
          </div>
          
          {project.sourceType === 'github' && project.githubUrl && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Repository:</span>
                <a 
                  href={project.githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:text-blue-700 flex items-center gap-1"
                >
                  <span className="truncate max-w-32">
                    {project.githubUrl.split('/').slice(-2).join('/')}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Branch:</span>
                <span className="font-medium text-gray-900">{project.githubBranch || 'main'}</span>
              </div>
            </>
          )}
          
          {project.sourceType === 'file' && project.fileSize && (
            <div className="flex justify-between">
              <span className="text-gray-600">File Size:</span>
              <span className="font-medium text-gray-900">{formatFileSize(project.fileSize)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium text-gray-900">
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
