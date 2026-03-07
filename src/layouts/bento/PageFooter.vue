<template>
  <footer class="mx-auto mt-8 w-full px-4 pb-8 text-center" style="max-width: var(--bento-grid-width, 960px)">
    <div class="flex items-center justify-center gap-3 text-xs text-[color:var(--color-ink-soft)]">
      <a
        v-if="showRss"
        href="/rss.xml"
        target="_blank"
        class="hover:text-[color:var(--color-ink)] transition-colors"
      >
        RSS
      </a>
      <span class="opacity-40">&copy; {{ year }}</span>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export type { PageFooterProps } from "../../lib/component-contracts";

export default defineComponent({
  name: "BentoPageFooter",
  props: {
    showRss: { type: Boolean, default: false },
  },
  setup() {
    return { year: new Date().getFullYear() };
  },
});
</script>
