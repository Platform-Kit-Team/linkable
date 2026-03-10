import { spawn, spawnSync } from "node:child_process";
import nodeCrypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import jsYaml from "js-yaml";

import { sanitizeModel, stableStringify } from "./src/lib/model";
import {
  parseFrontmatter,
  serializeFrontmatter,
  renderMarkdown,
  hljs,
} from "./src/lib/markdown";
import type { PlatformKitConfig, RssFeedConfig, ContentCollectionConfig } from "./src/lib/config";
import { buildRssFeed, escapeXml as escapeRssXml } from "./src/lib/rss";
import { generateOgPages } from "./src/lib/og-prerender";
import type { ContentCollectionDef } from "./src/lib/layout-manifest";
import { migrateCollectionItem } from "./src/lib/collection-migrations";
import type { CollectionMigrationConfig } from "./src/lib/collection-migrations";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load platformkit.config.js/.ts (optional) ───────────────────────
/** Load a single PlatformKitConfig file from a directory. Returns {} if none found. */
const loadConfigFrom = async (dir: string, names?: string[]): Promise<PlatformKitConfig> => {
  const fileNames = names ?? ["platformkit.config.ts", "platformkit.config.js", "platformkit.config.mjs"];
  for (const name of fileNames) {
    const configPath = path.resolve(dir, name);
    if (!fs.existsSync(configPath)) continue;

    if (name.endsWith(".ts")) {
      try {
        const localRequire = createRequire(path.resolve(__dirname, "package.json"));
        const esbuild = localRequire("esbuild") as typeof import("esbuild");
        const tmpPath = configPath + ".__tmp.mjs";
        // Use buildSync to bundle local imports (e.g. build-hooks/) into a single file.
        // External: node builtins and npm packages — only local .ts/.js are inlined.
        esbuild.buildSync({
          entryPoints: [configPath],
          outfile: tmpPath,
          bundle: true,
          format: "esm",
          platform: "node",
          target: "node18",
          packages: "external",
          loader: { ".vue": "empty" },
        });
        try {
          const mod = await import(`${tmpPath}?t=${Date.now()}`);
          return mod.default ?? mod;
        } finally {
          try { fs.unlinkSync(tmpPath); } catch {}
        }
      } catch (err: any) {
        console.warn(`[platformkit] Failed to load ${configPath}: ${err?.message}`);
      }
    } else {
      try {
        const mod = await import(`${configPath}?t=${Date.now()}`);
        return mod.default ?? mod;
      } catch (err: any) {
        console.warn(`[platformkit] Failed to load ${configPath}: ${err?.message}`);
      }
    }
  }
  return {};
};

/**
 * Deep-merge two PlatformKitConfig objects.
 * - Objects: recursively merged (override extends/overwrites keys)
 * - `buildHooks`: concatenated (all levels run)
 * - Arrays (other than buildHooks): override replaces
 * - Scalars / functions: override wins
 */
const mergeBuildConfigs = (base: PlatformKitConfig, override: PlatformKitConfig): PlatformKitConfig => {
  const deepMerge = (target: any, source: any): any => {
    if (source === undefined || source === null) return target;
    if (target === undefined || target === null) return source;
    if (Array.isArray(source)) return source;
    if (
      source && typeof source === "object" && !Array.isArray(source) &&
      target && typeof target === "object" && !Array.isArray(target)
    ) {
      const result = { ...target };
      for (const key of Object.keys(source)) {
        result[key] = deepMerge(target[key], source[key]);
      }
      return result;
    }
    return source;
  };

  const merged = deepMerge(base, override) as PlatformKitConfig;

  // Special case: buildHooks are concatenated, not replaced
  if (base.buildHooks || override.buildHooks) {
    merged.buildHooks = [...(base.buildHooks ?? []), ...(override.buildHooks ?? [])];
  }

  return merged;
};

/**
 * Load and merge PlatformKitConfig from all three levels:
 *   1. Root platformkit.config.ts — platform defaults
 *   2. src/themes/<active>/platformkit.config.ts — theme config
 *   3. src/overrides/platformkit.config.ts — user overrides (final say)
 *
 * The active theme is detected from the CMS data file.
 */
const loadPlatformKitConfig = async (): Promise<PlatformKitConfig> => {
  // 1. Root config
  let config = await loadConfigFrom(__dirname);

  // 2. Detect active theme from CMS data
  const cmsPath = path.resolve(__dirname, "cms-data.json");
  const defaultPath = path.resolve(__dirname, "default-data.json");
  let themeName = "bento"; // fallback
  for (const p of [cmsPath, defaultPath]) {
    if (fs.existsSync(p)) {
      try {
        const d = JSON.parse(fs.readFileSync(p, "utf8"));
        if (d?.theme?.layout) { themeName = d.theme.layout; break; }
      } catch {}
    }
  }

  // 2b. Load theme config (platformkit.config.ts)
  //     .vue imports are externalized by the esbuild loader so build-time
  //     loading works even when the config references Vue editor components.
  const themeDir = path.resolve(__dirname, "src", "themes", themeName);
  if (fs.existsSync(themeDir)) {
    const themeConfig = await loadConfigFrom(themeDir);
    config = mergeBuildConfigs(config, themeConfig);
  }

  // 3. Load user overrides (platformkit.config.ts)
  const overridesDir = path.resolve(__dirname, "src", "overrides");
  if (fs.existsSync(overridesDir)) {
    const userConfig = await loadConfigFrom(overridesDir);
    config = mergeBuildConfigs(config, userConfig);
  }

  return config;
};

const pkConfig: PlatformKitConfig = await loadPlatformKitConfig();

// ── Register extra highlight.js languages from config ────────────────
if (pkConfig.markdown?.highlightLanguages?.length) {
  const requireCJS = createRequire(import.meta.url);
  for (const lang of pkConfig.markdown.highlightLanguages) {
    try {
      const langDef = requireCJS(`highlight.js/lib/languages/${lang}`);
      hljs.registerLanguage(lang, langDef);
    } catch {
      console.warn(`[platformkit] highlight.js language not found: ${lang}`);
    }
  }
}

// ── Deep-merge utility for Vite config ───────────────────────────────
const deepMergeConfig = (target: Record<string, any>, source: Record<string, any>): Record<string, any> => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (key === "plugins" && Array.isArray(source[key])) {
      result[key] = [...(result[key] || []), ...source[key]];
    } else if (
      source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === "object" && !Array.isArray(target[key])
    ) {
      result[key] = deepMergeConfig(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

// ── Load user Vite config (staged by CLI as vite.user.config.js) ─────
const loadUserViteConfig = async (): Promise<Record<string, any>> => {
  const configPath = path.resolve(__dirname, "vite.user.config.js");
  if (!fs.existsSync(configPath)) return {};
  try {
    const mod = await import(`${configPath}?t=${Date.now()}`);
    const resolved = mod.default ?? mod;
    console.log("[user-vite-config] Loaded vite.user.config.js");
    return typeof resolved === "object" && resolved !== null ? resolved : {};
  } catch (err: any) {
    console.warn(`[user-vite-config] Failed to load vite.user.config.js: ${err?.message}`);
    return {};
  }
};

const userViteConfig = await loadUserViteConfig();

const dataFilePath = path.resolve(__dirname, "cms-data.json");
const defaultDataFilePath = path.resolve(__dirname, "default-data.json");
const publicDataFilePath = path.resolve(__dirname, "public/content/data.json");


// ── File-based content collection definitions ───────────────────────
const collectionDefs: ContentCollectionDef[] = Object.entries(pkConfig.contentCollections ?? {}).map(
  ([key, cfg]) => ({
    key,
    label: cfg.label ?? key.charAt(0).toUpperCase() + key.slice(1),
    directory: cfg.directory,
    format: cfg.format ?? "markdown",
    slugField: cfg.slugField ?? "title",
    sortField: cfg.sortField,
    sortOrder: cfg.sortOrder ?? "desc",
    version: cfg.version ?? 0,
  }),
);

// ── File-based collection helpers ───────────────────────────────────
const COLLECTION_FORMAT_EXT: Record<string, string> = {
  markdown: ".md",
  json: ".json",
  yaml: ".yaml",
};

/** Read a collection file and return its parsed data + slug. */
const readCollectionFile = (
  filePath: string,
  format: "markdown" | "json" | "yaml",
): { data: Record<string, unknown>; body?: string } => {
  const raw = fs.readFileSync(filePath, "utf8");
  switch (format) {
    case "markdown": {
      const { meta, body } = parseFrontmatter(raw);
      return { data: meta as Record<string, unknown>, body };
    }
    case "json":
      return { data: JSON.parse(raw) };
    case "yaml":
      return { data: (jsYaml.load(raw) as Record<string, unknown>) ?? {} };
  }
};

/** Serialize collection item data to the appropriate file format. */
const writeCollectionFile = (
  filePath: string,
  format: "markdown" | "json" | "yaml",
  data: Record<string, unknown>,
  body?: string,
): void => {
  switch (format) {
    case "markdown": {
      const { content: _c, body: _b, html: _h, slug: _s, ...meta } = data;
      fs.writeFileSync(filePath, serializeFrontmatter(meta, body ?? (data.content as string) ?? ""));
      break;
    }
    case "json":
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      break;
    case "yaml":
      fs.writeFileSync(filePath, jsYaml.dump(data, { lineWidth: 120 }));
      break;
  }
};

/** Build a CollectionMigrationConfig from a collection key's config. */
const getMigrationConfig = (key: string): CollectionMigrationConfig | null => {
  const cfg = (pkConfig.contentCollections ?? {})[key];
  if (!cfg) return null;
  const version = cfg.version ?? 0;
  if (version === 0 && !cfg.fieldRenames && !cfg.fieldDefaults && !cfg.migrations?.length) return null;
  return {
    version,
    fieldRenames: cfg.fieldRenames ?? {},
    fieldDefaults: cfg.fieldDefaults ?? {},
    migrations: [...(cfg.migrations ?? [])].sort((a, b) => a.toVersion - b.toVersion),
  };
};

/** Apply collection migrations to an item, optionally writing back to disk if changed. */
const migrateItem = (
  item: Record<string, unknown>,
  migrationConfig: CollectionMigrationConfig,
  filePath?: string,
  format?: "markdown" | "json" | "yaml",
  body?: string,
): Record<string, unknown> => {
  const { item: migrated, changed } = migrateCollectionItem(item, migrationConfig);
  if (changed && filePath && format) {
    const { slug: _s, html: _h, content: _c, ...dataToWrite } = migrated;
    writeCollectionFile(filePath, format, dataToWrite, body);
  }
  return migrated;
};

/** Check if a schedulable item is currently visible based on its dates. */
const isScheduleVisibleNow = (item: { publishDate?: string; expirationDate?: string }): boolean => {
  const today = new Date().toISOString().slice(0, 10);
  if (item.publishDate && today < item.publishDate) return false;
  if (item.expirationDate && today > item.expirationDate) return false;
  return true;
};

const readDefaultModel = () => {
  if (!fs.existsSync(defaultDataFilePath)) {
    return sanitizeModel({});
  }

  try {
    const raw = fs.readFileSync(defaultDataFilePath, "utf8");
    return sanitizeModel(JSON.parse(raw));
  } catch (err) {
    console.warn(`[platformkit] Failed to parse default-data.json, using empty fallback:`, err);
    return sanitizeModel({});
  }
};

const ensureSeedData = () => {
  const seed = readDefaultModel();
  const payload = stableStringify(seed);

  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, payload);
  }

  if (!fs.existsSync(publicDataFilePath)) {
    const publicContentDir = path.dirname(publicDataFilePath);
    if (!fs.existsSync(publicContentDir)) {
      fs.mkdirSync(publicContentDir, { recursive: true });
    }
    fs.writeFileSync(publicDataFilePath, payload);
  }
};

const collectRequestBody = async (req: NodeJS.ReadableStream) => {
  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    chunks.push(chunk as Uint8Array);
  }

  return Buffer.concat(chunks).toString("utf8");
};

type GitCommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type GitCommandError = Error &
  GitCommandResult;

const runGitCommand = (args: string[]): Promise<GitCommandResult> => {
  return new Promise((resolve, reject) => {
    const proc = spawn("git", args, {
      cwd: __dirname,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code) => {
      const result: GitCommandResult = {
        code: code ?? 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      };

      if (result.code === 0) {
        resolve(result);
        return;
      }

      const error = new Error(`git ${args.join(" ")} exited with code ${result.code}`) as GitCommandError;
      error.code = result.code;
      error.stdout = result.stdout;
      error.stderr = result.stderr;
      reject(error);
    });

    proc.on("error", (error) => {
      reject(error);
    });
  });
};

const isGitCommandError = (error: unknown): error is GitCommandError => {
  if (!error || typeof error !== "object") return false;
  const candidate = error as Partial<GitCommandError>;
  return (
    typeof candidate.code === "number" &&
    typeof candidate.stdout === "string" &&
    typeof candidate.stderr === "string"
  );
};

const nothingToCommit = (error: GitCommandError) => {
  const combined = `${error.stdout}\n${error.stderr}`.toLowerCase();
  return error.code === 1 && combined.includes("nothing to commit");
};

const sanitizeCommitMessage = (input?: string) => {
  const fallback = "Update CMS data";
  if (!input) return fallback;
  const normalized = input
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u0019]/g, "")
    .trim();
  if (!normalized) return fallback;
  return normalized.slice(0, 140);
};

// reuse some helper logic from production upload naming
const generateUploadFileName = (inputName: unknown): string => {
  const extract = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      // common File-like objects
      const anyv = val as any;
      if (typeof anyv.name === "string") return anyv.name;
      if (typeof anyv.filename === "string") return anyv.filename;
    }
    return String(val);
  };

  const raw = extract(inputName).trim() || "image.png";
  const lastDot = raw.lastIndexOf(".");
  const baseRaw = lastDot >= 0 ? raw.slice(0, lastDot) : raw;
  const extensionRaw = lastDot >= 0 ? raw.slice(lastDot).toLowerCase() : "";

  // sanitize base: keep letters, numbers, dash, underscore and dot; replace others with '-'
  const safeBase = baseRaw.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80) || "image";
  const extension = extensionRaw || ".png";
  const timestamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "")
    .replaceAll("T", "")
    .replaceAll("Z", "")
    .slice(0, 15);
  const token = Math.random().toString(16).slice(2, 8);
  return `${safeBase}-${timestamp}-${token}${extension}`;
};

const asResultPayload = (result?: GitCommandResult | null) =>
  result
    ? {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
      }
    : undefined;

// Vite plugin that registers CMS dev endpoints as middleware. Using a plugin
// ensures the hook runs on the dev server lifecycle in newer Vite versions.

/** Build a PWA manifest object from CMS data. */
const buildManifest = (siteModel: any) => {
  const name = pkConfig.site?.name || siteModel?.profile?.displayName || "PlatformKit";
  const description = pkConfig.site?.tagline || siteModel?.profile?.tagline || "";
  const bg = siteModel?.theme?.bg || "#f5f7fb";
  const brand = siteModel?.theme?.colorBrand || "#3b82f6";
  const ogImage = siteModel?.profile?.ogImageUrl || "";
  const favicon = siteModel?.profile?.faviconUrl || "";

  const icons: { src: string; sizes: string; type: string; purpose?: string }[] = [];

  // Prefer the OG/social image as the large PWA icon
  if (ogImage) {
    icons.push({ src: ogImage, sizes: "512x512", type: "image/jpeg", purpose: "any" });
  }
  // Use favicon as a smaller icon if available
  if (favicon) {
    icons.push({ src: favicon, sizes: "192x192", type: "image/png", purpose: "any maskable" });
  }

  return {
    name,
    short_name: name,
    description,
    start_url: pkConfig.pwa?.startUrl || "/",
    display: pkConfig.pwa?.display || "standalone",
    background_color: bg,
    theme_color: brand,
    ...(icons.length > 0 ? { icons } : {}),
  };
};

// ── CMS endpoint paths (configurable via platformkit.config.ts) ──────
const CMS_ENDPOINTS = {
  upload:   pkConfig.cms?.uploadEndpoint   || "/cms-upload",
  data:     pkConfig.cms?.dataEndpoint     || "/__cms-data",
  push:     pkConfig.cms?.pushEndpoint     || "/__cms-push",
};

// Allowed file extensions for uploads (R1)
const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  // Images
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".ico", ".bmp",
  // Audio
  ".mp3", ".wav", ".webm", ".m4a", ".ogg", ".flac", ".aac",
  // Video
  ".mp4", ".webm", ".mov", ".avi",
  // Documents
  ".pdf", ".json",
]);

// Max upload size: 50 MB (R2)
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const cmsMiddlewarePlugin = () => ({
  name: "cms-middleware",
  configureServer: (server: any) => {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = (req.url ?? "").split("?")[0];

      if (url === CMS_ENDPOINTS.upload) {
        if (server.config.mode !== "development") {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }

        // Enforce upload size limit (R2)
        const contentLength = parseInt(req.headers["content-length"] || "0", 10);
        if (contentLength > MAX_UPLOAD_BYTES) {
          res.statusCode = 413;
          res.end("File too large (max 50 MB)");
          return;
        }

        const uploadsDir = path.resolve(__dirname, "public/content/uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const requireCJS = createRequire(import.meta.url);
        const createBusboy = requireCJS("busboy");
        const bb = createBusboy({ headers: req.headers, limits: { fileSize: MAX_UPLOAD_BYTES } });
        let returnedUrl = "";
        let uploadError = "";
        let conversionWarning = "";
        let writeComplete: Promise<void> = Promise.resolve();

        bb.on("file", (_fieldname: string, fileStream: NodeJS.ReadableStream, filename: any) => {
          // incoming filename argument may already be an object produced by busboy
          // containing { filename, encoding, mimeType }
          let orig = filename;
          let mimeType = "";
          if (orig && typeof orig === "object" && typeof orig.filename === "string") {
            mimeType = orig.mimeType || "";
            orig = orig.filename;
          }

          if (!orig || typeof orig !== "string") {
            const f = fileStream as any;
            if (f && typeof f.name === "string") orig = f.name;
            else if (f && typeof f.filename === "string") orig = f.filename;
            else if (f && typeof f.path === "string") orig = path.basename(f.path as string);
            else orig = String(filename || "image.png");
          }

          // R3: Strip path segments to prevent path traversal
          orig = path.basename(orig);

          // R1: Validate file extension against allowlist
          const extRaw = orig.includes(".") ? orig.slice(orig.lastIndexOf(".")).toLowerCase() : "";
          if (!extRaw || !ALLOWED_UPLOAD_EXTENSIONS.has(extRaw)) {
            uploadError = `File type not allowed: ${extRaw || "(none)"}`;
            fileStream.resume(); // drain the stream
            return;
          }

          // If the filename already looks like a deterministic target (e.g.
          // "avatar.jpg", "voice.mp3", "voice.wav") use it directly so re-uploads
          // overwrite the previous file instead of accumulating copies.
          const isDeterministic = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp|mp3|wav|webm|m4a)$/i.test(orig);
          const isAudio = mimeType.startsWith("audio/");
          const baseName = isDeterministic ? orig.replace(/\.[^.]+$/, "") : generateUploadFileName(orig).replace(/\.[^.]+$/, "");
          const ext = isAudio ? ".mp3" : extRaw;
          const safe = baseName + ext;
          const outPath = path.join(uploadsDir, safe);

          // R3: Final check — ensure resolved path is inside uploadsDir
          const resolved = path.resolve(outPath);
          if (!resolved.startsWith(uploadsDir + path.sep) && resolved !== uploadsDir) {
            uploadError = "Invalid filename";
            fileStream.resume();
            return;
          }

          const write = fs.createWriteStream(outPath);
          write.on("error", (err) => {
            uploadError = `Write failed: ${(err as Error).message}`;
          });
          fileStream.pipe(write);
          returnedUrl = `/content/uploads/${safe}`;

          // For audio files, convert to MP3 using ffmpeg after write completes
          if (isAudio) {
            writeComplete = new Promise<void>((resolveWrite) => {
              write.on("finish", () => {
                // If input was not mp3, convert
                if (!orig.toLowerCase().endsWith(".mp3")) {
                  const tempPath = outPath + ".temp";
                  fs.renameSync(outPath, tempPath);
                  try {
                    const { spawnSync } = require("child_process");
                    const result = spawnSync("ffmpeg", ["-y", "-i", tempPath, "-b:a", "128k", "-ac", "1", outPath], {
                      stdio: "inherit",
                      timeout: 120_000,
                    });
                    if (result.status === 0) {
                      fs.unlinkSync(tempPath);
                    } else {
                      console.error(`ffmpeg conversion failed (exit ${result.status})`);
                      // Conversion failed, keep original
                      fs.renameSync(tempPath, outPath);
                      conversionWarning = "Audio conversion failed; file saved in original format";
                    }
                  } catch (err) {
                    console.error("ffmpeg not available or errored:", err);
                    // ffmpeg not available, keep original
                    fs.renameSync(tempPath, outPath);
                    conversionWarning = "Audio conversion unavailable; file saved in original format";
                  }
                }
                resolveWrite();
              });
            });
          } else {
            writeComplete = new Promise<void>((resolveWrite) => {
              write.on("finish", () => resolveWrite());
            });
          }
        });

        bb.on("finish", async () => {
          await writeComplete;
          if (uploadError) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: uploadError }));
            return;
          }
          res.setHeader("Content-Type", "application/json");
          const body: Record<string, string> = { url: returnedUrl };
          if (conversionWarning) body.warning = conversionWarning;
          res.end(JSON.stringify(body));
        });

        req.pipe(bb);
        return;
      }

      // ── Manifest.json (dynamic, from CMS data) ──────────────────
      if (url === "/manifest.json" && req.method === "GET") {
        ensureSeedData();
        const raw = fs.readFileSync(dataFilePath, "utf8");
        const siteModel = sanitizeModel(JSON.parse(raw));
        res.setHeader("Content-Type", "application/manifest+json");
        res.end(JSON.stringify(buildManifest(siteModel), null, 2));
        return;
      }

      if (url === CMS_ENDPOINTS.data) {
        ensureSeedData();

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === "GET") {
          const payload = fs.readFileSync(dataFilePath, "utf8");
          res.setHeader("Content-Type", "application/json");
          res.end(payload);
          return;
        }

        if (req.method === "POST") {
          const body = await collectRequestBody(req);
          const parsed = sanitizeModel(body ? JSON.parse(body) : {});
          const serialized = stableStringify(parsed);
          // R12: Atomic write via temp file + rename to prevent partial writes
          const tmpFile = dataFilePath + "." + Math.random().toString(16).slice(2) + ".tmp";
          fs.writeFileSync(tmpFile, serialized);
          fs.renameSync(tmpFile, dataFilePath);
          res.statusCode = 204;
          res.end();
          return;
        }

        res.statusCode = 405;
        res.end("Method Not Allowed");
        return;
      }

      if (url === CMS_ENDPOINTS.push && req.method === "POST") {
        // Run the export-to-github script to push content to the remote repo
        const scriptPath = path.resolve(__dirname, "scripts/export-to-github.mjs");
        if (!fs.existsSync(scriptPath)) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Push script not found." }));
          return;
        }

        // Read optional commit message from body
        const body = await collectRequestBody(req);
        let commitMessage = "Update CMS data";
        try {
          const parsed = JSON.parse(body);
          if (parsed?.message) commitMessage = sanitizeCommitMessage(parsed.message);
        } catch {
          // ignore
        }

        // Sync cms-data.json → public/content/data.json before pushing
        if (fs.existsSync(dataFilePath)) {
          fs.writeFileSync(publicDataFilePath, fs.readFileSync(dataFilePath, "utf8"));
        }

        const proc = spawn("node", [scriptPath], {
          cwd: __dirname,
          env: { ...process.env, CMS_COMMIT_MESSAGE: commitMessage },
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";
        proc.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
        proc.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });

        proc.on("close", (code) => {
          res.setHeader("Content-Type", "application/json");
          if (code === 0) {
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, stdout: stdout.trim() }));
          } else {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: `Push failed (exit ${code})`, stdout: stdout.trim(), stderr: stderr.trim() }));
          }
        });

        proc.on("error", (err) => {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message }));
        });

        return;
      }

      // ── Generic file collection CRUD ─────────────────────────────
      const collectionMatch = url.match(/^\/__collection\/([a-zA-Z0-9_-]+)$/);
      if (collectionMatch) {
        const collectionKey = collectionMatch[1];
        const def = collectionDefs.find((d) => d.key === collectionKey);
        if (!def) {
          res.statusCode = 404;
          res.end(`Unknown collection: ${collectionKey}`);
          return;
        }

        const ext = COLLECTION_FORMAT_EXT[def.format];
        const dir = path.resolve(__dirname, def.directory);

        // GET — list all items or single item by ?slug=
        if (req.method === "GET") {
          const fullUrl = new URL(req.url ?? "", "http://localhost");
          const slug = fullUrl.searchParams.get("slug") ?? "";

          if (slug) {
            // Single item
            const safeName = path.basename(slug);
            const filePath = path.join(dir, `${safeName}${ext}`);
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404;
              res.end("Not found");
              return;
            }
            const { data, body } = readCollectionFile(filePath, def.format);
            let item: Record<string, unknown> = { ...data, slug: safeName };
            const mc = getMigrationConfig(collectionKey);
            if (mc) item = migrateItem(item, mc, filePath, def.format, body);
            if (def.format === "markdown" && body !== undefined) {
              item.content = body;
              item.html = renderMarkdown(body);
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(item));
            return;
          }

          // List all
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const files = fs.readdirSync(dir).filter((f: string) => f.endsWith(ext));
          const mc = getMigrationConfig(collectionKey);
          const items = files.map((file: string) => {
            const slug = path.basename(file, ext);
            const fp = path.join(dir, file);
            const { data, body } = readCollectionFile(fp, def.format);
            let item: Record<string, unknown> = { ...data, slug };
            if (mc) item = migrateItem(item, mc, fp, def.format, body);
            return item;
          });
          // Sort
          if (def.sortField) {
            const sf = def.sortField;
            const dir = def.sortOrder === "asc" ? 1 : -1;
            items.sort((a, b) => {
              const av = (a as any)[sf] ?? "";
              const bv = (b as any)[sf] ?? "";
              return av > bv ? dir : av < bv ? -dir : 0;
            });
          }
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(items));
          return;
        }

        // POST — create / update item
        if (req.method === "POST") {
          const rawBody = await collectRequestBody(req);
          const payload = JSON.parse(rawBody);
          const slugValue: string = payload.slug ?? "";
          if (!slugValue) {
            res.statusCode = 400;
            res.end("Missing slug");
            return;
          }
          const safeName = path.basename(slugValue).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
          if (!safeName || safeName === "-") {
            res.statusCode = 400;
            res.end("Invalid slug");
            return;
          }
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const filePath = path.join(dir, `${safeName}${ext}`);
          const { slug: _s, html: _h, ...itemData } = payload;
          writeCollectionFile(filePath, def.format, itemData, payload.content);
          res.statusCode = 204;
          res.end();
          return;
        }

        // DELETE — remove item by ?slug=
        if (req.method === "DELETE") {
          const fullUrl = new URL(req.url ?? "", "http://localhost");
          const slug = fullUrl.searchParams.get("slug") ?? "";
          if (!slug) {
            res.statusCode = 400;
            res.end("Missing slug parameter");
            return;
          }
          const safeName = path.basename(slug);
          const filePath = path.join(dir, `${safeName}${ext}`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.statusCode = 204;
          res.end();
          return;
        }

        res.statusCode = 405;
        res.end("Method Not Allowed");
        return;
      }

      // ── RSS feed (dev) ───────────────────────────────────────────
      if (url === "/content/rss.xml" && req.method === "GET") {
        // Find a collection with RSS enabled
        const rssDef = collectionDefs.find(d => {
          const cfg = (pkConfig.contentCollections ?? {})[d.key];
          return cfg?.generateRss;
        });
        const rssDir = rssDef ? path.resolve(__dirname, rssDef.directory) : null;
        const rssExt = rssDef ? COLLECTION_FORMAT_EXT[rssDef.format] : ".md";

        if (!rssDir || !fs.existsSync(rssDir)) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/rss+xml");
          res.end(buildRssFeed([], readDefaultModel(), pkConfig));
          return;
        }
        const files = fs.readdirSync(rssDir).filter((f: string) => f.endsWith(rssExt));
        const posts: any[] = [];
        for (const file of files) {
          const fp = path.join(rssDir, file);
          const { data, body } = readCollectionFile(fp, rssDef!.format);
          if (data.published === false) continue;
          const slug = path.basename(file, rssExt);
          const html = body ? renderMarkdown(body) : "";
          posts.push({ ...data, slug, html });
        }
        if (rssDef!.sortField) {
          const sf = rssDef!.sortField;
          posts.sort((a: any, b: any) => (b[sf] > a[sf] ? 1 : b[sf] < a[sf] ? -1 : 0));
        }
        const siteModel = fs.existsSync(dataFilePath)
          ? JSON.parse(fs.readFileSync(dataFilePath, "utf8"))
          : readDefaultModel();
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/rss+xml");
        res.end(buildRssFeed(posts, siteModel, pkConfig));
        return;
      }

      // not a CMS request — continue to other middleware
      next();
    });
  },
});

/** Build plugin: validate all content at build time. Exits with error if any content is invalid. */
const contentValidationPlugin = () => ({
  name: "content-validation",
  buildStart() {
    // Check env var (explicit "false" disables) then config (default: true)
    const envVal = process.env.VITE_CONTENT_VALIDATION?.toLowerCase().trim();
    if (envVal === "false" || envVal === "0") return;
    if (pkConfig.build?.contentValidation === false) return;

    const errors: string[] = [];

    // ── Validate CMS data ──────────────────────────────────────────
    if (fs.existsSync(dataFilePath)) {
      try {
        const raw = fs.readFileSync(dataFilePath, "utf8");
        JSON.parse(raw);
      } catch (err) {
        errors.push(`cms-data.json: Invalid JSON — ${(err as Error).message}`);
      }
    }

    // ── Validate file-based collections ────────────────────────────
    for (const def of collectionDefs) {
      const dir = path.resolve(__dirname, def.directory);
      if (!fs.existsSync(dir)) continue;

      const ext = COLLECTION_FORMAT_EXT[def.format];
      const files = fs.readdirSync(dir).filter((f: string) => f.endsWith(ext));
      const cfg = (pkConfig.contentCollections ?? {})[def.key];

      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const { data } = readCollectionFile(filePath, def.format);

          // Run Zod validation if schema is provided
          if (cfg?.validationSchema) {
            const result = cfg.validationSchema.safeParse(data);
            if (!result.success) {
              const issues = result.error.issues
                .map((i: { path: (string | number)[]; message: string }) => `  ${i.path.join(".")}: ${i.message}`)
                .join("\n");
              errors.push(`${def.key}/${file}: Schema validation failed:\n${issues}`);
            }
          }
        } catch (err) {
          errors.push(`${def.key}/${file}: Failed to parse — ${(err as Error).message}`);
        }
      }
    }

    if (errors.length > 0) {
      const summary = errors.map((e) => `  ✗ ${e}`).join("\n");
      throw new Error(
        `\n[content-validation] Build aborted — ${errors.length} content error(s) found:\n${summary}\n\n` +
        `Set VITE_CONTENT_VALIDATION=false to skip validation.\n`,
      );
    }

    console.log("[content-validation] All content validated successfully.");
  },
});

/** Build plugin: generate static JSON files for all file-based content collections. */
// Track built collection data for closeBundle hooks and build hooks
const builtCollectionData: Record<string, { items: Record<string, unknown>[]; allItems: Record<string, unknown>[]; outputDir: string; sourceDir: string }> = {};

const collectionBuildPlugin = () => ({
  name: "collection-build",
  async buildStart() {
    if (collectionDefs.length === 0) return;

    for (const def of collectionDefs) {
      const cfg = (pkConfig.contentCollections ?? {})[def.key];
      const dir = path.resolve(__dirname, def.directory);
      if (!fs.existsSync(dir)) continue;

      const ext = COLLECTION_FORMAT_EXT[def.format];
      const files = fs.readdirSync(dir).filter((f: string) => f.endsWith(ext));
      if (files.length === 0) continue;

      const outDir = path.resolve(__dirname, "public", "content", "collections", def.key);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      const allItems: Record<string, unknown>[] = [];
      const mc = getMigrationConfig(def.key);

      for (const file of files) {
        const slug = path.basename(file, ext);
        const fp = path.join(dir, file);
        const { data, body } = readCollectionFile(fp, def.format);
        let item: Record<string, unknown> = { ...data, slug };
        if (mc) item = migrateItem(item, mc, fp, def.format, body);

        if (def.format === "markdown" && body !== undefined) {
          item.content = body;
          item.html = renderMarkdown(body);
        }

        fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(item, null, 2));
        const { content: _c, html: _h, ...indexData } = item;
        allItems.push(indexData);
      }

      // Apply indexFilter if defined
      const indexFilter = cfg?.indexFilter;
      const index = indexFilter ? allItems.filter(indexFilter) : [...allItems];

      // Sort index
      if (def.sortField) {
        const sf = def.sortField;
        const sortDir = def.sortOrder === "asc" ? 1 : -1;
        index.sort((a, b) => {
          const av = (a[sf] as string) ?? "";
          const bv = (b[sf] as string) ?? "";
          return av > bv ? sortDir : av < bv ? -sortDir : 0;
        });
      }

      fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index, null, 2));
      console.log(`[collection-build] Generated ${files.length} ${def.key} item(s) into public/content/collections/${def.key}/`);

      // Store for closeBundle and call afterBuild hook
      builtCollectionData[def.key] = { items: index, allItems, outputDir: outDir, sourceDir: dir };

      if (cfg?.buildHooks?.afterBuild) {
        const siteModel = fs.existsSync(dataFilePath)
          ? JSON.parse(fs.readFileSync(dataFilePath, "utf8"))
          : readDefaultModel();
        cfg.buildHooks.afterBuild({
          items: index,
          allItems,
          outputDir: outDir,
          sourceDir: dir,
          config: pkConfig,
          siteModel,
        });
      }

      // ── Built-in RSS generation ──────────────────────────────────
      if (cfg?.generateRss && pkConfig.rss?.enabled !== false) {
        const siteModel = fs.existsSync(dataFilePath)
          ? JSON.parse(fs.readFileSync(dataFilePath, "utf8"))
          : readDefaultModel();

        // Hydrate each index entry with its full HTML for RSS <content:encoded>
        const rssEligible = index.filter((m: any) => m.rss !== false);

        const feedConfigs: RssFeedConfig[] =
          pkConfig.rss?.feeds && pkConfig.rss.feeds.length > 0
            ? pkConfig.rss.feeds
            : [{ output: "rss.xml" }];

        for (const feedCfg of feedConfigs) {
          let feedPosts = rssEligible;

          if (feedCfg.pathFilter) {
            const pathRe = new RegExp(feedCfg.pathFilter);
            feedPosts = feedPosts.filter((m: any) => pathRe.test(m.slug));
          }
          if (feedCfg.contentFilter) {
            const contentRe = new RegExp(feedCfg.contentFilter);
            feedPosts = feedPosts.filter((m: any) => {
              const postFile = path.join(dir, `${m.slug}${ext}`);
              if (!fs.existsSync(postFile)) return false;
              const raw = fs.readFileSync(postFile, "utf8");
              return contentRe.test(raw);
            });
          }
          if (feedCfg.tags && feedCfg.tags.length > 0) {
            const tagSet = new Set(feedCfg.tags.map((t: string) => t.toLowerCase()));
            feedPosts = feedPosts.filter((m: any) =>
              Array.isArray(m.tags) && m.tags.some((t: string) => tagSet.has(t.toLowerCase())),
            );
          }

          // Hydrate with rendered HTML
          const rssPosts = feedPosts.map((meta: any) => {
            const postFile = path.join(outDir, `${meta.slug}.json`);
            if (fs.existsSync(postFile)) {
              const full = JSON.parse(fs.readFileSync(postFile, "utf8"));
              return { ...meta, html: full.html || "", audio: full.audio, audioUrl: full.audioUrl };
            }
            return { ...meta, html: "" };
          });

          const rssXml = buildRssFeed(rssPosts, siteModel, pkConfig, feedCfg);
          const outputFile = feedCfg.output || "rss.xml";
          const outputPath = path.resolve(__dirname, "public", "content", outputFile);
          const feedOutDir = path.dirname(outputPath);
          if (!fs.existsSync(feedOutDir)) fs.mkdirSync(feedOutDir, { recursive: true });
          fs.writeFileSync(outputPath, rssXml);
          console.log(`[collection-build] Generated RSS feed ${outputFile} (${rssPosts.length} item(s))`);
        }
      }
    }

    // ── Run afterCollectionBuild hooks from all config levels ───────
    if (pkConfig.buildHooks?.length) {
      const afterBuildHooks = pkConfig.buildHooks.filter(h => h.phase === "afterCollectionBuild");
      if (afterBuildHooks.length > 0) {
        const siteModel = fs.existsSync(dataFilePath)
          ? JSON.parse(fs.readFileSync(dataFilePath, "utf8"))
          : readDefaultModel();

        // Build allItems map for hook context
        const collectionsCtx: Record<string, { items: Record<string, unknown>[]; allItems: Record<string, unknown>[]; outputDir: string; sourceDir: string }> = {};
        for (const [key, data] of Object.entries(builtCollectionData)) {
          collectionsCtx[key] = data;
        }

        for (const hook of afterBuildHooks) {
          try {
            await hook.run({ collections: collectionsCtx, config: pkConfig, siteModel });
            console.log(`[build-hook] ${hook.name} completed`);
          } catch (err: any) {
            console.warn(`[build-hook] ${hook.name} failed: ${err.message}`);
          }
        }
      }
    }
  },
  async closeBundle() {
    const distDir = path.resolve(__dirname, "dist");
    if (!fs.existsSync(distDir)) return;

    for (const def of collectionDefs) {
      const cfg = (pkConfig.contentCollections ?? {})[def.key];
      const built = builtCollectionData[def.key];
      if (!built) continue;

      const siteModel = fs.existsSync(dataFilePath)
        ? sanitizeModel(JSON.parse(fs.readFileSync(dataFilePath, "utf8")))
        : readDefaultModel();

      // Call custom per-collection closeBundle hook
      if (cfg?.buildHooks?.closeBundle) {
        cfg.buildHooks.closeBundle({
          items: built.items,
          distDir,
          collectionKey: def.key,
          config: pkConfig,
          siteModel,
        });
      }

      // Built-in OG pre-rendering
      if (cfg?.generateOgPages) {
        const routePrefix = typeof cfg.generateOgPages === "object"
          ? cfg.generateOgPages.routePrefix || "content"
          : "content";
        const count = generateOgPages(
          built.items as any[],
          distDir,
          siteModel,
          pkConfig,
          routePrefix,
        );
        if (count > 0) {
          console.log(`[collection-build] Pre-rendered ${count} ${def.key} OG page(s)`);
        }
      }
    }

    // ── Run closeBundle hooks from all config levels ─────────────
    const closeBundleHooks = pkConfig.buildHooks?.filter(h => h.phase === "closeBundle") ?? [];
    if (closeBundleHooks.length > 0) {
      const siteModel = fs.existsSync(dataFilePath)
        ? sanitizeModel(JSON.parse(fs.readFileSync(dataFilePath, "utf8")))
        : readDefaultModel();

      const collectionsCtx: Record<string, { items: Record<string, unknown>[]; allItems: Record<string, unknown>[]; outputDir: string; sourceDir: string }> = {};
      for (const [key, data] of Object.entries(builtCollectionData)) {
        collectionsCtx[key] = data;
      }

      for (const hook of closeBundleHooks) {
        try {
          await hook.run({ collections: collectionsCtx, distDir, config: pkConfig, siteModel });
          console.log(`[build-hook] ${hook.name} completed`);
        } catch (err: any) {
          console.warn(`[build-hook] ${hook.name} failed: ${err.message}`);
        }
      }
    }
  },
});

/** Resolve site URL from platformkit config, process.env, .env files, or manual parse. */
const resolveSiteUrl = (): string => {
  // 0. platformkit.config site.url
  if (pkConfig.site?.url) return pkConfig.site.url.replace(/\/$/, "");

  // 1. Explicit env var (set by host platform or shell)
  if (process.env.VITE_SITE_URL) return process.env.VITE_SITE_URL.replace(/\/$/, "");

  // 2. Vite's loadEnv across all modes
  for (const mode of ["production", "development", ""]) {
    try {
      const env = loadEnv(mode, __dirname, "VITE_");
      if (env.VITE_SITE_URL) return env.VITE_SITE_URL.replace(/\/$/, "");
    } catch { /* ignore */ }
  }

  // 3. Manual .env parse as last resort (handles edge cases where Vite's
  //    loadEnv doesn't pick up the file, e.g. some CI environments)
  const envPath = path.resolve(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || !trimmed) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key === "VITE_SITE_URL" && val) return val.replace(/\/$/, "");
    }
  }

  return "";
};

/** Build plugin: inject OG meta tags into index.html from CMS data so social
 *  crawlers (iMessage, Twitter, Facebook, etc.) can read them without JS. */
const ogMetaPlugin = () => {
  const getModel = () => {
    return fs.existsSync(dataFilePath)
      ? sanitizeModel(JSON.parse(fs.readFileSync(dataFilePath, "utf8")))
      : readDefaultModel();
  };

  const buildOgTags = (model: any) => {
    const p = model?.profile;
    if (!p) return "";

    const siteUrl = resolveSiteUrl();

    const toAbsolute = (url: string) => {
      if (!url) return "";
      if (/^https?:\/\//.test(url)) return url;
      return siteUrl ? `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}` : url;
    };

    const escAttr = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const tags: string[] = [];

    if (p.displayName) {
      tags.push(`<meta property="og:title" content="${escAttr(p.displayName)}" />`);
    }
    if (p.tagline) {
      tags.push(`<meta property="og:description" content="${escAttr(p.tagline)}" />`);
    }
    if (p.ogImageUrl) {
      const abs = toAbsolute(p.ogImageUrl);
      tags.push(`<meta property="og:image" content="${escAttr(abs)}" />`);
      tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
    }
    tags.push(`<meta property="og:type" content="website" />`);
    if (siteUrl) {
      tags.push(`<meta property="og:url" content="${escAttr(siteUrl)}" />`);
    }

    return tags.join("\n    ");
  };

  return {
    name: "og-meta",
    transformIndexHtml: {
      order: "pre" as const,
      handler(html: string) {
        const model = getModel();
        const p = model?.profile;

        // Replace hardcoded <title> and <meta name="description"> with CMS values
        if (p?.displayName) {
          html = html.replace(/<title>[^<]*<\/title>/, `<title>${p.displayName}</title>`);
        }
        if (p?.tagline) {
          const escAttr = (s: string) =>
            s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          html = html.replace(
            /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
            `<meta name="description" content="${escAttr(p.tagline)}" />`,
          );
        }
        if (p?.faviconUrl) {
          html = html.replace(
            /<link\s+id="__platformkit-apple-touch"\s+rel="apple-touch-icon"\s+href="[^"]*"\s*\/?>/,
            `<link id="__platformkit-apple-touch" rel="apple-touch-icon" href="${p.faviconUrl}" />`,
          );
        }

        const tags = buildOgTags(model);
        if (!tags) return html;
        // Inject OG tags right before </head>
        return html.replace("</head>", `    ${tags}\n  </head>`);
      },
    },
  };
};

/** Build plugin: generate manifest.json at build time from CMS data. */
const manifestBuildPlugin = () => ({
  name: "manifest-build",
  buildStart() {
    if (pkConfig.pwa?.enabled === false) return;
    const siteModel = fs.existsSync(dataFilePath)
      ? sanitizeModel(JSON.parse(fs.readFileSync(dataFilePath, "utf8")))
      : readDefaultModel();
    const manifest = buildManifest(siteModel);
    const outPath = path.resolve(__dirname, "public/manifest.json");
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
    console.log("[manifest-build] Generated public/manifest.json");
  },
});

/**
 * Build plugin: when VITE_SCHEDULE_EXCLUDE_BUILD is set, strip links, gallery
 * items, and embeds outside their schedule window from public/data.json so
 * they never reach the client.
 */
const scheduleBuildPlugin = () => ({
  name: "schedule-build",
  buildStart() {
    if (!pkConfig.build?.scheduleExclude && !readEnvVar("VITE_SCHEDULE_EXCLUDE_BUILD")) return;
    if (!fs.existsSync(publicDataFilePath)) return;

    const raw = JSON.parse(fs.readFileSync(publicDataFilePath, "utf8"));

    let removed = 0;
    if (Array.isArray(raw.links)) {
      const before = raw.links.length;
      raw.links = raw.links.filter((l: any) => isScheduleVisibleNow(l));
      removed += before - raw.links.length;
    }
    if (raw.gallery && Array.isArray(raw.gallery.items)) {
      const before = raw.gallery.items.length;
      raw.gallery.items = raw.gallery.items.filter((g: any) => isScheduleVisibleNow(g));
      removed += before - raw.gallery.items.length;
    }
    if (Array.isArray(raw.embeds)) {
      const before = raw.embeds.length;
      raw.embeds = raw.embeds.filter((e: any) => isScheduleVisibleNow(e));
      removed += before - raw.embeds.length;
    }

    fs.writeFileSync(publicDataFilePath, JSON.stringify(raw, null, 2));
    if (removed > 0) {
      console.log(`[schedule-build] Excluded ${removed} scheduled item(s) from data.json`);
    }
  },
});

/**
 * Encrypt a GitHub token at build time using Node's crypto module.
 * Produces the same salt‖iv‖ciphertext+tag format that the browser-side
 * decryptToken() in token-crypto.ts expects.
 */
const encryptTokenAtBuild = (token: string, password: string): string => {
  const ITERATIONS = 600_000;
  const salt = nodeCrypto.randomBytes(16);
  const iv = nodeCrypto.randomBytes(12);
  const key = nodeCrypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
  const cipher = nodeCrypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes
  // Web Crypto's AES-GCM appends the tag to ciphertext — match that layout
  const combined = Buffer.concat([salt, iv, encrypted, tag]);
  return combined.toString("base64");
};

/**
 * Build plugin: pre-render pages into fully-rendered static HTML using
 * Puppeteer.  Renders the main page ("/") plus any layout routes that
 * have `prerender` set.
 *
 * The plugin starts a lightweight static file server from `dist/`,
 * launches headless Chrome, navigates to each route, waits for the
 * Vue app to dispatch the `app-rendered` DOM event, and writes the
 * captured HTML back to the corresponding `dist/{path}/index.html`.
 */
const prerenderBuildPlugin = () => ({
  name: "prerender",
  async closeBundle() {
    if (!pkConfig.build?.prerender && !process.env.VITE_PRERENDER) return;

    const distDir = path.resolve(__dirname, "dist");
    const indexHtmlPath = path.join(distDir, "index.html");
    if (!fs.existsSync(indexHtmlPath)) return;

    // ── Collect routes to pre-render ──────────────────────────────────
    const routes: string[] = ["/"];

    // Add layout routes that have `prerender` set
    try {
      const data = fs.existsSync(dataFilePath)
        ? JSON.parse(fs.readFileSync(dataFilePath, "utf8"))
        : null;
      const layoutName: string = data?.theme?.layout || "default";
      const manifestPath = path.resolve(__dirname, "src", "themes", layoutName, "manifest.ts");
      if (fs.existsSync(manifestPath)) {
        const esbuild = createRequire(import.meta.url)("esbuild");
        const source = fs.readFileSync(manifestPath, "utf8");
        const result = esbuild.transformSync(source, {
          loader: "ts",
          format: "cjs",
          target: "node18",
        });
        const code = result.code
          .replace(/require\([^)]+\)/g, "undefined")
          .replace(/exports\.default\s*=/, "module.exports =");
        const m = { exports: {} as any };
        new Function("module", "exports", "require", code)(m, m.exports, () => undefined);
        const manifest = m.exports?.default ?? m.exports;
        for (const r of manifest?.routes ?? []) {
          if (r?.prerender && !r.path.includes(":")) routes.push(r.path);
        }
      }
    } catch {
      // If manifest loading fails, just pre-render "/"
    }

    // Add user-configured extra routes
    if (pkConfig.build?.prerenderRoutes?.length) {
      for (const r of pkConfig.build.prerenderRoutes) {
        if (!routes.includes(r)) routes.push(r);
      }
    }

    // ── Start a static file server from dist/ ─────────────────────────
    const { createServer } = await import("node:http");
    const serveFile = (filePath: string, res: import("node:http").ServerResponse) => {
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end();
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".avif": "image/avif",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
      };
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    };

    const server = createServer((req, res) => {
      const url = new URL(req.url || "/", "http://localhost");
      let filePath = path.join(distDir, url.pathname);
      // Serve index.html for directories (SPA fallback)
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      if (!fs.existsSync(filePath)) {
        // SPA fallback: serve root index.html
        filePath = indexHtmlPath;
      }
      serveFile(filePath, res);
    });

    const port = await new Promise<number>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        resolve(typeof addr === "object" && addr ? addr.port : 0);
      });
    });

    if (!port) {
      console.log("[prerender] Could not start static server — skipping.");
      server.close();
      return;
    }

    // ── Launch Puppeteer and render each route ────────────────────────
    let puppeteer: any;
    try {
      puppeteer = await import("puppeteer");
    } catch {
      console.log("[prerender] Puppeteer not available — skipping pre-rendering.");
      server.close();
      return;
    }

    let browser: any;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const siteUrl = resolveSiteUrl();
      let count = 0;

      for (const route of routes) {
        try {
          const page = await browser.newPage();
          const pageUrl = `http://127.0.0.1:${port}${route}`;
          await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });

          // Wait for the Vue app to signal it has finished rendering
          await page.evaluate(() => {
            return new Promise<void>((resolve) => {
              if ((document as any).__APP_RENDERED__) {
                resolve();
                return;
              }
              document.addEventListener("app-rendered", () => resolve(), { once: true });
              // Safety timeout so build never hangs
              setTimeout(resolve, 5000);
            });
          });

          // Small extra delay for any async component rendering
          await new Promise((r) => setTimeout(r, 200));

          let html = await page.content();

          // Replace localhost URLs with the real site URL
          html = html.replace(
            new RegExp(`http://127\\\\.0\\\\.0\\\\.1:${port}`, "g"),
            siteUrl || "",
          );

          // Write to dist/{route}/index.html
          const segments = route === "/" ? "" : route.replace(/^\//, "").replace(/\/$/, "");
          const outDir = segments ? path.join(distDir, segments) : distDir;
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(path.join(outDir, "index.html"), html);
          count++;

          await page.close();
        } catch (err: any) {
          console.log(`[prerender] Failed to render ${route}: ${err?.message || err}`);
        }
      }

      if (count > 0) {
        console.log(`[prerender] Pre-rendered ${count} page(s)`);
      }
    } catch (err: any) {
      console.log(`[prerender] Puppeteer error: ${err?.message || err}`);
    } finally {
      if (browser) await browser.close();
      server.close();
    }
  },
});

    /** Read a single env var: checks process.env first, then falls back to .env file. */
    const readEnvVar = (name: string): string => {
      // 1. Check process.env (Vercel, CI/CD, etc.)
      if (process.env[name]) {
        return process.env[name]!.replace(/^["']|["']$/g, "").trim();
      }
      // 2. Fall back to local .env file
      const envPath = path.resolve(__dirname, ".env");
      if (!fs.existsSync(envPath)) return "";
      const match = fs.readFileSync(envPath, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
      if (!match) return "";
      return match[1].replace(/^["']|["']$/g, "").trim();
    };

    export default defineConfig(({ command }) => {
      ensureSeedData();

      // ── User deps: resolve bare imports from content repo's node_modules ──
      const userDepsMarker = path.resolve(__dirname, ".user-deps.json");
      let userNodeModules: string | null = null;
      if (fs.existsSync(userDepsMarker)) {
        try {
          const marker = JSON.parse(fs.readFileSync(userDepsMarker, "utf8"));
          if (marker.nodeModulesPath && fs.existsSync(marker.nodeModulesPath)) {
            userNodeModules = marker.nodeModulesPath;
          }
        } catch { /* ignore corrupt marker */ }
      }

      const userDepsPlugin = () => ({
        name: "user-deps",
        enforce: "pre" as const,
        resolveId(source: string) {
          if (!userNodeModules) return null;
          // Only handle bare imports (not relative/absolute paths)
          if (source.startsWith(".") || source.startsWith("/")) return null;
          // Skip virtual modules and built-in Vite ids
          if (source.startsWith("\0") || source.startsWith("virtual:")) return null;
          const pkgName = source.startsWith("@")
            ? source.split("/").slice(0, 2).join("/")
            : source.split("/")[0];
          const pkgDir = path.join(userNodeModules!, pkgName);
          if (fs.existsSync(pkgDir)) {
            // Let Vite re-resolve with the user node_modules prepended
            const requireCJS = createRequire(import.meta.url);
            try {
              return requireCJS.resolve(source, { paths: [userNodeModules!] });
            } catch { return null; }
          }
          return null;
        },
      });

    // ── User plugins: load from content repo's vite.plugins.js ──
    const userPluginsPath = path.resolve(__dirname, "vite.user.plugins.js");
    let userPlugins: any[] = [];
    if (fs.existsSync(userPluginsPath)) {
      try {
        const requireCJS2 = createRequire(import.meta.url);
        const plugins = requireCJS2(userPluginsPath);
        const resolved = plugins?.default ?? plugins;
        userPlugins = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [];
        console.log(`[user-plugins] Loaded ${userPlugins.length} user plugin(s)`);
      } catch (err: any) {
        console.warn(`[user-plugins] Failed to load vite.user.plugins.js: ${err?.message}`);
      }
    }

      const coreConfig: Record<string, any> = {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'src'),
          },
        },
        server: {
          host: pkConfig.server?.host || "::",
          port: pkConfig.server?.port || 8080,
          fs: {
            allow: [
              __dirname,
              ...(userNodeModules ? [userNodeModules] : []),
            ],
          },
        },
        plugins: [
          userDepsPlugin(),
          ...userPlugins,
          cmsMiddlewarePlugin(),
          contentValidationPlugin(),
          collectionBuildPlugin(),
          scheduleBuildPlugin(),
          prerenderBuildPlugin(),
          manifestBuildPlugin(),
          ogMetaPlugin(),
          vue({
            template: {
              compilerOptions: {
                isCustomElement: (tag: string) => tag.startsWith("media-"),
              },
            },
          }),
        ],
        define: {
          "import.meta.env.VITE_GITHUB_OWNER": JSON.stringify(readEnvVar("GITHUB_OWNER")),
          "import.meta.env.VITE_GITHUB_REPO": JSON.stringify(readEnvVar("GITHUB_REPO")),
          "import.meta.env.VITE_GITHUB_BRANCH": JSON.stringify(readEnvVar("GITHUB_BRANCH")),
          "import.meta.env.VITE_SCHEDULE_EXCLUDE_BUILD": JSON.stringify(readEnvVar("VITE_SCHEDULE_EXCLUDE_BUILD")),
          "__PK_EXTERNAL_COLLECTIONS__": JSON.stringify([
            ...(pkConfig.externalCollections ?? ["blog", "newsletter"]),
            ...collectionDefs.map((d) => d.key),
          ]),
          "__PK_CONTENT_COLLECTIONS__": JSON.stringify(collectionDefs),
          "__PK_CMS_DATA_ENDPOINT__": JSON.stringify(CMS_ENDPOINTS.data),
          "__PK_CMS_PUSH_ENDPOINT__": JSON.stringify(CMS_ENDPOINTS.push),
          "__PK_CMS_UPLOAD_ENDPOINT__": JSON.stringify(CMS_ENDPOINTS.upload),
          "__ENCRYPTED_GITHUB_TOKEN__": (() => {
            const token = readEnvVar("GITHUB_TOKEN");
            const secret = readEnvVar("CMS_PASSWORD");
            if (token && secret) {
              const blob = encryptTokenAtBuild(token, secret);
              console.log("[token-encrypt] GitHub token encrypted.");
              return JSON.stringify(blob);
            }
            return JSON.stringify("");
          })(),
        },
      };

      // ── Merge user Vite config layers ──────────────────────────────
      // 1. pkConfig.vite — inline overrides from platformkit.config.ts
      // 2. userViteConfig — full config from vite.user.config.js (staged by CLI)
      // Both are deep-merged; plugins are appended, objects merge, scalars user-wins.
      const merged = deepMergeConfig(
        deepMergeConfig(coreConfig, pkConfig.vite || {}),
        userViteConfig,
      );
      return merged;
    });