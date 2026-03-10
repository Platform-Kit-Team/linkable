/**
 * Bento theme — build-time config.
 *
 * This file is loaded by the build-time config merger alongside the main
 * platformkit.config.ts. It's kept separate because it imports Node-only
 * modules that can't be bundled for the browser.
 *
 * Convention: platformkit.build.ts in any theme or overrides directory is
 * auto-discovered and merged at build time.
 */
import type { PlatformKitConfig } from "../../lib/config";
import { createTtsHook } from "./build-hooks/tts-hook";

const buildConfig: Partial<PlatformKitConfig> = {
  buildHooks: [
    createTtsHook({
      collection: "blog",
      voice: "af_heart",
      filter: (item) => item.published !== false,
    }),
  ],
};

export default buildConfig;
