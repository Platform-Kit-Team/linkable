<template>
  <ImageUploadField
    :modelValue="context._value || ''"
    @update:modelValue="context.node.input($event)"
    :label="''"
    :description="context.attrs?.description"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ImageUploadField from "../ImageUploadField.vue";

export default defineComponent({
  components: { ImageUploadField },
  props: {
    context: { type: Object, required: true },
  },
});
</script>
