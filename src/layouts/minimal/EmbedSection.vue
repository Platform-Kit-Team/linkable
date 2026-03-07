<template>
  <section>
    <div class="embed-container overflow-hidden rounded-lg" v-html="html" />
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export type { EmbedSectionProps } from "../../lib/component-contracts";

export default defineComponent({
  name: "MinimalEmbedSection",
  props: {
    html: { type: String, required: true },
  },
});
</script>

<style scoped>
.embed-container {
  overflow: hidden;
}
</style>
