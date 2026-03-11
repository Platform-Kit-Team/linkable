<template>
  <form @submit.prevent="onCheckout" class="space-y-4 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-100 dark:border-zinc-800">
    <div class="font-bold text-xl text-[color:var(--color-brand)] mb-2">Checkout</div>
    <div class="flex flex-col gap-2">
      <input v-model="name" type="text" placeholder="Name" class="input" required />
      <input v-model="email" type="email" placeholder="Email" class="input" required />
      <input v-model="address" type="text" placeholder="Shipping Address" class="input" required />
    </div>
    <button type="submit" class="w-full py-2 rounded bg-[color:var(--color-brand)] text-white font-semibold hover:brightness-110 transition" :disabled="loading">
      Place Order
    </button>
    <div v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</div>
    <div v-if="order" class="text-green-600 text-sm mt-2">Order placed! Thank you.</div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCheckout } from '../../composables/ecommerce/useCheckout';

const name = ref('');
const email = ref('');
const address = ref('');
const { placeOrder, loading, error, order } = useCheckout();

function onCheckout() {
  placeOrder({ name: name.value, email: email.value, address: address.value });
}
</script>

<style scoped>
.input {
  @apply rounded border border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)] transition;
}
</style>
