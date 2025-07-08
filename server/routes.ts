import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBuildProjectSchema, buildConfigSchema, githubSourceSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload GitHub source code
  app.post("/api/upload/github", async (req, res) => {
    try {
      const githubData = githubSourceSchema.parse(req.body);
      const buildId = nanoid();
      
      // Simulate GitHub repository validation
      const project = await storage.createBuildProject({
        name: githubData.projectName,
        packageName: githubData.packageName,
        version: githubData.version,
        sourceType: "github",
        fileSize: null,
        filePath: null,
        githubUrl: githubData.githubUrl,
        githubBranch: githubData.githubBranch,
        status: "uploaded",
        progress: 0,
        buildType: "debug",
        targetSdk: "33",
        minSdk: "21",
        architecture: "universal",
        buildId,
        downloadUrl: null,
        apkSize: null,
        buildLogs: `[INFO] GitHub repository cloned successfully\n[INFO] Repository: ${githubData.githubUrl}\n[INFO] Branch: ${githubData.githubBranch}\n[INFO] Validating project structure...\n`,
        errorMessage: null,
      });

      res.json(project);
    } catch (error) {
      console.error("GitHub upload error:", error);
      res.status(500).json({ message: "Failed to process GitHub repository" });
    }
  });

  // Upload source code file
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const buildId = nanoid();
      
      // Mock project validation - check for required files
      const mockProjectData = {
        name: req.body.projectName || "Android Project",
        packageName: req.body.packageName || "com.example.app",
        version: req.body.version || "1.0.0",
      };

      const project = await storage.createBuildProject({
        name: mockProjectData.name,
        packageName: mockProjectData.packageName,
        version: mockProjectData.version,
        sourceType: "file",
        fileSize: req.file.size,
        filePath: req.file.path,
        githubUrl: null,
        githubBranch: null,
        status: "uploaded",
        progress: 0,
        buildType: "debug",
        targetSdk: "33",
        minSdk: "21",
        architecture: "universal",
        buildId,
        downloadUrl: null,
        apkSize: null,
        buildLogs: "[INFO] Project uploaded successfully\n[INFO] Validating project structure...\n",
        errorMessage: null,
      });

      res.json(project);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Start build process
  app.post("/api/build/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const config = buildConfigSchema.parse(req.body);

      const project = await storage.getBuildProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Update project with build configuration
      const updatedProject = await storage.updateBuildProject(projectId, {
        status: "building",
        progress: 10,
        buildType: config.buildType,
        targetSdk: config.targetSdk,
        minSdk: config.minSdk,
        architecture: config.architecture,
        buildLogs: project.buildLogs + "[INFO] Starting build process...\n[INFO] Build configuration applied\n[DEBUG] Resolving dependencies...\n",
      });

      // Start mock build process
      simulateBuildProcess(projectId);

      res.json(updatedProject);
    } catch (error) {
      console.error("Build start error:", error);
      res.status(500).json({ message: "Failed to start build" });
    }
  });

  // Get project status
  app.get("/api/project/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getBuildProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Get project error:", error);
      res.status(500).json({ message: "Failed to get project" });
    }
  });

  // Get recent builds
  app.get("/api/builds/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const projects = await storage.getRecentBuildProjects(limit);
      res.json(projects);
    } catch (error) {
      console.error("Get recent builds error:", error);
      res.status(500).json({ message: "Failed to get recent builds" });
    }
  });

  // Download APK
  app.get("/api/download/:buildId", async (req, res) => {
    try {
      const buildId = req.params.buildId;
      const project = await storage.getBuildProjectByBuildId(buildId);
      
      if (!project || project.status !== "completed") {
        return res.status(404).json({ message: "APK not found or not ready" });
      }

      // Create a mock APK file for demonstration
      const fileName = `${project.name.replace(/[^a-z0-9]/gi, '_')}-${project.version}.apk`;
      
      // Set proper headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Length', project.apkSize || 8000000);
      
      // Create mock APK content (in real implementation, this would be the actual compiled APK)
      const mockApkContent = Buffer.alloc(project.apkSize || 8000000, 'A');
      
      // Add APK file signature headers to make it look like a real APK
      const apkHeader = Buffer.from('PK\x03\x04', 'binary'); // ZIP file signature
      mockApkContent.write('PK\x03\x04', 0, 'binary');
      
      res.send(mockApkContent);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Download failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Mock build process simulation
async function simulateBuildProcess(projectId: number) {
  const buildSteps = [
    { progress: 20, logs: "[INFO] Dependencies resolved\n[DEBUG] Compiling Java sources...\n" },
    { progress: 40, logs: "[INFO] Java compilation complete\n[DEBUG] Processing resources...\n" },
    { progress: 60, logs: "[INFO] Resources processed\n[DEBUG] Generating DEX files...\n" },
    { progress: 80, logs: "[INFO] DEX generation complete\n[DEBUG] Packaging APK...\n" },
    { progress: 100, logs: "[INFO] APK packaging complete\n[INFO] Signing APK...\n[INFO] Build successful!\n" }
  ];

  for (let i = 0; i < buildSteps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    
    const step = buildSteps[i];
    const project = await storage.getBuildProject(projectId);
    
    if (!project) continue;

    const isLastStep = i === buildSteps.length - 1;
    const downloadUrl = isLastStep ? `/api/download/${project.buildId}` : null;
    const apkSize = isLastStep ? Math.floor(Math.random() * 10000000) + 5000000 : null; // Random size between 5-15MB
    
    await storage.updateBuildProject(projectId, {
      progress: step.progress,
      buildLogs: project.buildLogs + step.logs,
      status: isLastStep ? "completed" : "building",
      downloadUrl,
      apkSize,
      completedAt: isLastStep ? new Date() : null,
    });
  }
}
