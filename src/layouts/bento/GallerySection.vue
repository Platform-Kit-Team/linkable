<template>
  <section
    class="bento-gallery mx-auto w-full"
    style="width:calc(100% - 50px);max-width: var(--bento-grid-width, 960px); margin: 44px 25px"
  >
    <!-- Search/filter bar -->
    <div
      v-if="searchEnabled && availableTags.length"
      style="width:100%;background:none;border-radius:50px;"
      class="mb-4 flex items-center justify-between px-1 w-full block"
    >
      <button        
        class="text-sm bg-white py-3 px-5 rounded-full font-medium  text-gray-500"
        @click="$emit('filter-click')"
      >
        Filter 
        <i class="pi pi-cog" />
      </button>
    </div>

    <!-- Auto-layout bento grid -->
    <div
      v-if="items.length"
      class="grid gap-[var(--bento-gap)]"
      :style="{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridAutoRows: 'minmax(240px, auto)',
        gridAutoFlow: 'dense',
      }"
    >
      <button
        v-for="(item, i) in items"
        :key="item.id"
        type="button"
        class="bento-cell group overflow-hidden"
        :style="cellStyle(i)"
        @click="item.type === 'video' ? $emit('open-video', item) : $emit('open-lightbox', item)"
      >
        <img
          :src="String(item.coverUrl || item.src || '')"
          :alt="String(item.title || '')"
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <!-- Video play icon -->
        <div
          v-if="item.type === 'video'"
          class="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <!-- Title overlay -->
        <div
          v-if="String(item.title || '')"
          class="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <span class="text-xs font-medium text-white">{{ String(item.title || '') }}</span>
        </div>
      </button>
    </div>

    <!-- Empty state -->
    <div v-else class="py-16 text-center text-sm text-[color:var(--color-ink-soft)]">
      No gallery items yet.
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue';
import type { MasonryItem } from '../../components/MasonryGrid.vue';
export type { GallerySectionProps, GallerySectionEmits } from '../../lib/component-contracts';

export default defineComponent({
  name: 'BentoGallerySection',
  props: {
    items: { type: Array as PropType<MasonryItem[]>, required: true },
    searchEnabled: { type: Boolean, default: false },
    availableTags: { type: Array as PropType<string[]>, default: () => [] },
    selectedTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ['open-lightbox', 'open-video', 'filter-click'],
  setup(props) {
    const gridCols = computed(() => (props.items.length <= 2 ? 2 : 3));

    /**
     * Assign spans row-by-row, alternating hero/regular rows.
     * Every row sums to exactly `cols` columns — no gaps possible.
     *
     * Hero row:    [span 2] + [span 1]  = 3 cols (2 items)
     * Regular row: [span 1] × 3         = 3 cols (3 items)
     * Tail:        remaining items expanded to fill the row
     */
    const cellStyles = computed(() => {
      const cols = gridCols.value;
      const n = props.items.length;
      if (!n) return [];

      const spans: number[] = [];
      let idx = 0;
      let heroRow = true;

      while (idx < n) {
        const remaining = n - idx;

        if (heroRow && remaining >= 2) {
          // Hero row: first item span 2, second span 1
          spans.push(2, 1);
          idx += 2;
        } else if (remaining >= cols) {
          // Regular row: cols items, each span 1
          for (let i = 0; i < cols; i++) spans.push(1);
          idx += cols;
        } else {
          // Tail: expand remaining items to fill the row exactly
          const perItem = Math.floor(cols / remaining);
          let extra = cols % remaining;
          for (let i = 0; i < remaining; i++) {
            let s = perItem;
            if (extra > 0) {
              s++;
              extra--;
            }
            spans.push(s);
          }
          idx += remaining;
        }
        heroRow = !heroRow;
      }

      return spans.map((s) => ({
        gridColumn: `span ${s}`,
        gridRow: 'span 1',
      }));
    });

    const cellStyle = (index: number) => cellStyles.value[index] ?? {};

    return { gridCols, cellStyle };
  },
});
</script>

<style scoped>
.bento-cell {
  position: relative;
  background: var(--bento-card-bg, #fff);
  border: 1px solid var(--bento-card-border, transparent);
  border-radius: var(--bento-card-radius, 1.5rem);
  box-shadow: var(--bento-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.04));
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  min-height: 0;
}
.bento-cell:hover {
  transform: scale(var(--bento-hover-scale, 1.02));
}

@media (max-width: 640px) {
  .bento-gallery .grid {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-auto-flow: dense !important;
  }
  .bento-cell {
    grid-column-start: auto !important;
    grid-column-end: span 1 !important;
    grid-row: auto !important;
  }
}
</style>
