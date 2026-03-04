<script lang="ts">
	import type { Player } from '$lib/game/player/player.svelte';
	import {
		playBattleMusic,
		playVictoryMusic,
		endBattleAndResumeBackground
	} from '$lib/stores/battleMusic.svelte';
	import { addAuditTrail, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
	import {
		isCurrentPlayerOnShop,
		isCurrentPlayerOnCasino,
		isPlayerInAttackRange
	} from '$lib/stores/movementStore.svelte';
	import {
		getCurrentAttackWindow,
		setCurrentAttackWindow
	} from '$lib/stores/attackWindowStore.svelte';
	import {
		generateCasinoWheel,
		canGambleAtCasino,
		getCasinoEntryFee
	} from '$lib/game/wheels/casinoWheel';
	import toast from '$lib/stores/toaster.svelte';
	import Portal from '../Portal.svelte';
	import SpinWheel from '../wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '../wheel/types';
	import PlayerShop from './player/PlayerShop.svelte';

	interface Props {
		player: Player;
		showWheel: boolean;
	}

	let { player, showWheel = $bindable(false) }: Props = $props();

	let availableToAttack = $derived(
		currentGame.value?.players.filter((p) => {
			if (p.name === player.name) return false;
			if (player.hp <= 0) return false;
			if (p.dead) return false; // Can't attack dead players
			if (!isPlayerInAttackRange(p.name)) return false;

			// Shadeweaver can attack anyone in the Shadow Realm from anywhere
			if (player.classType === 'shadeweaver' && p.inShadowRealm) {
				return true;
			}

			// Normal rule: must share shadow realm status
			return p.inShadowRealm === player.inShadowRealm;
		}) || []
	);

	// Check if player is on a shop tile
	let canAccessShop = $derived(isCurrentPlayerOnShop());

	// Check if player is on a casino tile
	let canAccessCasino = $derived(isCurrentPlayerOnCasino());

	// Default to first available player, allow manual override via select
	let selectedPlayerName = $state<string | null>(null);

	let defendingPlayer = $derived.by(() => {
		// If user selected a player, use that
		if (selectedPlayerName) {
			const selected = availableToAttack.find((p) => p.name === selectedPlayerName);
			if (selected) return selected;
		}
		// Otherwise default to first available
		return availableToAttack[0] ?? null;
	});

	let winningPlayer = $state<Player | null>();

	let shopOpen = $state(false);

	// Battle stats calculations
	let totalWeight = $derived((player?.attack ?? 0) + (defendingPlayer?.defense ?? 0));
	let attackerWinChance = $derived(
		totalWeight > 0 ? ((player?.attack ?? 0) / totalWeight) * 100 : 50
	);
	let defenderWinChance = $derived(
		totalWeight > 0 ? ((defendingPlayer?.defense ?? 0) / totalWeight) * 100 : 50
	);
	let attackerOdds = $derived(
		defendingPlayer?.defense && defendingPlayer.defense > 0
			? (player?.attack ?? 0) / defendingPlayer.defense
			: 1
	);
	let isFavored = $derived(attackerWinChance > 50);

	// Casino gambling check
	let casinoCheck = $derived(canGambleAtCasino(player.name));

	function attackPlayer() {
		if (!defendingPlayer) {
			toast.error('Something went wrong could not find defending player');
			return;
		}
		// Capture the defender at battle start so close() uses the correct player
		const battleDefender = defendingPlayer;
		playBattleMusic();
		const existingWindow = getCurrentAttackWindow();
		if (existingWindow && existingWindow.name != player.name) existingWindow.close();
		showWheel = true;
		player.onAttackStart(battleDefender);
		battleDefender.onDefenseStart(player);
		setCurrentAttackWindow({
			name: player.name,
			close: () => {
				showWheel = false;
				winningPlayer = null;
				player.onAttackEnd(battleDefender);
				battleDefender.onDefenseEnd(player);
				endBattleAndResumeBackground();
			}
		});
	}

	function onWinner(item: SpinWheelItem): void {
		winningPlayer = getPlayerByName(item.label);
		if (currentGame.value) currentGame.value.hasFought = true;
		// Play victory music when wheel stops
		playVictoryMusic();

		if (!winningPlayer) {
			toast.error('Something went wrong could not find player ' + item.label);
			return;
		}
		if (!defendingPlayer) {
			toast.error('Something went wrong could not find defending player');
			return;
		}

		const won = player.name == winningPlayer.name;
		const attackerOddsStr = attackerWinChance.toFixed(0);

		if (won) {
			addAuditTrail(
				`${player.name} (ATK ${player.attack}) beat ${defendingPlayer.name} (DEF ${defendingPlayer.defense}) [${attackerOddsStr}% odds]`
			);
			player.onAttackWin(defendingPlayer);
			defendingPlayer.onDefendLose(player);
		} else {
			addAuditTrail(
				`${player.name} (ATK ${player.attack}) lost to ${defendingPlayer.name} (DEF ${defendingPlayer.defense}) [${attackerOddsStr}% odds]`
			);
			player.onAttackLose(defendingPlayer);
			defendingPlayer.onDefendWin(player);
		}
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
		generateCasinoWheel(player.name);
	}
</script>

<PlayerShop {player} bind:open={shopOpen} />

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

<div class="mt-4 grid grid-cols-2 gap-2">
	<button
		class="border-primary-600 bg-primary-600 hover:bg-primary-700 flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
		onclick={attackPlayer}
		disabled={defendingPlayer === null || showWheel || currentGame.value?.hasFought === true}
	>
		<iconify-icon icon="mdi:sword-cross" width="16"></iconify-icon>
		Attack
	</button>
	<button
		class="border-warning-600 bg-warning-600 hover:bg-warning-700 flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => (shopOpen = true)}
		disabled={showWheel || shopOpen || player.inShadowRealm || !canAccessShop}
		title={!canAccessShop ? 'Must be on a shop tile to access the shop' : ''}
	>
		<iconify-icon icon="mdi:store" width="16"></iconify-icon>
		Shop
	</button>
	<button
		class="border-tertiary-600 bg-tertiary-600 hover:bg-tertiary-700 flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
		onclick={handleCasinoClick}
		disabled={showWheel || player.inShadowRealm || !canAccessCasino || !casinoCheck.canGamble}
		title={!canAccessCasino
			? 'Must be on a casino tile to gamble'
			: casinoCheck.reason || `Entry fee: ${getCasinoEntryFee()}g`}
	>
		<iconify-icon icon="mdi:slot-machine" width="16"></iconify-icon>
		Casino
	</button>
	<button
		class="border-success-600 bg-success-600 hover:bg-success-700 flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => currentGame?.value?.finishTurn()}
		disabled={showWheel}
	>
		<iconify-icon icon="mdi:check-bold" width="16"></iconify-icon>
		Finish
	</button>
</div>

<!-- Portal renders modal at root level, outside all stacking contexts -->
<Portal>
	<!-- Epic backdrop with animated effects -->
	{#if showWheel}
		<div class="fixed inset-0 z-9998 bg-black/80 backdrop-blur-sm">
			<!-- Animated radial pulse -->
			<div
				class="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,transparent_70%)]"
			></div>
			<!-- Scan lines overlay -->
			<div
				class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] opacity-20"
			></div>
		</div>
	{/if}

	<div
		class="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto p-4 transition-all duration-500 {showWheel
			? 'scale-100 opacity-100'
			: 'pointer-events-none scale-95 opacity-0'}"
	>
		{#if defendingPlayer}
			{#key defendingPlayer}
				{#key showWheel}
					<div
						class="border-primary-500/30 from-surface-950 via-surface-900 to-surface-950 relative my-auto max-h-[100dvh] w-full max-w-6xl overflow-y-auto rounded-lg border-2 bg-gradient-to-br shadow-[0_0_60px_rgba(220,38,38,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]"
					>
						<!-- Top decorative bar -->
						<div
							class="via-primary-500 absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent"
						></div>

						<!-- Close button -->
						<button
							onclick={() => getCurrentAttackWindow()?.close()}
							aria-label="Close battle"
							class="text-surface-400 hover:border-primary-500/50 hover:bg-primary-500/20 absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 transition-all hover:text-white"
						>
							<iconify-icon icon="mdi:close" width="20"></iconify-icon>
						</button>

						<!-- Epic VS Header -->
						<div class="relative px-8 pt-8 pb-4">
							<!-- Background glow -->
							<div
								class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.1)_0%,transparent_70%)]"
							></div>

							<div class="relative flex items-center justify-center gap-4">
								<!-- Attacker Side -->
								<div class="flex flex-1 flex-col items-center">
									<div
										class="border-primary-500 from-primary-500/30 to-primary-700/30 relative mb-3 flex h-20 w-20 items-center justify-center rounded-full border-3 bg-gradient-to-br shadow-[0_0_30px_rgba(220,38,38,0.4)]"
									>
										<span class="text-primary-400 text-3xl font-black"
											>{player.name.charAt(0).toUpperCase()}</span
										>
										<!-- Animated ring -->
										<div
											class="border-primary-500/50 absolute inset-0 animate-ping rounded-full border-2"
											style="animation-duration: 2s;"
										></div>
									</div>
									<h2
										class="mb-1 text-2xl font-black tracking-wider text-white uppercase drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
									>
										{player.name}
									</h2>
									<div class="flex items-center gap-2 text-sm">
										<iconify-icon icon="mdi:sword" class="text-primary-400"></iconify-icon>
										<span class="text-primary-400 font-bold">ATK {player.attack}</span>
									</div>
									<span class="text-surface-500 mt-1 text-xs tracking-widest uppercase"
										>{player.class.name}</span
									>
								</div>

								<!-- Epic VS Badge -->
								<div class="relative flex flex-col items-center px-4">
									<div
										class="border-warning-500/50 from-warning-500/20 to-warning-700/20 relative flex h-16 w-16 items-center justify-center rounded-full border-2 bg-gradient-to-br"
									>
										<span
											class="text-warning-400 text-2xl font-black italic drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
											>VS</span
										>
									</div>
									<!-- Lightning bolts -->
									<div class="absolute top-1/2 -left-2 -translate-y-1/2">
										<iconify-icon icon="mdi:lightning-bolt" class="text-warning-500/60 text-2xl"
										></iconify-icon>
									</div>
									<div class="absolute top-1/2 -right-2 -translate-y-1/2 rotate-180">
										<iconify-icon icon="mdi:lightning-bolt" class="text-warning-500/60 text-2xl"
										></iconify-icon>
									</div>
								</div>

								<!-- Defender Side -->
								<div class="flex flex-1 flex-col items-center">
									<div
										class="border-secondary-500 from-secondary-500/30 to-secondary-700/30 relative mb-3 flex h-20 w-20 items-center justify-center rounded-full border-3 bg-gradient-to-br shadow-[0_0_30px_rgba(59,130,246,0.4)]"
									>
										<span class="text-secondary-400 text-3xl font-black"
											>{defendingPlayer.name.charAt(0).toUpperCase()}</span
										>
									</div>
									<h2
										class="mb-1 text-2xl font-black tracking-wider text-white uppercase drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
									>
										{defendingPlayer.name}
									</h2>
									<div class="flex items-center gap-2 text-sm">
										<iconify-icon icon="mdi:shield" class="text-secondary-400"></iconify-icon>
										<span class="text-secondary-400 font-bold">DEF {defendingPlayer.defense}</span>
									</div>
									<span class="text-surface-500 mt-1 text-xs tracking-widest uppercase"
										>{defendingPlayer.class.name}</span
									>
								</div>
							</div>
						</div>

						<!-- Battle Stats Panel -->
						<div class="mx-8 mt-4 grid grid-cols-3 gap-3">
							<!-- Attacker Stats -->
							<div
								class="border-primary-500/20 from-primary-500/10 rounded-lg border bg-gradient-to-br to-transparent p-3"
							>
								<div
									class="text-primary-400 mb-2 flex items-center gap-2 text-xs tracking-widest uppercase"
								>
									<iconify-icon icon="mdi:sword" width="12"></iconify-icon>
									<span>Attacker</span>
								</div>
								<div class="space-y-1.5">
									<div class="flex items-center justify-between text-sm">
										<span class="text-surface-400">Win Chance</span>
										<span class="text-primary-300 font-bold">{attackerWinChance.toFixed(1)}%</span>
									</div>
									<div class="h-1.5 overflow-hidden rounded-full bg-black/30">
										<div
											class="from-primary-600 to-primary-400 h-full bg-gradient-to-r transition-all duration-500"
											style="width: {attackerWinChance}%"
										></div>
									</div>
									<div class="text-surface-500 flex items-center justify-between text-xs">
										<span>ATK Power</span>
										<span class="text-surface-300 font-mono">{player.attack}</span>
									</div>
								</div>
							</div>

							<!-- Center Stats -->
							<div
								class="border-warning-500/20 from-warning-500/5 flex flex-col items-center justify-center rounded-lg border bg-gradient-to-br to-transparent p-3"
							>
								<div class="text-warning-500 mb-1 text-xs tracking-widest uppercase">Odds</div>
								<div class="text-warning-400 text-2xl font-black">
									{#if attackerOdds >= 1}
										{attackerOdds.toFixed(2)}:1
									{:else}
										1:{(1 / attackerOdds).toFixed(2)}
									{/if}
								</div>
								<div class="mt-1 flex items-center gap-1 text-xs">
									{#if isFavored}
										<iconify-icon icon="mdi:arrow-up-bold" class="text-success-400"></iconify-icon>
										<span class="text-success-400">Attacker Favored</span>
									{:else if attackerWinChance < 50}
										<iconify-icon icon="mdi:arrow-down-bold" class="text-error-400"></iconify-icon>
										<span class="text-error-400">Defender Favored</span>
									{:else}
										<iconify-icon icon="mdi:equal" class="text-surface-400"></iconify-icon>
										<span class="text-surface-400">Even Match</span>
									{/if}
								</div>
								<div class="text-surface-600 mt-2 font-mono text-[10px]">
									{player.attack} vs {defendingPlayer.defense}
								</div>
							</div>

							<!-- Defender Stats -->
							<div
								class="border-secondary-500/20 from-secondary-500/10 rounded-lg border bg-gradient-to-br to-transparent p-3"
							>
								<div
									class="text-secondary-400 mb-2 flex items-center justify-end gap-2 text-xs tracking-widest uppercase"
								>
									<span>Defender</span>
									<iconify-icon icon="mdi:shield" width="12"></iconify-icon>
								</div>
								<div class="space-y-1.5">
									<div class="flex items-center justify-between text-sm">
										<span class="text-surface-400">Win Chance</span>
										<span class="text-secondary-300 font-bold">{defenderWinChance.toFixed(1)}%</span
										>
									</div>
									<div class="h-1.5 overflow-hidden rounded-full bg-black/30">
										<div
											class="from-secondary-400 to-secondary-600 h-full bg-gradient-to-r transition-all duration-500"
											style="width: {defenderWinChance}%"
										></div>
									</div>
									<div class="text-surface-500 flex items-center justify-between text-xs">
										<span>DEF Power</span>
										<span class="text-surface-300 font-mono">{defendingPlayer.defense}</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Divider -->
						<div
							class="via-surface-600 mx-8 mt-4 h-px bg-gradient-to-r from-transparent to-transparent"
						></div>

						<!-- Wheel Section - Side by side layout -->
						<div class="relative px-8 py-6">
							<SpinWheel
								items={[
									{ label: player.name, weight: player.attack },
									{ label: defendingPlayer.name, weight: defendingPlayer.defense }
								]}
								buttonText="FIGHT!"
								layout="side-by-side"
								{onWinner}
								showSpin={currentGame.value?.hasFought !== true}
								onSpin={() => {
									addAuditTrail(`${player.name} attacks ${defendingPlayer?.name}!`);
								}}
							></SpinWheel>
						</div>

						<!-- Winner Announcement -->
						{#if winningPlayer}
							<div class="relative px-8 pb-8">
								<div
									class="relative overflow-hidden rounded-lg border-2 p-6 text-center {winningPlayer.name ===
									player.name
										? 'border-primary-500/50 from-primary-500/20 to-primary-700/10 bg-gradient-to-br'
										: 'border-secondary-500/50 from-secondary-500/20 to-secondary-700/10 bg-gradient-to-br'}"
								>
									<!-- Confetti-like particles -->
									<div class="pointer-events-none absolute inset-0 overflow-hidden">
										<div
											class="bg-warning-400/60 absolute top-0 left-1/4 h-2 w-2 animate-bounce rounded-full"
											style="animation-delay: 0s;"
										></div>
										<div
											class="bg-primary-400/60 absolute top-2 right-1/4 h-1.5 w-1.5 animate-bounce rounded-full"
											style="animation-delay: 0.2s;"
										></div>
										<div
											class="bg-secondary-400/60 absolute top-1 left-1/2 h-2 w-2 animate-bounce rounded-full"
											style="animation-delay: 0.4s;"
										></div>
									</div>

									<div class="flex items-center justify-center gap-3">
										<iconify-icon
											icon="mdi:trophy"
											class="text-warning-400 text-4xl drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
										></iconify-icon>
										<div>
											<p class="text-warning-400 text-sm font-semibold tracking-widest uppercase">
												Victory
											</p>
											<p
												class="text-3xl font-black tracking-wide text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
											>
												{winningPlayer.name}
											</p>
										</div>
										<iconify-icon
											icon="mdi:trophy"
											class="text-warning-400 text-4xl drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
										></iconify-icon>
									</div>

									<p class="text-surface-400 mt-3 text-sm">
										{#if winningPlayer.name === player.name}
											<span class="text-primary-400">{player.name}</span> dealt damage to
											<span class="text-secondary-400">{defendingPlayer.name}</span>!
										{:else}
											<span class="text-secondary-400">{defendingPlayer.name}</span> defended
											against
											<span class="text-primary-400">{player.name}</span>!
										{/if}
									</p>
								</div>

								<button
									onclick={() => getCurrentAttackWindow()?.close()}
									class="border-surface-600 from-surface-800 to-surface-900 hover:border-surface-500 hover:from-surface-700 hover:to-surface-800 mt-4 w-full rounded-lg border bg-gradient-to-br px-6 py-3 font-bold tracking-wider text-white uppercase transition-all"
								>
									Continue Battle
								</button>
							</div>
						{/if}

						<!-- Bottom decorative bar -->
						<div
							class="via-secondary-500 absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent"
						></div>
					</div>
				{/key}
			{/key}
		{/if}
	</div>
</Portal>
