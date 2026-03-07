<template>
  <section>
    <!-- ── Past issues ────────────────────────────────────────── -->
    <div v-if="archiveLoading" class="flex items-center justify-center py-12">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--color-ink-soft)] border-t-transparent" />
    </div>

    <template v-else-if="sends.length">
      <div class="flex items-center justify-between">
      
        <button
          v-if="availableTags.length > 0"
          type="button"
          class="relative rounded-md p-1.5 text-[color:var(--color-ink-soft)] transition hover:text-[color:var(--color-brand)]"
          @click.stop="$emit('filter-click')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span
            v-if="selectedTags.length > 0"
            class="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[8px] font-bold text-white"
          >{{ selectedTags.length }}</span>
        </button>
      </div>

      <!-- Search -->
      <div
        v-if="searchEnabled"
        class="search-bar mt-3 flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-sm backdrop-blur-md transition-all duration-200 focus-within:border-[var(--color-brand)] focus-within:ring-1 focus-within:ring-[var(--color-brand)]"
        :class="searchQuery.trim() ? 'search-bar--active' : ''"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" class="shrink-0 text-[color:var(--color-ink-soft)]">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="min-w-0 flex-1 bg-transparent text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-soft)] outline-none"
        />
      </div>

      <!-- Issue list -->
      <div v-if="filteredSends.length" class="mt-4 space-y-2">
        <button
          v-for="send in filteredSends"
          :key="send.id"
          type="button"
          class="group flex w-full items-center gap-3 rounded-lg bg-[rgba(0,50,100,0.0625)] px-3 py-3.5 text-left transition hover:opacity-80 sm:py-4"
          @click="$emit('view', send.id)"
        >
          <img
            v-if="send.cover_image"
            :src="send.cover_image"
            alt=""
            class="h-9 w-9 shrink-0 rounded-lg border border-[var(--color-border2)] object-cover sm:h-10 sm:w-10"
            loading="lazy"
          />
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-[color:var(--color-ink)]">{{ send.subject }}</div>
            <div class="mt-0.5 truncate text-xs text-[color:var(--color-ink-soft)]">
              {{ formatDate(send.sent_at) }}<template v-if="excerptText(send.excerpt_html)"> · {{ excerptText(send.excerpt_html) }}</template>
            </div>
          </div>
          <svg
            class="h-4 w-4 shrink-0 text-[color:var(--color-ink-soft)] transition group-hover:translate-x-0.5"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <p
        v-else-if="!filteredSends.length"
        class="mt-6 py-8 text-center text-sm text-[color:var(--color-ink-soft)]"
      >No matching newsletters found.</p>
    </template>

    <!-- ── Signup ─────────────────────────────────────────────── -->
    <div class="newsletter-signup-card mt-8 rounded-xl px-6 pt-8 text-center sm:px-10 sm:py-10">
      <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--color-brand)]">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
          stroke-linejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      </div>
      <h3 class="mt-4 text-lg font-semibold tracking-tight text-[color:var(--color-ink)]">
        Stay in the loop
      </h3>
      <p class="mt-1.5 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
        Get the latest updates delivered straight to your inbox.
      </p>

      <form
        v-if="!submitted"
        class="mx-auto mt-5 flex w-full max-w-md gap-2"
        @submit.prevent="subscribe"
      >
        <input
          v-model="email"
          type="email"
          placeholder="you@example.com"
          required
          :disabled="subscribing"
          class="newsletter-input flex-1 rounded-lg shadow-sm bg-white  px-4 py-2.5 text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-soft)] outline-none transition-all focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_rgba(var(--brand-rgb,59,130,246),0.12)]"
        />
        <button
          type="submit"
          :disabled="subscribing"
          class="shrink-0 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 disabled:opacity-50"
        >
          <span v-if="subscribing" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span v-else>Subscribe</span>
        </button>
      </form>

      <div
        v-else
        class="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <path d="m9 11 3 3L22 4"/>
        </svg>
        Check your email to confirm!
      </div>

      <p v-if="subscribeError" class="mt-3 text-xs font-medium text-red-500">{{ subscribeError }}</p>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, type PropType } from "vue";
export type { NewsletterSectionProps, NewsletterSectionEmits } from "../../lib/component-contracts";
import { supabase } from "../../lib/supabase";

interface SendSummary {
  id: string;
  subject: string;
  cover_image: string;
  excerpt_html: string;
  tags: string[];
  sent_at: string;
}

export default defineComponent({
  name: "MinimalNewsletterSection",
  props: {
    searchEnabled: { type: Boolean, default: false },
    availableTags: { type: Array as PropType<string[]>, default: () => [] },
    selectedTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ["view", "tags-loaded", "filter-click"],
  setup(props, { emit }) {
    // ── Signup state ──
    const email = ref("");
    const subscribing = ref(false);
    const submitted = ref(false);
    const subscribeError = ref("");

    const subscribe = async () => {
      subscribeError.value = "";
      if (!supabase) {
        subscribeError.value = "Newsletter is not configured.";
        return;
      }
      subscribing.value = true;
      try {
        const { error: fnError } = await supabase.functions.invoke("newsletter-signup", {
          body: { email: email.value.trim().toLowerCase() },
        });
        if (fnError) {
          subscribeError.value = "Something went wrong. Please try again.";
        } else {
          submitted.value = true;
        }
      } catch {
        subscribeError.value = "Something went wrong. Please try again.";
      } finally {
        subscribing.value = false;
      }
    };

    // ── Archive state ──
    const sends = ref<SendSummary[]>([]);
    const archiveLoading = ref(true);
    const searchQuery = ref("");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

    const availableTags = computed(() => {
      const tagSet = new Set<string>();
      for (const s of sends.value) {
        if (s.tags) s.tags.forEach((t) => tagSet.add(t));
      }
      return [...tagSet].sort();
    });

    watch(availableTags, (tags) => emit("tags-loaded", tags));

    const filteredSends = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      const tags = props.selectedTags;
      let source = sends.value;
      if (q) {
        source = source.filter(
          (s) =>
            s.subject.toLowerCase().includes(q) ||
            (s.excerpt_html && excerptText(s.excerpt_html).toLowerCase().includes(q)) ||
            s.tags?.some((t) => t.toLowerCase().includes(q)),
        );
      }
      if (tags.length > 0) {
        source = source.filter(
          (s) => s.tags && tags.some((t) => s.tags.includes(t)),
        );
      }
      return source;
    });

    async function fetchSends() {
      archiveLoading.value = true;
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/newsletter-view`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${anonKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          sends.value = data.map((s: any) => ({
            ...s,
            tags: Array.isArray(s.tags) ? s.tags : [],
          }));
        }
      } catch {
        // silent
      } finally {
        archiveLoading.value = false;
      }
    }

    function formatDate(iso: string): string {
      if (!iso) return "";
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    function excerptText(html: string): string {
      if (!html) return "";
      return html.replace(/<[^>]*>/g, "").trim();
    }

    onMounted(fetchSends);

    return {
      email, subscribing, submitted, subscribeError, subscribe,
      sends, archiveLoading, searchQuery, filteredSends,
      formatDate, excerptText,
    };
  },
});
</script>

<style scoped>
.newsletter-signup-card {
  background: none;
  border: 1px solid var(--color-border2);
}
</style>
