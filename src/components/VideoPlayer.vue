<template>
  <div
    class="vidstack-wrapper relative w-full overflow-hidden rounded-xl border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.15),0_2px_40px_rgba(255,255,255,0.12),0_4px_80px_rgba(120,160,255,0.10)]"
    style="aspect-ratio: 16/9; max-height: 80vh; max-height: 80dvh;"
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
</style>
