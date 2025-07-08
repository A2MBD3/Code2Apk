import { useState, useCallback } from "react";
import { CloudUpload, FolderOpen, Info, CheckCircle, Github, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { BuildProject, GitHubSource } from "@shared/schema";

interface FileUploadProps {
  onProjectUploaded: (project: BuildProject) => void;
}

export default function FileUpload({ onProjectUploaded }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [githubData, setGithubData] = useState<GitHubSource>({
    githubUrl: "",
    githubBranch: "main",
    projectName: "",
    packageName: "com.example.app",
    version: "1.0.0",
  });
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', file.name.replace('.zip', ''));
      formData.append('packageName', 'com.example.app');
      formData.append('version', '1.0.0');
      
      const response = await apiRequest('POST', '/api/upload', formData);
      return response.json();
    },
    onSuccess: (project: BuildProject) => {
      toast({
        title: "Upload Successful",
        description: "Your project has been uploaded successfully.",
      });
      onProjectUploaded(project);
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const githubMutation = useMutation({
    mutationFn: async (data: GitHubSource) => {
      const response = await apiRequest('POST', '/api/upload/github', data);
      return response.json();
    },
    onSuccess: (project: BuildProject) => {
      toast({
        title: "GitHub Repository Added",
        description: "Your GitHub repository has been processed successfully.",
      });
      onProjectUploaded(project);
      setGithubData({
        githubUrl: "",
        githubBranch: "main",
        projectName: "",
        packageName: "com.example.app",
        version: "1.0.0",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "GitHub Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find(file => file.name.endsWith('.zip'));
    
    if (zipFile) {
      setSelectedFile(zipFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a ZIP file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleGithubSubmit = () => {
    if (!githubData.githubUrl || !githubData.projectName) {
      toast({
        title: "Missing Information",
        description: "Please fill in the GitHub URL and project name.",
        variant: "destructive",
      });
      return;
    }
    githubMutation.mutate(githubData);
  };

  const extractRepoName = (url: string) => {
    try {
      const match = url.match(/github\.com\/[^\/]+\/([^\/]+)/);
      return match ? match[1].replace('.git', '') : '';
    } catch {
      return '';
    }
  };

  const handleGithubUrlChange = (url: string) => {
    setGithubData(prev => ({
      ...prev,
      githubUrl: url,
      projectName: prev.projectName || extractRepoName(url)
    }));
  };

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Source Code</h3>
        
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              ZIP File
            </TabsTrigger>
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub Repository
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragOver ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <CloudUpload className="text-gray-400 w-8 h-8" />
                </div>
                <div>
                  {selectedFile ? (
                    <>
                      <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-gray-900">Drop your ZIP file here</p>
                      <p className="text-gray-500">or click to browse your files</p>
                    </>
                  )}
                </div>
                <div className="flex justify-center">
                  {selectedFile ? (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                      }}
                      disabled={uploadMutation.isPending}
                      className="bg-secondary text-white hover:bg-green-700"
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Upload Project"}
                    </Button>
                  ) : (
                    <Button className="bg-primary text-white hover:bg-blue-700">
                      <FolderOpen className="mr-2 w-4 h-4" />
                      Choose File
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <input
              id="file-input"
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="text-sm text-gray-500">
              <p><Info className="inline mr-1 w-4 h-4" /> Supported formats: ZIP files up to 100MB</p>
              <p><CheckCircle className="inline mr-1 w-4 h-4" /> Required files: AndroidManifest.xml, build.gradle</p>
            </div>
          </TabsContent>
          
          <TabsContent value="github" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="github-url" className="text-sm font-medium text-gray-700">
                  GitHub Repository URL
                </Label>
                <Input
                  id="github-url"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubData.githubUrl}
                  onChange={(e) => handleGithubUrlChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="branch" className="text-sm font-medium text-gray-700">
                    Branch
                  </Label>
                  <Input
                    id="branch"
                    placeholder="main"
                    value={githubData.githubBranch}
                    onChange={(e) => setGithubData(prev => ({ ...prev, githubBranch: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="project-name" className="text-sm font-medium text-gray-700">
                    Project Name
                  </Label>
                  <Input
                    id="project-name"
                    placeholder="My Android App"
                    value={githubData.projectName}
                    onChange={(e) => setGithubData(prev => ({ ...prev, projectName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="package-name" className="text-sm font-medium text-gray-700">
                    Package Name
                  </Label>
                  <Input
                    id="package-name"
                    placeholder="com.example.app"
                    value={githubData.packageName}
                    onChange={(e) => setGithubData(prev => ({ ...prev, packageName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="version" className="text-sm font-medium text-gray-700">
                    Version
                  </Label>
                  <Input
                    id="version"
                    placeholder="1.0.0"
                    value={githubData.version}
                    onChange={(e) => setGithubData(prev => ({ ...prev, version: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleGithubSubmit}
                disabled={githubMutation.isPending || !githubData.githubUrl || !githubData.projectName}
                className="w-full bg-secondary text-white hover:bg-green-700"
              >
                <Github className="mr-2 w-4 h-4" />
                {githubMutation.isPending ? "Processing Repository..." : "Import from GitHub"}
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 space-y-1">
              <p><Info className="inline mr-1 w-4 h-4" /> Public repositories only</p>
              <p><CheckCircle className="inline mr-1 w-4 h-4" /> Repository must contain AndroidManifest.xml and build.gradle</p>
              <p><Github className="inline mr-1 w-4 h-4" /> We'll automatically clone and validate your project structure</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
