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

export const CURRENT_SCHEMA_VERSION = 7;

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
