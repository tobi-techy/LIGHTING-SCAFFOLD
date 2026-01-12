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
  web: { label: "Web App", hint: "Next.js or Vite", platforms: ["web"] },
  "fullstack-mobile": { label: "Full-Stack Mobile", hint: "React Native + Backend", platforms: ["mobile"] },
  "fullstack-web": { label: "Full-Stack Web", hint: "Web + Backend", platforms: ["web"] },
  monorepo: { label: "Monorepo", hint: "Mobile + Web + Backend", platforms: ["mobile", "web"] }
};
function getCompatibleOptions(preset, webFramework) {
  const info = PRESET_INFO[preset];
  const hasMobile = info.platforms.includes("mobile");
  const hasWeb = info.platforms.includes("web");
  const hasBackend = preset.includes("fullstack") || preset === "monorepo";
  return {
    styling: hasMobile ? ["nativewind", "none"] : ["tailwind", "none"],
    components: hasMobile ? ["nativewind-ui", "none"] : ["shadcn", "none"],
    backend: hasBackend ? ["nestjs-postgres", "nestjs-mongodb", "supabase", "firebase"] : ["none"],
    state: ["zustand", "redux"],
    animation: hasMobile ? ["reanimated", "moti", "none"] : ["framer", "none"]
  };
}
function isMonorepoPreset(preset) {
  return preset === "fullstack-mobile" || preset === "fullstack-web" || preset === "monorepo";
}
function hasWebPlatform(preset) {
  return PRESET_INFO[preset].platforms.includes("web");
}
function hasMobilePlatform(preset) {
  return PRESET_INFO[preset].platforms.includes("mobile");
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
  const showWebFramework = hasWebPlatform(preset);
  const showMobileOptions = hasMobilePlatform(preset);
  const hasBackend = preset.includes("fullstack") || preset === "monorepo";
  let webFramework = "nextjs";
  if (showWebFramework) {
    const webChoice = await p.select({
      message: "Web framework:",
      options: [
        { value: "nextjs", label: "Next.js", hint: "Full-featured React framework" },
        { value: "vite", label: "Vite", hint: "Fast, lightweight SPA" }
      ]
    });
    if (p.isCancel(webChoice)) return null;
    webFramework = webChoice;
  }
  let backend = "none";
  if (hasBackend) {
    const backendChoice = await p.select({
      message: "Backend:",
      options: [
        { value: "nestjs-postgres", label: "NestJS + PostgreSQL", hint: "Prisma ORM" },
        { value: "nestjs-mongodb", label: "NestJS + MongoDB", hint: "Mongoose ODM" },
        { value: "supabase", label: "Supabase", hint: "BaaS with Postgres" },
        { value: "firebase", label: "Firebase", hint: "Google BaaS" }
      ]
    });
    if (p.isCancel(backendChoice)) return null;
    backend = backendChoice;
  }
  const options = getCompatibleOptions(preset, webFramework);
  const customize = await p.confirm({
    message: "Customize styling, state & animations?",
    initialValue: false
  });
  if (p.isCancel(customize)) return null;
  let styling = options.styling[0];
  let components = options.components[0];
  let state = "zustand";
  let animation = "none";
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
        { value: "zustand", label: "Zustand", hint: "Simple, lightweight" },
        { value: "redux", label: "Redux Toolkit", hint: "Full-featured" }
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
    const animationChoice = await p.select({
      message: "Animations:",
      options: options.animation.map((v) => ({
        value: v,
        label: v === "none" ? "None" : v === "reanimated" ? "React Native Reanimated" : v === "framer" ? "Framer Motion" : "Moti",
        hint: v === "moti" ? "Cross-platform, uses Reanimated" : void 0
      }))
    });
    if (p.isCancel(animationChoice)) return null;
    animation = animationChoice;
  }
  let eas = false;
  if (showMobileOptions) {
    const easChoice = await p.confirm({
      message: "Setup EAS Build for app store deployment?",
      initialValue: true
    });
    if (p.isCancel(easChoice)) return null;
    eas = easChoice;
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
    webFramework,
    backend,
    styling,
    state,
    components,
    animation,
    eas,
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
  if (isMonorepo) {
    await fs2.ensureDir(targetDir);
    await setupMonorepo(targetDir, config);
    if (platforms.includes("mobile")) {
      await scaffoldMobile(path2.join(targetDir, "apps"), "mobile", config);
      if (config.eas) await addEasConfig(path2.join(targetDir, "apps/mobile"), config);
    }
    if (platforms.includes("web")) {
      await scaffoldWeb(path2.join(targetDir, "apps"), "web", config);
    }
    if (config.backend !== "none") {
      await scaffoldBackend(path2.join(targetDir, "packages"), "backend", config);
    }
  } else {
    if (platforms[0] === "mobile") {
      await scaffoldMobile(process.cwd(), config.name, config);
      if (config.eas) await addEasConfig(targetDir, config);
    } else {
      await scaffoldWeb(process.cwd(), config.name, config);
    }
  }
  const appDir = isMonorepo ? path2.join(targetDir, platforms[0] === "mobile" ? "apps/mobile" : "apps/web") : targetDir;
  const platform = platforms[0];
  await addDependencies(appDir, platform, config);
  await copyTemplate(path2.join(templatesDir, "state", config.state), path2.join(appDir, "lib/store"), config);
  if (config.components !== "none") {
    await copyTemplate(path2.join(templatesDir, "components", config.components), path2.join(appDir, "components/ui"), config);
  }
  if (config.backend !== "none") {
    await copyTemplate(path2.join(templatesDir, "backend", config.backend), path2.join(appDir, "lib/backend"), config);
    await copyTemplate(path2.join(templatesDir, "lib"), path2.join(appDir, "lib"), config);
  }
  await copyTemplate(path2.join(templatesDir, "base"), targetDir, config);
  return targetDir;
}
async function scaffoldMobile(cwd, name, config) {
  const templatesDir = getTemplatesDir();
  await copyTemplate(path2.join(templatesDir, "mobile"), path2.join(cwd, name), config);
}
async function scaffoldWeb(cwd, name, config) {
  const templatesDir = getTemplatesDir();
  const templateName = config.webFramework === "vite" ? "vite" : "web";
  await copyTemplate(path2.join(templatesDir, templateName), path2.join(cwd, name), config);
}
async function scaffoldBackend(cwd, name, config) {
  const templatesDir = getTemplatesDir();
  await copyTemplate(path2.join(templatesDir, "backend", config.backend), path2.join(cwd, name), config);
}
async function setupMonorepo(targetDir, config) {
  const pkg = {
    name: config.name,
    private: true,
    scripts: {
      "dev:mobile": "cd apps/mobile && npm run start",
      "dev:web": "cd apps/web && npm run dev",
      "dev:backend": "cd packages/backend && npm run start:dev"
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
async function addDependencies(appDir, platform, config) {
  const pkgPath = path2.join(appDir, "package.json");
  if (!await fs2.pathExists(pkgPath)) return;
  const pkg = await fs2.readJson(pkgPath);
  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};
  if (config.state === "zustand") {
    pkg.dependencies["zustand"] = "^4.5.0";
  } else {
    pkg.dependencies["@reduxjs/toolkit"] = "^2.0.0";
    pkg.dependencies["react-redux"] = "^9.0.0";
  }
  if (config.animation === "reanimated") {
    pkg.dependencies["react-native-reanimated"] = "^3.10.0";
    pkg.dependencies["react-native-gesture-handler"] = "^2.16.0";
  } else if (config.animation === "moti") {
    pkg.dependencies["moti"] = "^0.29.0";
    pkg.dependencies["react-native-reanimated"] = "^3.10.0";
  } else if (config.animation === "framer") {
    pkg.dependencies["framer-motion"] = "^11.0.0";
  }
  if (platform === "mobile") {
    pkg.dependencies["@lazorkit/wallet-mobile-adapter"] = "latest";
    pkg.dependencies["@solana/web3.js"] = "^1.95.0";
    pkg.dependencies["react-native-get-random-values"] = "~1.11.0";
    pkg.dependencies["react-native-url-polyfill"] = "^2.0.0";
    pkg.dependencies["buffer"] = "^6.0.3";
    pkg.dependencies["expo-crypto"] = "~15.0.0";
    pkg.dependencies["expo-linking"] = "~8.0.11";
    pkg.dependencies["expo-web-browser"] = "~15.0.10";
    pkg.dependencies["expo-clipboard"] = "~7.0.0";
    if (config.styling === "nativewind") {
      pkg.dependencies["nativewind"] = "^4.0.0";
      pkg.devDependencies["tailwindcss"] = "^3.4.0";
    }
  } else {
    pkg.dependencies["@lazorkit/wallet"] = "latest";
    pkg.dependencies["@solana/web3.js"] = "^1.95.0";
    pkg.dependencies["@coral-xyz/anchor"] = "^0.30.0";
    pkg.dependencies["buffer"] = "^6.0.3";
    if (config.webFramework === "vite") {
      pkg.devDependencies["vite-plugin-node-polyfills"] = "^0.22.0";
    }
    if (config.styling === "tailwind" && config.webFramework === "vite") {
      pkg.devDependencies["tailwindcss"] = "^3.4.0";
      pkg.devDependencies["postcss"] = "^8.4.0";
      pkg.devDependencies["autoprefixer"] = "^10.4.0";
    }
  }
  if (config.backend === "supabase") {
    pkg.dependencies["@supabase/supabase-js"] = "^2.39.0";
  } else if (config.backend === "firebase") {
    pkg.dependencies["firebase"] = "^10.7.0";
  }
  await fs2.writeJson(pkgPath, pkg, { spaces: 2 });
}
async function addEasConfig(appDir, config) {
  const easConfig = {
    cli: { version: ">= 7.0.0" },
    build: {
      development: { developmentClient: true, distribution: "internal" },
      preview: { distribution: "internal" },
      production: {}
    },
    submit: { production: {} }
  };
  await fs2.writeJson(path2.join(appDir, "eas.json"), easConfig, { spaces: 2 });
}
async function copyTemplate(src, dest, config, exclude = []) {
  if (!await fs2.pathExists(src)) return;
  await fs2.ensureDir(dest);
  const files = await fs2.readdir(src, { withFileTypes: true });
  for (const file of files) {
    if (exclude.includes(file.name)) continue;
    const srcPath = path2.join(src, file.name);
    const destName = file.name.replace(/\.ejs$/, "");
    const destPath = path2.join(dest, destName);
    if (file.isDirectory()) {
      await copyTemplate(srcPath, destPath, config);
    } else if (file.name.endsWith(".ejs")) {
      const content = await fs2.readFile(srcPath, "utf-8");
      const rendered = ejs.render(content, config);
      if (rendered.trim()) {
        await fs2.writeFile(destPath, rendered);
      }
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
    const hasWeb = preset === "web" || preset === "fullstack-web" || preset === "monorepo";
    config = {
      name,
      preset,
      webFramework: "nextjs",
      backend: hasBackend ? "nestjs-postgres" : "none",
      styling: isMobile ? "nativewind" : "tailwind",
      state: "zustand",
      components: isMobile ? "nativewind-ui" : "shadcn",
      animation: isMobile ? "reanimated" : "framer",
      eas: isMobile,
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
