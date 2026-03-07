<template>
  <footer
    class="mt-8 py-4 text-center text-xs text-[color:var(--color-ink-soft)]"
  >
    <div class="flex items-center justify-center gap-4">
      <a
        href="https://github.com/platform-kit/linkable"
        target="_blank"
        rel="noreferrer"
        class="transition hover:text-[color:var(--color-ink)]"
      >
        Made with Linkable
      </a>
      <a
        v-if="showRss"
        href="/rss.xml"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1 transition hover:text-[color:var(--color-ink)]"
        title="RSS Feed"
      >
        <component :is="rssIcon" :size="12" />
        <span>RSS</span>
      </a>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { icons as lucideIcons } from "lucide-vue-next";
export type { PageFooterProps } from "../../lib/component-contracts";

export default defineComponent({
  name: "MinimalPageFooter",
  props: {
    showRss: { type: Boolean, default: false },
  },
  setup() {
    const rssIcon = (lucideIcons as Record<string, any>)["Rss"];
    return { rssIcon };
  },
});
</script>
