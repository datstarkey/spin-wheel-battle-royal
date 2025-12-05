<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/forms/Input.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import { currentGame } from '$lib/stores/gameStore.svelte';
	import toast from '$lib/stores/toaster.svelte';

	let game = $derived(currentGame.value);
</script>

{#if game}
	<PullOutMenu position="bottom" width="400px">
		{#snippet trigger(open)}
			<Button onclick={open} icon="mdi:earth" class="btn-icon-sm" title="Global Game Stats"
			></Button>
		{/snippet}

		<div class="p-4">
			<h2 class="mb-4 text-xl font-bold">Global Game Stats</h2>

			<div class="space-y-4">
				<div>
					<h3 class="mb-2 text-lg font-semibold">Shop Modifiers</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<Input
								label="Item Cost Modifier"
								bind:value={game.shopCostModifier}
								type="number"
								min="0"
							/>
							<p class="text-surface-600 mt-1 text-xs">Added to all non-consumable items</p>
						</div>
						<div>
							<Input
								label="Consumable Cost Modifier"
								bind:value={game.shopConsumableCostModifier}
								type="number"
								min="0"
							/>
							<p class="text-surface-600 mt-1 text-xs">Added to all consumable items</p>
						</div>
					</div>
				</div>

				<div>
					<h3 class="mb-2 text-lg font-semibold">Combat Stats</h3>
					<div>
						<Input
							label="Global HP Reduction"
							bind:value={game.globalHpReduction}
							type="number"
							min="1"
						/>
						<p class="text-surface-600 mt-1 text-xs">Damage taken when losing an attack</p>
					</div>
				</div>

				<div>
					<h3 class="mb-2 text-lg font-semibold">Turn Management</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<Input
								label="Current Turn"
								bind:value={game.currentTurn}
								type="number"
								min="0"
								max={game.playerOrderLength - 1}
							/>
							<p class="text-surface-600 mt-1 text-xs">Current player index</p>
						</div>
						<div>
							<Input
								label="Skipped Next Turns"
								bind:value={game.skippedNextTurns}
								type="number"
								min="0"
							/>
							<p class="text-surface-600 mt-1 text-xs">Number of turns to skip</p>
						</div>
					</div>
				</div>

				<div class="mt-6 flex gap-2">
					<Button
						onclick={() => {
							game.shopCostModifier = 0;
							game.shopConsumableCostModifier = 0;
							toast.success('Shop modifiers reset!');
						}}
						class="preset-tonal-warning"
					>
						Reset Shop Modifiers
					</Button>

					<Button
						onclick={() => {
							game.globalHpReduction = 1;
							toast.success('Global HP reduction reset!');
						}}
						class="preset-tonal-warning"
					>
						Reset HP Reduction
					</Button>
				</div>
			</div>
		</div>
	</PullOutMenu>
{/if}
