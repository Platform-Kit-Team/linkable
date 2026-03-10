#!/usr/bin/env node

/**
 * PlatformKit CLI
 *
 * Commands:
 *   npx platformkit serve ./my-content        Serve using your content
 *   npx platformkit build ./my-content        Build a static site with your content
 *   npx platformkit deploy                    Deploy Supabase edge functions & migrations
 *   npx platformkit deploy ./my-content        Deploy using content repo's supabase/
 *   npx platformkit ./my-content              Alias for serve (default)
 *   npx platformkit --help                    Show help
 *
 * The content directory should contain:
 *   data.json     — your PlatformKit CMS data
 *   uploads/      — (optional) uploaded images
 *   themes/      — (optional) custom themes (staged as user/<name>)
 *   overrides/    — (optional) global component overrides
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
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

// ── CLI arg parsing ──────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  console.log(`
  PlatformKit — design-forward link-in-bio sites

  Commands:
    platformkit serve <content-dir>     Serve your site locally
    platformkit build <content-dir>     Build a static site into ./dist
    platformkit deploy                  Deploy Supabase migrations & edge functions
    platformkit deploy <content-dir>    Deploy using content repo's supabase/ directory

  Options:
    --port, -p <port>    Port for serve (default: 8080)
    --out, -o <dir>      Output directory for build (default: ./dist)
    --project-ref        Supabase project ref for deploy
    --help, -h           Show this help

  The content directory should contain:
    data.json            Your CMS content (exported from PlatformKit)
    uploads/             Optional folder with uploaded images
    themes/              Optional custom themes (staged as user/<name>)
    overrides/           Optional global component overrides
    supabase/            Optional Supabase migrations & functions
    tailwind.config.js   Optional Tailwind CSS extensions (merged with core)
    vite.plugins.js      Optional Vite plugins / custom server middleware
    vite.config.{ts,js}  Optional full Vite config override (deep-merged with core)
    platformkit.config.ts  Optional site/RSS/build configuration
    index.html           Optional HTML template override

  Examples:
    npx platformkit serve ./my-site
    npx platformkit build ./my-site
    npx platformkit build ./my-site --out ./public
    npx platformkit deploy --project-ref abcdefghijklmnop
    npx platformkit ./my-site                        (defaults to serve)
`);
  process.exit(0);
}

// Determine command
let command = "serve"; // default
let positionalArgs = [];
let port = 8080;
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
  console.log(`\n🔨  Building PlatformKit site…\n`);

  if (!contentDir) {
    console.error("❌  Content directory required for build. Usage: platformkit build <content-dir>");
    process.exit(1);
  }

  if (!existsSync(contentDir) || !statSync(contentDir).isDirectory()) {
    console.error(`❌  Content directory not found: ${contentDir}`);
    process.exit(1);
  }

  const buildOutDir = outDir || path.resolve("dist");

  // ── 1. Stage user content into the package's expected locations ────

  // Copy data.json → cms-data.json + public/data.json (where Vite plugins expect it)
  // Check for data.json first, then cms-data.json as fallback
  const userDataFile = path.join(contentDir, "data.json");
  const userCmsFile = path.join(contentDir, "cms-data.json");
  const sourceDataFile = existsSync(userDataFile)
    ? userDataFile
    : existsSync(userCmsFile)
      ? userCmsFile
      : null;
  if (sourceDataFile) {
    const dataContent = readFileSync(sourceDataFile, "utf8");
    writeFileSync(path.join(packageRoot, "cms-data.json"), dataContent);
    writeFileSync(path.join(packageRoot, "public", "data.json"), dataContent);
    console.log(`  ✔ Staged ${path.basename(sourceDataFile)}`);
  } else {
    console.warn(`  ⚠ No data.json or cms-data.json found in ${contentDir} — using default content.`);
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

  // Copy voice.mp3 → public/voice.mp3 (reference voice for TTS)
  const userVoiceFile = path.join(contentDir, "voice.mp3");
  if (existsSync(userVoiceFile)) {
    copyFileSync(userVoiceFile, path.join(packageRoot, "public", "voice.mp3"));
    console.log(`  ✔ Staged voice.mp3 for TTS`);
  }

  // Copy themes/ → src/themes/user/ (user-provided theme overrides)
  const userThemesDir = path.join(contentDir, "themes");
  const destUserThemes = path.join(packageRoot, "src", "themes", "user");
  if (existsSync(userThemesDir) && statSync(userThemesDir).isDirectory()) {
    // Clean any previous staged user themes
    if (existsSync(destUserThemes)) {
      rmSync(destUserThemes, { recursive: true, force: true });
    }
    copyDirSync(userThemesDir, destUserThemes);
    const themeNames = readdirSync(destUserThemes).filter(
      (f) => statSync(path.join(destUserThemes, f)).isDirectory(),
    );
    console.log(`  ✔ Staged ${themeNames.length} user theme(s): ${themeNames.join(", ")}`);
  }

  // Copy overrides/ → src/overrides/user/ (user-provided component overrides)
  const userOverridesDir = path.join(contentDir, "overrides");
  const destUserOverrides = path.join(packageRoot, "src", "overrides", "user");
  if (existsSync(userOverridesDir) && statSync(userOverridesDir).isDirectory()) {
    if (existsSync(destUserOverrides)) {
      rmSync(destUserOverrides, { recursive: true, force: true });
    }
    copyDirSync(userOverridesDir, destUserOverrides);
    const overrideFiles = readdirSync(destUserOverrides).filter((f) => f.endsWith(".vue"));
    console.log(`  ✔ Staged ${overrideFiles.length} user override(s)`);
  }

  // Copy tailwind.config.js → tailwind.user.config.js (user Tailwind extensions)
  const userTailwindConfig = path.join(contentDir, "tailwind.config.js");
  if (existsSync(userTailwindConfig)) {
    copyFileSync(userTailwindConfig, path.join(packageRoot, "tailwind.user.config.js"));
    console.log(`  ✔ Staged user tailwind.config.js`);
  }

  // Copy vite.plugins.js → vite.user.plugins.js (user Vite plugins / middleware)
  const userVitePlugins = path.join(contentDir, "vite.plugins.js");
  if (existsSync(userVitePlugins)) {
    copyFileSync(userVitePlugins, path.join(packageRoot, "vite.user.plugins.js"));
    console.log(`  ✔ Staged user vite.plugins.js`);
  }

  // Copy vite.config.{ts,js,mjs} → vite.user.config.js (full user Vite config override)
  for (const ext of ["ts", "js", "mjs"]) {
    const userViteConfig = path.join(contentDir, `vite.config.${ext}`);
    if (existsSync(userViteConfig)) {
      if (ext === "ts") {
        // Transpile TypeScript → JS before staging
        try {
          const cliRequire = createRequire(import.meta.url);
          const { transformSync } = cliRequire("esbuild");
          const code = readFileSync(userViteConfig, "utf8");
          const result = transformSync(code, { loader: "ts", format: "esm", target: "node18" });
          writeFileSync(path.join(packageRoot, "vite.user.config.js"), result.code);
        } catch {
          // Fallback: copy as-is and let Node handle it
          copyFileSync(userViteConfig, path.join(packageRoot, "vite.user.config.js"));
        }
      } else {
        copyFileSync(userViteConfig, path.join(packageRoot, "vite.user.config.js"));
      }
      console.log(`  ✔ Staged user vite.config.${ext}`);
      break;
    }
  }

  // Copy platformkit.config.{ts,js,mjs} → project root
  for (const ext of ["ts", "js", "mjs"]) {
    const userConfigFile = path.join(contentDir, `platformkit.config.${ext}`);
    if (existsSync(userConfigFile)) {
      copyFileSync(userConfigFile, path.join(packageRoot, `platformkit.config.${ext}`));
      console.log(`  ✔ Staged platformkit.config.${ext}`);
      break; // only stage the first one found
    }
  }

  // Copy index.html → project root (user can override the HTML template)
  const userIndexHtml = path.join(contentDir, "index.html");
  if (existsSync(userIndexHtml)) {
    copyFileSync(userIndexHtml, path.join(packageRoot, "index.html"));
    console.log(`  ✔ Staged user index.html`);
  }

  // Install content repo npm dependencies (if package.json exists)
  const contentPkgJson = path.join(contentDir, "package.json");
  if (existsSync(contentPkgJson)) {
    console.log(`\n  📦 Installing user theme dependencies…`);
    try {
      execSync("npm install --production", {
        cwd: contentDir,
        stdio: "inherit",
      });
      const marker = {
        nodeModulesPath: path.join(contentDir, "node_modules"),
        installedAt: new Date().toISOString(),
      };
      writeFileSync(path.join(packageRoot, ".user-deps.json"), JSON.stringify(marker, null, 2));
      console.log(`  ✔ User deps installed`);
    } catch (err) {
      console.warn(`  ⚠ User dependency install failed — continuing without them.`);
    }
  }

  // ── 2. Load env vars from content dir's .env file ──────────────────

  const contentEnv = loadEnvFile(contentDir);
  // Also check cwd for .env (some hosts put it there)
  const cwdEnv = contentDir !== process.cwd() ? loadEnvFile(process.cwd()) : {};

  // Merge: process.env takes precedence, then content .env, then cwd .env
  const mergedEnv = { ...cwdEnv, ...contentEnv, ...process.env };

  // ── 2b. Run import-from-github if env vars are available ───────────
  //   This fetches the latest content from the private GitHub content repo,
  //   overwriting cms-data.json and public/data.json with the remote version.
  if (mergedEnv.GITHUB_OWNER && mergedEnv.GITHUB_REPO) {
    const importScript = path.join(packageRoot, "scripts", "import-from-github.mjs");
    if (existsSync(importScript)) {
      console.log(`\n  📥 Running import from GitHub…\n`);
      try {
        execSync(`node ${JSON.stringify(importScript)}`, {
          cwd: packageRoot,
          env: mergedEnv,
          stdio: "inherit",
        });
      } catch (err) {
        console.warn(`  ⚠ GitHub import failed — continuing with local data.`);
      }
    }
  }

  // ── 2c. Run export-data to ensure public/data.json is in sync ──────
  const exportScript = path.join(packageRoot, "scripts", "export-data.mjs");
  if (existsSync(exportScript)) {
    try {
      execSync(`node ${JSON.stringify(exportScript)}`, {
        cwd: packageRoot,
        env: mergedEnv,
        stdio: "inherit",
      });
    } catch (err) {
      console.warn(`  ⚠ Export step failed — continuing with existing data.`);
    }
  }

  // ── 2d. Set up Python venv and TTS dependencies if TTS is enabled ──
  if (mergedEnv.VITE_TTS_ENABLED) {
    const ttsRunner = path.join(packageRoot, "scripts", "run-tts.mjs");
    if (existsSync(ttsRunner)) {
      console.log(`\n  🐍 Setting up Python TTS environment…\n`);
      try {
        execSync(`node ${JSON.stringify(ttsRunner)}`, {
          cwd: packageRoot,
          env: mergedEnv,
          stdio: "inherit",
        });
        console.log(`  ✔ TTS audio generation complete`);
      } catch (err) {
        console.warn(`  ⚠ TTS generation failed — continuing without audio.`);
      }
    }
  }

  // ── 2e. Push updated content back to GitHub if TTS was run ────────
  if (mergedEnv.GITHUB_OWNER && mergedEnv.GITHUB_REPO && mergedEnv.VITE_TTS_ENABLED) {
    const exportScript = path.join(packageRoot, "scripts", "export-to-github.mjs");
    if (existsSync(exportScript)) {
      console.log(`\n  📤 Pushing updated content to GitHub…\n`);
      try {
        execSync(`node ${JSON.stringify(exportScript)}`, {
          cwd: packageRoot,
          env: mergedEnv,
          stdio: "inherit",
        });
        console.log(`  ✔ Content pushed to GitHub`);
      } catch (err) {
        console.warn(`  ⚠ GitHub push failed — content may not be persisted.`);
      }
    }
  }

  // ── 3. Install layout-specific dependencies ─────────────────────────
  const installLayoutDeps = path.join(packageRoot, "scripts", "install-layout-deps.mjs");
  if (existsSync(installLayoutDeps)) {
    console.log(`\n  📦 Installing layout dependencies…\n`);
    try {
      execSync(`node ${JSON.stringify(installLayoutDeps)}`, {
        cwd: packageRoot,
        env: mergedEnv,
        stdio: "inherit",
      });
    } catch (err) {
      console.warn(`  ⚠ Layout dependency install failed — continuing anyway.`);
    }
  }

  // ── 4. Run the real Vite build ─────────────────────────────────────

  console.log(`\n  ⏳ Running Vite build…\n`);

  const viteBin = path.join(packageRoot, "node_modules", ".bin", "vite");
  const viteCmd = existsSync(viteBin) ? viteBin : "npx vite";
  const buildCmd = `${viteCmd} build --outDir ${JSON.stringify(buildOutDir)}`;

  /** Remove staged user themes & overrides to keep the core tree clean. */
  const cleanupUserStaged = () => {
    const userThemesPath = path.join(packageRoot, "src", "themes", "user");
    const userOverridesPath = path.join(packageRoot, "src", "overrides", "user");
    const userDepsMarker = path.join(packageRoot, ".user-deps.json");
    if (existsSync(userThemesPath)) {
      rmSync(userThemesPath, { recursive: true, force: true });
    }
    if (existsSync(userOverridesPath)) {
      rmSync(userOverridesPath, { recursive: true, force: true });
    }
    if (existsSync(userDepsMarker)) {
      rmSync(userDepsMarker, { force: true });
    }
  };

  try {
    execSync(buildCmd, {
      cwd: packageRoot,
      env: mergedEnv,
      stdio: "inherit",
    });
  } catch (err) {
    cleanupUserStaged();
    console.error(`\n❌  Vite build failed.`);
    process.exit(1);
  }

  cleanupUserStaged();

  console.log(`\n✅  Built to ${buildOutDir}`);
  console.log(`    Deploy this folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.)\n`);
};

// ── SERVE command ────────────────────────────────────────────────────

const runServe = () => {
  const distDir = path.resolve(packageRoot, "dist");

  if (!existsSync(distDir)) {
    console.error(
      "❌  Built app not found. Run `platformkit build` first, or `npm run build`."
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
    console.log(`\n  🔗 PlatformKit is running at http://localhost:${port}\n`);
  });
};

// ── DEPLOY command ───────────────────────────────────────────────────

const runDeploy = async () => {
  console.log(`\n🚀  Deploying Supabase (migrations + edge functions)…\n`);

  // ── Helper: read env var from process.env, fall back to .env file ──
  const getEnv = (key) => {
    if (process.env[key]) return process.env[key];
    try {
      const envFile = readFileSync(path.join(packageRoot, ".env"), "utf-8");
      const m = envFile.match(new RegExp(`^${key}=["']?([^"'\\s]+)["']?`, "m"));
      return m ? m[1] : null;
    } catch { return null; }
  };

  // ── Pre-flight env checks ─────────────────────────────────────────
  const missing = (keys) => keys.filter(k => !getEnv(k));

  // #1 GitHub
  const githubKeys = [
    "GITHUB_OWNER", "GITHUB_REPO", "GITHUB_TOKEN", "GITHUB_BRANCH",
    "GITHUB_DATA_PATH", "GITHUB_UPLOADS_DIR",
  ];
  const missingGithub = missing(githubKeys);
  if (missingGithub.length) {
    console.error(`❌  Missing required GitHub env vars:\n   ${missingGithub.join(", ")}`);
    process.exit(1);
  }

  // #2 CMS password
  if (!getEnv("CMS_PASSWORD")) {
    console.error("❌  Missing required env var: CMS_PASSWORD");
    process.exit(1);
  }

  // #3 Site URL
  if (!getEnv("VITE_SITE_URL")) {
    console.error("❌  Missing required env var: VITE_SITE_URL");
    process.exit(1);
  }

  // #4 Supabase (optional — but if VITE_SUPABASE_URL is set, all related keys are required)
  if (getEnv("VITE_SUPABASE_URL")) {
    const supabaseKeys = [
      "VITE_SUPABASE_ANON_KEY",
      "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD",
      "SMTP_FROM_EMAIL", "SMTP_FROM_NAME",
      "NEWSLETTER_SECRET", "SITE_NAME", "CRON_SECRET",
    ];
    const missingSupabase = missing(supabaseKeys);
    if (missingSupabase.length) {
      console.error(`❌  VITE_SUPABASE_URL is set, so these env vars are also required:\n   ${missingSupabase.join(", ")}`);
      process.exit(1);
    }
  }

  console.log("  ✔ Environment checks passed\n");

  // #5 SMTP credential verification (only if SMTP vars are present)
  const smtpHost = getEnv("SMTP_HOST");
  const smtpPort = getEnv("SMTP_PORT");
  const smtpUser = getEnv("SMTP_USER");
  const smtpPass = getEnv("SMTP_PASSWORD");
  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    const { default: nodemailer } = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    try {
      await transport.verify();
      console.log(`  ✔ SMTP credentials verified (${smtpHost}:${smtpPort})\n`);
    } catch (err) {
      console.error(`❌  SMTP verification failed (${smtpHost}:${smtpPort}): ${err.message}`);
      process.exit(1);
    }
  }

  // Prefer user's content-repo supabase/ if it exists, else fall back to the package's own
  const userSupabaseDir = contentDir ? path.join(contentDir, "supabase") : null;
  const supabaseDir = (userSupabaseDir && existsSync(userSupabaseDir) && statSync(userSupabaseDir).isDirectory())
    ? userSupabaseDir
    : path.join(packageRoot, "supabase");

  if (!existsSync(supabaseDir)) {
    console.error("❌  No supabase/ directory found in either the content repo or the project.");
    process.exit(1);
  }

  if (supabaseDir !== path.join(packageRoot, "supabase")) {
    console.log(`  ✔ Using supabase/ from content repo: ${supabaseDir}\n`);
  }

  // The supabase CLI expects to find supabase/ relative to cwd
  const supabaseCwd = path.dirname(supabaseDir);

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
    execSync("npx supabase --version", { cwd: supabaseCwd, stdio: "pipe" });
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
          cwd: supabaseCwd,
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
        cwd: supabaseCwd,
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

  // ── Step 1b: Sync Vault secrets ────────────────────────────────────
  // pg_cron reads project_url, anon_key, and cron_secret from Vault
  // to build HTTP requests to edge functions.
  const vaultSecrets = [
    { name: "project_url", value: getEnv("VITE_SUPABASE_URL") },
    { name: "anon_key", value: getEnv("VITE_SUPABASE_ANON_KEY") },
    { name: "cron_secret", value: getEnv("CRON_SECRET") },
  ].filter(s => s.value);

  if (vaultSecrets.length > 0) {
    console.log(`  🔐 Syncing ${vaultSecrets.map(s => s.name).join(", ")} into Vault…\n`);
    const esc = (v) => v.replace(/'/g, "''");
    const sql = vaultSecrets
      .map(s => `DELETE FROM vault.secrets WHERE name = '${s.name}'; SELECT vault.create_secret('${esc(s.value)}', '${s.name}');`)
      .join("\n");
    try {
      execSync(`npx supabase db execute --remote`, {
        input: sql,
        cwd: supabaseCwd,
        stdio: ["pipe", "inherit", "inherit"],
      });
      console.log(`  ✔ Vault secrets synced\n`);
    } catch {
      console.warn("  ⚠  Could not sync Vault secrets. You may need to set them manually.\n");
    }
  } else {
    console.warn("  ⚠  No Vault secrets found in .env — pg_cron may not work.\n");
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
      cwd: supabaseCwd,
      stdio: "inherit",
    });
    console.log(`\n  ✔ All edge functions deployed\n`);
  } catch {
    console.error(`\n❌  Edge function deployment failed.`);
    process.exit(1);
  }

  // ── Step 3: Push edge function secrets ─────────────────────────────

  const EDGE_SECRET_KEYS = [
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
  ];

  const secretPairs = EDGE_SECRET_KEYS
    .map(key => ({ key, value: getEnv(key) }))
    .filter(s => s.value);

  if (secretPairs.length > 0) {
    console.log(`  🔑 Pushing ${secretPairs.length} edge function secret(s): ${secretPairs.map(s => s.key).join(", ")}\n`);
    const secretArgs = secretPairs.map(({ key, value }) => `'${key}=${value}'`).join(" ");
    try {
      execSync(`npx supabase secrets set ${secretArgs}`, {
        cwd: supabaseCwd,
        stdio: "inherit",
      });
      console.log(`\n  ✔ Edge function secrets updated\n`);
    } catch {
      console.error(`\n❌  Failed to push edge function secrets.`);
      process.exit(1);
    }
  } else {
    console.log("  ℹ No edge function secrets found in .env — skipping.\n");
  }

  console.log(`✅  Supabase deploy complete.\n`);
};

// ── Dispatch ─────────────────────────────────────────────────────────

if (command === "build") {
  runBuild();
} else if (command === "deploy") {
  runDeploy().catch(err => { console.error(err); process.exit(1); });
} else {
  runServe();
}