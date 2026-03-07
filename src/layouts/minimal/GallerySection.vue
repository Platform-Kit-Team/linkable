<template>
  <section class="minimal-gallery space-y-3">
    <SearchBar
      v-if="searchEnabled || availableTags.length > 0"
      v-model="searchQuery"
      placeholder="Search gallery…"
      :show-search="searchEnabled"
      :tag-count="availableTags.length > 0 ? availableTags.length : null"
      :selected-tag-count="selectedTags.length"
      @filter-click="$emit('filter-click')"
    />

    <div class="gallery-grid">
      <div
        v-for="(item, index) in filteredItems"
        :key="item.id"
        :class="['gallery-cell rounded-lg', { 'gallery-cell--wide': (index + 1) % 4 === 0 }]"
      >
        <button
          v-if="item.type === 'image'"
          type="button"
          class="group relative block h-full w-full overflow-hidden rounded-lg"
          @click="$emit('open-lightbox', item)"
        >
          <img
            :src="resolveUploadUrl(item.src)"
            :alt="item.title || 'Gallery image'"
            class="h-full w-full object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0"
            loading="lazy"
          />
          <div
            v-if="item.title"
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-2.5 pb-2 pt-6"
          >
            <div class="text-[11px] font-medium text-white/90 sm:text-xs">
              {{ item.title }}
            </div>
          </div>
        </button>

        <button
          v-else-if="item.type === 'video'"
          type="button"
          class="group relative block h-full w-full overflow-hidden rounded-lg"
          @click="$emit('open-video', item)"
        >
          <img
            v-if="item.coverUrl"
            :src="resolveUploadUrl(item.coverUrl)"
            :alt="item.title || 'Video thumbnail'"
            class="absolute inset-0 h-full w-full object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0"
            loading="lazy"
          />
          <div
            v-else
            class="absolute inset-0 flex items-center justify-center bg-[var(--glass-2)]"
          >
            <i class="pi pi-video text-2xl text-[color:var(--color-ink-soft)]" />
          </div>
          <div class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm sm:h-12 sm:w-12">
              <i class="pi pi-play text-sm sm:text-base" />
            </div>
          </div>
          <div
            v-if="item.title"
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-2.5 pb-2 pt-6"
          >
            <div class="text-[11px] font-medium text-white/90 sm:text-xs">
              {{ item.title }}
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from "vue";
import type { MasonryItem } from "../../components/MasonryGrid.vue";
export type { GallerySectionProps, GallerySectionEmits } from "../../lib/component-contracts";
import { resolveUploadUrl } from "../../lib/github";
import SearchBar from "../../components/SearchBar.vue";

export default defineComponent({
  name: "MinimalGallerySection",
  components: { SearchBar },
  props: {
    items: { type: Array as PropType<MasonryItem[]>, required: true },
    searchEnabled: { type: Boolean, default: false },
    availableTags: { type: Array as PropType<string[]>, default: () => [] },
    selectedTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ["open-lightbox", "open-video", "filter-click"],
  setup(props) {
    const searchQuery = ref("");

    const filteredItems = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      const tags = props.selectedTags;
      let source = props.items;
      if (q) {
        source = source.filter(
          (item) =>
            (item.title as string || "").toLowerCase().includes(q) ||
            (item.description as string || "").toLowerCase().includes(q),
        );
      }
      if (tags.length > 0) {
        source = source.filter(
          (item) => (item as any).tags && tags.some((t: string) => (item as any).tags.includes(t)),
        );
      }
      return source;
    });

    return { searchQuery, filteredItems, resolveUploadUrl };
  },
});
</script>

<style>
.minimal-gallery .gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 80px;
  grid-auto-flow: dense;
  gap: 8px;
}

@media (max-width: 639px) {
  .minimal-gallery .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.minimal-gallery .gallery-cell {
  grid-row: span 1;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}

[data-dark] .minimal-gallery .gallery-cell {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.08), 0 0 40px rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.minimal-gallery .gallery-cell--wide {
  grid-column: span 2;
  grid-row: span 2;
}
</style>
