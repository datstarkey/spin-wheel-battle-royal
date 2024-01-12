import { browser } from '$app/environment';
import { get, writable, type Writable } from 'svelte/store';
import superjson, { SuperJSON } from 'superjson';
import { Player } from '$lib/game/player/player';
import { Game } from '$lib/game/game';
import { PlayerGear } from '$lib/game/player/playerGear';
import { PlayerStatuses } from '$lib/game/player/playerStatuses';

SuperJSON.registerClass(PlayerGear);
SuperJSON.registerClass(PlayerStatuses);
SuperJSON.registerClass(Player);
SuperJSON.registerClass(Game);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stores = new Map<string, Writable<any>>();

export function localStorageStore<T>(key: string, initialValue: T): Writable<T> {
	if (stores.has(key)) {
		return stores.get(key) as Writable<T>;
	}

	if (!browser) return writable<T>(initialValue);

	const localValue = localStorage.getItem(key);

	const value = localValue ? superjson.parse<T>(localValue) : initialValue;

	const { subscribe, set } = writable<T>(value);

	const store = {
		subscribe,
		set: (value: T) => {
			if (browser) {
				localStorage.setItem(key, superjson.stringify(value));
			}
			set(value);
		},
		update: (updater: (value: T) => T) => {
			const updatedStore = updater(get(store));
			if (browser) localStorage.setItem(key, superjson.stringify(updatedStore));
			set(updatedStore);
		}
	} as Writable<T>;

	stores.set(key, store);
	return store;
}
