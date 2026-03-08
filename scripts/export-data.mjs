import { existsSync, readdirSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const cmsDataPath = path.join(rootDir, "cms-data.json");
const defaultDataPath = path.join(rootDir, "default-data.json");
const publicDataPath = path.join(rootDir, "public/data.json");
const blogContentDir = path.join(rootDir, "content/blog");
const publicBlogDir = path.join(rootDir, "public/blog");

const ensureCmsData = async () => {
  if (existsSync(cmsDataPath)) {
    return;
  }

  if (existsSync(defaultDataPath)) {
    const seed = await readFile(defaultDataPath, "utf8");
    await writeFile(cmsDataPath, seed);
    return;
  }

  const fallback = JSON.stringify(
    {
      profile: { displayName: "", tagline: "" },
      links: [],
      socials: [],
    },
    null,
    2
  );

  await writeFile(cmsDataPath, fallback);
};

const run = async () => {
  await ensureCmsData();

  const source = await readFile(cmsDataPath, "utf8");
  const parsed = JSON.parse(source);
  const formatted = JSON.stringify(parsed, null, 2);

  await writeFile(cmsDataPath, formatted);
  await writeFile(publicDataPath, formatted);

  console.log("Exported CMS data to public/data.json");

  // ── Generate blog JSON files for production ──────────────────────
  if (existsSync(blogContentDir)) {
    const mdFiles = readdirSync(blogContentDir).filter((f) => f.endsWith(".md"));

    if (mdFiles.length > 0) {
      await mkdir(publicBlogDir, { recursive: true });

      // Simple frontmatter parser (mirrors src/lib/blog.ts)
      const parseFrontmatter = (raw) => {
        const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
        if (!match) return { meta: {}, body: raw };
        const yaml = match[1];
        const body = match[2];
        const meta = {};
        for (const line of yaml.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const colonIdx = trimmed.indexOf(":");
          if (colonIdx === -1) continue;
          const key = trimmed.slice(0, colonIdx).trim();
          let val = trimmed.slice(colonIdx + 1).trim();
          if (val === "true") val = true;
          else if (val === "false") val = false;
          else if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
            val = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
          } else if (typeof val === "string" && ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))) {
            val = val.slice(1, -1);
          }
          meta[key] = val;
        }
        return { meta, body };
      };

      const asString = (v) => (typeof v === "string" ? v : "");
      const { marked } = await import("marked");

      const index = [];

      for (const file of mdFiles) {
        const raw = await readFile(path.join(blogContentDir, file), "utf8");
        const { meta, body } = parseFrontmatter(raw);
        const slug = file.replace(/\.md$/i, "");

        const postMeta = {
          slug: asString(meta.slug) || slug,
          title: asString(meta.title) || "Untitled",
          date: asString(meta.date) || new Date().toISOString().slice(0, 10),
          excerpt: asString(meta.excerpt),
          coverImage: asString(meta.coverImage),
          published: meta.published !== false,
          tags: Array.isArray(meta.tags) ? meta.tags.map(String).filter(Boolean) : [],
        };

        const html = marked.parse(body, { async: false });

        // Write individual post JSON
        const postJson = JSON.stringify({ ...postMeta, content: body, html }, null, 2);
        await writeFile(path.join(publicBlogDir, `${slug}.json`), postJson);

        if (postMeta.published) {
          index.push(postMeta);
        }
      }

      // Sort newest first
      index.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
      await writeFile(path.join(publicBlogDir, "index.json"), JSON.stringify(index, null, 2));

      console.log(`Exported ${mdFiles.length} blog post(s) to public/blog/`);
    }
  }
};

await run();