<template>
  <section class="bento-all mx-auto w-full px-4" style="max-width: var(--bento-grid-width, 960px)">
    <!-- Edit mode toolbar -->
    <div v-if="editing" class="mb-4 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-sm ring-1 ring-black/5">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">Editing Grid</span>
        <div class="flex items-center gap-1.5 text-xs text-[color:var(--color-ink-soft)]">
          <label>Columns</label>
          <button class="grid h-6 w-6 place-items-center rounded-md bg-black/5 hover:bg-black/10" @click="setCols(gridColumns - 1)">&minus;</button>
          <span class="w-4 text-center font-semibold text-[color:var(--color-ink)]">{{ gridColumns }}</span>
          <button class="grid h-6 w-6 place-items-center rounded-md bg-black/5 hover:bg-black/10" @click="setCols(gridColumns + 1)">+</button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="rounded-full bg-[var(--color-brand)] px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:brightness-110 transition"
          @click="editing = false"
        >
          Done
        </button>
      </div>
    </div>

    <!-- Edit mode: add items bar -->
    <div v-if="editing" class="mb-4 flex flex-wrap items-center justify-center gap-2">
      <button
        v-for="t in addTypes"
        :key="t.type"
        class="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-medium text-[color:var(--color-ink)] shadow-sm ring-1 ring-black/5 transition hover:ring-[var(--color-brand)]/30 hover:shadow-md"
        @click="addItem(t.type)"
      >
        <component :is="t.icon" :size="14" />
        {{ t.label }}
      </button>
    </div>

    <!-- Bento grid powered by grid-layout-plus -->
    <GridLayout
      v-model:layout="glpLayout"
      :col-num="effectiveCols"
      :row-height="160"
      :margin="[glpGap, glpGap]"
      :is-draggable="editing"
      :is-resizable="editing"
      :vertical-compact="!isMobile"
      :use-css-transforms="true"
      :is-bounded="true"
      :responsive="false"
      class="bento-grid"
      :class="{ 'bento-grid--editing': editing }"
      @layout-updated="onLayoutUpdated"
    >
      <GridItem
        v-for="li in glpLayout"
        :key="li.i"
        :x="li.x"
        :y="li.y"
        :w="li.w"
        :h="li.h"
        :i="li.i"
        :min-w="1"
        :min-h="1"
        :max-h="6"
        drag-ignore-from="a, button, .bento-cell-inner"
        class="bento-grid__item"
        :class="{
          'bento-grid__item--selected': editing && selectedId === li.i,
        }"
        @click="editing ? selectItem(String(li.i)) : undefined"
        @moved="onItemMoved"
        @resized="onItemMoved"
      >
        <BentoCell
          :item="getBentoItem(String(li.i))"
          :links="allLinks"
          :gallery-items="allGalleryItems"
          :blog-posts="allBlogPosts"
          :embeds="allEmbeds"
          :class="{ 'pointer-events-none': editing }"
          @link-click="$emit('link-click', $event)"
          @open-lightbox="openLightbox($event)"
          @open-video="openVideo($event)"
          @load-post="loadPost($event)"
          @open-embed="openEmbed($event)"
        />

        <!-- Edit overlay & controls (shown when editing) -->
        <template v-if="editing">
          <!-- Selection ring -->
          <div class="absolute inset-0 z-20 rounded-[var(--bento-card-radius,1.5rem)] ring-2 transition-all"
            :class="selectedId === li.i ? 'ring-[var(--color-brand)]' : 'ring-transparent hover:ring-[var(--color-brand)]/40'"
          />
          <!-- Delete button -->
          <button
            class="absolute top-2 right-2 z-30 flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-red-500 shadow-sm backdrop-blur-sm ring-1 ring-black/10 hover:bg-red-50"
            @click.stop="removeItem(String(li.i))"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </template>
      </GridItem>
    </GridLayout>

    <!-- Selected item editor drawer -->
    <Drawer
      :visible="editing && !!selectedItem"
      position="right"
      :style="{ width: 'min(380px, 96vw)' }"
      :showCloseIcon="true"
      @update:visible="(v: boolean) => { if (!v) selectedId = null }"
    >
      <template #header>
        <div class="text-sm font-extrabold tracking-tight text-[color:var(--color-ink)]">
          Edit {{ selectedItem?.type }}
        </div>
      </template>

      <div v-if="selectedItem" class="space-y-4 p-2">
        <div class="rounded-2xl border border-[var(--color-border,rgba(0,0,0,0.06))] bg-white p-3 shadow-sm">
          <div class="grid gap-3">
            <!-- Content picker -->
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Content</label>
              <select
                v-if="selectedItem.type !== 'blog'"
                :value="selectedItem.refId"
                class="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                @change="updateSelectedRef(($event.target as HTMLSelectElement).value)"
              >
                <option value="">Select content…</option>
                <option v-for="opt in refOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <input
                v-else
                :value="selectedItem.refId"
                class="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                placeholder="Blog post slug, e.g. my-first-post"
                @input="updateSelectedRef(($event.target as HTMLInputElement).value)"
              />
            </div>

            <!-- Size controls -->
            <div class="grid grid-cols-4 gap-2">
              <div class="grid gap-1">
                <label class="text-[10px] font-semibold text-[color:var(--color-ink-soft)]">X</label>
                <input type="number" :value="selectedItem.col" :min="0" :max="gridColumns - 1"
                  class="w-full rounded-lg border border-black/10 px-2 py-1.5 text-center text-xs"
                  @input="updateItemField('col', +($event.target as HTMLInputElement).value)" />
              </div>
              <div class="grid gap-1">
                <label class="text-[10px] font-semibold text-[color:var(--color-ink-soft)]">Y</label>
                <input type="number" :value="selectedItem.row" :min="0" :max="20"
                  class="w-full rounded-lg border border-black/10 px-2 py-1.5 text-center text-xs"
                  @input="updateItemField('row', +($event.target as HTMLInputElement).value)" />
              </div>
              <div class="grid gap-1">
                <label class="text-[10px] font-semibold text-[color:var(--color-ink-soft)]">W</label>
                <input type="number" :value="selectedItem.colSpan" :min="1" :max="gridColumns"
                  class="w-full rounded-lg border border-black/10 px-2 py-1.5 text-center text-xs"
                  @input="updateItemField('colSpan', +($event.target as HTMLInputElement).value)" />
              </div>
              <div class="grid gap-1">
                <label class="text-[10px] font-semibold text-[color:var(--color-ink-soft)]">H</label>
                <input type="number" :value="selectedItem.rowSpan" :min="1" :max="6"
                  class="w-full rounded-lg border border-black/10 px-2 py-1.5 text-center text-xs"
                  @input="updateItemField('rowSpan', +($event.target as HTMLInputElement).value)" />
              </div>
            </div>
          </div>
        </div>

        <!-- Embed-specific fields -->
        <div v-if="selectedItem.type === 'embed'" class="rounded-2xl border border-[var(--color-border,rgba(0,0,0,0.06))] bg-white p-3 shadow-sm">
          <div class="grid gap-3">
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Thumbnail URL</label>
              <input :value="selectedItem.thumbnailUrl" class="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" placeholder="https://…"
                @input="updateItemField('thumbnailUrl', ($event.target as HTMLInputElement).value)" />
            </div>
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Header Text</label>
              <input :value="selectedItem.headerText" class="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" placeholder="e.g. Watch Demo"
                @input="updateItemField('headerText', ($event.target as HTMLInputElement).value)" />
            </div>
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Button Text</label>
              <input :value="selectedItem.buttonText" class="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" placeholder="e.g. Open"
                @input="updateItemField('buttonText', ($event.target as HTMLInputElement).value)" />
            </div>
          </div>
        </div>
      </div>
    </Drawer>

    <!-- Non-editing: empty state hint -->
    <div v-if="!editing && !gridItems.length && canEdit" class="mt-8 text-center">
      <button
        class="rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white shadow-sm hover:brightness-110 transition"
        @click="editing = true"
      >
        Edit Grid
      </button>
    </div>

    <!-- Floating edit button (when CMS is available but not editing) -->
    <button
      v-if="canEdit && !editing && gridItems.length"
      class="fixed top-4 right-3 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-lg hover:brightness-110 transition sm:top-6 sm:right-6"
      title="Edit grid layout"
      @click="editing = true"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path stroke-linecap="round" stroke-linejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>

    <!-- Embed overlay -->
    <div
      v-if="activeEmbed"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="activeEmbed = null"
    >
      <div class="bento-card relative mx-4 max-h-[90vh] w-full max-w-3xl overflow-auto p-6">
        <button
          class="absolute top-3 right-3 text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
          @click="activeEmbed = null"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="embed-content" v-html="activeEmbed.html" />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, computed, inject, ref, watch, onMounted, onUnmounted, type PropType, type Ref, type ComputedRef } from "vue";
import type { BioLink, BioModel, GalleryItem, EmbedItem } from "../../lib/model";
import type { BlogPostMeta } from "../../lib/blog";
import type { BentoGridData, BentoGridItem } from "./manifest";
import type { MasonryItem } from "../../components/MasonryGrid.vue";
import { Link, Image, BookOpen, Code, User } from "lucide-vue-next";
import { GridLayout, GridItem } from "grid-layout-plus";
import BentoCell from "./BentoCell.vue";
import Drawer from "primevue/drawer";
export type { LinksSectionProps, LinksSectionEmits } from "../../lib/component-contracts";

/** grid-layout-plus LayoutItem type */
interface GlpLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 40);

export default defineComponent({
  name: "BentoLinksSection",
  components: { BentoCell, Drawer, GridLayout, GridItem },
  props: {
    links: { type: Array as PropType<BioLink[]>, required: true },
    searchEnabled: { type: Boolean, default: false },
    availableTags: { type: Array as PropType<string[]>, default: () => [] },
    selectedTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ["link-click", "filter-click"],
  setup(props) {
    const model = inject<Ref<BioModel>>("bioModel");
    const blogPosts = inject<Ref<BlogPostMeta[]>>("blogPosts", ref([]));
    const canUseCms = inject<ComputedRef<boolean>>("canUseCms", computed(() => false));

    const editing = ref(false);
    const selectedId = ref<string | null>(null);
    let wasDragged = false;

    // ── Grid data (reads/writes directly on the injected model) ──
    const ensureGridData = (): BentoGridData => {
      if (!model?.value) return { columns: 4, items: [] };
      if (!model.value.theme.layoutData) model.value.theme.layoutData = {};
      const g = model.value.theme.layoutData.grid;
      if (g && typeof g === "object" && "items" in (g as any)) {
        return g as unknown as BentoGridData;
      }
      const fresh: BentoGridData = { columns: 4, items: [] };
      model.value.theme.layoutData.grid = fresh as any;
      return fresh;
    };

    const gridData = computed(() => ensureGridData());
    const gridColumns = computed(() => gridData.value.columns || 4);
    const gridItems = computed(() => gridData.value.items || []);
    const canEdit = computed(() => canUseCms.value);

    const selectedItem = computed(() =>
      selectedId.value ? gridItems.value.find((i) => i.id === selectedId.value) ?? null : null,
    );

    const allLinks = computed(() => props.links);
    const allGalleryItems = computed<GalleryItem[]>(() =>
      model?.value?.gallery?.items?.filter((i) => i.enabled) ?? [],
    );
    const allBlogPosts = computed<BlogPostMeta[]>(() =>
      blogPosts.value.filter((p) => p.published),
    );
    const allEmbeds = computed<EmbedItem[]>(() =>
      (model?.value?.embeds ?? []).filter((e) => e.enabled),
    );

    const activeEmbed = ref<EmbedItem | null>(null);

    // ── Ensure a profile card exists ──
    {
      const data = ensureGridData();
      if (!data.items.some((i) => i.type === "profile")) {
        data.items.unshift({
          id: "__profile__",
          type: "profile",
          refId: "",
          col: 0,
          row: 0,
          colSpan: Math.min(3, data.columns || 4),
          rowSpan: 2,
          thumbnailUrl: "",
          headerText: "",
          buttonText: "",
        });
      }
    }

    // Track effective column count — mobile caps at 2
    const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const onResize = () => { windowWidth.value = window.innerWidth; };
    onMounted(() => window.addEventListener('resize', onResize));
    onUnmounted(() => window.removeEventListener('resize', onResize));

    const effectiveCols = computed(() =>
      windowWidth.value <= 640 ? Math.min(2, gridColumns.value) : gridColumns.value
    );

    const isMobile = computed(() => effectiveCols.value < gridColumns.value);

    // ── Convert between BentoGridItem (1-based) and grid-layout-plus (0-based) ──
    const toGlp = (item: BentoGridItem): GlpLayoutItem => ({
      i: item.id,
      x: Math.max(0, (item.col || 1) - 1),
      y: Math.max(0, (item.row || 1) - 1),
      w: item.colSpan || 1,
      h: item.rowSpan || 1,
    });

    // Bin-pack items into a given number of columns (no overlaps)
    // Sort by desktop visual order (row, then col) so mobile matches desktop flow
    const packLayout = (items: BentoGridItem[], cols: number): GlpLayoutItem[] => {
      const sorted = [...items].sort((a, b) => {
        const rowA = (a.row || 1), rowB = (b.row || 1);
        if (rowA !== rowB) return rowA - rowB;
        return (a.col || 1) - (b.col || 1);
      });
      const layout = sorted.map((item): GlpLayoutItem => ({
        i: item.id,
        x: 0,
        y: 0,
        w: Math.min(item.colSpan || 1, cols),
        h: item.rowSpan || 1,
      }));
      const grid: boolean[][] = [];
      const ensureRows = (upTo: number) => {
        while (grid.length <= upTo) grid.push(new Array(cols).fill(false));
      };
      for (const li of layout) {
        let placed = false;
        for (let r = 0; !placed; r++) {
          ensureRows(r + li.h - 1);
          for (let c = 0; c <= cols - li.w; c++) {
            let fits = true;
            for (let dr = 0; dr < li.h && fits; dr++) {
              ensureRows(r + dr);
              for (let dc = 0; dc < li.w && fits; dc++) {
                if (grid[r + dr][c + dc]) fits = false;
              }
            }
            if (fits) {
              li.x = c;
              li.y = r;
              for (let dr = 0; dr < li.h; dr++) {
                for (let dc = 0; dc < li.w; dc++) {
                  grid[r + dr][c + dc] = true;
                }
              }
              placed = true;
              break;
            }
          }
        }
      }
      return layout;
    };

    const buildLayout = () => {
      if (isMobile.value) {
        return packLayout(gridItems.value, effectiveCols.value);
      }
      return gridItems.value.map(toGlp);
    };

    const glpLayout = ref<GlpLayoutItem[]>(buildLayout());

    // Keep glpLayout in sync when model grid items change externally or columns change
    watch(
      [
        () => gridItems.value.map((i) => `${i.id}:${i.col}:${i.row}:${i.colSpan}:${i.rowSpan}`).join("|"),
        effectiveCols,
      ],
      () => {
        glpLayout.value = buildLayout();
      },
    );

    // Parse gap from CSS var for grid-layout-plus margin
    const glpGap = computed(() => {
      const el = document.documentElement;
      const raw = getComputedStyle(el).getPropertyValue("--bento-gap").trim();
      if (!raw) return 16;
      const px = parseFloat(raw);
      if (!isNaN(px) && raw.endsWith("px")) return px;
      if (!isNaN(px) && raw.endsWith("rem")) return px * 16;
      return isNaN(px) ? 16 : px;
    });

    // Sync layout changes from grid-layout-plus back to our model
    // Only persist on desktop — mobile uses a derived/packed layout
    const onLayoutUpdated = (newLayout: GlpLayoutItem[]) => {
      if (isMobile.value) return;
      const data = ensureGridData();
      for (const li of newLayout) {
        const item = data.items.find((i) => i.id === li.i);
        if (item) {
          item.col = li.x + 1;
          item.row = li.y + 1;
          item.colSpan = li.w;
          item.rowSpan = li.h;
        }
      }
      commitGrid();
    };

    // Look up a BentoGridItem by id (for rendering BentoCell)
    const getBentoItem = (id: string): BentoGridItem => {
      return gridItems.value.find((i) => i.id === id) ?? {
        id,
        type: "link",
        refId: "",
        col: 1,
        row: 1,
        colSpan: 1,
        rowSpan: 1,
      };
    };

    // ── Mutate grid data (triggers auto-persist via model watcher) ──
    const commitGrid = () => {
      if (!model?.value) return;
      model.value.theme.layoutData = {
        ...model.value.theme.layoutData,
        grid: { ...ensureGridData() },
      };
    };

    const setCols = (n: number) => {
      const clamped = Math.max(2, Math.min(6, n));
      ensureGridData().columns = clamped;
      commitGrid();
    };

    const addTypes = [
      { type: "profile" as const, label: "Profile", icon: User },
      { type: "link" as const, label: "Link", icon: Link },
      { type: "gallery" as const, label: "Image/Video", icon: Image },
      { type: "blog" as const, label: "Blog Post", icon: BookOpen },
      { type: "embed" as const, label: "Embed", icon: Code },
    ];

    const nextFreeY = (): number => {
      const items = gridItems.value;
      if (!items.length) return 0;
      return Math.max(...items.map((i) => (i.row - 1) + i.rowSpan));
    };

    const addItem = (type: BentoGridItem["type"]) => {
      const data = ensureGridData();
      const item: BentoGridItem = {
        id: newId(),
        type,
        refId: "",
        col: 1,
        row: nextFreeY() + 1,
        colSpan: 2,
        rowSpan: 2,
        thumbnailUrl: "",
        headerText: "",
        buttonText: "",
      };
      data.items.push(item);
      glpLayout.value = buildLayout();
      selectedId.value = item.id;
      commitGrid();
    };

    const removeItem = (id: string) => {
      const data = ensureGridData();
      data.items = data.items.filter((i) => i.id !== id);
      glpLayout.value = buildLayout();
      if (selectedId.value === id) selectedId.value = null;
      commitGrid();
    };

    const onItemMoved = () => { wasDragged = true; };

    const selectItem = (id: string) => {
      if (wasDragged) { wasDragged = false; return; }
      selectedId.value = selectedId.value === id ? null : id;
    };

    const updateSelectedRef = (val: string) => {
      const item = gridItems.value.find((i) => i.id === selectedId.value);
      if (item) {
        item.refId = val;
        commitGrid();
      }
    };

    const updateItemField = (field: string, val: string | number) => {
      const item = gridItems.value.find((i) => i.id === selectedId.value);
      if (item) {
        (item as any)[field] = val;
        glpLayout.value = buildLayout();
        commitGrid();
      }
    };

    // ── Content reference options for the selected item ──
    const refOptions = computed(() => {
      if (!selectedItem.value || !model?.value) return [];
      const m = model.value;
      switch (selectedItem.value.type) {
        case "link":
          return m.links.filter((l) => l.enabled).map((l) => ({ label: l.title || l.url, value: l.id }));
        case "gallery":
          return (m.gallery?.items || []).filter((g) => g.enabled).map((g) => ({ label: g.title || g.src, value: g.id }));
        case "embed":
          return (m.embeds || []).filter((e) => e.enabled).map((e) => ({ label: e.label, value: e.id }));
        default:
          return [];
      }
    });

    // ── View interactions ──
    const openLightbox = (item: GalleryItem | MasonryItem) => {
      const win = window as any;
      if (win.__bentoLightbox) win.__bentoLightbox(item);
    };

    const openVideo = (item: GalleryItem | MasonryItem) => {
      const win = window as any;
      if (win.__bentoVideo) win.__bentoVideo(item);
    };

    const loadPost = (slug: string) => {
      const win = window as any;
      if (win.__bentoLoadPost) win.__bentoLoadPost(slug);
    };

    const openEmbed = (id: string) => {
      const embed = allEmbeds.value.find((e) => e.id === id);
      if (embed) activeEmbed.value = embed;
    };

    return {
      model,
      gridColumns,
      effectiveCols,
      isMobile,
      gridItems,
      canEdit,
      editing,
      selectedId,
      selectedItem,
      allLinks,
      allGalleryItems,
      allBlogPosts,
      allEmbeds,
      activeEmbed,
      refOptions,
      addTypes,
      glpLayout,
      glpGap,
      setCols,
      addItem,
      removeItem,
      selectItem,
      onItemMoved,
      updateSelectedRef,
      updateItemField,
      onLayoutUpdated,
      getBentoItem,
      openLightbox,
      openVideo,
      loadPost,
      openEmbed,
    };
  },
});
</script>

<style scoped>
.bento-card {
  background: var(--bento-card-bg, #fff);
  border: 1px solid var(--bento-card-border, transparent);
  border-radius: var(--bento-card-radius, 1.5rem);
  box-shadow: var(--bento-card-shadow, 0 1px 2px rgba(0,0,0,0.04));
}

.bento-grid__item {
  position: relative;
  min-height: 0;
}

.bento-grid__item > :first-child {
  width: 100%;
  height: 100%;
}

/* Style grid-layout-plus resizer to match our bento theme */
:deep(.vgl-item__resizer) {
  --vgl-resizer-border-color: var(--color-brand, #444);
}

/* Style the placeholder shown during drag/resize */
:deep(.vgl-item--placeholder) {
  --vgl-placeholder-bg: var(--color-brand, red);
  border-radius: var(--bento-card-radius, 1.5rem);
}
</style>
