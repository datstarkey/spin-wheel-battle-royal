import {
	addAuditTrail,
	addCustomWheel,
	getPlayerByName,
	increaseShopCostModifier
} from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import type { Player } from '../player/player.svelte';
import { generateRandomPlayerWheel } from './randomPlayerWheel';
import type { WheelBase } from './wheels';

export function generateShadowRealmWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}
	if (player.dead) return;

	const wheel: WheelBase = [
		{
			label: 'Return to spawn',
			onWin: () => {
				player.inShadowRealm = false;
				addAuditTrail(`${player.name} returns to spawn`);
			}
		},
		{
			label: 'Lose 5 gold',
			onWin: (player: Player) => {
				player.gold -= 5;
			}
		},
		{
			label: 'Give 5 gold to someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Gives 5 gold to someone`, (winner) => {
					player.gold -= 5;
					winner.gold += 5;
				});
			}
		},
		{
			label: 'Give 3 Base Attack to someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Gives 3 Base Attack to someone`, (winner) => {
					player.baseAttack -= 3;
					winner.baseAttack += 3;
				});
			}
		},
		{
			label: 'Give 3 Base Defense to someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Gives 3 Base Defense to someone`, (winner) => {
					player.baseDefense -= 3;
					winner.baseDefense += 3;
				});
			}
		},
		{
			label: 'Swap Places with someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Swaps Places with someone`, (winner) => {
					if (winner.inShadowRealm != player.inShadowRealm) {
						player.inShadowRealm = !player.inShadowRealm;
						winner.inShadowRealm = !winner.inShadowRealm;
					}
					addAuditTrail(`${player.name} swaps places with ${winner.name}`);
				});
			}
		},
		{
			label: 'Teleport to someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Teleports to someone`, (winner) => {
					player.inShadowRealm = winner.inShadowRealm;
					addAuditTrail(`${player.name} teleports to ${winner.name}`);
				});
			}
		},
		{
			label: 'Increase all shop costs by 1g for everyone',
			onWin: () => {
				increaseShopCostModifier(1);
				addAuditTrail(`${player.name} increases all shop costs by 1g for everyone`);
			}
		},
		{
			label: 'Emotional damage',
			onWin: () => toast.error('Not implemented yet')
		},
		{
			label: 'Nothing'
		}
	];
	addCustomWheel(`Shadow Realm Wheel for ${player.name}`, wheel);
}
