<template>
  <div v-if="post" class="blog-post">
    <!-- Back button -->
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--glass-2)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-ink-soft)] shadow-sm backdrop-blur-md transition hover:bg-[var(--glass)]"
      @click="$emit('back')"
    >
      <i class="pi pi-arrow-left text-[10px]" />
      <span>Back to posts</span>
    </button>

    <!-- Cover image -->
    <img
      v-if="post.coverImage"
      :src="resolveUploadUrl(post.coverImage)"
      :alt="post.title"
        class="mb-4 w-full rounded-2xl object-cover shadow-sm"
      style="max-height: 320px"
    />

    <!-- Audio player (TTS) -->
    <AudioPlayer
      v-if="post.audioUrl"
      :src="post.audioUrl"
      class="mb-4"
    />

    <!-- Post header -->
    <div class="mb-4">
      <h1 class="text-xl font-bold tracking-tight sm:text-2xl">
        {{ post.title }}
      </h1>
      <div
        class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-ink-soft)]"
      >
        <span>{{ formattedDate }}</span>
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--glass-2)] px-2 py-0.5 text-[10px] font-semibold"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- Rendered markdown content -->
    <div class="blog-prose" v-html="resolvedHtml" />
  </div>

  <div v-else class="py-12 text-center text-sm text-[color:var(--color-ink-soft)]">
    <i class="pi pi-spin pi-spinner text-lg" />
    <span class="ml-2">Loading post…</span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import type { BlogPost } from "../lib/blog";
import { resolveUploadUrl } from "../lib/github";
import AudioPlayer from "./AudioPlayer.vue";

export default defineComponent({
  name: "BlogPostView",
  components: { AudioPlayer },
  props: {
    post: { type: Object as PropType<BlogPost | null>, default: null },
  },
  emits: ["back"],
  setup(props) {
    const formattedDate = computed(() => {
      if (!props.post?.date) return "";
      try {
        return new Date(props.post.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch {
        return props.post.date;
      }
    });

    const resolvedHtml = computed(() => {
      const html = props.post?.html;
      if (!html) return "";
      return html.replace(
        /(<img\s[^>]*?\bsrc=")([^"]+)(")/g,
        (_match: string, before: string, src: string, after: string) => before + resolveUploadUrl(src) + after,
      );
    });

    return { formattedDate, resolveUploadUrl, resolvedHtml };
  },
});
</script>

<style>
/* Blog prose styling */
.blog-prose {
  line-height: 1.7;
  font-size: 0.9rem;
  color: var(--color-ink);
}

.blog-prose h1,
.blog-prose h2,
.blog-prose h3,
.blog-prose h4 {
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.blog-prose h1 { font-size: 1.5em; }
.blog-prose h2 { font-size: 1.25em; }
.blog-prose h3 { font-size: 1.1em; }

.blog-prose p {
  margin-bottom: 1em;
}

.blog-prose a {
  color: var(--color-brand);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.blog-prose a:hover {
  opacity: 0.8;
}

.blog-prose ul,
.blog-prose ol {
  padding-left: 1.5em;
  margin-bottom: 1em;
}

.blog-prose ul { list-style: disc; }
.blog-prose ol { list-style: decimal; }

.blog-prose li {
  margin-bottom: 0.3em;
}

.blog-prose blockquote {
  border-left: 3px solid var(--color-brand);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--color-ink-soft);
  font-style: italic;
}

.blog-prose code {
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.15em 0.35em;
  font-size: 0.85em;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
}

.blog-prose pre {
  background: #1e1e2e;
  color: #cdd6f4;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 1em;
  margin-bottom: 1em;
  overflow-x: auto;
}

.blog-prose pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.85em;
  color: inherit;
}

/* highlight.js token colours (Catppuccin Mocha–inspired) */
.blog-prose pre .hljs-keyword,
.blog-prose pre .hljs-selector-tag,
.blog-prose pre .hljs-built_in { color: #cba6f7; }

.blog-prose pre .hljs-string,
.blog-prose pre .hljs-addition { color: #a6e3a1; }

.blog-prose pre .hljs-number,
.blog-prose pre .hljs-literal { color: #fab387; }

.blog-prose pre .hljs-comment,
.blog-prose pre .hljs-quote { color: #6c7086; font-style: italic; }

.blog-prose pre .hljs-function,
.blog-prose pre .hljs-title { color: #89b4fa; }

.blog-prose pre .hljs-variable,
.blog-prose pre .hljs-template-variable,
.blog-prose pre .hljs-attr { color: #f9e2af; }

.blog-prose pre .hljs-type,
.blog-prose pre .hljs-class .hljs-title { color: #f9e2af; }

.blog-prose pre .hljs-tag { color: #89b4fa; }
.blog-prose pre .hljs-name { color: #cba6f7; }
.blog-prose pre .hljs-attribute { color: #f9e2af; }

.blog-prose pre .hljs-symbol,
.blog-prose pre .hljs-bullet { color: #f38ba8; }

.blog-prose pre .hljs-meta { color: #fab387; }
.blog-prose pre .hljs-deletion { color: #f38ba8; }
.blog-prose pre .hljs-section { color: #89b4fa; font-weight: 700; }
.blog-prose pre .hljs-emphasis { font-style: italic; }
.blog-prose pre .hljs-strong { font-weight: 700; }

.blog-prose img {
  max-width: 100%;
  border-radius: 0.75rem;
  margin: 1em 0;
}

.blog-prose hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 2em 0;
}

.blog-prose table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
}

.blog-prose th,
.blog-prose td {
  border: 1px solid var(--color-border);
  padding: 0.5em 0.75em;
  text-align: left;
}

.blog-prose th {
  background: var(--glass-2);
  font-weight: 600;
}
</style>
