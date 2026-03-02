<template>
  <div
    class="vidstack-wrapper relative w-full overflow-hidden rounded-xl border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.15),0_2px_40px_rgba(255,255,255,0.12),0_4px_80px_rgba(120,160,255,0.10)]"
    style="aspect-ratio: 16/9; max-height: 80vh; max-height: 80dvh;"
  >
    <media-player
      ref="playerEl"
      :src="playerSrc"
      :poster="poster || ''"
      :autoPlay="autoplay"
      load="eager"
      playsInline
      class="vds-video-player"
    >
      <media-provider>
        <media-poster class="vds-poster" />
      </media-provider>
      <media-video-layout />
    </media-player>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";

// Import vidstack custom elements + UI elements + default layout
import "vidstack/player";
import "vidstack/player/ui";
import "vidstack/player/layouts/default";

// Import vidstack CSS
import "vidstack/player/styles/base.css";
import "vidstack/player/styles/default/theme.css";
import "vidstack/player/styles/default/layouts/video.css";

const isMobile =
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const isYouTubeUrl = (url: string) =>
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/.test(
    url,
  );

export default defineComponent({
  name: "VideoPlayer",
  props: {
    src: { type: String, required: true },
    poster: { type: String, default: "" },
    autoplay: { type: Boolean, default: true },
  },
  setup(props) {
    const playerEl = ref<HTMLElement | null>(null);

    const isEmbedSrc = computed(() => isYouTubeUrl(props.src || ""));

    const playerSrc = computed(() => {
      const s = props.src || "";
      if (isYouTubeUrl(s)) return s;
      if (s.match(/vimeo\.com\/(?:video\/)?\d+/)) return s;
      return s;
    });

    // ── Mobile recovery ──────────────────────────────────────────────
    // Two problems on mobile YouTube embeds:
    //
    // 1) The IFrame API handshake: Vidstack sends { event: "listening" }
    //    once, 100 ms after the iframe loads. On slow mobile CPUs that
    //    can be too early — we retry every second until can-play is set.
    //
    // 2) Autoplay hang: Vidstack's YouTube provider awaits a playVideo
    //    deferred promise that never resolves if YouTube silently ignores
    //    the command (no user-gesture on the iframe). The player stays in
    //    a "loading/buffering" state forever.
    //
    //    Fix: after a timeout we force-pause the <media-player> element
    //    to abort the stuck autoplay attempt. This surfaces Vidstack's
    //    big play button so the user can tap once to play.
    //    On modern browsers where autoplay succeeds, none of this fires.

    let retryTimer: ReturnType<typeof setInterval> | undefined;
    let autoplayTimeout: ReturnType<typeof setTimeout> | undefined;

    const startRecovery = () => {
      stopRecovery();
      if (!isMobile || !isEmbedSrc.value) return;

      // ── Handshake retry ──
      let attempts = 0;
      const MAX_RETRIES = 15;
      retryTimer = setInterval(() => {
        const el = playerEl.value;
        if (!el || attempts >= MAX_RETRIES) {
          clearInterval(retryTimer);
          retryTimer = undefined;
          return;
        }
        if (el.hasAttribute("can-play")) {
          clearInterval(retryTimer);
          retryTimer = undefined;
          return;
        }
        attempts++;
        const iframe = el.querySelector("iframe") as HTMLIFrameElement | null;
        if (iframe?.contentWindow) {
          try {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: "listening" }),
              "*",
            );
          } catch {
            // cross-origin – ignore
          }
        }
      }, 1000);

      // ── Autoplay hang recovery ──
      if (props.autoplay) {
        autoplayTimeout = setTimeout(() => {
          const el = playerEl.value as any;
          if (!el) return;
          // If the video hasn't started yet, autoplay is stuck.
          // Calling pause() rejects the pending playVideo promise and
          // resets the player UI to show the play button.
          if (!el.hasAttribute("started")) {
            try {
              el.pause?.();
            } catch {
              // swallow
            }
          }
        }, 5000);
      }
    };

    const stopRecovery = () => {
      if (retryTimer !== undefined) {
        clearInterval(retryTimer);
        retryTimer = undefined;
      }
      if (autoplayTimeout !== undefined) {
        clearTimeout(autoplayTimeout);
        autoplayTimeout = undefined;
      }
    };

    onMounted(() => startRecovery());
    onUnmounted(() => stopRecovery());
    watch(() => props.src, () => startRecovery());

    return { playerEl, playerSrc };
  },
});
</script>

<style>
/* Ensure the player fills its container */
.vidstack-wrapper media-player {
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
}

.vidstack-wrapper media-player .vds-poster,
.vidstack-wrapper media-player .vds-poster img,
.vidstack-wrapper media-player media-poster,
.vidstack-wrapper media-player media-poster img {
  object-fit: cover !important;
  width: 100% !important;
  height: 100% !important;
}

/*
 * On mobile, Vidstack inserts .vds-blocker over YouTube/Vimeo iframes.
 * If the API handshake hasn't completed the player is stuck loading and
 * the blocker prevents tapping YouTube's native play button.
 */
@media (hover: none) and (pointer: coarse) {
  media-player:not([can-play]) .vds-blocker {
    pointer-events: none !important;
  }

  media-player:not([can-play]) iframe {
    pointer-events: auto !important;
    position: relative;
    z-index: 1;
  }
}
</style>
