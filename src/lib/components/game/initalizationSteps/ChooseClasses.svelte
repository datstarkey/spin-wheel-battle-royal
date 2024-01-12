<script lang="ts">
	import SpinWheel from '$lib/components/wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '$lib/components/wheel/types';
	import { classSpinItems } from '$lib/components/wheel/utils';
	import { type ClassType } from '$lib/game/classes/classType';
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore';
	import toast from 'svelte-french-toast';

	let order: number = 0;

	$: spinningPlayer = $currentGame?.playerOrder[order];

	const results: Record<number, string> = {};

	function onWinner(item: SpinWheelItem) {
		if (!spinningPlayer) {
			toast.error('Something went wrong could not find player ' + item.label);
			return;
		}
		const player = getPlayerByName(spinningPlayer);
		if (!player) {
			toast.error('Something went wrong could not find player ' + item.label);
			return;
		}

		player.assignClass(item.label as ClassType);
		results[order] = spinningPlayer;
		order++;
	}
</script>

<SpinWheel
	items={classSpinItems()}
	removeOnWinner
	{onWinner}
	showSpin={Object.keys(results).length !== $currentGame?.players.length}
>
	<h3 class="flex-auto">Up next: {spinningPlayer}</h3>
</SpinWheel>

<div class="table-container">
	<table class="table">
		<thead>
			<tr>
				<th>Order</th>
				<th>Name</th>
				<th>Class</th>
			</tr>
		</thead>
		<tbody>
			{#each Object.entries(results) as [order, name]}
				{@const player = getPlayerByName(name)}
				{#if player}
					<tr>
						<td>{Number(order) + 1}</td>
						<td>{player.name}</td>
						<td> <span class="variant-filled chip">{player.class.name}</span></td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
