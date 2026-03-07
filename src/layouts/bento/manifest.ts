import type { LayoutManifest } from "../../lib/layout-manifest";

/**
 * A single cell on the bento grid.
 *
 * `type` declares what content the cell renders.
 * `refId` points to an existing item in the model (link, gallery item, blog post, or embed).
 * Grid position is given as 1-based col/row with span counts.
 */
export interface BentoGridItem {
  id: string;
  type: "link" | "gallery" | "blog" | "embed" | "profile";
  /** ID of the referenced content item (link.id, galleryItem.id, embed.id, or blog slug) */
  refId: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  /** For embeds: optional thumbnail image URL */
  thumbnailUrl?: string;
  /** For embeds: optional heading displayed on the card */
  headerText?: string;
  /** For embeds: optional CTA button label */
  buttonText?: string;
}

export interface BentoGridData {
  /** The total number of columns in the grid (default 4) */
  columns: number;
  /** Items placed on the grid */
  items: BentoGridItem[];
}

const manifest: LayoutManifest = {
  name: "Bento",
  vars: [
    {
      cssVar: "--bento-grid-width",
      label: "Grid width",
      type: "text",
      defaultLight: "960px",
      defaultDark: "960px",
    },
    {
      cssVar: "--bento-gap",
      label: "Grid gap",
      type: "text",
      defaultLight: "1rem",
      defaultDark: "1rem",
    },
    {
      cssVar: "--bento-card-radius",
      label: "Card radius",
      type: "text",
      defaultLight: "1.5rem",
      defaultDark: "1.5rem",
    },
    {
      cssVar: "--bento-card-bg",
      label: "Card background",
      type: "color",
      defaultLight: "#ffffff",
      defaultDark: "rgba(255, 255, 255, 0.06)",
    },
    {
      cssVar: "--bento-card-border",
      label: "Card border",
      type: "color",
      defaultLight: "transparent",
      defaultDark: "rgba(255, 255, 255, 0.08)",
    },
    {
      cssVar: "--bento-card-shadow",
      label: "Card shadow",
      type: "text",
      defaultLight: "0 1px 2px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.03)",
      defaultDark: "0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)",
    },
    {
      cssVar: "--bento-hover-scale",
      label: "Hover scale",
      type: "text",
      defaultLight: "1.02",
      defaultDark: "1.02",
    },
  ],
  contentSchemas: [
    { key: "links",      label: "Links",      icon: "Link",          defaultEnabled: true,  searchable: true },
    { key: "gallery",    label: "Gallery",    icon: "Image",         defaultEnabled: false, searchable: true },
    { key: "resume",     label: "Resume",     icon: "FileText",      defaultEnabled: false, searchable: false, singleton: true },
    { key: "blog",       label: "Blog",       icon: "BookOpen",      defaultEnabled: false, searchable: true,  external: true },
    { key: "embeds",     label: "Embeds",     icon: "Code",          defaultEnabled: true,  searchable: false },
    { key: "newsletter", label: "Newsletter", icon: "Newspaper",     defaultEnabled: false, searchable: true,  external: true },
  ],
  defaultTab: "links",
  cmsTabs: [],
};

export default manifest;
