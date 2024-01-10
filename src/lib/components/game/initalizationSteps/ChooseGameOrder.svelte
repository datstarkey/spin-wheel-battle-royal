<script lang="ts">
	import type { Player } from '$lib/game/player';
	import { getPlayerByName, currentGame } from '$lib/stores/gameStore';
	import SpinWheel from '../../wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '../../wheel/types';
	import { playerNameSpinItems } from '../../wheel/utils';

	let order: number = 0;

	const currentOrder: Record<number, Player> = $currentGame?.playerOrder || {};

	$: maxPlayers = $currentGame?.players.length || 0;

	function onWinner(item: SpinWheelItem) {
		console.log(item);
		const player = getPlayerByName(item.label);
		if (player) {
			currentOrder[order] = player;
			order++;

			if (Object.keys(currentOrder).length == maxPlayers) {
				save();
			}
		}
	}

	function save(): void {
		if ($currentGame) $currentGame.playerOrder = currentOrder;
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
			{#each Object.entries(currentOrder) as [order, player]}
				<tr>
					<td>{Number(order) + 1}</td>
					<td>{player.name}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
