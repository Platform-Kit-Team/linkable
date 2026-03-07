<template>
  <nav
    v-if="visible"
    class="mx-auto mb-6 flex flex-wrap items-center justify-center gap-1"
  >
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="relative px-3 py-2 text-sm font-medium transition"
      :class="
        activeTab === tab.key
          ? 'text-[color:var(--color-ink)]'
          : 'text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]'
      "
      @click="$emit('switch', tab.key)"
    >
      <span class="inline-flex items-center gap-1.5">
        <component :is="resolveIcon(tab.icon)" :size="13" class="shrink-0" />
        {{ tab.label }}
      </span>
      <span
        v-if="activeTab === tab.key"
        class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[color:var(--color-ink)]"
      />
    </button>
  </nav>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { icons as lucideIcons } from "lucide-vue-next";
import type { TabItem } from "../../lib/component-contracts";

export default defineComponent({
  name: "MinimalTabNav",
  props: {
    visible: { type: Boolean, default: true },
    activeTab: { type: String, required: true },
    tabs: { type: Array as PropType<TabItem[]>, required: true },
  },
  emits: ["switch"],
  setup() {
    const resolveIcon = (name: string) => {
      return (lucideIcons as Record<string, any>)[name] ?? (lucideIcons as Record<string, any>)["Globe"];
    };
    return { resolveIcon };
  },
});
</script>
