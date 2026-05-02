import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Download, AlertCircle, Github, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { BuildProject } from "@shared/schema";

export default function RecentBuilds() {
  const { data: recentBuilds, isLoading } = useQuery<BuildProject[]>({
    queryKey: ['/api/builds/recent'],
    refetchInterval: (query) => {
      const data = query.state.data;
      if (Array.isArray(data) && data.some(b => b.status === "building")) {
        return 3000;
      }
      return false;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case "building":
        return <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Done</span>;
      case "failed":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Failed</span>;
      case "building":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Building</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Queued</span>;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Builds</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                    <div>
                      <div className="w-20 h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="w-16 h-3 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="w-5 h-5 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Builds</h3>

        <div className="space-y-3">
          {recentBuilds && recentBuilds.length > 0 ? (
            recentBuilds.map((build) => (
              <div key={build.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 min-w-0">
                  {getStatusIcon(build.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 truncate">{build.name} v{build.version}</p>
                      {build.sourceType === 'github' ? (
                        <Github className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      ) : (
                        <FileText className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      )}
                      {getStatusBadge(build.status)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(build.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={build.status === "completed" ? "text-primary hover:text-blue-700 flex-shrink-0" : "text-gray-300 flex-shrink-0"}
                  disabled={build.status !== "completed" || !build.downloadUrl}
                  onClick={() => {
                    if (build.downloadUrl) {
                      const link = document.createElement('a');
                      link.href = build.downloadUrl;
                      link.download = `${build.name.replace(/[^a-z0-9]/gi, '_')}-${build.version}.apk`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No builds yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
