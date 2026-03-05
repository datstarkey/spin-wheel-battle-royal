<script lang="ts">
	import { getGameStore } from '$lib/stores/gameStore.svelte';
	import GameBoard from '$lib/components/board/GameBoard.svelte';
	import GameHistory from './GameHistory.svelte';
	import PlayerCard from './player/PlayerCard.svelte';
	import PlayerCardSmall from './player/PlayerCardSmall.svelte';
	import TurnBanner from './TurnBanner.svelte';
	import SpectatorStatus from './SpectatorStatus.svelte';

	const gs = getGameStore();

	let currentTurnPlayer = $derived(gs.game?.currentPlayer);

	// All players in turn order
	let allPlayers = $derived(gs.game ? Object.values(gs.game.playerOrder) : []);
</script>

<!-- Turn change notification -->
<TurnBanner />

<!-- Spectator activity status -->
<SpectatorStatus />

<!-- Game board as background layer (1:1 pixel mapping at 480x480) -->
<GameBoard />

<GameHistory />

{#if gs.game}
	{#if !gs.game.players}
		<p>No Players</p>
	{/if}

	<!-- UI overlay: Player cards float above the board (isolate prevents z-index trapping) -->
	<div class="pointer-events-none relative flex w-full gap-6">
		<!-- Left side: Current player's full card -->
		<div class="pointer-events-auto w-80 shrink-0">
			{#if currentTurnPlayer}
				<div class="sticky top-4">
					<div
						class="text-primary-400 mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase"
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
		<div class="pointer-events-auto isolate w-96 shrink-0">
			<div
				class="text-surface-400 mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase"
			>
				<iconify-icon icon="mdi:account-group" width="14"></iconify-icon>
				<span>Turn Order</span>
			</div>
			<div class="flex flex-col gap-2">
				{#each allPlayers as name (name)}
					{@const player = gs.getPlayerByName(name)}
					{#if player}
						<PlayerCardSmall {player} {currentTurnPlayer} />
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}
