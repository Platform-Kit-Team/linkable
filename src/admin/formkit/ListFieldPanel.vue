<template>
  <div class="cms-list-panel border rounded-xl mb-4 bg-white/80">
    <div
      class="cms-list-panel__header flex items-center justify-between px-4 py-2 cursor-pointer select-none"
      @click="toggle"
    >
      <div class="font-bold text-sm">
        <slot name="label">{{ label }}</slot>
        <span v-if="summary && collapsed" class="text-xs text-gray-500 ml-2">{{ summary }}</span>
      </div>
      <button class="ml-2 text-gray-400 hover:text-gray-700">
        <span v-if="collapsed">▼</span>
        <span v-else>▲</span>
      </button>
    </div>
    <transition name="fade">
      <div v-show="!collapsed" class="cms-list-panel__body px-4 pb-4">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
const props = defineProps({
  label: String,
  summary: String,
  collapsed: Boolean
});
const emit = defineEmits(['update:collapsed']);
const collapsed = ref(props.collapsed ?? true);
watch(() => props.collapsed, v => (collapsed.value = v));
function toggle() {
  collapsed.value = !collapsed.value;
  emit('update:collapsed', collapsed.value);
}
</script>

<style scoped>
.cms-list-panel__header { user-select: none; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
