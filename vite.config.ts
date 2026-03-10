import { spawn, spawnSync } from "node:child_process";
import nodeCrypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

import { sanitizeModel, stableStringify } from "./src/lib/model";
import {
  parseFrontmatter,
  metaFromRaw,
  slugFromFilename,
  renderMarkdown,
  hljs,
} from "./src/lib/blog";
import type { PlatformKitConfig, RssFeedConfig } from "./src/lib/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load platformkit.config.js/.ts (optional) ───────────────────────
const loadPlatformKitConfig = async (): Promise<PlatformKitConfig> => {
  const names = ["platformkit.config.ts", "platformkit.config.js", "platformkit.config.mjs"];
  for (const name of names) {
    const configPath = path.resolve(__dirname, name);
    if (!fs.existsSync(configPath)) continue;

    if (name.endsWith(".ts")) {
      // Transpile .ts → temp .mjs via esbuild (already a Vite dependency)
      try {
        const { transformSync } = await import("esbuild");
        const code = fs.readFileSync(configPath, "utf-8");
        const result = transformSync(code, { loader: "ts", format: "esm", target: "node18" });
        const tmpPath = configPath + ".__tmp.mjs";
        fs.writeFileSync(tmpPath, result.code);
        try {
          const mod = await import(`${tmpPath}?t=${Date.now()}`);
          return mod.default ?? mod;
        } finally {
          try { fs.unlinkSync(tmpPath); } catch {}
        }
      } catch (err: any) {
        console.warn(`[platformkit] Failed to load ${name}: ${err?.message}`);
      }
    } else {
      try {
        const mod = await import(`${configPath}?t=${Date.now()}`);
        return mod.default ?? mod;
      } catch (err: any) {
        console.warn(`[platformkit] Failed to load ${name}: ${err?.message}`);
      }
    }
  }
  return {};
};

const pkConfig: PlatformKitConfig = await loadPlatformKitConfig();

// ── Register extra highlight.js languages from config ────────────────
if (pkConfig.blog?.highlightLanguages?.length) {
  const requireCJS = createRequire(import.meta.url);
  for (const lang of pkConfig.blog.highlightLanguages) {
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
const publicDataFilePath = path.resolve(__dirname, "public/data.json");
const blogContentDir = path.resolve(__dirname, pkConfig.paths?.blogContent || "content/blog");

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

  const raw = fs.readFileSync(defaultDataFilePath, "utf8");
  return sanitizeModel(JSON.parse(raw));
};

const ensureSeedData = () => {
  const seed = readDefaultModel();
  const payload = stableStringify(seed);

  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, payload);
  }

  if (!fs.existsSync(publicDataFilePath)) {
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
  blogList: pkConfig.cms?.blogListEndpoint || "/__blog-posts",
  blogPost: pkConfig.cms?.blogPostEndpoint || "/__blog-post",
};

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

        const uploadsDir = path.resolve(__dirname, "public/uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const requireCJS = createRequire(import.meta.url);
        const createBusboy = requireCJS("busboy");
        const bb = createBusboy({ headers: req.headers });
        let returnedUrl = "";

        bb.on("file", (_fieldname: string, fileStream: NodeJS.ReadableStream, filename: any) => {
          // debug: inspect incoming filename argument and fileStream properties
          // incoming filename argument may already be an object produced by busboy
          // containing { filename, encoding, mimeType }
          let orig = filename;
          let mimeType = "";
          if (orig && typeof orig === "object" && typeof orig.filename === "string") {
            orig = orig.filename;
            mimeType = orig.mimeType || "";
          }

          if (!orig || typeof orig !== "string") {
            const f = fileStream as any;
            if (f && typeof f.name === "string") orig = f.name;
            else if (f && typeof f.filename === "string") orig = f.filename;
            else if (f && typeof f.path === "string") orig = path.basename(f.path as string);
            else orig = String(filename || "image.png");
          }

          // If the filename already looks like a deterministic target (e.g.
          // "avatar.jpg", "voice.mp3", "voice.wav") use it directly so re-uploads
          // overwrite the previous file instead of accumulating copies.
          const isDeterministic = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp|mp3|wav|webm|m4a)$/i.test(orig);
          const isAudio = mimeType.startsWith("audio/");
          const baseName = isDeterministic ? orig.replace(/\.[^.]+$/, "") : generateUploadFileName(orig).replace(/\.[^.]+$/, "");
          const ext = isAudio ? ".mp3" : (orig.includes(".") ? orig.slice(orig.lastIndexOf(".")) : ".bin");
          const safe = baseName + ext;
          const outPath = path.join(uploadsDir, safe);
          const write = fs.createWriteStream(outPath);
          fileStream.pipe(write);
          returnedUrl = `/uploads/${safe}`;

          // For audio files, convert to MP3 using ffmpeg
          if (isAudio) {
            write.on("finish", () => {
              const mp3Path = outPath; // Already .mp3
              // If input was not mp3, convert
              if (!orig.toLowerCase().endsWith(".mp3")) {
                const tempPath = outPath + ".temp";
                fs.renameSync(outPath, tempPath);
                try {
                  const { spawnSync } = require("child_process");
                  const result = spawnSync("ffmpeg", ["-y", "-i", tempPath, "-b:a", "128k", "-ac", "1", outPath], {
                    stdio: "inherit"
                  });
                  if (result.status === 0) {
                    fs.unlinkSync(tempPath);
                  } else {
                    // Conversion failed, keep original
                    fs.renameSync(tempPath, outPath);
                  }
                } catch (err) {
                  // ffmpeg not available, keep original
                  fs.renameSync(tempPath, outPath);
                }
              }
            });
          }
        });

        bb.on("finish", () => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ url: returnedUrl }));
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
          fs.writeFileSync(dataFilePath, stableStringify(parsed));
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

        // Sync cms-data.json → public/data.json before pushing
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

      // ── Blog post endpoints ────────────────────────────────────────
      if (url === CMS_ENDPOINTS.blogList && req.method === "GET") {
        // List all blog posts metadata
        if (!fs.existsSync(blogContentDir)) {
          fs.mkdirSync(blogContentDir, { recursive: true });
        }
        const files = fs.readdirSync(blogContentDir).filter((f: string) => f.endsWith(".md"));
        const posts = files.map((file: string) => {
          const raw = fs.readFileSync(path.join(blogContentDir, file), "utf8");
          const { meta } = parseFrontmatter(raw);
          const slug = slugFromFilename(file);
          return metaFromRaw(meta, slug);
        });
        // Sort newest first
        posts.sort((a: any, b: any) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(posts));
        return;
      }

      if (url === CMS_ENDPOINTS.blogPost) {
        const fullUrl = new URL(req.url ?? "", "http://localhost");
        const slug = fullUrl.searchParams.get("slug") ?? "";

        if (req.method === "GET") {
          if (!slug) {
            res.statusCode = 400;
            res.end("Missing slug parameter");
            return;
          }
          const filePath = path.join(blogContentDir, `${slug}.md`);
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end("Not found");
            return;
          }
          const raw = fs.readFileSync(filePath, "utf8");
          const { meta, body } = parseFrontmatter(raw);
          const postMeta = metaFromRaw(meta, slug);
          const html = renderMarkdown(body);
          // Include audioUrl if TTS audio exists for this post
          const devAudioDir = path.resolve(__dirname, "public", "blog", "audio");
          const devAudioMp3 = path.join(devAudioDir, `${slug}.mp3`);
          const devAudioWav = path.join(devAudioDir, `${slug}.wav`);
          const devAudioUrl = fs.existsSync(devAudioMp3)
            ? `/blog/audio/${slug}.mp3`
            : fs.existsSync(devAudioWav)
            ? `/blog/audio/${slug}.wav`
            : undefined;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ...postMeta, content: body, html, ...(devAudioUrl ? { audioUrl: devAudioUrl } : {}) }));
          return;
        }

        if (req.method === "POST") {
          const body = await collectRequestBody(req);
          const { slug: postSlug, markdown } = JSON.parse(body);
          if (!postSlug || !markdown) {
            res.statusCode = 400;
            res.end("Missing slug or markdown");
            return;
          }
          if (!fs.existsSync(blogContentDir)) {
            fs.mkdirSync(blogContentDir, { recursive: true });
          }
          const safeName = postSlug.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
          const filePath = path.join(blogContentDir, `${safeName}.md`);
          fs.writeFileSync(filePath, markdown);
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === "DELETE") {
          if (!slug) {
            res.statusCode = 400;
            res.end("Missing slug parameter");
            return;
          }
          const filePath = path.join(blogContentDir, `${slug}.md`);
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
      if (url === "/rss.xml" && req.method === "GET") {
        if (!fs.existsSync(blogContentDir)) {
          fs.setHeader?.("Content-Type", "application/rss+xml");
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/rss+xml");
          res.end(buildRssFeed([], readDefaultModel()));
          return;
        }
        const files = fs.readdirSync(blogContentDir).filter((f: string) => f.endsWith(".md"));
        const posts: any[] = [];
        for (const file of files) {
          const raw = fs.readFileSync(path.join(blogContentDir, file), "utf8");
          const { meta, body } = parseFrontmatter(raw);
          const slug = slugFromFilename(file);
          const postMeta = metaFromRaw(meta, slug);
          if (!postMeta.published) continue;
          const html = renderMarkdown(body);
          posts.push({ ...postMeta, html });
        }
        posts.sort((a: any, b: any) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        const siteModel = fs.existsSync(dataFilePath)
          ? JSON.parse(fs.readFileSync(dataFilePath, "utf8"))
          : readDefaultModel();
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/rss+xml");
        res.end(buildRssFeed(posts, siteModel));
        return;
      }

      // not a CMS request — continue to other middleware
      next();
    });
  },
});

/** Escape XML special characters */
const escapeXml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** Build an RSS XML string from published blog posts and site metadata. */
const buildRssFeed = (
  posts: { slug: string; title: string; date: string; excerpt: string; html: string; audio?: string; audioUrl?: string }[],
  siteModel: any,
  feedCfg?: RssFeedConfig,
): string => {
  const siteTitle = escapeXml(
    feedCfg?.title || pkConfig.site?.name || siteModel?.profile?.displayName || "Blog",
  );
  const siteDesc = escapeXml(
    feedCfg?.description || pkConfig.site?.tagline || siteModel?.profile?.tagline || "",
  );
  const lang = feedCfg?.language || pkConfig.site?.language || "en";
  const outputPath = feedCfg?.output || "rss.xml";
  // Use VITE_SITE_URL env var, or fall back to localhost
  const siteUrl = (pkConfig.site?.url || process.env.VITE_SITE_URL || "http://localhost:8080").replace(/\/$/, "");

  const items = posts.map((p) => {
    const pubDate = new Date(p.date).toUTCString();
    const linkTemplate = feedCfg?.linkFormat || pkConfig.rss?.linkFormat || "{siteUrl}/#blog/{slug}";
    const link = linkTemplate
      .replace("{siteUrl}", siteUrl)
      .replace("{slug}", encodeURIComponent(p.slug));
    const audioUrl = p.audio || p.audioUrl;
    const enclosure = audioUrl ? `\n      <enclosure url="${escapeXml(siteUrl + audioUrl)}" type="audio/mpeg" length="0" />` : '';
    return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(p.slug)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.excerpt || "")}</description>
      <content:encoded><![CDATA[${p.html}]]></content:encoded>${enclosure}
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${siteDesc}</description>
    <language>${lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/${escapeXml(outputPath)}" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>`;
};

/** Build plugin: generate static blog JSON files into public/blog/ at build time. */
const blogBuildPlugin = () => ({
  name: "blog-build",
  buildStart() {
    if (!fs.existsSync(blogContentDir)) return;
    const files = fs.readdirSync(blogContentDir).filter((f: string) => f.endsWith(".md"));
    if (files.length === 0) return;

    const publicBlogDir = path.resolve(__dirname, "public", pkConfig.paths?.blogOutput || "blog");
    if (!fs.existsSync(publicBlogDir)) {
      fs.mkdirSync(publicBlogDir, { recursive: true });
    }

    const index: any[] = [];

    for (const file of files) {
      const raw = fs.readFileSync(path.join(blogContentDir, file), "utf8");
      const { meta, body } = parseFrontmatter(raw);
      const slug = slugFromFilename(file);
      const postMeta = metaFromRaw(meta, slug);
      const html = renderMarkdown(body);

      const post = { ...postMeta, content: body, html };
      fs.writeFileSync(path.join(publicBlogDir, `${slug}.json`), JSON.stringify(post, null, 2));

      if (postMeta.published) {
        // When scheduleExclude is set (via config or env), exclude posts outside their schedule window
        const excludeBySchedule = pkConfig.build?.scheduleExclude || !!readEnvVar("VITE_SCHEDULE_EXCLUDE_BUILD");
        if (excludeBySchedule && !isScheduleVisibleNow(postMeta)) continue;
        index.push(postMeta);
      }
    }

    index.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    fs.writeFileSync(path.join(publicBlogDir, "index.json"), JSON.stringify(index, null, 2));

    // Generate RSS feed(s)
    if (pkConfig.rss?.enabled !== false) {
      const siteModel = fs.existsSync(dataFilePath)
        ? JSON.parse(fs.readFileSync(dataFilePath, "utf8"))
        : readDefaultModel();

      // Hydrate each index entry with its full HTML for RSS <content:encoded>
      const hydrateForRss = (meta: any) => {
        const postFile = path.join(publicBlogDir, `${meta.slug}.json`);
        if (fs.existsSync(postFile)) {
          const full = JSON.parse(fs.readFileSync(postFile, "utf8"));
          return { ...meta, html: full.html || "", audio: full.audio, audioUrl: full.audioUrl };
        }
        return { ...meta, html: "", audio: meta.audio, audioUrl: meta.audioUrl };
      };

      // Posts eligible for RSS: published + not excluded by `rss: false` frontmatter
      const rssEligible = index.filter((m: any) => m.rss !== false);

      // Determine feeds — use config feeds or a single default feed
      const feedConfigs: RssFeedConfig[] =
        pkConfig.rss?.feeds && pkConfig.rss.feeds.length > 0
          ? pkConfig.rss.feeds
          : [{ output: "rss.xml" }];

      for (const feedCfg of feedConfigs) {
        let feedPosts = rssEligible;

        // Apply path regex filter
        if (feedCfg.pathFilter) {
          const pathRe = new RegExp(feedCfg.pathFilter);
          feedPosts = feedPosts.filter((m: any) => pathRe.test(m.slug));
        }

        // Apply content regex filter (match against raw markdown body)
        if (feedCfg.contentFilter) {
          const contentRe = new RegExp(feedCfg.contentFilter);
          feedPosts = feedPosts.filter((m: any) => {
            const postFile = path.join(blogContentDir, `${m.slug}.md`);
            if (!fs.existsSync(postFile)) return false;
            const raw = fs.readFileSync(postFile, "utf8");
            return contentRe.test(raw);
          });
        }

        // Apply tag filter
        if (feedCfg.tags && feedCfg.tags.length > 0) {
          const tagSet = new Set(feedCfg.tags.map((t: string) => t.toLowerCase()));
          feedPosts = feedPosts.filter((m: any) =>
            Array.isArray(m.tags) && m.tags.some((t: string) => tagSet.has(t.toLowerCase())),
          );
        }

        const rssPosts = feedPosts.map(hydrateForRss);
        const rssXml = buildRssFeed(rssPosts, siteModel, feedCfg);
        const outputFile = feedCfg.output || "rss.xml";
        const outputPath = path.resolve(__dirname, "public", outputFile);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(outputPath, rssXml);
        console.log(`[blog-build] Generated RSS feed ${outputFile} (${rssPosts.length} item(s))`);
      }
    }

    console.log(`[blog-build] Generated ${files.length} blog post(s) into public/blog/`);
  },
  /** After the full build, generate pre-rendered HTML for each blog post so
   *  crawlers (iMessage, Twitter, etc.) get post-specific OG meta tags. */
  closeBundle() {
    const distDir = path.resolve(__dirname, "dist");
    const indexHtmlPath = path.join(distDir, "index.html");
    if (!fs.existsSync(indexHtmlPath)) return;

    const blogIndexPath = path.join(distDir, "blog", "index.json");
    if (!fs.existsSync(blogIndexPath)) return;

    const siteModel = fs.existsSync(dataFilePath)
      ? sanitizeModel(JSON.parse(fs.readFileSync(dataFilePath, "utf8")))
      : readDefaultModel();
    const siteUrl = resolveSiteUrl();

    const toAbsolute = (url: string) => {
      if (!url) return "";
      if (/^https?:\/\//.test(url)) return url;
      return siteUrl ? `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}` : url;
    };

    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const baseHtml = fs.readFileSync(indexHtmlPath, "utf8");
    const posts: any[] = JSON.parse(fs.readFileSync(blogIndexPath, "utf8"));
    let count = 0;

    for (const post of posts) {
      const postJsonPath = path.join(distDir, "blog", `${post.slug}.json`);
      if (!fs.existsSync(postJsonPath)) continue;

      const full = JSON.parse(fs.readFileSync(postJsonPath, "utf8"));
      const title = full.title || post.title || "Blog Post";
      const excerpt = full.excerpt || "";
      const coverImage = full.coverImage || siteModel?.profile?.ogImageUrl || "";
      const postUrl = siteUrl ? `${siteUrl}/content/${encodeURIComponent(post.slug)}` : "";

      // Build post-specific OG tags
      const ogTags: string[] = [];
      ogTags.push(`<meta property="og:title" content="${esc(title)}" />`);
      if (excerpt) {
        ogTags.push(`<meta property="og:description" content="${esc(excerpt)}" />`);
      }
      if (coverImage) {
        ogTags.push(`<meta property="og:image" content="${esc(toAbsolute(coverImage))}" />`);
        ogTags.push(`<meta name="twitter:card" content="summary_large_image" />`);
      }
      ogTags.push(`<meta property="og:type" content="article" />`);
      if (postUrl) {
        ogTags.push(`<meta property="og:url" content="${esc(postUrl)}" />`);
      }

      // Start from base HTML, replace the site-level OG tags with post-specific ones
      let postHtml = baseHtml;

      // Remove existing OG/twitter meta tags injected by ogMetaPlugin
      postHtml = postHtml.replace(/<meta\s+(?:property="og:|name="twitter:)[^>]*\/>\s*\n?\s*/g, "");

      // Update <title>
      postHtml = postHtml.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);

      // Update description
      postHtml = postHtml.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${esc(excerpt)}" />`,
      );

      // Inject post OG tags before </head>
      postHtml = postHtml.replace("</head>", `    ${ogTags.join("\n    ")}\n  </head>`);

      // Write to dist/content/{slug}/index.html
      const outDir = path.join(distDir, "content", post.slug);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), postHtml);
      count++;
    }

    if (count > 0) {
      console.log(`[blog-build] Pre-rendered ${count} blog post HTML file(s) into dist/content/`);
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
          blogBuildPlugin(),
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
          "__PK_EXTERNAL_COLLECTIONS__": JSON.stringify(pkConfig.externalCollections ?? ["blog", "newsletter"]),
          "__PK_CMS_DATA_ENDPOINT__": JSON.stringify(CMS_ENDPOINTS.data),
          "__PK_CMS_PUSH_ENDPOINT__": JSON.stringify(CMS_ENDPOINTS.push),
          "__PK_CMS_UPLOAD_ENDPOINT__": JSON.stringify(CMS_ENDPOINTS.upload),
          "__PK_CMS_BLOG_LIST_ENDPOINT__": JSON.stringify(CMS_ENDPOINTS.blogList),
          "__PK_CMS_BLOG_POST_ENDPOINT__": JSON.stringify(CMS_ENDPOINTS.blogPost),
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