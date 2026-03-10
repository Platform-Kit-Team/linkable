/**
 * TTS build hook for the Bento theme.
 *
 * Generates audio files for collection items at build time.
 * Registered as a buildHook in the theme's platformkit.config.ts.
 *
 * Enable via VITE_TTS_ENABLED=true. Provide a TTS backend via either:
 *   - VITE_TTS_COMMAND env var (shell command)
 *   - Override this hook's generate() in user overrides
 */
import type { BuildHook, BuildHookContext } from "../../../lib/config";

export interface TtsHookOptions {
  /** Collection key to generate TTS for (e.g. "blog"). */
  collection: string;
  /** TTS voice identifier. Passed to the TTS command or generate function. */
  voice?: string;
  /** Optional LLM prompt for pre-processing text before TTS. */
  llmPrompt?: string;
  /** Filter — only items passing this predicate get audio generated. */
  filter?: (item: Record<string, unknown>) => boolean;
  /** Item field to read text from. Default: "html", falls back to "content". */
  textField?: string;
  /** Item field to write the audio URL to. Default: "audioUrl". */
  outputField?: string;
  /** Audio output subdirectory name. Default: "audio". */
  outputDir?: string;
  /** Custom generator. Receives plain text, returns audio bytes. */
  generate?: (text: string, options: { voice?: string; slug: string }) => Promise<Uint8Array>;
}

export function createTtsHook(options: TtsHookOptions): BuildHook {
  const {
    collection,
    voice,
    filter,
    textField = "html",
    outputField = "audioUrl",
    outputDir: audioDirName = "audio",
    generate,
  } = options;

  return {
    name: `tts:${collection}`,
    phase: "afterCollectionBuild",
    async run(ctx: BuildHookContext) {
      if (process.env.VITE_TTS_ENABLED !== "true") return;

      // Dynamic imports so this module stays safe to import in the browser
      // (buildHooks are only ever executed in Node during vite build)
      const fs = await import("node:fs");
      const nodePath = await import("node:path");
      const { spawnSync } = await import("node:child_process");

      const col = ctx.collections[collection];
      if (!col) return;

      const audioDir = nodePath.join(col.outputDir, audioDirName);
      if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

      let items = col.allItems;
      if (filter) items = items.filter(filter);

      let generated = 0;
      for (const item of items) {
        const slug = String(item.slug ?? "");
        if (!slug) continue;

        const audioPath = nodePath.join(audioDir, `${slug}.mp3`);
        if (fs.existsSync(audioPath)) continue;

        const fullPath = nodePath.join(col.outputDir, `${slug}.json`);
        if (!fs.existsSync(fullPath)) continue;
        const full = JSON.parse(fs.readFileSync(fullPath, "utf8"));

        let text = String(full[textField] ?? full.content ?? "");
        if (!text) continue;

        // Strip HTML for TTS input
        text = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (!text) continue;

        try {
          if (generate) {
            const buf = await generate(text, { voice, slug });
            fs.writeFileSync(audioPath, buf);
          } else if (process.env.VITE_TTS_COMMAND) {
            const args = [
              text.substring(0, 100_000),
              "--output", audioPath,
            ];
            if (voice) args.push("--voice", voice);
            const result = spawnSync(process.env.VITE_TTS_COMMAND, args, {
              stdio: "pipe",
              timeout: 120_000,
            });
            if (result.status !== 0) {
              console.warn(`[tts:${collection}] Failed for ${slug}: ${result.stderr?.toString()}`);
              continue;
            }
          } else {
            console.warn(`[tts:${collection}] No TTS backend. Set VITE_TTS_COMMAND or provide generate().`);
            break;
          }

          // Update built JSON with audio URL
          full[outputField] = `/content/collections/${collection}/${audioDirName}/${slug}.mp3`;
          fs.writeFileSync(fullPath, JSON.stringify(full, null, 2));
          generated++;
        } catch (err: any) {
          console.warn(`[tts:${collection}] Error for ${slug}: ${err.message}`);
        }
      }

      if (generated > 0) {
        console.log(`[tts:${collection}] Generated audio for ${generated} item(s)`);
      }
    },
  };
}
