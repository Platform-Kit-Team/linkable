<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    <ProductCard v-for="product in products" :key="product.id" :product="product" @add-to-cart="addToCart" />
  </div>
</template>

<script setup lang="ts">
import { useProducts } from '../../composables/ecommerce/useProducts';
import { useCart } from '../../composables/ecommerce/useCart';
import ProductCard from './ProductCard.vue';

const { products, loading, error } = useProducts();
const { addItem } = useCart();

function addToCart(product: any) {
  addItem(product, 1);
}
</script>
