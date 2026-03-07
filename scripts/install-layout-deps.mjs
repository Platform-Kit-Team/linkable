#!/usr/bin/env node
/**
 * install-layout-deps.mjs
 *
 * Scans src/layouts/ for any layout directory containing a package.json,
 * and installs its dependencies into the root node_modules.
 *
 * This keeps layout-specific dependencies declared in their own package.json
 * without needing a pnpm workspace setup.
 */
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const layoutsDir = join(process.cwd(), "src", "layouts");

if (!existsSync(layoutsDir)) {
  process.exit(0);
}

const layouts = readdirSync(layoutsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory());

const depsToInstall = [];

for (const layout of layouts) {
  const pkgPath = join(layoutsDir, layout.name, "package.json");
  if (!existsSync(pkgPath)) continue;

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const [name, version] of Object.entries(deps)) {
    // Check if already installed at root
    const installedPath = join(process.cwd(), "node_modules", name, "package.json");
    if (existsSync(installedPath)) {
      continue;
    }
    depsToInstall.push(`${name}@${version}`);
  }
}

if (depsToInstall.length === 0) {
  console.log("[layout-deps] All layout dependencies already installed.");
  process.exit(0);
}

console.log(`[layout-deps] Installing: ${depsToInstall.join(", ")}`);
execSync(`pnpm add ${depsToInstall.join(" ")}`, { stdio: "inherit" });
