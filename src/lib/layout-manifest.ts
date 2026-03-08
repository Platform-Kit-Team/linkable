/**
 * Layout Variable Manifest
 *
 * Each layout can export a manifest describing custom CSS variables it uses.
 * These variables get:
 *   1. Registered as CSS custom properties on :root
 *   2. Displayed as editable fields in the CMS Theme panel
 *   3. Persisted in `theme.layoutVars` keyed by the CSS property name
 */

import type { FormKitSchemaNode } from "@formkit/core";
import type { Component } from "vue";
import type { ZodSchema } from "zod";
import type { BioTheme } from "./model";

export type LayoutVarType = "color" | "text";

export interface LayoutVar {
  /** CSS custom property name, e.g. "--minimal-header-gradient-start" */
  cssVar: string;
  /** Human-readable label for the CMS editor */
  label: string;
  /** Editor type: "color" shows a color picker, "text" shows a text input */
  type: LayoutVarType;
  /** Default value when preset is "light" */
  defaultLight: string;
  /** Default value when preset is "dark" */
  defaultDark: string;
}

/**
 * A full top-level CMS tab contributed by the layout.
 *
 * Provide either `schema` (auto-rendered form) or `component` (custom Vue UI).
 * If both are provided, `component` takes precedence.
 *
 * Schema-driven tabs write to `layoutData[tab.key]`.
 * Component-driven tabs receive `modelValue` = `layoutData[tab.key]` and emit `update:modelValue`.
 */
export interface LayoutCmsTab {
  /** Unique key — used as the tab value and as the `layoutData` sub-key. Must not collide with built-in tabs. */
  key: string;
  /** Tab button label */
  label: string;
  /** PrimeIcons class for the tab icon (e.g. "pi-th-large") */
  icon: string;
  /** FormKit schema — platform auto-renders the form. Data stored at `layoutData[key]`. */
  schema?: FormKitSchemaNode[];
  /** Optional Zod validation for this tab's data slice */
  validation?: ZodSchema;
  /** Custom Vue component — replaces auto-generated form. Receives `modelValue` / emits `update:modelValue`. */
  component?: () => Promise<{ default: Component }>;
}

/**
 * A route contributed by a layout.
 *
 * Layout routes render a full-page component when the URL matches.
 * They are registered dynamically via `router.addRoute()` when their
 * layout is active and removed when the layout changes.
 */
export interface LayoutRoute {
  /** URL path (must start with `/`). Supports Vue Router params like `/projects/:slug`. */
  path: string;
  /** Async component factory for the page. */
  component: () => Promise<{ default: Component }>;
  /** Human-readable label — surfaced in navigation when provided. */
  label?: string;
  /** PrimeIcons class for an optional nav icon (e.g. "pi-briefcase"). */
  icon?: string;
  /** Optional Vue Router route meta. */
  meta?: Record<string, unknown>;
  /**
   * When set, a static HTML shell with OG meta tags is generated for this
   * route at build time so social crawlers and SEO bots can read it.
   * The page content is still rendered client-side.
   */
  prerender?: {
    /** Page title (used in `<title>` and `og:title`). */
    title: string;
    /** Meta description (used in `<meta name="description">` and `og:description`). */
    description?: string;
    /** OG image URL (absolute or root-relative). */
    ogImage?: string;
  };
}

/**
 * A content collection schema declared by a layout.
 *
 * Layouts declare which content collections they consume via `contentSchemas`.
 * Data for each collection lives in `model.collections[schema.key]`.
 * Multiple layouts can declare the same key — data survives layout switches.
 */
export interface ContentSchema {
  /** Collection key — used as the key in model.collections (e.g. "links", "gallery") */
  key: string;
  /** Human-visible label (e.g. "Links", "Gallery") */
  label: string;
  /** PrimeIcons class for CMS tab icon (e.g. "pi-link") */
  icon: string;
  /** Default enabled state for new users */
  defaultEnabled: boolean;
  /** Whether searchbar is available for this collection */
  searchable: boolean;
  /**
   * If true, collection holds a single data object (items[0]) instead of a list.
   * The CMS renders the editor directly instead of showing a list.
   */
  singleton?: boolean;
  /**
   * If true, items are stored externally (e.g. blog posts as Markdown files).
   * The collection entry in the model only holds metadata (enabled, label, etc.)
   * and items[] stays empty.
   */
  external?: boolean;
  /**
   * FormKit schema for editing a single item (or the singleton object).
   * When provided, the CMS auto-renders this form in a drawer (list mode)
   * or inline (singleton mode).
   *
   * Can be a static array or a function that receives the current item
   * and returns the schema — useful for conditional fields.
   */
  itemSchema?: FormKitSchemaNode[] | ((item: Record<string, unknown>) => FormKitSchemaNode[]);
  /**
   * Custom Vue editor component — replaces auto-generated UI entirely.
   * Receives props: modelValue (collection data), model (full draft BioModel).
   * Emits: update:modelValue.
   */
  editorComponent?: () => Promise<{ default: Component }>;
  /**
   * Factory function that returns a new blank item with default field values.
   * Required for list collections that use itemSchema (so "Add" works).
   */
  newItem?: () => Record<string, unknown>;
  /**
   * Extract a short display label from an item for the list view.
   * Falls back to item.title or item.label or "Untitled".
   */
  itemLabel?: (item: any) => string;
  /**
   * Extract a subtitle / secondary text from an item for the list view.
   */
  itemSublabel?: (item: any) => string;
  /**
   * Extract a thumbnail URL from an item for the list view.
   */
  itemThumbnail?: (item: any) => string | undefined;
}

export interface LayoutManifest {
  /** Display name for the layout */
  name: string;
  /**
   * Theme presets this layout provides (e.g. "light", "dark").
   * Each entry is a factory that returns a fresh BioTheme with the
   * layout's preferred colours, radii, etc.
   *
   * The CMS preset selector is built dynamically from these keys,
   * so a layout can offer arbitrary presets beyond light/dark.
   */
  presets: Record<string, () => BioTheme>;
  /** Layout-specific CSS variables */
  vars: LayoutVar[];
  /**
   * Content collections this layout consumes.
   * Each layout declares which collections it renders; data lives globally
   * in model.collections so it survives layout switches.
   */
  contentSchemas?: ContentSchema[];

  /**
   * Optional peer dependencies this layout needs (npm package names → semver).
   * These are installed from the content repo's package.json at import time.
   * Purely documentary on the manifest — the actual install is driven by
   * the content repo's package.json.
   */
  peerDependencies?: Record<string, string>;
  /**
   * FormKit schema for layout settings rendered in the Theme panel.
   * Data is stored at the root of `layoutData`.
   */
  schema?: FormKitSchemaNode[];
  /**
   * Optional Zod validation for the root-level layoutData written by `schema`.
   */
  validation?: ZodSchema;
  /**
   * Optional top-level CMS tabs contributed by this layout.
   * Each tab stores data at `layoutData[tab.key]`.
   */
  cmsTabs?: LayoutCmsTab[];
  /**
   * Optional routes contributed by this layout.
   * Registered with Vue Router when this layout is active;
   * removed when the layout changes.
   */
  routes?: LayoutRoute[];
}
