<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore';
	import { onMount } from 'svelte';
	import AttackPlayer from './AttackPlayer.svelte';
	import Button from '../Button.svelte';

	// import type { PageData } from './$types';

	// export let data: PageData;

	$: currentTurnPlayer = $currentGame?.currentPlayer;

	onMount(() => {
		if (!$currentGame?.started) goto('/');
	});
</script>

{#if $currentGame}
	{#if !$currentGame.players}
		<p>No Players</p>
	{/if}

	<h2 class="mb-5">Current Turn: {currentTurnPlayer?.name}</h2>

	<h3>Order</h3>
	<h3 class="mb-5">
		{#each Object.values($currentGame.playerOrder) as name}
			{@const player = getPlayerByName(name)}
			<span class={player?.name == currentTurnPlayer?.name ? 'text-success-500' : 'text-error-500'}>
				[{player?.name}]
			</span>
		{/each}
	</h3>

	<div class="flex flex-wrap gap-3">
		{#each $currentGame.players as player}
			<div
				class="card variant-soft-secondary min-w-60 p-4 shadow"
				class:variant-soft-error={player.hp <= 0}
				class:variant-soft-success={player.hp > 0 && player.name == currentTurnPlayer?.name}
			>
				<div class="mb-5 flex flex-col items-center justify-center gap-2">
					<h3 class="text-center">
						{player.name}

						{#if player.hp <= 0}
							<span class="text-error-500">(DEAD)</span>
						{/if}
					</h3>
					<div class="variant-filled-primary badge text-center">
						{player.class.name}
					</div>
				</div>

				<div class="table-container mb-5" class:opacity-50={player.hp <= 0}>
					<table class="table font-bold">
						<tbody>
							<tr>
								<td class="text-center"
									><span class="variant-filled-success badge w-full">HP</span></td
								>
								<td>{player.hp}</td>
							</tr>

							<tr>
								<td class="text-center"
									><span class="variant-filled-primary badge w-full">Attack</span></td
								>
								<td>{player.attack}</td>
							</tr>

							<tr>
								<td class="text-center"
									><span class="variant-filled-secondary badge w-full">Defense</span></td
								>
								<td>{player.defense}</td>
							</tr>

							<tr>
								<td class="text-center"
									><span class="variant-filled-warning badge w-full">Gold</span></td
								>
								<td>{player.gold}</td>
							</tr>
						</tbody>
					</table>
				</div>

				{#if player.hp > 0 && player.name == currentTurnPlayer?.name}
					<AttackPlayer {player}></AttackPlayer>

					<Button class="mt-3 w-full" on:click={() => $currentGame?.finishTurn()}
						>Finish Turn</Button
					>
				{/if}
			</div>
		{/each}
	</div>
{/if}
