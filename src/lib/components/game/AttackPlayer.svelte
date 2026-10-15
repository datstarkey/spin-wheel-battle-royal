<script lang="ts">
	import type { Player } from '#lib/game/player/player.svelte.js';
	import { getGameStore } from '#lib/stores/gameStore.svelte.js';
	import { canAttackTarget, getCombatWeights, isPlayerOnTile } from '#lib/game/rules.js';
	import { getMultiplayerStore } from '#lib/multiplayer/multiplayerStore.svelte.js';
	import { getSocketStore } from '#lib/multiplayer/socketStore.svelte.js';

	const gs = getGameStore();
	const mp = getMultiplayerStore();
	const socket = getSocketStore();
	import { getCasinoEntryFee } from '#lib/game/wheels/casinoWheel.js';
	import toast from '#lib/stores/toaster.svelte.js';
	import Portal from '../Portal.svelte';
	import BattleWheel from './BattleWheel.svelte';
	import PlayerShop from './player/PlayerShop.svelte';

	interface Props {
		player: Player;
	}

	let { player }: Props = $props();

	let combat = $derived(mp.combatState);

	let availableToAttack = $derived(
		gs.game?.players.filter((p) => canAttackTarget(player, p)) ?? []
	);

	let canAccessShop = $derived(isPlayerOnTile(player, 'shop'));
	let canAccessCasino = $derived(isPlayerOnTile(player, 'casino'));

	let selectedPlayerName = $state<string | null>(null);

	let defendingPlayer = $derived.by(() => {
		if (selectedPlayerName) {
			const selected = availableToAttack.find((p) => p.name === selectedPlayerName);
			if (selected) return selected;
		}
		return availableToAttack[0] ?? null;
	});

	let shopOpen = $state(false);

	/** Opening/closing the shop is shown to spectators */
	function setShopOpen(open: boolean) {
		shopOpen = open;
		if (mp.canAct) {
			socket.sendSpectatorHint({ kind: 'shopping', playerName: mp.myPlayerName, open });
		}
	}

	// Same weights the server's combat wheel uses, so the odds shown are the real ones
	let weights = $derived(
		defendingPlayer
			? getCombatWeights(player, defendingPlayer)
			: { attackWeight: 1, defenseWeight: 1 }
	);
	let attackerWinChance = $derived(
		(weights.attackWeight / (weights.attackWeight + weights.defenseWeight)) * 100
	);
	let defenderWinChance = $derived(100 - attackerWinChance);
	let isFavored = $derived(attackerWinChance > 50);

	let casinoCheck = $derived.by(() => {
		const game = gs.game;
		if (!game) return { canGamble: false, reason: 'Not ready' };
		if (player.dead) return { canGamble: false, reason: 'Dead players cannot gamble' };
		if (game.hasUsedCasino)
			return { canGamble: false, reason: 'Already used the casino this turn' };
		if (player.classType === 'gambler') return { canGamble: true };
		if (player.gold < getCasinoEntryFee())
			return { canGamble: false, reason: `Need ${getCasinoEntryFee()}g to enter` };
		return { canGamble: true };
	});

	function attackPlayerAction() {
		if (!defendingPlayer) {
			toast.error('No defending player selected');
			return;
		}
		socket.attackResolve(player.name, defendingPlayer.name);
	}

	function defendingPlayerChanged(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedPlayerName = target.value;
	}

	function handleCasinoClick() {
		if (!canAccessCasino) {
			toast.error('Must be on a casino tile to gamble!');
			return;
		}
		if (!casinoCheck.canGamble) {
			toast.error(casinoCheck.reason || 'Cannot gamble');
			return;
		}
		socket.casino();
	}
</script>

<PlayerShop {player} bind:open={() => shopOpen, setShopOpen} />

<!-- Battle overlay (portalled out of the card's stacking context) -->
<Portal>
	{#if combat}
		{#key combat.wheelKey}
			<BattleWheel {combat} />
		{/key}
	{/if}
</Portal>

<!-- ============ Action Buttons ============ -->
<label class="label mt-4">
	<span>Player To Attack</span>
	<select
		class="select"
		value={defendingPlayer?.name}
		onchange={defendingPlayerChanged}
		placeholder="None"
	>
		{#each availableToAttack as item (item.name)}
			<option value={item.name}>{item.name}</option>
		{/each}
	</select>
</label>

{#if defendingPlayer}
	<div class="border-surface-500/20 bg-surface-900/50 mt-3 rounded border p-3">
		<div class="mb-2 flex items-center justify-between text-xs">
			<span class="text-surface-300 font-semibold">{player.name}</span>
			<span class="text-surface-500">vs</span>
			<span class="text-surface-300 font-semibold">{defendingPlayer.name}</span>
		</div>
		<div class="flex items-center gap-1">
			<div
				class="h-2 rounded-l-full {isFavored ? 'bg-success-500' : 'bg-error-500'}"
				style="width: {attackerWinChance}%"
			></div>
			<div
				class="h-2 rounded-r-full {!isFavored ? 'bg-success-500' : 'bg-error-500'}"
				style="width: {defenderWinChance}%"
			></div>
		</div>
		<div class="mt-1 flex justify-between text-[0.6rem]">
			<span class="text-primary-400">ATK {player.attack}</span>
			<span class="text-surface-500"
				>{attackerWinChance.toFixed(0)}% / {defenderWinChance.toFixed(0)}%</span
			>
			<span class="text-secondary-400">DEF {defendingPlayer.defense}</span>
		</div>
	</div>
{/if}

<div class="mt-4 grid grid-cols-2 gap-2">
	<button
		class="border-primary-600 bg-primary-600 hover:bg-primary-700 flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
		onclick={attackPlayerAction}
		disabled={defendingPlayer === null || gs.game?.hasFought === true || !mp.canAct}
	>
		<iconify-icon icon="mdi:sword-cross" width="16"></iconify-icon>
		Attack
	</button>
	<button
		class="border-warning-600 bg-warning-600 hover:bg-warning-700 flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => setShopOpen(true)}
		disabled={shopOpen || player.inShadowRealm || !canAccessShop || !mp.canAct}
		title={!canAccessShop ? 'Must be on a shop tile to access the shop' : ''}
	>
		<iconify-icon icon="mdi:store" width="16"></iconify-icon>
		Shop
	</button>
	<button
		class="border-tertiary-600 bg-tertiary-600 hover:bg-tertiary-700 flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
		onclick={handleCasinoClick}
		disabled={player.inShadowRealm || !canAccessCasino || !casinoCheck.canGamble || !mp.canAct}
		title={!canAccessCasino
			? 'Must be on a casino tile to gamble'
			: casinoCheck.reason || `Entry fee: ${getCasinoEntryFee()}g`}
	>
		<iconify-icon icon="mdi:slot-machine" width="16"></iconify-icon>
		Casino
	</button>
	<button
		class="border-success-600 bg-success-600 hover:bg-success-700 flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => socket.finishTurn()}
		disabled={!mp.canAct}
	>
		<iconify-icon icon="mdi:check-bold" width="16"></iconify-icon>
		Finish
	</button>
</div>
