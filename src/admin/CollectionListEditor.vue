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
import { computed, defineComponent, onMounted, ref, watch, type PropType } from "vue";
import draggable from "vuedraggable";
import Button from "primevue/button";
import Tag from "primevue/tag";
import CollectionItemDrawer from "./CollectionItemDrawer.vue";
import type { ContentSchema } from "@/lib/layout-manifest";
import type { ContentCollection } from "@/lib/model";
import { newId } from "@/lib/model";

export default defineComponent({
  name: "CollectionListEditor",
  components: { draggable, Button, Tag, CollectionItemDrawer },
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
    const external = computed(() => !!props.schema.external || !!props.schema.directory);
    const items = ref<Record<string, unknown>[]>(props.items);

    // For external collections, fetch items from the local filesystem (dev: Vite middleware, prod: static JSON)
    const fetchExternalItems = async () => {
      const key = props.schema.key;
      let url = "";
      if (import.meta.env.DEV) {
        url = `/__collection/${encodeURIComponent(key)}`;
      } else {
        url = `/content/collections/${encodeURIComponent(key)}/index.json`;
      }
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          items.value = await res.json();
        }
      } catch (err) {
        console.warn(`[CollectionListEditor] Failed to fetch external items:`, err);
      }
    };

    // Watch for external collections and fetch items
    onMounted(() => {
      if (external.value) {
        fetchExternalItems();
      } else {
        items.value = props.items;
      }
      if (props.initialItemId) {
        const found = items.value.find((i) => (i as any).id === props.initialItemId);
        if (found) openEditor(props.initialItemId);
      }
    });

    // For live reload, refetch external items when schema changes
    watch(() => props.schema, () => {
      if (external.value) fetchExternalItems();
    });

    const activeItem = computed(() =>
      items.value.find((i) => i.id === activeItemId.value) ?? null,
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

    const addItem = () => {
      const factory = props.schema.newItem;
      if (!factory) return;
      const item = factory();
      items.value = [item, ...items.value];
      emit("update:items", items.value);
      activeItemId.value = item.id as string;
      editorOpen.value = true;
    };

    const updateItem = (updated: Record<string, any>) => {
      const idx = items.value.findIndex((i) => i.id === updated.id);
      if (idx >= 0) {
        const copy = [...items.value];
        copy[idx] = updated;
        items.value = copy;
        emit("update:items", copy);
      }
    };

    const deleteItem = () => {
      items.value = items.value.filter((i) => i.id !== activeItemId.value);
      emit("update:items", items.value);
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
      const nextItems = [cloned, ...items.value];
      items.value = nextItems;
      emit("update:items", nextItems);
      activeItemId.value = String(cloned.id);
      editorOpen.value = true;
    };

    const getLabel = (item: any) =>
      props.schema.itemLabel?.(item) ?? item.title ?? item.label ?? "Untitled";

    const getSublabel = (item: any) =>
      props.schema.itemSublabel?.(item) ?? item.url ?? item.subtitle ?? "";

    const getThumb = (item: any) =>
      props.schema.itemThumbnail?.(item) ?? undefined;

    return {
      editorOpen, activeItem, activeSchema, activeSchemaKey, openEditor, addItem, updateItem, duplicateItem, deleteItem,
      getLabel, getSublabel, getThumb, items,
    };
  },
});
</script>
