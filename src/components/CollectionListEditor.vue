<template>
  <div>
    <!-- Header: title + Add button -->
    <div class="cms__panel-head cms__panel-head--row">
      <div>
        <div class="cms__title">{{ collection.label || schema.label }}</div>
        <div class="cms__sub">Manage your {{ (collection.label || schema.label).toLowerCase() }}.</div>
      </div>

      <Button rounded class="cms__primary cms__primary--addon" @click="addItem">
        <i class="pi pi-plus" />
        <span class="cms__btn-label">Add</span>
      </Button>
    </div>

    <!-- Collection metadata card: tab label, icon, enable toggle -->
    <div class="cms__card" style="margin-bottom: 10px">
      <div class="cms__form">
        <div class="cms__field">
          <label class="cms__label">Tab label</label>
          <InputText :modelValue="collection.label" @update:modelValue="updateMeta('label', $event)" class="w-full" :placeholder="schema.label" />
          <div class="cms__help">Customise the tab name shown on the public page.</div>
        </div>
        <div class="cms__field">
          <label class="cms__label">Tab icon</label>
          <AutoComplete
            :modelValue="collection.icon"
            @update:modelValue="updateMeta('icon', $event)"
            :suggestions="filteredIcons"
            @complete="searchIcons"
            placeholder="Search icons…"
            class="w-full"
            :inputClass="'w-full'"
            forceSelection
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2.5 py-0.5">
                <component :is="getIconComponent(option)" :size="18" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                <span class="text-sm font-medium">{{ option }}</span>
              </div>
            </template>
            <template #value="{ value }">
              <div v-if="value" class="flex items-center gap-2">
                <component :is="getIconComponent(value)" :size="16" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                <span>{{ value }}</span>
              </div>
            </template>
          </AutoComplete>
          <div class="cms__help">Choose from <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" class="underline">Lucide icons</a>. Leave empty for default.</div>
        </div>
        <div v-if="schema.searchable" class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)] p-3">
          <div>
            <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Enable search</div>
            <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
              Show a search bar on the public page for this section.
            </div>
          </div>
          <ToggleSwitch :modelValue="collection.searchEnabled" @update:modelValue="updateMeta('searchEnabled', $event)" />
        </div>
      </div>
    </div>

    <!-- Items list -->
    <div class="cms__card">
      <div v-if="items.length === 0" class="cms__empty">
        <div class="cms__empty-title">No {{ (collection.label || schema.label).toLowerCase() }} yet</div>
        <div class="cms__empty-sub">Click "Add" to create your first one.</div>
      </div>

      <draggable
        v-else
        :modelValue="items"
        @update:modelValue="$emit('update:items', $event)"
        item-key="id"
        handle=".drag"
        :animation="160"
        class="cms__list"
      >
        <template #item="{ element }">
          <button type="button" class="cms__row" @click="openEditor(element.id)">
            <span class="cms__row-drag drag" aria-label="Drag">
              <i class="pi pi-bars" />
            </span>

            <span class="cms__row-thumb">
              <img
                v-if="getThumb(element)"
                :src="getThumb(element)"
                alt=""
                class="h-full w-full object-cover"
              />
              <i v-else class="pi pi-file text-[color:var(--color-ink-soft)]" />
            </span>

            <span class="cms__row-text">
              <span class="cms__row-title">{{ getLabel(element) }}</span>
              <span class="cms__row-sub">{{ getSublabel(element) }}</span>
            </span>

            <span class="cms__row-meta">
              <Tag v-if="element.enabled === false" severity="warning" value="Hidden" class="!rounded-full" />
              <i v-else class="pi pi-check-circle cms__ok" />
              <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
            </span>
          </button>
        </template>
      </draggable>
    </div>

    <!-- Generic item editor drawer -->
    <CollectionItemDrawer
      v-if="activeItem && activeSchema"
      :open="editorOpen"
      @update:open="editorOpen = $event"
      :schema="activeSchema"
      :schema-key="activeSchemaKey"
      :modelValue="activeItem"
      :title="'Edit ' + (schema.label ? schema.label.replace(/s$/i, '') : 'item')"
      @update:modelValue="updateItem($event)"
      @duplicate="duplicateItem"
      @delete="deleteItem"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, type PropType } from "vue";
import draggable from "vuedraggable";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import AutoComplete from "primevue/autocomplete";
import Tag from "primevue/tag";
import ToggleSwitch from "primevue/toggleswitch";
import { icons as lucideIcons } from "lucide-vue-next";
import CollectionItemDrawer from "./CollectionItemDrawer.vue";
import type { ContentSchema } from "../lib/layout-manifest";
import type { ContentCollection } from "../lib/model";
import { newId } from "../lib/model";

const FEATURED_ICONS = [
  "Link", "FileText", "Images", "Pencil", "Globe", "Star", "Heart",
  "Briefcase", "BookOpen", "Camera", "Music", "Video", "Code",
  "Users", "MessageCircle", "Mail", "Phone", "Map", "Layers",
  "Palette", "Newspaper", "GraduationCap", "Award", "Zap",
];
const ALL_NAMES = Object.keys(lucideIcons);

export default defineComponent({
  name: "CollectionListEditor",
  components: { draggable, Button, InputText, AutoComplete, Tag, ToggleSwitch, CollectionItemDrawer },
  props: {
    schema: { type: Object as PropType<ContentSchema>, required: true },
    collection: { type: Object as PropType<ContentCollection>, required: true },
    items: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
    initialItemId: { type: String, default: "" },
  },
  emits: ["update:items", "update:collection"],
  setup(props, { emit }) {
    const editorOpen = ref(false);
    const activeItemId = ref("");

    const activeItem = computed(() =>
      props.items.find((i) => i.id === activeItemId.value) ?? null,
    );

    const activeSchema = computed(() => {
      const s = props.schema.itemSchema;
      if (!s) return null;
      if (typeof s === 'function') return activeItem.value ? s(activeItem.value) : null;
      return s;
    });

    const activeSchemaKey = computed(() => {
      if (!activeItem.value) return 'empty';
      const item = activeItem.value as Record<string, unknown>;
      return `${item.textVariant ?? ''}|${item.backgroundVariant ?? ''}`;
    });

    const openEditor = (id: string) => {
      activeItemId.value = id;
      editorOpen.value = true;
    };

    onMounted(() => {
      if (props.initialItemId) {
        const found = props.items.find((i) => (i as any).id === props.initialItemId);
        if (found) openEditor(props.initialItemId);
      }
    });

    const addItem = () => {
      const factory = props.schema.newItem;
      if (!factory) return;
      const item = factory();
      emit("update:items", [item, ...props.items]);
      activeItemId.value = item.id as string;
      editorOpen.value = true;
    };

    const updateItem = (updated: Record<string, any>) => {
      const idx = props.items.findIndex((i) => i.id === updated.id);
      if (idx >= 0) {
        const copy = [...props.items];
        copy[idx] = updated;
        emit("update:items", copy);
      }
    };

    const deleteItem = () => {
      emit("update:items", props.items.filter((i) => i.id !== activeItemId.value));
      editorOpen.value = false;
      activeItemId.value = "";
    };

    const duplicateItem = () => {
      if (!activeItem.value) return;
      let cloned: Record<string, unknown>;
      if (typeof globalThis.structuredClone === "function") {
        cloned = globalThis.structuredClone(activeItem.value) as Record<string, unknown>;
      } else {
        cloned = JSON.parse(JSON.stringify(activeItem.value)) as Record<string, unknown>;
      }
      cloned.id = newId();
      const nextItems = [cloned, ...props.items];
      emit("update:items", nextItems);
      activeItemId.value = String(cloned.id);
      editorOpen.value = true;
    };

    const updateMeta = (key: string, value: any) => {
      emit("update:collection", { ...props.collection, [key]: value });
    };

    const getLabel = (item: any) =>
      props.schema.itemLabel?.(item) ?? item.title ?? item.label ?? "Untitled";

    const getSublabel = (item: any) =>
      props.schema.itemSublabel?.(item) ?? item.url ?? item.subtitle ?? "";

    const getThumb = (item: any) =>
      props.schema.itemThumbnail?.(item) ?? undefined;

    // Icon search for tab icon field
    const filteredIcons = ref<string[]>(FEATURED_ICONS);
    const searchIcons = (event: { query: string }) => {
      const q = (event.query || "").trim().toLowerCase();
      if (!q) { filteredIcons.value = FEATURED_ICONS; return; }
      filteredIcons.value = ALL_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 40);
    };
    const getIconComponent = (name: string) => {
      const table = lucideIcons as Record<string, any>;
      return table[name] ?? table["Globe"];
    };

    return {
      editorOpen, activeItem, activeSchema, activeSchemaKey, openEditor, addItem, updateItem, duplicateItem, deleteItem,
      updateMeta, getLabel, getSublabel, getThumb,
      filteredIcons, searchIcons, getIconComponent,
    };
  },
});
</script>
