<script lang="ts">
	import type { Player } from '$lib/game/player/player.svelte';
	import { getGameStore } from '$lib/stores/gameStore.svelte';
	import { getMovementStore } from '$lib/stores/movementStore.svelte';
	import { getMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';
	import { getSocketStore } from '$lib/multiplayer/socketStore.svelte';

	const gs = getGameStore();
	const movement = getMovementStore();
	const mp = getMultiplayerStore();
	const socket = getSocketStore();
	import { getCasinoEntryFee } from '$lib/game/wheels/casinoWheel';
	import toast from '$lib/stores/toaster.svelte';
	import Portal from '../Portal.svelte';
	import SpinWheel from '../wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '../wheel/types';
	import PlayerShop from './player/PlayerShop.svelte';
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		player: Player;
	}

	let { player }: Props = $props();

	// Combat state from server
	let combat = $derived(mp.combatState);
	let showBattle = $derived(combat !== null);
	let combatTotal = $derived(combat ? combat.attackWeight + combat.defenseWeight : 1);
	let combatAtkPct = $derived(
		combatTotal > 0 && combat ? (combat.attackWeight / combatTotal) * 100 : 50
	);

	// Look up the combat pending wheel from the multiplayer store for sync data
	let combatPendingWheel = $derived.by(() => {
		if (!combat) return undefined;
		return mp.pendingWheels.find((w) => w.key === combat.wheelKey);
	});
	let combatShuffledOrder = $derived(combatPendingWheel?.shuffledOrder);
	let combatSpinParams = $derived(combatPendingWheel?.spinParams);
	let combatSpinState = $derived(combatPendingWheel?.spinState);

	// Only the attacker (current turn player) or GM can spin the combat wheel
	let canSpinCombat = $derived.by(() => {
		if (!combat) return false;
		const myName = mp.myPlayerName;
		return combat.attackerName === myName || mp.iAmGM;
	});

	// Build combat wheel items from server combat state
	let combatWheelItems = $derived.by((): SpinWheelItem[] => {
		if (!combat) return [];
		return [
			{ label: combat.attackerName, weight: combat.attackWeight },
			{ label: combat.defenderName, weight: combat.defenseWeight }
		];
	});

	let battleWinner = $state<string | null>(null);
	let battleWinnerIndex = $state<number | undefined>(undefined);

	let availableToAttack = $derived(
		gs.game?.players.filter((p) => {
			if (p.name === player.name) return false;
			if (player.hp <= 0) return false;
			if (p.dead) return false;
			if (!movement.isPlayerInAttackRange(p.name)) return false;

			if (player.classType === 'shadeweaver' && p.inShadowRealm) return true;
			return p.inShadowRealm === player.inShadowRealm;
		}) || []
	);

	let canAccessShop = $derived(movement.isCurrentPlayerOnShop());
	let canAccessCasino = $derived(movement.isCurrentPlayerOnCasino());

	let selectedPlayerName = $state<string | null>(null);

	let defendingPlayer = $derived.by(() => {
		if (selectedPlayerName) {
			const selected = availableToAttack.find((p) => p.name === selectedPlayerName);
			if (selected) return selected;
		}
		return availableToAttack[0] ?? null;
	});

	let shopOpen = $state(false);

	// Broadcast shop state to spectators
	$effect(() => {
		const shouldBroadcast = mp.canAct && shopOpen;
		if (shouldBroadcast) {
			socket.sendSpectatorHint({ kind: 'shopping', playerName: mp.myPlayerName, open: true });
		}
		return () => {
			if (shouldBroadcast) {
				socket.sendSpectatorHint({ kind: 'shopping', playerName: mp.myPlayerName, open: false });
			}
		};
	});

	let totalWeight = $derived((player?.attack ?? 0) + (defendingPlayer?.defense ?? 0));
	let attackerWinChance = $derived(
		totalWeight > 0 ? ((player?.attack ?? 0) / totalWeight) * 100 : 50
	);
	let defenderWinChance = $derived(
		totalWeight > 0 ? ((defendingPlayer?.defense ?? 0) / totalWeight) * 100 : 50
	);
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
		battleWinner = null;
		battleWinnerIndex = undefined;
		socket.attackResolve(player.name, defendingPlayer.name);
	}

	function onCombatWinner(item: SpinWheelItem, index: number) {
		battleWinner = item.label;
		battleWinnerIndex = index;
	}

	function requestCombatSpin() {
		if (!combat) return;
		socket.requestWheelSpin(combat.wheelKey);
	}

	function handleCombatSpinComplete() {
		if (!combat) return;
		mp.setWheelLanded(combat.wheelKey);
	}

	function confirmCombatResult() {
		if (!combat || battleWinnerIndex === undefined) return;
		// Map shuffled display index back to original item index
		const order = combatShuffledOrder;
		const originalIndex = order ? order[battleWinnerIndex] : battleWinnerIndex;
		socket.sendWheelSpinResult(combat.wheelKey, originalIndex);
		battleWinner = null;
		battleWinnerIndex = undefined;
		// Don't locally clear combat — wait for server's state_update with combatState: null
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

<PlayerShop {player} bind:open={shopOpen} />

<!-- ============ Battle Overlay ============ -->
<Portal>
	{#if showBattle && combat}
		<!-- Backdrop -->
		<div class="fixed inset-0 z-9998 bg-black/85 backdrop-blur-sm">
			<div
				class="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,transparent_70%)]"
			></div>
			<div
				class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] opacity-20"
			></div>
		</div>

		<!-- Battle UI -->
		<div class="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto p-4">
			<div
				class="border-primary-500/30 from-surface-950 via-surface-900 to-surface-950 relative w-full max-w-3xl overflow-hidden rounded-xl border-2 bg-gradient-to-br shadow-[0_0_80px_rgba(220,38,38,0.2)]"
			>
				<!-- Top bar -->
				<div
					class="via-primary-500 absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent"
				></div>

				<!-- Corner accents -->
				<div
					class="border-primary-500/50 pointer-events-none absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2"
				></div>
				<div
					class="border-primary-500/50 pointer-events-none absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2"
				></div>
				<div
					class="border-primary-500/50 pointer-events-none absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2"
				></div>
				<div
					class="border-primary-500/50 pointer-events-none absolute right-0 bottom-0 h-8 w-8 border-r-2 border-b-2"
				></div>

				<div class="p-6">
					<!-- Header -->
					<div class="mb-6 text-center">
						<div class="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center">
							<div
								class="text-primary-400 absolute inset-0 animate-ping rounded-full bg-current opacity-20"
								style="animation-duration: 2s;"
							></div>
							<iconify-icon
								icon="mdi:sword-cross"
								class="text-primary-400 relative z-10 text-4xl drop-shadow-[0_0_20px_currentColor]"
							></iconify-icon>
						</div>
						<h1 class="mb-1 font-mono text-2xl font-black tracking-[0.2em] text-white uppercase">
							BATTLE
						</h1>
					</div>

					<!-- VS Display -->
					<div class="mb-6 flex items-center justify-center gap-6">
						<div class="text-center">
							<div
								class="border-primary-500/50 bg-primary-500/10 mb-2 inline-flex items-center gap-2 rounded-full border px-4 py-2"
							>
								<Icon icon="mdi:sword" class="text-primary-400" />
								<span class="font-mono font-bold text-white">{combat.attackerName}</span>
							</div>
							<div class="text-primary-400 text-sm font-semibold">
								ATK {combat.attackWeight}
							</div>
						</div>

						<span class="text-surface-500 font-mono text-2xl font-black tracking-widest">VS</span>

						<div class="text-center">
							<div
								class="border-secondary-500/50 bg-secondary-500/10 mb-2 inline-flex items-center gap-2 rounded-full border px-4 py-2"
							>
								<Icon icon="mdi:shield" class="text-secondary-400" />
								<span class="font-mono font-bold text-white">{combat.defenderName}</span>
							</div>
							<div class="text-secondary-400 text-sm font-semibold">
								DEF {combat.defenseWeight}
							</div>
						</div>
					</div>

					<!-- Odds Bar -->
					<div class="mx-auto mb-6 max-w-md">
						<div class="flex items-center gap-1">
							<div class="bg-primary-500 h-2.5 rounded-l-full" style="width: {combatAtkPct}%"></div>
							<div
								class="bg-secondary-500 h-2.5 rounded-r-full"
								style="width: {100 - combatAtkPct}%"
							></div>
						</div>
						<div class="text-surface-500 mt-1 flex justify-between text-xs">
							<span>{combatAtkPct.toFixed(0)}%</span>
							<span>{(100 - combatAtkPct).toFixed(0)}%</span>
						</div>
					</div>

					<!-- Spin Wheel -->
					<SpinWheel
						items={combatWheelItems}
						buttonText="FIGHT!"
						showSpin={!battleWinner}
						canSpin={canSpinCombat}
						skipOnWin={true}
						onWinner={onCombatWinner}
						syncSpinParams={combatSpinParams}
						shuffledOrder={combatShuffledOrder}
						onRequestSpin={requestCombatSpin}
						onSpinComplete={handleCombatSpinComplete}
					/>

					<!-- Waiting state for non-spinners -->
					{#if !canSpinCombat && !battleWinner}
						<div class="mt-4 flex items-center justify-center gap-2">
							{#if combatSpinState === 'spinning'}
								<iconify-icon icon="mdi:loading" class="text-primary-400 animate-spin text-lg"
								></iconify-icon>
								<span class="text-surface-300 font-mono text-sm tracking-wider">Spinning...</span>
							{:else if combatSpinState === 'landed'}
								<iconify-icon icon="mdi:timer-sand" class="text-surface-400 animate-pulse text-lg"
								></iconify-icon>
								<span class="text-surface-400 font-mono text-sm tracking-wider">
									Waiting for <span class="text-surface-100 font-bold">{combat.attackerName}</span> to
									continue...
								</span>
							{:else}
								<iconify-icon icon="mdi:timer-sand" class="text-surface-400 animate-pulse text-lg"
								></iconify-icon>
								<span class="text-surface-400 font-mono text-sm tracking-wider">
									Waiting for <span class="text-surface-100 font-bold">{combat.attackerName}</span> to
									spin...
								</span>
							{/if}
						</div>
					{/if}

					<!-- Result -->
					{#if battleWinner}
						<div class="mt-6 text-center">
							<div
								class="border-warning-500/50 from-surface-900 to-surface-950 mx-auto inline-block rounded-lg border-2 bg-gradient-to-br px-8 py-4 shadow-[0_0_40px_rgba(234,179,8,0.2)]"
							>
								<p class="text-warning-400 mb-1 text-xs font-bold tracking-[0.3em] uppercase">
									Winner
								</p>
								<p
									class="font-mono text-2xl font-black text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
								>
									{battleWinner}
								</p>
							</div>

							{#if canSpinCombat}
								<button
									onclick={confirmCombatResult}
									class="border-primary-500/50 from-surface-800 to-surface-900 hover:from-surface-700 hover:to-surface-800 mt-4 w-full max-w-md rounded-lg border-2 bg-gradient-to-br px-8 py-3 font-mono text-lg font-black tracking-widest text-white uppercase transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]"
								>
									Continue
								</button>
							{:else}
								<div class="mt-4 flex items-center justify-center gap-2">
									<iconify-icon icon="mdi:timer-sand" class="text-surface-400 animate-pulse text-lg"
									></iconify-icon>
									<span class="text-surface-400 font-mono text-sm tracking-wider">
										Waiting for <span class="text-surface-100 font-bold">{combat.attackerName}</span
										> to continue...
									</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Bottom bar -->
				<div
					class="via-secondary-500 absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent"
				></div>
			</div>
		</div>
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
		onclick={() => (shopOpen = true)}
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
