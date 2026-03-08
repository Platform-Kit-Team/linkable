export type BioLink = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  imageUrl: string; // optional
  enabled: boolean;
  tags: string[];
  publishDate: string; // ISO date, e.g. "2025-06-01" — not visible before this date
  expirationDate: string; // ISO date — not visible after this date
};

export type SocialLink = {
  id: string;
  icon: string;
  label: string;
  url: string;
  enabled: boolean;
};

export type BioProfile = {
  displayName: string;
  tagline: string;
  faviconUrl: string;
  ogImageUrl: string;
};

export type EducationEntry = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
};

export type EmploymentEntry = {
  id: string;
  company: string;
  role: string;
  description: string;
  startYear: string;
  endYear: string;
};

export type AchievementEntry = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
};

export type ResumeData = {
  bio: string;
  education: EducationEntry[];
  employment: EmploymentEntry[];
  skills: string[];
  achievements: AchievementEntry[];
};

/** @deprecated Use ResumeData instead — enabled flag now lives on ContentCollection */
export type BioResume = ResumeData & { enabled?: boolean };

export type GalleryItemType = "image" | "video";

export type GalleryItem = {
  id: string;
  type: GalleryItemType;
  /** Upload path for images/mp4s, or a YouTube/Vimeo URL */
  src: string;
  /** Optional cover/thumbnail image (used for video poster) */
  coverUrl: string;
  title: string;
  description: string;
  tags: string[];
  enabled: boolean;
  publishDate: string;
  expirationDate: string;
};

/** @deprecated Gallery is now a ContentCollection — use model.collections.gallery */
export type BioGallery = {
  enabled: boolean;
  items: GalleryItem[];
};

export type ThemePreset = string;

export type BioTheme = {
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
  layoutVars: Record<string, string>;
  layoutData: Record<string, unknown>;
};

/** @deprecated Blog is now a ContentCollection — use model.collections.blog */
export type BioBlog = {
  enabled: boolean;
};

export type EmbedItem = {
  id: string;
  label: string;
  html: string;
  icon: string;
  enabled: boolean;
  publishDate: string;
  expirationDate: string;
};

export type BioScripts = {
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

export type BioModel = {
  schemaVersion: number;
  profile: BioProfile;
  collections: Record<string, ContentCollection>;
  theme: BioTheme;
  layoutThemes: Record<string, BioTheme>;
  scripts: BioScripts;
};

export const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 40);

export const newLink = (): BioLink => ({
  id: newId(),
  title: "New link",
  subtitle: "",
  url: "https://",
  imageUrl: "",
  enabled: true,
  tags: [],
  publishDate: "",
  expirationDate: "",
});

export const newSocial = (): SocialLink => ({
  id: newId(),
  icon: "Globe",
  label: "",
  url: "",
  enabled: false,
});

export const newEducation = (): EducationEntry => ({
  id: newId(),
  institution: "",
  degree: "",
  field: "",
  startYear: "",
  endYear: "",
});

export const newEmployment = (): EmploymentEntry => ({
  id: newId(),
  company: "",
  role: "",
  description: "",
  startYear: "",
  endYear: "",
});

export const newAchievement = (): AchievementEntry => ({
  id: newId(),
  title: "",
  issuer: "",
  year: "",
  description: "",
});

export const defaultResumeData = (): ResumeData => ({
  bio: "",
  education: [],
  employment: [],
  skills: [],
  achievements: [],
});

/** @deprecated Use defaultResumeData() instead */
export const defaultResume = (): ResumeData & { enabled: boolean } => ({
  enabled: false,
  ...defaultResumeData(),
});

export const newGalleryItem = (): GalleryItem => ({
  id: newId(),
  type: "image",
  src: "",
  coverUrl: "",
  title: "",
  description: "",
  tags: [],
  enabled: true,
  publishDate: "",
  expirationDate: "",
});

/** @deprecated Gallery is now a ContentCollection */
export const defaultGallery = (): BioGallery => ({
  enabled: false,
  items: [],
});

/** @deprecated Blog is now a ContentCollection */
export const defaultBlog = (): BioBlog => ({
  enabled: false,
});

export const defaultCollection = (enabled = false): ContentCollection => ({
  enabled,
  label: "",
  icon: "",
  searchEnabled: false,
  items: [],
});

export const defaultTheme = (): BioTheme => ({
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
  layoutVars: {},
  layoutData: {},
});

export const darkTheme = (): BioTheme => ({
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
  layoutVars: {},
  layoutData: {},
});

export const THEME_PRESETS: Record<string, () => BioTheme> = {
  light: defaultTheme,
  dark: darkTheme,
};

export const newEmbed = (): EmbedItem => ({
  id: newId(),
  label: "New Embed",
  html: "",
  icon: "Code",
  enabled: true,
  publishDate: "",
  expirationDate: "",
});

export const defaultScripts = (): BioScripts => ({
  headScript: "",
  bodyEndScript: "",
});

export const defaultModel = (): BioModel => ({
  schemaVersion: 1,
  profile: {
    displayName: "Linkable",
    tagline: "Design-forward links. Clean, fast, yours.",
    faviconUrl: "",
    ogImageUrl: "",
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
    gallery: defaultCollection(),
    resume: {
      ...defaultCollection(),
      items: [defaultResumeData()],
    },
    blog: defaultCollection(),
    embeds: defaultCollection(true),
    newsletter: defaultCollection(),
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
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") return u.toString();
    return "";
  } catch {
    return "";  
  }
};

import { migrateToLatest, CURRENT_SCHEMA_VERSION } from "./migrations";

const sanitizeTheme = (raw: unknown, fallback: BioTheme): BioTheme => {
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
    layoutVars: sanitizeLayoutVars(t.layoutVars),
    layoutData: (() => {
      const ld = (t.layoutData && typeof t.layoutData === "object" && !Array.isArray(t.layoutData)) ? { ...(t.layoutData as Record<string, unknown>) } : {} as Record<string, unknown>;
      if (ld.avatarUrl !== undefined) ld.avatarUrl = sanitizeUrl(ld.avatarUrl);
      if (ld.bannerUrl !== undefined) ld.bannerUrl = sanitizeUrl(ld.bannerUrl);
      return ld;
    })(),
  };
};

export const sanitizeModel = (input: unknown): BioModel => {
  const obj = migrateToLatest(input);

  const profile: BioProfile = {
    displayName: asString(obj.profile?.displayName).slice(0, 80),
    tagline: asString(obj.profile?.tagline).slice(0, 140),
    faviconUrl: sanitizeUrl(obj.profile?.faviconUrl),
    ogImageUrl: sanitizeUrl(obj.profile?.ogImageUrl),
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

  // Links
  const linksCol = sanitizeCollectionMeta(rawCollections.links, defaultCollection(true));
  const links: BioLink[] = linksCol.items
    .map((l: any) => ({
      id: asString(l?.id) || newId(),
      title: asString(l?.title).slice(0, 60),
      subtitle: asString(l?.subtitle).slice(0, 90),
      url: sanitizeUrl(l?.url),
      imageUrl: sanitizeUrl(l?.imageUrl),
      enabled: typeof l?.enabled === "boolean" ? l.enabled : true,
      tags: Array.isArray(l?.tags) ? l.tags.filter((t: any) => typeof t === 'string').slice(0, 20) : [],
      publishDate: asString(l?.publishDate).slice(0, 10),
      expirationDate: asString(l?.expirationDate).slice(0, 10),
    }))
    .filter((l: BioLink) => !!l.id)
    .slice(0, 60);
  linksCol.items = links;

  // Gallery
  const galleryItemTypes: GalleryItemType[] = ["image", "video"];
  const asGalleryItemType = (v: unknown): GalleryItemType =>
    galleryItemTypes.includes(v as GalleryItemType) ? (v as GalleryItemType) : "image";

  const galleryCol = sanitizeCollectionMeta(rawCollections.gallery, defaultCollection());
  const galleryItems: GalleryItem[] = galleryCol.items
    .map((g: any) => ({
      id: asString(g?.id) || newId(),
      type: asGalleryItemType(g?.type),
      src: asString(g?.src).slice(0, 500),
      coverUrl: sanitizeUrl(g?.coverUrl),
      title: asString(g?.title).slice(0, 120),
      description: asString(g?.description).slice(0, 500),
      tags: (Array.isArray(g?.tags) ? g.tags : [])
        .map((t: unknown) => asString(t).slice(0, 40))
        .filter(Boolean)
        .slice(0, 20),
      enabled: typeof g?.enabled === "boolean" ? g.enabled : true,
      publishDate: asString(g?.publishDate).slice(0, 10),
      expirationDate: asString(g?.expirationDate).slice(0, 10),
    }))
    .filter((g: GalleryItem) => !!g.id)
    .slice(0, 100);
  galleryCol.items = galleryItems;

  // Resume (singleton — items[0] is a ResumeData)
  const resumeCol = sanitizeCollectionMeta(rawCollections.resume, defaultCollection());
  const resumeRaw = resumeCol.items[0] && typeof resumeCol.items[0] === "object" ? resumeCol.items[0] as Record<string, any> : {};
  const resumeData: ResumeData = {
    bio: asString(resumeRaw.bio).slice(0, 2000),
    education: (Array.isArray(resumeRaw.education) ? resumeRaw.education : [])
      .map((e: any) => ({
        id: asString(e?.id) || newId(),
        institution: asString(e?.institution).slice(0, 120),
        degree: asString(e?.degree).slice(0, 120),
        field: asString(e?.field).slice(0, 120),
        startYear: asString(e?.startYear).slice(0, 10),
        endYear: asString(e?.endYear).slice(0, 10),
      }))
      .filter((e: EducationEntry) => !!e.id)
      .slice(0, 30),
    employment: (Array.isArray(resumeRaw.employment) ? resumeRaw.employment : [])
      .map((e: any) => ({
        id: asString(e?.id) || newId(),
        company: asString(e?.company).slice(0, 120),
        role: asString(e?.role).slice(0, 120),
        description: asString(e?.description).slice(0, 500),
        startYear: asString(e?.startYear).slice(0, 10),
        endYear: asString(e?.endYear).slice(0, 10),
      }))
      .filter((e: EmploymentEntry) => !!e.id)
      .slice(0, 30),
    skills: (Array.isArray(resumeRaw.skills) ? resumeRaw.skills : [])
      .map((s: unknown) => asString(s).slice(0, 60))
      .filter(Boolean)
      .slice(0, 50),
    achievements: (Array.isArray(resumeRaw.achievements) ? resumeRaw.achievements : [])
      .map((a: any) => ({
        id: asString(a?.id) || newId(),
        title: asString(a?.title).slice(0, 120),
        issuer: asString(a?.issuer).slice(0, 120),
        year: asString(a?.year).slice(0, 10),
        description: asString(a?.description).slice(0, 500),
      }))
      .filter((a: AchievementEntry) => !!a.id)
      .slice(0, 30),
  };
  resumeCol.items = [resumeData];

  // Blog (external storage — items stay empty)
  const blogCol = sanitizeCollectionMeta(rawCollections.blog, defaultCollection());
  blogCol.items = [];

  // Embeds
  const embedsCol = sanitizeCollectionMeta(rawCollections.embeds, defaultCollection(true));
  const embeds: EmbedItem[] = embedsCol.items
    .map((e: any) => ({
      id: asString(e?.id) || newId(),
      label: asString(e?.label).slice(0, 60) || "Embed",
      html: asString(e?.html).slice(0, 50000),
      icon: asString(e?.icon).slice(0, 60) || "Code",
      enabled: typeof e?.enabled === "boolean" ? e.enabled : true,
      publishDate: asString(e?.publishDate).slice(0, 10),
      expirationDate: asString(e?.expirationDate).slice(0, 10),
    }))
    .filter((e: EmbedItem) => !!e.id)
    .slice(0, 20);
  embedsCol.items = embeds;

  // Newsletter (external storage — Supabase-backed)
  const newsletterCol = sanitizeCollectionMeta(rawCollections.newsletter, defaultCollection());
  newsletterCol.items = [];

  // Socials (layout-provided collection)
  const socialsCol = sanitizeCollectionMeta(rawCollections.socials, defaultCollection(true));

  const collections: Record<string, ContentCollection> = {
    socials: socialsCol,
    links: linksCol,
    gallery: galleryCol,
    resume: resumeCol,
    blog: blogCol,
    embeds: embedsCol,
    newsletter: newsletterCol,
  };

  // Also preserve any extra collections from other layouts
  for (const [key, val] of Object.entries(rawCollections as Record<string, unknown>)) {
    if (!collections[key]) {
      collections[key] = sanitizeCollectionMeta(val, defaultCollection());
    }
  }

  const theme = sanitizeTheme(obj.theme, defaultTheme());

  // Sanitize per-layout theme storage
  const layoutThemesRaw = obj.layoutThemes && typeof obj.layoutThemes === "object" ? obj.layoutThemes : {};
  const layoutDefaults: Record<string, () => BioTheme> = { default: defaultTheme };
  const layoutThemes: Record<string, BioTheme> = {};
  for (const [key, factory] of Object.entries(layoutDefaults)) {
    layoutThemes[key] = sanitizeTheme((layoutThemesRaw as any)[key], factory());
  }
  for (const [key, val] of Object.entries(layoutThemesRaw as Record<string, unknown>)) {
    if (!layoutThemes[key]) layoutThemes[key] = sanitizeTheme(val, defaultTheme());
  }
  // Keep layoutThemes in sync with active theme
  layoutThemes[theme.layout] = { ...theme };

  const scriptsRaw = obj.scripts && typeof obj.scripts === "object" ? obj.scripts : {};
  const scripts: BioScripts = {
    headScript: asString(scriptsRaw.headScript).slice(0, 10000),
    bodyEndScript: asString(scriptsRaw.bodyEndScript).slice(0, 10000),
  };

  return { schemaVersion: CURRENT_SCHEMA_VERSION, profile, collections, theme, layoutThemes, scripts };
};

export const stableStringify = (model: BioModel) => JSON.stringify(model, null, 2);