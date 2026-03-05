import { createContext } from 'svelte';

type AttackWindow = {
	name: string;
	close: () => void;
} | null;

class AttackWindowStore {
	private _current = $state<AttackWindow>(null);
	public get current() {
		return this._current;
	}
	public set current(value) {
		this._current = value;
	}
}

const [get, set] = createContext<AttackWindowStore>();

export function getAttackWindowStore() {
	return get();
}

export function setAttackWindowStore() {
	const store = new AttackWindowStore();
	set(store);
	return store;
}
