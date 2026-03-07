<template>
  <!-- Profile cell -->
  <div
    v-if="item.type === 'profile'"
    class="bento-cell relative overflow-hidden"
  >
    <img
      v-if="model?.profile.avatarUrl"
      :src="model.profile.avatarUrl"
      alt="Avatar"
      class="absolute rounded-full object-cover"
      style="width: 128px; height: 128px; top: calc(50% - 112px); left: calc(50% - 64px)"
    />
    <div
      v-else-if="model?.profile.displayName"
      class="absolute grid place-items-center rounded-full bg-[var(--color-border2)] text-2xl font-bold text-[color:var(--color-ink-soft)]"
      style="width: 128px; height: 128px; top: calc(50% - 112px); left: calc(50% - 64px)"
    >
      {{ model.profile.displayName.slice(0, 2).toUpperCase() }}
    </div>
    <div class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-4 pb-4 text-center">
      <p v-if="model?.profile.displayName" class="text-base font-semibold text-[color:var(--color-ink)]">
        {{ model.profile.displayName }}
      </p>
      <p v-if="model?.profile.tagline" class="text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
        {{ model.profile.tagline }}
      </p>
      <div v-if="enabledSocials.length" class="flex items-center justify-center gap-3">
        <a
          v-for="s in enabledSocials"
          :key="s.id"
          :href="s.url"
          :target="s.url.startsWith('mailto:') ? undefined : '_blank'"
          rel="noreferrer"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-border2,rgba(0,0,0,0.05))] text-[color:var(--color-ink-soft)] transition hover:text-[color:var(--color-ink)]"
          :title="s.label"
        >
          <component :is="getIcon(s.icon)" :size="18" />
        </a>
      </div>
    </div>
  </div>

  <!-- Link cell -->
  <a
    v-else-if="item.type === 'link' && linkData"
    :href="linkData.url"
    target="_blank"
    rel="noreferrer"
    class="bento-cell group flex flex-col justify-end overflow-hidden"
    @click="$emit('link-click', linkData!.url, linkData!.title)"
  >
    <img
      v-if="linkData.imageUrl"
      :src="linkData.imageUrl"
      alt=""
      class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
    <div
      class="relative z-10 mt-auto p-4"
      :class="linkData.imageUrl ? 'bg-gradient-to-t from-black/60 to-transparent text-white' : ''"
    >
      <div class="text-sm font-semibold" :class="!linkData.imageUrl && 'text-[color:var(--color-ink)]'">
        {{ linkData.title }}
      </div>
      <div
        v-if="linkData.subtitle"
        class="mt-0.5 text-xs opacity-75"
        :class="!linkData.imageUrl && 'text-[color:var(--color-ink-soft)]'"
      >
        {{ linkData.subtitle }}
      </div>
    </div>
    <svg
      class="absolute top-3 right-3 z-10 h-4 w-4 opacity-0 transition group-hover:opacity-60"
      :class="linkData.imageUrl ? 'text-white' : 'text-[color:var(--color-ink-soft)]'"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  </a>

  <!-- Gallery cell -->
  <button
    v-else-if="item.type === 'gallery' && galleryData"
    type="button"
    class="bento-cell group overflow-hidden"
    @click="galleryData!.type === 'video' ? $emit('open-video', galleryData!) : $emit('open-lightbox', galleryData!)"
  >
    <img
      :src="galleryData.coverUrl || galleryData.src"
      :alt="galleryData.title"
      class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
    />
    <div
      v-if="galleryData.title"
      class="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-3"
    >
      <span class="text-xs font-medium text-white">{{ galleryData.title }}</span>
    </div>
    <!-- Play icon for videos -->
    <div
      v-if="galleryData.type === 'video'"
      class="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
    >
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  </button>

  <!-- Blog cell -->
  <button
    v-else-if="item.type === 'blog' && blogData"
    type="button"
    class="bento-cell group flex flex-col overflow-hidden text-left"
    @click="$emit('load-post', blogData!.slug)"
  >
    <img
      v-if="blogData.coverImage"
      :src="blogData.coverImage"
      alt=""
      class="h-[55%] w-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
    />
    <div class="flex flex-1 flex-col justify-end p-4">
      <div v-if="blogData.date" class="text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-brand)]">
        {{ formatDate(blogData.date) }}
      </div>
      <div class="mt-1 text-sm font-semibold leading-snug text-[color:var(--color-ink)]">
        {{ blogData.title }}
      </div>
      <p v-if="blogData.excerpt" class="mt-1 line-clamp-2 text-xs text-[color:var(--color-ink-soft)]">
        {{ blogData.excerpt }}
      </p>
    </div>
  </button>

  <!-- Embed cell: inline when no heading/button -->
  <div
    v-else-if="item.type === 'embed' && embedData && !item.headerText && !item.buttonText"
    class="bento-cell overflow-hidden"
    v-html="embedData.html"
  />

  <!-- Embed cell (thumbnail + CTA) -->
  <button
    v-else-if="item.type === 'embed' && embedData"
    type="button"
    class="bento-cell group flex flex-col items-center justify-center overflow-hidden text-center"
    @click="$emit('open-embed', embedData!.id)"
  >
    <img
      v-if="item.thumbnailUrl"
      :src="item.thumbnailUrl"
      alt=""
      class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
    />
    <div
      class="relative z-10 flex flex-col items-center gap-2 p-4"
      :class="item.thumbnailUrl ? 'text-white drop-shadow-lg' : ''"
    >
      <div
        v-if="item.headerText"
        class="text-sm font-semibold"
        :class="!item.thumbnailUrl && 'text-[color:var(--color-ink)]'"
      >
        {{ item.headerText }}
      </div>
      <div
        v-else
        class="text-sm font-semibold"
        :class="!item.thumbnailUrl && 'text-[color:var(--color-ink)]'"
      >
        {{ embedData.label }}
      </div>
      <span
        v-if="item.buttonText"
        class="rounded-full px-4 py-1.5 text-xs font-medium transition"
        :class="item.thumbnailUrl
          ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
          : 'bg-[var(--color-brand)] text-white hover:brightness-110'"
      >
        {{ item.buttonText }}
      </span>
    </div>
  </button>

  <!-- Fallback: empty cell -->
  <div v-else class="bento-cell flex items-center justify-center">
    <span class="text-xs text-[color:var(--color-ink-soft)]">—</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject, ref, type PropType, type Ref } from "vue";
import type { BentoGridItem } from "./manifest";
import type { BioLink, BioModel, GalleryItem, EmbedItem, SocialLink } from "../../lib/model";
import type { BlogPostMeta } from "../../lib/blog";
import { icons as lucideIcons } from "lucide-vue-next";

export default defineComponent({
  name: "BentoCell",
  props: {
    item: { type: Object as PropType<BentoGridItem>, required: true },
    links: { type: Array as PropType<BioLink[]>, default: () => [] },
    galleryItems: { type: Array as PropType<GalleryItem[]>, default: () => [] },
    blogPosts: { type: Array as PropType<BlogPostMeta[]>, default: () => [] },
    embeds: { type: Array as PropType<EmbedItem[]>, default: () => [] },
  },
  emits: ["link-click", "open-lightbox", "open-video", "load-post", "open-embed"],
  setup(props) {
    const model = inject<Ref<BioModel>>("bioModel");

    const linkData = computed(() =>
      props.item.type === "link" ? props.links.find((l) => l.id === props.item.refId) ?? null : null,
    );
    const galleryData = computed(() =>
      props.item.type === "gallery" ? props.galleryItems.find((g) => g.id === props.item.refId) ?? null : null,
    );
    const blogData = computed(() =>
      props.item.type === "blog" ? props.blogPosts.find((p) => p.slug === props.item.refId) ?? null : null,
    );
    const embedData = computed(() =>
      props.item.type === "embed" ? props.embeds.find((e) => e.id === props.item.refId) ?? null : null,
    );

    const enabledSocials = computed<SocialLink[]>(() =>
      (model?.value?.socials ?? []).filter((s) => s.enabled && s.url),
    );

    const getIcon = (name: string) =>
      (lucideIcons as Record<string, any>)[name] || (lucideIcons as Record<string, any>)["Globe"];

    const formatDate = (d: string) => {
      if (!d) return "";
      try {
        return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      } catch {
        return d;
      }
    };

    return { model, linkData, galleryData, blogData, embedData, enabledSocials, getIcon, formatDate };
  },
});
</script>

<style scoped>
.bento-cell {
  position: relative;
  background: var(--bento-card-bg, #fff);
  border: 1px solid var(--bento-card-border, transparent);
  border-radius: var(--bento-card-radius, 1.5rem);
  box-shadow: var(--bento-card-shadow, 0 1px 2px rgba(0,0,0,0.04));
  transition: transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s ease;
  cursor: pointer;
  min-height: 0;
  width: 100%;
  height: 100%;
}
.bento-cell:hover {
  transform: scale(var(--bento-hover-scale, 1.02));
}
</style>
