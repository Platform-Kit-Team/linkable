// Composable: useCart
// Wraps Alokai's useCart for unified, theme-friendly cart state
import { useCart as useAlokaiCart } from '@alokai/cart';
import { computed } from 'vue';

export function useCart() {
  const { cart, addItem, removeItem, updateItem, clearCart } = useAlokaiCart();

  // Example: computed for cart item count
  const itemCount = computed(() => cart.value?.items?.length || 0);

  // Example: computed for cart total
  const total = computed(() => cart.value?.totals?.total || 0);

  return {
    cart,
    addItem,
    removeItem,
    updateItem,
    clearCart,
    itemCount,
    total,
  };
}
