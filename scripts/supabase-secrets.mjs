#!/usr/bin/env node

/**
 * Reads the .env file and sets matching keys as Supabase Edge Function secrets.
 *
 * Only pushes keys that edge functions actually need (SMTP, newsletter, etc.) —
 * skips VITE_*, GITHUB_*, and other client/build-only vars.
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");

// Keys that edge functions need. Add more here as needed.
const EDGE_KEYS = new Set([
  "CMS_PASSWORD",
  "VITE_SUPABASE_ANON_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM_EMAIL",
  "SMTP_FROM_NAME",
  "NEWSLETTER_SECRET",
  "SITE_NAME",
  "CRON_SECRET",
]);

// Parse .env file (if it exists)
const found = new Map();
try {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    const value = line
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (key.startsWith("VITE_") && key !== "VITE_SUPABASE_ANON_KEY") continue;
    if (EDGE_KEYS.has(key) && value) {
      found.set(key, value);
    }
  }
} catch {
  console.log("No .env file found, falling back to process.env only.");
}

// Fill in any missing keys from process.env
for (const key of EDGE_KEYS) {
  if (!found.has(key) && process.env[key]) {
    found.set(key, process.env[key]);
  }
}

// Report skipped keys
for (const key of EDGE_KEYS) {
  if (!found.has(key)) {
    console.log(`⏭  Skipping ${key} (not set)`);
  }
}

const secrets = [...found.entries()].map(([key, value]) => ({ key, value }));

if (secrets.length === 0) {
  console.log("No edge-function secrets found. Nothing to set.");
  console.log(`Looked for: ${[...EDGE_KEYS].join(", ")}`);
  process.exit(0);
}

// Build the secrets set command: npx supabase secrets set KEY1=VAL1 KEY2=VAL2
const args = secrets.map(({ key, value }) => `${key}=${value}`);
const cmd = `npx supabase secrets set ${args.map((a) => `'${a}'`).join(" ")}`;

console.log(`Setting ${secrets.length} secret(s): ${secrets.map((s) => s.key).join(", ")}`);

try {
  execSync(cmd, { stdio: "inherit", cwd: resolve(__dirname, "..") });
  console.log("✅ Edge function secrets updated.");
} catch {
  console.error("❌ Failed to set secrets. Is Supabase running?");
  process.exit(1);
}
