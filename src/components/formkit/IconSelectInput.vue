<template>
  <AutoComplete
    :modelValue="context._value || ''"
    @update:modelValue="context.node.input($event)"
    :suggestions="filtered"
    @complete="search"
    :placeholder="context.attrs?.placeholder || 'Search icons…'"
    class="w-full"
    :inputClass="'w-full'"
    forceSelection
  >
    <template #option="{ option }">
      <div class="flex items-center gap-2.5 py-0.5">
        <component :is="getIcon(option)" :size="18" class="shrink-0 text-[color:var(--color-ink-soft)]" />
        <span class="text-sm font-medium">{{ option }}</span>
      </div>
    </template>
    <template #value="{ value }">
      <div v-if="value" class="flex items-center gap-2">
        <component :is="getIcon(value)" :size="16" class="shrink-0 text-[color:var(--color-ink-soft)]" />
        <span>{{ value }}</span>
      </div>
    </template>
  </AutoComplete>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import AutoComplete from "primevue/autocomplete";
import { icons as lucideIcons } from "lucide-vue-next";

const FEATURED = [
  "Link", "FileText", "Images", "Pencil", "Globe", "Star", "Heart",
  "Briefcase", "BookOpen", "Camera", "Music", "Video", "Code",
  "Users", "MessageCircle", "Mail", "Phone", "Map", "Layers",
  "Palette", "Newspaper", "GraduationCap", "Award", "Zap",
  "Calendar", "Clock", "Shield", "Terminal", "Cpu",
];
const ALL_NAMES = Object.keys(lucideIcons);

export default defineComponent({
  components: { AutoComplete },
  props: {
    context: { type: Object, required: true },
  },
  setup() {
    const filtered = ref<string[]>(FEATURED);

    const search = (event: { query: string }) => {
      const q = (event.query || "").trim().toLowerCase();
      if (!q) { filtered.value = FEATURED; return; }
      filtered.value = ALL_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 40);
    };

    const getIcon = (name: string) => {
      const table = lucideIcons as Record<string, any>;
      return table[name] ?? table["Globe"];
    };

    return { filtered, search, getIcon };
  },
});
</script>
