export type SocialType =
  | "website"
  | "instagram"
  | "x"
  | "youtube"
  | "tiktok"
  | "github"
  | "email";

export type BioLink = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  imageUrl: string; // optional
  enabled: boolean;
};

export type SocialLink = {
  id: string;
  type: SocialType;
  label: string;
  url: string;
  enabled: boolean;
};

export type BioProfile = {
  displayName: string;
  tagline: string;
  avatarUrl: string;
  bannerUrl: string;
  linksLabel: string;
  resumeLabel: string;
  galleryLabel: string;
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

export type BioResume = {
  enabled: boolean;
  bio: string;
  education: EducationEntry[];
  employment: EmploymentEntry[];
  skills: string[];
  achievements: AchievementEntry[];
};

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
  enabled: boolean;
};

export type BioGallery = {
  enabled: boolean;
  items: GalleryItem[];
};

export type BioTheme = {
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
  radiusXl: string;
  radiusLg: string;
};

export type BioModel = {
  schemaVersion: number;
  profile: BioProfile;
  links: BioLink[];
  socials: SocialLink[];
  resume: BioResume;
  gallery: BioGallery;
  theme: BioTheme;
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
});

export const newSocial = (): SocialLink => ({
  id: newId(),
  type: "website",
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

export const defaultResume = (): BioResume => ({
  enabled: false,
  bio: "",
  education: [],
  employment: [],
  skills: [],
  achievements: [],
});

export const newGalleryItem = (): GalleryItem => ({
  id: newId(),
  type: "image",
  src: "",
  coverUrl: "",
  title: "",
  description: "",
  enabled: true,
});

export const defaultGallery = (): BioGallery => ({
  enabled: false,
  items: [],
});

export const defaultTheme = (): BioTheme => ({
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
  radiusXl: "1.6rem",
  radiusLg: "1.2rem",
});

export const defaultModel = (): BioModel => ({
  schemaVersion: 1,
  profile: {
    displayName: "Linkable",
    tagline: "Design-forward links. Clean, fast, yours.",
    avatarUrl: "",
    bannerUrl: "",
    linksLabel: "",
    resumeLabel: "",
    galleryLabel: "",
  },
  links: [
    {
      id: newId(),
      title: "My portfolio",
      subtitle: "Selected work & case studies",
      url: "https://example.com",
      imageUrl: "",
      enabled: true,
    },
    {
      id: newId(),
      title: "Book a call",
      subtitle: "15 minutes to see if we fit",
      url: "https://example.com",
      imageUrl: "",
      enabled: true,
    },
    {
      id: newId(),
      title: "Shop presets",
      subtitle: "UI kits, templates, packs",
      url: "https://example.com",
      imageUrl: "",
      enabled: true,
    },
  ],
  socials: [
    {
      id: newId(),
      type: "instagram",
      label: "@linkable",
      url: "https://instagram.com",
      enabled: true,
    },
    {
      id: newId(),
      type: "github",
      label: "github.com/linkable",
      url: "https://github.com",
      enabled: false,
    },
  ],
  resume: defaultResume(),
  gallery: defaultGallery(),
  theme: defaultTheme(),
});

const asString = (v: unknown) => (typeof v === "string" ? v : "");
const asBool = (v: unknown) => (typeof v === "boolean" ? v : false);

const sanitizeUrl = (v: unknown) => {
  const raw = asString(v).trim();
  if (!raw) return "";

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

const socialSet: SocialType[] = [
  "website",
  "instagram",
  "x",
  "youtube",
  "tiktok",
  "github",
  "email",
];

const asSocialType = (v: unknown): SocialType =>
  (socialSet.includes(v as SocialType) ? (v as SocialType) : "website");

import { migrateToLatest, CURRENT_SCHEMA_VERSION } from "./migrations";

export const sanitizeModel = (input: unknown): BioModel => {
  const obj = migrateToLatest(input);

  const profile: BioProfile = {
    displayName: asString(obj.profile?.displayName).slice(0, 80),
    tagline: asString(obj.profile?.tagline).slice(0, 140),
    avatarUrl: sanitizeUrl(obj.profile?.avatarUrl),
    bannerUrl: sanitizeUrl(obj.profile?.bannerUrl),
    linksLabel: asString(obj.profile?.linksLabel).slice(0, 30),
    resumeLabel: asString(obj.profile?.resumeLabel).slice(0, 30),
    galleryLabel: asString(obj.profile?.galleryLabel).slice(0, 30),
  };

  const linksRaw = Array.isArray(obj.links) ? obj.links : [];
  const links: BioLink[] = linksRaw
    .map((l: any) => ({
      id: asString(l?.id) || newId(),
      title: asString(l?.title).slice(0, 60),
      subtitle: asString(l?.subtitle).slice(0, 90),
      url: sanitizeUrl(l?.url),
      imageUrl: sanitizeUrl(l?.imageUrl),
      enabled: typeof l?.enabled === "boolean" ? l.enabled : true,
    }))
    .filter((l: BioLink) => !!l.id)
    .slice(0, 60);

  const socialsRaw = Array.isArray(obj.socials) ? obj.socials : [];
  const socials: SocialLink[] = socialsRaw
    .map((s: any) => ({
      id: asString(s?.id) || newId(),
      type: asSocialType(s?.type),
      label: asString(s?.label).slice(0, 60),
      url: sanitizeUrl(s?.url),
      enabled: asBool(s?.enabled),
    }))
    .filter((s: SocialLink) => !!s.id)
    .slice(0, 24);

  const resumeRaw = obj.resume && typeof obj.resume === "object" ? obj.resume : {};
  const resume: BioResume = {
    enabled: typeof resumeRaw.enabled === "boolean" ? resumeRaw.enabled : false,
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

  const galleryItemTypes: GalleryItemType[] = ["image", "video"];
  const asGalleryItemType = (v: unknown): GalleryItemType =>
    galleryItemTypes.includes(v as GalleryItemType) ? (v as GalleryItemType) : "image";

  const galleryRaw = obj.gallery && typeof obj.gallery === "object" ? obj.gallery : {};
  const gallery: BioGallery = {
    enabled: typeof galleryRaw.enabled === "boolean" ? galleryRaw.enabled : false,
    items: (Array.isArray(galleryRaw.items) ? galleryRaw.items : [])
      .map((g: any) => ({
        id: asString(g?.id) || newId(),
        type: asGalleryItemType(g?.type),
        src: asString(g?.src).slice(0, 500),
        coverUrl: sanitizeUrl(g?.coverUrl),
        title: asString(g?.title).slice(0, 120),
        description: asString(g?.description).slice(0, 500),
        enabled: typeof g?.enabled === "boolean" ? g.enabled : true,
      }))
      .filter((g: GalleryItem) => !!g.id)
      .slice(0, 100),
  };

  const themeRaw = obj.theme && typeof obj.theme === "object" ? obj.theme : {};
  const defaults = defaultTheme();
  const theme: BioTheme = {
    colorBrand: asString(themeRaw.colorBrand).slice(0, 40) || defaults.colorBrand,
    colorBrandStrong: asString(themeRaw.colorBrandStrong).slice(0, 40) || defaults.colorBrandStrong,
    colorAccent: asString(themeRaw.colorAccent).slice(0, 40) || defaults.colorAccent,
    colorInk: asString(themeRaw.colorInk).slice(0, 40) || defaults.colorInk,
    colorInkSoft: asString(themeRaw.colorInkSoft).slice(0, 60) || defaults.colorInkSoft,
    bg: asString(themeRaw.bg).slice(0, 40) || defaults.bg,
    glass: asString(themeRaw.glass).slice(0, 60) || defaults.glass,
    glass2: asString(themeRaw.glass2).slice(0, 60) || defaults.glass2,
    glassStrong: asString(themeRaw.glassStrong).slice(0, 60) || defaults.glassStrong,
    colorBorder: asString(themeRaw.colorBorder).slice(0, 60) || defaults.colorBorder,
    colorBorder2: asString(themeRaw.colorBorder2).slice(0, 60) || defaults.colorBorder2,
    radiusXl: asString(themeRaw.radiusXl).slice(0, 20) || defaults.radiusXl,
    radiusLg: asString(themeRaw.radiusLg).slice(0, 20) || defaults.radiusLg,
  };

  return { schemaVersion: CURRENT_SCHEMA_VERSION, profile, links, socials, resume, gallery, theme };
};

export const stableStringify = (model: BioModel) => JSON.stringify(model, null, 2);