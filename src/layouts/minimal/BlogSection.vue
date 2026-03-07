<template>
  <section class="space-y-4">
    <!-- Blog post detail view -->
    <template v-if="currentPost">
      <BlogPostView :post="currentPost" @back="$emit('back')" />
    </template>

    <!-- Blog listing -->
    <template v-else>
      <SearchBar
        v-if="(searchEnabled || availableTags.length > 0) && posts.length > 0"
        v-model="searchQuery"
        placeholder="Search posts…"
        :show-search="searchEnabled"
        :tag-count="availableTags.length > 0 ? availableTags.length : null"
        :selected-tag-count="selectedTags.length"
        @filter-click="$emit('filter-click')"
      />

      <h2
        class="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-ink-soft)]"
      >
        {{ label }}
      </h2>

      <div v-if="filtered.length === 0" class="py-8 text-center text-sm text-[color:var(--color-ink-soft)]">
        {{ searchQuery.trim() ? 'No matching posts.' : 'No posts yet.' }}
      </div>

      <div v-else class="divide-y divide-[var(--color-border2)]">
        <article
          v-for="post in filtered"
          :key="post.slug"
          class="group cursor-pointer py-4 transition first:pt-0 hover:opacity-80"
          @click="$emit('load-post', post.slug)"
        >
          <div class="flex items-start gap-4">
            <div
              v-if="post.coverImage"
              class="h-16 w-24 shrink-0 overflow-hidden rounded-md border border-[var(--color-border2)] sm:h-20 sm:w-28"
            >
              <img
                :src="post.coverImage"
                alt=""
                class="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-medium text-[color:var(--color-ink)]">
                {{ post.title }}
              </h3>
              <p
                v-if="post.excerpt"
                class="mt-1 line-clamp-2 text-xs leading-relaxed text-[color:var(--color-ink-soft)]"
              >
                {{ post.excerpt }}
              </p>
              <div class="mt-1.5 text-[11px] tabular-nums text-[color:var(--color-ink-soft)]">
                {{ formatDate(post.date) }}
              </div>
            </div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from "vue";
import type { BlogPostMeta, BlogPost } from "../../lib/blog";
export type { BlogSectionProps, BlogSectionEmits } from "../../lib/component-contracts";
import SearchBar from "../../components/SearchBar.vue";
import BlogPostView from "../../components/BlogPostView.vue";

export default defineComponent({
  name: "MinimalBlogSection",
  components: { SearchBar, BlogPostView },
  props: {
    posts: { type: Array as PropType<BlogPostMeta[]>, required: true },
    currentPost: { type: Object as PropType<BlogPost | null>, default: null },
    label: { type: String, default: "Blog" },
    searchEnabled: { type: Boolean, default: false },
    availableTags: { type: Array as PropType<string[]>, default: () => [] },
    selectedTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ["load-post", "back", "filter-click"],
  setup(props) {
    const searchQuery = ref("");

    const filtered = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      const tags = props.selectedTags;
      let source = props.posts;
      if (q) {
        source = source.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            (p.excerpt?.toLowerCase().includes(q)) ||
            p.tags?.some((t) => t.toLowerCase().includes(q)),
        );
      }
      if (tags.length > 0) {
        source = source.filter(
          (p) => p.tags && tags.some((t) => p.tags!.includes(t)),
        );
      }
      return source;
    });

    const formatDate = (d: string) => {
      if (!d) return "";
      try {
        return new Date(d).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return d;
      }
    };

    return { searchQuery, filtered, formatDate };
  },
});
</script>
