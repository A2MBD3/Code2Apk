import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, Circle, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { BuildProject } from "@shared/schema";

interface BuildProgressProps {
  project: BuildProject | null;
  onProjectUpdated: (project: BuildProject) => void;
}

export default function BuildProgress({ project, onProjectUpdated }: BuildProgressProps) {
  const prevStatusRef = useRef<string | null>(null);

  const { data: updatedProject } = useQuery<BuildProject>({
    queryKey: [`/api/project/${project?.id}`],
    enabled: !!project && (project.status === "building" || project.status === "uploaded"),
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (updatedProject && updatedProject.status !== prevStatusRef.current) {
      prevStatusRef.current = updatedProject.status;
      onProjectUpdated(updatedProject);
    }
  }, [updatedProject, onProjectUpdated]);

  const currentProject = updatedProject || project;

  if (!currentProject || currentProject.status === "uploaded") {
    return null;
  }

  const buildSteps = [
    { name: "Project validation", completed: currentProject.progress >= 10 },
    { name: "Dependencies resolution", completed: currentProject.progress >= 20 },
    { name: "Compiling source code", completed: currentProject.progress >= 60 },
    { name: "APK packaging", completed: currentProject.progress >= 80 },
    { name: "Signing APK", completed: currentProject.progress >= 100 },
  ];

  const currentStep = buildSteps.findIndex(step => !step.completed);
  const estimatedTimeRemaining = Math.max(0, Math.ceil((100 - currentProject.progress) / 20));

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Progress</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">{currentProject.progress}%</span>
          </div>
          <Progress value={currentProject.progress} className="w-full" />

          <div className="space-y-2">
            {buildSteps.map((step, index) => (
              <div key={step.name} className="flex items-center space-x-3">
                {step.completed ? (
                  <CheckCircle className="w-5 h-5 text-secondary" />
                ) : index === currentStep ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
                <span className={`text-sm ${step.completed ? 'text-gray-700' : index === currentStep ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          {currentProject.status === "building" && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Info className="inline mr-1 w-4 h-4" />
                Estimated time remaining: {estimatedTimeRemaining} minutes
              </p>
            </div>
          )}

          {currentProject.status === "failed" && currentProject.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Build failed:</p>
              <p className="text-xs text-red-700 mt-1">{currentProject.errorMessage}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
