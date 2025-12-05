<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import { currentGame, getPlayerByName, addAuditTrail } from '$lib/stores/gameStore.svelte';
	import toast from '$lib/stores/toaster.svelte';
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	let game = $derived(currentGame.value);

	// Get current player name from turn order
	let currentPlayerName = $derived(game ? game.playerOrder[game.currentTurn] : null);

	// All players in turn order for the dropdown
	let playersInOrder = $derived(
		game ? Object.entries(game.playerOrder).sort(([a], [b]) => Number(a) - Number(b)).map(([_, name]) => name) : []
	);

	// Set current turn by player name
	function setCurrentTurnByPlayer(playerName: string) {
		if (!game) return;
		const turnIndex = Object.entries(game.playerOrder).find(([_, name]) => name === playerName)?.[0];
		if (turnIndex !== undefined) {
			game.currentTurn = Number(turnIndex);
			addAuditTrail(`Turn manually set to ${playerName}`);
		}
	}

	// Add player to skipped turns
	function addSkippedPlayer(playerName: string) {
		if (!game) return;
		if (!game.skippedNextTurns.includes(playerName)) {
			game.skippedNextTurns = [...game.skippedNextTurns, playerName];
			addAuditTrail(`${playerName}'s next turn will be skipped`);
		}
	}

	// Remove player from skipped turns
	function removeSkippedPlayer(playerName: string) {
		if (!game) return;
		game.skippedNextTurns = game.skippedNextTurns.filter((name) => name !== playerName);
		toast.success(`${playerName} removed from skip list`);
	}

	// Players available to skip (not already in skip list)
	let availableToSkip = $derived(
		playersInOrder.filter((name) => !game?.skippedNextTurns.includes(name))
	);

	let selectedPlayerToSkip = $state<string>('');
</script>

{#snippet stepper(
	value: number,
	onChange: (val: number) => void,
	icon: string,
	label: string,
	colorClass: string,
	min?: number,
	step?: number
)}
	{@const actualStep = step ?? 1}
	<div class="group relative overflow-hidden rounded border border-white/10 bg-black/30 transition-all hover:border-white/20">
		<div class="flex items-center">
			<button
				type="button"
				class="flex h-10 w-10 items-center justify-center border-r border-white/10 text-surface-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
				onclick={() => onChange(min !== undefined ? Math.max(min, value - actualStep) : value - actualStep)}
			>
				<Icon icon="mdi:minus" />
			</button>
			<div class="flex flex-1 flex-col items-center justify-center px-3 py-1.5">
				<div class="flex items-center gap-1.5">
					<Icon {icon} class="{colorClass} text-sm" />
					<span class="text-surface-100 text-lg font-bold tabular-nums">{value}</span>
				</div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">{label}</span>
			</div>
			<button
				type="button"
				class="flex h-10 w-10 items-center justify-center border-l border-white/10 text-surface-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
				onclick={() => onChange(value + actualStep)}
			>
				<Icon icon="mdi:plus" />
			</button>
		</div>
	</div>
{/snippet}

{#if game}
	<PullOutMenu position="bottom" width="500px">
		{#snippet trigger(open)}
			<Button onclick={open} icon="mdi:earth" class="btn-icon-sm" title="Global Game Stats"></Button>
		{/snippet}

		<!-- Header -->
		<div class="mb-6 flex items-center gap-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-tertiary-500/50 bg-linear-to-br from-tertiary-500/20 to-tertiary-700/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
				<Icon icon="mdi:earth" class="text-2xl text-tertiary-400" />
			</div>
			<div>
				<h1 class="text-surface-100 text-xl font-black tracking-wide uppercase">Game Settings</h1>
				<span class="text-surface-500 text-xs font-semibold tracking-widest uppercase">Global game modifiers</span>
			</div>
		</div>

		<div class="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
			<!-- Divider: Turn Management -->
			<div class="flex items-center gap-3">
				<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">Turn Management</span>
				<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
			</div>

			<!-- Current Player Selector -->
			<div class="rounded border border-white/10 bg-black/20 p-3">
				<label class="block">
					<div class="text-surface-400 mb-2 flex items-center gap-2 text-[0.65rem] font-semibold tracking-widest uppercase">
						<Icon icon="mdi:account-clock" class="text-xs text-primary-400" />
						<span>Current Turn</span>
					</div>
					<select
						class="select w-full"
						value={currentPlayerName ?? ''}
						onchange={(e) => setCurrentTurnByPlayer(e.currentTarget.value)}
					>
						{#each playersInOrder as playerName, index (playerName)}
							{@const player = getPlayerByName(playerName)}
							<option value={playerName} disabled={player?.dead}>
								{index + 1}. {playerName} {player?.dead ? '(Dead)' : ''} {player?.inShadowRealm ? '👻' : ''}
							</option>
						{/each}
					</select>
					<p class="text-surface-600 mt-1 text-xs">Select which player's turn it is</p>
				</label>
			</div>

			<!-- Turn Actions -->
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded border border-white/10 bg-black/20 p-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Icon icon="ion:footsteps" class="text-success-400" />
							<span class="text-surface-300 text-sm">Has Moved</span>
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
							<span class="text-surface-300 text-sm">Has Fought</span>
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
			</div>

			<!-- Skipped Turns -->
			<div class="rounded border border-white/10 bg-black/20 p-3">
				<div class="text-surface-400 mb-2 flex items-center gap-2 text-[0.65rem] font-semibold tracking-widest uppercase">
					<Icon icon="mdi:skip-next" class="text-xs text-warning-400" />
					<span>Skipped Next Turns</span>
				</div>

				{#if game.skippedNextTurns.length > 0}
					<div class="mb-2 flex flex-wrap gap-1">
						{#each game.skippedNextTurns as playerName (playerName)}
							<div class="flex items-center gap-1.5 rounded border border-warning-500/30 bg-warning-500/10 px-2 py-1">
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
					<p class="text-surface-600 mb-2 text-xs italic">No players will have their turn skipped</p>
				{/if}

				<div class="flex gap-1">
					<select
						class="select flex-1 text-xs"
						bind:value={selectedPlayerToSkip}
					>
						<option value="">+ Skip a player's next turn</option>
						{#each availableToSkip as playerName (playerName)}
							<option value={playerName}>{playerName}</option>
						{/each}
					</select>
					<button
						type="button"
						class="rounded border border-white/10 bg-black/30 px-3 text-surface-400 transition-all hover:border-warning-500/50 hover:bg-warning-500/20 hover:text-white disabled:opacity-30"
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
				<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">Combat</span>
				<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
			</div>

			<!-- Global HP Reduction -->
			<div class="grid grid-cols-1 gap-3">
				{@render stepper(
					game.globalHpReduction,
					(val) => {
						game.globalHpReduction = val;
						addAuditTrail(`Global HP reduction set to ${val}`);
					},
					'mdi:heart-broken',
					'HP Reduction',
					'text-error-400',
					1
				)}
				<p class="text-surface-600 -mt-2 text-center text-xs">Damage dealt when losing an attack</p>
			</div>

			<!-- Divider: Economy -->
			<div class="flex items-center gap-3">
				<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">Economy</span>
				<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
			</div>

			<!-- Shop Modifiers -->
			<div class="grid grid-cols-2 gap-3">
				{@render stepper(
					game.shopCostModifier,
					(val) => (game.shopCostModifier = val),
					'mdi:store',
					'Item Cost +',
					'text-warning-400',
					0
				)}
				{@render stepper(
					game.shopConsumableCostModifier,
					(val) => (game.shopConsumableCostModifier = val),
					'iconoir:consumable',
					'Consumable +',
					'text-success-400',
					0
				)}
			</div>
			<p class="text-surface-600 -mt-2 text-center text-xs">Added to base item costs in shop</p>

			<!-- Quick Actions -->
			<div class="flex items-center gap-3 pt-2">
				<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">Quick Actions</span>
				<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
			</div>

			<div class="flex flex-wrap gap-2">
				<Button
					onclick={() => {
						game.resetTurnActions();
						toast.success('Turn actions reset!');
					}}
					class="preset-tonal-success text-xs"
					icon="mdi:refresh"
				>
					Reset Turn Actions
				</Button>

				<Button
					onclick={() => {
						game.shopCostModifier = 0;
						game.shopConsumableCostModifier = 0;
						toast.success('Shop modifiers reset!');
					}}
					class="preset-tonal-warning text-xs"
					icon="mdi:store-remove"
				>
					Reset Shop Costs
				</Button>

				<Button
					onclick={() => {
						game.globalHpReduction = 1;
						toast.success('HP reduction reset to 1!');
					}}
					class="preset-tonal-error text-xs"
					icon="mdi:heart"
				>
					Reset HP Reduction
				</Button>

				<Button
					onclick={() => {
						game.skippedNextTurns = [];
						toast.success('Skipped turns cleared!');
					}}
					class="preset-tonal-surface text-xs"
					icon="mdi:skip-next-outline"
				>
					Clear Skipped Turns
				</Button>
			</div>
		</div>
	</PullOutMenu>
{/if}
