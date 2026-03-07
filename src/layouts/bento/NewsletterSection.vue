<template>
  <!-- Newsletter content is merged into the Articles (BlogSection) tab in bento layout.
       This stub satisfies the override so App.vue doesn't render the default newsletter section. -->
  <div />
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
export type { NewsletterSectionProps, NewsletterSectionEmits } from "../../lib/component-contracts";

export default defineComponent({
  name: "BentoNewsletterSection",
  props: {
    searchEnabled: { type: Boolean, default: false },
    availableTags: { type: Array as PropType<string[]>, default: () => [] },
    selectedTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ["view", "tags-loaded", "filter-click"],
});
</script>
