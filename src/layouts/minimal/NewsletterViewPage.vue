<template>
  <section class="py-2">
    <!-- Back button -->
    <button
      class="group mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-brand)]"
      @click="$emit('back')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round" class="transition-transform group-hover:-translate-x-0.5">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Back to newsletters
    </button>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--color-ink-soft)] border-t-transparent" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="py-20 text-center">
      <p class="text-sm text-[color:var(--color-ink-soft)]">{{ error }}</p>
    </div>

    <!-- Newsletter content -->
    <article v-else-if="newsletter" class="mx-auto max-w-2xl">
      <img
        v-if="newsletter.cover_image"
        :src="newsletter.cover_image"
        :alt="newsletter.subject"
        class="mb-8 w-full rounded-xl object-cover"
        style="max-height: 400px"
      />

      <header class="mb-8 border-b border-[var(--color-border2)] pb-8">
        <div v-if="newsletter.sent_at" class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--color-brand)]">
          {{ formatDate(newsletter.sent_at) }}
        </div>
        <h1 class="text-2xl font-bold leading-tight tracking-tight text-[color:var(--color-ink)] sm:text-3xl">
          {{ newsletter.subject }}
        </h1>
      </header>

      <div
        class="prose-minimal text-[color:var(--color-ink-body)]"
        v-html="newsletter.body_html"
      />
    </article>
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
  site_name: string;
}

export default defineComponent({
  name: "MinimalNewsletterViewPage",
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

    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

    async function fetchNewsletter() {
      loading.value = true;
      error.value = "";
      try {
        const params = new URLSearchParams({ id: props.sendId });
        if (props.subscriberId) params.set("sid", props.subscriberId);
        if (props.token) params.set("token", props.token);

        const res = await fetch(
          `${supabaseUrl}/functions/v1/newsletter-view?${params}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${anonKey}`,
            },
          },
        );

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
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    onMounted(fetchNewsletter);
    watch(() => props.sendId, fetchNewsletter);

    return { newsletter, loading, error, formatDate };
  },
});
</script>

<style scoped>
.prose-minimal :deep(h2) {
  font-size: 1.375rem;
  font-weight: 600;
  margin: 2em 0 0.6em;
  color: var(--color-ink);
}
.prose-minimal :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 1.5em 0 0.5em;
  color: var(--color-ink);
}
.prose-minimal :deep(p) {
  margin: 0.8em 0;
  line-height: 1.8;
}
.prose-minimal :deep(ul),
.prose-minimal :deep(ol) {
  padding-left: 1.5em;
  margin: 0.8em 0;
  line-height: 1.8;
}
.prose-minimal :deep(li) {
  margin: 0.3em 0;
}
.prose-minimal :deep(blockquote) {
  border-left: 2px solid var(--color-border2);
  padding-left: 1em;
  margin: 1.2em 0;
  color: var(--color-ink-soft);
  font-style: italic;
}
.prose-minimal :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1.2em 0;
}
.prose-minimal :deep(a) {
  color: var(--color-brand);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.prose-minimal :deep(pre) {
  background: var(--glass-2);
  color: var(--color-ink);
  border: 1px solid var(--color-border2);
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  font-size: 0.8125rem;
  margin: 1.2em 0;
}
.prose-minimal :deep(code) {
  background: var(--glass-2);
  border-radius: 4px;
  padding: 0.15em 0.35em;
  font-size: 0.9em;
}
.prose-minimal :deep(pre code) {
  background: none;
  padding: 0;
  font-size: inherit;
}
</style>
