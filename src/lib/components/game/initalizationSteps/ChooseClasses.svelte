<script lang="ts">
	import SpinWheel from '$lib/components/wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '$lib/components/wheel/types';
	import { classSpinItems } from '$lib/components/wheel/utils';
	import { classMap, type ClassType } from '$lib/game/classType';
	import { Player } from '$lib/game/player';
	import { assignClassToPlayer, currentGame } from '$lib/stores/gameStore';

	let order: number = 0;

	$: spinningPlayer = $currentGame?.playerOrder[order] || new Player('');

	const results: Record<number, Player> = {};

	function onWinner(item: SpinWheelItem) {
		assignClassToPlayer(spinningPlayer.name, item.label as ClassType);
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
	<h3 class="flex-auto">Up next: {spinningPlayer.name}</h3>
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
			{#each Object.entries(results) as [order, player]}
				<tr>
					<td>{Number(order) + 1}</td>
					<td>{player.name}</td>
					<td> <span class="variant-filled chip">{classMap[player.class].name}</span></td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
