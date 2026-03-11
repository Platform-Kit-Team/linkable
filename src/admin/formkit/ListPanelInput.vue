<template>
  <ListFieldPanel :label="context.label" :summary="summary" :collapsed="collapsed">
    <div v-for="(item, idx) in items" :key="idx" class="mb-2">
      <FormKitSchema :schema="context.schema?.children || []" :value="item" @input="v => updateItem(idx, v)" />
      <button class="text-xs text-red-500 mt-1" @click="remove(idx)">Remove</button>
    </div>
    <button class="mt-2 px-3 py-1 bg-gray-100 rounded text-xs font-bold" @click="add">Add</button>
  </ListFieldPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ListFieldPanel from './ListFieldPanel.vue';
import { FormKitSchema } from '@formkit/vue';

const props = defineProps({
  context: { type: Object, required: true }
});

const items = ref(Array.isArray(props.context._value) ? [...props.context._value] : []);
const collapsed = ref(props.context.ui?.collapsed ?? true);

watch(() => props.context._value, v => {
  if (Array.isArray(v)) items.value = [...v];
});

function add() {
  const empty = {};
  (props.context.schema?.children || []).forEach(f => { empty[f.name] = ''; });
  items.value.push(empty);
  emitChange();
}
function remove(idx) {
  items.value.splice(idx, 1);
  emitChange();
}
function updateItem(idx, v) {
  items.value[idx] = v;
  emitChange();
}
function emitChange() {
  props.context.node.input([...items.value]);
}
const summary = computed(() => {
  const field = props.context.ui?.summaryField;
  if (field && items.value.length > 0) return items.value[0][field] || '';
  return '';
});
</script>
