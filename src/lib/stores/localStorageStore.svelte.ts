import { browser } from '$app/environment';
import { Game } from '$lib/game/game.svelte';
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
const stores = new Map<string, LocalStorageStore<any>>();

export class LocalStorageStore<T> {
	value: T = $state<T>()!;

	constructor(key: string, initialValue: T) {
		const localValue = localStorage.getItem(key);
		this.value = localValue ? (superjson.parse<T>(localValue) as T) : (initialValue as T);

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
