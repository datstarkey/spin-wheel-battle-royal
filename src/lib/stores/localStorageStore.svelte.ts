import { browser } from '$app/environment';
import { Game } from '$lib/game/game.svelte';
import { get, set } from 'idb-keyval';
import superjson, { SuperJSON } from 'superjson';

SuperJSON.registerCustom<Game, string>(
	{
		isApplicable: (value) => value instanceof Game,
		serialize: (value) => value.serialize(),
		deserialize: (value) => Game.deserialize(value)
	},
	'Game'
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stores = new Map<string, any>();

export class IndexDbStorageStore<T> {
	private key: string;
	private initialValue: T;
	value = $state<T | null>(null);
	loaded = $state(false);

	constructor(key: string, initialValue: T) {
		this.key = key;
		this.initialValue = initialValue;
		this.loadValue();

		$effect.root(() => {
			$effect(() => {
				if (browser && this.loaded) {
					set(this.key, superjson.stringify(this.value));
				}
			});
		});
	}

	private async loadValue() {
		const localValue = await get(this.key);
		this.value = localValue ? (superjson.parse<T>(localValue) as T) : (this.initialValue as T);
		this.loaded = true;
	}
}

export class LocalStorageStore<T> {
	value: T = $state<T>()!;

	constructor(key: string, initialValue: T) {
		if (browser) {
			const localValue = localStorage.getItem(key);
			this.value = localValue ? (superjson.parse<T>(localValue) as T) : (initialValue as T);
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

export function indexDbStore<T>(key: string, initialValue: T): IndexDbStorageStore<T> {
	if (stores.has(key)) {
		return stores.get(key) as IndexDbStorageStore<T>;
	}
	const result = new IndexDbStorageStore<T>(key, initialValue);
	stores.set(key, result);
	return result;
}
