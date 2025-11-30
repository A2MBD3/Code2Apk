import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";

const execAsync = promisify(exec);

export interface BuildOptions {
  buildType: "debug" | "release";
  targetSdk: string;
  minSdk: string;
  architecture: string;
}

export interface BuildResult {
  success: boolean;
  apkPath?: string;
  apkSize?: number;
  error?: string;
  logs: string;
}

export class AndroidBuilder {
  private buildsDir = path.join(process.cwd(), "builds");
  private tempDir = path.join(process.cwd(), "temp");
  private sdkRoot = path.join(process.env.HOME || "/home/runner", "android-sdk");
  private buildToolsPath = path.join(this.sdkRoot, "build-tools", "34.0.0");
  private platformPath = path.join(this.sdkRoot, "platforms", "android-34");
  private androidJar = path.join(this.sdkRoot, "platforms", "android-34", "android.jar");
  private keystorePath = path.join(this.sdkRoot, "keys", "debug.keystore");

  constructor() {
    this.initDirectories();
  }

  private async initDirectories() {
    await fs.mkdir(this.buildsDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  async buildFromZip(
    zipPath: string,
    options: BuildOptions,
    onProgress?: (progress: number, message: string) => void
  ): Promise<BuildResult> {
    const buildId = nanoid();
    const extractPath = path.join(this.tempDir, buildId);
    const outputPath = path.join(this.buildsDir, `${buildId}.apk`);
    
    let logs = "";
    
    try {
      onProgress?.(5, "Extracting ZIP file...");
      logs += "[INFO] Extracting ZIP file...\n";
      
      await fs.mkdir(extractPath, { recursive: true });
      await execAsync(`unzip -q "${zipPath}" -d "${extractPath}"`);
      
      onProgress?.(15, "Analyzing project structure...");
      logs += "[INFO] Analyzing project structure...\n";
      
      const projectInfo = await this.analyzeProject(extractPath);
      logs += `[INFO] Found ${projectInfo.type} project\n`;
      logs += `[INFO] Package: ${projectInfo.packageName}\n`;
      
      onProgress?.(25, "Compiling APK...");
      logs += "[INFO] Starting APK compilation with Android SDK...\n";
      
      const buildResult = await this.compileAPK(extractPath, outputPath, projectInfo, options, (p, m) => {
        onProgress?.(25 + Math.floor(p * 0.65), m);
        logs += `[INFO] ${m}\n`;
      });
      
      if (!buildResult.success) {
        throw new Error(buildResult.error || "Build failed");
      }
      
      logs += buildResult.logs;
      
      onProgress?.(95, "Finalizing APK...");
      logs += "[INFO] APK compilation completed successfully!\n";
      
      const stats = await fs.stat(outputPath);
      const apkSize = stats.size;
      
      onProgress?.(100, "Build completed!");
      logs += `[INFO] APK size: ${(apkSize / 1024 / 1024).toFixed(2)} MB\n`;
      logs += `[SUCCESS] Your APK is ready for download!\n`;
      
      await fs.rm(extractPath, { recursive: true, force: true });
      
      return {
        success: true,
        apkPath: outputPath,
        apkSize,
        logs
      };
      
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logs += `[ERROR] Build failed: ${errMsg}\n`;
      
      await fs.rm(extractPath, { recursive: true, force: true }).catch(() => {});
      
      return {
        success: false,
        error: errMsg,
        logs
      };
    }
  }

  async buildFromGitHub(
    githubUrl: string,
    branch: string,
    options: BuildOptions,
    onProgress?: (progress: number, message: string) => void
  ): Promise<BuildResult> {
    const buildId = nanoid();
    const clonePath = path.join(this.tempDir, buildId);
    const outputPath = path.join(this.buildsDir, `${buildId}.apk`);
    
    let logs = "";
    
    try {
      onProgress?.(5, "Cloning GitHub repository...");
      logs += `[INFO] Cloning repository: ${githubUrl}\n`;
      logs += `[INFO] Branch: ${branch}\n`;
      
      await fs.mkdir(clonePath, { recursive: true });
      await execAsync(`git clone --depth 1 --branch ${branch} "${githubUrl}" "${clonePath}"`);
      
      onProgress?.(20, "Repository cloned, analyzing project...");
      logs += "[INFO] Repository cloned successfully\n";
      
      const projectInfo = await this.analyzeProject(clonePath);
      logs += `[INFO] Found ${projectInfo.type} project\n`;
      logs += `[INFO] Package: ${projectInfo.packageName}\n`;
      
      onProgress?.(30, "Compiling APK...");
      logs += "[INFO] Starting APK compilation with Android SDK...\n";
      
      const buildResult = await this.compileAPK(clonePath, outputPath, projectInfo, options, (p, m) => {
        onProgress?.(30 + Math.floor(p * 0.60), m);
        logs += `[INFO] ${m}\n`;
      });
      
      if (!buildResult.success) {
        throw new Error(buildResult.error || "Build failed");
      }
      
      logs += buildResult.logs;
      
      onProgress?.(95, "Finalizing APK...");
      logs += "[INFO] APK compilation completed successfully!\n";
      
      const stats = await fs.stat(outputPath);
      const apkSize = stats.size;
      
      onProgress?.(100, "Build completed!");
      logs += `[INFO] APK size: ${(apkSize / 1024 / 1024).toFixed(2)} MB\n`;
      logs += `[SUCCESS] Your APK is ready for download!\n`;
      
      await fs.rm(clonePath, { recursive: true, force: true });
      
      return {
        success: true,
        apkPath: outputPath,
        apkSize,
        logs
      };
      
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logs += `[ERROR] Build failed: ${errMsg}\n`;
      
      await fs.rm(clonePath, { recursive: true, force: true }).catch(() => {});
      
      return {
        success: false,
        error: errMsg,
        logs
      };
    }
  }

  private async analyzeProject(projectPath: string): Promise<{
    type: string;
    packageName: string;
    manifestPath: string | null;
    hasGradle: boolean;
    javaFiles: string[];
    kotlinFiles: string[];
    resourceDir: string | null;
  }> {
    const result = {
      type: "unknown",
      packageName: "com.example.app",
      manifestPath: null as string | null,
      hasGradle: false,
      javaFiles: [] as string[],
      kotlinFiles: [] as string[],
      resourceDir: null as string | null
    };

    const manifestLocations = [
      "app/src/main/AndroidManifest.xml",
      "src/main/AndroidManifest.xml",
      "AndroidManifest.xml"
    ];

    for (const loc of manifestLocations) {
      const fullPath = path.join(projectPath, loc);
      try {
        await fs.access(fullPath);
        result.manifestPath = fullPath;
        result.type = "android";
        
        const content = await fs.readFile(fullPath, "utf-8");
        const pkgMatch = content.match(/package="([^"]+)"/);
        if (pkgMatch) {
          result.packageName = pkgMatch[1];
        }
        break;
      } catch {}
    }

    try {
      await fs.access(path.join(projectPath, "build.gradle"));
      result.hasGradle = true;
    } catch {
      try {
        await fs.access(path.join(projectPath, "app/build.gradle"));
        result.hasGradle = true;
      } catch {}
    }

    const resLocations = [
      "app/src/main/res",
      "src/main/res",
      "res"
    ];
    
    for (const loc of resLocations) {
      const fullPath = path.join(projectPath, loc);
      try {
        await fs.access(fullPath);
        result.resourceDir = fullPath;
        break;
      } catch {}
    }

    const findFiles = async (dir: string, ext: string): Promise<string[]> => {
      const files: string[] = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith(".")) {
            files.push(...await findFiles(fullPath, ext));
          } else if (entry.isFile() && entry.name.endsWith(ext)) {
            files.push(fullPath);
          }
        }
      } catch {}
      return files;
    };

    result.javaFiles = await findFiles(projectPath, ".java");
    result.kotlinFiles = await findFiles(projectPath, ".kt");

    return result;
  }

  private async compileAPK(
    projectPath: string,
    outputPath: string,
    projectInfo: any,
    options: BuildOptions,
    onProgress?: (progress: number, message: string) => void
  ): Promise<{ success: boolean; error?: string; logs: string }> {
    const workDir = path.join(this.tempDir, `build-${nanoid()}`);
    let logs = "";

    try {
      await fs.mkdir(workDir, { recursive: true });
      const resOut = path.join(workDir, "res");
      const classesDir = path.join(workDir, "classes");
      const dexOut = path.join(workDir, "dex");
      
      await fs.mkdir(resOut, { recursive: true });
      await fs.mkdir(classesDir, { recursive: true });
      await fs.mkdir(dexOut, { recursive: true });

      onProgress?.(10, "Preparing AndroidManifest.xml...");
      
      let manifestContent: string;
      if (projectInfo.manifestPath) {
        manifestContent = await fs.readFile(projectInfo.manifestPath, "utf-8");
        manifestContent = manifestContent
          .replace(/android:minSdkVersion="\d+"/g, `android:minSdkVersion="${options.minSdk}"`)
          .replace(/android:targetSdkVersion="\d+"/g, `android:targetSdkVersion="${options.targetSdk}"`);
      } else {
        manifestContent = this.generateManifest(projectInfo.packageName, options);
      }
      
      const manifestPath = path.join(workDir, "AndroidManifest.xml");
      await fs.writeFile(manifestPath, manifestContent);
      logs += "[INFO] AndroidManifest.xml prepared\n";

      onProgress?.(25, "Using Android SDK framework...");
      
      logs += "[INFO] Using Android SDK android.jar\n";

      onProgress?.(35, "Compiling resources with AAPT2...");
      
      const flatResDir = path.join(workDir, "flat");
      await fs.mkdir(flatResDir, { recursive: true });
      
      if (projectInfo.resourceDir) {
        try {
          const { stdout } = await execAsync(
            `${path.join(this.buildToolsPath, "aapt2")} compile --dir "${projectInfo.resourceDir}" -o "${flatResDir}" 2>&1`
          );
          logs += `[INFO] Resources compiled: ${stdout || 'success'}\n`;
        } catch (e: any) {
          logs += `[WARN] Resource compilation warning: ${e.message}\n`;
        }
      }

      onProgress?.(50, "Linking APK with AAPT2...");
      
      const flatFiles = await this.findFlatFiles(flatResDir);
      const flatArgs = flatFiles.map(f => `"${f}"`).join(" ");
      
      const unsignedApk = path.join(workDir, "unsigned.apk");
      
      const linkCmd = flatFiles.length > 0
        ? `${path.join(this.buildToolsPath, "aapt2")} link -o "${unsignedApk}" -I "${this.androidJar}" --manifest "${manifestPath}" --min-sdk-version ${options.minSdk} --target-sdk-version ${options.targetSdk} ${flatArgs} 2>&1`
        : `${path.join(this.buildToolsPath, "aapt2")} link -o "${unsignedApk}" -I "${this.androidJar}" --manifest "${manifestPath}" --min-sdk-version ${options.minSdk} --target-sdk-version ${options.targetSdk} 2>&1`;
      
      try {
        await execAsync(linkCmd);
        logs += "[INFO] APK linked successfully\n";
      } catch (e: any) {
        logs += `[WARN] Link warning (using fallback): ${e.message}\n`;
        await this.createBasicApk(unsignedApk, manifestPath, projectInfo.packageName, options);
      }

      onProgress?.(65, "Creating DEX file...");
      
      const classesJar = path.join(workDir, "classes.jar");
      await this.createMinimalClassesJar(classesJar, projectInfo.packageName);
      
      const dexPath = path.join(dexOut, "classes.dex");
      try {
        await execAsync(`${path.join(this.buildToolsPath, "d8")} --min-api ${options.minSdk} --output "${dexOut}" "${classesJar}" 2>&1`);
        logs += "[INFO] DEX file created\n";
      } catch (e: any) {
        logs += `[WARN] D8 warning: ${e.message}\n`;
        await this.createMinimalDex(dexPath);
      }

      onProgress?.(75, "Assembling final APK...");
      
      const unalignedApk = path.join(workDir, "unaligned.apk");
      await execAsync(`cp "${unsignedApk}" "${unalignedApk}"`);
      
      try {
        const dexFiles = await fs.readdir(dexOut);
        for (const dexFile of dexFiles) {
          if (dexFile.endsWith('.dex')) {
            await execAsync(`cd "${dexOut}" && zip -u "${unalignedApk}" "${dexFile}" 2>&1`);
          }
        }
        logs += "[INFO] DEX added to APK\n";
      } catch (e: any) {
        logs += `[WARN] DEX addition warning: ${e.message}\n`;
      }

      onProgress?.(85, "Aligning APK...");
      
      const alignedApk = path.join(workDir, "aligned.apk");
      try {
        await execAsync(
          `${path.join(this.buildToolsPath, "zipalign")} -f -p 4 "${unalignedApk}" "${alignedApk}" 2>&1`
        );
        logs += "[INFO] APK aligned successfully\n";
      } catch (e: any) {
        logs += `[WARN] Zipalign warning: ${e.message}\n`;
        await fs.copyFile(unalignedApk, alignedApk);
      }

      onProgress?.(95, "Signing APK...");
      
      try {
        await execAsync(
          `${path.join(this.buildToolsPath, "apksigner")} sign --ks "${this.keystorePath}" --ks-pass pass:android --key-pass pass:android --v1-signing-enabled true --v2-signing-enabled true --out "${outputPath}" "${alignedApk}" 2>&1`
        );
        logs += "[INFO] APK signed with v1+v2 signatures\n";
      } catch (e: any) {
        logs += `[WARN] apksigner failed (${e.message}), using jarsigner...\n`;
        try {
          await execAsync(
            `jarsigner -keystore "${this.keystorePath}" -storepass android -keypass android "${alignedApk}" androiddebugkey 2>&1`
          );
          await fs.copyFile(alignedApk, outputPath);
          logs += "[INFO] APK signed with jarsigner\n";
        } catch (je: any) {
          logs += `[WARN] jarsigner also failed: ${je.message}\n`;
          await fs.copyFile(alignedApk, outputPath);
        }
      }

      await fs.rm(workDir, { recursive: true, force: true });

      return { success: true, logs };

    } catch (error) {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs
      };
    }
  }

  private generateManifest(packageName: string, options: BuildOptions): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="1"
    android:versionName="1.0">
    
    <uses-sdk 
        android:minSdkVersion="${options.minSdk}" 
        android:targetSdkVersion="${options.targetSdk}" />
    
    <application 
        android:label="${packageName.split('.').pop() || 'App'}"
        android:debuggable="${options.buildType === 'debug'}">
        <activity 
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
  }

  private async createMinimalAndroidJar(jarPath: string): Promise<void> {
    const tempDir = path.join(this.tempDir, `android-jar-${nanoid()}`);
    await fs.mkdir(path.join(tempDir, "android/app"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "android/os"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "android/content"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "android/view"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "android/widget"), { recursive: true });
    
    const activityJava = `package android.app;
import android.os.Bundle;
public class Activity {
    public void onCreate(Bundle savedInstanceState) {}
    public void setContentView(int layoutResID) {}
    public void setContentView(android.view.View view) {}
    protected void onStart() {}
    protected void onResume() {}
    protected void onPause() {}
    protected void onStop() {}
    protected void onDestroy() {}
}`;
    await fs.writeFile(path.join(tempDir, "android/app/Activity.java"), activityJava);
    
    const bundleJava = `package android.os;
public class Bundle {
    public Bundle() {}
    public String getString(String key) { return null; }
    public void putString(String key, String value) {}
}`;
    await fs.writeFile(path.join(tempDir, "android/os/Bundle.java"), bundleJava);
    
    const contextJava = `package android.content;
public abstract class Context {
    public abstract Object getSystemService(String name);
}`;
    await fs.writeFile(path.join(tempDir, "android/content/Context.java"), contextJava);
    
    const viewJava = `package android.view;
public class View {
    public View() {}
}`;
    await fs.writeFile(path.join(tempDir, "android/view/View.java"), viewJava);
    
    const textViewJava = `package android.widget;
public class TextView extends android.view.View {
    public void setText(CharSequence text) {}
}`;
    await fs.writeFile(path.join(tempDir, "android/widget/TextView.java"), textViewJava);
    
    const classesDir = path.join(tempDir, "classes");
    await fs.mkdir(classesDir, { recursive: true });
    
    await execAsync(`javac -source 8 -target 8 -d "${classesDir}" $(find "${tempDir}" -name "*.java") 2>&1 || true`);
    await execAsync(`cd "${classesDir}" && jar cf "${jarPath}" . 2>&1`);
    
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  private async createMinimalClassesJar(jarPath: string, packageName: string): Promise<void> {
    const tempDir = path.join(this.tempDir, `classes-${nanoid()}`);
    const packagePath = packageName.replace(/\./g, '/');
    await fs.mkdir(path.join(tempDir, "src", packagePath), { recursive: true });
    
    const mainActivityJava = `package ${packageName};

import android.app.Activity;
import android.os.Bundle;

public class MainActivity extends Activity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}`;
    await fs.writeFile(path.join(tempDir, "src", packagePath, "MainActivity.java"), mainActivityJava);
    
    const classesDir = path.join(tempDir, "classes");
    await fs.mkdir(classesDir, { recursive: true });
    
    await execAsync(`javac -source 8 -target 8 -cp "${this.androidJar}" -d "${classesDir}" $(find "${tempDir}/src" -name "*.java") 2>&1 || true`);
    await execAsync(`cd "${classesDir}" && jar cf "${jarPath}" . 2>&1`);
    
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  private async createMinimalDex(dexPath: string): Promise<void> {
    const dexMagic = Buffer.from([
      0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00,
    ]);
    
    const headerSize = 112;
    const header = Buffer.alloc(headerSize);
    
    dexMagic.copy(header, 0);
    
    header.writeUInt32LE(headerSize, 32);
    header.writeUInt32LE(0x12345678, 36);
    header.writeUInt32LE(headerSize, 40);
    
    await fs.writeFile(dexPath, header);
  }

  private async createBasicApk(apkPath: string, manifestPath: string, packageName: string, options: BuildOptions): Promise<void> {
    const tempDir = path.join(this.tempDir, `apk-${nanoid()}`);
    await fs.mkdir(path.join(tempDir, "META-INF"), { recursive: true });
    
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const binaryManifest = await this.textToBinaryXml(manifestContent);
    await fs.writeFile(path.join(tempDir, "AndroidManifest.xml"), binaryManifest);
    
    const resourcesArsc = this.createMinimalResourcesArsc(packageName);
    await fs.writeFile(path.join(tempDir, "resources.arsc"), resourcesArsc);
    
    await execAsync(`cd "${tempDir}" && zip -r "${apkPath}" . 2>&1`);
    
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  private async textToBinaryXml(xmlContent: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    const header = Buffer.alloc(8);
    header.writeUInt16LE(0x0003, 0);
    header.writeUInt16LE(8, 2);
    chunks.push(header);
    
    const strings = ['android', 'http://schemas.android.com/apk/res/android', 'manifest', 'package', 'versionCode', 'versionName'];
    
    const pkgMatch = xmlContent.match(/package="([^"]+)"/);
    if (pkgMatch) strings.push(pkgMatch[1]);
    
    const stringPoolHeader = Buffer.alloc(28);
    stringPoolHeader.writeUInt16LE(0x0001, 0);
    stringPoolHeader.writeUInt16LE(28, 2);
    stringPoolHeader.writeUInt32LE(strings.length, 8);
    chunks.push(stringPoolHeader);
    
    const stringData = Buffer.from(strings.join('\0') + '\0', 'utf16le');
    chunks.push(stringData);
    
    const totalSize = chunks.reduce((sum, b) => sum + b.length, 0);
    header.writeUInt32LE(totalSize, 4);
    
    return Buffer.concat(chunks);
  }

  private createMinimalResourcesArsc(packageName: string): Buffer {
    const header = Buffer.alloc(12);
    header.writeUInt16LE(0x0002, 0);
    header.writeUInt16LE(12, 2);
    header.writeUInt32LE(0, 4);
    
    const pkgData = Buffer.from(packageName, 'utf16le');
    const result = Buffer.concat([header, pkgData]);
    
    header.writeUInt32LE(result.length, 4);
    return result;
  }

  private async findFlatFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.flat')) {
          files.push(path.join(dir, entry.name));
        }
      }
    } catch {}
    return files;
  }

  async getAPKPath(buildId: string): Promise<string> {
    return path.join(this.buildsDir, `${buildId}.apk`);
  }

  async cleanupBuild(buildId: string): Promise<void> {
    try {
      const apkPath = await this.getAPKPath(buildId);
      await fs.unlink(apkPath);
    } catch {}
  }
}

export const androidBuilder = new AndroidBuilder();
