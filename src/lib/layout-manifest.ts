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

export interface LayoutManifest {
  /** Display name for the layout */
  name: string;
  /** Layout-specific CSS variables */
  vars: LayoutVar[];
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
}
