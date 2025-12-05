<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import type { AllItems, Item } from '$lib/game/items/itemTypes';
	import items from '$lib/game/items/itemTypes';
	import type { Player } from '$lib/game/player/player.svelte';
	import { getItemCost } from '$lib/stores/gameStore.svelte';

	interface Props {
		player: Player;
		open: boolean;
	}
	let { player, open = $bindable(false) }: Props = $props();

	// Category configuration
	const categories = [
		{ key: 'mainhand', label: 'Weapons', icon: 'mdi:sword', color: 'primary' },
		{ key: 'offHand', label: 'Off-Hand', icon: 'mdi:shield-half-full', color: 'secondary' },
		{ key: 'helm', label: 'Headgear', icon: 'game-icons:crested-helmet', color: 'tertiary' },
		{ key: 'chest', label: 'Armor', icon: 'mdi:tshirt-crew', color: 'warning' },
		{ key: 'consumables', label: 'Consumables', icon: 'mdi:flask', color: 'success' }
	] as const;

	let activeCategory = $state<string>('mainhand');
	let hoveredItem = $state<string | null>(null);

	// Get items for active category
	let activeItems = $derived(
		Object.entries(items[activeCategory as keyof typeof items] || {}) as [string, Item][]
	);

	// Stats that items can modify
	const statIcons: Record<string, { icon: string; color: string; label: string }> = {
		attack: { icon: 'mdi:sword', color: 'primary', label: 'ATK' },
		defense: { icon: 'mdi:shield', color: 'secondary', label: 'DEF' },
		hp: { icon: 'mdi:heart', color: 'error', label: 'HP' },
		movement: { icon: 'mdi:run-fast', color: 'success', label: 'MOV' },
		gold: { icon: 'mdi:coin', color: 'warning', label: 'GOLD' }
	};

	// Parse description for stat bonuses (simple heuristic)
	function parseStats(description: string): { stat: string; value: string }[] {
		const stats: { stat: string; value: string }[] = [];
		const patterns = [
			{ regex: /attack\s*\+?\s*(\d+)/i, stat: 'attack' },
			{ regex: /defense\s*\+?\s*(\d+)/i, stat: 'defense' },
			{ regex: /hp\s*\+?\s*(\d+)/i, stat: 'hp' },
			{ regex: /heals?\s*(\d+)\s*hp/i, stat: 'hp' },
			{ regex: /movement\s*\+?\s*(\d+)/i, stat: 'movement' },
			{ regex: /\+(\d+)\s*attack/i, stat: 'attack' },
			{ regex: /\+(\d+)\s*defense/i, stat: 'defense' },
			{ regex: /\+(\d+)\s*hp/i, stat: 'hp' },
			{ regex: /\+(\d+)\s*movement/i, stat: 'movement' }
		];
		for (const { regex, stat } of patterns) {
			const match = description.match(regex);
			if (match) {
				stats.push({ stat, value: `+${match[1]}` });
			}
		}
		return stats;
	}
</script>

<PullOutMenu position="left" width="900px" bind:isOpen={open} hideCloseButton>
	<div class="flex h-full max-h-screen flex-col bg-black/40">
		<!-- Armory Header -->
		<header class="relative border-b border-surface-500/20 bg-surface-950/80 px-6 py-4">
			<!-- Scanline effect -->
			<div
				class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]"
			></div>

			<div class="relative flex items-center justify-between">
				<!-- Title Section -->
				<div class="flex items-center gap-4">
					<div
						class="relative flex h-12 w-12 items-center justify-center border border-warning-500/30 bg-gradient-to-br from-warning-500/20 to-transparent"
					>
						<Icon icon="mdi:cash-register" class="text-2xl text-warning-400" />
						<div
							class="absolute -top-px -left-px h-2 w-2 border-t border-l border-warning-400"
						></div>
						<div
							class="absolute -top-px -right-px h-2 w-2 border-t border-r border-warning-400"
						></div>
						<div
							class="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-warning-400"
						></div>
						<div
							class="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-warning-400"
						></div>
					</div>
					<div>
						<div class="flex items-center gap-2">
							<span class="text-[0.65rem] font-bold tracking-[0.3em] text-warning-500/80"
								>SHOP</span
							>
							<span class="text-surface-600">|</span>
							<span class="text-[0.65rem] tracking-widest text-surface-400">EQUIPMENT & ITEMS</span>
						</div>
						<h1 class="text-xl font-black uppercase tracking-wide text-surface-100">
							{player.name}
						</h1>
					</div>
				</div>

				<!-- Gold Display -->
				<div class="flex items-center gap-4">
					<div class="text-right">
						<div class="text-[0.6rem] font-semibold tracking-[0.2em] text-surface-500">
							AVAILABLE CREDITS
						</div>
						<div class="flex items-center justify-end gap-2">
							<Icon icon="mdi:coin" class="text-xl text-warning-400" />
							<span class="font-mono text-3xl font-black text-warning-300">{player.gold}</span>
						</div>
					</div>
					<button
						onclick={() => (open = false)}
						class="flex h-10 w-10 items-center justify-center border border-surface-600 bg-surface-900/50 text-surface-400 transition-all hover:border-primary-500 hover:bg-primary-500/10 hover:text-primary-400"
						title="Close Shop"
					>
						<Icon icon="mdi:close" class="text-lg" />
					</button>
				</div>
			</div>
		</header>

		<!-- Category Navigation -->
		<nav class="border-b border-surface-500/20 bg-surface-900/60 px-4">
			<div class="flex">
				{#each categories as cat (cat.key)}
					{@const isActive = activeCategory === cat.key}
					{@const itemCount = Object.keys(items[cat.key as keyof typeof items] || {}).length}
					<button
						onclick={() => (activeCategory = cat.key)}
						class="group relative flex items-center gap-2 px-5 py-3 transition-all
							{isActive
							? 'bg-surface-800/80 text-surface-100'
							: 'text-surface-400 hover:bg-surface-800/40 hover:text-surface-200'}"
					>
						<!-- Active indicator -->
						{#if isActive}
							<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-{cat.color}-500"></div>
							<div class="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 bg-{cat.color}-400"></div>
						{/if}

						<Icon
							icon={cat.icon}
							class="text-lg transition-colors
								{isActive ? `text-${cat.color}-400` : `group-hover:text-${cat.color}-400/60`}"
						/>
						<span class="text-xs font-bold uppercase tracking-wider">{cat.label}</span>
						<span
							class="ml-1 rounded-sm bg-surface-700/50 px-1.5 py-0.5 text-[0.6rem] font-mono text-surface-500"
						>
							{itemCount}
						</span>
					</button>
				{/each}
			</div>
		</nav>

		<!-- Items Grid -->
		<div class="flex-1 overflow-y-auto p-5">
			<div class="grid grid-cols-2 gap-4">
				{#each activeItems as [itemName, item] (itemName)}
					{@const owned = player.inventoryCount(item.name)}
					{@const cost = getItemCost(itemName as AllItems)}
					{@const canAfford = player.canBuyItem(itemName as AllItems)}
					{@const isHovered = hoveredItem === itemName}
					{@const stats = parseStats(item.description)}
					{@const catConfig = categories.find((c) => c.key === activeCategory)}

					<article
						class="group relative flex overflow-hidden border transition-all duration-200
							{canAfford
							? `border-surface-600/50 hover:border-${catConfig?.color}-500/50 hover:shadow-lg`
							: 'border-surface-700/30 opacity-50'}"
						onmouseenter={() => (hoveredItem = itemName)}
						onmouseleave={() => (hoveredItem = null)}
					>
						<!-- Background gradient on hover -->
						<div
							class="absolute inset-0 bg-gradient-to-r from-{catConfig?.color}-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
						></div>

						<!-- Item Image Section -->
						<div
							class="relative flex w-28 shrink-0 items-center justify-center border-r border-surface-700/30 bg-surface-900/60 p-4"
						>
							{#if item.image}
								<img
									src={item.image}
									alt={item.name}
									class="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110"
								/>
							{:else}
								<Icon icon={catConfig?.icon || 'mdi:cube'} class="text-4xl text-surface-600" />
							{/if}

							<!-- Owned badge -->
							{#if owned > 0}
								<div
									class="absolute top-2 left-2 flex items-center gap-1 border border-success-500/30 bg-success-500/20 px-1.5 py-0.5"
								>
									<Icon icon="mdi:check" class="text-[0.6rem] text-success-400" />
									<span class="text-[0.6rem] font-bold text-success-300">×{owned}</span>
								</div>
							{/if}
						</div>

						<!-- Item Details Section -->
						<div class="flex flex-1 flex-col justify-between bg-surface-900/40 p-4">
							<div>
								<!-- Item Name & Type -->
								<div class="mb-2 flex items-start justify-between">
									<div>
										<h3 class="text-sm font-bold uppercase tracking-wide text-surface-100">
											{item.name}
										</h3>
										<span class="text-[0.6rem] tracking-widest text-surface-500"
											>{activeCategory.toUpperCase()}</span
										>
									</div>
								</div>

								<!-- Description -->
								<p class="mb-3 text-xs leading-relaxed text-surface-400">
									{item.description}
								</p>

								<!-- Stat Bonuses -->
								{#if stats.length > 0}
									<div class="mb-3 flex flex-wrap gap-2">
										{#each stats as { stat, value } (stat)}
											{@const statInfo = statIcons[stat]}
											{#if statInfo}
												<div
													class="flex items-center gap-1 border border-{statInfo.color}-500/20 bg-{statInfo.color}-500/10 px-2 py-1"
												>
													<Icon icon={statInfo.icon} class="text-xs text-{statInfo.color}-400" />
													<span class="text-[0.65rem] font-bold text-{statInfo.color}-300"
														>{value}</span
													>
												</div>
											{/if}
										{/each}
									</div>
								{/if}
							</div>

							<!-- Purchase Section -->
							<div class="flex items-center justify-between border-t border-surface-700/30 pt-3">
								<div class="flex items-center gap-2">
									<Icon icon="mdi:coin" class="text-lg text-warning-400" />
									<span
										class="font-mono text-xl font-black
										{canAfford ? 'text-warning-300' : 'text-error-400'}"
									>
										{cost}
									</span>
								</div>

								<button
									disabled={!canAfford}
									onclick={() => player.buyItem(itemName as AllItems)}
									class="relative flex items-center gap-2 overflow-hidden px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all
										{canAfford
										? 'border border-warning-500/50 bg-gradient-to-r from-warning-600 to-warning-700 text-white hover:from-warning-500 hover:to-warning-600 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]'
										: 'cursor-not-allowed border border-surface-600 bg-surface-800 text-surface-500'}"
								>
									{#if canAfford}
										<div
											class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
										></div>
									{/if}
									<Icon icon="mdi:cart-plus" class="text-sm" />
									<span>Purchase</span>
								</button>
							</div>
						</div>

						<!-- Corner accents -->
						<div
							class="pointer-events-none absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 opacity-30 transition-opacity group-hover:opacity-70
								{canAfford ? `border-${catConfig?.color}-500` : 'border-surface-600'}"
						></div>
						<div
							class="pointer-events-none absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 opacity-30 transition-opacity group-hover:opacity-70
								{canAfford ? `border-${catConfig?.color}-500` : 'border-surface-600'}"
						></div>
						<div
							class="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 opacity-30 transition-opacity group-hover:opacity-70
								{canAfford ? `border-${catConfig?.color}-500` : 'border-surface-600'}"
						></div>
						<div
							class="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 opacity-30 transition-opacity group-hover:opacity-70
								{canAfford ? `border-${catConfig?.color}-500` : 'border-surface-600'}"
						></div>
					</article>
				{/each}
			</div>

			<!-- Empty state -->
			{#if activeItems.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<Icon icon="mdi:package-variant" class="mb-4 text-5xl text-surface-600" />
					<p class="text-sm text-surface-400">No items available in this category</p>
				</div>
			{/if}
		</div>

		<!-- Footer Status Bar -->
		<footer
			class="flex items-center justify-end border-t border-surface-500/20 bg-surface-950/80 px-6 py-2"
		>
			<div class="text-[0.6rem] tracking-wider text-surface-500">
				{activeItems.length} ITEMS AVAILABLE
			</div>
		</footer>
	</div>
</PullOutMenu>
