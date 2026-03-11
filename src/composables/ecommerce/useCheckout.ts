// Composable: useCheckout
// Wraps Alokai's useCheckout for order placement
import { useCheckout as useAlokaiCheckout } from '@alokai/checkout';
import { ref } from 'vue';

export function useCheckout() {
  const { placeOrder, loading, error, order } = useAlokaiCheckout();
  // Add custom logic or computed as needed
  return {
    placeOrder,
    loading,
    error,
    order,
  };
}
