<template>
  <GoogleFontPicker
    :modelValue="context._value || ''"
    @update:modelValue="context.node.input($event)"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import GoogleFontPicker from "../GoogleFontPicker.vue";

export default defineComponent({
  name: "GoogleFontPickerInput",
  components: { GoogleFontPicker },
  props: {
    context: { type: Object, required: true },
  },
});
</script>
