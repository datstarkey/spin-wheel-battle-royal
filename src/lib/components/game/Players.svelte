<script lang="ts">
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
	import GameHistory from './GameHistory.svelte';
	import PlayerCard from './player/PlayerCard.svelte';
	import GlobalGameStats from './GlobalGameStats.svelte';

	// import type { PageData } from './$types';

	// export let data: PageData;

	let currentTurnPlayer = $derived(currentGame.value?.currentPlayer);

</script>

<GameHistory></GameHistory>
{#if currentGame.value}
	{#if !currentGame.value.players}
		<p>No Players</p>
	{/if}

	<div class="flex items-center justify-between mb-5">
		<h2>Current Turn: {currentTurnPlayer?.name}</h2>
		<GlobalGameStats />
	</div>

	<h3>Order</h3>
	<h3 class="mb-5">
		{#each Object.values(currentGame.value.playerOrder) as name}
			{@const player = getPlayerByName(name)}
			<span class={player?.name == currentTurnPlayer?.name ? 'text-success-500' : 'text-error-500'}>
				[{player?.name}]
			</span>
		{/each}
	</h3>

	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
		{#each Object.values(currentGame.value.playerOrder) as name (name)}
			{@const player = getPlayerByName(name)}
			{#if player}
				<PlayerCard {player} {currentTurnPlayer} />
			{/if}
		{/each}
	</div>
{/if}
