import { getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';

export function generateDamageTakenWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;
}
