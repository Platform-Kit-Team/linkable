// ── PlatformKit Configuration ──────────────────────────────────────────
// Users drop a `platformkit.config.js` (or `.ts`) at their project /
// content root. The config is loaded at Vite-config time and steers
// site identity, RSS feeds, dev-server defaults, and build behaviour.

import type { Component } from "vue";
import type { FormKitSchemaNode } from "@formkit/core";
import type { ZodSchema } from "zod";
import type { ThemeConfig } from "./model";
import type {
  LayoutVar,
  LayoutRoute,
  LayoutCmsTab,
  ContentSchema,
} from "./layout-manifest";
import type { CollectionMigrationEntry } from "./collection-migrations";

/** A single RSS feed definition. */
export interface RssFeedConfig {
  /** Output file path relative to public/content/ (default: "rss.xml") */
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

/**
 * Configuration for a single file-based content collection.
 * Combines infrastructure fields (directory, format) with CMS UI fields
 * (label, icon, itemSchema, etc.) so everything lives in one place.
 */
export interface ContentCollectionConfig {
  // ── Infrastructure (used by server & build) ──────────────────────
  /** Directory where content files live, relative to project root. */
  directory: string;
  /** File format: "markdown" (frontmatter + body), "json", or "yaml". Default: "markdown" */
  format?: "markdown" | "json" | "yaml";
  /** Schema field used to generate the filename slug. Default: "title" */
  slugField?: string;
  /** Field to sort by in list output. Default: "date" (if present) */
  sortField?: string;
  /** Sort direction. Default: "desc" */
  sortOrder?: "asc" | "desc";

  // ── CMS UI (used by the editor) ──────────────────────────────────
  /** Human-visible label (e.g. "Projects"). Default: capitalized key */
  label?: string;
  /** Lucide icon name for the CMS tab (e.g. "Folder"). Default: "File" */
  icon?: string;
  /** Default enabled state for new users. Default: true */
  defaultEnabled?: boolean;
  /** Whether the searchbar is available on the public page. Default: false */
  searchable?: boolean;
  /** FormKit schema for editing a single item. */
  itemSchema?: FormKitSchemaNode[] | ((item: Record<string, unknown>) => FormKitSchemaNode[]);
  /** Factory function returning a new blank item with defaults. */
  newItem?: () => Record<string, unknown>;
  /** Extract a display label from an item for the list view. */
  itemLabel?: (item: any) => string;
  /** Extract a subtitle from an item for the list view. */
  itemSublabel?: (item: any) => string;
  /** Extract a thumbnail URL from an item for the list view. */
  itemThumbnail?: (item: any) => string | undefined;
  /** Custom Vue editor component — replaces the auto-generated editor entirely. */
  editorComponent?: () => Promise<{ default: Component }>;

  // ── Schema migration ─────────────────────────────────────────────
  /** Current schema version for this collection's items. Default: 0 */
  version?: number;
  /** Declarative field renames: `{ newFieldName: "oldFieldName" }`. Idempotent — always applied. */
  fieldRenames?: Record<string, string>;
  /** Declarative field defaults: `{ fieldName: defaultValue }`. Fills missing fields. Idempotent — always applied. */
  fieldDefaults?: Record<string, unknown>;
  /** Imperative migration transforms, run in version order (version-gated, run once per item). */
  migrations?: CollectionMigrationEntry[];

  // ── Validation ────────────────────────────────────────────────────
  /** Optional Zod schema to validate each item at build time. */
  validationSchema?: ZodSchema;

  // ── Build hooks ──────────────────────────────────────────────────
  /**
   * Filter function for the published index. Only items passing this
   * filter appear in the build-time index.json. Items that fail the filter
   * still get individual {slug}.json files — they just aren't listed.
   */
  indexFilter?: (item: Record<string, unknown>) => boolean;

  /**
   * Build-time hooks for post-processing (RSS, OG pre-rendering, etc.).
   * These hooks run only in Node.js context during `vite build`.
   */
  buildHooks?: {
    /**
     * Called after all items have been written to the output directory.
     * Good for generating RSS feeds, sitemaps, or other derived files.
     */
    afterBuild?: (context: CollectionBuildContext) => void;
    /**
     * Called after the entire Vite build (in closeBundle). Good for
     * generating pre-rendered HTML files using the built output.
     */
    closeBundle?: (context: CollectionCloseBundleContext) => void;
  };

  // ── Built-in build integrations ──────────────────────────────────
  /**
   * Enable RSS feed generation for this collection at build time.
   * Items must have `slug`, `title`, `date`, and optionally `excerpt`, `html`,
   * `audio`, `rss`, `tags` fields. Items with `rss: false` are excluded.
   * The RSS configuration (feeds, linkFormat, etc.) comes from `PlatformKitConfig.rss`.
   */
  generateRss?: boolean;

  /**
   * Enable OG meta pre-rendering for this collection at build time.
   * Generates per-item HTML files (e.g. `dist/content/{slug}/index.html`)
   * so social crawlers get item-specific OG tags without JavaScript.
   */
  generateOgPages?: boolean | {
    /** URL path prefix for pre-rendered pages. Default: "content" */
    routePrefix?: string;
  };

}

/** Context passed to collection afterBuild hooks. */
export interface CollectionBuildContext {
  /** All items in the collection (after filtering). */
  items: Record<string, unknown>[];
  /** All items before filtering (includes unpublished). */
  allItems: Record<string, unknown>[];
  /** Absolute path to the output directory (e.g. public/content/collections/blog/). */
  outputDir: string;
  /** Absolute path to the source directory (e.g. content/blog/). */
  sourceDir: string;
  /** The full PlatformKitConfig. */
  config: PlatformKitConfig;
  /** The parsed CMS site model. */
  siteModel: any;
}

/** Context passed to collection closeBundle hooks. */
export interface CollectionCloseBundleContext {
  /** All items that were included in the published index. */
  items: Record<string, unknown>[];
  /** Absolute path to the Vite build output (dist/). */
  distDir: string;
  /** The collection key (e.g. "blog"). */
  collectionKey: string;
  /** The full PlatformKitConfig. */
  config: PlatformKitConfig;
  /** The parsed CMS site model. */
  siteModel: any;
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
  paths?: Record<string, never>;

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

  /** Markdown rendering options. */
  markdown?: {
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
   * File-based content collections. Each entry declares a directory of
   * content files (markdown, JSON, or YAML) that get automatic CRUD
   * endpoints in dev and static JSON output at build time.
   *
   * Besides the infrastructure fields (directory, format, etc.), each
   * entry can include all the CMS UI fields (label, icon, itemSchema,
   * newItem, etc.) so that users configure everything in one place —
   * no separate manifest override file needed.
   *
   * The key becomes the collection key in the data model and matches
   * the `key` field in a ContentSchema.
   *
   * @example
   * ```ts
   * contentCollections: {
   *   projects: {
   *     directory: 'content/projects',
   *     format: 'markdown',
   *     label: 'Projects',
   *     icon: 'Folder',
   *     slugField: 'title',
   *     sortField: 'date',
   *     sortOrder: 'desc',
   *     defaultEnabled: true,
   *     searchable: false,
   *     itemSchema: [
   *       { $formkit: 'text', name: 'title', label: 'Title' },
   *       { $formkit: 'date', name: 'date', label: 'Date' },
   *     ],
   *     newItem: () => ({ title: '', date: '' }),
   *   },
   * }
   * ```
   */
  contentCollections?: Record<string, ContentCollectionConfig>;

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
    /**
     * Validate all content against schemas at build time.
     * Fails the build if any content is invalid. Default: true.
     * Override via env var VITE_CONTENT_VALIDATION=false.
     */
    contentValidation?: boolean;
  };

  // ── Theme / Layout UI ──────────────────────────────────────────────
  // These fields were previously in LayoutManifest. They live here so
  // that themes, the root config, and user overrides share one type.

  /** Display name for this theme (e.g. "Bento"). */
  name?: string;

  /**
   * Theme presets (e.g. "light", "dark"). Each entry is a factory
   * returning a fresh ThemeConfig. The CMS preset selector is built
   * dynamically from these keys.
   */
  presets?: Record<string, () => ThemeConfig>;

  /** Layout-specific CSS variable definitions shown in the CMS Theme panel. */
  vars?: LayoutVar[];

  /**
   * Content collections this config level declares.
   * Themes list which collections they render; the root config can add more.
   * Data lives globally in `model.collections` so it survives layout switches.
   */
  contentSchemas?: ContentSchema[];

  /**
   * Optional peer dependencies this theme needs (npm package names → semver).
   * Purely documentary — actual install is driven by the theme's package.json.
   */
  peerDependencies?: Record<string, string>;

  /**
   * FormKit schema for layout settings rendered in the CMS Theme panel.
   * Data is stored at the root of `layoutData`.
   */
  schema?: FormKitSchemaNode[];

  /** Optional Zod validation for the root-level layoutData written by `schema`. */
  validation?: ZodSchema;

  /**
   * Top-level CMS tabs contributed by this config level.
   * Each tab stores data at `layoutData[tab.key]`.
   */
  cmsTabs?: LayoutCmsTab[];

  /**
   * Routes contributed by this config level.
   * Registered with Vue Router when this layout is active;
   * removed when the layout changes.
   */
  routes?: LayoutRoute[];

  /**
   * Raw Vite config to deep-merge with the core config.
   * Plugins are appended; objects are recursively merged;
   * scalar values use user-wins semantics.
   */
  vite?: Record<string, any>;

  /**
   * Build-time hooks that run during `vite build`.
   * Each config level (platform, theme, user) can contribute hooks;
   * they are concatenated during the config merge so all levels' hooks run.
   */
  buildHooks?: BuildHook[];
}

/**
 * A build-time hook that runs during `vite build`.
 * Registered via `buildHooks` on PlatformKitConfig at any config level.
 */
export interface BuildHook {
  /** Human-readable name for logging. */
  name: string;
  /**
   * Phase when the hook runs:
   * - `"afterCollectionBuild"` — after all collection items are built to
   *   `public/content/collections/`. Receives the built data for each collection.
   * - `"closeBundle"` — after the final Vite bundle is written to `dist/`.
   *   Good for post-processing the dist output.
   */
  phase: "afterCollectionBuild" | "closeBundle";
  /** The hook implementation. */
  run: (context: BuildHookContext) => void | Promise<void>;
}

/** Context passed to build hooks. */
export interface BuildHookContext {
  /** Built data for each collection, keyed by collection key. */
  collections: Record<string, {
    items: Record<string, unknown>[];
    allItems: Record<string, unknown>[];
    outputDir: string;
    sourceDir: string;
  }>;
  /** Absolute path to the Vite build output (dist/). Only set in closeBundle phase. */
  distDir?: string;
  /** The full merged PlatformKitConfig. */
  config: PlatformKitConfig;
  /** The parsed CMS site model. */
  siteModel: any;
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
