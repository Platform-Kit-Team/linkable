/**
 * Blog utilities — types, frontmatter parsing, and fetch helpers.
 *
 * Blog posts live as `.md` files in `/content/blog/` with YAML-like
 * frontmatter. This module provides browser-friendly helpers for
 * listing and reading posts.
 */

import { marked } from "marked";
import hljs from "highlight.js/lib/core";

// Register only common languages to keep the bundle small
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import mdLang from "highlight.js/lib/languages/markdown";
import yaml from "highlight.js/lib/languages/yaml";
import sql from "highlight.js/lib/languages/sql";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import java from "highlight.js/lib/languages/java";
import csharp from "highlight.js/lib/languages/csharp";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import swift from "highlight.js/lib/languages/swift";
import plaintext from "highlight.js/lib/languages/plaintext";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", mdLang);
hljs.registerLanguage("md", mdLang);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("java", java);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("cs", csharp);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("rb", ruby);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("text", plaintext);

/**
 * The shared highlight.js instance. Exported so build-time code
 * (vite.config.ts) can register additional languages from the config
 * without duplicating the core set.
 */
export { hljs };

/**
 * Highlight a code string with hljs and return safe HTML.
 * Falls back to escaped plaintext for unknown languages.
 */
function highlightCode(code: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang }).value;
  }
  return hljs.highlight(code, { language: "plaintext" }).value;
}

/**
 * Escape HTML entities in a string (for code without highlighting).
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Configure marked with a custom code renderer that uses hljs directly.
// This avoids the fragile `escaped` flag handoff in marked-highlight
// which can cause double-escaping of <span> tags across marked versions.
marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string; escaped?: boolean }) {
      const language = (lang || "").match(/^\S*/)?.[0] || "";
      const highlighted = language
        ? highlightCode(text, language)
        : escapeHtml(text);
      const cls = language ? `hljs language-${language}` : "hljs";
      return `<pre><code class="${cls}">${highlighted}\n</code></pre>`;
    },
  },
});

// ── types ────────────────────────────────────────────────────────────

export type BlogPostMeta = {
  id: string; // stable UUID — survives slug renames
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  published: boolean;
  tags: string[];
  publishDate: string; // ISO date — not visible before this date
  expirationDate: string; // ISO date — not visible after this date
  audio?: string; // user-uploaded audio file URL
  rss?: boolean; // set false to exclude from RSS feeds (default: true)
};

export type BlogPost = BlogPostMeta & {
  content: string; // raw markdown body (no frontmatter)
  html: string; // rendered HTML
  audioUrl?: string; // TTS audio file URL if generated at build time
};

// ── frontmatter parser ───────────────────────────────────────────────

/**
 * Minimal YAML-ish frontmatter parser. Handles simple key: value pairs,
 * booleans, and bracket arrays [a, b, c].
 * No external dependency needed.
 */
export const parseFrontmatter = (
  raw: string,
): { meta: Record<string, unknown>; body: string } => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const yaml = match[1];
  const body = match[2];
  const meta: Record<string, unknown> = {};

  for (const line of yaml.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let val: unknown = trimmed.slice(colonIdx + 1).trim();

    // booleans
    if (val === "true") val = true;
    else if (val === "false") val = false;
    // arrays: [a, b, c]
    else if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
    // strip surrounding quotes
    else if (
      typeof val === "string" &&
      ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'")))
    ) {
      val = val.slice(1, -1);
    }

    meta[key] = val;
  }

  return { meta, body };
};

/** Serialize metadata back into a frontmatter + body markdown string. */
export const serializeFrontmatter = (
  meta: Record<string, unknown>,
  body: string,
): string => {
  const lines: string[] = ["---"];
  for (const [key, val] of Object.entries(meta)) {
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map((v) => String(v)).join(", ")}]`);
    } else if (typeof val === "boolean") {
      lines.push(`${key}: ${val}`);
    } else {
      lines.push(`${key}: ${String(val)}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n") + body;
};

// ── helpers ──────────────────────────────────────────────────────────

const asString = (v: unknown) => (typeof v === "string" ? v : "");

/**
 * Deterministic ID derived from a slug. Uses FNV-1a–style hashing to
 * produce a UUID-formatted string so legacy posts without an explicit
 * `id` frontmatter field always resolve to the same stable identifier.
 */
export const idFromSlug = (slug: string): string => {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  let h3 = 0xcbf29ce4;
  let h4 = 0x84222325;
  for (let i = 0; i < slug.length; i++) {
    const c = slug.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x100001b3);
    h3 = Math.imul(h3 ^ c, 0x01000193);
    h4 = Math.imul(h4 ^ c, 0x100001b3);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  const h = hex(h1) + hex(h2) + hex(h3) + hex(h4);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

export const metaFromRaw = (
  raw: Record<string, unknown>,
  slug: string,
): BlogPostMeta => ({
  id: asString(raw.id) || idFromSlug(slug),
  slug: asString(raw.slug) || slug,
  title: asString(raw.title) || "Untitled",
  date: asString(raw.date) || new Date().toISOString().slice(0, 10),
  excerpt: asString(raw.excerpt),
  coverImage: asString(raw.coverImage),
  published: raw.published !== false, // default true
  tags: Array.isArray(raw.tags)
    ? raw.tags.map(String).filter(Boolean)
    : [],
  publishDate: asString(raw.publishDate),
  expirationDate: asString(raw.expirationDate),
  audio: asString(raw.audio),
  rss: raw.rss !== false, // default true — set `rss: false` in frontmatter to exclude
});

export const renderMarkdown = (md: string): string => {
  return marked.parse(md, { async: false }) as string;
};

export const slugFromFilename = (filename: string): string =>
  filename.replace(/\.md$/i, "");

// ── dev endpoints ────────────────────────────────────────────────────

declare const __PK_CMS_BLOG_LIST_ENDPOINT__: string | undefined;
declare const __PK_CMS_BLOG_POST_ENDPOINT__: string | undefined;
const DEV_BLOG_LIST = typeof __PK_CMS_BLOG_LIST_ENDPOINT__ !== "undefined" ? __PK_CMS_BLOG_LIST_ENDPOINT__ : "/__blog-posts";
const DEV_BLOG_POST = typeof __PK_CMS_BLOG_POST_ENDPOINT__ !== "undefined" ? __PK_CMS_BLOG_POST_ENDPOINT__ : "/__blog-post";
const PROD_BLOG_INDEX = "/blog/index.json";
const PROD_BLOG_POST = "/blog"; // `/blog/<slug>.json`
const PENDING_BLOG_KEY = "pending-blog-posts";

type PendingBlogEntry = {
  slug: string;
  frontmatter?: Record<string, unknown>;
  body?: string;
  deleted?: boolean;
};

const readPendingBlogEntries = (): Record<string, PendingBlogEntry> => {
  if (import.meta.env.DEV) return {};
  try {
    const raw = window.localStorage.getItem(PENDING_BLOG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, PendingBlogEntry>;
  } catch {
    return {};
  }
};

const writePendingBlogEntries = (entries: Record<string, PendingBlogEntry>): void => {
  if (import.meta.env.DEV) return;
  try {
    window.localStorage.setItem(PENDING_BLOG_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage failures
  }
};

const stagePendingBlogSave = (
  slug: string,
  frontmatter: Record<string, unknown>,
  body: string,
): void => {
  const entries = readPendingBlogEntries();
  entries[slug] = {
    slug,
    frontmatter,
    body,
    deleted: false,
  };
  writePendingBlogEntries(entries);
};

const stagePendingBlogDelete = (slug: string): void => {
  const entries = readPendingBlogEntries();
  entries[slug] = {
    slug,
    deleted: true,
  };
  writePendingBlogEntries(entries);
};

const applyPendingBlogEntries = (posts: BlogPostMeta[]): BlogPostMeta[] => {
  const entries = readPendingBlogEntries();
  if (Object.keys(entries).length === 0) return posts;

  const bySlug = new Map<string, BlogPostMeta>();
  for (const post of posts) {
    bySlug.set(post.slug, post);
  }

  for (const [slug, entry] of Object.entries(entries)) {
    if (entry.deleted) {
      bySlug.delete(slug);
      continue;
    }
    if (!entry.frontmatter) continue;
    bySlug.set(slug, metaFromRaw(entry.frontmatter, slug));
  }

  return Array.from(bySlug.values()).sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
};

/** Fetch list of blog post metadata. */
export const fetchBlogPosts = async (): Promise<BlogPostMeta[]> => {
  const endpoint = import.meta.env.DEV ? DEV_BLOG_LIST : PROD_BLOG_INDEX;
  const res = await fetch(endpoint, { cache: import.meta.env.DEV ? "no-store" : "default" });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to fetch blog posts: ${res.status}`);
  }
  const posts = (await res.json()) as BlogPostMeta[];
  return applyPendingBlogEntries(posts);
};

/** Fetch a single blog post by slug. */
export const fetchBlogPost = async (slug: string): Promise<BlogPost | null> => {
  const pendingEntry = readPendingBlogEntries()[slug];
  if (pendingEntry) {
    if (pendingEntry.deleted) return null;
    if (pendingEntry.frontmatter) {
      const meta = metaFromRaw(pendingEntry.frontmatter, slug);
      const content = pendingEntry.body ?? "";
      return {
        ...meta,
        content,
        html: renderMarkdown(content),
      };
    }
  }

  if (import.meta.env.DEV) {
    const res = await fetch(`${DEV_BLOG_POST}?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  }

  const res = await fetch(`${PROD_BLOG_POST}/${encodeURIComponent(slug)}.json`);
  if (!res.ok) return null;
  return res.json();
};

import {
  canUseGithubSync,
  pushBlogPostToGithub,
  deleteBlogPostFromGithub,
} from "./github";

/** Save/create a blog post. In dev, writes to disk via Vite middleware.
 *  In production with GitHub configured, commits directly to the repo. */
export const saveBlogPost = async (
  slug: string,
  frontmatter: Record<string, unknown>,
  body: string,
): Promise<void> => {
  const markdown = serializeFrontmatter(frontmatter, body);

  // Stage for immediate frontend reads, even before commit/sync.
  if (!import.meta.env.DEV) {
    stagePendingBlogSave(slug, frontmatter, body);
  }

  if (import.meta.env.DEV) {
    await fetch(DEV_BLOG_POST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, markdown }),
    });
  } else if (canUseGithubSync()) {
    await pushBlogPostToGithub(slug, markdown);
  } else {
    throw new Error("Blog editing requires GitHub sync to be configured in production.");
  }
};

/** Delete a blog post. In dev, removes from disk. In production, deletes from GitHub. */
export const deleteBlogPost = async (slug: string): Promise<void> => {
  // Stage deletion so list/detail reflect uncommitted removals immediately.
  if (!import.meta.env.DEV) {
    stagePendingBlogDelete(slug);
  }

  if (import.meta.env.DEV) {
    await fetch(`${DEV_BLOG_POST}?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
  } else if (canUseGithubSync()) {
    await deleteBlogPostFromGithub(slug);
  } else {
    throw new Error("Blog editing requires GitHub sync to be configured in production.");
  }
};
