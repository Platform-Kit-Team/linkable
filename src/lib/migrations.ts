/**
 * Schema migration pipeline for Linkable content JSON.
 *
 * HOW IT WORKS
 * ────────────
 * Every persisted BioModel carries a `schemaVersion` number.
 * When the app loads data whose version is behind `CURRENT_SCHEMA_VERSION`,
 * each registered migration runs in sequence to bring it up to date.
 *
 * HOW TO ADD A MIGRATION
 * ──────────────────────
 * 1. Bump `CURRENT_SCHEMA_VERSION` by one.
 * 2. Add a new entry to the `migrations` array below:
 *
 *      { toVersion: 3, migrate: (data) => { ... return data; } }
 *
 *    The `migrate` function receives the raw JSON object (already at the
 *    previous version) and must return it mutated/upgraded to `toVersion`.
 *
 * 3. `sanitizeModel()` calls `migrateToLatest()` before sanitising, so
 *    the rest of the app never sees stale shapes.
 *
 * VERSION HISTORY
 * ───────────────
 * 0 → 1  Initial schema. Adds `profile.bannerUrl` if missing.
 *        Ensures `schemaVersion` field exists.
 * 1 → 2  (reserved for future use — add the next migration here)
 */

// ── current version ──────────────────────────────────────────────────

export const CURRENT_SCHEMA_VERSION = 25;

// ── migration registry ──────────────────────────────────────────────

type Migration = {
  /** The version this migration upgrades TO. */
  toVersion: number;
  /** Mutate the raw data object in-place and return it. */
  migrate: (data: Record<string, any>) => Record<string, any>;
};

/**
 * Ordered list of migrations.  Each entry upgrades from `toVersion - 1`
 * to `toVersion`.  They MUST be listed in ascending `toVersion` order.
 */
const migrations: Migration[] = [
  {
    toVersion: 1,
    migrate: (data) => {
      // v0 → v1: ensure profile.bannerUrl exists (added alongside the
      // banner-image feature) and normalise the email social type.
      if (data.profile && typeof data.profile === "object") {
        if (!("bannerUrl" in data.profile)) {
          data.profile.bannerUrl = "";
        }
      }
      data.schemaVersion = 1;
      return data;
    },
  },

  // ── future migrations go here ──────────────────────────────────────
  {
    toVersion: 2,
    migrate: (data) => {
      // v1 → v2: add resume section with sensible defaults
      if (!data.resume || typeof data.resume !== "object") {
        data.resume = {
          enabled: false,
          bio: "",
          education: [],
          employment: [],
          skills: [],
        };
      }
      data.schemaVersion = 2;
      return data;
    },
  },

  {
    toVersion: 3,
    migrate: (data) => {
      // v2 → v3: add gallery section with sensible defaults
      if (!data.gallery || typeof data.gallery !== "object") {
        data.gallery = {
          enabled: false,
          items: [],
        };
      }
      data.schemaVersion = 3;
      return data;
    },
  },

  {
    toVersion: 4,
    migrate: (data) => {
      // v3 → v4: add achievements array to resume
      if (data.resume && typeof data.resume === "object") {
        if (!Array.isArray(data.resume.achievements)) {
          data.resume.achievements = [];
        }
      }
      data.schemaVersion = 4;
      return data;
    },
  },

  {
    toVersion: 5,
    migrate: (data) => {
      // v4 → v5: add theme object with default CSS variable values
      if (!data.theme || typeof data.theme !== "object") {
        data.theme = {
          colorBrand: "#3b82f6",
          colorBrandStrong: "#2563eb",
          colorAccent: "#ff5a7a",
          colorInk: "#0b1220",
          colorInkSoft: "rgba(11, 18, 32, 0.62)",
          bg: "#f5f7fb",
        };
      }
      data.schemaVersion = 5;
      return data;
    },
  },

  {
    toVersion: 6,
    migrate: (data) => {
      // v5 → v6: add glass, border, and radius fields to theme
      if (data.theme && typeof data.theme === "object") {
        data.theme.glass ??= "rgba(255, 255, 255, 0.66)";
        data.theme.glass2 ??= "rgba(255, 255, 255, 0.52)";
        data.theme.glassStrong ??= "rgba(255, 255, 255, 0.82)";
        data.theme.colorBorder ??= "rgba(255, 255, 255, 0.62)";
        data.theme.colorBorder2 ??= "rgba(11, 18, 32, 0.10)";
        data.theme.radiusXl ??= "1.6rem";
        data.theme.radiusLg ??= "1.2rem";
      }
      data.schemaVersion = 6;
      return data;
    },
  },

  {
    toVersion: 7,
    migrate: (data) => {
      // v6 → v7: add section label overrides to profile
      if (data.profile && typeof data.profile === "object") {
        data.profile.linksLabel ??= "";
        data.profile.resumeLabel ??= "";
        data.profile.galleryLabel ??= "";
      }
      data.schemaVersion = 7;
      return data;
    },
  },

  {
    toVersion: 8,
    migrate: (data) => {
      // v7 → v8: add preset field to theme
      if (data.theme && typeof data.theme === "object") {
        data.theme.preset ??= "light";
      }
      data.schemaVersion = 8;
      return data;
    },
  },

  {
    toVersion: 9,
    migrate: (data) => {
      // v8 → v9: add blog section and blogLabel to profile
      if (!data.blog || typeof data.blog !== "object") {
        data.blog = { enabled: false };
      }
      if (data.profile && typeof data.profile === "object") {
        data.profile.blogLabel ??= "";
      }
      data.schemaVersion = 9;
      return data;
    },
  },

  {
    toVersion: 10,
    migrate: (data) => {
      // v9 → v10: add search toggles (links, gallery, blog) to profile
      if (data.profile && typeof data.profile === "object") {
        data.profile.searchLinks ??= false;
        data.profile.searchGallery ??= false;
        data.profile.searchBlog ??= false;
      }
      data.schemaVersion = 10;
      return data;
    },
  },

  {
    toVersion: 11,
    migrate: (data) => {
      // v10 → v11: add tags array to gallery items
      if (data.gallery && typeof data.gallery === "object" && Array.isArray(data.gallery.items)) {
        for (const item of data.gallery.items) {
          if (!Array.isArray(item.tags)) {
            item.tags = [];
          }
        }
      }
      data.schemaVersion = 11;
      return data;
    },
  },

  {
    toVersion: 12,
    migrate: (data) => {
      // v11 → v12: add scripts object for custom JS injection (head / body-end)
      if (!data.scripts || typeof data.scripts !== "object") {
        data.scripts = { headScript: "", bodyEndScript: "" };
      }
      data.schemaVersion = 12;
      return data;
    },
  },

  {
    toVersion: 13,
    migrate: (data) => {
      // v12 → v13: replace social "type" field with "icon" (Lucide icon name).
      // Map old type values to their Lucide equivalents.
      const typeToIcon: Record<string, string> = {
        instagram: "Instagram",
        x: "Twitter",
        youtube: "Youtube",
        tiktok: "Clapperboard",
        github: "Github",
        email: "Mail",
        website: "Globe",
      };
      if (Array.isArray(data.socials)) {
        for (const s of data.socials) {
          if (s.type && !s.icon) {
            s.icon = typeToIcon[s.type] || "Globe";
          }
          delete s.type;
        }
      }
      data.schemaVersion = 13;
      return data;
    },
  },

  {
    toVersion: 14,
    migrate: (data) => {
      // v13 → v14: add tags array to links.
      if (Array.isArray(data.links)) {
        for (const l of data.links) {
          if (!Array.isArray(l.tags)) {
            l.tags = [];
          }
        }
      }
      data.schemaVersion = 14;
      return data;
    },
  },

  {
    toVersion: 15,
    migrate: (data) => {
      // v14 → v15: add card-item CSS variable fields to theme.
      if (data.theme && typeof data.theme === "object") {
        if (!data.theme.cardBg) data.theme.cardBg = "";
        if (!data.theme.cardBorder) data.theme.cardBorder = "";
        if (!data.theme.cardText) data.theme.cardText = "";
      }
      data.schemaVersion = 15;
      return data;
    },
  },

  {
    toVersion: 16,
    migrate: (data) => {
      // v15 → v16: add defaultTab to profile.
      if (data.profile && typeof data.profile === "object") {
        if (!data.profile.defaultTab) data.profile.defaultTab = "links";
      }
      data.schemaVersion = 16;
      return data;
    },
  },

  {
    toVersion: 17,
    migrate: (data) => {
      // v16 → v17: add embeds array for arbitrary HTML embed tabs.
      if (!Array.isArray(data.embeds)) {
        data.embeds = [];
      }
      data.schemaVersion = 17;
      return data;
    },
  },

  {
    toVersion: 18,
    migrate: (data) => {
      // v17 → v18: add faviconUrl and ogImageUrl to profile.
      if (data.profile && typeof data.profile === "object") {
        data.profile.faviconUrl ??= "";
        data.profile.ogImageUrl ??= "";
      }
      data.schemaVersion = 18;
      return data;
    },
  },

  {
    toVersion: 19,
    migrate: (data) => {
      // v18 → v19: add per-tab icon fields to profile.
      if (data.profile && typeof data.profile === "object") {
        data.profile.linksIcon ??= "";
        data.profile.resumeIcon ??= "";
        data.profile.galleryIcon ??= "";
        data.profile.blogIcon ??= "";
      }
      data.schemaVersion = 19;
      return data;
    },
  },

  {
    toVersion: 20,
    migrate: (data) => {
      // v19 → v20: add publishDate and expirationDate to links, gallery items, and embeds.
      if (Array.isArray(data.links)) {
        for (const l of data.links) {
          l.publishDate ??= "";
          l.expirationDate ??= "";
        }
      }
      if (data.gallery && Array.isArray(data.gallery.items)) {
        for (const item of data.gallery.items) {
          item.publishDate ??= "";
          item.expirationDate ??= "";
        }
      }
      if (Array.isArray(data.embeds)) {
        for (const e of data.embeds) {
          e.publishDate ??= "";
          e.expirationDate ??= "";
        }
      }
      data.schemaVersion = 20;
      return data;
    },
  },
  {
    toVersion: 21,
    migrate: (data: Record<string, any>) => {
      if (!data.profile) data.profile = {};
      data.profile.newsletterEnabled ??= false;
      data.schemaVersion = 21;
      return data;
    },
  },
  {
    toVersion: 22,
    migrate: (data: Record<string, any>) => {
      if (!data.profile) data.profile = {};
      data.profile.searchNewsletter ??= false;
      data.schemaVersion = 22;
      return data;
    },
  },
  {
    toVersion: 23,
    migrate: (data: Record<string, any>) => {
      if (!data.profile) data.profile = {};
      data.profile.newsletterLabel ??= "";
      data.profile.newsletterIcon ??= "";
      data.schemaVersion = 23;
      return data;
    },
  },
  {
    toVersion: 24,
    migrate: (data: Record<string, any>) => {
      if (!data.theme) data.theme = {};
      data.theme.layout ??= "default";
      data.schemaVersion = 24;
      return data;
    },
  },
  {
    toVersion: 25,
    migrate: (data: Record<string, any>) => {
      if (!data.theme) data.theme = {};
      data.theme.layoutVars ??= {};
      data.schemaVersion = 25;
      return data;
    },
  },
];

// ── public API ───────────────────────────────────────────────────────

/**
 * Detect schema version of a raw JSON payload.
 * Data created before versioning was introduced has no `schemaVersion`
 * field and is treated as version 0.
 */
export const detectVersion = (data: unknown): number => {
  if (data && typeof data === "object" && "schemaVersion" in data) {
    const v = (data as Record<string, unknown>).schemaVersion;
    return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  }
  return 0;
};

/**
 * Run all necessary migrations to bring `data` from its current version
 * up to `CURRENT_SCHEMA_VERSION`.  Returns the (mutated) data object.
 *
 * Safe to call even if the data is already at the latest version — it
 * will simply be a no-op.
 */
export const migrateToLatest = (data: unknown): Record<string, any> => {
  const obj = (data && typeof data === "object" ? data : {}) as Record<string, any>;
  let version = detectVersion(obj);

  if (version >= CURRENT_SCHEMA_VERSION) {
    // Already current (or somehow ahead) — nothing to do.
    obj.schemaVersion = CURRENT_SCHEMA_VERSION;
    return obj;
  }

  for (const m of migrations) {
    if (m.toVersion <= version) continue; // already past this migration
    if (m.toVersion > CURRENT_SCHEMA_VERSION) break; // safety: don't run future migrations

    try {
      m.migrate(obj);
      version = m.toVersion;
    } catch (err) {
      console.warn(`[Linkable] Migration to v${m.toVersion} failed:`, err);
      // Stop migrating on failure — sanitizeModel will fill in defaults
      break;
    }
  }

  obj.schemaVersion = CURRENT_SCHEMA_VERSION;
  return obj;
};
