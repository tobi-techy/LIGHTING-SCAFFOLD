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

  if (isMonorepo) {
    await fs.ensureDir(targetDir);
    await setupMonorepo(targetDir, config);

    if (platforms.includes("mobile")) {
      await scaffoldMobile(path.join(targetDir, "apps"), "mobile", config);
      if (config.eas) await addEasConfig(path.join(targetDir, "apps/mobile"), config);
    }
    if (platforms.includes("web")) {
      await scaffoldWeb(path.join(targetDir, "apps"), "web", config);
    }
    if (config.backend !== "none") {
      await scaffoldBackend(path.join(targetDir, "packages"), "backend", config);
    }
  } else {
    if (platforms[0] === "mobile") {
      await scaffoldMobile(process.cwd(), config.name, config);
      if (config.eas) await addEasConfig(targetDir, config);
    } else {
      await scaffoldWeb(process.cwd(), config.name, config);
    }
  }

  const appDir = isMonorepo
    ? path.join(targetDir, platforms[0] === "mobile" ? "apps/mobile" : "apps/web")
    : targetDir;

  const platform = platforms[0];

  await addDependencies(appDir, platform, config);
  await copyTemplate(path.join(templatesDir, "state", config.state), path.join(appDir, "lib/store"), config);
  if (config.components !== "none") {
    await copyTemplate(path.join(templatesDir, "components", config.components), path.join(appDir, "components/ui"), config);
  }

  if (config.backend !== "none") {
    await copyTemplate(path.join(templatesDir, "backend", config.backend), path.join(appDir, "lib/backend"), config);
    await copyTemplate(path.join(templatesDir, "lib"), path.join(appDir, "lib"), config);
  }

  await copyTemplate(path.join(templatesDir, "base"), targetDir, config);

  return targetDir;
}

async function scaffoldMobile(cwd: string, name: string, config: ProjectConfig): Promise<void> {
  const templatesDir = getTemplatesDir();
  await copyTemplate(path.join(templatesDir, "mobile"), path.join(cwd, name), config);
}

async function scaffoldWeb(cwd: string, name: string, config: ProjectConfig): Promise<void> {
  const templatesDir = getTemplatesDir();
  const templateName = config.webFramework === "vite" ? "vite" : "web";
  await copyTemplate(path.join(templatesDir, templateName), path.join(cwd, name), config);
}

async function scaffoldBackend(cwd: string, name: string, config: ProjectConfig): Promise<void> {
  const templatesDir = getTemplatesDir();
  await copyTemplate(path.join(templatesDir, "backend", config.backend), path.join(cwd, name), config);
}

async function setupMonorepo(targetDir: string, config: ProjectConfig): Promise<void> {
  const pkg = {
    name: config.name,
    private: true,
    scripts: {
      "dev:mobile": "cd apps/mobile && npm run start",
      "dev:web": "cd apps/web && npm run dev",
      "dev:backend": "cd packages/backend && npm run start:dev",
    },
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

async function addDependencies(appDir: string, platform: "mobile" | "web", config: ProjectConfig): Promise<void> {
  const pkgPath = path.join(appDir, "package.json");
  if (!(await fs.pathExists(pkgPath))) return;

  const pkg = await fs.readJson(pkgPath);
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

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

async function addEasConfig(appDir: string, config: ProjectConfig): Promise<void> {
  const easConfig = {
    cli: { version: ">= 7.0.0" },
    build: {
      development: { developmentClient: true, distribution: "internal" },
      preview: { distribution: "internal" },
      production: {},
    },
    submit: { production: {} },
  };
  await fs.writeJson(path.join(appDir, "eas.json"), easConfig, { spaces: 2 });
}

async function copyTemplate(src: string, dest: string, config: ProjectConfig, exclude: string[] = []): Promise<void> {
  if (!(await fs.pathExists(src))) return;

  await fs.ensureDir(dest);
  const files = await fs.readdir(src, { withFileTypes: true });

  for (const file of files) {
    if (exclude.includes(file.name)) continue;
    
    const srcPath = path.join(src, file.name);
    const destName = file.name.replace(/\.ejs$/, "");
    const destPath = path.join(dest, destName);

    if (file.isDirectory()) {
      await copyTemplate(srcPath, destPath, config);
    } else if (file.name.endsWith(".ejs")) {
      const content = await fs.readFile(srcPath, "utf-8");
      const rendered = ejs.render(content, config);
      if (rendered.trim()) {
        await fs.writeFile(destPath, rendered);
      }
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}
