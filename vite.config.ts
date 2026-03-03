import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import { sanitizeModel, stableStringify } from "./src/lib/model";
import {
  parseFrontmatter,
  metaFromRaw,
  slugFromFilename,
  renderMarkdown,
} from "./src/lib/blog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.resolve(__dirname, "cms-data.json");
const defaultDataFilePath = path.resolve(__dirname, "default-data.json");
const publicDataFilePath = path.resolve(__dirname, "public/data.json");
const blogContentDir = path.resolve(__dirname, "content/blog");

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
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 15);
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
const cmsMiddlewarePlugin = () => ({
  name: "cms-middleware",
  configureServer: (server: any) => {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = (req.url ?? "").split("?")[0];

      if (url === "/cms-upload") {
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
          if (orig && typeof orig === "object" && typeof orig.filename === "string") {
            orig = orig.filename;
          }

          if (!orig || typeof orig !== "string") {
            const f = fileStream as any;
            if (f && typeof f.name === "string") orig = f.name;
            else if (f && typeof f.filename === "string") orig = f.filename;
            else if (f && typeof f.path === "string") orig = path.basename(f.path as string);
            else orig = String(filename || "image.png");
          }

          // If the filename already looks like a deterministic target (e.g.
          // "avatar.jpg", "<uuid>.jpg") use it directly so re-uploads
          // overwrite the previous file instead of accumulating copies.
          const isDeterministic = /^[a-zA-Z0-9_-]+\.jpg$/i.test(orig);
          const safe = isDeterministic ? orig : generateUploadFileName(orig);
          const outPath = path.join(uploadsDir, safe);
          const write = fs.createWriteStream(outPath);
          fileStream.pipe(write);
          returnedUrl = `/uploads/${safe}`;
        });

        bb.on("finish", () => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ url: returnedUrl }));
        });

        req.pipe(bb);
        return;
      }

      if (url === "/__cms-data") {
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

      if (url === "/__cms-push" && req.method === "POST") {
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
      if (url === "/__blog-posts" && req.method === "GET") {
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

      if (url === "/__blog-post") {
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
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ...postMeta, content: body, html }));
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
const buildRssFeed = (posts: { slug: string; title: string; date: string; excerpt: string; html: string }[], siteModel: any): string => {
  const siteTitle = escapeXml(siteModel?.profile?.displayName || "Blog");
  const siteDesc = escapeXml(siteModel?.profile?.tagline || "");
  // Use VITE_SITE_URL env var, or fall back to localhost
  const siteUrl = (process.env.VITE_SITE_URL || "http://localhost:8080").replace(/\/$/, "");

  const items = posts.map((p) => {
    const pubDate = new Date(p.date).toUTCString();
    const link = `${siteUrl}/#blog/${encodeURIComponent(p.slug)}`;
    return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(p.slug)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.excerpt || "")}</description>
      <content:encoded><![CDATA[${p.html}]]></content:encoded>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${siteDesc}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml" />
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

    const publicBlogDir = path.resolve(__dirname, "public/blog");
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
        index.push(postMeta);
      }
    }

    index.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    fs.writeFileSync(path.join(publicBlogDir, "index.json"), JSON.stringify(index, null, 2));

    // Generate RSS feed
    const siteModel = fs.existsSync(dataFilePath)
      ? JSON.parse(fs.readFileSync(dataFilePath, "utf8"))
      : readDefaultModel();
    const rssPosts = index.map((meta: any) => {
      const postFile = path.join(publicBlogDir, `${meta.slug}.json`);
      if (fs.existsSync(postFile)) {
        const full = JSON.parse(fs.readFileSync(postFile, "utf8"));
        return { ...meta, html: full.html || "" };
      }
      return { ...meta, html: "" };
    });
    const rssXml = buildRssFeed(rssPosts, siteModel);
    fs.writeFileSync(path.resolve(__dirname, "public/rss.xml"), rssXml);
    console.log(`[blog-build] Generated RSS feed (${index.length} item(s))`);

    console.log(`[blog-build] Generated ${files.length} blog post(s) into public/blog/`);
  },
});

    export default defineConfig(() => {
      ensureSeedData();

      return {
        server: {
          host: "::",
          port: 8080,
        },
        plugins: [
          cmsMiddlewarePlugin(),
          blogBuildPlugin(),
          vue({
            template: {
              compilerOptions: {
                isCustomElement: (tag: string) => tag.startsWith("media-"),
              },
            },
          }),
        ],
        define: {
          "import.meta.env.VITE_GITHUB_OWNER": JSON.stringify(process.env.GITHUB_OWNER || ""),
          "import.meta.env.VITE_GITHUB_REPO": JSON.stringify(process.env.GITHUB_REPO || ""),
          "import.meta.env.VITE_GITHUB_BRANCH": JSON.stringify(process.env.GITHUB_BRANCH || ""),
        },
      };
    });