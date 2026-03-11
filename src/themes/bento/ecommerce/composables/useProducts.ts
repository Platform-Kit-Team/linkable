import { ref, onMounted } from 'vue';
import { fetchCollectionItems } from '../../../../lib/collections';

export function useProducts() {
	const products = ref<any[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	async function loadProducts() {
		loading.value = true;
		try {
			products.value = await fetchCollectionItems('products');
		} catch (e: any) {
			error.value = e?.message || 'Failed to load products';
		} finally {
			loading.value = false;
		}
	}

	onMounted(loadProducts);

	return { products, loading, error };
}

