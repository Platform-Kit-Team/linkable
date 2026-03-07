<template>
  <section class="space-y-1">
    <SearchBar
      v-if="searchEnabled && links.length > 0"
      v-model="searchQuery"
      placeholder="Search links…"
      :show-search="searchEnabled"
      :tag-count="availableTags.length > 0 ? availableTags.length : null"
      :selected-tag-count="selectedTags.length"
      @filter-click="$emit('filter-click')"
    />

    <div v-if="filtered.length" class="space-y-2">
      <a
        v-for="link in filtered"
        :key="link.id"
        class="group flex items-center gap-3 rounded-lg bg-[rgba(0,50,100,0.0625)] px-3 py-3.5 transition hover:opacity-80 sm:py-4"
        :href="link.url"
        :target="link.url.startsWith('#') ? '_self' : '_blank'"
        :rel="link.url.startsWith('#') ? undefined : 'noreferrer'"
        @click="$emit('link-click', link.url, link.title)"
      >
        <div
          v-if="link.imageUrl"
          class="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border2)] sm:h-10 sm:w-10"
        >
          <img
            :src="resolveUploadUrl(link.imageUrl)"
            alt=""
            class="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium text-[color:var(--color-ink)]">
            {{ link.title }}
          </div>
          <div
            v-if="link.subtitle"
            class="mt-0.5 truncate text-xs text-[color:var(--color-ink-soft)]"
          >
            {{ link.subtitle }}
          </div>
        </div>

        <svg
          class="h-4 w-4 shrink-0 text-[color:var(--color-ink-soft)] transition group-hover:translate-x-0.5"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </a>
    </div>

    <div v-else class="py-10 text-center">
      <div class="text-sm font-medium text-[color:var(--color-ink)]">No links yet</div>
      <div class="mt-1 text-xs text-[color:var(--color-ink-soft)]">
        Open the CMS and add your first link.
      </div>
      <slot name="empty-action" />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from "vue";
import type { BioLink } from "../../lib/model";
import { resolveUploadUrl } from "../../lib/github";
import SearchBar from "../../components/SearchBar.vue";

export default defineComponent({
  name: "MinimalLinksSection",
  components: { SearchBar },
  props: {
    links: { type: Array as PropType<BioLink[]>, required: true },
    searchEnabled: { type: Boolean, default: false },
    availableTags: { type: Array as PropType<string[]>, default: () => [] },
    selectedTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ["link-click", "filter-click"],
  setup(props) {
    const searchQuery = ref("");

    const filtered = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      const tags = props.selectedTags;
      let source = props.links;
      if (q) {
        source = source.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.subtitle.toLowerCase().includes(q) ||
            l.url.toLowerCase().includes(q) ||
            l.tags?.some((t) => t.toLowerCase().includes(q)),
        );
      }
      if (tags.length > 0) {
        source = source.filter(
          (l) => l.tags && tags.some((t) => l.tags.includes(t)),
        );
      }
      return source;
    });

    return { searchQuery, filtered, resolveUploadUrl };
  },
});
</script>
