#!/usr/bin/env node
/**
 * install-layout-deps.mjs
 *
 * Scans src/themes/ and src/overrides/ for directories containing a
 * package.json, collects their dependencies, and installs any missing
 * packages into the root node_modules.
 *
 * This keeps theme- and user-specific dependencies declared in their own
 * package.json (source of truth) while making them available for both
 * Vite bundling and runtime dynamic imports in build hooks.
 */
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const root = process.cwd();
const themesDir = join(root, "src", "themes");
const overridesDir = join(root, "src", "overrides");

/** Collect all dependencies from theme/override package.json files. */
function collectAllDeps(dirs) {
  const deps = {}; // name → version
  for (const dir of dirs) {
    const pkgPath = join(dir, "package.json");
    if (!existsSync(pkgPath)) continue;

    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [name, version] of Object.entries(allDeps)) {
      // First-seen version wins (themes are processed before overrides)
      if (!deps[name]) deps[name] = version;
    }
  }
  return deps;
}

/** Return deps not yet installed in root node_modules. */
function findMissingDeps(deps) {
  const missing = {};
  for (const [name, version] of Object.entries(deps)) {
    const installedPkg = join(root, "node_modules", name, "package.json");
    if (!existsSync(installedPkg)) {
      missing[name] = version;
    }
  }
  return missing;
}

// Theme directories
const themeDirs = existsSync(themesDir)
  ? readdirSync(themesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join(themesDir, d.name))
  : [];

// User overrides directory
const overrideDirs = existsSync(overridesDir) ? [overridesDir] : [];

const allDeps = collectAllDeps([...themeDirs, ...overrideDirs]);
const missing = findMissingDeps(allDeps);

if (Object.keys(missing).length === 0) {
  console.log("[theme-deps] All theme/override dependencies already installed.");
  process.exit(0);
}

// Build install spec list: "name@version name@version ..."
const specs = Object.entries(missing)
  .map(([name, version]) => `${name}@${version}`)
  .join(" ");

console.log(`[theme-deps] Installing missing deps: ${Object.keys(missing).join(", ")}`);

try {
  execSync(`pnpm add ${specs}`, { cwd: root, stdio: "inherit" });
} catch {
  try {
    execSync(`npm install --no-save ${specs}`, { cwd: root, stdio: "inherit" });
  } catch (err) {
    console.error("[theme-deps] Failed to install dependencies:", err.message);
    process.exit(1);
  }
}
