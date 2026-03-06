/** Pick a random index weighted by item weights (default weight = 1) */
export function weightedRandomIndex(items: { weight?: number }[]): number {
	const weights = items.map((item) => item.weight ?? 1);
	const totalWeight = weights.reduce((sum, w) => sum + w, 0);
	let random = Math.random() * totalWeight;
	for (let i = 0; i < weights.length; i++) {
		random -= weights[i];
		if (random <= 0) return i;
	}
	return weights.length - 1;
}

/** Generate a Fisher-Yates shuffled array of indices [0..length-1] */
export function generateShuffleOrder(length: number): number[] {
	const order = Array.from({ length }, (_, i) => i);
	for (let i = order.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[order[i], order[j]] = [order[j], order[i]];
	}
	return order;
}
