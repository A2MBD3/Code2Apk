import { Card, CardContent } from "@/components/ui/card";
import { Settings, CheckCircle, XCircle, Clock } from "lucide-react";
import type { BuildProject } from "@shared/schema";

interface BuildStatusProps {
  project: BuildProject | null;
}

export default function BuildStatus({ project }: BuildStatusProps) {
  if (!project) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Status</h3>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="text-gray-400 w-8 h-8" />
            </div>
            <div>
              <p className="font-medium text-gray-500">No Project</p>
              <p className="text-sm text-gray-400">Upload a project to start building</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (project.status) {
      case "building":
        return <Settings className="text-accent w-8 h-8 animate-spin" />;
      case "completed":
        return <CheckCircle className="text-secondary w-8 h-8" />;
      case "failed":
        return <XCircle className="text-error w-8 h-8" />;
      default:
        return <Clock className="text-gray-400 w-8 h-8" />;
    }
  };

  const getStatusText = () => {
    switch (project.status) {
      case "building":
        return {
          title: "Building APK",
          description: "Please wait while we compile your application"
        };
      case "completed":
        return {
          title: "Build Completed",
          description: "Your APK is ready for download"
        };
      case "failed":
        return {
          title: "Build Failed",
          description: project.errorMessage || "An error occurred during compilation"
        };
      default:
        return {
          title: "Ready to Build",
          description: "Configure your build settings and start compilation"
        };
    }
  };

  const statusText = getStatusText();

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Status</h3>
        
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            project.status === "building" ? "bg-accent bg-opacity-10" :
            project.status === "completed" ? "bg-secondary bg-opacity-10" :
            project.status === "failed" ? "bg-error bg-opacity-10" :
            "bg-gray-100"
          }`}>
            {getStatusIcon()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{statusText.title}</p>
            <p className="text-sm text-gray-500">{statusText.description}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              Build ID: <span className="font-mono">{project.buildId}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
