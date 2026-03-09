<template>
  <AutoComplete
    :modelValue="modelValue || ''"
    @update:modelValue="$emit('update:modelValue', $event)"
    :suggestions="filtered"
    @complete="search"
    placeholder="e.g. Inter, Playfair Display"
    class="w-full"
    inputClass="w-full"
    :forceSelection="false"
    dropdown
  >
    <template #option="{ option }">
      <span class="text-sm">{{ option }}</span>
    </template>
  </AutoComplete>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import AutoComplete from "primevue/autocomplete";

export const POPULAR_FONTS = [
  // Modern sans-serif
  "Inter", "Plus Jakarta Sans", "DM Sans", "Outfit", "Manrope", "Figtree",
  "Sora", "Space Grotesk", "Bricolage Grotesque",
  // Classic sans-serif
  "Poppins", "Nunito", "Raleway", "Montserrat", "Lato", "Open Sans", "Roboto",
  // Serif
  "Playfair Display", "Merriweather", "Libre Baskerville",
  "DM Serif Display", "Cormorant Garamond", "Source Serif 4", "Fraunces",
  // Display / expressive
  "Bebas Neue", "Josefin Sans", "Quicksand", "Pacifico",
];

export default defineComponent({
  name: "GoogleFontPicker",
  components: { AutoComplete },
  props: {
    modelValue: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
  setup() {
    const filtered = ref<string[]>(POPULAR_FONTS);

    const search = (event: { query: string }) => {
      const q = (event.query || "").trim().toLowerCase();
      if (!q) {
        filtered.value = POPULAR_FONTS;
        return;
      }
      const fromList = POPULAR_FONTS.filter((f) => f.toLowerCase().includes(q));
      // Always include the typed value itself as the first option if it's not in the list
      const typed = event.query.trim();
      if (typed && !fromList.some((f) => f.toLowerCase() === typed.toLowerCase())) {
        filtered.value = [typed, ...fromList];
      } else {
        filtered.value = fromList.length > 0 ? fromList : [typed];
      }
    };

    return { filtered, search };
  },
});
</script>
