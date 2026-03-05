import { randomFromArray } from '$lib/utils/random';
import { requirePlayer, type GameContext } from '../gameContext';
import items, { type AllItems } from '../items/itemTypes';
import type { Player } from '../player/player.svelte';

/**
 * Pick a random item from a category, respecting class locks.
 */
function getRandomItemFromCategory(
	player: Player,
	category: Record<string, { classLocks?: string[] }>
): AllItems {
	const eligible = Object.entries(category)
		.filter((x) => !x[1].classLocks || x[1].classLocks.includes(player.classType))
		.map((x) => x[0] as AllItems);
	return randomFromArray(eligible);
}

export function generateLootWheel(playerName: string, ctx: GameContext, index: number = 1) {
	const player = requirePlayer(ctx, playerName, 'loot wheel');
	if (!player || player.dead) return;

	const wheel = [
		{
			label: 'Get a random Consumable',
			onWin() {
				player.assignItem(getRandomItemFromCategory(player, items.consumables));
			}
		},
		{
			label: 'Get a random Helm',
			onWin() {
				player.assignItem(getRandomItemFromCategory(player, items.helm));
			}
		},
		{
			label: 'Get a random Chest',
			onWin() {
				player.assignItem(getRandomItemFromCategory(player, items.chest));
			}
		},
		{
			label: 'Get a random Main Hand',
			onWin() {
				player.assignItem(getRandomItemFromCategory(player, items.mainhand));
			}
		},
		{
			label: 'Get a random Off Hand',
			onWin() {
				player.assignItem(getRandomItemFromCategory(player, items.offHand));
			}
		},
		{
			label: '5 Gold',
			weight: 2,
			onWin() {
				player.gold += 5;
			}
		},
		{
			label: '10 Gold',
			weight: 2,
			onWin() {
				player.gold += 10;
			}
		},
		{
			label: '20 Gold',
			onWin() {
				player.gold += 20;
			}
		}
	];

	ctx.addCustomWheel(`Loot Wheel for ${player.name} - ${index}`, wheel, 'loot');
}
