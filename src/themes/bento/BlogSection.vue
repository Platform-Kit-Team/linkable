<template>
  <section class="bento-articles mx-auto w-full" style="max-width: var(--bento-grid-width, 960px)">
    <!-- Article detail view -->
    <template v-if="currentPost">
      <div class="bento-card overflow-hidden p-3 sm:p-6">
        <button
          class="mb-4 flex items-center gap-1 text-xs font-medium text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
          @click="$emit('back')"
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
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <img
          v-if="currentPost.coverImage"
          :src="currentPost.coverImage"
          alt=""
          class="mb-4 w-full rounded-2xl object-cover shadow-sm"
          style="max-height: 320px"
        />
        <AudioPlayer v-if="currentPost.audio || currentPost.audioUrl" :src="currentPost.audio || currentPost.audioUrl" class="mb-4" />
        <div
          v-if="currentPost.date"
          class="mb-2 text-[11px] font-medium uppercase tracking-widest text-[color:var(--color-brand)]"
        >
          {{ formatDate(currentPost.date) }}
        </div>
        <h1
          class="mb-4 text-2xl font-extrabold leading-tight text-[color:var(--color-ink)] sm:text-3xl"
        >
          {{ currentPost.title }}
        </h1>
        <div class="prose-content text-[color:var(--color-ink)]" v-html="sanitizeHtml(currentPost.html)" />
      </div>

      <!-- Edit article button -->
      <button
        v-if="canUseCms"
        class="!fixed !top-4 !right-3 !z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-lg hover:brightness-110 transition sm:!top-6 sm:!right-6"
        title="Edit article"
        @click="openBlogEditor"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          />
        </svg>
      </button>
    </template>

    <!-- Newsletter detail view -->
    <template v-else-if="viewingNewsletter">
      <div class="bento-card overflow-hidden p-3 sm:p-6">
        <button
          class="mb-4 flex items-center gap-1 text-xs font-medium text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
          @click="closeNewsletterDetail"
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
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <div v-if="nlLoading" class="flex items-center justify-center py-16">
          <div
            class="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--color-ink-soft)] border-t-transparent"
          />
        </div>
        <article v-else-if="nlData">
          <img
            v-if="nlData.cover_image"
            :src="nlData.cover_image"
            alt=""
            class="mb-4 w-full rounded-2xl object-cover shadow-sm"
            style="max-height: 320px"
          />
          <div
            v-if="nlData.sent_at"
            class="mb-2 text-[11px] font-medium uppercase tracking-widest text-[color:var(--color-brand)]"
          >
            {{ formatDate(nlData.sent_at) }}
          </div>
          <h1
            class="mb-4 text-2xl font-extrabold leading-tight text-[color:var(--color-ink)] sm:text-3xl"
          >
            {{ nlData.subject }}
          </h1>
          <div class="prose-content text-[color:var(--color-ink)]" v-html="sanitizeHtml(nlData.body_html)" />
        </article>
      </div>

      <!-- Edit newsletter button -->
      <button
        v-if="canUseCms && nlData"
        class="!fixed !top-4 !right-3 !z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-lg hover:brightness-110 transition sm:!top-6 sm:!right-6"
        title="Edit newsletter"
        @click="openNlEditor"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          />
        </svg>
      </button>
    </template>

    <!-- List view -->
    <template v-else>
      <!-- Search bar -->
      <SearchBar
        v-if="searchEnabled"
        v-model="searchQuery"
        placeholder="Search articles…"
        :show-search="searchEnabled"
        :tag-count="
          (availableTags.length || allTags.length) > 0
            ? availableTags.length || allTags.length
            : null
        "
        :selected-tag-count="selectedTags.length"
        @filter-click="$emit('filter-click')"
      />

      <!-- Type filter -->
      <div class="mb-4 flex flex-wrap items-center gap-2 px-1">
        <button
          v-for="f in typeFilters"
          :key="f.value"
          class="rounded-full px-3 py-1 text-xs font-medium transition"
          :class="
            activeTypeFilter === f.value
              ? 'bg-[var(--color-brand)] text-white'
              : 'text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]'
          "
          @click="activeTypeFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- Posts grid -->
      <div
        v-if="filteredItems.length"
        class="grid gap-[var(--bento-gap)] sm:grid-cols-2 lg:grid-cols-3"
      >
        <button
          v-for="item in filteredItems"
          :key="item.id"
          type="button"
          class="bento-card group flex flex-col overflow-hidden text-left transition-transform"
          @click="openItem(item)"
        >
          <img
            v-if="item.coverImage"
            :src="item.coverImage"
            alt=""
            class="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div class="flex flex-1 flex-col p-4">
            <div class="mb-1 flex items-center gap-2">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                :class="
                  item.kind === 'newsletter'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                "
              >
                {{ item.kind === 'newsletter' ? 'Newsletter' : 'Article' }}
              </span>
              <span v-if="item.date" class="text-[10px] text-[color:var(--color-ink-soft)]">
                {{ formatDate(item.date) }}
              </span>
            </div>
            <h3 class="mt-1 text-sm font-semibold leading-snug text-[color:var(--color-ink)]">
              {{ item.title }}
            </h3>
            <p
              v-if="item.excerpt"
              class="mt-1 line-clamp-2 text-xs text-[color:var(--color-ink-soft)]"
            >
              {{ item.excerpt }}
            </p>
          </div>
        </button>
      </div>

      <div v-else class="py-16 text-center text-sm text-[color:var(--color-ink-soft)]">
        No articles yet.
      </div>
    </template>

    <!-- Editor drawers -->
    <BlogEditorDrawer
      v-if="canUseCms"
      v-model:open="blogEditorOpen"
      :post="currentPost"
      :original-slug="currentPost?.slug || ''"
      :all-tags="allBlogTags"
      @saved="$emit('back')"
    />
    <NewsletterComposeDrawer
      v-if="canUseCms"
      v-model:open="nlEditorOpen"
      :send-record="nlSendRecord"
      @saved="onNlSaved"
    />
  </section>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  inject,
  onMounted,
  watch,
  type PropType,
  type ComputedRef,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BlogPost, BlogPostMeta } from './blog-types';
import SearchBar from './components/SearchBar.vue';
import BlogEditorDrawer from '../../admin/BlogEditorDrawer.vue';
import NewsletterComposeDrawer from '../../admin/NewsletterComposeDrawer.vue';
import AudioPlayer from './components/AudioPlayer.vue';
import { sanitizeHtml } from '../../lib/sanitize-html';
export type { BlogSectionProps, BlogSectionEmits } from '../../lib/component-contracts';

interface UnifiedItem {
  id: string;
  kind: 'article' | 'newsletter';
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  slug?: string;
  sendId?: string;
}

interface NlSend {
  id: string;
  subject: string;
  cover_image: string;
  body_html: string;
  sent_at: string | null;
}

const typeFilters = [
  { value: 'all', label: 'All' },
  { value: 'article', label: 'Articles' },
  { value: 'newsletter', label: 'Newsletters' },
] as const;

export default defineComponent({
  name: 'BentoBlogSection',
  components: { SearchBar, BlogEditorDrawer, NewsletterComposeDrawer, AudioPlayer },
  props: {
    posts: { type: Array as PropType<BlogPostMeta[]>, required: true },
    currentPost: { type: Object as PropType<BlogPost | null>, default: null },
    label: { type: String, default: 'Articles' },
    searchEnabled: { type: Boolean, default: false },
    availableTags: { type: Array as PropType<string[]>, default: () => [] },
    selectedTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ['load-post', 'back', 'filter-click'],
  setup(props, { emit }) {
    const route = useRoute();
    const router = useRouter();
    const canUseCms = inject<ComputedRef<boolean>>(
      'canUseCms',
      computed(() => false),
    );
    const searchQuery = ref('');
    const activeTypeFilter = ref<'all' | 'article' | 'newsletter'>('all');
    const newsletterSends = ref<NlSend[]>([]);
    const viewingNewsletter = ref<string | null>(null);
    const nlData = ref<NlSend | null>(null);
    const nlLoading = ref(false);
    const blogEditorOpen = ref(false);
    const nlEditorOpen = ref(false);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    async function fetchNewsletterList() {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/newsletter-view?list=1`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${anonKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) newsletterSends.value = data;
        }
      } catch {
        /* silent */
      }
    }

    async function fetchNewsletterDetail(id: string) {
      nlLoading.value = true;
      nlData.value = null;
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/newsletter-view?id=${encodeURIComponent(id)}`,
          {
            headers: { Accept: 'application/json', Authorization: `Bearer ${anonKey}` },
          },
        );
        if (res.ok) nlData.value = await res.json();
      } catch {
        /* silent */
      } finally {
        nlLoading.value = false;
      }
    }

    const openNewsletterDetail = async (id: string, pushRoute = true) => {
      if (!id) return;
      viewingNewsletter.value = id;
      await fetchNewsletterDetail(id);
      if (pushRoute && route.path !== `/newsletter/${encodeURIComponent(id)}`) {
        router.push(`/newsletter/${encodeURIComponent(id)}`);
      }
    };

    const closeNewsletterDetail = () => {
      viewingNewsletter.value = null;
      nlData.value = null;
      if (route.path.startsWith('/newsletter/')) {
        router.push('/blog');
      }
    };

    const syncNewsletterFromRoute = async () => {
      if (props.currentPost) return;
      const path = route.path || '';
      if (path.startsWith('/newsletter/')) {
        const id = decodeURIComponent(path.slice('/newsletter/'.length));
        if (id) {
          if (viewingNewsletter.value !== id) {
            await openNewsletterDetail(id, false);
          }
          return;
        }
      }
      viewingNewsletter.value = null;
      nlData.value = null;
    };

    onMounted(fetchNewsletterList);
    onMounted(() => {
      void syncNewsletterFromRoute();
    });
    watch(
      () => route.path,
      () => {
        void syncNewsletterFromRoute();
      },
    );

    const allTags = computed(() => {
      const tags = new Set<string>();
      for (const p of props.posts) {
        for (const t of p.tags ?? []) tags.add(t);
      }
      return [...tags];
    });

    const unifiedItems = computed<UnifiedItem[]>(() => {
      const articles: UnifiedItem[] = props.posts.map((p) => ({
        id: `blog-${p.slug}`,
        kind: 'article' as const,
        title: p.title,
        excerpt: p.excerpt ?? '',
        coverImage: p.coverImage ?? '',
        date: p.date ?? '',
        slug: p.slug,
      }));
      const newsletters: UnifiedItem[] = newsletterSends.value.map((n) => ({
        id: `nl-${n.id}`,
        kind: 'newsletter' as const,
        title: n.subject,
        excerpt: '',
        coverImage: n.cover_image ?? '',
        date: n.sent_at ?? '',
        sendId: n.id,
      }));
      return [...articles, ...newsletters].sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
    });

    const filteredItems = computed(() => {
      let items = unifiedItems.value;
      if (activeTypeFilter.value !== 'all') {
        items = items.filter((i) => i.kind === activeTypeFilter.value);
      }
      const q = searchQuery.value.trim().toLowerCase();
      if (q) {
        items = items.filter(
          (i) => i.title.toLowerCase().includes(q) || i.excerpt.toLowerCase().includes(q),
        );
      }
      return items;
    });

    const openItem = (item: UnifiedItem) => {
      if (item.kind === 'article' && item.slug) {
        emit('load-post', item.slug);
      } else if (item.kind === 'newsletter' && item.sendId) {
        void openNewsletterDetail(item.sendId);
      }
    };

    const formatDate = (d: string) => {
      if (!d) return '';
      try {
        return new Date(d).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return d;
      }
    };

    const allBlogTags = computed(() => {
      const tags = new Set<string>();
      for (const p of props.posts) {
        for (const t of p.tags ?? []) tags.add(t);
      }
      return [...tags];
    });

    const nlSendRecord = computed(() => {
      const d = nlData.value;
      if (!d) return null;
      return {
        id: d.id,
        subject: d.subject,
        cover_image: d.cover_image ?? '',
        tags: [] as string[],
        excerpt_html: '',
        body_html: d.body_html ?? '',
        status: 'sent',
        scheduled_at: null,
        sent_at: d.sent_at,
        recipient_count: 0,
        created_at: d.sent_at ?? '',
        updated_at: d.sent_at ?? '',
      };
    });

    const openBlogEditor = () => {
      blogEditorOpen.value = true;
    };
    const openNlEditor = () => {
      nlEditorOpen.value = true;
    };

    const onNlSaved = () => {
      if (viewingNewsletter.value) fetchNewsletterDetail(viewingNewsletter.value);
    };

    return {
      canUseCms,
      searchQuery,
      typeFilters,
      activeTypeFilter,
      allTags,
      allBlogTags,
      filteredItems,
      closeNewsletterDetail,
      viewingNewsletter,
      nlData,
      nlLoading,
      nlSendRecord,
      blogEditorOpen,
      nlEditorOpen,
      openItem,
      openBlogEditor,
      openNlEditor,
      onNlSaved,
      formatDate,
      sanitizeHtml,
    };
  },
});
</script>

<style scoped>
.bento-card {
  background: var(--bento-card-bg, #fff);
  border: 1px solid var(--bento-card-border, transparent);
  border-radius: var(--bento-card-radius, 1.5rem);
  box-shadow: var(--bento-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.04));
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.bento-card:hover {
  transform: scale(var(--bento-hover-scale, 1.02));
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
.prose-content :deep(blockquote) {
  border-left: 3px solid var(--color-accent, #3b82f6);
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
  color: var(--color-accent, #3b82f6);
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
  background: rgba(59, 130, 246, 0.08);
  border-radius: 4px;
  padding: 0.15em 0.35em;
  font-size: 0.9em;
}
.prose-content :deep(pre code) {
  background: none;
  padding: 0;
  font-size: inherit;
}
</style>
