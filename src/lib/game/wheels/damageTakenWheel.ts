import { addCustomWheel, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import type { WheelBase } from './wheels';

export function generateDamageTakenWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	const globalHpValue = currentGame.value?.globalHpReduction ?? 1;

	const wheel: WheelBase = [
		{
			label: `Take ${globalHpValue * 1} damage`,
			onWin: () => {
				player.hp -= globalHpValue * 1;
			}
		},
		{
			label: `Take ${globalHpValue * 2} damage`,
			onWin: () => {
				player.hp -= globalHpValue * 2;
			}
		},
		{
			label: `Take ${globalHpValue * 3} damage`,
			onWin: () => {
				player.hp -= globalHpValue * 3;
			}
		},
		{
			label: `Take ${globalHpValue * 4} damage`,
			onWin: () => {
				player.hp -= globalHpValue * 4;
			}
		},
		{
			label: `Take ${globalHpValue * 5} damage`,
			onWin: () => {
				player.hp -= globalHpValue * 5;
			}
		},
		{
			label: `Take ${globalHpValue * 10} damage`,
			onWin: () => {
				player.hp -= globalHpValue * 10;
			}
		},
		{
			label: `Take ${globalHpValue * 15} damage`,
			onWin: () => {
				player.hp -= globalHpValue * 15;
			}
		},
		{
			label: `Take ${globalHpValue * 10} damage`,
			onWin: () => {
				player.hp -= globalHpValue * 10;
			}
		},
		{
			label: `Take ${globalHpValue * 15} damage`,
			onWin: () => {
				player.hp -= globalHpValue * 15;
			}
		},
		{
			label: `Take ${globalHpValue * 20} damage and go to shadow realm`,
			onWin: () => {
				player.hp -= globalHpValue * 20;
				player.inShadowRealm = true;
			}
		}
	];

	addCustomWheel(`Damage Taken Wheel - ${player.name}`, wheel);
}
