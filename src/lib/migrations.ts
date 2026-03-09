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

export const CURRENT_SCHEMA_VERSION = 38;

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
  {
    toVersion: 26,
    migrate: (data: Record<string, any>) => {
      if (!data.theme) data.theme = {};
      const layout = data.theme.layout || "default";
      // Store the active theme under its layout key
      if (!data.layoutThemes || typeof data.layoutThemes !== "object") {
        data.layoutThemes = {};
      }
      data.layoutThemes[layout] = { ...data.theme };
      data.schemaVersion = 26;
      return data;
    },
  },
  {
    toVersion: 27,
    migrate: (data: Record<string, any>) => {
      // Add layoutData to theme and all layoutThemes entries
      if (!data.theme) data.theme = {};
      data.theme.layoutData ??= {};
      if (data.layoutThemes && typeof data.layoutThemes === "object") {
        for (const key of Object.keys(data.layoutThemes)) {
          if (data.layoutThemes[key] && typeof data.layoutThemes[key] === "object") {
            data.layoutThemes[key].layoutData ??= {};
          }
        }
      }
      data.schemaVersion = 27;
      return data;
    },
  },
  {
    toVersion: 28,
    migrate: (data: Record<string, any>) => {
      // v27 → v28: move top-level content into collections.
      const p = data.profile && typeof data.profile === "object" ? data.profile : ({} as any);
      const cols: Record<string, any> = data.collections && typeof data.collections === "object" ? data.collections : {};

      // links
      cols.links = {
        enabled: true,
        label: p.linksLabel ?? "",
        icon: p.linksIcon ?? "",
        searchEnabled: p.searchLinks ?? false,
        items: Array.isArray(data.links) ? data.links : [],
      };

      // gallery
      const gal = data.gallery && typeof data.gallery === "object" ? data.gallery : ({} as any);
      cols.gallery = {
        enabled: gal.enabled ?? false,
        label: p.galleryLabel ?? "",
        icon: p.galleryIcon ?? "",
        searchEnabled: p.searchGallery ?? false,
        items: Array.isArray(gal.items) ? gal.items : [],
      };

      // resume (singleton — stored as items[0])
      const res = data.resume && typeof data.resume === "object" ? data.resume : ({} as any);
      cols.resume = {
        enabled: res.enabled ?? false,
        label: p.resumeLabel ?? "",
        icon: p.resumeIcon ?? "",
        searchEnabled: false,
        items: [
          {
            bio: res.bio ?? "",
            education: Array.isArray(res.education) ? res.education : [],
            employment: Array.isArray(res.employment) ? res.employment : [],
            skills: Array.isArray(res.skills) ? res.skills : [],
            achievements: Array.isArray(res.achievements) ? res.achievements : [],
          },
        ],
      };

      // blog (external storage — items stay empty)
      const blog = data.blog && typeof data.blog === "object" ? data.blog : ({} as any);
      cols.blog = {
        enabled: blog.enabled ?? false,
        label: p.blogLabel ?? "",
        icon: p.blogIcon ?? "",
        searchEnabled: p.searchBlog ?? false,
        items: [],
      };

      // embeds
      cols.embeds = {
        enabled: true,
        label: "",
        icon: "",
        searchEnabled: false,
        items: Array.isArray(data.embeds) ? data.embeds : [],
      };

      // newsletter (external — Supabase-backed, items stay empty)
      cols.newsletter = {
        enabled: p.newsletterEnabled ?? false,
        label: p.newsletterLabel ?? "",
        icon: p.newsletterIcon ?? "",
        searchEnabled: p.searchNewsletter ?? false,
        items: [],
      };

      data.collections = cols;

      // Clean up profile — remove fields now on collections
      delete p.linksLabel;
      delete p.linksIcon;
      delete p.resumeLabel;
      delete p.resumeIcon;
      delete p.galleryLabel;
      delete p.galleryIcon;
      delete p.blogLabel;
      delete p.blogIcon;
      delete p.newsletterLabel;
      delete p.newsletterIcon;
      delete p.searchLinks;
      delete p.searchGallery;
      delete p.searchBlog;
      delete p.searchNewsletter;
      delete p.newsletterEnabled;

      // Remove old top-level content fields
      delete data.links;
      delete data.gallery;
      delete data.resume;
      delete data.blog;
      delete data.embeds;

      data.schemaVersion = 28;
      return data;
    },
  },
  // ── v29: Move socials from top-level array into collections.socials ──
  {
    toVersion: 29,
    migrate: (data: Record<string, any>) => {
      if (!data.collections) data.collections = {};
      const existing = data.collections.socials;
      const items = Array.isArray(data.socials) ? data.socials : [];
      data.collections.socials = {
        enabled: existing?.enabled ?? true,
        label: existing?.label ?? "",
        icon: existing?.icon ?? "",
        searchEnabled: false,
        items,
      };
      delete data.socials;
      data.schemaVersion = 29;
      return data;
    },
  },
  // ── v30: Move defaultTab from profile into theme.layoutData ──
  {
    toVersion: 30,
    migrate: (data: Record<string, any>) => {
      const dt = data.profile?.defaultTab;
      if (dt) {
        if (!data.theme) data.theme = {};
        if (!data.theme.layoutData || typeof data.theme.layoutData !== "object") data.theme.layoutData = {};
        if (!data.theme.layoutData.defaultTab) {
          data.theme.layoutData.defaultTab = dt;
        }
      }
      if (data.profile) delete data.profile.defaultTab;
      data.schemaVersion = 30;
      return data;
    },
  },
  // ── v31: Move avatarUrl/bannerUrl from profile into theme.layoutData ──
  {
    toVersion: 31,
    migrate: (data: Record<string, any>) => {
      if (!data.theme) data.theme = {};
      if (!data.theme.layoutData || typeof data.theme.layoutData !== "object") data.theme.layoutData = {};
      if (data.profile?.avatarUrl && !data.theme.layoutData.avatarUrl) {
        data.theme.layoutData.avatarUrl = data.profile.avatarUrl;
      }
      if (data.profile?.bannerUrl && !data.theme.layoutData.bannerUrl) {
        data.theme.layoutData.bannerUrl = data.profile.bannerUrl;
      }
      if (data.profile) {
        delete data.profile.avatarUrl;
        delete data.profile.bannerUrl;
      }
      data.schemaVersion = 31;
      return data;
    },
  },
  // ── v32: Add widgets collection for layout widgets ──
  {
    toVersion: 32,
    migrate: (data: Record<string, any>) => {
      if (!data.collections || typeof data.collections !== "object") {
        data.collections = {};
      }
      const existing = data.collections.widgets;
      data.collections.widgets = {
        enabled: existing?.enabled ?? false,
        label: existing?.label ?? "",
        icon: existing?.icon ?? "",
        searchEnabled: existing?.searchEnabled ?? false,
        items: Array.isArray(existing?.items) ? existing.items : [],
      };
      data.schemaVersion = 32;
      return data;
    },
  },
  // ── v33: Add widget style/preset settings defaults ──
  {
    toVersion: 33,
    migrate: (data: Record<string, any>) => {
      const items = data.collections?.widgets?.items;
      if (Array.isArray(items)) {
        for (const w of items) {
          if (!w || typeof w !== "object") continue;
          w.textColor ??= "#ffffff";
          w.backgroundColor ??= "";
          w.buttonColor ??= "#ffffff";
          w.buttonTextColor ??= "#0f172a";
          w.textPresetSpeed ??= 1;
          w.textPresetIntensity ??= 1;
          w.backgroundPresetSpeed ??= 1;
          w.backgroundPresetIntensity ??= 1;
          w.backgroundPresetScale ??= 1;
          w.pauseOnHover ??= false;
        }
      }
      data.schemaVersion = 33;
      return data;
    },
  },
  // ── v34: Add full Vue Bits per-variant widget settings ──
  {
    toVersion: 34,
    migrate: (data: Record<string, any>) => {
      const items = data.collections?.widgets?.items;
      if (Array.isArray(items)) {
        for (const w of items) {
          if (!w || typeof w !== "object") continue;
          w.shinyDisabled ??= false;
          w.shinySpeed ??= 2;
          w.shinyDelay ??= 0;
          w.shinySpread ??= 120;
          w.shinyDirection ??= "left";
          w.shinyYoyo ??= false;
          w.shinyPauseOnHover ??= false;
          w.shinyClassName ??= "";
          w.shinyColor ??= "#b5b5b5";
          w.shinyShineColor ??= "#ffffff";

          w.gradientClassName ??= "";
          w.gradientColors ??= "#27FF64,#27FF64,#A0FFBC";
          w.gradientAnimationSpeed ??= 8;
          w.gradientShowBorder ??= false;
          w.gradientDirection ??= "horizontal";
          w.gradientPauseOnHover ??= false;
          w.gradientYoyo ??= true;

          w.glitchClassName ??= "";
          w.glitchSpeed ??= 0.5;
          w.glitchEnableShadows ??= true;
          w.glitchEnableOnHover ??= false;

          w.blurClassName ??= "";
          w.blurDelay ??= 200;
          w.blurAnimateBy ??= "words";
          w.blurDirection ??= "top";
          w.blurThreshold ??= 0.1;
          w.blurRootMargin ??= "0px";
          w.blurStepDuration ??= 0.35;

          w.splitClassName ??= "";
          w.splitDelay ??= 50;
          w.splitDuration ??= 1.25;
          w.splitEase ??= "power3.out";
          w.splitType ??= "chars";
          w.splitThreshold ??= 0.1;
          w.splitRootMargin ??= "-100px";
          w.splitTag ??= "p";
          w.splitTextAlign ??= "center";
          w.splitFromJson ??= '{"opacity":0,"y":40}';
          w.splitToJson ??= '{"opacity":1,"y":0}';

          w.textTypeClassName ??= "";
          w.textTypeShowCursor ??= true;
          w.textTypeHideCursorWhileTyping ??= false;
          w.textTypeCursorCharacter ??= "_";
          w.textTypeCursorBlinkDuration ??= 0.5;
          w.textTypeCursorClassName ??= "";
          w.textTypeAs ??= "div";
          w.textTypeTypingSpeed ??= 75;
          w.textTypeInitialDelay ??= 0;
          w.textTypePauseDuration ??= 1500;
          w.textTypeDeletingSpeed ??= 50;
          w.textTypeLoop ??= true;
          w.textTypeTextList ??= "";
          w.textTypeTextColors ??= "";
          w.textTypeVariableSpeedEnabled ??= false;
          w.textTypeVariableSpeedMin ??= 60;
          w.textTypeVariableSpeedMax ??= 120;
          w.textTypeStartOnVisible ??= false;
          w.textTypeReverseMode ??= false;

          w.rotatingTexts ??= "Build\\nSomething\\nMemorable";
          w.rotatingTransitionJson ??= '{"type":"spring","damping":25,"stiffness":300}';
          w.rotatingInitialJson ??= '{"y":"100%","opacity":0}';
          w.rotatingAnimateJson ??= '{"y":0,"opacity":1}';
          w.rotatingExitJson ??= '{"y":"-120%","opacity":0}';
          w.rotatingAnimatePresenceMode ??= "wait";
          w.rotatingAnimatePresenceInitial ??= false;
          w.rotatingRotationInterval ??= 2000;
          w.rotatingStaggerDuration ??= 0;
          w.rotatingStaggerFrom ??= "first";
          w.rotatingLoop ??= true;
          w.rotatingAuto ??= true;
          w.rotatingSplitBy ??= "characters";
          w.rotatingMainClassName ??= "";
          w.rotatingSplitLevelClassName ??= "";
          w.rotatingElementLevelClassName ??= "";

          w.variableLabel ??= "Hover me!";
          w.variableFromFontVariationSettings ??= "'wght' 400, 'opsz' 9";
          w.variableToFontVariationSettings ??= "'wght' 1000, 'opsz' 40";
          w.variableRadius ??= 100;
          w.variableFalloff ??= "linear";
          w.variableClassName ??= "";
          w.variableStyleJson ??= "{}";
        }
      }
      data.schemaVersion = 34;
      return data;
    },
  },
  // ── v35: Add full per-background prop controls and blur animation JSON controls ──
  {
    toVersion: 35,
    migrate: (data: Record<string, any>) => {
      const items = data.collections?.widgets?.items;
      if (Array.isArray(items)) {
        for (const w of items) {
          if (!w || typeof w !== "object") continue;

          w.blurAnimationFromJson ??= '{"filter":"blur(10px)","opacity":0,"y":-50}';
          w.blurAnimationToJson ??= '[{"filter":"blur(5px)","opacity":0.5,"y":5},{"filter":"blur(0px)","opacity":1,"y":0}]';

          w.auroraColorStops ??= "#7cff67,#171D22,#7cff67";
          w.auroraAmplitude ??= 1;
          w.auroraBlend ??= 0.5;
          w.auroraTime ??= 0;
          w.auroraSpeed ??= 1;
          w.auroraIntensity ??= 1;
          w.auroraClassName ??= "";
          w.auroraStyleJson ??= "{}";

          w.colorBendsRotation ??= 45;
          w.colorBendsSpeed ??= 0.2;
          w.colorBendsColors ??= "";
          w.colorBendsTransparent ??= true;
          w.colorBendsAutoRotate ??= 0;
          w.colorBendsScale ??= 1;
          w.colorBendsFrequency ??= 1;
          w.colorBendsWarpStrength ??= 1;
          w.colorBendsMouseInfluence ??= 1;
          w.colorBendsParallax ??= 0.5;
          w.colorBendsNoise ??= 0.1;
          w.colorBendsClassName ??= "";
          w.colorBendsStyleJson ??= "{}";

          w.darkVeilHueShift ??= 0;
          w.darkVeilNoiseIntensity ??= 0;
          w.darkVeilScanlineIntensity ??= 0;
          w.darkVeilSpeed ??= 0.5;
          w.darkVeilScanlineFrequency ??= 0;
          w.darkVeilWarpAmount ??= 0;
          w.darkVeilResolutionScale ??= 1;

          w.dotGridDotSize ??= 16;
          w.dotGridGap ??= 32;
          w.dotGridBaseColor ??= "#27FF64";
          w.dotGridActiveColor ??= "#27FF64";
          w.dotGridProximity ??= 150;
          w.dotGridSpeedTrigger ??= 100;
          w.dotGridShockRadius ??= 250;
          w.dotGridShockStrength ??= 5;
          w.dotGridMaxSpeed ??= 5000;
          w.dotGridResistance ??= 750;
          w.dotGridReturnDuration ??= 1.5;
          w.dotGridClassName ??= "";
          w.dotGridStyleJson ??= "{}";

          w.grainientTimeSpeed ??= 0.5;
          w.grainientColorBalance ??= 0.6;
          w.grainientWarpStrength ??= 0.25;
          w.grainientWarpFrequency ??= 0.5;
          w.grainientWarpSpeed ??= 0.25;
          w.grainientWarpAmplitude ??= 0.2;
          w.grainientBlendAngle ??= 45;
          w.grainientBlendSoftness ??= 0.5;
          w.grainientRotationAmount ??= 0;
          w.grainientNoiseScale ??= 1;
          w.grainientGrainAmount ??= 0.2;
          w.grainientGrainScale ??= 1.5;
          w.grainientGrainAnimated ??= true;
          w.grainientContrast ??= 1;
          w.grainientGamma ??= 1;
          w.grainientSaturation ??= 1;
          w.grainientCenterX ??= 0.5;
          w.grainientCenterY ??= 0.5;
          w.grainientZoom ??= 1;
          w.grainientColor1 ??= "#ff7b7b";
          w.grainientColor2 ??= "#7bb8ff";
          w.grainientColor3 ??= "#7bffb0";
          w.grainientClassName ??= "";

          w.iridescenceColor ??= "1,1,1";
          w.iridescenceSpeed ??= 1;
          w.iridescenceAmplitude ??= 0.1;
          w.iridescenceMouseReact ??= true;

          w.lightningHue ??= 220;
          w.lightningXOffset ??= 0;
          w.lightningSpeed ??= 1;
          w.lightningIntensity ??= 1;
          w.lightningSize ??= 1;

          w.liquidEtherMouseForce ??= 20;
          w.liquidEtherCursorSize ??= 100;
          w.liquidEtherIsViscous ??= true;
          w.liquidEtherViscous ??= 30;
          w.liquidEtherIterationsViscous ??= 32;
          w.liquidEtherIterationsPoisson ??= 32;
          w.liquidEtherDt ??= 0.016;
          w.liquidEtherBFECC ??= true;
          w.liquidEtherResolution ??= 1;
          w.liquidEtherIsBounce ??= false;
          w.liquidEtherColors ??= "#5227ff,#27c1ff,#7cff67";
          w.liquidEtherStyleJson ??= "{}";
          w.liquidEtherClassName ??= "";
          w.liquidEtherAutoDemo ??= true;
          w.liquidEtherAutoSpeed ??= 1;
          w.liquidEtherAutoIntensity ??= 1;
          w.liquidEtherTakeoverDuration ??= 0.4;
          w.liquidEtherAutoResumeDelay ??= 1.5;
          w.liquidEtherAutoRampDuration ??= 0.6;

          w.orbHue ??= 0;
          w.orbHoverIntensity ??= 0.2;
          w.orbRotateOnHover ??= true;
          w.orbForceHoverState ??= false;

          w.particlesParticleCount ??= 200;
          w.particlesParticleSpread ??= 8;
          w.particlesSpeed ??= 0.1;
          w.particlesParticleColors ??= "#ffffff,#cfe8ff,#9dd1ff";
          w.particlesMoveParticlesOnHover ??= true;
          w.particlesParticleHoverFactor ??= 1;
          w.particlesAlphaParticles ??= true;
          w.particlesParticleBaseSize ??= 100;
          w.particlesSizeRandomness ??= 1;
          w.particlesCameraDistance ??= 20;
          w.particlesDisableRotation ??= false;
          w.particlesClassName ??= "";

          w.prismaticBurstIntensity ??= 2;
          w.prismaticBurstSpeed ??= 0.5;
          w.prismaticBurstAnimationType ??= "rotate3d";
          w.prismaticBurstColors ??= "";
          w.prismaticBurstDistort ??= 0;
          w.prismaticBurstPaused ??= false;
          w.prismaticBurstOffsetX ??= "0";
          w.prismaticBurstOffsetY ??= "0";
          w.prismaticBurstHoverDampness ??= 0;
          w.prismaticBurstRayCount ??= 0;
          w.prismaticBurstMixBlendMode ??= "lighten";

          w.silkSpeed ??= 5;
          w.silkScale ??= 1;
          w.silkColor ??= "#ffffff";
          w.silkNoiseIntensity ??= 1;
          w.silkRotation ??= 0;
          w.silkClassName ??= "";
          w.silkStyleJson ??= "{}";
        }
      }
      data.schemaVersion = 35;
      return data;
    },
  },
  // ── v36: Add widget font size control ──
  {
    toVersion: 36,
    migrate: (data: Record<string, any>) => {
      const items = data.collections?.widgets?.items;
      if (Array.isArray(items)) {
        for (const w of items) {
          if (!w || typeof w !== "object") continue;
          w.fontSize ??= 20;
        }
      }
      data.schemaVersion = 36;
      return data;
    },
  },
  // ── v37: Add GUI color-picker fields for widget color arrays ──
  {
    toVersion: 37,
    migrate: (data: Record<string, any>) => {
      const items = data.collections?.widgets?.items;
      if (Array.isArray(items)) {
        for (const w of items) {
          if (!w || typeof w !== "object") continue;
          w.gradientColor1 ??= "#27FF64";
          w.gradientColor2 ??= "#27FF64";
          w.gradientColor3 ??= "#A0FFBC";

          w.textTypeColor1 ??= "";
          w.textTypeColor2 ??= "";
          w.textTypeColor3 ??= "";

          w.auroraColorStop1 ??= "#7cff67";
          w.auroraColorStop2 ??= "#171D22";
          w.auroraColorStop3 ??= "#7cff67";

          w.colorBendsColor1 ??= "";
          w.colorBendsColor2 ??= "";
          w.colorBendsColor3 ??= "";

          w.iridescenceBaseColor ??= "#ffffff";

          w.liquidEtherColor1 ??= "#5227ff";
          w.liquidEtherColor2 ??= "#27c1ff";
          w.liquidEtherColor3 ??= "#7cff67";

          w.particlesColor1 ??= "#ffffff";
          w.particlesColor2 ??= "#cfe8ff";
          w.particlesColor3 ??= "#9dd1ff";

          w.prismaticBurstColor1 ??= "";
          w.prismaticBurstColor2 ??= "";
          w.prismaticBurstColor3 ??= "";
        }
      }
      data.schemaVersion = 37;
      return data;
    },
  },
  {
    toVersion: 38,
    migrate: (data) => {
      // v37 → v38: resume, gallery, blog, and newsletter `enabled` now drives
      // the user-facing tab nav.  They were always visible before this change,
      // so set enabled=true to preserve existing behaviour for current users.
      const collections = data.collections && typeof data.collections === "object"
        ? (data.collections as Record<string, any>)
        : {};
      for (const key of ["resume", "gallery", "blog", "newsletter"]) {
        if (collections[key] && typeof collections[key] === "object") {
          collections[key].enabled = true;
        }
      }
      data.schemaVersion = 38;
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
