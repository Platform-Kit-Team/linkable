<template>
  <div class="mx-auto max-w-4xl py-8">
    <ProductList />
    <CartDrawer :visible="cartOpen" @close="cartOpen = false" @checkout="checkoutOpen = true" />
    <PrimeDialog v-model:visible="checkoutOpen" modal :closable="true" :dismissableMask="true" :style="{ minWidth: '350px' }">
      <CheckoutForm />
    </PrimeDialog>
    <button
      v-if="itemCount > 0"
      @click="cartOpen = true"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-[color:var(--color-brand)] text-white font-bold shadow-lg hover:brightness-110 transition"
    >
      <lucide-shopping-cart class="w-5 h-5" />
      Cart
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProductList from './ecommerce/components/ProductList.vue';
import CartDrawer from './ecommerce/components/CartDrawer.vue';
import CheckoutForm from './ecommerce/components/CheckoutForm.vue';
import { ShoppingCart as LucideShoppingCart } from 'lucide-vue-next';
import PrimeDialog from 'primevue/dialog';
import { useCart } from './ecommerce/composables/useCart';

const cartOpen = ref(false);
const checkoutOpen = ref(false);
const { itemCount } = useCart();
</script>
