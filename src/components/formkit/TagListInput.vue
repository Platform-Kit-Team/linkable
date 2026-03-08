<template>
  <AutoComplete
    :modelValue="currentValue"
    @update:modelValue="context.node.input($event)"
    :suggestions="filteredTags"
    @complete="onComplete"
    multiple
    :placeholder="currentValue.length === 0 ? (context.attrs?.placeholder || 'Type to add tags…') : ''"
    class="w-full"
  />
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import AutoComplete from "primevue/autocomplete";

export default defineComponent({
  components: { AutoComplete },
  props: {
    context: { type: Object, required: true },
  },
  setup(props) {
    const currentValue = computed(() => props.context._value || []);
    const filteredTags = ref<string[]>([]);

    const allTags = computed(() => {
      const extra: string[] = props.context.attrs?.allTags || [];
      const selected: string[] = currentValue.value;
      return [...new Set([...extra, ...selected])].sort();
    });

    const onComplete = (event: { query: string }) => {
      const q = event.query.toLowerCase().trim();
      if (!q) {
        filteredTags.value = allTags.value.filter(
          (t) => !currentValue.value.includes(t)
        );
      } else {
        const matches = allTags.value.filter(
          (t) => t.toLowerCase().includes(q) && !currentValue.value.includes(t)
        );
        // If the typed text doesn't exactly match an existing tag, offer to create it
        if (!allTags.value.some((t) => t.toLowerCase() === q)) {
          matches.push(event.query.trim());
        }
        filteredTags.value = matches;
      }
    };

    return { currentValue, filteredTags, onComplete };
  },
});
</script>
