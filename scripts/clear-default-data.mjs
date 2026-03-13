/**
 * clear-default-data.mjs
 *
 * Clears runtime CMS payloads before import/build so placeholder dummy content
 * never leaks into production output when user data is imported.
 *
 * NOTE: This intentionally does NOT mutate default-data.json (template seed).
 * It writes the cleared payload to runtime files used by the app:
 *   - cms-data.json
 *   - public/content/data.json
 *
 * Usage:
 *   node scripts/clear-default-data.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const defaultDataPath = path.join(rootDir, "default-data.json");
const cmsDataPath = path.join(rootDir, "cms-data.json");
const publicDataPath = path.join(rootDir, "public", "content", "data.json");

const fallbackSeed = {
  schemaVersion: 1,
  profile: {
    displayName: "PlatformKit",
    tagline: "Design-forward links. Clean, fast, yours.",
    faviconUrl: "/favicon.ico",
    ogImageUrl: "/pwa-logo.png",
  },
  collections: {},
  theme: {
    layout: "bento",
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
  },
  layoutThemes: {
    bento: {
      layout: "bento",
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
    },
  },
  scripts: {
    headScript: "",
    bodyEndScript: "",
  },
};

try {
  const data = existsSync(defaultDataPath)
    ? JSON.parse(readFileSync(defaultDataPath, "utf8"))
    : structuredClone(fallbackSeed);

  if (!data.profile || typeof data.profile !== "object") data.profile = {};
  data.profile.displayName = "PlatformKit";
  data.profile.tagline = "Design-forward links. Clean, fast, yours.";

  if (data.collections && typeof data.collections === "object") {
    for (const key of Object.keys(data.collections)) {
      if (Array.isArray(data.collections[key]?.items)) {
        data.collections[key].items = [];
      }
      if (typeof data.collections[key] === "object" && data.collections[key]) {
        if (key === "socials" || key === "links" || key === "embeds") {
          data.collections[key].enabled = true;
        } else {
          data.collections[key].enabled = false;
        }
      }
    }
  }

  if (!data.theme || typeof data.theme !== "object") data.theme = {};
  if (!data.theme.layoutData || typeof data.theme.layoutData !== "object") data.theme.layoutData = {};
  delete data.theme.layoutData.grid;

  const serialized = JSON.stringify(data, null, 2);

  writeFileSync(cmsDataPath, serialized);

  mkdirSync(path.dirname(publicDataPath), { recursive: true });
  writeFileSync(publicDataPath, serialized);

  console.log("✅  Cleared runtime CMS data before import (cms-data.json + public/content/data.json).");
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("❌  Failed to clear runtime data:", message);
  process.exit(1);
}
