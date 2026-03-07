<template>
  <header class="mx-auto w-full max-w-[740px] px-3 pt-8 sm:px-3 sm:pt-14">
    <!-- Hero card with optional banner background -->
    <div
      class="relative overflow-hidden rounded-2xl"
      :class="[bannerSrc ? 'min-h-[220px] sm:min-h-[280px] banner-gradient' : '']"
    >
      <!-- Banner as background image -->
      <img
        v-if="bannerSrc"
        :src="bannerSrc"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
        @error="$emit('banner-error')"
      />

      <!-- Content (sits above banner + gradient pseudo-element) -->
      <div class="relative z-10 flex flex-col items-center px-4 text-center"
           :class="[bannerSrc ? 'pb-6 pt-16 sm:pb-8 sm:pt-24' : 'py-2']"
      >
        <!-- Avatar -->
        <div
          class="mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-white/80 shadow-lg sm:h-24 sm:w-24"
          :class="{ 'ring-2 ring-white/30': bannerSrc }"
        >
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            alt="Avatar"
            class="h-full w-full object-cover"
            @error="$emit('avatar-error')"
          />
          <div
            v-else
            class="grid h-full w-full place-items-center bg-[var(--glass-2)] text-base font-medium tracking-wide text-[color:var(--color-ink-soft)]"
          >
            {{ initials }}
          </div>
        </div>

        <!-- Name & tagline -->
        <div @dblclick="$emit('dblclick-name')" class="cursor-pointer select-none">
          <h1 class="text-xl font-semibold tracking-tight text-[color:var(--color-ink)] sm:text-2xl">
            {{ displayName || "Your Name" }}
          </h1>
          <p
            v-if="tagline"
            class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[color:var(--color-ink-soft)]"
          >
            {{ tagline }}
          </p>
        </div>

        <!-- Social links -->
        <div
          v-if="socials.length"
          class="mt-4 flex flex-wrap items-center justify-center gap-3 sm:mt-5"
        >
          <a
            v-for="s in socials"
            :key="s.id"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-ink-soft)] transition hover:text-[color:var(--color-brand)]"
            :href="socialHref(s)"
            :target="isEmailUrl(s.url) ? undefined : '_blank'"
            rel="noreferrer"
            @click="$emit('social-click', socialHref(s), s.label)"
          >
            <component :is="resolveIcon(s.icon)" :size="13" class="shrink-0" />
            <span>{{ s.label }}</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Thin separator -->
    <div class="mx-auto mt-6 h-px w-12 bg-[var(--color-border2)] sm:mt-8" />
  </header>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { SocialLink } from "../../lib/model";
import { icons as lucideIcons } from "lucide-vue-next";

export default defineComponent({
  name: "MinimalProfileHeader",
  props: {
    displayName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    avatarSrc: { type: String, default: "" },
    bannerSrc: { type: String, default: "" },
    initials: { type: String, default: "LB" },
    socials: { type: Array as PropType<SocialLink[]>, default: () => [] },
  },
  emits: ["avatar-error", "banner-error", "dblclick-name", "social-click"],
  setup() {
    const isEmailUrl = (url: string) => {
      if (!url) return false;
      if (url.startsWith("mailto:")) return true;
      return url.includes("@") && url.includes(".");
    };

    const socialHref = (s: { url: string }) => {
      if (isEmailUrl(s.url) && !s.url.startsWith("mailto:")) {
        return "mailto:" + s.url;
      }
      return s.url;
    };

    const resolveIcon = (name: string) => {
      return (lucideIcons as Record<string, any>)[name] ?? (lucideIcons as Record<string, any>)["Globe"];
    };

    return { isEmailUrl, socialHref, resolveIcon };
  },
});
</script>

<style scoped>
.banner-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(to bottom, transparent var(--minimal-header-gradient-start, 25%), var(--bg));
  pointer-events: none;
}
</style>
