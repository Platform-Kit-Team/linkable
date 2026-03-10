<template>
  <button
    type="button"
    class="card-item group flex items-start gap-3 rounded-2xl p-3 text-left shadow-sm transition sm:gap-4 sm:p-4"
    @click="$emit('click', post.slug)"
  >
    <img
      v-if="post.coverImage"
      :src="resolveUploadUrl(post.coverImage)"
      alt=""
      class="h-16 w-16 shrink-0 rounded-xl border border-[var(--color-border)] object-cover sm:h-20 sm:w-20"
      loading="lazy"
    />
    <div
      v-else
      class="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)]"
    >
      <i class="pi pi-file-edit text-[color:var(--color-ink-soft)]" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="text-[13px] font-semibold text-[color:var(--color-ink)] sm:text-sm">
        {{ post.title }}
      </div>
      <div
        v-if="post.excerpt"
        class="mt-0.5 line-clamp-2 text-[11px] text-[color:var(--color-ink-soft)] sm:text-xs"
      >
        {{ post.excerpt }}
      </div>
      <div class="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[color:var(--color-ink-soft)]">
        <span>{{ formatDate(post.date) }}</span>
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="rounded-full border border-[var(--color-border)] bg-[var(--glass-2)] px-1.5 py-0.5"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <i class="pi pi-arrow-right mt-1 shrink-0 text-[color:var(--color-ink-soft)] transition group-hover:translate-x-0.5" />
  </button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { BlogPostMeta } from "../blog-types";
import { resolveUploadUrl } from "@/lib/github";

export default defineComponent({
  name: "BlogPostCard",
  props: {
    post: { type: Object as PropType<BlogPostMeta>, required: true },
  },
  emits: ["click"],
  setup() {
    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return dateStr;
      }
    };

    return { resolveUploadUrl, formatDate };
  },
});
</script>
