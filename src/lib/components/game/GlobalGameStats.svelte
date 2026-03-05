<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import { getGameStore } from '$lib/stores/gameStore.svelte';
	import toast from '$lib/stores/toaster.svelte';
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	const gs = getGameStore();
	let game = $derived(gs.game);

	// Get current player name from turn order
	let currentPlayerName = $derived(game ? game.playerOrder[game.currentTurn] : null);

	// All players in turn order for the dropdown
	let playersInOrder = $derived(
		game
			? Object.entries(game.playerOrder)
					.sort(([a], [b]) => Number(a) - Number(b))
					.map(([, name]) => name)
			: []
	);

	// Set current turn by player name
	function setCurrentTurnByPlayer(playerName: string) {
		if (!game) return;
		const turnIndex = Object.entries(game.playerOrder).find(([, name]) => name === playerName)?.[0];
		if (turnIndex !== undefined) {
			game.currentTurn = Number(turnIndex);
			gs.addAuditTrail(`Turn manually set to ${playerName}`);
		}
	}

	// Add player to skipped turns
	function addSkippedPlayer(playerName: string) {
		if (!game) return;
		if (!game.skippedNextTurns.has(playerName)) {
			game.skippedNextTurns.add(playerName);
			gs.addAuditTrail(`${playerName}'s next turn will be skipped`);
		}
	}

	// Remove player from skipped turns
	function removeSkippedPlayer(playerName: string) {
		if (!game) return;
		game.skippedNextTurns.delete(playerName);
		toast.success(`${playerName} removed from skip list`);
	}

	// Players available to skip (not already in skip list)
	let availableToSkip = $derived(
		playersInOrder.filter((name) => !game?.skippedNextTurns.has(name))
	);

	let selectedPlayerToSkip = $state<string>('');
</script>

{#if game}
	<PullOutMenu position="right" width="500px">
		{#snippet trigger(open)}
			<Button onclick={open} icon="mdi:earth" class="btn-icon-sm" title="Global Game Stats"
			></Button>
		{/snippet}

		<!-- Header -->
		<div class="mb-6 flex items-center gap-4">
			<div
				class="border-tertiary-500/50 from-tertiary-500/20 to-tertiary-700/20 flex h-12 w-12 items-center justify-center rounded-lg border-2 bg-linear-to-br shadow-[0_0_20px_rgba(139,92,246,0.2)]"
			>
				<Icon icon="mdi:earth" class="text-tertiary-400 text-2xl" />
			</div>
			<div>
				<h1 class="text-surface-100 text-xl font-black tracking-wide uppercase">Game Settings</h1>
				<span class="text-surface-500 text-xs font-semibold tracking-widest uppercase"
					>Global game modifiers</span
				>
			</div>
		</div>

		<div class="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
			<!-- Divider: Turn Management -->
			<div class="flex items-center gap-3">
				<div
					class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"
				></div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
					>Turn Management</span
				>
				<div
					class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"
				></div>
			</div>

			<!-- Current Player Selector -->
			<div class="rounded border border-white/10 bg-black/20 p-3">
				<label class="block">
					<div
						class="text-surface-400 mb-2 flex items-center gap-2 text-[0.65rem] font-semibold tracking-widest uppercase"
					>
						<Icon icon="mdi:account-clock" class="text-primary-400 text-xs" />
						<span>Current Turn</span>
					</div>
					<select
						class="select w-full"
						value={currentPlayerName ?? ''}
						onchange={(e) => setCurrentTurnByPlayer(e.currentTarget.value)}
					>
						{#each playersInOrder as playerName, index (playerName)}
							{@const player = gs.getPlayerByName(playerName)}
							<option value={playerName} disabled={player?.dead}>
								{index + 1}. {playerName}
								{player?.dead ? '(Dead)' : ''}
								{player?.inShadowRealm ? '👻' : ''}
							</option>
						{/each}
					</select>
					<p class="text-surface-600 mt-1 text-xs">Select which player's turn it is</p>
				</label>
			</div>

			<!-- Global Round Counter -->
			<div class="grid grid-cols-1 gap-3">
				<Stepper
					value={game.globalTurnCount}
					onChange={(val) => {
						game.globalTurnCount = val;
						gs.addAuditTrail(
							`Global round count set to ${val} (movement bonus: +${game.globalMovementBonus})`
						);
					}}
					icon="mdi:rotate-right"
					label="Round"
					colorClass="text-secondary-400"
					min={0}
				/>
				<p class="text-surface-600 -mt-2 text-center text-xs">
					Every 5 rounds: +1 movement for all players (current: +{game.globalMovementBonus}, max +4)
				</p>
			</div>

			<!-- Turn Actions -->
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded border border-white/10 bg-black/20 p-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Icon icon="ion:footsteps" class="text-success-400" />
							<span class="text-surface-300 text-sm">Moved</span>
						</div>
						<Switch
							checked={game.hasMoved}
							onCheckedChange={(details) => (game.hasMoved = details.checked)}
						>
							<Switch.Control class="data-[state=checked]:bg-success-500">
								<Switch.Thumb />
							</Switch.Control>
							<Switch.HiddenInput />
						</Switch>
					</div>
				</div>
				<div class="rounded border border-white/10 bg-black/20 p-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Icon icon="mdi:sword-cross" class="text-primary-400" />
							<span class="text-surface-300 text-sm">Fought</span>
						</div>
						<Switch
							checked={game.hasFought}
							onCheckedChange={(details) => (game.hasFought = details.checked)}
						>
							<Switch.Control class="data-[state=checked]:bg-primary-500">
								<Switch.Thumb />
							</Switch.Control>
							<Switch.HiddenInput />
						</Switch>
					</div>
				</div>
				<div class="rounded border border-white/10 bg-black/20 p-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Icon icon="mdi:cart" class="text-warning-400" />
							<span class="text-surface-300 text-sm">Shopped</span>
						</div>
						<Switch
							checked={game.hasShopped}
							onCheckedChange={(details) => (game.hasShopped = details.checked)}
						>
							<Switch.Control class="data-[state=checked]:bg-warning-500">
								<Switch.Thumb />
							</Switch.Control>
							<Switch.HiddenInput />
						</Switch>
					</div>
				</div>
				<div class="rounded border border-white/10 bg-black/20 p-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Icon icon="mdi:slot-machine" class="text-tertiary-400" />
							<span class="text-surface-300 text-sm">Casino</span>
						</div>
						<Switch
							checked={game.hasUsedCasino}
							onCheckedChange={(details) => (game.hasUsedCasino = details.checked)}
						>
							<Switch.Control class="data-[state=checked]:bg-tertiary-500">
								<Switch.Thumb />
							</Switch.Control>
							<Switch.HiddenInput />
						</Switch>
					</div>
				</div>
			</div>

			<!-- Skipped Turns -->
			<div class="rounded border border-white/10 bg-black/20 p-3">
				<div
					class="text-surface-400 mb-2 flex items-center gap-2 text-[0.65rem] font-semibold tracking-widest uppercase"
				>
					<Icon icon="mdi:skip-next" class="text-warning-400 text-xs" />
					<span>Skipped Next Turns</span>
				</div>

				{#if game.skippedNextTurns.size > 0}
					<div class="mb-2 flex flex-wrap gap-1">
						{#each game.skippedNextTurns as playerName (playerName)}
							<div
								class="border-warning-500/30 bg-warning-500/10 flex items-center gap-1.5 rounded border px-2 py-1"
							>
								<span class="text-warning-400 text-xs">{playerName}</span>
								<button
									type="button"
									class="text-surface-500 hover:text-error-400 transition-colors"
									onclick={() => removeSkippedPlayer(playerName)}
								>
									<Icon icon="mdi:close" class="text-xs" />
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-surface-600 mb-2 text-xs italic">
						No players will have their turn skipped
					</p>
				{/if}

				<div class="flex gap-1">
					<select class="select flex-1 text-xs" bind:value={selectedPlayerToSkip}>
						<option value="">+ Skip a player's next turn</option>
						{#each availableToSkip as playerName (playerName)}
							<option value={playerName}>{playerName}</option>
						{/each}
					</select>
					<button
						type="button"
						class="text-surface-400 hover:border-warning-500/50 hover:bg-warning-500/20 rounded border border-white/10 bg-black/30 px-3 transition-all hover:text-white disabled:opacity-30"
						disabled={!selectedPlayerToSkip}
						onclick={() => {
							addSkippedPlayer(selectedPlayerToSkip);
							selectedPlayerToSkip = '';
						}}
					>
						<Icon icon="mdi:plus" />
					</button>
				</div>
			</div>

			<!-- Divider: Combat -->
			<div class="flex items-center gap-3">
				<div
					class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"
				></div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
					>Combat</span
				>
				<div
					class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"
				></div>
			</div>

			<!-- Global HP Reduction -->
			<div class="grid grid-cols-1 gap-3">
				<Stepper
					value={game.globalHpReduction}
					onChange={(val) => {
						game.globalHpReduction = val;
						gs.addAuditTrail(`Global HP reduction set to ${val}`);
					}}
					icon="mdi:heart-broken"
					label="HP Reduction"
					colorClass="text-error-400"
					min={1}
				/>
				<p class="text-surface-600 -mt-2 text-center text-xs">Damage dealt when losing an attack</p>
			</div>

			<!-- Divider: Economy -->
			<div class="flex items-center gap-3">
				<div
					class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"
				></div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
					>Economy</span
				>
				<div
					class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"
				></div>
			</div>

			<!-- Shop Items -->
			<div class="rounded border border-white/10 bg-black/20 p-3">
				<div
					class="text-surface-400 mb-2 flex items-center gap-2 text-[0.65rem] font-semibold tracking-widest uppercase"
				>
					<Icon icon="mdi:store" class="text-warning-400 text-xs" />
					<span>Shop Items</span>
				</div>
				<div class="flex items-center gap-2">
					<div
						class="border-warning-500/30 bg-warning-500/10 flex-1 rounded border px-3 py-2 text-center"
					>
						<span class="text-warning-400 font-semibold">{game.shopItems.length} items</span>
					</div>
					<button
						type="button"
						class="btn preset-tonal-warning flex items-center gap-1.5 text-xs"
						onclick={() => {
							game.randomizeShopItems();
							gs.addAuditTrail(`Shop items randomized`);
							toast.success(`Shop items refreshed`);
						}}
					>
						<Icon icon="mdi:dice-multiple" />
						<span>Randomize</span>
					</button>
				</div>
			</div>

			<!-- Shop Reroll Cost -->
			<div class="grid grid-cols-1 gap-3">
				<Stepper
					value={game.shopRerollCost}
					onChange={(val) => {
						game.shopRerollCost = val;
						gs.addAuditTrail(`Shop reroll cost set to ${val}g`);
					}}
					icon="mdi:refresh"
					label="Reroll Cost"
					colorClass="text-warning-400"
					min={1}
				/>
				<p class="text-surface-600 -mt-2 text-center text-xs">
					Gold cost for players to reroll shop category
				</p>
			</div>

			<!-- Shop Modifiers -->
			<div class="grid grid-cols-2 gap-3">
				<Stepper
					value={game.shopCostModifier}
					onChange={(val) => (game.shopCostModifier = val)}
					icon="mdi:store"
					label="Item Cost +"
					colorClass="text-warning-400"
					min={0}
				/>
				<Stepper
					value={game.shopConsumableCostModifier}
					onChange={(val) => (game.shopConsumableCostModifier = val)}
					icon="iconoir:consumable"
					label="Consumable +"
					colorClass="text-success-400"
					min={0}
				/>
			</div>
			<p class="text-surface-600 -mt-2 text-center text-xs">Added to base item costs in shop</p>

			<!-- Quick Actions -->
			<div class="flex items-center gap-3 pt-2">
				<div
					class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"
				></div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
					>Quick Actions</span
				>
				<div
					class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"
				></div>
			</div>

			<div class="grid grid-cols-2 gap-2">
				<button
					type="button"
					class="btn preset-tonal-success flex items-center justify-center gap-2 text-xs"
					onclick={() => {
						game.resetTurnActions();
						toast.success('Turn actions reset!');
					}}
				>
					<Icon icon="mdi:refresh" />
					<span>Reset Turn Actions</span>
				</button>

				<button
					type="button"
					class="btn preset-tonal-warning flex items-center justify-center gap-2 text-xs"
					onclick={() => {
						game.shopCostModifier = 0;
						game.shopConsumableCostModifier = 0;
						toast.success('Shop modifiers reset!');
					}}
				>
					<Icon icon="mdi:store-remove" />
					<span>Reset Shop Costs</span>
				</button>

				<button
					type="button"
					class="btn preset-tonal-error flex items-center justify-center gap-2 text-xs"
					onclick={() => {
						game.globalHpReduction = 1;
						toast.success('HP reduction reset to 1!');
					}}
				>
					<Icon icon="mdi:heart" />
					<span>Reset HP Reduction</span>
				</button>

				<button
					type="button"
					class="btn preset-tonal-surface flex items-center justify-center gap-2 text-xs"
					onclick={() => {
						game.skippedNextTurns.clear();
						toast.success('Skipped turns cleared!');
					}}
				>
					<Icon icon="mdi:skip-next-outline" />
					<span>Clear Skipped Turns</span>
				</button>
			</div>
		</div>
	</PullOutMenu>
{/if}
