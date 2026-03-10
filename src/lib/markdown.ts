/**
 * Markdown utilities — frontmatter parsing, syntax highlighting, and rendering.
 *
 * Generic module used by the collection build system and any content
 * that stores data as markdown files with YAML-like frontmatter.
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

// ── rendering ────────────────────────────────────────────────────────

export const renderMarkdown = (md: string): string => {
  return marked.parse(md, { async: false }) as string;
};
