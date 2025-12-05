<script lang="ts">
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
	import GameHistory from './GameHistory.svelte';
	import PlayerCard from './player/PlayerCard.svelte';
	import PlayerCardSmall from './player/PlayerCardSmall.svelte';

	let currentTurnPlayer = $derived(currentGame.value?.currentPlayer);

	// All players in turn order
	let allPlayers = $derived(
		currentGame.value ? Object.values(currentGame.value.playerOrder) : []
	);
</script>

<GameHistory />

{#if currentGame.value}
	{#if !currentGame.value.players}
		<p>No Players</p>
	{/if}

	<!-- Main game layout: Current player left, all players right sidebar -->
	<div class="flex w-full gap-6">
		<!-- Left side: Current player's full card -->
		<div class="w-80 shrink-0">
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

		<!-- Center: Future game board area -->
		<div class="flex-1">
			<!-- Game board will go here -->
		</div>

		<!-- Right side: All players in turn order -->
		<div class="w-96 shrink-0">
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
