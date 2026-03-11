import { ref, computed } from 'vue';

type CartItem = {
	id: string;
	title: string;
	price: number;
	image?: string;
	quantity: number;
};

const cart = ref<CartItem[]>([]);

function addItem(product: any, qty = 1) {
	const existing = cart.value.find((item) => item.id === product.id);
	if (existing) {
		existing.quantity += qty;
	} else {
		cart.value.push({
			id: product.id || product.title,
			title: product.title,
			price: product.price,
			image: product.image,
			quantity: qty,
		});
	}
}

function removeItem(product: any) {
	cart.value = cart.value.filter((item) => item.id !== (product.id || product.title));
}

function updateItem(product: any, qty: number) {
	const existing = cart.value.find((item) => item.id === product.id);
	if (existing) existing.quantity = qty;
}

function clearCart() {
	cart.value = [];
}

const itemCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));
const total = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0));

export function useCart() {
	return { cart, addItem, removeItem, updateItem, clearCart, itemCount, total };
}

