import { addCustomWheel, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import type { WheelBase } from './wheels';

export function generateDamageTakenWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	const globalHpValue = currentGame.value?.globalHpReduction ?? 1;

	let reductionPercentage = 0;

	if (player.class.name == 'Absolute Unit') {
		reductionPercentage = Math.min(player.baseDefense, 50);
	}

	const reductionPercentageInversion = (100 - reductionPercentage) / 100;

	const wheel: WheelBase = [
		{
			label: `Take ${globalHpValue * 1} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 1 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 2} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 2 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 3} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 3 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 4} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 4 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 5} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 5 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 10} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 10 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 15} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 15 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 10} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 10 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 15} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 15 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 20} damage and go to shadow realm`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 20 * reductionPercentageInversion);
				player.inShadowRealm = true;
			}
		}
	];

	addCustomWheel(`Damage Taken Wheel - ${player.name}`, wheel, 'damage');
}
