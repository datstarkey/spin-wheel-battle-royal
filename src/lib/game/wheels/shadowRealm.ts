import {
	addAuditTrail,
	addCustomWheel,
	currentGame,
	getPlayerByName,
	increaseShopCostModifier
} from '$lib/stores/gameStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import { addShade } from '../classes/shadeweaver';
import type { Player } from '../player/player.svelte';
import { generateRandomPlayerWheel } from './randomPlayerWheel';
import type { WheelBase } from './wheels';

// Grant Shade to all Shadeweavers when someone spins the shadow realm wheel
function grantShadeToShadeweavers() {
	if (!currentGame.value) return;
	for (const player of currentGame.value.players) {
		if (player.classType === 'shadeweaver' && !player.dead) {
			addShade(player);
		}
	}
}

export function generateShadowRealmWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}
	if (player.dead) return;
	if (player.classType === 'shadeweaver') return;

	// Grant Shade to all Shadeweavers when someone spins the wheel
	grantShadeToShadeweavers();

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
				addAuditTrail(`${player.name} lost 5 gold in the Shadow Realm`);
			}
		},
		{
			label: 'Give 5 gold to someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Gives 5 gold to someone`, (winner) => {
					player.gold -= 5;
					winner.gold += 5;
					addAuditTrail(`${player.name} gave 5 gold to ${winner.name}`);
				});
			}
		},
		{
			label: 'Give 3 Base Attack to someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Gives 3 Base Attack to someone`, (winner) => {
					player.baseAttack -= 3;
					winner.baseAttack += 3;
					addAuditTrail(`${player.name} gave 3 base attack to ${winner.name}`);
				});
			}
		},
		{
			label: 'Give 3 Base Defense to someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Gives 3 Base Defense to someone`, (winner) => {
					player.baseDefense -= 3;
					winner.baseDefense += 3;
					addAuditTrail(`${player.name} gave 3 base defense to ${winner.name}`);
				});
			}
		},
		{
			label: 'Swap Places with someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Swaps Places with someone`, (winner) => {
					// Store original states
					const playerPosition = player.position;
					const playerWasInShadowRealm = player.inShadowRealm;
					const winnerPosition = winner.position;
					const winnerWasInShadowRealm = winner.inShadowRealm;

					// Swap board positions
					player.position = winnerPosition;
					winner.position = playerPosition;

					// Swap shadow realm status (always swap)
					player.inShadowRealm = winnerWasInShadowRealm;
					winner.inShadowRealm = playerWasInShadowRealm;

					addAuditTrail(`${player.name} swaps places with ${winner.name}`);
				});
			}
		},
		{
			label: 'Teleport to someone',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} Teleports to someone`, (winner) => {
					// Teleport to target's position and shadow realm status
					player.position = winner.position;
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
			onWin: () => {
				generateRandomPlayerWheel(`${player.name} hurls out some insults`, (winner) => {
					winner.statuses.addStatus('EmotionalDamage');
					addAuditTrail(`${player.name} inflicted Emotional Damage on ${winner.name}!`);
				});
			}
		},
		{
			label: 'Nothing',
			onWin: () => {
				addAuditTrail(`${player.name} found nothing in the Shadow Realm`);
			}
		}
	];
	addCustomWheel(`Shadow Realm Wheel for ${player.name}`, wheel, 'shadow');
}
