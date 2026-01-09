import * as p from "@clack/prompts";
import pc from "picocolors";
import { ProjectConfig, Preset, PRESET_INFO, getCompatibleOptions } from "./utils/types.js";
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

  const options = getCompatibleOptions(preset);

  const customize = await p.confirm({
    message: "Customize options?",
    initialValue: false,
  });

  if (p.isCancel(customize)) return null;

  let styling = options.styling[0];
  let components = options.components[0];
  let state: "zustand" | "redux" = "zustand";
  let backend = options.backend[0];

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
        { value: "zustand", label: "Zustand" },
        { value: "redux", label: "Redux Toolkit" },
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

    if (options.backend[0] !== "none") {
      const backendChoice = await p.select({
        message: "Backend:",
        options: [
          { value: "supabase", label: "Supabase" },
          { value: "firebase", label: "Firebase" },
        ],
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
      { value: "bun", label: "bun" },
    ],
  });

  if (p.isCancel(packageManager)) return null;

  return {
    name,
    preset,
    backend: backend as ProjectConfig["backend"],
    styling: styling as ProjectConfig["styling"],
    state,
    components: components as ProjectConfig["components"],
    packageManager,
  };
}
