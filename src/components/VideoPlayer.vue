<template>
  <div class="vidstack-wrapper relative w-full rounded-xl border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.15),0_2px_40px_rgba(255,255,255,0.12),0_4px_80px_rgba(120,160,255,0.10)] overflow-hidden" style="aspect-ratio: 16/9; max-height: 80vh; max-height: 80dvh;">
    <media-player
      ref="playerEl"
      :src="playerSrc"
      :poster="poster || ''"
      :autoPlay="autoplay"
      load="eager"
      crossOrigin
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
import { computed, defineComponent, onMounted } from "vue";

// Import vidstack custom elements + UI elements + default layout
import "vidstack/player";
import "vidstack/player/ui";
import "vidstack/player/layouts/default";

// Import vidstack CSS
import "vidstack/player/styles/base.css";
import "vidstack/player/styles/default/theme.css";
import "vidstack/player/styles/default/layouts/video.css";

export default defineComponent({
  name: "VideoPlayer",
  props: {
    src: { type: String, required: true },
    poster: { type: String, default: "" },
    autoplay: { type: Boolean, default: true },
  },
  setup(props) {
    /**
     * Vidstack accepts different source formats:
     * - Direct URL string for mp4
     * - youtube/_videoId or full YouTube URL
     * - vimeo/_videoId or full Vimeo URL
     *
     * We normalize the incoming src prop to what vidstack expects.
     */
    const playerSrc = computed(() => {
      const s = props.src || "";

      // YouTube — pass the full URL; vidstack handles it natively
      if (
        s.match(
          /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/
        )
      ) {
        // vidstack expects `youtube/<id>` or a full URL
        return s;
      }

      // Vimeo — pass the full URL
      if (s.match(/vimeo\.com\/(?:video\/)?\d+/)) {
        return s;
      }

      // Direct video URL (mp4 etc.)
      return s;
    });

    return { playerSrc };
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
