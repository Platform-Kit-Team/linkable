/**
 * export-to-github.mjs
 *
 * Pushes local cms-data.json and uploaded files to a GitHub content repo.
 * This is the mirror of import-from-github.mjs — use it to push your
 * personal content to a private repo without polluting the public codebase.
 *
 * Configured via environment variables (see .env.example):
 *
 *   GITHUB_OWNER       – repo owner (user or org)
 *   GITHUB_REPO        – repo name
 *   GITHUB_TOKEN       – personal access token (needs "contents" write scope)
 *   GITHUB_BRANCH      – branch to push to (default: main)
 *   GITHUB_DATA_PATH   – path for data.json inside the repo (default: data.json)
 *   GITHUB_UPLOADS_DIR – path for uploads folder inside the repo (default: uploads)
 *
 * Usage:
 *   node scripts/export-to-github.mjs
 *   # or via npm script:
 *   npm run push
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── helpers ──────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

/** Load .env file manually (no external deps) */
const loadEnv = async () => {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) return;
  const { readFile } = await import("node:fs/promises");
  const text = await readFile(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
};

const API_BASE = "https://api.github.com";

const ghFetch = async (url, token, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github.v3+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res;
};

/**
 * Create or update a file in the repo via the GitHub Contents API.
 * Automatically fetches the existing SHA if the file already exists.
 */
const putFile = async ({ owner, repo, branch, token, repoPath, content, message }) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${repoPath}`;

  // Check if file already exists to get its SHA
  let sha;
  const existing = await ghFetch(`${url}?ref=${branch}`, token);
  if (existing.ok) {
    const meta = await existing.json();
    sha = meta.sha;
  }

  const body = {
    message,
    content, // must be base64
    branch,
    ...(sha ? { sha } : {}),
  };

  const res = await ghFetch(url, token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to push ${repoPath}: ${res.status}\n${text}`);
  }
};

// ── main ─────────────────────────────────────────────────────────────

const run = async () => {
  await loadEnv();

  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const token = process.env.GITHUB_TOKEN?.trim();
  const branch = process.env.GITHUB_BRANCH?.trim() || "main";
  const dataPath = process.env.GITHUB_DATA_PATH?.trim() || "data.json";
  const uploadsDir = process.env.GITHUB_UPLOADS_DIR?.trim() || "uploads";

  if (!owner || !repo) {
    console.error("❌  GITHUB_OWNER and GITHUB_REPO must be set in .env");
    process.exit(1);
  }

  if (!token) {
    console.error("❌  GITHUB_TOKEN must be set in .env (needs contents write permission)");
    process.exit(1);
  }

  // ── Ensure the repo exists (create if missing) ─────────────────────
  const repoCheck = await ghFetch(`${API_BASE}/repos/${owner}/${repo}`, token);
  if (repoCheck.status === 404) {
    console.log(`📦  Repo ${owner}/${repo} not found — creating it…`);

    // Determine if the owner is the authenticated user or an org
    const userRes = await ghFetch(`${API_BASE}/user`, token);
    const user = await userRes.json();
    const isOrg = user.login?.toLowerCase() !== owner.toLowerCase();

    const createUrl = isOrg
      ? `${API_BASE}/orgs/${owner}/repos`
      : `${API_BASE}/user/repos`;

    const createRes = await ghFetch(createUrl, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: repo,
        private: true,
        description: "Linkable content repo (auto-created by npm run push)",
        auto_init: true, // creates an initial commit so we can push files
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => "");
      console.error(`❌  Failed to create repo ${owner}/${repo}: ${createRes.status}\n${errText}`);
      process.exit(1);
    }

    console.log(`✅  Created private repo ${owner}/${repo}`);

    // Brief pause to let GitHub finish initialising the repo
    await new Promise((r) => setTimeout(r, 2000));
  } else if (!repoCheck.ok) {
    const errText = await repoCheck.text().catch(() => "");
    console.error(`❌  Could not verify repo ${owner}/${repo}: ${repoCheck.status}\n${errText}`);
    process.exit(1);
  }

  console.log(`📤  Exporting to ${owner}/${repo} (branch: ${branch})…`);

  // ── 1. Push cms-data.json as data.json ─────────────────────────────

  const cmsDataFile = path.join(rootDir, "cms-data.json");
  if (!existsSync(cmsDataFile)) {
    console.error("❌  cms-data.json not found — nothing to push.");
    process.exit(1);
  }

  const commitMsg = process.env.CMS_COMMIT_MESSAGE?.trim() || "Update CMS data";

  const dataContent = readFileSync(cmsDataFile, "utf8");
  const dataBase64 = Buffer.from(dataContent).toString("base64");

  await putFile({
    owner,
    repo,
    branch,
    token,
    repoPath: dataPath,
    content: dataBase64,
    message: commitMsg,
  });
  console.log(`  ✔ cms-data.json → ${dataPath}`);

  // ── 2. Push uploaded files ─────────────────────────────────────────

  const localUploadsDir = path.join(rootDir, "public", "uploads");
  if (!existsSync(localUploadsDir)) {
    console.log(`  ⏭ No public/uploads directory — skipping uploads.`);
  } else {
    const files = readdirSync(localUploadsDir).filter((f) => {
      const full = path.join(localUploadsDir, f);
      return statSync(full).isFile() && !f.startsWith(".");
    });

    if (files.length === 0) {
      console.log(`  ⏭ No uploaded files to push.`);
    } else {
      let count = 0;
      for (const file of files) {
        const filePath = path.join(localUploadsDir, file);
        const fileContent = readFileSync(filePath);
        const fileBase64 = fileContent.toString("base64");
        const repoPath = `${uploadsDir}/${file}`;

        await putFile({
          owner,
          repo,
          branch,
          token,
          repoPath,
          content: fileBase64,
          message: `${commitMsg} (upload ${file})`,
        });
        count++;
      }
      console.log(`  ✔ ${count} file(s) → ${uploadsDir}/`);
    }
  }

  console.log(`✅  Export complete.`);
};

await run().catch((err) => {
  console.error("❌  Export failed:", err.message);
  process.exit(1);
});
