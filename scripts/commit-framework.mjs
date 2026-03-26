#!/usr/bin/env node
/**
 * commit-framework.mjs
 *
 * Stages all changes in the framework repo, creates a commit, and pushes to
 * the tracked remote branch. The git remote/branch are resolved automatically
 * from the repo's own config — no manual URL needed.
 *
 * Usage:
 *   node scripts/commit-framework.mjs [commit message]
 *   npm run commit
 *
 * If no commit message is provided as a CLI argument, the script prompts for
 * one interactively. Passing --all / -a stages untracked files too (default).
 */

import { execSync, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// ── helpers ──────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  const result = spawnSync(cmd, { shell: true, cwd: rootDir, encoding: "utf8", ...opts });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    console.error(`\n[commit-framework] Command failed: ${cmd}`);
    if (err) console.error(err);
    process.exit(result.status ?? 1);
  }
  return (result.stdout || "").trim();
}

function capture(cmd) {
  try {
    return execSync(cmd, { cwd: rootDir, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

async function promptMessage() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("Commit message: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ── main ─────────────────────────────────────────────────────────────

// Verify we're inside a git repo
const gitRoot = capture("git rev-parse --show-toplevel");
if (!gitRoot) {
  console.error("[commit-framework] Not inside a git repository.");
  process.exit(1);
}

// Resolve commit message from args or prompt
const args = process.argv.slice(2);
let message = args.filter((a) => !a.startsWith("-")).join(" ").trim();

if (!message) {
  message = await promptMessage();
}

if (!message) {
  console.error("[commit-framework] Commit message cannot be empty.");
  process.exit(1);
}

// Check there is something to commit
const status = capture("git status --porcelain");
if (!status) {
  console.log("[commit-framework] Nothing to commit — working tree clean.");
  process.exit(0);
}

// Stage everything (respects .gitignore)
console.log("[commit-framework] Staging changes…");
run("git add -A");

// Commit
console.log(`[commit-framework] Committing: "${message}"`);
run(`git commit -m ${JSON.stringify(message)}`);

// Detect upstream branch so push works even on first push of a new branch
const upstream = capture("git rev-parse --abbrev-ref --symbolic-full-name @{u}");
let pushCmd = "git push";
if (!upstream) {
  // No upstream set — push and set tracking automatically
  const branch = capture("git rev-parse --abbrev-ref HEAD");
  pushCmd = `git push --set-upstream origin ${branch}`;
}

console.log("[commit-framework] Pushing…");
run(pushCmd);

// Summary
const sha = capture("git rev-parse --short HEAD");
const branch = capture("git rev-parse --abbrev-ref HEAD");
const remote = capture("git remote get-url origin");
console.log(`\n[commit-framework] ✓ Pushed ${sha} to ${branch} → ${remote}`);
