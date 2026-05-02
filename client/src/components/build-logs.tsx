import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import type { BuildProject } from "@shared/schema";

interface BuildLogsProps {
  project: BuildProject | null;
}

export default function BuildLogs({ project }: BuildLogsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && project?.status === "building") {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [project?.buildLogs, isExpanded, project?.status]);

  useEffect(() => {
    if (project?.status === "building") {
      setIsExpanded(true);
    }
  }, [project?.status]);

  if (!project || !project.buildLogs) {
    return null;
  }

  const logLines = project.buildLogs.split('\n').filter(line => line.trim());

  const getLogColor = (line: string) => {
    if (line.includes('[SUCCESS]')) return 'text-green-300';
    if (line.includes('[INFO]')) return 'text-green-400';
    if (line.includes('[DEBUG]')) return 'text-blue-400';
    if (line.includes('[WARN]')) return 'text-yellow-400';
    if (line.includes('[ERROR]')) return 'text-red-400';
    return 'text-gray-300';
  };

  return (
    <Card className="bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Build Logs
            <span className="ml-2 text-xs font-normal text-gray-400">({logLines.length} lines)</span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>
      </div>
      {isExpanded && (
        <CardContent className="p-0">
          <div className="p-6 bg-gray-900 font-mono text-sm max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {logLines.map((line, index) => (
                <div key={index} className={getLogColor(line)}>
                  {line}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
