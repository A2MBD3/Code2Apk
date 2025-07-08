import { buildProjects, type BuildProject, type InsertBuildProject } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Build project methods
  createBuildProject(project: InsertBuildProject): Promise<BuildProject>;
  getBuildProject(id: number): Promise<BuildProject | undefined>;
  getBuildProjectByBuildId(buildId: string): Promise<BuildProject | undefined>;
  updateBuildProject(id: number, updates: Partial<BuildProject>): Promise<BuildProject | undefined>;
  getAllBuildProjects(): Promise<BuildProject[]>;
  getRecentBuildProjects(limit: number): Promise<BuildProject[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private buildProjects: Map<number, BuildProject>;
  private currentUserId: number;
  private currentProjectId: number;

  constructor() {
    this.users = new Map();
    this.buildProjects = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBuildProject(insertProject: InsertBuildProject): Promise<BuildProject> {
    const id = this.currentProjectId++;
    const project: BuildProject = {
      ...insertProject,
      id,
      progress: insertProject.progress ?? 0,
      buildType: insertProject.buildType ?? "debug",
      targetSdk: insertProject.targetSdk ?? "33",
      minSdk: insertProject.minSdk ?? "21", 
      architecture: insertProject.architecture ?? "universal",
      fileSize: insertProject.fileSize ?? null,
      filePath: insertProject.filePath ?? null,
      githubUrl: insertProject.githubUrl ?? null,
      githubBranch: insertProject.githubBranch ?? null,
      downloadUrl: insertProject.downloadUrl ?? null,
      apkSize: insertProject.apkSize ?? null,
      buildLogs: insertProject.buildLogs ?? "",
      errorMessage: insertProject.errorMessage ?? null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.buildProjects.set(id, project);
    return project;
  }

  async getBuildProject(id: number): Promise<BuildProject | undefined> {
    return this.buildProjects.get(id);
  }

  async getBuildProjectByBuildId(buildId: string): Promise<BuildProject | undefined> {
    return Array.from(this.buildProjects.values()).find(
      (project) => project.buildId === buildId
    );
  }

  async updateBuildProject(id: number, updates: Partial<BuildProject>): Promise<BuildProject | undefined> {
    const project = this.buildProjects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updates };
    this.buildProjects.set(id, updatedProject);
    return updatedProject;
  }

  async getAllBuildProjects(): Promise<BuildProject[]> {
    return Array.from(this.buildProjects.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRecentBuildProjects(limit: number): Promise<BuildProject[]> {
    const projects = await this.getAllBuildProjects();
    return projects.slice(0, limit);
  }
}

export const storage = new MemStorage();
