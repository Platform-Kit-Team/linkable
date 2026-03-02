import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import { sanitizeModel, stableStringify } from "./src/lib/model";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.resolve(__dirname, "cms-data.json");
const defaultDataFilePath = path.resolve(__dirname, "default-data.json");
const publicDataFilePath = path.resolve(__dirname, "public/data.json");

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

      // not a CMS request — continue to other middleware
      next();
    });
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