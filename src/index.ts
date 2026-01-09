import { program } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { runPrompts } from "./cli.js";
import { scaffold } from "./scaffolder.js";
import { installDependencies } from "./installer.js";
import type { ProjectConfig, Preset } from "./utils/types.js";

program
  .name("create-lightning-scaffold")
  .description("Scaffold projects with LazorKit SDK integration")
  .version("1.0.0")
  .option("-y, --yes", "Use defaults")
  .option("-n, --name <name>", "Project name")
  .option("-p, --preset <preset>", "Preset: mobile, web, fullstack-mobile, fullstack-web, monorepo")
  .option("--skip-install", "Skip dependency installation")
  .action(async (opts) => {
    let config: ProjectConfig | null;

    if (opts.yes || opts.preset) {
      const name = opts.name || "my-lightning-app";
      const preset = (opts.preset || "mobile") as Preset;
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
      };
      p.intro(pc.bgCyan(pc.black(" create-lightning-scaffold ")));
      p.log.info(`Creating: ${name} (${preset})`);
    } else {
      config = await runPrompts();
    }

    if (!config) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    const s = p.spinner();
    s.start("Scaffolding project...");

    try {
      const targetDir = await scaffold(config);
      s.stop("Project scaffolded!");

      if (!opts.skipInstall) {
        s.start("Installing dependencies...");
        await installDependencies(targetDir, config.packageManager);
        s.stop("Dependencies installed!");
      }

      p.outro(pc.green("✓ Project created successfully!"));

      console.log(`\n${pc.bold("Next steps:")}`);
      console.log(`  cd ${config.name}`);
      console.log(`  ${config.packageManager === "npm" ? "npm run" : config.packageManager} dev\n`);
      console.log(pc.dim("LazorKit examples included: passkey-login, gasless-transfer, biometric-onboard"));
    } catch (err) {
      s.stop("Failed");
      p.cancel(`Error: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  });

program.parse();
