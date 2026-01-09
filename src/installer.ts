import { spawn } from "child_process";
import type { PackageManager } from "./utils/types.js";

export function installDependencies(cwd: string, pm: PackageManager): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = pm === "npm" ? "npm" : pm;
    const args = pm === "yarn" ? [] : ["install"];

    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: true });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Install failed with code ${code}`))));
    child.on("error", reject);
  });
}

export function initGit(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["init"], { cwd, stdio: "ignore", shell: true });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error("Git init failed"))));
    child.on("error", reject);
  });
}
