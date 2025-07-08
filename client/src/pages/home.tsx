import { useState } from "react";
import { Smartphone, Menu, FileText, Code, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/file-upload";
import BuildConfiguration from "@/components/build-configuration";
import BuildProgress from "@/components/build-progress";
import BuildLogs from "@/components/build-logs";
import ProjectInfo from "@/components/project-info";
import BuildStatus from "@/components/build-status";
import DownloadSection from "@/components/download-section";
import RecentBuilds from "@/components/recent-builds";
import type { BuildProject } from "@shared/schema";

export default function Home() {
  const [currentProject, setCurrentProject] = useState<BuildProject | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Smartphone className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">APK Builder</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-primary font-medium">Documentation</a>
              <a href="#" className="text-gray-600 hover:text-primary font-medium">API</a>
              <Button className="bg-primary text-white hover:bg-blue-700">
                Sign In
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Android APK Compiler</h2>
          <p className="text-lg text-gray-600">Upload your Android source code and get a compiled APK ready for installation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload and Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <FileUpload onProjectUploaded={setCurrentProject} />
            <BuildConfiguration project={currentProject} onProjectUpdated={setCurrentProject} />
            <BuildProgress project={currentProject} />
            <BuildLogs project={currentProject} />
          </div>

          {/* Right Column: Status and Download */}
          <div className="space-y-6">
            <ProjectInfo project={currentProject} />
            <BuildStatus project={currentProject} />
            <DownloadSection project={currentProject} />
            <RecentBuilds />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">APK Builder</h4>
              <p className="text-sm text-gray-600">Compile Android applications from source code quickly and securely.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Documentation</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Getting Started</a></li>
                <li><a href="#" className="hover:text-primary">API Reference</a></li>
                <li><a href="#" className="hover:text-primary">Build Configuration</a></li>
                <li><a href="#" className="hover:text-primary">Troubleshooting</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary">Bug Reports</a></li>
                <li><a href="#" className="hover:text-primary">Feature Requests</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>&copy; 2024 APK Builder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
