/**
 * OG meta pre-rendering utilities.
 *
 * Generates per-item HTML files with proper OG meta tags so social
 * crawlers (iMessage, Twitter, Facebook) get item-specific previews.
 *
 * Extracted from the platform core so themes can opt into OG
 * pre-rendering via collection build hooks.
 */

import fs from "node:fs";
import path from "node:path";
import { sanitizeModel } from "./model";
import type { PlatformKitConfig } from "./config";

/** Escape HTML attribute values. */
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export interface OgItem {
  slug: string;
  title?: string;
  excerpt?: string;
  coverImage?: string;
}

/**
 * Generate pre-rendered HTML files with OG meta tags for a list of
 * content items. Each item gets a `dist/{routePrefix}/{slug}/index.html`
 * that crawlers can read without JS.
 *
 * @param items  — The items to generate pages for.
 * @param distDir — Absolute path to `dist/`.
 * @param siteModel — The parsed CMS site model.
 * @param config — The full PlatformKitConfig.
 * @param routePrefix — URL path prefix (e.g. "content" for /content/{slug}).
 */
export const generateOgPages = (
  items: OgItem[],
  distDir: string,
  siteModel: any,
  config: PlatformKitConfig,
  routePrefix = "content",
): number => {
  const indexHtmlPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexHtmlPath)) return 0;

  const siteUrl = resolveSiteUrl(config);

  const toAbsolute = (url: string) => {
    if (!url) return "";
    if (/^https?:\/\//.test(url)) return url;
    return siteUrl ? `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}` : url;
  };

  const baseHtml = fs.readFileSync(indexHtmlPath, "utf8");
  let count = 0;

  for (const item of items) {
    const title = item.title || "Post";
    const excerpt = item.excerpt || "";
    const coverImage =
      item.coverImage || siteModel?.profile?.ogImageUrl || "";
    const postUrl = siteUrl
      ? `${siteUrl}/${routePrefix}/${encodeURIComponent(item.slug)}`
      : "";

    const ogTags: string[] = [];
    ogTags.push(`<meta property="og:title" content="${esc(title)}" />`);
    if (excerpt)
      ogTags.push(
        `<meta property="og:description" content="${esc(excerpt)}" />`,
      );
    if (coverImage) {
      ogTags.push(
        `<meta property="og:image" content="${esc(toAbsolute(coverImage))}" />`,
      );
      ogTags.push(
        `<meta name="twitter:card" content="summary_large_image" />`,
      );
    }
    ogTags.push(`<meta property="og:type" content="article" />`);
    if (postUrl)
      ogTags.push(
        `<meta property="og:url" content="${esc(postUrl)}" />`,
      );

    let postHtml = baseHtml;
    postHtml = postHtml.replace(
      /<meta\s+(?:property="og:|name="twitter:)[^>]*\/>\s*\n?\s*/g,
      "",
    );
    postHtml = postHtml.replace(
      /<title>[^<]*<\/title>/,
      `<title>${esc(title)}</title>`,
    );
    postHtml = postHtml.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${esc(excerpt)}" />`,
    );
    postHtml = postHtml.replace(
      "</head>",
      `    ${ogTags.join("\n    ")}\n  </head>`,
    );

    const outDir = path.join(distDir, routePrefix, item.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), postHtml);
    count++;
  }

  return count;
};

/** Resolve the canonical site URL from config and env. */
function resolveSiteUrl(config: PlatformKitConfig): string {
  if (config.site?.url) return config.site.url.replace(/\/$/, "");
  if (process.env.VITE_SITE_URL)
    return process.env.VITE_SITE_URL.replace(/\/$/, "");
  return "";
}
