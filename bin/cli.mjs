#!/usr/bin/env node

/**
 * Linkable CLI
 *
 * Commands:
 *   npx linkable serve ./my-content        Serve using your content
 *   npx linkable build ./my-content        Build a static site with your content
 *   npx linkable deploy                    Deploy Supabase edge functions & migrations
 *   npx linkable ./my-content              Alias for serve (default)
 *   npx linkable --help                    Show help
 *
 * The content directory should contain:
 *   data.json     — your Linkable CMS data
 *   uploads/      — (optional) uploaded images
 */

import { createServer } from "node:http";
import { execSync } from "node:child_process";
import {
  readFileSync,
  existsSync,
  statSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

// ── CLI arg parsing ──────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  console.log(`
  Linkable — design-forward link-in-bio sites

  Commands:
    linkable serve <content-dir>     Serve your site locally
    linkable build <content-dir>     Build a static site into ./dist
    linkable deploy                  Deploy Supabase migrations & edge functions

  Options:
    --port, -p <port>    Port for serve (default: 3000)
    --out, -o <dir>      Output directory for build (default: ./dist)
    --project-ref        Supabase project ref for deploy
    --help, -h           Show this help

  The content directory should contain:
    data.json     Your CMS content (exported from Linkable)
    uploads/      Optional folder with uploaded images

  Examples:
    npx linkable serve ./my-site
    npx linkable build ./my-site
    npx linkable build ./my-site --out ./public
    npx linkable deploy --project-ref abcdefghijklmnop
    npx linkable ./my-site                        (defaults to serve)
`);
  process.exit(0);
}

// Determine command
let command = "serve"; // default
let positionalArgs = [];
let port = 3000;
let outDir = null;
let projectRef = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (i === 0 && (arg === "serve" || arg === "build" || arg === "deploy")) {
    command = arg;
  } else if ((arg === "--port" || arg === "-p") && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    if (isNaN(port)) {
      console.error(`❌  Invalid port: ${args[i + 1]}`);
      process.exit(1);
    }
    i++;
  } else if ((arg === "--out" || arg === "-o") && args[i + 1]) {
    outDir = path.resolve(args[i + 1]);
    i++;
  } else if (arg === "--project-ref" && args[i + 1]) {
    projectRef = args[i + 1];
    i++;
  } else if (!arg.startsWith("-")) {
    positionalArgs.push(arg);
  }
}

const contentDir = positionalArgs[0] ? path.resolve(positionalArgs[0]) : null;

// ── Resolve content ──────────────────────────────────────────────────

const resolveContent = () => {
  let userDataJson = null;
  let userUploadsDir = null;

  if (contentDir) {
    if (!existsSync(contentDir) || !statSync(contentDir).isDirectory()) {
      console.error(`❌  Content directory not found: ${contentDir}`);
      process.exit(1);
    }

    const dataFile = path.join(contentDir, "data.json");
    if (existsSync(dataFile)) {
      userDataJson = readFileSync(dataFile, "utf8");
      console.log(`  ✔ Using data.json from ${contentDir}`);
    } else {
      console.warn(`  ⚠ No data.json found in ${contentDir} — using default content.`);
    }

    const uploadsPath = path.join(contentDir, "uploads");
    if (existsSync(uploadsPath) && statSync(uploadsPath).isDirectory()) {
      userUploadsDir = uploadsPath;
      const count = readdirSync(uploadsPath).filter((f) => !f.startsWith(".")).length;
      console.log(`  ✔ Found ${count} uploaded file(s) in ${uploadsPath}`);
    }
  } else {
    console.log("  ℹ No content directory specified — using default content.");
  }

  return { userDataJson, userUploadsDir };
};

// ── Recursive copy helper ────────────────────────────────────────────

const copyDirSync = (src, dest) => {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
};

// ── BUILD command ────────────────────────────────────────────────────

/** Parse a .env file and return key-value pairs. */
const loadEnvFile = (dir) => {
  const envPath = path.join(dir, ".env");
  if (!existsSync(envPath)) return {};
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
  return env;
};

const runBuild = () => {
  console.log(`\n🔨  Building Linkable site…\n`);

  if (!contentDir) {
    console.error("❌  Content directory required for build. Usage: linkable build <content-dir>");
    process.exit(1);
  }

  if (!existsSync(contentDir) || !statSync(contentDir).isDirectory()) {
    console.error(`❌  Content directory not found: ${contentDir}`);
    process.exit(1);
  }

  const buildOutDir = outDir || path.resolve("dist");

  // ── 1. Stage user content into the package's expected locations ────

  // Copy data.json → cms-data.json + public/data.json (where Vite plugins expect it)
  const userDataFile = path.join(contentDir, "data.json");
  if (existsSync(userDataFile)) {
    const dataContent = readFileSync(userDataFile, "utf8");
    writeFileSync(path.join(packageRoot, "cms-data.json"), dataContent);
    writeFileSync(path.join(packageRoot, "public", "data.json"), dataContent);
    console.log(`  ✔ Staged data.json`);
  } else {
    console.warn(`  ⚠ No data.json found in ${contentDir} — using default content.`);
  }

  // Copy uploads/ → public/uploads/
  const userUploadsDir = path.join(contentDir, "uploads");
  if (existsSync(userUploadsDir) && statSync(userUploadsDir).isDirectory()) {
    const destUploads = path.join(packageRoot, "public", "uploads");
    mkdirSync(destUploads, { recursive: true });
    const files = readdirSync(userUploadsDir).filter((f) => {
      const full = path.join(userUploadsDir, f);
      return statSync(full).isFile() && !f.startsWith(".");
    });
    for (const file of files) {
      copyFileSync(path.join(userUploadsDir, file), path.join(destUploads, file));
    }
    console.log(`  ✔ Staged ${files.length} upload(s)`);
  }

  // Copy blog/ markdown files → content/blog/
  const userBlogDir = path.join(contentDir, "blog");
  if (existsSync(userBlogDir) && statSync(userBlogDir).isDirectory()) {
    const destBlog = path.join(packageRoot, "content", "blog");
    mkdirSync(destBlog, { recursive: true });
    const mdFiles = readdirSync(userBlogDir).filter((f) => f.endsWith(".md"));
    for (const file of mdFiles) {
      copyFileSync(path.join(userBlogDir, file), path.join(destBlog, file));
    }
    if (mdFiles.length > 0) {
      console.log(`  ✔ Staged ${mdFiles.length} blog post(s)`);
    }
  }

  // ── 2. Load env vars from content dir's .env file ──────────────────

  const contentEnv = loadEnvFile(contentDir);
  // Also check cwd for .env (some hosts put it there)
  const cwdEnv = contentDir !== process.cwd() ? loadEnvFile(process.cwd()) : {};

  // Merge: process.env takes precedence, then content .env, then cwd .env
  const mergedEnv = { ...cwdEnv, ...contentEnv, ...process.env };

  // ── 3. Run the real Vite build ─────────────────────────────────────

  console.log(`\n  ⏳ Running Vite build…\n`);

  const viteBin = path.join(packageRoot, "node_modules", ".bin", "vite");
  const viteCmd = existsSync(viteBin) ? viteBin : "npx vite";
  const buildCmd = `${viteCmd} build --outDir ${JSON.stringify(buildOutDir)}`;

  try {
    execSync(buildCmd, {
      cwd: packageRoot,
      env: mergedEnv,
      stdio: "inherit",
    });
  } catch (err) {
    console.error(`\n❌  Vite build failed.`);
    process.exit(1);
  }

  console.log(`\n✅  Built to ${buildOutDir}`);
  console.log(`    Deploy this folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.)\n`);
};

// ── SERVE command ────────────────────────────────────────────────────

const runServe = () => {
  const distDir = path.resolve(packageRoot, "dist");

  if (!existsSync(distDir)) {
    console.error(
      "❌  Built app not found. Run `linkable build` first, or `npm run build`."
    );
    process.exit(1);
  }

  const { userDataJson, userUploadsDir } = resolveContent();

  // ── MIME types ──────────────────────────────────────────────────────

  const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".txt": "text/plain; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
  };

  const getMime = (fp) => MIME_TYPES[path.extname(fp).toLowerCase()] || "application/octet-stream";

  const serveFile = (res, fp) => {
    if (!existsSync(fp) || !statSync(fp).isFile()) return false;
    const content = readFileSync(fp);
    res.writeHead(200, { "Content-Type": getMime(fp) });
    res.end(content);
    return true;
  };

  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    let pathname = decodeURIComponent(url.pathname);

    // Override /data.json with user content
    if (pathname === "/data.json" && userDataJson) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(userDataJson);
      return;
    }

    // Serve user uploads
    if (pathname.startsWith("/uploads/") && userUploadsDir) {
      const fileName = pathname.slice("/uploads/".length);
      if (!fileName.includes("..") && !fileName.includes("\\")) {
        const filePath = path.join(userUploadsDir, fileName);
        if (serveFile(res, filePath)) return;
      }
    }

    // Serve from dist
    let filePath = path.join(distDir, pathname);
    if (serveFile(res, filePath)) return;

    if (pathname.endsWith("/")) {
      filePath = path.join(distDir, pathname, "index.html");
      if (serveFile(res, filePath)) return;
    }

    // SPA fallback
    const indexPath = path.join(distDir, "index.html");
    if (serveFile(res, indexPath)) return;

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(port, () => {
    console.log(`\n  🔗 Linkable is running at http://localhost:${port}\n`);
  });
};

// ── DEPLOY command ───────────────────────────────────────────────────

const runDeploy = () => {
  console.log(`\n🚀  Deploying Supabase (migrations + edge functions)…\n`);

  const supabaseDir = path.join(packageRoot, "supabase");
  if (!existsSync(supabaseDir)) {
    console.error("❌  No supabase/ directory found in the project.");
    process.exit(1);
  }

  // Resolve project ref from --project-ref flag, env var, or linked project
  const ref = projectRef
    || process.env.SUPABASE_PROJECT_REF
    || (() => {
      const refFile = path.join(supabaseDir, ".temp", "project-ref");
      if (existsSync(refFile)) return readFileSync(refFile, "utf8").trim();
      return null;
    })();

  // Check that supabase CLI is available
  try {
    execSync("npx supabase --version", { cwd: packageRoot, stdio: "pipe" });
  } catch {
    console.error("❌  Supabase CLI not found. Install it with: npm i -D supabase");
    process.exit(1);
  }

  // Link project if ref provided and not already linked
  if (ref) {
    const refFile = path.join(supabaseDir, ".temp", "project-ref");
    const alreadyLinked = existsSync(refFile) && readFileSync(refFile, "utf8").trim() === ref;
    if (!alreadyLinked) {
      console.log(`  🔗 Linking to Supabase project: ${ref}\n`);
      try {
        execSync(`npx supabase link --project-ref ${ref}`, {
          cwd: packageRoot,
          stdio: "inherit",
        });
      } catch {
        console.error(`\n❌  Failed to link project. Make sure you're logged in: npx supabase login`);
        process.exit(1);
      }
    }
  } else {
    // Check if already linked
    const refFile = path.join(supabaseDir, ".temp", "project-ref");
    if (!existsSync(refFile)) {
      console.error("❌  No Supabase project linked. Use --project-ref <ref> or run: npx supabase link");
      process.exit(1);
    }
  }

  // ── Step 1: Push database migrations ───────────────────────────────

  const migrationsDir = path.join(supabaseDir, "migrations");
  const hasMigrations = existsSync(migrationsDir) && readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).length > 0;

  if (hasMigrations) {
    const migrationCount = readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).length;
    console.log(`  📦 Pushing ${migrationCount} migration(s) to remote database…\n`);
    try {
      execSync("npx supabase db push", {
        cwd: packageRoot,
        stdio: "inherit",
      });
      console.log(`\n  ✔ Database migrations applied\n`);
    } catch {
      console.error(`\n❌  Database migration push failed.`);
      process.exit(1);
    }
  } else {
    console.log("  ℹ No migrations found — skipping database push.\n");
  }

  // ── Step 2: Deploy edge functions ──────────────────────────────────

  const functionsDir = path.join(supabaseDir, "functions");
  if (!existsSync(functionsDir)) {
    console.log("  ℹ No functions/ directory — skipping edge function deployment.\n");
    console.log(`✅  Deploy complete.\n`);
    return;
  }

  // Discover function directories (skip _shared and hidden dirs)
  const functionNames = readdirSync(functionsDir).filter((name) => {
    if (name.startsWith("_") || name.startsWith(".")) return false;
    const fullPath = path.join(functionsDir, name);
    return statSync(fullPath).isDirectory();
  });

  if (functionNames.length === 0) {
    console.log("  ℹ No edge functions found — skipping.\n");
    console.log(`✅  Deploy complete.\n`);
    return;
  }

  console.log(`  ⚡ Deploying ${functionNames.length} edge function(s): ${functionNames.join(", ")}\n`);

  // Deploy all functions at once
  try {
    execSync("npx supabase functions deploy", {
      cwd: packageRoot,
      stdio: "inherit",
    });
    console.log(`\n  ✔ All edge functions deployed\n`);
  } catch {
    console.error(`\n❌  Edge function deployment failed.`);
    process.exit(1);
  }

  console.log(`✅  Supabase deploy complete.\n`);
};

// ── Dispatch ─────────────────────────────────────────────────────────

if (command === "build") {
  runBuild();
} else if (command === "deploy") {
  runDeploy();
} else {
  runServe();
}