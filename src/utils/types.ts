export type Preset = "mobile" | "web" | "fullstack-mobile" | "fullstack-web" | "monorepo";
export type WebFramework = "nextjs" | "vite";
export type Backend = "nestjs-postgres" | "nestjs-mongodb" | "supabase" | "firebase" | "none";
export type Styling = "tailwind" | "nativewind" | "none";
export type StateManager = "zustand" | "redux";
export type Components = "shadcn" | "nativewind-ui" | "none";
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type Animation = "reanimated" | "framer" | "moti" | "none";

export interface ProjectConfig {
  name: string;
  preset: Preset;
  webFramework: WebFramework;
  backend: Backend;
  styling: Styling;
  state: StateManager;
  components: Components;
  animation: Animation;
  eas: boolean;
  packageManager: PackageManager;
  gitInit: boolean;
}

export const PRESET_INFO: Record<Preset, { label: string; hint: string; platforms: ("mobile" | "web")[] }> = {
  mobile: { label: "Mobile App", hint: "React Native + Expo", platforms: ["mobile"] },
  web: { label: "Web App", hint: "Next.js or Vite", platforms: ["web"] },
  "fullstack-mobile": { label: "Full-Stack Mobile", hint: "React Native + Backend", platforms: ["mobile"] },
  "fullstack-web": { label: "Full-Stack Web", hint: "Web + Backend", platforms: ["web"] },
  monorepo: { label: "Monorepo", hint: "Mobile + Web + Backend", platforms: ["mobile", "web"] },
};

export function getCompatibleOptions(preset: Preset, webFramework?: WebFramework) {
  const info = PRESET_INFO[preset];
  const hasMobile = info.platforms.includes("mobile");
  const hasWeb = info.platforms.includes("web");
  const hasBackend = preset.includes("fullstack") || preset === "monorepo";

  return {
    styling: hasMobile ? ["nativewind", "none"] : ["tailwind", "none"],
    components: hasMobile ? ["nativewind-ui", "none"] : ["shadcn", "none"],
    backend: hasBackend ? ["nestjs-postgres", "nestjs-mongodb", "supabase", "firebase"] : ["none"],
    state: ["zustand", "redux"],
    animation: hasMobile ? ["reanimated", "moti", "none"] : ["framer", "none"],
  };
}

export function isMonorepoPreset(preset: Preset): boolean {
  return preset === "fullstack-mobile" || preset === "fullstack-web" || preset === "monorepo";
}

export function hasWebPlatform(preset: Preset): boolean {
  return PRESET_INFO[preset].platforms.includes("web");
}

export function hasMobilePlatform(preset: Preset): boolean {
  return PRESET_INFO[preset].platforms.includes("mobile");
}
