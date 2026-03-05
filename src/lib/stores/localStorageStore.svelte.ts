import { browser } from '$app/environment';
import superjson from 'superjson';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stores = new Map<string, any>();

export class LocalStorageStore<T> {
	value: T = $state<T>()!;

	constructor(key: string, initialValue: T) {
		if (browser) {
			const localValue = localStorage.getItem(key);
			if (localValue) {
				try {
					this.value = superjson.parse<T>(localValue) as T;
				} catch (e) {
					console.error(`Failed to parse localStorage value for key "${key}":`, e);
					this.value = initialValue as T;
				}
			} else {
				this.value = initialValue as T;
			}
		} else {
			this.value = initialValue as T;
		}

		$effect.root(() => {
			$effect(() => {
				if (browser) {
					localStorage.setItem(key, superjson.stringify(this.value));
				}
			});
		});
	}
}

export function localStorageStore<T>(key: string, initialValue: T): LocalStorageStore<T> {
	if (stores.has(key)) {
		return stores.get(key) as LocalStorageStore<T>;
	}
	const result = new LocalStorageStore<T>(key, initialValue);
	stores.set(key, result);
	return result;
}
