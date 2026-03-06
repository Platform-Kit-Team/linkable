#!/usr/bin/env node
/**
 * Syncs Vault secrets from .env into the local Supabase database.
 * Called automatically after `supabase migration up --local`.
 *
 * Secrets synced:
 *   project_url  — derived from VITE_SUPABASE_URL (rewritten for internal Docker networking)
 *   anon_key     — from VITE_SUPABASE_ANON_KEY
 *   cron_secret  — from CRON_SECRET
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Parse .env
function getEnv(key) {
  if (process.env[key]) return process.env[key];
  try {
    const env = readFileSync(resolve(root, ".env"), "utf-8");
    const m = env.match(new RegExp(`^${key}=["']?([^"'\\s]+)["']?`, "m"));
    return m ? m[1] : null;
  } catch { return null; }
}

const supabaseUrl = getEnv("VITE_SUPABASE_URL");
const anonKey = getEnv("VITE_SUPABASE_ANON_KEY");
const cronSecret = getEnv("CRON_SECRET");

// For local dev, pg_net runs inside Docker and can't reach 127.0.0.1 on the host.
// Supabase local routes through Kong at http://kong:8000.
const projectUrl = supabaseUrl?.match(/127\.0\.0\.1|localhost/)
  ? "http://kong:8000"
  : supabaseUrl;

const secrets = [
  { name: "project_url", value: projectUrl },
  { name: "anon_key", value: anonKey },
  { name: "cron_secret", value: cronSecret },
].filter(s => s.value);

if (secrets.length === 0) {
  console.log("[vault-sync] No secrets found in .env — skipping.");
  process.exit(0);
}

const esc = (v) => v.replace(/'/g, "''");
const sql = secrets
  .map(s => `DELETE FROM vault.secrets WHERE name = '${s.name}'; SELECT vault.create_secret('${esc(s.value)}', '${s.name}');`)
  .join("\n");

try {
  execSync(`docker exec -i supabase_db_${basename(root)} psql -U postgres -d postgres`, {
    input: sql,
    cwd: root,
    stdio: ["pipe", "pipe", "pipe"],
  });
  console.log(`[vault-sync] Synced ${secrets.map(s => s.name).join(", ")} to local Vault.`);
} catch {
  console.warn("[vault-sync] Could not sync — is the local DB running?");
}
