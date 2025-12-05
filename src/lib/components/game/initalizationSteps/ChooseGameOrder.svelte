<script lang="ts">
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
	import SpinWheel from '../../wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '../../wheel/types';
	import { playerNameSpinItems } from '../../wheel/utils';
	import Button from '$lib/components/Button.svelte';

	let order = $state(0);
	let currentOrder = $state<Record<number, string>>({});
	// Initialize with player items on mount
	let spinWheelItems = $state<SpinWheelItem[]>(playerNameSpinItems());

	let maxPlayers = $derived(currentGame.value?.players.length || 0);
	let isComplete = $derived(Object.keys(currentOrder).length === maxPlayers && maxPlayers > 0);
	let remainingPlayers = $derived(maxPlayers - Object.keys(currentOrder).length);

	function onWinner(item: SpinWheelItem) {
		const player = getPlayerByName(item.label);
		if (!player) return;

		// Prevent duplicates
		const existingNames = Object.values(currentOrder);
		if (existingNames.includes(player.name)) {
			return;
		}

		currentOrder[order] = player.name;
		order++;

		// If only one player remains, auto-assign them to the last position
		if (Object.keys(currentOrder).length === maxPlayers - 1) {
			const assignedNames = Object.values(currentOrder);
			const remainingPlayer = currentGame.value?.players.find(
				(p) => !assignedNames.includes(p.name)
			);
			if (remainingPlayer) {
				currentOrder[order] = remainingPlayer.name;
				order++;
			}
		}

		// Auto-save when complete
		if (Object.keys(currentOrder).length === maxPlayers) {
			save();
		}
	}

	function save(): void {
		if (currentGame.value) {
			currentGame.value.playerOrder = { ...currentOrder };
		}
	}

	function handleReset() {
		spinWheelItems = playerNameSpinItems();
		currentOrder = {};
		order = 0;
		if (currentGame.value) {
			currentGame.value.playerOrder = {};
		}
	}
</script>

<div class="mb-5 flex items-center justify-between gap-3">
	<h2>Select Order</h2>
	{#if !isComplete}
		<p class="text-surface-400">{remainingPlayers} player{remainingPlayers !== 1 ? 's' : ''} remaining</p>
	{:else}
		<p class="text-success-500">Order complete!</p>
	{/if}
</div>

{#if spinWheelItems.length > 0 && !isComplete}
	<SpinWheel bind:items={spinWheelItems} removeOnWinner {onWinner} />
{:else if isComplete}
	<div class="mb-4 flex justify-center">
		<Button onclick={handleReset} class="preset-filled-warning">Reset Order</Button>
	</div>
{/if}

<div class="table-container">
	<table class="table">
		<thead>
			<tr>
				<th>Order</th>
				<th>Name</th>
			</tr>
		</thead>
		<tbody>
			{#each Object.entries(currentOrder) as [idx, name] (idx)}
				{@const player = getPlayerByName(name)}
				{#if player}
					<tr>
						<td>{Number(idx) + 1}</td>
						<td>{player.name}</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
