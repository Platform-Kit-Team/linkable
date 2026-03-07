<template>
  <div class="formkit-colorpicker-wrap" style="display: flex; align-items: center; gap: 0.5rem;">
    <input
      type="color"
      :value="context._value || '#000000'"
      @input="context.node.input(($event.target as HTMLInputElement).value)"
      style="width: 2.2rem; height: 2.2rem; padding: 0; border: 1px solid var(--color-border2); border-radius: 0.4rem; cursor: pointer;"
    />
    <input
      type="text"
      :value="context._value || ''"
      :placeholder="context.placeholder || '#000000'"
      @input="context.node.input(($event.target as HTMLInputElement).value)"
      style="flex: 1; font-family: monospace; font-size: 0.85rem;"
      class="formkit-input"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    context: {
      type: Object,
      required: true,
    },
  },
});
</script>
