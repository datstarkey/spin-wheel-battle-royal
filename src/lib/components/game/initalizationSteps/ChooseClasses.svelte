<script lang="ts">
	import SpinWheel from '$lib/components/wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '$lib/components/wheel/types';
	import { classSpinItems } from '$lib/components/wheel/utils';
	import { type ClassType } from '$lib/game/classes/classType';
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
	import toast from '$lib/stores/toaster.svelte';

	let order = $state(0);

	let spinningPlayer = $derived(currentGame.value?.playerOrder[order]);

	let results = $state<Record<number, string>>({});

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
	showSpin={Object.keys(results).length !== currentGame.value?.players.length}
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
			{#each Object.entries(results) as [order, name] (order)}
				{@const player = getPlayerByName(name)}
				{#if player}
					<tr>
						<td>{Number(order) + 1}</td>
						<td>{player.name}</td>
						<td>
						<span class="preset-filled chip flex items-center gap-1">
							{#if player.class.icon}
								<img src={player.class.icon} alt="" class="h-4 w-4" style="image-rendering: pixelated;" />
							{/if}
							{player.class.name}
						</span>
					</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
