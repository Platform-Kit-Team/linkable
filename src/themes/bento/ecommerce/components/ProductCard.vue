<template>
  <div class="rounded-xl bg-white dark:bg-zinc-900 shadow p-4 flex flex-col gap-2 hover:shadow-lg transition group border border-zinc-100 dark:border-zinc-800">
    <img :src="product.image" alt="" class="rounded-lg w-full h-40 object-cover bg-zinc-100 group-hover:scale-105 transition-transform" />
    <div class="flex-1 flex flex-col gap-1">
      <div class="font-bold text-lg text-zinc-900 dark:text-white">{{ product.name }}</div>
      <div class="text-sm text-zinc-400">{{ product.description }}</div>
      <div class="flex items-center justify-between mt-2">
        <span class="font-semibold text-[color:var(--color-brand)] text-lg">${{ product.price }}</span>
        <button class="rounded-full bg-[color:var(--color-brand)] text-white px-4 py-1 font-semibold hover:brightness-110 transition" @click="$emit('add-to-cart', product)">
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
const props = defineProps<{ product: any }>();
const emit = defineEmits(['add-to-cart']);
</script>
