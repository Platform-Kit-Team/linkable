// Injected at build time by Vite `define` — see vite.config.ts
declare const __PK_EXTERNAL_COLLECTIONS__: string[] | undefined;

export type Profile = {
  displayName: string;
  tagline: string;
  faviconUrl: string;
  ogImageUrl: string;
};

export type ThemePreset = string;

export type ThemeConfig = {
  layout: string;
  preset: ThemePreset;
  colorBrand: string;
  colorBrandStrong: string;
  colorAccent: string;
  colorInk: string;
  colorInkSoft: string;
  bg: string;
  glass: string;
  glass2: string;
  glassStrong: string;
  colorBorder: string;
  colorBorder2: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  radiusXl: string;
  radiusLg: string;
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string;
  layoutVars: Record<string, string>;
  layoutData: Record<string, unknown>;
};

export type Scripts = {
  headScript: string;
  bodyEndScript: string;
};

export type ContentCollection = {
  enabled: boolean;
  label: string;
  icon: string;
  searchEnabled: boolean;
  items: Record<string, unknown>[];
};

export type SiteModel = {
  schemaVersion: number;
  profile: Profile;
  collections: Record<string, ContentCollection>;
  theme: ThemeConfig;
  layoutThemes: Record<string, ThemeConfig>;
  scripts: Scripts;
};

/** @deprecated Use SiteModel instead */
export type BioModel = SiteModel;
/** @deprecated Use Profile instead */
export type BioProfile = Profile;
/** @deprecated Use Scripts instead */
export type BioScripts = Scripts;

export const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 40);

export const defaultCollection = (enabled = false): ContentCollection => ({
  enabled,
  label: "",
  icon: "",
  searchEnabled: false,
  items: [],
});

export const defaultTheme = (): ThemeConfig => ({
  layout: "default",
  preset: "light",
  colorBrand: "#3b82f6",
  colorBrandStrong: "#2563eb",
  colorAccent: "#ff5a7a",
  colorInk: "#0b1220",
  colorInkSoft: "rgba(11, 18, 32, 0.62)",
  bg: "#f5f7fb",
  glass: "rgba(255, 255, 255, 0.66)",
  glass2: "rgba(255, 255, 255, 0.52)",
  glassStrong: "rgba(255, 255, 255, 0.82)",
  colorBorder: "rgba(255, 255, 255, 0.62)",
  colorBorder2: "rgba(11, 18, 32, 0.10)",
  cardBg: "rgba(255, 255, 255, 0.66)",
  cardBorder: "rgba(255, 255, 255, 0.62)",
  cardText: "#0b1220",
  radiusXl: "1.6rem",
  radiusLg: "1.2rem",
  fontFamily: "",
  fontWeight: "",
  letterSpacing: "",
  layoutVars: {},
  layoutData: {},
});

export const darkTheme = (): ThemeConfig => ({
  layout: "default",
  preset: "dark",
  colorBrand: "#60a5fa",
  colorBrandStrong: "#3b82f6",
  colorAccent: "#f472b6",
  colorInk: "#f1f5f9",
  colorInkSoft: "rgba(241, 245, 249, 0.55)",
  bg: "#000000",
  glass: "rgba(40, 52, 72, 0.78)",
  glass2: "rgba(40, 52, 72, 0.60)",
  glassStrong: "rgba(50, 62, 82, 0.92)",
  colorBorder: "rgba(148, 163, 184, 0.24)",
  colorBorder2: "rgba(148, 163, 184, 0.12)",
  cardBg: "rgba(40, 52, 72, 0.78)",
  cardBorder: "rgba(148, 163, 184, 0.24)",
  cardText: "#f1f5f9",
  radiusXl: "1.6rem",
  radiusLg: "1.2rem",
  fontFamily: "",
  fontWeight: "",
  letterSpacing: "",
  layoutVars: {},
  layoutData: {},
});

export const THEME_PRESETS: Record<string, () => ThemeConfig> = {
  light: defaultTheme,
  dark: darkTheme,
};

export const defaultScripts = (): Scripts => ({
  headScript: "",
  bodyEndScript: "",
});

export const defaultModel = (): SiteModel => ({
  schemaVersion: 0,
  profile: {
    displayName: "PlatformKit",
    tagline: "Design-forward links. Clean, fast, yours.",
    faviconUrl: "/pwa-logo.png",
    ogImageUrl: "/pwa-logo.png",
  },
  collections: {
    socials: {
      ...defaultCollection(true),
      items: [
        { id: newId(), icon: "Instagram", label: "Instagram", url: "https://instagram.com", enabled: true },
        { id: newId(), icon: "Github", label: "Github", url: "https://github.com", enabled: false },
      ],
    },
    links: {
      ...defaultCollection(true),
      items: [
        {
          id: newId(),
          title: "My portfolio",
          subtitle: "Selected work & case studies",
          url: "https://example.com",
          imageUrl: "",
          enabled: true,
          tags: [],
          publishDate: "",
          expirationDate: "",
        },
        {
          id: newId(),
          title: "Book a call",
          subtitle: "15 minutes to see if we fit",
          url: "https://example.com",
          imageUrl: "",
          enabled: true,
          tags: [],
          publishDate: "",
          expirationDate: "",
        },
        {
          id: newId(),
          title: "Shop presets",
          subtitle: "UI kits, templates, packs",
          url: "https://example.com",
          imageUrl: "",
          enabled: true,
          tags: [],
          publishDate: "",
          expirationDate: "",
        },
      ],
    },
    gallery: { ...defaultCollection(), label: "Gallery", icon: "Image" },
    resume: {
      ...defaultCollection(),
      label: "About Me",
      icon: "FileText",
    },
    blog: { ...defaultCollection(), label: "Blog", icon: "BookOpen" },
    embeds: { ...defaultCollection(true), label: "Embeds", icon: "Code" },
    widgets: defaultCollection(),
    newsletter: { ...defaultCollection(), label: "Newsletter", icon: "Mail" },
    voice: { ...defaultCollection(), label: "Voice", icon: "Microphone" },
    docs: { ...defaultCollection(), label: "Docs", icon: "BookMarked" },
  },
  theme: defaultTheme(),
  layoutThemes: {
    default: defaultTheme(),
  },
  scripts: defaultScripts(),
});

const asString = (v: unknown) => (typeof v === "string" ? v : "");
const asBool = (v: unknown) => (typeof v === "boolean" ? v : false);

const sanitizeLayoutVars = (v: unknown): Record<string, string> => {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof key === "string" && key.startsWith("--") && typeof val === "string") {
      out[key.slice(0, 80)] = (val as string).slice(0, 200);
    }
  }
  return out;
};

const sanitizeUrl = (v: unknown) => {
  const raw = asString(v).trim();
  if (!raw) return "";

  // Allow fragment-only links like #gallery, #blog, etc.
  if (raw.startsWith("#")) {
    return raw;
  }

  if (raw.startsWith("/")) {
    try {
      const normalized = new URL(raw, "http://localhost");
      const output = normalized.pathname + normalized.search + normalized.hash;
      if (output.includes("..")) return "";
      return output;
    } catch {
      return "";
    }
  }

  try {
    const u = new URL(raw);
    // R6: Case-insensitive protocol check to block JaVaScRiPt: etc.
    const protocol = u.protocol.toLowerCase();
    const allowed = ["http:", "https:", "mailto:", "tel:", "sms:", "ftp:", "ftps:", "webcal:", "geo:"];
    if (allowed.includes(protocol)) return u.toString();
    return "";
  } catch {
    return "";  
  }
};

import { migrateToLatest, CURRENT_SCHEMA_VERSION } from "./migrations";

const sanitizeTheme = (raw: unknown, fallback: ThemeConfig): ThemeConfig => {
  const t = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const presetVal = asString(t.preset);
  const preset: ThemePreset = presetVal || fallback.preset;
  const layout = asString(t.layout).slice(0, 40) || fallback.layout;
  return {
    layout,
    preset,
    colorBrand: asString(t.colorBrand).slice(0, 40) || fallback.colorBrand,
    colorBrandStrong: asString(t.colorBrandStrong).slice(0, 40) || fallback.colorBrandStrong,
    colorAccent: asString(t.colorAccent).slice(0, 40) || fallback.colorAccent,
    colorInk: asString(t.colorInk).slice(0, 40) || fallback.colorInk,
    colorInkSoft: asString(t.colorInkSoft).slice(0, 60) || fallback.colorInkSoft,
    bg: asString(t.bg).slice(0, 40) || fallback.bg,
    glass: asString(t.glass).slice(0, 60) || fallback.glass,
    glass2: asString(t.glass2).slice(0, 60) || fallback.glass2,
    glassStrong: asString(t.glassStrong).slice(0, 60) || fallback.glassStrong,
    colorBorder: asString(t.colorBorder).slice(0, 60) || fallback.colorBorder,
    colorBorder2: asString(t.colorBorder2).slice(0, 60) || fallback.colorBorder2,
    cardBg: asString(t.cardBg).slice(0, 60) || fallback.cardBg,
    cardBorder: asString(t.cardBorder).slice(0, 60) || fallback.cardBorder,
    cardText: asString(t.cardText).slice(0, 40) || fallback.cardText,
    radiusXl: asString(t.radiusXl).slice(0, 20) || fallback.radiusXl,
    radiusLg: asString(t.radiusLg).slice(0, 20) || fallback.radiusLg,
    fontFamily: asString(t.fontFamily).slice(0, 120),
    fontWeight: asString(t.fontWeight).slice(0, 10),
    letterSpacing: asString(t.letterSpacing).slice(0, 20),
    layoutVars: sanitizeLayoutVars(t.layoutVars),
    layoutData: (() => {
      const ld = (t.layoutData && typeof t.layoutData === "object" && !Array.isArray(t.layoutData)) ? { ...(t.layoutData as Record<string, unknown>) } : {} as Record<string, unknown>;
      if (ld.avatarUrl !== undefined) ld.avatarUrl = sanitizeUrl(ld.avatarUrl);
      if (ld.bannerUrl !== undefined) ld.bannerUrl = sanitizeUrl(ld.bannerUrl);
      return ld;
    })(),
  };
};

export const sanitizeModel = (input: unknown): SiteModel => {
  const obj = migrateToLatest(input);

  const profile: Profile = {
    displayName: asString(obj.profile?.displayName).slice(0, 80),
    tagline: asString(obj.profile?.tagline).slice(0, 140),
    faviconUrl: sanitizeUrl(obj.profile?.faviconUrl) || "/pwa-logo.png",
    ogImageUrl: sanitizeUrl(obj.profile?.ogImageUrl) || "/pwa-logo.png",
  };

  // ── Collections ─────────────────────────────────────────────────
  const rawCollections = obj.collections && typeof obj.collections === "object" ? obj.collections : {};

  const sanitizeCollectionMeta = (raw: unknown, defaults: ContentCollection): ContentCollection => {
    const c = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    return {
      enabled: typeof c.enabled === "boolean" ? c.enabled : defaults.enabled,
      label: asString(c.label).slice(0, 30),
      icon: asString(c.icon).slice(0, 60),
      searchEnabled: typeof c.searchEnabled === "boolean" ? c.searchEnabled : defaults.searchEnabled,
      items: Array.isArray(c.items) ? c.items : [],
    };
  };

  // Links — generic passthrough (schema owned by theme)
  // All collections are sanitized via a data-driven loop. The only
  // per-key variance is the default `enabled` value and whether the
  // collection is externally managed (items emptied).
  const enabledByDefault: Record<string, boolean> = {
    socials: true,
    links: true,
    embeds: true,
  };

  // External collections have their items[] emptied — the real data
  // lives in markdown files / Supabase / etc.
  // At build time, Vite injects this list via `define`; at runtime we
  // fall back to the hard default.
  const externalKeys: ReadonlySet<string> =
    typeof __PK_EXTERNAL_COLLECTIONS__ !== "undefined"
      ? new Set(__PK_EXTERNAL_COLLECTIONS__)
      : new Set(["blog", "newsletter", "docs"]);

  const allKeys = new Set([
    ...Object.keys(enabledByDefault),
    ...Object.keys(rawCollections as Record<string, unknown>),
    // Ensure well-known keys always exist even when absent from raw data
    "gallery", "resume", "blog", "widgets", "newsletter", "docs",
  ]);

  const collections: Record<string, ContentCollection> = {};
  for (const key of allKeys) {
    const enabled = enabledByDefault[key] ?? false;
    collections[key] = sanitizeCollectionMeta(
      (rawCollections as Record<string, unknown>)[key],
      defaultCollection(enabled),
    );
    if (externalKeys.has(key)) {
      collections[key].items = [];
    }
  }

  const theme = sanitizeTheme(obj.theme, defaultTheme());

  // Sanitize per-layout theme storage
  const layoutThemesRaw = obj.layoutThemes && typeof obj.layoutThemes === "object" ? obj.layoutThemes : {};
  const layoutDefaults: Record<string, () => ThemeConfig> = { default: defaultTheme };
  const layoutThemes: Record<string, ThemeConfig> = {};
  for (const [key, factory] of Object.entries(layoutDefaults)) {
    layoutThemes[key] = sanitizeTheme((layoutThemesRaw as any)[key], factory());
  }
  for (const [key, val] of Object.entries(layoutThemesRaw as Record<string, unknown>)) {
    if (!layoutThemes[key]) layoutThemes[key] = sanitizeTheme(val, defaultTheme());
  }
  // Keep layoutThemes in sync with active theme
  layoutThemes[theme.layout] = { ...theme };

  const scriptsRaw = obj.scripts && typeof obj.scripts === "object" ? obj.scripts : {};
  const scripts: Scripts = {
    headScript: asString(scriptsRaw.headScript).slice(0, 10000),
    bodyEndScript: asString(scriptsRaw.bodyEndScript).slice(0, 10000),
  };

  return { schemaVersion: CURRENT_SCHEMA_VERSION, profile, collections, theme, layoutThemes, scripts };
};

export const stableStringify = (model: SiteModel) => JSON.stringify(model, null, 2);