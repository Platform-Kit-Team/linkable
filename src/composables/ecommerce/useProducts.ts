// Composable: useProducts
// Wraps Alokai's useProduct for product listing and details
import { useProduct as useAlokaiProduct } from '@alokai/product';
import { ref } from 'vue';

export function useProducts() {
  const { products, search, loading, error } = useAlokaiProduct();
  // Optionally, add filtering, sorting, etc. here
  return {
    products,
    search,
    loading,
    error,
  };
}
