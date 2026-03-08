import type { LayoutManifest } from "../../lib/layout-manifest";
import type { FormKitSchemaNode } from "@formkit/core";
import type { BioTheme } from "../../lib/model";
import { newLink, newGalleryItem, newEmbed, newSocial } from "../../lib/model";

/* ── Theme presets ──────────────────────────────────────────────── */

const bentoLightTheme = (): BioTheme => ({
  layout: "bento",
  preset: "light",
  colorBrand: "#6366f1",
  colorBrandStrong: "#4f46e5",
  colorAccent: "#f59e0b",
  colorInk: "#1a1a2e",
  colorInkSoft: "rgba(26, 26, 46, 0.5)",
  bg: "#f5f5f7",
  glass: "rgba(255, 255, 255, 0.95)",
  glass2: "rgba(255, 255, 255, 0.7)",
  glassStrong: "#ffffff",
  colorBorder: "rgba(0, 0, 0, 0.04)",
  colorBorder2: "rgba(0, 0, 0, 0.04)",
  cardBg: "#ffffff",
  cardBorder: "transparent",
  cardText: "#1a1a2e",
  radiusXl: "1.5rem",
  radiusLg: "1.25rem",
  layoutVars: {},
  layoutData: {},
});



/* ── FormKit schemas for item editing ───────────────────────────── */

const linkItemSchema: FormKitSchemaNode[] = [
  { $formkit: "text", name: "title", label: "Title", placeholder: "Link title" },
  { $formkit: "text", name: "subtitle", label: "Description", placeholder: "Short helper text…" },
  { $formkit: "url", name: "url", label: "URL", placeholder: "https://…" },
  { $formkit: "imageUpload", name: "imageUrl", label: "Image" },
  { $formkit: "tagList", name: "tags", label: "Tags" },
  { $formkit: "date", name: "publishDate", label: "Publish date" },
  { $formkit: "date", name: "expirationDate", label: "Expiration date" },
];

function galleryItemSchema(item: Record<string, unknown>): FormKitSchemaNode[] {
  const isVideo = item.type === "video";
  return [
    { $formkit: "select", name: "type", label: "Type", options: [
      { label: "Image", value: "image" },
      { label: "Video", value: "video" },
    ]},
    { $formkit: "text", name: "title", label: "Title", placeholder: "Give it a name…" },
    { $formkit: "textarea", name: "description", label: "Description", placeholder: "Optional caption…" },
    ...(isVideo
      ? [{ $formkit: "url", name: "src", label: "Source URL", placeholder: "https://youtube.com/…" }]
      : [{ $formkit: "imageUpload", name: "src", label: "Source" }]
    ),
    { $formkit: "imageUpload", name: "coverUrl", label: "Cover image" },
    { $formkit: "tagList", name: "tags", label: "Tags" },
    { $formkit: "date", name: "publishDate", label: "Publish date" },
    { $formkit: "date", name: "expirationDate", label: "Expiration date" },
  ] as FormKitSchemaNode[];
}

const socialItemSchema: FormKitSchemaNode[] = [
  { $formkit: "iconSelect", name: "icon", label: "Icon" },
  { $formkit: "text", name: "label", label: "Label", placeholder: "e.g. @yourname" },
  { $formkit: "url", name: "url", label: "URL", placeholder: "https://…" },
];

const embedItemSchema: FormKitSchemaNode[] = [
  { $formkit: "text", name: "label", label: "Tab label", placeholder: "e.g. Book a Call" },
  { $formkit: "iconSelect", name: "icon", label: "Icon" },
  { $formkit: "textarea", name: "html", label: "Embed HTML or URL", placeholder: "Paste embed code or a URL…" },
  { $formkit: "date", name: "publishDate", label: "Publish date" },
  { $formkit: "date", name: "expirationDate", label: "Expiration date" },
];

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
  presets: {
    light: bentoLightTheme,
  },
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
    {
      key: "socials", label: "Socials", icon: "Share2",
      defaultEnabled: true, searchable: false,
      itemSchema: socialItemSchema,
      newItem: () => ({ ...newSocial(), enabled: true }) as unknown as Record<string, unknown>,
      itemLabel: (i: any) => i.label || i.icon || "Social",
      itemSublabel: (i: any) => i.url || "(no url)",
    },
    {
      key: "links", label: "Links", icon: "Link",
      defaultEnabled: true, searchable: true,
      itemSchema: linkItemSchema,
      newItem: () => newLink() as unknown as Record<string, unknown>,
      itemLabel: (i: any) => i.title || i.url || "Untitled",
      itemSublabel: (i: any) => i.url || "(no url)",
      itemThumbnail: (i: any) => i.imageUrl || undefined,
    },
    {
      key: "gallery", label: "Gallery", icon: "Image",
      defaultEnabled: false, searchable: true,
      itemSchema: galleryItemSchema,
      newItem: () => newGalleryItem() as unknown as Record<string, unknown>,
      itemLabel: (i: any) => i.title || "Untitled",
      itemSublabel: (i: any) => i.type === "video" ? (i.src || "(no source)") : (i.src ? "Image" : "(no image)"),
      itemThumbnail: (i: any) => i.type === "image" ? i.src : i.coverUrl,
    },
    {
      key: "resume", label: "Resume", icon: "FileText",
      defaultEnabled: false, searchable: false, singleton: true,
      editorComponent: () => import("../../components/editors/ResumeCollectionEditor.vue"),
    },
    {
      key: "blog", label: "Blog", icon: "BookOpen",
      defaultEnabled: false, searchable: true, external: true,
      editorComponent: () => import("../../components/editors/BlogCollectionEditor.vue"),
    },
    {
      key: "embeds", label: "Embeds", icon: "Code",
      defaultEnabled: true, searchable: false,
      itemSchema: embedItemSchema,
      newItem: () => newEmbed() as unknown as Record<string, unknown>,
      itemLabel: (i: any) => i.label || "Untitled",
      itemSublabel: (i: any) => i.html ? "Has embed code" : "(no embed code)",
    },
    {
      key: "newsletter", label: "Newsletter", icon: "Newspaper",
      defaultEnabled: false, searchable: true, external: true,
      editorComponent: () => import("../../components/editors/NewsletterCollectionEditor.vue"),
    },
  ],
  schema: [
    {
      $formkit: "select",
      name: "defaultTab",
      label: "Default tab",
      help: "The tab visitors see first when they land on your page.",
      options: [
        { label: "All", value: "links" },
        { label: "Resume", value: "resume" },
        { label: "Gallery", value: "gallery" },
      ],
    },
  ],
  cmsTabs: [],
};

export default manifest;
