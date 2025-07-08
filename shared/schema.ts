import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const buildProjects = pgTable("build_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  packageName: text("package_name").notNull(),
  version: text("version").notNull(),
  sourceType: text("source_type").notNull(), // 'file' or 'github'
  fileSize: integer("file_size"), // in bytes, nullable for GitHub sources
  filePath: text("file_path"), // nullable for GitHub sources
  githubUrl: text("github_url"), // GitHub repository URL
  githubBranch: text("github_branch").default("main"), // GitHub branch to build from
  status: text("status").notNull(), // 'uploaded', 'building', 'completed', 'failed'
  progress: integer("progress").default(0), // 0-100
  buildType: text("build_type").notNull().default("debug"),
  targetSdk: text("target_sdk").notNull().default("33"),
  minSdk: text("min_sdk").notNull().default("21"),
  architecture: text("architecture").notNull().default("universal"),
  buildId: text("build_id").notNull(),
  downloadUrl: text("download_url"),
  apkSize: integer("apk_size"), // in bytes
  buildLogs: text("build_logs").default(""),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertBuildProjectSchema = createInsertSchema(buildProjects).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const buildConfigSchema = z.object({
  buildType: z.enum(["debug", "release"]),
  targetSdk: z.string(),
  minSdk: z.string(),
  architecture: z.enum(["universal", "arm64-v8a", "armeabi-v7a"]),
});

export const githubSourceSchema = z.object({
  githubUrl: z.string().url().refine(
    (url) => url.includes('github.com'),
    { message: "Must be a valid GitHub repository URL" }
  ),
  githubBranch: z.string().default("main"),
  projectName: z.string().min(1, "Project name is required"),
  packageName: z.string().min(1, "Package name is required").default("com.example.app"),
  version: z.string().min(1, "Version is required").default("1.0.0"),
});

export type InsertBuildProject = z.infer<typeof insertBuildProjectSchema>;
export type BuildProject = typeof buildProjects.$inferSelect;
export type BuildConfig = z.infer<typeof buildConfigSchema>;
export type GitHubSource = z.infer<typeof githubSourceSchema>;
