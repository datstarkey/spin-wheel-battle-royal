import { browser } from '$app/environment';
import superjson from 'superjson';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stores = new Map<string, any>();

export class LocalStorageStore<T> {
	private _value: T = $state<T>()!;
	private key: string;

	constructor(key: string, initialValue: T) {
		this.key = key;

		if (browser) {
			const localValue = localStorage.getItem(key);
			if (localValue) {
				try {
					this._value = superjson.parse<T>(localValue) as T;
				} catch (e) {
					console.error(`Failed to parse localStorage value for key "${key}":`, e);
					this._value = initialValue as T;
				}
			} else {
				this._value = initialValue as T;
			}
		} else {
			this._value = initialValue as T;
		}
	}

	get value(): T {
		return this._value;
	}

	/** Setting value also persists to localStorage. */
	set value(newValue: T) {
		this._value = newValue;
		if (browser) {
			localStorage.setItem(this.key, superjson.stringify(newValue));
		}
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
