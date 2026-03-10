/**
 * RSS feed generation utilities.
 *
 * Extracted from the platform core so themes can opt into RSS
 * via collection build hooks.
 */

import type { PlatformKitConfig, RssFeedConfig } from "./config";

/** Escape XML special characters. */
export const escapeXml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export interface RssPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  html: string;
  audio?: string;
  audioUrl?: string;
  rss?: boolean;
  tags?: string[];
}

/** Build an RSS XML string from a list of posts and site metadata. */
export const buildRssFeed = (
  posts: RssPost[],
  siteModel: any,
  config: PlatformKitConfig,
  feedCfg?: RssFeedConfig,
): string => {
  const siteTitle = escapeXml(
    feedCfg?.title || config.site?.name || siteModel?.profile?.displayName || "Blog",
  );
  const siteDesc = escapeXml(
    feedCfg?.description || config.site?.tagline || siteModel?.profile?.tagline || "",
  );
  const lang = feedCfg?.language || config.site?.language || "en";
  const outputPath = feedCfg?.output || "rss.xml";
  const siteUrl = (
    config.site?.url ||
    process.env.VITE_SITE_URL ||
    "http://localhost:8080"
  ).replace(/\/$/, "");

  const items = posts.map((p) => {
    const pubDate = new Date(p.date).toUTCString();
    const linkTemplate =
      feedCfg?.linkFormat || config.rss?.linkFormat || "{siteUrl}/#blog/{slug}";
    const link = linkTemplate
      .replace("{siteUrl}", siteUrl)
      .replace("{slug}", encodeURIComponent(p.slug));
    const audioUrl = p.audio || p.audioUrl;
    const enclosure = audioUrl
      ? `\n      <enclosure url="${escapeXml(siteUrl + audioUrl)}" type="audio/mpeg" length="0" />`
      : "";
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
    <atom:link href="${escapeXml(siteUrl)}/content/${escapeXml(outputPath)}" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>`;
};
