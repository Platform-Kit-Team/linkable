<template>
  <FormKit
    type="form"
    :actions="false"
    :value="modelValue"
    @input="onInput"
  >
    <FormKitSchema :schema="schema" />
  </FormKit>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { FormKit, FormKitSchema } from "@formkit/vue";
import type { FormKitSchemaNode } from "@formkit/core";

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

    return { onInput };
  },
});
</script>
