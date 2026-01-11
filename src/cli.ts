import * as p from "@clack/prompts";
import pc from "picocolors";
import { ProjectConfig, Preset, PRESET_INFO, getCompatibleOptions, hasWebPlatform, hasMobilePlatform } from "./utils/types.js";
import { validateProjectName } from "./utils/helpers.js";

export async function runPrompts(): Promise<ProjectConfig | null> {
  p.intro(pc.bgCyan(pc.black(" create-lightning-scaffold ")));

  const name = await p.text({
    message: "Project name:",
    placeholder: "my-app",
    validate: validateProjectName,
  });

  if (p.isCancel(name)) return null;

  const preset = await p.select({
    message: "Select a preset:",
    options: Object.entries(PRESET_INFO).map(([value, { label, hint }]) => ({
      value: value as Preset,
      label,
      hint,
    })),
  });

  if (p.isCancel(preset)) return null;

  const showWebFramework = hasWebPlatform(preset);
  const showMobileOptions = hasMobilePlatform(preset);
  const hasBackend = preset.includes("fullstack") || preset === "monorepo";

  // Web framework choice
  let webFramework: ProjectConfig["webFramework"] = "nextjs";
  if (showWebFramework) {
    const webChoice = await p.select({
      message: "Web framework:",
      options: [
        { value: "nextjs", label: "Next.js", hint: "Full-featured React framework" },
        { value: "vite", label: "Vite", hint: "Fast, lightweight SPA" },
      ],
    });
    if (p.isCancel(webChoice)) return null;
    webFramework = webChoice;
  }

  // Backend choice
  let backend: ProjectConfig["backend"] = "none";
  if (hasBackend) {
    const backendChoice = await p.select({
      message: "Backend:",
      options: [
        { value: "nestjs-postgres", label: "NestJS + PostgreSQL", hint: "Prisma ORM" },
        { value: "nestjs-mongodb", label: "NestJS + MongoDB", hint: "Mongoose ODM" },
        { value: "supabase", label: "Supabase", hint: "BaaS with Postgres" },
        { value: "firebase", label: "Firebase", hint: "Google BaaS" },
      ],
    });
    if (p.isCancel(backendChoice)) return null;
    backend = backendChoice;
  }

  const options = getCompatibleOptions(preset, webFramework);

  const customize = await p.confirm({
    message: "Customize styling, state & animations?",
    initialValue: false,
  });

  if (p.isCancel(customize)) return null;

  let styling = options.styling[0];
  let components = options.components[0];
  let state: ProjectConfig["state"] = "zustand";
  let animation: ProjectConfig["animation"] = "none";

  if (customize) {
    const stylingChoice = await p.select({
      message: "Styling:",
      options: options.styling.map((v) => ({ value: v, label: v === "none" ? "None" : v })),
    });
    if (p.isCancel(stylingChoice)) return null;
    styling = stylingChoice;

    const stateChoice = await p.select({
      message: "State management:",
      options: [
        { value: "zustand", label: "Zustand", hint: "Simple, lightweight" },
        { value: "redux", label: "Redux Toolkit", hint: "Full-featured" },
      ],
    });
    if (p.isCancel(stateChoice)) return null;
    state = stateChoice;

    const componentsChoice = await p.select({
      message: "Component library:",
      options: options.components.map((v) => ({ value: v, label: v === "none" ? "None" : v })),
    });
    if (p.isCancel(componentsChoice)) return null;
    components = componentsChoice;

    const animationChoice = await p.select({
      message: "Animations:",
      options: options.animation.map((v) => ({
        value: v,
        label: v === "none" ? "None" : v === "reanimated" ? "React Native Reanimated" : v === "framer" ? "Framer Motion" : "Moti",
        hint: v === "moti" ? "Cross-platform, uses Reanimated" : undefined,
      })),
    });
    if (p.isCancel(animationChoice)) return null;
    animation = animationChoice;
  }

  // EAS Build for mobile
  let eas = false;
  if (showMobileOptions) {
    const easChoice = await p.confirm({
      message: "Setup EAS Build for app store deployment?",
      initialValue: true,
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
      { value: "bun", label: "bun" },
    ],
  });

  if (p.isCancel(packageManager)) return null;

  const gitInit = await p.confirm({
    message: "Initialize git repository?",
    initialValue: true,
  });

  if (p.isCancel(gitInit)) return null;

  return {
    name,
    preset,
    webFramework,
    backend,
    styling: styling as ProjectConfig["styling"],
    state,
    components: components as ProjectConfig["components"],
    animation,
    eas,
    packageManager,
    gitInit,
  };
}
