export type SocialType =
  | "website"
  | "instagram"
  | "x"
  | "youtube"
  | "tiktok"
  | "github";

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
};

export type BioModel = {
  profile: BioProfile;
  links: BioLink[];
  socials: SocialLink[];
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

export const defaultModel = (): BioModel => ({
  profile: {
    displayName: "Linkable",
    tagline: "Design-forward links. Clean, fast, yours.",
    avatarUrl: "",
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
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
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
];

const asSocialType = (v: unknown): SocialType =>
  (socialSet.includes(v as SocialType) ? (v as SocialType) : "website");

export const sanitizeModel = (input: unknown): BioModel => {
  const obj = (input ?? {}) as any;

  const profile: BioProfile = {
    displayName: asString(obj.profile?.displayName).slice(0, 80),
    tagline: asString(obj.profile?.tagline).slice(0, 140),
    avatarUrl: sanitizeUrl(obj.profile?.avatarUrl),
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

  return { profile, links, socials };
};

export const stableStringify = (model: BioModel) => JSON.stringify(model, null, 2);