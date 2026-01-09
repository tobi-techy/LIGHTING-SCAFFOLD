import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

export function validateProjectName(name: string): string | undefined {
  if (!name) return "Project name is required";
  if (!/^[a-z0-9-_]+$/i.test(name)) return "Only letters, numbers, hyphens, and underscores allowed";
  if (fs.existsSync(name)) return `Directory "${name}" already exists`;
  return undefined;
}

export function getTemplatesDir(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.join(__dirname, "..", "templates");
}
