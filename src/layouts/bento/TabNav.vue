<template>
  <nav v-if="visible" class="mb-6 flex justify-center sm:mb-8">
    <div class="inline-flex items-center gap-1 rounded-full border border-[var(--bento-card-border,rgba(0,0,0,0.06))] bg-[var(--bento-card-bg,#fff)] px-1.5 py-1.5 shadow-sm">
      <button
        v-for="tab in bentoTabs"
        :key="tab.key"
        type="button"
        class="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200"
        :class="activeTab === tab.key
          ? 'bg-[var(--color-ink)] text-white shadow-sm'
          : 'text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]'"
        @click="$emit('switch', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from "vue";
import type { TabItem } from "../../lib/component-contracts";
export type { TabNavProps, TabNavEmits } from "../../lib/component-contracts";

/** Bento remaps internal tab keys to friendlier labels */
const BENTO_TAB_MAP: Record<string, string> = {
  links: "All",
  resume: "About Me",
  gallery: "My Work",
  blog: "Articles",
};

/** Only these tabs appear in the bento nav */
const BENTO_TAB_ORDER = ["links", "resume", "gallery", "blog"];

export default defineComponent({
  name: "BentoTabNav",
  props: {
    visible: { type: Boolean, default: true },
    activeTab: { type: String, required: true },
    tabs: { type: Array as PropType<TabItem[]>, required: true },
  },
  emits: ["switch"],
  setup(props) {
    const bentoTabs = computed(() =>
      BENTO_TAB_ORDER
        .filter((key) => props.tabs.some((t) => t.key === key))
        .map((key) => {
          const incoming = props.tabs.find((t) => t.key === key);
          return {
            key,
            label: incoming?.label || (BENTO_TAB_MAP[key] ?? key),
          };
        }),
    );

    return { bentoTabs };
  },
});
</script>
