<script lang="ts">
	import { currentGame, getPlayerByName, syncPlayerPositionsToBoard } from '$lib/stores/gameStore.svelte';
	import GameBoard from '$lib/components/board/GameBoard.svelte';
	import GameHistory from './GameHistory.svelte';
	import PlayerCard from './player/PlayerCard.svelte';
	import PlayerCardSmall from './player/PlayerCardSmall.svelte';

	let currentTurnPlayer = $derived(currentGame.value?.currentPlayer);

	// All players in turn order
	let allPlayers = $derived(
		currentGame.value ? Object.values(currentGame.value.playerOrder) : []
	);

	// Sync player positions to the game board when the component mounts or game changes
	$effect(() => {
		if (currentGame.value?.started) {
			syncPlayerPositionsToBoard();
		}
	});
</script>

<!-- Game board as background layer (1:1 pixel mapping at 480x480) -->
<GameBoard />

<GameHistory />

{#if currentGame.value}
	{#if !currentGame.value.players}
		<p>No Players</p>
	{/if}

	<!-- UI overlay: Player cards float above the board (isolate prevents z-index trapping) -->
	<div class="pointer-events-none relative flex w-full gap-6">
		<!-- Left side: Current player's full card -->
		<div class="pointer-events-auto w-80 shrink-0">
			{#if currentTurnPlayer}
				<div class="sticky top-4">
					<div
						class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-400"
					>
						<iconify-icon icon="mdi:sword-cross" width="14"></iconify-icon>
						<span>Active Turn</span>
					</div>
					<PlayerCard player={currentTurnPlayer} {currentTurnPlayer} />
				</div>
			{/if}
		</div>

		<!-- Center: Spacer for board visibility -->
		<div class="flex-1">
			<!-- Board is visible through here -->
		</div>

		<!-- Right side: All players in turn order (isolate creates new stacking context) -->
		<div class="pointer-events-auto w-96 shrink-0 isolate">
			<div
				class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-surface-400"
			>
				<iconify-icon icon="mdi:account-group" width="14"></iconify-icon>
				<span>Turn Order</span>
			</div>
			<div class="flex flex-col gap-2">
				{#each allPlayers as name (name)}
					{@const player = getPlayerByName(name)}
					{#if player}
						<PlayerCardSmall {player} {currentTurnPlayer} />
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}
