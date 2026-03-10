/**
 * Image optimization build hook for the Bento theme.
 *
 * Compresses and optionally resizes images in the final dist/ output
 * directory using QASAI (https://github.com/ahmadawais/qasai).
 *
 * QASAI supports multiple engines (mozjpeg, pngquant, gifsicle, svgo, sharp)
 * and handles JPEG, PNG, WebP, AVIF, GIF, SVG, and TIFF.
 *
 * Requires `qasai` as a dependency (declared in the theme's package.json
 * and auto-installed by scripts/install-layout-deps.mjs).
 */
import type { BuildHook, BuildHookContext } from "../../../lib/config";

export interface ImageOptimizeOptions {
  /** Quality 1–100. Default: 80 */
  quality?: number;
  /** Max width in pixels (keeps aspect ratio). Default: 1920 */
  maxWidth?: number;
  /** Max height in pixels (keeps aspect ratio). Default: undefined */
  maxHeight?: number;
  /** Convert all images to a specific format. Default: undefined (keep original) */
  convertTo?: "webp" | "avif" | "jpg" | "png";
  /** Use lossless compression. Default: false */
  lossless?: boolean;
  /** Compression effort 1–10. Default: 6 */
  effort?: number;
  /** JPEG engine. Default: "mozjpeg" */
  jpegEngine?: "mozjpeg" | "jpegtran" | "sharp";
  /** PNG engine. Default: "pngquant" */
  pngEngine?: "pngquant" | "optipng" | "sharp";
  /** Number of parallel workers. Default: 4 */
  parallel?: number;
}

export function createImageOptimizeHook(options: ImageOptimizeOptions = {}): BuildHook {
  const {
    quality = 80,
    maxWidth = 1920,
    maxHeight,
    convertTo,
    lossless = false,
    effort,
    jpegEngine,
    pngEngine,
    parallel,
  } = options;

  return {
    name: "image-optimize",
    phase: "closeBundle",
    async run(ctx: BuildHookContext) {
      if (!ctx.distDir) return;

      const { execSync } = await import("node:child_process");

      // Build qasai CLI args
      const args: string[] = [
        JSON.stringify(ctx.distDir),
        "--in-place",
        "--recursive",
        "--quiet",
        "--quality", String(quality),
      ];

      if (maxWidth) args.push("--max-width", String(maxWidth));
      if (maxHeight) args.push("--max-height", String(maxHeight));
      if (convertTo) args.push("--format", convertTo);
      if (lossless) args.push("--lossless");
      if (effort) args.push("--effort", String(effort));
      if (jpegEngine) args.push("--jpeg-engine", jpegEngine);
      if (pngEngine) args.push("--png-engine", pngEngine);
      if (parallel) args.push("--parallel", String(parallel));

      const cmd = `npx qasai ${args.join(" ")}`;

      try {
        const output = execSync(cmd, {
          stdio: "pipe",
          timeout: 300_000,
        });
        const stdout = output.toString().trim();
        if (stdout) console.log(`[image-optimize] ${stdout}`);
      } catch (err: any) {
        // qasai may exit non-zero but still produce useful stderr
        const stderr = err.stderr?.toString().trim();
        if (stderr) {
          console.warn(`[image-optimize] ${stderr}`);
        } else {
          console.warn(`[image-optimize] qasai failed: ${err.message}`);
        }
      }
    },
  };
}
