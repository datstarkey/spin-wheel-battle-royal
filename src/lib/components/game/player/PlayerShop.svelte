<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import type { AllItems } from '$lib/game/items/itemTypes';
	import items from '$lib/game/items/itemTypes';
	import type { Player } from '$lib/game/player/player.svelte';
	import { getItemCost } from '$lib/stores/gameStore.svelte';

	interface Props {
		player: Player;
		open: boolean;
	}
	let { player, open = $bindable(false) }: Props = $props();

	let usableItems = $derived(Object.entries(items));
</script>

<PullOutMenu position="top" width="400px" bind:isOpen={open}>
	<div class="bg-surface top-0 z-10 border-b border-gray-200 p-2">
		<h1 class="font-bold">
			{player.name}'s Shop -
			<span class=" text-yellow-500">
				{player.gold}💰
			</span>
		</h1>
	</div>

	<div class="max-h-[85vh] space-y-4 overflow-y-auto p-2">
		{#each usableItems as [category, itemList]}
			<div>
				<h2 class="bg-surface top-12 z-10 mb-2 py-1 text-lg font-semibold capitalize">
					{category}
				</h2>
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each Object.entries(itemList) as [itemName, item]}
						{@const owned = player.inventoryCount(item.name)}
						<div
							class="bg-surface flex flex-col justify-between rounded-xl border border-surface-300 p-2 text-sm shadow-sm transition-colors hover:border-blue-400"
						>
							<div class="mb-1 flex items-center justify-between">
								<h3 class="flex-1 truncate text-sm font-medium">
									{item.name}

									{#if owned > 0}
										<span class="ml-1 text-sm font-bold text-yellow-600">{owned} owned</span>
									{/if}
								</h3>
								<span class="ml-1 text-sm font-bold text-yellow-600"
									>{getItemCost(itemName as AllItems)}💰</span
								>
							</div>

							{#if item.image}
								<img
									src={item.image}
									alt={item.name}
									class="mx-auto my-1 h-10 w-10 object-contain"
								/>
							{/if}

							<p class="mb-2 line-clamp-2 text-xs">{item.description}</p>

							<Button
								disabled={!player.canBuyItem(itemName as AllItems)}
								onclick={() => player.buyItem(itemName as AllItems)}
								class="w-full py-1 text-sm"
							>
								<Icon icon="mdi:cart" />
								Buy
							</Button>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</PullOutMenu>

<style>
	:global(.pull-out-menu-content) {
		max-height: 90vh;
		overflow-y: hidden;
	}
</style>
