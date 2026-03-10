<template>
  <section class="docs-layout mx-auto w-full" style="max-width: var(--bento-grid-width, 960px)">
    <!-- Mobile sidebar toggle -->
    <button
      v-if="!sidebarOpen"
      class="mb-0 flex items-center gap-1.5 rounded-full border border-[var(--bento-card-border,rgba(0,0,0,0.06))] bg-[var(--bento-card-bg,#fff)] px-4 py-2 text-xs font-medium text-[color:var(--color-ink-soft)] shadow-sm transition hover:text-[color:var(--color-ink)] lg:hidden"
      @click="sidebarOpen = true"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 12h18" />
        <path d="M3 6h18" />
        <path d="M3 18h18" />
      </svg>
      Menu
    </button>

    <div class="flex gap-6">
      <!-- Sidebar -->
      <aside class="docs-sidebar shrink-0" :class="sidebarOpen ? 'docs-sidebar--open' : ''">
        <!-- Mobile close -->
        <div class="mb-3 flex items-center justify-between lg:hidden">
          <span
            class="text-xs font-extrabold uppercase tracking-wider text-[color:var(--color-ink-soft)]"
            >Navigation</span
          >
          <button
            class="rounded-full p-1.5 text-[color:var(--color-ink-soft)] hover:bg-black/5 hover:text-[color:var(--color-ink)]"
            @click="sidebarOpen = false"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <!-- Search trigger -->
        <div v-if="searchEnabled" class="mb-4">
          <button
            class="mt-[30px] flex w-full items-center gap-2 rounded-[25px] border border-[var(--bento-card-border,rgba(0,0,0,0.06))] bg-[var(--bento-card-bg,#fff)] px-3 py-2 text-xs text-[color:var(--color-ink-soft)] transition hover:border-[var(--color-brand,#6366f1)] hover:text-[color:var(--color-ink)]"
            @click="openSearch"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span class="flex-1 text-left">Search docs…</span>
            <kbd
              class="hidden rounded border border-[var(--bento-card-border,rgba(0,0,0,0.1))] bg-[var(--bg,#f5f5f7)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--color-ink-soft)] sm:inline"
              >⌘K</kbd
            >
          </button>
        </div>

        <!-- Nav tree -->
        <nav class="docs-nav">
          <div v-for="section in navTree" :key="section.title" class="mb-3">
            <button
              v-if="section.title"
              class="docs-nav-section"
              @click="toggleSection(section.title)"
            >
              <span>{{ section.title }}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="transition-transform duration-200"
                :class="expandedSections.has(section.title) ? 'rotate-90' : ''"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <div
              v-show="!section.title || expandedSections.has(section.title)"
              class="docs-nav-items"
            >
              <button
                v-for="item in section.items"
                :key="item.slug"
                class="docs-nav-item"
                :class="{ 'docs-nav-item--active': currentSlug === item.slug }"
                @click="navigateTo(item.slug)"
              >
                {{ item.title || item.slug }}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Backdrop for mobile sidebar -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black/20 lg:hidden"
        @click="sidebarOpen = false"
      />

      <!-- Search Modal -->
      <Teleport to="body">
        <Transition name="search-modal">
          <div
            v-if="searchOpen"
            class="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[12vh]"
            @mousedown.self="closeSearch"
          >
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="closeSearch" />
            <div
              ref="searchModalRef"
              class="relative z-10 flex max-h-[min(70vh,560px)] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-[var(--bento-card-border,rgba(0,0,0,0.08))] bg-[var(--bento-card-bg,#fff)] shadow-2xl mx-4"
            >
              <!-- Search input -->
              <div
                class="flex items-center gap-3 border-b border-[var(--bento-card-border,rgba(0,0,0,0.06))] px-5 py-4"
              >
                <svg
                  class="shrink-0 text-[color:var(--color-ink-soft)]"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref="searchInputRef"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search…"
                  class="min-w-0 flex-1 bg-transparent text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-soft)] outline-none"
                  @keydown.escape="closeSearch"
                  @keydown.enter="selectFirstResult"
                  @keydown.down.prevent="highlightNext"
                  @keydown.up.prevent="highlightPrev"
                />
                <button
                  v-if="searchQuery"
                  class="shrink-0 rounded-md p-1 text-[color:var(--color-ink-soft)] hover:bg-black/5"
                  @click="searchQuery = ''"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
                <kbd
                  class="hidden shrink-0 rounded border border-[var(--bento-card-border,rgba(0,0,0,0.1))] bg-[var(--bg,#f5f5f7)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--color-ink-soft)] sm:inline"
                  >ESC</kbd
                >
              </div>

              <!-- Results -->
              <div class="flex-1 overflow-y-auto overscroll-contain">
                <!-- Section filters (when no query) -->
                <template v-if="!searchQuery.trim()">
                  <div class="px-5 pb-2 pt-3">
                    <div
                      class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]"
                    >
                      Filters
                    </div>
                  </div>
                  <div class="px-3 pb-4">
                    <button
                      v-for="section in sectionFilters"
                      :key="section.title"
                      class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[rgba(0,0,0,0.03)]"
                      @click="applySectionFilter(section.title)"
                    >
                      <svg
                        class="shrink-0 text-[color:var(--color-ink-soft)]"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                      <span class="flex-1 text-sm font-medium text-[color:var(--color-ink)]">{{
                        section.title || 'General'
                      }}</span>
                      <span
                        class="rounded-full bg-[var(--bg,#f5f5f7)] px-2 py-0.5 text-xs font-medium tabular-nums text-[color:var(--color-ink-soft)]"
                        >{{ section.count }}</span
                      >
                    </button>
                  </div>
                </template>

                <!-- Search results -->
                <template v-else>
                  <div v-if="searchResults.length" class="px-3 py-2">
                    <button
                      v-for="(item, i) in searchResults"
                      :key="item.slug"
                      class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                      :class="
                        highlightedIndex === i
                          ? 'bg-[var(--color-brand,#6366f1)]/8'
                          : 'hover:bg-[rgba(0,0,0,0.03)]'
                      "
                      @click="selectResult(item.slug)"
                      @mouseenter="highlightedIndex = i"
                    >
                      <svg
                        class="shrink-0 text-[color:var(--color-ink-soft)]"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                      </svg>
                      <div class="min-w-0 flex-1">
                        <div
                          class="text-sm font-medium text-[color:var(--color-ink)]"
                          :class="
                            highlightedIndex === i ? 'text-[color:var(--color-brand,#6366f1)]' : ''
                          "
                        >
                          {{ item.title || item.slug }}
                        </div>
                        <div
                          v-if="item.section"
                          class="mt-0.5 text-xs text-[color:var(--color-ink-soft)]"
                        >
                          {{ item.section }}
                        </div>
                      </div>
                      <svg
                        v-if="highlightedIndex === i"
                        class="shrink-0 text-[color:var(--color-brand,#6366f1)]"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="9 10 4 15 9 20" />
                        <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                      </svg>
                    </button>
                  </div>
                  <div v-else class="px-5 py-10 text-center">
                    <div class="mb-1 text-sm font-medium text-[color:var(--color-ink)]">
                      No results found
                    </div>
                    <div class="text-xs text-[color:var(--color-ink-soft)]">
                      Try a different search term
                    </div>
                  </div>
                </template>
              </div>

              <!-- Footer -->
              <div
                class="flex items-center gap-4 border-t border-[var(--bento-card-border,rgba(0,0,0,0.06))] px-5 py-2.5 text-[10px] text-[color:var(--color-ink-soft)]"
              >
                <span class="flex items-center gap-1"
                  ><kbd
                    class="rounded border border-[var(--bento-card-border,rgba(0,0,0,0.1))] bg-[var(--bg,#f5f5f7)] px-1 font-mono"
                    >↑↓</kbd
                  >
                  navigate</span
                >
                <span class="flex items-center gap-1"
                  ><kbd
                    class="rounded border border-[var(--bento-card-border,rgba(0,0,0,0.1))] bg-[var(--bg,#f5f5f7)] px-1 font-mono"
                    >↵</kbd
                  >
                  select</span
                >
                <span class="flex items-center gap-1"
                  ><kbd
                    class="rounded border border-[var(--bento-card-border,rgba(0,0,0,0.1))] bg-[var(--bg,#f5f5f7)] px-1 font-mono"
                    >esc</kbd
                  >
                  close</span
                >
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Content area -->
      <div class="docs-content min-w-0 flex-1">
        
        <template v-if="currentDoc">
          <!-- Breadcrumb -->
          <div class="mb-4 flex items-center gap-1.5 text-xs text-[color:var(--color-ink-soft)]">
            <button class="hover:text-[color:var(--color-ink)] transition" @click="navigateTo('')">
              Docs
            </button>
            <template v-if="currentDoc.section">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
              <span>{{ currentDoc.section }}</span>
            </template>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span class="font-medium text-[color:var(--color-ink)]">{{ currentDoc.title }}</span>
          </div>

          <!-- Article -->
          <article class="bento-card overflow-hidden p-4 sm:p-8">
            <h1
              class="mb-6 text-2xl font-extrabold leading-tight text-[color:var(--color-ink)] sm:text-3xl"
            >
              {{ currentDoc.title }}
            </h1>
            <div
              class="prose-content text-[color:var(--color-ink)]"
              v-html="sanitizeHtml(currentDoc.html || '')"
            />
          </article>

          <!-- Prev/Next navigation -->
          <div class="mt-6 flex items-stretch gap-4" v-if="prevDoc || nextDoc">
            <button
              v-if="prevDoc"
              class="bento-card flex flex-1 flex-col items-start p-4 text-left transition hover:border-[var(--color-brand)]"
              @click="navigateTo(prevDoc.slug)"
            >
              <span
                class="mb-1 text-[10px] font-medium uppercase tracking-widest text-[color:var(--color-ink-soft)]"
                >Previous</span
              >
              <span class="text-sm font-semibold text-[color:var(--color-brand)]">{{
                prevDoc.title
              }}</span>
            </button>
            <div v-else class="flex-1" />
            <button
              v-if="nextDoc"
              class="bento-card flex flex-1 flex-col items-end p-4 text-right transition hover:border-[var(--color-brand)]"
              @click="navigateTo(nextDoc.slug)"
            >
              <span
                class="mb-1 text-[10px] font-medium uppercase tracking-widest text-[color:var(--color-ink-soft)]"
                >Next</span
              >
              <span class="text-sm font-semibold text-[color:var(--color-brand)]">{{
                nextDoc.title
              }}</span>
            </button>
          </div>
        </template>

        <!-- Landing / index view -->
        <template v-else>
          <div class="bento-card p-6 sm:p-8" style="margin-top: 30px">
            <h1 class="mb-2 text-2xl font-extrabold text-[color:var(--color-ink)]">
              {{ label }}
            </h1>
            <p class="mb-6 text-sm text-[color:var(--color-ink-soft)]">
              Browse the documentation using the sidebar or choose a topic below.
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <button
                v-for="section in navTree"
                :key="section.title || 'root'"
                class="rounded-xl border border-[var(--bento-card-border,rgba(0,0,0,0.06))] bg-[var(--bg)] p-4 text-left transition hover:border-[var(--color-brand)]"
                @click="section.items.length && navigateTo(section.items[0].slug)"
              >
                <div class="text-sm font-semibold text-[color:var(--color-ink)]">
                  {{ section.title || 'General' }}
                </div>
                <div class="mt-0.5 text-xs text-[color:var(--color-ink-soft)]">
                  {{ section.items.length }} {{ section.items.length === 1 ? 'page' : 'pages' }}
                </div>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
  type PropType,
} from 'vue';
import { sanitizeHtml } from '../../lib/sanitize-html';

interface DocItem {
  slug: string;
  title: string;
  section: string;
  order: number;
  _path?: string;
  html?: string;
  [k: string]: unknown;
}

interface NavSection {
  title: string;
  path: string;
  items: DocItem[];
}

export default defineComponent({
  name: 'BentoDocsSection',
  props: {
    docs: { type: Array as PropType<DocItem[]>, required: true },
    currentDoc: { type: Object as PropType<DocItem | null>, default: null },
    label: { type: String, default: 'Documentation' },
    searchEnabled: { type: Boolean, default: false },
  },
  emits: ['load-doc', 'back'],
  setup(props, { emit }) {
    const sidebarOpen = ref(false);
    const searchQuery = ref('');
    const expandedSections = ref(new Set<string>());
    const searchOpen = ref(false);
    const highlightedIndex = ref(0);
    const searchInputRef = ref<HTMLInputElement | null>(null);
    const searchModalRef = ref<HTMLDivElement | null>(null);

    // Build nav tree from docs list, preserving server-side order
    // Items arrive pre-ordered from _meta.json / scanCollectionDir
    const navTree = computed<NavSection[]>(() => {
      const sectionOrder: string[] = [];
      const sectionMap = new Map<string, DocItem[]>();
      const sectionPaths = new Map<string, string>();
      for (const doc of props.docs) {
        const sectionName = doc.section || '';
        const sectionPath = doc._path || '';
        if (!sectionMap.has(sectionName)) {
          sectionMap.set(sectionName, []);
          sectionOrder.push(sectionName);
          sectionPaths.set(sectionName, sectionPath);
        }
        sectionMap.get(sectionName)!.push(doc);
      }
      return sectionOrder.map((title) => ({
        title,
        path: sectionPaths.get(title) || '',
        items: sectionMap.get(title)!,
      }));
    });

    // Flatten for ordered prev/next nav
    const flatDocs = computed(() => navTree.value.flatMap((s) => s.items));

    const currentSlug = computed(() => props.currentDoc?.slug || '');

    const currentIndex = computed(() =>
      flatDocs.value.findIndex((d) => d.slug === currentSlug.value),
    );

    const prevDoc = computed(() =>
      currentIndex.value > 0 ? flatDocs.value[currentIndex.value - 1] : null,
    );

    const nextDoc = computed(() =>
      currentIndex.value >= 0 && currentIndex.value < flatDocs.value.length - 1
        ? flatDocs.value[currentIndex.value + 1]
        : null,
    );

    const searchResults = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      if (!q) return [];
      return props.docs.filter(
        (d) =>
          (d.title || '').toLowerCase().includes(q) ||
          (d.slug || '').toLowerCase().includes(q) ||
          (d.section || '').toLowerCase().includes(q),
      );
    });

    // Section filters with counts for the search modal
    const sectionFilters = computed(() => {
      const counts = new Map<string, number>();
      for (const doc of props.docs) {
        const s = doc.section || '';
        counts.set(s, (counts.get(s) || 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count);
    });

    // Reset highlight when query changes
    watch(searchQuery, () => {
      highlightedIndex.value = 0;
    });

    // Auto-expand section containing current doc
    watch(
      () => props.currentDoc,
      (doc) => {
        if (doc?.section) {
          expandedSections.value.add(doc.section);
        }
      },
      { immediate: true },
    );

    // Expand all sections on mount
    watch(
      navTree,
      (tree) => {
        for (const s of tree) {
          if (s.title) expandedSections.value.add(s.title);
        }
      },
      { immediate: true },
    );

    const toggleSection = (title: string) => {
      if (expandedSections.value.has(title)) {
        expandedSections.value.delete(title);
      } else {
        expandedSections.value.add(title);
      }
    };

    // Search modal controls
    const openSearch = () => {
      searchOpen.value = true;
      searchQuery.value = '';
      highlightedIndex.value = 0;
      nextTick(() => searchInputRef.value?.focus());
    };

    const closeSearch = () => {
      searchOpen.value = false;
      searchQuery.value = '';
    };

    const selectResult = (slug: string) => {
      closeSearch();
      navigateTo(slug);
    };

    const selectFirstResult = () => {
      if (searchResults.value.length) {
        selectResult(
          searchResults.value[highlightedIndex.value]?.slug || searchResults.value[0].slug,
        );
      }
    };

    const highlightNext = () => {
      if (searchResults.value.length) {
        highlightedIndex.value = (highlightedIndex.value + 1) % searchResults.value.length;
      }
    };

    const highlightPrev = () => {
      if (searchResults.value.length) {
        highlightedIndex.value =
          (highlightedIndex.value - 1 + searchResults.value.length) % searchResults.value.length;
      }
    };

    const applySectionFilter = (section: string) => {
      searchQuery.value = section || 'General';
    };

    // Cmd+K / Ctrl+K keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchOpen.value) closeSearch();
        else openSearch();
      }
    };

    onMounted(() => document.addEventListener('keydown', handleKeyDown));
    onUnmounted(() => document.removeEventListener('keydown', handleKeyDown));

    const navigateTo = (slug: string) => {
      sidebarOpen.value = false;
      searchQuery.value = '';
      if (!slug) {
        emit('back');
      } else {
        emit('load-doc', slug);
      }
    };

    return {
      sidebarOpen,
      searchQuery,
      expandedSections,
      navTree,
      currentSlug,
      prevDoc,
      nextDoc,
      searchResults,
      sectionFilters,
      searchOpen,
      highlightedIndex,
      searchInputRef,
      searchModalRef,
      toggleSection,
      navigateTo,
      openSearch,
      closeSearch,
      selectResult,
      selectFirstResult,
      highlightNext,
      highlightPrev,
      applySectionFilter,
      sanitizeHtml,
    };
  },
});
</script>

<style scoped>
.docs-sidebar {
  width: 240px;
  position: sticky;
  top: 1rem;
  align-self: flex-start;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
}

@media (max-width: 1023px) {
  .docs-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    width: 100vw;
    height: 100vh;
    padding: 1rem;
    background: var(--bg, #f5f5f7);
    border-right: none;
    border-bottom: none;
    border-radius: 0;
    box-shadow: none;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    max-width: 100vw;
    max-height: 100vh;
    overflow-y: auto;
  }
  .docs-sidebar--open {
    transform: translateX(0);
  }
}

.docs-nav-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-ink);
  border-radius: 0.5rem;
  transition: background 0.15s;
}
.docs-nav-section:hover {
  background: rgba(0, 0, 0, 0.03);
}

.docs-nav-items {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-left: 0.25rem;
}

.docs-nav-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-ink-soft);
  border-radius: 0.5rem;
  border-left: 2px solid transparent;
  transition: all 0.15s;
}
.docs-nav-item:hover {
  color: var(--color-ink);
  background: rgba(0, 0, 0, 0.03);
}
.docs-nav-item--active {
  color: var(--color-brand);
  border-left-color: var(--color-brand);
  background: rgba(99, 102, 241, 0.06);
  font-weight: 600;
}

.bento-card {
  background: var(--bento-card-bg, #fff);
  border: 1px solid var(--bento-card-border, transparent);
  border-radius: var(--bento-card-radius, 1.5rem);
  box-shadow: var(--bento-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.prose-content :deep(h2) {
  font-size: 1.375rem;
  font-weight: 700;
  margin: 1.5em 0 0.5em;
}
.prose-content :deep(h3) {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 1.2em 0 0.4em;
}
.prose-content :deep(p) {
  margin: 0.6em 0;
  line-height: 1.7;
}
.prose-content :deep(ul),
.prose-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0.6em 0;
}
.prose-content :deep(li) {
  margin: 0.25em 0;
  line-height: 1.6;
}
.prose-content :deep(blockquote) {
  border-left: 3px solid var(--color-brand, #6366f1);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--color-ink-soft);
  font-style: italic;
}
.prose-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}
.prose-content :deep(a) {
  color: var(--color-brand, #6366f1);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.prose-content :deep(pre) {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  font-size: 0.8125rem;
  margin: 1em 0;
}
.prose-content :deep(code) {
  background: rgba(99, 102, 241, 0.08);
  border-radius: 4px;
  padding: 0.15em 0.35em;
  font-size: 0.9em;
}
.prose-content :deep(pre code) {
  background: none;
  padding: 0;
  font-size: inherit;
}
.prose-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.875rem;
}
.prose-content :deep(th),
.prose-content :deep(td) {
  padding: 0.5em 0.75em;
  border: 1px solid var(--bento-card-border, rgba(0, 0, 0, 0.08));
  text-align: left;
}
.prose-content :deep(th) {
  font-weight: 600;
  background: rgba(0, 0, 0, 0.02);
}
.prose-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--bento-card-border, rgba(0, 0, 0, 0.08));
  margin: 2em 0;
}

/* Search modal transitions */
.search-modal-enter-active {
  transition: opacity 0.15s ease;
}
.search-modal-leave-active {
  transition: opacity 0.1s ease;
}
.search-modal-enter-from,
.search-modal-leave-to {
  opacity: 0;
}
.search-modal-enter-active .relative {
  animation: search-modal-pop 0.15s ease;
}
@keyframes search-modal-pop {
  from {
    transform: scale(0.97) translateY(-6px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
</style>
