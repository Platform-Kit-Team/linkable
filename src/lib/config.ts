// ── PlatformKit Configuration ──────────────────────────────────────────
// Users drop a `platformkit.config.js` (or `.ts`) at their project /
// content root. The config is loaded at Vite-config time and steers
// site identity, RSS feeds, dev-server defaults, and build behaviour.

/** A single RSS feed definition. */
export interface RssFeedConfig {
  /** Output file path relative to public/ (default: "rss.xml") */
  output?: string;
  /** Feed title — falls back to site name */
  title?: string;
  /** Feed description — falls back to site tagline */
  description?: string;
  /** BCP-47 language code (default: "en") */
  language?: string;
  /**
   * Per-feed URL template for post links. Overrides the top-level
   * `rss.linkFormat`. Uses `{siteUrl}` and `{slug}` placeholders.
   */
  linkFormat?: string;
  /** Only include posts whose file path matches this regex */
  pathFilter?: string;
  /** Only include posts whose raw markdown body matches this regex */
  contentFilter?: string;
  /** Only include posts carrying at least one of these tags */
  tags?: string[];
}

export interface PlatformKitConfig {
  /** Site identity — used in RSS, PWA manifest, OG meta fallbacks. */
  site?: {
    /** Display name (default: profile.displayName from CMS data) */
    name?: string;
    /** One-line tagline / description */
    tagline?: string;
    /** Canonical site URL (default: VITE_SITE_URL env var) */
    url?: string;
    /** BCP-47 language code (default: "en") */
    language?: string;
  };

  /** Override default file paths. */
  paths?: {
    /** Markdown blog post source directory (default: "content/blog") */
    blogContent?: string;
    /** Blog JSON output directory relative to public/ (default: "blog") */
    blogOutput?: string;
  };

  /** RSS feed generation. */
  rss?: {
    /** Master toggle — set false to skip RSS entirely (default: true) */
    enabled?: boolean;
    /**
     * URL template for post links in the feed. Use `{siteUrl}` and `{slug}`
     * placeholders. Default: `"{siteUrl}/#blog/{slug}"`
     */
    linkFormat?: string;
    /**
     * One or more named feeds. Each feed can filter posts by path regex,
     * content regex, or tag list. When omitted a single default feed at
     * `/rss.xml` is generated containing all published posts.
     */
    feeds?: RssFeedConfig[];
  };

  /** PWA manifest settings. */
  pwa?: {
    /** Set false to skip manifest generation (default: true) */
    enabled?: boolean;
    /** Display mode — "standalone", "fullscreen", "minimal-ui", "browser" (default: "standalone") */
    display?: string;
    /** Start URL (default: "/") */
    startUrl?: string;
  };

  /** Blog rendering options. */
  blog?: {
    /**
     * Additional highlight.js language names to register for code blocks
     * at build time. The core set (js, ts, python, bash, css, etc.) is
     * always included.
     */
    highlightLanguages?: string[];
  };

  /**
   * Collections whose items are managed externally (markdown files,
   * Supabase tables, etc.). Their `items[]` is always emptied during
   * sanitization so stale data never persists in the JSON.
   * Default: `["blog", "newsletter"]`
   */
  externalCollections?: string[];

  /**
   * CMS dev-server endpoint paths. Override these if your site is served
   * behind a reverse proxy that rewrites paths.
   */
  cms?: {
    /** CMS data read/write endpoint (default: "/__cms-data") */
    dataEndpoint?: string;
    /** GitHub push endpoint (default: "/__cms-push") */
    pushEndpoint?: string;
    /** File upload endpoint (default: "/cms-upload") */
    uploadEndpoint?: string;
    /** Blog post list endpoint (default: "/__blog-posts") */
    blogListEndpoint?: string;
    /** Blog post read/write endpoint (default: "/__blog-post") */
    blogPostEndpoint?: string;
  };

  /** Dev-server defaults (overridden by CLI flags). */
  server?: {
    host?: string;
    port?: number;
  };

  /** Build-time options. */
  build?: {
    /** Enable Puppeteer pre-rendering (default: false) */
    prerender?: boolean;
    /**
     * Extra routes to pre-render (in addition to "/" and any theme
     * routes that have `prerender: true`). Example: ["/about", "/pricing"]
     */
    prerenderRoutes?: string[];
    /** Strip items outside their schedule window at build time */
    scheduleExclude?: boolean;
  };

  /**
   * Raw Vite config to deep-merge with the core config.
   * Plugins are appended; objects are recursively merged;
   * scalar values use user-wins semantics.
   */
  vite?: Record<string, any>;
}

/**
 * Identity helper for type-safe config files:
 * ```ts
 * import { defineConfig } from "./src/lib/config";
 * export default defineConfig({ site: { name: "My Site" } });
 * ```
 */
export function defineConfig(config: PlatformKitConfig): PlatformKitConfig {
  return config;
}
