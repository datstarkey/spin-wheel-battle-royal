<script lang="ts">
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
	import SpinWheel from '../../wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '../../wheel/types';
	import { playerNameSpinItems } from '../../wheel/utils';

	let order = $state(0);

	let currentOrder = $state<Record<number, string>>(currentGame.value?.playerOrder || {});

	let maxPlayers = $derived(currentGame.value?.players.length || 0);

	function onWinner(item: SpinWheelItem) {
		const player = getPlayerByName(item.label);
		if (player) {
			currentOrder[order] = player.name;
			order++;

			if (Object.keys(currentOrder).length == maxPlayers) {
				save();
			}
		}
	}

	function save(): void {
		if (currentGame.value) currentGame.value.playerOrder = currentOrder;
	}
</script>

<h2 class="mb-5">Select Order</h2>

<SpinWheel items={playerNameSpinItems()} removeOnWinner {onWinner}></SpinWheel>

<div class="table-container">
	<table class="table">
		<thead>
			<tr>
				<th>Order</th>
				<th>Name</th>
			</tr>
		</thead>
		<tbody>
			{#each Object.entries(currentOrder) as [order, name]}
				{@const player = getPlayerByName(name)}
				{#if player}
					<tr>
						<td>{Number(order) + 1}</td>
						<td>{player.name}</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
