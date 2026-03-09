#!/usr/bin/env node
/**
 * run-tts.mjs
 *
 * Uses `uv` (https://docs.astral.sh/uv/) to run scripts/tts-blog.py with a
 * guaranteed Python 3.11 environment. uv is a single self-contained binary
 * that manages both Python versions and package installs — no system Python
 * or manual venv setup required.
 *
 * What this script does:
 *  1. Skips everything when VITE_TTS_ENABLED is not set.
 *  2. Locates the `uv` binary; if missing, installs it automatically to
 *     .tts-uv/ using the official install script (curl / PowerShell).
 *  3. Runs `uv run scripts/tts-blog.py`, which reads the PEP 723 inline
 *     metadata at the top of the script, downloads Python 3.11 if needed,
 *     and installs all declared dependencies into an isolated cache.
 */

import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

if (!process.env.VITE_TTS_ENABLED) {
  process.exit(0);
}

// ── Locate or install uv ─────────────────────────────────────────────

const isWindows = process.platform === "win32";

// Local install path used when uv is not on PATH
const UV_LOCAL_DIR = path.join(PROJECT_ROOT, ".tts-uv");
const UV_LOCAL_BIN = isWindows
  ? path.join(UV_LOCAL_DIR, "uv.exe")
  : path.join(UV_LOCAL_DIR, "uv");

function findUv() {
  // 1. Explicit override via env
  if (process.env.UV) return process.env.UV;

  // 2. Check PATH
  try {
    const which = isWindows ? "where" : "which";
    const result = execFileSync(which, ["uv"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (result) return result.split("\n")[0].trim();
  } catch { /* not on PATH */ }

  // 3. Check local project install
  if (existsSync(UV_LOCAL_BIN)) return UV_LOCAL_BIN;

  // 4. Check default user install location (~/.local/bin on Unix)
  const defaultBin = isWindows
    ? path.join(os.homedir(), "AppData", "Local", "Programs", "uv", "uv.exe")
    : path.join(os.homedir(), ".local", "bin", "uv");
  if (existsSync(defaultBin)) return defaultBin;

  return null;
}

function installUv() {
  console.log("[run-tts] uv not found — installing ...");
  mkdirSync(UV_LOCAL_DIR, { recursive: true });

  if (isWindows) {
    execSync(
      `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`,
      { stdio: "inherit" }
    );
  } else {
    execSync(
      `curl -LsSf https://astral.sh/uv/install.sh | sh`,
      { stdio: "inherit" }
    );
  }

  // uv installs to ~/.local/bin by default; re-run findUv() to pick up
  // wherever it landed (PATH refresh may be needed, so also check default).
  const found = findUv();
  if (found) return found;

  // Check the default install location explicitly as a last resort
  const defaultBin = isWindows
    ? path.join(os.homedir(), "AppData", "Local", "Programs", "uv", "uv.exe")
    : path.join(os.homedir(), ".local", "bin", "uv");
  if (existsSync(defaultBin)) return defaultBin;

  console.error("[run-tts] uv install failed. Install manually: https://docs.astral.sh/uv/getting-started/installation/");
  process.exit(1);
}

const uv = findUv() ?? installUv();
console.log(`[run-tts] Using uv: ${uv}`);

// ── Run tts-blog.py via uv ───────────────────────────────────────────

const ttsScript = path.join(PROJECT_ROOT, "scripts", "tts-blog.py");
console.log("[run-tts] Running tts-blog.py ...\n");

try {
  // `uv run` reads the PEP 723 `# /// script` block at the top of the file,
  // pins Python 3.11, installs deps into its own isolated cache, and runs.
  execFileSync(uv, ["run", ttsScript], {
    cwd: PROJECT_ROOT,
    env: process.env,
    stdio: "inherit",
  });
} catch (err) {
  console.error(`\n[run-tts] TTS script failed (exit ${err.status ?? "?"}) — continuing build without audio.`);
  process.exit(0); // soft failure — don't abort the build
}
