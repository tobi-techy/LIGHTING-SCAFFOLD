import fs from "fs-extra";
import path from "path";
import ejs from "ejs";
import { ProjectConfig, isMonorepoPreset, PRESET_INFO } from "./utils/types.js";
import { getTemplatesDir } from "./utils/helpers.js";

export async function scaffold(config: ProjectConfig): Promise<string> {
  const targetDir = path.resolve(process.cwd(), config.name);
  const templatesDir = getTemplatesDir();
  const isMonorepo = isMonorepoPreset(config.preset);
  const platforms = PRESET_INFO[config.preset].platforms;

  await fs.ensureDir(targetDir);

  if (isMonorepo) {
    await setupMonorepo(targetDir, config);

    if (platforms.includes("mobile")) {
      await copyTemplate(path.join(templatesDir, "mobile"), path.join(targetDir, "apps/mobile"), config);
    }
    if (platforms.includes("web")) {
      await copyTemplate(path.join(templatesDir, "web"), path.join(targetDir, "apps/web"), config);
    }
    if (config.backend !== "none") {
      await fs.ensureDir(path.join(targetDir, "packages/backend"));
      await copyTemplate(path.join(templatesDir, "backend", config.backend), path.join(targetDir, "packages/backend"), config);
    }
  } else {
    // Flat structure
    const platformTemplate = platforms[0] === "mobile" ? "mobile" : "web";
    await copyTemplate(path.join(templatesDir, platformTemplate), targetDir, config);
  }

  const appDir = isMonorepo
    ? path.join(targetDir, platforms[0] === "mobile" ? "apps/mobile" : "apps/web")
    : targetDir;

  // Layer customizations
  await addStyling(appDir, config);
  await addStateManagement(appDir, config);
  await addComponents(appDir, config);
  await addExamples(appDir, platforms[0], config);
  await copyTemplate(path.join(templatesDir, "base"), isMonorepo ? targetDir : appDir, config);

  return targetDir;
}

async function setupMonorepo(targetDir: string, config: ProjectConfig): Promise<void> {
  const pkg = {
    name: config.name,
    private: true,
    scripts: {
      dev: "echo 'Run dev in apps/*'",
      build: "echo 'Run build in apps/*'"
    }
  };

  if (config.packageManager === "pnpm") {
    await fs.writeFile(path.join(targetDir, "pnpm-workspace.yaml"), "packages:\n  - 'apps/*'\n  - 'packages/*'\n");
  } else {
    (pkg as any).workspaces = ["apps/*", "packages/*"];
  }

  await fs.writeJson(path.join(targetDir, "package.json"), pkg, { spaces: 2 });
  await fs.ensureDir(path.join(targetDir, "apps"));
  await fs.ensureDir(path.join(targetDir, "packages"));
}

async function addStyling(appDir: string, config: ProjectConfig): Promise<void> {
  if (config.styling === "none") return;

  const pkgPath = path.join(appDir, "package.json");
  if (!(await fs.pathExists(pkgPath))) return;

  const pkg = await fs.readJson(pkgPath);
  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};

  if (config.styling === "nativewind") {
    pkg.dependencies["nativewind"] = "^4.0.0";
    pkg.devDependencies["tailwindcss"] = "^3.4.0";
    const templatesDir = getTemplatesDir();
    await copyTemplate(path.join(templatesDir, "styling", "nativewind"), appDir, config);
  }
  // Tailwind is already included in web template

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

async function addStateManagement(appDir: string, config: ProjectConfig): Promise<void> {
  const pkgPath = path.join(appDir, "package.json");
  if (!(await fs.pathExists(pkgPath))) return;

  const pkg = await fs.readJson(pkgPath);
  pkg.dependencies = pkg.dependencies || {};

  if (config.state === "zustand") {
    pkg.dependencies["zustand"] = "^4.5.0";
  } else {
    pkg.dependencies["@reduxjs/toolkit"] = "^2.0.0";
    pkg.dependencies["react-redux"] = "^9.0.0";
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  const templatesDir = getTemplatesDir();
  await copyTemplate(path.join(templatesDir, "state", config.state), path.join(appDir, "lib/store"), config);
}

async function addComponents(appDir: string, config: ProjectConfig): Promise<void> {
  if (config.components === "none") return;
  const templatesDir = getTemplatesDir();
  await copyTemplate(path.join(templatesDir, "components", config.components), path.join(appDir, "components/ui"), config);
}

async function addExamples(appDir: string, platform: "mobile" | "web", config: ProjectConfig): Promise<void> {
  const templatesDir = getTemplatesDir();
  const examplesDir = path.join(templatesDir, "examples", platform);
  const targetDir = platform === "mobile" ? path.join(appDir, "app") : path.join(appDir, "app/examples");

  await copyTemplate(examplesDir, targetDir, config);
}

async function copyTemplate(src: string, dest: string, config: ProjectConfig): Promise<void> {
  if (!(await fs.pathExists(src))) return;

  await fs.ensureDir(dest);
  const files = await fs.readdir(src, { withFileTypes: true });

  for (const file of files) {
    const srcPath = path.join(src, file.name);
    const destName = file.name.replace(/\.ejs$/, "");
    const destPath = path.join(dest, destName);

    if (file.isDirectory()) {
      await copyTemplate(srcPath, destPath, config);
    } else if (file.name.endsWith(".ejs")) {
      const content = await fs.readFile(srcPath, "utf-8");
      const rendered = ejs.render(content, config);
      await fs.writeFile(destPath, rendered);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}
