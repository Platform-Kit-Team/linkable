

<template>
  <FormKit
    type="form"
    :actions="false"
    :value="modelValue"
    @input="onInput"
  >
    <template v-for="node in schema">
      <component
        v-if="node.$formkit === 'list'"
        :is="ListFieldPanel"
        :label="node.label"
        :summary="getSummary(node)"
        :collapsed="node.ui?.collapsed ?? true"
      >
        <FormKitSchema :schema="node.children" />
      </component>
      <FormKitSchema v-else :schema="[node]" />
    </template>
  </FormKit>
</template>

<script lang="ts">

import { defineComponent, type PropType } from "vue";
import { FormKit, FormKitSchema } from "@formkit/vue";
import type { FormKitSchemaNode } from "@formkit/core";
import ListFieldPanel from "./formkit/ListFieldPanel.vue";

export default defineComponent({
  name: "LayoutSchemaRenderer",
  components: { FormKit, FormKitSchema },
  props: {
    schema: {
      type: Array as PropType<FormKitSchemaNode[]>,
      required: true,
    },
    modelValue: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const onInput = (value: unknown) => {
      if (value && typeof value === "object") {
        emit("update:modelValue", { ...props.modelValue, ...(value as Record<string, unknown>) });
      }
    };
    // Helper to get summary for a list node
    function getSummary(node) {
      if (node.ui?.summaryField && Array.isArray(props.modelValue?.[node.name]) && props.modelValue[node.name]?.length > 0) {
        const first = props.modelValue[node.name][0];
        return first?.[node.ui.summaryField] || "";
      }
      return "";
    }
    return { onInput, ListFieldPanel, getSummary };
  },
});
</script>
