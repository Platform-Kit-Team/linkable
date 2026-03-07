/**
 * Layout Variable Manifest
 *
 * Each layout can export a manifest describing custom CSS variables it uses.
 * These variables get:
 *   1. Registered as CSS custom properties on :root
 *   2. Displayed as editable fields in the CMS Theme panel
 *   3. Persisted in `theme.layoutVars` keyed by the CSS property name
 */

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

export interface LayoutManifest {
  /** Display name for the layout */
  name: string;
  /** Layout-specific CSS variables */
  vars: LayoutVar[];
}
