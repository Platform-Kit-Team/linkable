import type { PlatformKitConfig } from "./src/lib/config";

/**
 * Root platform-level config.
 *
 * Theme-specific settings (collections, build hooks, etc.) belong in the
 * active theme's platformkit.build.ts — NOT here.
 *
 * User overrides go in src/overrides/platformkit.config.ts (or staged there
 * by the CLI from the user's content directory).
 *
 * Merge order: root → theme → user overrides (deep merge, buildHooks concatenated).
 */
const config: PlatformKitConfig = {};

export default config;
