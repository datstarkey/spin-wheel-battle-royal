<script lang="ts">
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
	import PlayerCard from './player/PlayerCard.svelte';

	// import type { PageData } from './$types';

	// export let data: PageData;

	let currentTurnPlayer = $derived(currentGame.value?.currentPlayer);

	let isAttackWindowOpen = $state(false);
</script>

{#if currentGame.value}
	{#if !currentGame.value.players}
		<p>No Players</p>
	{/if}

	<h2 class="mb-5">Current Turn: {currentTurnPlayer?.name}</h2>

	<h3>Order</h3>
	<h3 class="mb-5">
		{#each Object.values(currentGame.value.playerOrder) as name}
			{@const player = getPlayerByName(name)}
			<span class={player?.name == currentTurnPlayer?.name ? 'text-success-500' : 'text-error-500'}>
				[{player?.name}]
			</span>
		{/each}
	</h3>

	<div class="flex flex-wrap gap-3">
		{#each currentGame.value.players as player}
			<PlayerCard {player} {currentTurnPlayer} bind:isAttackWindowOpen />
		{/each}
	</div>
{/if}
