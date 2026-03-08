<template>
  <div>
    <div class="cms__panel-head cms__panel-head--row" style="margin-bottom: 8px">
      <div>
        <div class="cms__sub">Create and manage blog posts (stored as Markdown files).</div>
      </div>
      <Button rounded class="cms__primary cms__primary--addon" @click="openNew">
        <i class="pi pi-plus" />
        <span class="cms__btn-label">New post</span>
        <span class="cms__btn-label--compact">New</span>
      </Button>
    </div>

    <div class="cms__card">
      <div v-if="blogPosts.length === 0" class="cms__empty">
        <div class="cms__empty-title">No blog posts yet</div>
        <div class="cms__empty-sub">Click "New post" to create your first article.</div>
      </div>

      <div v-else class="cms__blogList cms__list">
        <button
          v-for="post in blogPosts"
          :key="post.slug"
          type="button"
          class="cms__row"
          @click="openExisting(post.slug)"
        >
          <span class="cms__row-thumb">
            <i class="pi pi-file-edit text-[color:var(--color-ink-soft)]" />
          </span>
          <span class="cms__row-text">
            <span class="cms__row-title">{{ post.title }}</span>
            <span class="cms__row-sub">{{ post.date }}{{ post.tags.length ? ' · ' + post.tags.join(', ') : '' }}</span>
          </span>
          <span class="cms__row-meta">
            <Tag v-if="!post.published" severity="warning" value="Draft" class="!rounded-full" />
            <i v-else class="pi pi-check-circle cms__ok" />
            <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
          </span>
        </button>
      </div>
    </div>

    <BlogEditorDrawer
      v-model:open="editorOpen"
      :post="editorPost"
      :originalSlug="editorOriginalSlug"
      :allTags="allBlogTags"
      @saved="refresh"
      @deleted="refresh"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, type PropType } from "vue";
import Button from "primevue/button";
import Tag from "primevue/tag";
import { useToast } from "primevue/usetoast";
import BlogEditorDrawer from "../BlogEditorDrawer.vue";
import { fetchBlogPosts, fetchBlogPost, type BlogPostMeta, type BlogPost } from "../../lib/blog";
import type { ContentCollection } from "../../lib/model";

export default defineComponent({
  name: "BlogCollectionEditor",
  components: { Button, Tag, BlogEditorDrawer },
  props: {
    collection: { type: Object as PropType<ContentCollection>, required: true },
  },
  emits: ["blog-posts-updated"],
  setup(_, { emit }) {
    const toast = useToast();
    const blogPosts = ref<BlogPostMeta[]>([]);
    const editorOpen = ref(false);
    const editorPost = ref<BlogPost | null>(null);
    const editorOriginalSlug = ref("");

    const allBlogTags = computed(() => {
      const tagSet = new Set<string>();
      for (const p of blogPosts.value) {
        if (p.tags) p.tags.forEach((t: string) => tagSet.add(t));
      }
      return [...tagSet].sort();
    });

    const refresh = async () => {
      try {
        blogPosts.value = await fetchBlogPosts();
      } catch {
        blogPosts.value = [];
      }
      emit("blog-posts-updated");
    };

    const openNew = () => {
      editorPost.value = null;
      editorOriginalSlug.value = "";
      editorOpen.value = true;
    };

    const openExisting = async (slug: string) => {
      try {
        const post = await fetchBlogPost(slug);
        editorPost.value = post;
        editorOriginalSlug.value = slug;
        editorOpen.value = true;
      } catch {
        toast.add({ severity: "error", summary: "Error", detail: "Could not load blog post.", life: 2600 });
      }
    };

    onMounted(() => refresh());

    return { blogPosts, editorOpen, editorPost, editorOriginalSlug, allBlogTags, refresh, openNew, openExisting };
  },
});
</script>
