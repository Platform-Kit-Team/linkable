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
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  published: boolean;
  tags: string[];
};

export type BlogPost = BlogPostMeta & {
  content: string; // raw markdown body (no frontmatter)
  html: string; // rendered HTML
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

export const metaFromRaw = (
  raw: Record<string, unknown>,
  slug: string,
): BlogPostMeta => ({
  slug: asString(raw.slug) || slug,
  title: asString(raw.title) || "Untitled",
  date: asString(raw.date) || new Date().toISOString().slice(0, 10),
  excerpt: asString(raw.excerpt),
  coverImage: asString(raw.coverImage),
  published: raw.published !== false, // default true
  tags: Array.isArray(raw.tags)
    ? raw.tags.map(String).filter(Boolean)
    : [],
});

export const renderMarkdown = (md: string): string => {
  return marked.parse(md, { async: false }) as string;
};

export const slugFromFilename = (filename: string): string =>
  filename.replace(/\.md$/i, "");

// ── dev endpoints ────────────────────────────────────────────────────

const DEV_BLOG_LIST = "/__blog-posts";
const DEV_BLOG_POST = "/__blog-post";
const PROD_BLOG_INDEX = "/blog/index.json";
const PROD_BLOG_POST = "/blog"; // `/blog/<slug>.json`

/** Fetch list of blog post metadata. */
export const fetchBlogPosts = async (): Promise<BlogPostMeta[]> => {
  const endpoint = import.meta.env.DEV ? DEV_BLOG_LIST : PROD_BLOG_INDEX;
  const res = await fetch(endpoint, { cache: import.meta.env.DEV ? "no-store" : "default" });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to fetch blog posts: ${res.status}`);
  }
  return res.json();
};

/** Fetch a single blog post by slug. */
export const fetchBlogPost = async (slug: string): Promise<BlogPost | null> => {
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
