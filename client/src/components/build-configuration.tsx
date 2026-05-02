import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildConfigSchema, type BuildConfig, type BuildProject } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, RotateCcw } from "lucide-react";

interface BuildConfigurationProps {
  project: BuildProject | null;
  onProjectUpdated: (project: BuildProject) => void;
}

export default function BuildConfiguration({ project, onProjectUpdated }: BuildConfigurationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BuildConfig>({
    resolver: zodResolver(buildConfigSchema),
    defaultValues: {
      buildType: "debug",
      targetSdk: "33",
      minSdk: "21",
      architecture: "universal",
    },
  });

  const buildMutation = useMutation({
    mutationFn: async (config: BuildConfig) => {
      if (!project) throw new Error("No project selected");
      const response = await apiRequest('POST', `/api/build/${project.id}`, config);
      return response.json();
    },
    onSuccess: (updatedProject: BuildProject) => {
      toast({
        title: "Build Started",
        description: "Your APK compilation has begun.",
      });
      onProjectUpdated(updatedProject);
      queryClient.invalidateQueries({ queryKey: ['/api/builds/recent'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Build Failed to Start",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BuildConfig) => {
    buildMutation.mutate(data);
  };

  const isDisabled =
    !project ||
    project.status === "building" ||
    project.status === "completed" ||
    buildMutation.isPending;

  const getButtonLabel = () => {
    if (buildMutation.isPending) return "Starting Build...";
    if (project?.status === "building") return "Building...";
    if (project?.status === "completed") return "Build Complete";
    return "Start Build";
  };

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Configuration</h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buildType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Build Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select build type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="release">Release</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetSdk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Target SDK</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select target SDK" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="34">API 34 (Android 14)</SelectItem>
                        <SelectItem value="33">API 33 (Android 13)</SelectItem>
                        <SelectItem value="32">API 32 (Android 12L)</SelectItem>
                        <SelectItem value="31">API 31 (Android 12)</SelectItem>
                        <SelectItem value="30">API 30 (Android 11)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minSdk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Min SDK</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select min SDK" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="21">API 21 (Android 5.0)</SelectItem>
                        <SelectItem value="23">API 23 (Android 6.0)</SelectItem>
                        <SelectItem value="26">API 26 (Android 8.0)</SelectItem>
                        <SelectItem value="28">API 28 (Android 9.0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="architecture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Architecture</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select architecture" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="universal">Universal (arm64-v8a, armeabi-v7a)</SelectItem>
                        <SelectItem value="arm64-v8a">arm64-v8a only</SelectItem>
                        <SelectItem value="armeabi-v7a">armeabi-v7a only</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              {project?.status === "completed" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onProjectUpdated({ ...project, status: "uploaded" })}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Build
                </Button>
              )}
              <Button
                type="submit"
                disabled={isDisabled}
                className="bg-secondary text-white hover:bg-green-700 disabled:opacity-60"
              >
                <Play className="mr-2 w-4 h-4" />
                {getButtonLabel()}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
