/**
 * Utilities for converting between Markdown ↔ HTML.
 *
 * - `markdownToHtml` wraps the `marked` library (already a dependency).
 * - `htmlToMarkdown` is a lightweight DOM-based serialiser that turns
 *   TipTap's HTML output back into clean Markdown.  No extra npm
 *   dependency needed — it runs in-browser using DOMParser.
 */

import { marked } from "marked";

/* ══════════════════════════════════════════════════════════════════════
   Markdown → HTML  (for loading into TipTap)
   ══════════════════════════════════════════════════════════════════════ */

export function markdownToHtml(md: string): string {
  if (!md.trim()) return "";
  return marked.parse(md, { async: false }) as string;
}

/* ══════════════════════════════════════════════════════════════════════
   HTML → Markdown  (for saving from TipTap)
   ══════════════════════════════════════════════════════════════════════ */

const BLOCK_TAGS = new Set([
  "P",
  "H1", "H2", "H3", "H4", "H5", "H6",
  "UL", "OL", "LI",
  "BLOCKQUOTE",
  "PRE",
  "HR",
  "IMG",
  "DIV",
  "TABLE", "THEAD", "TBODY", "TR", "TH", "TD",
]);

export function htmlToMarkdown(html: string): string {
  if (!html.trim()) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return serializeNodes(doc.body.childNodes).trim() + "\n";
}

/* ── internal recursive serialiser ── */

function serializeNodes(nodes: NodeListOf<ChildNode> | ChildNode[], listPrefix?: string): string {
  let md = "";
  let idx = 0;
  for (const node of nodes) {
    md += serializeNode(node, listPrefix, idx);
    idx++;
  }
  return md;
}

function serializeNode(node: ChildNode, listPrefix?: string, index = 0): string {
  // Text node
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName;

  // Headings
  if (/^H[1-6]$/.test(tag)) {
    const level = Number(tag[1]);
    const prefix = "#".repeat(level);
    return `\n${prefix} ${inlineContent(el)}\n\n`;
  }

  // Paragraph
  if (tag === "P") {
    const inner = inlineContent(el);
    return inner ? `\n${inner}\n\n` : "\n";
  }

  // Blockquote
  if (tag === "BLOCKQUOTE") {
    const inner = serializeNodes(el.childNodes).trim();
    const lines = inner.split("\n").map((l) => `> ${l}`);
    return `\n${lines.join("\n")}\n\n`;
  }

  // Horizontal rule
  if (tag === "HR") return "\n---\n\n";

  // Unordered list
  if (tag === "UL") {
    return "\n" + serializeNodes(el.childNodes, "-") + "\n";
  }

  // Ordered list
  if (tag === "OL") {
    return "\n" + serializeNodes(el.childNodes, "1.") + "\n";
  }

  // List item
  if (tag === "LI") {
    const prefix = listPrefix ?? "-";
    const inner = inlineContent(el).trim();
    // Handle nested lists
    let nested = "";
    for (const child of el.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const childTag = (child as HTMLElement).tagName;
        if (childTag === "UL" || childTag === "OL") {
          const nestedLines = serializeNode(child).trim().split("\n");
          nested += "\n" + nestedLines.map((l) => `  ${l}`).join("\n");
        }
      }
    }
    return `${prefix} ${inner}${nested}\n`;
  }

  // Pre / code block
  if (tag === "PRE") {
    const codeEl = el.querySelector("code");
    const code = codeEl?.textContent ?? el.textContent ?? "";
    // Try to extract language from class
    let lang = "";
    if (codeEl) {
      const cls = codeEl.className;
      const m = cls.match(/language-(\w+)/);
      if (m) lang = m[1];
    }
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
  }

  // Image
  if (tag === "IMG") {
    const src = el.getAttribute("src") ?? "";
    const alt = el.getAttribute("alt") ?? "";
    return `![${alt}](${src})`;
  }

  // Table
  if (tag === "TABLE") {
    return serializeTable(el) + "\n";
  }

  // Div / other block — recurse
  if (BLOCK_TAGS.has(tag)) {
    return serializeNodes(el.childNodes, listPrefix);
  }

  // Inline fallback
  return inlineContent(el);
}

/* ── inline content (bold, italic, code, link, etc.) ── */

function inlineContent(el: HTMLElement): string {
  let out = "";
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const c = child as HTMLElement;
    const tag = c.tagName;

    if (tag === "STRONG" || tag === "B") {
      out += `**${inlineContent(c)}**`;
    } else if (tag === "EM" || tag === "I") {
      out += `*${inlineContent(c)}*`;
    } else if (tag === "S" || tag === "DEL" || tag === "STRIKE") {
      out += `~~${inlineContent(c)}~~`;
    } else if (tag === "U") {
      // Underline — no markdown equivalent, use inline HTML
      out += `<u>${inlineContent(c)}</u>`;
    } else if (tag === "MARK") {
      // Highlight / background color — preserve as HTML
      const style = c.getAttribute("style") || "";
      const dataColor = c.getAttribute("data-color") || "";
      const attrs = style
        ? ` style="${style}"`
        : dataColor
          ? ` data-color="${dataColor}"`
          : "";
      out += `<mark${attrs}>${inlineContent(c)}</mark>`;
    } else if (tag === "CODE") {
      out += `\`${c.textContent ?? ""}\``;
    } else if (tag === "A") {
      const href = c.getAttribute("href") ?? "";
      out += `[${inlineContent(c)}](${href})`;
    } else if (tag === "IMG") {
      const src = c.getAttribute("src") ?? "";
      const alt = c.getAttribute("alt") ?? "";
      out += `![${alt}](${src})`;
    } else if (tag === "BR") {
      out += "  \n";
    } else if (tag === "SPAN") {
      // TextStyle spans (color, font-size) — preserve as inline HTML
      const style = c.getAttribute("style") || "";
      if (style) {
        out += `<span style="${style}">${inlineContent(c)}</span>`;
      } else {
        out += inlineContent(c);
      }
    } else if (BLOCK_TAGS.has(tag)) {
      // Nested block inside inline context (e.g. list inside LI)
      // skip — handled in serializeNode for LI
    } else {
      out += inlineContent(c);
    }
  }
  return out;
}

/* ── table serialiser ── */

function serializeTable(table: HTMLElement): string {
  const rows: string[][] = [];
  for (const tr of table.querySelectorAll("tr")) {
    const cells: string[] = [];
    for (const td of tr.querySelectorAll("th, td")) {
      cells.push(inlineContent(td as HTMLElement).trim());
    }
    rows.push(cells);
  }
  if (rows.length === 0) return "";

  const colCount = Math.max(...rows.map((r) => r.length));
  const colWidths = Array(colCount).fill(3);
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i], row[i].length);
    }
  }

  const formatRow = (cells: string[]) =>
    "| " + cells.map((c, i) => c.padEnd(colWidths[i])).join(" | ") + " |";

  const lines: string[] = [];
  lines.push(formatRow(rows[0] ?? []));
  lines.push(
    "| " + colWidths.map((w) => "-".repeat(w)).join(" | ") + " |"
  );
  for (let i = 1; i < rows.length; i++) {
    lines.push(formatRow(rows[i]));
  }
  return "\n" + lines.join("\n") + "\n";
}
