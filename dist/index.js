#!/usr/bin/env node

// src/index.ts
import { program } from "commander";
import * as p2 from "@clack/prompts";
import pc2 from "picocolors";
import gradient from "gradient-string";
import figlet from "figlet";

// src/cli.ts
import * as p from "@clack/prompts";
import pc from "picocolors";

// src/utils/types.ts
var PRESET_INFO = {
  mobile: { label: "Mobile App", hint: "React Native + Expo", platforms: ["mobile"] },
  web: { label: "Web App", hint: "Next.js", platforms: ["web"] },
  "fullstack-mobile": { label: "Full-Stack Mobile", hint: "React Native + Backend", platforms: ["mobile"] },
  "fullstack-web": { label: "Full-Stack Web", hint: "Next.js + Backend", platforms: ["web"] },
  monorepo: { label: "Monorepo", hint: "Mobile + Web + Backend", platforms: ["mobile", "web"] }
};
function getCompatibleOptions(preset) {
  const info = PRESET_INFO[preset];
  const hasMobile = info.platforms.includes("mobile");
  const hasWeb = info.platforms.includes("web");
  const hasBackend = preset.includes("fullstack") || preset === "monorepo";
  return {
    styling: hasMobile ? ["nativewind", "none"] : ["tailwind", "none"],
    components: hasMobile ? ["nativewind-ui", "none"] : ["shadcn", "none"],
    backend: hasBackend ? ["supabase", "firebase"] : ["none"],
    state: ["zustand", "redux"]
  };
}
function isMonorepoPreset(preset) {
  return preset === "fullstack-mobile" || preset === "fullstack-web" || preset === "monorepo";
}

// src/utils/helpers.ts
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
function validateProjectName(name) {
  if (!name) return "Project name is required";
  if (!/^[a-z0-9-_]+$/i.test(name)) return "Only letters, numbers, hyphens, and underscores allowed";
  if (fs.existsSync(name)) return `Directory "${name}" already exists`;
  return void 0;
}
function getTemplatesDir() {
  const __dirname2 = path.dirname(fileURLToPath(import.meta.url));
  return path.join(__dirname2, "..", "templates");
}

// src/cli.ts
async function runPrompts() {
  p.intro(pc.bgCyan(pc.black(" create-lightning-scaffold ")));
  const name = await p.text({
    message: "Project name:",
    placeholder: "my-app",
    validate: validateProjectName
  });
  if (p.isCancel(name)) return null;
  const preset = await p.select({
    message: "Select a preset:",
    options: Object.entries(PRESET_INFO).map(([value, { label, hint }]) => ({
      value,
      label,
      hint
    }))
  });
  if (p.isCancel(preset)) return null;
  const options = getCompatibleOptions(preset);
  const customize = await p.confirm({
    message: "Customize options?",
    initialValue: false
  });
  if (p.isCancel(customize)) return null;
  let styling = options.styling[0];
  let components = options.components[0];
  let state = "zustand";
  let backend = options.backend[0];
  if (customize) {
    const stylingChoice = await p.select({
      message: "Styling:",
      options: options.styling.map((v) => ({ value: v, label: v === "none" ? "None" : v }))
    });
    if (p.isCancel(stylingChoice)) return null;
    styling = stylingChoice;
    const stateChoice = await p.select({
      message: "State management:",
      options: [
        { value: "zustand", label: "Zustand" },
        { value: "redux", label: "Redux Toolkit" }
      ]
    });
    if (p.isCancel(stateChoice)) return null;
    state = stateChoice;
    const componentsChoice = await p.select({
      message: "Component library:",
      options: options.components.map((v) => ({ value: v, label: v === "none" ? "None" : v }))
    });
    if (p.isCancel(componentsChoice)) return null;
    components = componentsChoice;
    if (options.backend[0] !== "none") {
      const backendChoice = await p.select({
        message: "Backend:",
        options: [
          { value: "supabase", label: "Supabase" },
          { value: "firebase", label: "Firebase" }
        ]
      });
      if (p.isCancel(backendChoice)) return null;
      backend = backendChoice;
    }
  }
  const packageManager = await p.select({
    message: "Package manager:",
    options: [
      { value: "npm", label: "npm" },
      { value: "pnpm", label: "pnpm" },
      { value: "yarn", label: "yarn" },
      { value: "bun", label: "bun" }
    ]
  });
  if (p.isCancel(packageManager)) return null;
  const gitInit = await p.confirm({
    message: "Initialize git repository?",
    initialValue: true
  });
  if (p.isCancel(gitInit)) return null;
  return {
    name,
    preset,
    backend,
    styling,
    state,
    components,
    packageManager,
    gitInit
  };
}

// src/scaffolder.ts
import fs2 from "fs-extra";
import path2 from "path";
import ejs from "ejs";
async function scaffold(config) {
  const targetDir = path2.resolve(process.cwd(), config.name);
  const templatesDir = getTemplatesDir();
  const isMonorepo = isMonorepoPreset(config.preset);
  const platforms = PRESET_INFO[config.preset].platforms;
  await fs2.ensureDir(targetDir);
  if (isMonorepo) {
    await setupMonorepo(targetDir, config);
    if (platforms.includes("mobile")) {
      await copyTemplate(path2.join(templatesDir, "mobile"), path2.join(targetDir, "apps/mobile"), config);
    }
    if (platforms.includes("web")) {
      await copyTemplate(path2.join(templatesDir, "web"), path2.join(targetDir, "apps/web"), config);
    }
    if (config.backend !== "none") {
      await fs2.ensureDir(path2.join(targetDir, "packages/backend"));
      await copyTemplate(path2.join(templatesDir, "backend", config.backend), path2.join(targetDir, "packages/backend"), config);
    }
  } else {
    const platformTemplate = platforms[0] === "mobile" ? "mobile" : "web";
    await copyTemplate(path2.join(templatesDir, platformTemplate), targetDir, config);
  }
  const appDir = isMonorepo ? path2.join(targetDir, platforms[0] === "mobile" ? "apps/mobile" : "apps/web") : targetDir;
  await addStyling(appDir, config);
  await addStateManagement(appDir, config);
  await addComponents(appDir, config);
  await addExamples(appDir, platforms[0], config);
  await copyTemplate(path2.join(templatesDir, "base"), targetDir, config);
  return targetDir;
}
async function setupMonorepo(targetDir, config) {
  const pkg = {
    name: config.name,
    private: true,
    scripts: {
      dev: "echo 'Run dev in apps/*'",
      build: "echo 'Run build in apps/*'"
    }
  };
  if (config.packageManager === "pnpm") {
    await fs2.writeFile(path2.join(targetDir, "pnpm-workspace.yaml"), "packages:\n  - 'apps/*'\n  - 'packages/*'\n");
  } else {
    pkg.workspaces = ["apps/*", "packages/*"];
  }
  await fs2.writeJson(path2.join(targetDir, "package.json"), pkg, { spaces: 2 });
  await fs2.ensureDir(path2.join(targetDir, "apps"));
  await fs2.ensureDir(path2.join(targetDir, "packages"));
}
async function addStyling(appDir, config) {
  if (config.styling === "none") return;
  const pkgPath = path2.join(appDir, "package.json");
  if (!await fs2.pathExists(pkgPath)) return;
  const pkg = await fs2.readJson(pkgPath);
  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};
  if (config.styling === "nativewind") {
    pkg.dependencies["nativewind"] = "^4.0.0";
    pkg.devDependencies["tailwindcss"] = "^3.4.0";
    const templatesDir = getTemplatesDir();
    await copyTemplate(path2.join(templatesDir, "styling", "nativewind"), appDir, config);
  }
  await fs2.writeJson(pkgPath, pkg, { spaces: 2 });
}
async function addStateManagement(appDir, config) {
  const pkgPath = path2.join(appDir, "package.json");
  if (!await fs2.pathExists(pkgPath)) return;
  const pkg = await fs2.readJson(pkgPath);
  pkg.dependencies = pkg.dependencies || {};
  if (config.state === "zustand") {
    pkg.dependencies["zustand"] = "^4.5.0";
  } else {
    pkg.dependencies["@reduxjs/toolkit"] = "^2.0.0";
    pkg.dependencies["react-redux"] = "^9.0.0";
  }
  await fs2.writeJson(pkgPath, pkg, { spaces: 2 });
  const templatesDir = getTemplatesDir();
  await copyTemplate(path2.join(templatesDir, "state", config.state), path2.join(appDir, "lib/store"), config);
}
async function addComponents(appDir, config) {
  if (config.components === "none") return;
  const templatesDir = getTemplatesDir();
  await copyTemplate(path2.join(templatesDir, "components", config.components), path2.join(appDir, "components/ui"), config);
}
async function addExamples(appDir, platform, config) {
  const templatesDir = getTemplatesDir();
  const examplesDir = path2.join(templatesDir, "examples", platform);
  const targetDir = platform === "mobile" ? path2.join(appDir, "app") : path2.join(appDir, "app/examples");
  await copyTemplate(examplesDir, targetDir, config);
}
async function copyTemplate(src, dest, config) {
  if (!await fs2.pathExists(src)) return;
  await fs2.ensureDir(dest);
  const files = await fs2.readdir(src, { withFileTypes: true });
  for (const file of files) {
    const srcPath = path2.join(src, file.name);
    const destName = file.name.replace(/\.ejs$/, "");
    const destPath = path2.join(dest, destName);
    if (file.isDirectory()) {
      await copyTemplate(srcPath, destPath, config);
    } else if (file.name.endsWith(".ejs")) {
      const content = await fs2.readFile(srcPath, "utf-8");
      const rendered = ejs.render(content, config);
      await fs2.writeFile(destPath, rendered);
    } else {
      await fs2.copy(srcPath, destPath);
    }
  }
}

// src/installer.ts
import { spawn } from "child_process";
function installDependencies(cwd, pm) {
  return new Promise((resolve, reject) => {
    const cmd = pm === "npm" ? "npm" : pm;
    const args = pm === "yarn" ? [] : ["install"];
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: true });
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Install failed with code ${code}`)));
    child.on("error", reject);
  });
}
function initGit(cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["init"], { cwd, stdio: "ignore", shell: true });
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error("Git init failed")));
    child.on("error", reject);
  });
}

// src/index.ts
var showBanner = () => {
  const art = figlet.textSync("Lightning Scaffold", { font: "Slant" });
  console.log(gradient.cristal.multiline(art));
  console.log();
};
program.name("create-lightning-scaffold").description("Scaffold projects with LazorKit SDK integration").version("1.0.0").option("-y, --yes", "Use defaults").option("-n, --name <name>", "Project name").option("-p, --preset <preset>", "Preset: mobile, web, fullstack-mobile, fullstack-web, monorepo").option("--skip-install", "Skip dependency installation").action(async (opts) => {
  showBanner();
  let config;
  if (opts.yes || opts.preset) {
    const name = opts.name || "my-lightning-app";
    const preset = opts.preset || "mobile";
    const isMobile = preset === "mobile" || preset === "fullstack-mobile";
    const hasBackend = preset.includes("fullstack") || preset === "monorepo";
    config = {
      name,
      preset,
      backend: hasBackend ? "supabase" : "none",
      styling: isMobile ? "nativewind" : "tailwind",
      state: "zustand",
      components: isMobile ? "nativewind-ui" : "shadcn",
      packageManager: "npm",
      gitInit: true
    };
    p2.intro(pc2.bgCyan(pc2.black(" create-lightning-scaffold ")));
    p2.log.info(`Creating: ${name} (${preset})`);
  } else {
    config = await runPrompts();
  }
  if (!config) {
    p2.cancel("Operation cancelled");
    process.exit(0);
  }
  const s = p2.spinner();
  s.start("Scaffolding project...");
  try {
    const targetDir = await scaffold(config);
    s.stop("Project scaffolded!");
    if (!opts.skipInstall) {
      s.start("Installing dependencies...");
      await installDependencies(targetDir, config.packageManager);
      s.stop("Dependencies installed!");
    }
    if (config.gitInit) {
      s.start("Initializing git...");
      await initGit(targetDir);
      s.stop("Git initialized!");
    }
    p2.outro(pc2.green("\u2713 Project created successfully!"));
    console.log(`
${pc2.bold("Next steps:")}`);
    console.log(`  cd ${config.name}`);
    console.log(`  ${config.packageManager === "npm" ? "npm run" : config.packageManager} dev
`);
    console.log(pc2.dim("LazorKit examples included: passkey-login, gasless-transfer, biometric-onboard"));
  } catch (err) {
    s.stop("Failed");
    p2.cancel(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
});
program.parse();
