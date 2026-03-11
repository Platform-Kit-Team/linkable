<template>
  <div v-if="visible" class="fixed right-0 top-0 h-full w-80 bg-white dark:bg-zinc-900 shadow-xl z-50 flex flex-col transition-transform duration-300" :class="{ 'translate-x-0': visible, 'translate-x-full': !visible }">
    <div class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
      <span class="font-bold text-lg text-[color:var(--color-brand)]">Your Cart</span>
      <button @click="$emit('close')" class="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
        <lucide-x class="w-5 h-5" />
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="itemCount === 0" class="text-zinc-400 text-center py-12">
        Your cart is empty.
      </div>
      <div v-else>
        <div v-for="item in cart.items" :key="item.id" class="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
          <img :src="item.image" alt="" class="w-12 h-12 rounded bg-zinc-100 object-cover" />
          <div class="flex-1">
            <div class="font-medium text-zinc-900 dark:text-white">{{ item.name }}</div>
            <div class="text-xs text-zinc-400">Qty: {{ item.quantity }}</div>
          </div>
          <div class="font-semibold text-[color:var(--color-brand)]">${{ item.price }}</div>
          <button @click="removeItem(item)" class="ml-2 text-zinc-300 hover:text-red-500">
            <lucide-trash-2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    <div class="p-4 border-t border-zinc-200 dark:border-zinc-700">
      <div class="flex justify-between items-center mb-4">
        <span class="font-semibold">Total</span>
        <span class="font-bold text-[color:var(--color-brand)] text-lg">${{ total }}</span>
      </div>
      <button class="w-full py-2 rounded bg-[color:var(--color-brand)] text-white font-semibold hover:brightness-110 transition" @click="$emit('checkout')" :disabled="itemCount === 0">
        Checkout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue';
import { useCart } from '../../composables/ecommerce/useCart';
import { X as LucideX, Trash2 as LucideTrash2 } from 'lucide-vue-next';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['close', 'checkout']);
const { cart, removeItem, itemCount, total } = useCart();
</script>
