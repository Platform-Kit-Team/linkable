<template>
  <div
    class="group relative flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--glass-2)] px-4 py-3 shadow-sm backdrop-blur-md transition-all"
    :class="{ 'ring-1 ring-[var(--color-brand)]/40': playing }"
  >
    <!-- Icon + label -->
    <div class="flex shrink-0 flex-col items-center gap-0.5">
      <div
        class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)]/10 transition-colors group-hover:bg-[var(--color-brand)]/20"
      >
        <Headphones class="h-4 w-4 text-[color:var(--color-brand)]" />
      </div>
      <span class="text-[9px] font-semibold uppercase tracking-widest text-[color:var(--color-ink-soft)]">
        Listen
      </span>
    </div>

    <!-- Controls -->
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <!-- Play/pause + time -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] shadow-md transition-all hover:brightness-110 active:scale-95"
          :aria-label="playing ? 'Pause' : 'Play'"
          @click="toggle"
        >
          <component
            :is="playing ? Pause : Play"
            class="h-3.5 w-3.5 text-white"
            :class="{ 'translate-x-px': !playing }"
          />
        </button>

        <div class="min-w-0 flex-1">
          <!-- Seek bar -->
          <div
            class="relative h-1.5 w-full cursor-pointer rounded-full bg-[var(--color-border)]"
            @click="seek"
            @mousedown="startScrub"
          >
            <!-- Buffered -->
            <div
              class="absolute inset-y-0 left-0 rounded-full bg-[var(--color-border)] opacity-60"
              :style="{ width: bufferedPercent + '%' }"
            />
            <!-- Progress -->
            <div
              class="absolute inset-y-0 left-0 rounded-full bg-[var(--color-brand)] transition-[width] duration-100"
              :style="{ width: progressPercent + '%' }"
            />
            <!-- Thumb -->
            <div
              class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-[var(--color-brand)] opacity-0 shadow-sm ring-2 ring-white/60 transition-opacity group-hover:opacity-100"
              :style="{ left: progressPercent + '%' }"
            />
          </div>
        </div>

        <!-- Time -->
        <span class="shrink-0 font-mono text-[10px] tabular-nums text-[color:var(--color-ink-soft)]">
          {{ formatTime(currentTime) }}<span class="opacity-50"> / {{ formatTime(duration) }}</span>
        </span>

        <!-- Speed -->
        <button
          type="button"
          class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[color:var(--color-ink-soft)] ring-1 ring-[var(--color-border)] transition hover:bg-[var(--glass)] hover:text-[color:var(--color-ink)]"
          :aria-label="`Playback speed ${playbackRate}x`"
          @click="cycleSpeed"
        >
          {{ playbackRate }}×
        </button>
      </div>
    </div>

    <audio
      ref="audioEl"
      :src="src"
      preload="metadata"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onMetadata"
      @progress="onProgress"
      @ended="playing = false"
      @pause="playing = false"
      @play="playing = true"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { Headphones, Play, Pause } from "lucide-vue-next";

export default defineComponent({
  name: "AudioPlayer",
  components: { Headphones, Play, Pause },
  props: {
    src: { type: String, required: true },
  },
  setup() {
    const audioEl    = ref<HTMLAudioElement | null>(null);
    const playing    = ref(false);
    const currentTime = ref(0);
    const duration   = ref(0);
    const buffered   = ref(0);
    const playbackRate = ref<0.75 | 1 | 1.25 | 1.5 | 2>(1);

    const progressPercent = computed(() =>
      duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
    );
    const bufferedPercent = computed(() =>
      duration.value > 0 ? (buffered.value / duration.value) * 100 : 0
    );

    function toggle() {
      const el = audioEl.value;
      if (!el) return;
      playing.value ? el.pause() : el.play();
    }

    function seek(e: MouseEvent) {
      const el = audioEl.value;
      if (!el || duration.value === 0) return;
      const bar = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - bar.left) / bar.width));
      el.currentTime = ratio * duration.value;
    }

    function startScrub(e: MouseEvent) {
      // Allow dragging across the seek bar
      const bar = (e.currentTarget as HTMLElement);
      function onMove(ev: MouseEvent) {
        const rect = bar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
        if (audioEl.value && duration.value > 0)
          audioEl.value.currentTime = ratio * duration.value;
      }
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
    function cycleSpeed() {
      const el = audioEl.value;
      const idx = SPEEDS.indexOf(playbackRate.value);
      playbackRate.value = SPEEDS[(idx + 1) % SPEEDS.length];
      if (el) el.playbackRate = playbackRate.value;
    }

    function onTimeUpdate() {
      if (audioEl.value) currentTime.value = audioEl.value.currentTime;
    }
    function onMetadata() {
      if (audioEl.value) duration.value = audioEl.value.duration;
    }
    function onProgress() {
      const el = audioEl.value;
      if (el && el.buffered.length > 0)
        buffered.value = el.buffered.end(el.buffered.length - 1);
    }

    function formatTime(s: number): string {
      if (!isFinite(s) || s < 0) return "0:00";
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60).toString().padStart(2, "0");
      return `${m}:${sec}`;
    }

    return {
      audioEl,
      playing,
      currentTime,
      duration,
      progressPercent,
      bufferedPercent,
      playbackRate,
      toggle,
      seek,
      startScrub,
      cycleSpeed,
      onTimeUpdate,
      onMetadata,
      onProgress,
      formatTime,
      Play,
      Pause,
      Headphones,
    };
  },
});
</script>
