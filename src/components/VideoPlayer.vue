<template>
  <div
    class="vidstack-wrapper relative w-full overflow-hidden rounded-xl border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.15),0_2px_40px_rgba(255,255,255,0.12),0_4px_80px_rgba(120,160,255,0.10)]"
    style="aspect-ratio: 16/9; max-height: 80vh; max-height: 80dvh;"
    :data-youtube="isYouTube || undefined"
  >
    <media-player
      ref="playerEl"
      :src="playerSrc"
      :poster="poster || ''"
      :autoPlay="false"
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
import { computed, defineComponent, ref } from "vue";

// Import vidstack custom elements + UI elements + default layout
import "vidstack/player";
import "vidstack/player/ui";
import "vidstack/player/layouts/default";

// Import vidstack CSS
import "vidstack/player/styles/base.css";
import "vidstack/player/styles/default/theme.css";
import "vidstack/player/styles/default/layouts/video.css";

const isYouTubeUrl = (url: string) =>
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/.test(
    url,
  );

export default defineComponent({
  name: "VideoPlayer",
  props: {
    src: { type: String, required: true },
    poster: { type: String, default: "" },
  },
  setup(props, { expose }) {
    const playerEl = ref<HTMLElement | null>(null);

    const isYouTube = computed(() => isYouTubeUrl(props.src || ""));

    const playerSrc = computed(() => {
      const s = props.src || "";
      if (isYouTubeUrl(s)) return s;
      if (s.match(/vimeo\.com\/(?:video\/)?\d+/)) return s;
      return s;
    });

    /**
     * Call play() on the underlying <media-player> element.
     * Should be called within a user-gesture context (click/tap handler)
     * so mobile browsers allow playback.
     */
    const play = () => {
      const el = playerEl.value as any;
      if (el?.play) {
        try {
          el.play();
        } catch {
          // swallow — Vidstack will show its play button as fallback
        }
      }
    };

    const pause = () => {
      const el = playerEl.value as any;
      if (el?.pause) {
        try {
          el.pause();
        } catch {
          // swallow
        }
      }
    };

    expose({ play, pause });

    return { playerEl, playerSrc, isYouTube };
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
 * Gesture elements must stay in-layout (so getBoundingClientRect works
 * for Vidstack's hit-testing), but we suppress any visual indicators.
 */
.vidstack-wrapper .vds-gesture,
.vidstack-wrapper media-gesture,
.vidstack-wrapper [data-media-gesture] {
  opacity: 0 !important;
  visibility: hidden !important;
}

/*
 * Force the toggle:paused gesture to show (display:block) on ALL devices,
 * including mobile (pointer:coarse) where Vidstack hides it by default.
 * This makes click/tap anywhere on the video toggle play/pause.
 */
.vidstack-wrapper .vds-gesture[action='toggle:paused'],
.vidstack-wrapper media-gesture[action='toggle:paused'],
.vidstack-wrapper [data-media-gesture][action='toggle:paused'] {
  display: block !important;
}

/*
 * Disable the toggle:controls gesture on ALL devices so it doesn't
 * compete with toggle:paused. We want tap = play/pause, not show/hide controls.
 */
.vidstack-wrapper .vds-gesture[action='toggle:controls'],
.vidstack-wrapper media-gesture[action='toggle:controls'],
.vidstack-wrapper [data-media-gesture][action='toggle:controls'] {
  display: none !important;
}

/*
 * Hide ALL Vidstack built-in play/pause buttons and buffering indicators.
 * We render our own custom overlays, so these are redundant and cause
 * double-ups (especially the centered play button in data-sm layout).
 */
.vidstack-wrapper .vds-play-button,
.vidstack-wrapper .vds-load-container,
.vidstack-wrapper .vds-buffering-indicator {
  display: none !important;
}

/*
 * Initial loading state: show a spinner inside the same translucent circle
 * used for play/pause overlays. Visible before the video has started.
 */

/* Translucent circle (same style as paused overlay) */
.vidstack-wrapper media-player:not([data-started])::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 64px;
  height: 64px;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.55);
  border-radius: 50%;
  z-index: 100;
  pointer-events: none;
}

/* Spinning ring inside the circle */
.vidstack-wrapper media-player:not([data-started])::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border: 3px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: vp-spin 0.7s linear infinite;
  z-index: 101;
  pointer-events: none;
}

@keyframes vp-spin {
  to { transform: rotate(360deg); }
}

/*
 * Show a centered play icon overlay when the video is paused AFTER it
 * has started (i.e. user paused mid-playback). Uses a CSS triangle as
 * the play icon inside a translucent circle.
 * Safe for YouTube: Vidstack passes controls=0 to YouTube's iframe,
 * so YouTube's native indicator is fully disabled.
 */
.vidstack-wrapper media-player[data-started][data-paused]::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 64px;
  height: 64px;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.55);
  border-radius: 50%;
  z-index: 100;
  pointer-events: none;
}

/* Play triangle inside the circle */
.vidstack-wrapper media-player[data-started][data-paused]::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  /* Triangle: 20px wide, 24px tall, offset slightly right for optical center */
  border-style: solid;
  border-width: 12px 0 12px 20px;
  border-color: transparent transparent transparent #fff;
  transform: translate(calc(-50% + 3px), -50%);
  z-index: 101;
  pointer-events: none;
}

/*
 * Desktop only: show a pause overlay (two vertical bars in a circle)
 * when hovering over a playing video. Uses wrapper's ::after for the
 * circle and ::before for the pause bars (via box-shadow trick).
 */
@media (hover: hover) and (pointer: fine) {
  /* Circle background */
  .vidstack-wrapper:has(media-player[data-started]:not([data-paused]))::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 64px;
    height: 64px;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.55);
    border-radius: 50%;
    z-index: 100;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .vidstack-wrapper:hover:has(media-player[data-started]:not([data-paused]))::after {
    opacity: 1;
  }

  /* Pause icon: two vertical bars using box-shadow on a small element */
  .vidstack-wrapper:has(media-player[data-started]:not([data-paused]))::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 20px;
    /* Left bar is the element itself, right bar is the box-shadow */
    background: #fff;
    box-shadow: 9px 0 0 0 #fff;
    transform: translate(calc(-50% - 4px), -50%);
    border-radius: 1px;
    z-index: 101;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .vidstack-wrapper:hover:has(media-player[data-started]:not([data-paused]))::before {
    opacity: 1;
  }
}
</style>
