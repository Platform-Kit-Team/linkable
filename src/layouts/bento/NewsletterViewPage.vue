<template>
  <section class="mx-auto w-full" style="max-width: var(--bento-grid-width, 960px)">
    <div class="bento-card overflow-hidden p-3 sm:p-6">
      <button
        class="mb-4 flex items-center gap-1 text-xs font-medium text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
        @click="$emit('back')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back
      </button>

      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--color-ink-soft)] border-t-transparent" />
      </div>

      <div v-else-if="error" class="py-16 text-center text-sm text-[color:var(--color-ink-soft)]">
        {{ error }}
      </div>

      <article v-else-if="newsletter">
        <img
          v-if="newsletter.cover_image"
          :src="newsletter.cover_image"
          :alt="newsletter.subject"
          class="mb-4 w-full rounded-2xl border border-[var(--bento-card-border)] object-cover shadow-sm"
          style="max-height: 320px"
        />
        <div v-if="newsletter.sent_at" class="mb-2 text-[11px] font-medium uppercase tracking-widest text-[color:var(--color-brand)]">
          {{ formatDate(newsletter.sent_at) }}
        </div>
        <h1 class="mb-6 text-2xl font-extrabold leading-tight text-[color:var(--color-ink)] sm:text-3xl">
          {{ newsletter.subject }}
        </h1>
        <div class="prose-content text-[color:var(--color-ink)]" v-html="newsletter.body_html" />
      </article>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from "vue";
export type { NewsletterViewPageProps, NewsletterViewPageEmits } from "../../lib/component-contracts";

interface NewsletterData {
  id: string;
  subject: string;
  cover_image: string;
  body_html: string;
  sent_at: string | null;
}

export default defineComponent({
  name: "BentoNewsletterViewPage",
  props: {
    sendId: { type: String, required: true },
    subscriberId: { type: String, default: "" },
    token: { type: String, default: "" },
  },
  emits: ["back"],
  setup(props) {
    const newsletter = ref<NewsletterData | null>(null);
    const loading = ref(true);
    const error = ref("");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

    async function fetchNewsletter() {
      loading.value = true;
      error.value = "";
      try {
        const params = new URLSearchParams({ id: props.sendId });
        if (props.subscriberId) params.set("sid", props.subscriberId);
        if (props.token) params.set("token", props.token);

        const res = await fetch(`${supabaseUrl}/functions/v1/newsletter-view?${params}`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${anonKey}` },
        });
        if (!res.ok) {
          error.value = "Newsletter not found.";
          return;
        }
        newsletter.value = await res.json();
      } catch {
        error.value = "Failed to load newsletter.";
      } finally {
        loading.value = false;
      }
    }

    function formatDate(iso: string): string {
      return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }

    onMounted(fetchNewsletter);
    watch(() => props.sendId, fetchNewsletter);

    return { newsletter, loading, error, formatDate };
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
.prose-content :deep(h2) { font-size: 1.375rem; font-weight: 700; margin: 1.5em 0 0.5em; }
.prose-content :deep(h3) { font-size: 1.125rem; font-weight: 700; margin: 1.2em 0 0.4em; }
.prose-content :deep(p) { margin: 0.6em 0; line-height: 1.7; }
.prose-content :deep(ul), .prose-content :deep(ol) { padding-left: 1.5em; margin: 0.6em 0; }
.prose-content :deep(blockquote) { border-left: 3px solid var(--color-accent, #3b82f6); padding-left: 1em; margin: 1em 0; color: var(--color-ink-soft); font-style: italic; }
.prose-content :deep(img) { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
.prose-content :deep(a) { color: var(--color-accent, #3b82f6); text-decoration: underline; text-underline-offset: 2px; }
.prose-content :deep(pre) { background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-size: 0.8125rem; margin: 1em 0; }
.prose-content :deep(code) { background: rgba(59, 130, 246, 0.08); border-radius: 4px; padding: 0.15em 0.35em; font-size: 0.9em; }
.prose-content :deep(pre code) { background: none; padding: 0; font-size: inherit; }
</style>
