<script lang="ts">
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

	// Category icons mapping
	const categoryIcons: Record<string, string> = {
		mainHand: 'mdi:sword',
		offHand: 'mdi:shield-half-full',
		helm: 'game-icons:crested-helmet',
		chest: 'mdi:tshirt-crew',
		consumables: 'iconoir:consumable'
	};

	// Category colors mapping
	const categoryColors: Record<string, string> = {
		mainHand: 'primary',
		offHand: 'secondary',
		helm: 'tertiary',
		chest: 'warning',
		consumables: 'success'
	};
</script>

<PullOutMenu position="top" width="400px" bind:isOpen={open}>
	<!-- Header -->
	<div
		class="bg-surface-900/95 sticky top-0 z-20 border-b border-white/10 px-4 py-3 backdrop-blur-sm"
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-black/30"
				>
					<Icon icon="mdi:storefront" class="text-warning-400 text-xl" />
				</div>
				<div>
					<h1 class="text-surface-100 text-lg font-bold tracking-wide uppercase">
						{player.name}'s Shop
					</h1>
					<span class="text-surface-400 text-xs">Browse and purchase items</span>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div
					class="border-warning-500/30 from-warning-500/20 to-warning-400/10 flex items-center gap-2 rounded-sm border bg-gradient-to-br px-3 py-2"
				>
					<Icon icon="mdi:coin" class="text-warning-400" />
					<span class="text-warning-300 text-lg font-bold">{player.gold}</span>
					<span class="text-warning-500 text-xs font-semibold uppercase">Gold</span>
				</div>
				<button
					onclick={() => (open = false)}
					class="text-surface-300 hover:text-surface-100 hover:border-primary-500 flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-black/30 transition-all hover:bg-black/50"
					title="Close Shop"
				>
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>
		</div>
	</div>

	<!-- Shop Content -->
	<div class="max-h-[80vh] space-y-6 overflow-y-auto p-4">
		{#each usableItems as [category, itemList] (category)}
			{@const icon = categoryIcons[category] || 'mdi:cube-outline'}
			{@const color = categoryColors[category] || 'surface'}
			<div>
				<!-- Category Header -->
				<div class="mb-3 flex items-center gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-sm border border-white/10 bg-black/30"
					>
						<Icon {icon} class="text-{color}-400 text-sm" />
					</div>
					<h2 class="text-surface-100 text-sm font-bold tracking-widest uppercase">{category}</h2>
					<div class="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
				</div>

				<!-- Items Grid -->
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each Object.entries(itemList) as [itemName, item] (itemName)}
						{@const owned = player.inventoryCount(item.name)}
						{@const cost = getItemCost(itemName as AllItems)}
						{@const canAfford = player.canBuyItem(itemName as AllItems)}

						<div
							class="bg-surface-900/80 group relative flex flex-col rounded-sm border transition-all duration-200
								{canAfford
								? 'border-white/10 hover:border-warning-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]'
								: 'border-white/5 opacity-60'}"
						>
							<!-- Corner accents -->
							<div
								class="pointer-events-none absolute top-1 left-1 h-2 w-2 border-t border-l opacity-30 transition-opacity group-hover:opacity-60
									{canAfford ? 'border-warning-500' : 'border-surface-500'}"
							></div>
							<div
								class="pointer-events-none absolute top-1 right-1 h-2 w-2 border-t border-r opacity-30 transition-opacity group-hover:opacity-60
									{canAfford ? 'border-warning-500' : 'border-surface-500'}"
							></div>

							<!-- Item Content -->
							<div class="flex flex-1 flex-col p-2.5">
								<!-- Item Name & Owned Badge -->
								<div class="mb-1.5 flex items-start justify-between gap-1">
									<h3 class="text-surface-100 text-xs font-semibold leading-tight">{item.name}</h3>
									{#if owned > 0}
										<span
											class="border-success-500/30 bg-success-500/20 text-success-400 shrink-0 rounded-sm border px-1 py-0.5 text-[0.55rem] font-bold"
										>
											×{owned}
										</span>
									{/if}
								</div>

								<!-- Item Image -->
								{#if item.image}
									<div
										class="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-sm border border-white/5 bg-black/30"
									>
										<img
											src={item.image}
											alt={item.name}
											class="h-12 w-12 object-contain transition-transform group-hover:scale-110"
										/>
									</div>
								{:else}
									<div
										class="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-sm border border-white/5 bg-black/30"
									>
										<Icon {icon} class="text-surface-500 text-2xl" />
									</div>
								{/if}

								<!-- Description -->
								<p class="text-surface-400 mb-3 line-clamp-2 flex-1 text-[0.65rem] leading-relaxed">
									{item.description}
								</p>

								<!-- Price & Buy Button -->
								<div class="mt-auto flex items-center gap-2">
									<div class="flex items-center gap-1">
										<Icon icon="mdi:coin" class="text-warning-400 text-xs" />
										<span
											class="text-xs font-bold
											{canAfford ? 'text-warning-300' : 'text-error-400'}">{cost}</span
										>
									</div>
									<button
										disabled={!canAfford}
										onclick={() => player.buyItem(itemName as AllItems)}
										class="flex flex-1 items-center justify-center gap-1 rounded-sm border-none px-2 py-1.5 text-[0.6rem] font-bold tracking-widest uppercase transition-all
											{canAfford
											? 'from-warning-600 to-warning-700 hover:from-warning-500 hover:to-warning-600 bg-gradient-to-br text-white hover:-translate-y-px'
											: 'cursor-not-allowed bg-surface-700 text-surface-500'}"
									>
										<Icon icon="mdi:cart" class="text-xs" />
										Buy
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</PullOutMenu>
