export function useCheckout() {
	return {
		placeOrder: () => {},
		loading: false,
		error: null,
		order: null,
	};
}

