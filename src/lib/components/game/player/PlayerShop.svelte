<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import type { AllItems } from '$lib/game/items/itemTypes';
	import type { Player } from '$lib/game/player/player.svelte';
	import { getSocketStore } from '$lib/multiplayer/socketStore.svelte';
	import { getGameStore } from '$lib/stores/gameStore.svelte';

	const gs = getGameStore();
	const socket = getSocketStore();

	interface Props {
		player: Player;
		open: boolean;
	}
	let { player, open = $bindable(false) }: Props = $props();

	// Category configuration with full Tailwind class strings (no interpolation)
	const categoryConfig: Record<
		string,
		{
			label: string;
			icon: string;
			hoverBorder: string;
			bgGradient: string;
			cornerBorder: string;
			labelClass: string;
		}
	> = {
		mainhand: {
			label: 'Weapon',
			icon: 'mdi:sword',
			hoverBorder: 'hover:border-primary-500/50',
			bgGradient: 'from-primary-500/5',
			cornerBorder: 'border-primary-500',
			labelClass: 'text-primary-400'
		},
		offHand: {
			label: 'Off-Hand',
			icon: 'mdi:shield-half-full',
			hoverBorder: 'hover:border-secondary-500/50',
			bgGradient: 'from-secondary-500/5',
			cornerBorder: 'border-secondary-500',
			labelClass: 'text-secondary-400'
		},
		helm: {
			label: 'Headgear',
			icon: 'game-icons:crested-helmet',
			hoverBorder: 'hover:border-tertiary-500/50',
			bgGradient: 'from-tertiary-500/5',
			cornerBorder: 'border-tertiary-500',
			labelClass: 'text-tertiary-400'
		},
		chest: {
			label: 'Armor',
			icon: 'mdi:tshirt-crew',
			hoverBorder: 'hover:border-warning-500/50',
			bgGradient: 'from-warning-500/5',
			cornerBorder: 'border-warning-500',
			labelClass: 'text-warning-400'
		},
		consumables: {
			label: 'Consumable',
			icon: 'mdi:flask',
			hoverBorder: 'hover:border-success-500/50',
			bgGradient: 'from-success-500/5',
			cornerBorder: 'border-success-500',
			labelClass: 'text-success-400'
		}
	};

	// Get current shop items (4 random items from all categories)
	let shopItems = $derived(gs.getShopItems());
	let rerollCost = $derived(gs.getShopRerollCost());
	let canAffordReroll = $derived(player.gold >= rerollCost);

	function handleReroll() {
		socket.shopReroll();
	}

	// Stats with full Tailwind class strings (no interpolation)
	const statIcons: Record<
		string,
		{
			icon: string;
			label: string;
			iconClass: string;
			borderClass: string;
			bgClass: string;
			textClass: string;
		}
	> = {
		attack: {
			icon: 'mdi:sword',
			label: 'ATK',
			iconClass: 'text-primary-400',
			borderClass: 'border-primary-500/20',
			bgClass: 'bg-primary-500/10',
			textClass: 'text-primary-300'
		},
		defense: {
			icon: 'mdi:shield',
			label: 'DEF',
			iconClass: 'text-secondary-400',
			borderClass: 'border-secondary-500/20',
			bgClass: 'bg-secondary-500/10',
			textClass: 'text-secondary-300'
		},
		hp: {
			icon: 'mdi:heart',
			label: 'HP',
			iconClass: 'text-error-400',
			borderClass: 'border-error-500/20',
			bgClass: 'bg-error-500/10',
			textClass: 'text-error-300'
		},
		movement: {
			icon: 'mdi:run-fast',
			label: 'MOV',
			iconClass: 'text-success-400',
			borderClass: 'border-success-500/20',
			bgClass: 'bg-success-500/10',
			textClass: 'text-success-300'
		},
		gold: {
			icon: 'mdi:coin',
			label: 'GOLD',
			iconClass: 'text-warning-400',
			borderClass: 'border-warning-500/20',
			bgClass: 'bg-warning-500/10',
			textClass: 'text-warning-300'
		}
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
		<header class="border-surface-500/20 bg-surface-950/80 relative border-b px-6 py-4">
			<!-- Scanline effect -->
			<div
				class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]"
			></div>

			<div class="relative flex items-center justify-between">
				<!-- Title Section -->
				<div class="flex items-center gap-4">
					<div
						class="border-warning-500/30 from-warning-500/20 relative flex h-12 w-12 items-center justify-center border bg-gradient-to-br to-transparent"
					>
						<Icon icon="mdi:cash-register" class="text-warning-400 text-2xl" />
						<div
							class="border-warning-400 absolute -top-px -left-px h-2 w-2 border-t border-l"
						></div>
						<div
							class="border-warning-400 absolute -top-px -right-px h-2 w-2 border-t border-r"
						></div>
						<div
							class="border-warning-400 absolute -bottom-px -left-px h-2 w-2 border-b border-l"
						></div>
						<div
							class="border-warning-400 absolute -right-px -bottom-px h-2 w-2 border-r border-b"
						></div>
					</div>
					<div>
						<div class="flex items-center gap-2">
							<span class="text-warning-500/80 text-[0.65rem] font-bold tracking-[0.3em]">SHOP</span
							>
							<span class="text-surface-600">|</span>
							<span class="text-surface-400 text-[0.65rem] tracking-widest">EQUIPMENT & ITEMS</span>
						</div>
						<h1 class="text-surface-100 text-xl font-black tracking-wide uppercase">
							{player.name}
						</h1>
					</div>
				</div>

				<!-- Gold Display -->
				<div class="flex items-center gap-4">
					<div class="text-right">
						<div class="text-surface-500 text-[0.6rem] font-semibold tracking-[0.2em]">
							AVAILABLE CREDITS
						</div>
						<div class="flex items-center justify-end gap-2">
							<Icon icon="mdi:coin" class="text-warning-400 text-xl" />
							<span class="text-warning-300 font-mono text-3xl font-black">{player.gold}</span>
						</div>
					</div>
					<button
						onclick={() => (open = false)}
						class="border-surface-600 bg-surface-900/50 text-surface-400 hover:border-primary-500 hover:bg-primary-500/10 hover:text-primary-400 flex h-10 w-10 items-center justify-center border transition-all"
						title="Close Shop"
					>
						<Icon icon="mdi:close" class="text-lg" />
					</button>
				</div>
			</div>
		</header>

		<!-- Shop Info with Reroll -->
		<nav class="border-surface-500/20 bg-surface-900/60 border-b px-4">
			<div class="flex items-center justify-between py-3">
				<!-- Current Stock Info -->
				<div class="flex items-center gap-3">
					<div class="text-surface-500 text-[0.6rem] font-semibold tracking-[0.2em]">
						TODAY'S STOCK
					</div>
					<span
						class="bg-surface-700/50 text-surface-300 rounded-sm px-2 py-1 font-mono text-[0.7rem]"
					>
						{shopItems.length} items available
					</span>
				</div>

				<!-- Reroll Button -->
				<button
					onclick={handleReroll}
					disabled={!canAffordReroll}
					class="group relative flex items-center gap-2 overflow-hidden px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all
						{canAffordReroll
						? 'border-tertiary-500/50 from-tertiary-600 to-tertiary-700 hover:from-tertiary-500 hover:to-tertiary-600 border bg-gradient-to-r text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]'
						: 'border-surface-600 bg-surface-800 text-surface-500 cursor-not-allowed border'}"
					title={canAffordReroll
						? `Reroll shop inventory for ${rerollCost}g`
						: `Not enough gold (need ${rerollCost}g)`}
				>
					{#if canAffordReroll}
						<div
							class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
						></div>
					{/if}
					<Icon icon="mdi:dice-multiple" class="text-sm" />
					<span>Reroll</span>
					<div class="flex items-center gap-1 border-l border-white/20 pl-2">
						<Icon icon="mdi:coin" class="text-warning-400 text-xs" />
						<span class="text-warning-300 font-mono">{rerollCost}</span>
					</div>
				</button>
			</div>
		</nav>

		<!-- Items Grid -->
		<div class="flex-1 overflow-y-auto p-5">
			<div class="grid grid-cols-2 gap-4">
				{#each shopItems as [itemName, item, category] (itemName)}
					{@const owned = player.inventoryCount(item.name)}
					{@const cost = gs.getItemCost(itemName as AllItems)}
					{@const canAfford = player.canBuyItem(itemName as AllItems)}
					{@const stats = parseStats(item.description)}
					{@const catConfig = categoryConfig[category]}

					<article
						class="group relative flex overflow-hidden border transition-all duration-200
							{canAfford
							? `border-surface-600/50 ${catConfig?.hoverBorder ?? ''} hover:shadow-lg`
							: 'border-surface-700/30 opacity-50'}"
					>
						<!-- Background gradient on hover -->
						<div
							class="absolute inset-0 bg-gradient-to-r {catConfig?.bgGradient ??
								''} to-transparent opacity-0 transition-opacity group-hover:opacity-100"
						></div>

						<!-- Item Image Section -->
						<div
							class="border-surface-700/30 bg-surface-900/60 relative flex w-28 shrink-0 items-center justify-center border-r p-4"
						>
							{#if item.image}
								<img
									src={item.image}
									alt={item.name}
									class="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110"
								/>
							{:else}
								<Icon icon={catConfig?.icon || 'mdi:cube'} class="text-surface-600 text-4xl" />
							{/if}

							<!-- Owned badge -->
							{#if owned > 0}
								<div
									class="border-success-500/30 bg-success-500/20 absolute top-2 left-2 flex items-center gap-1 border px-1.5 py-0.5"
								>
									<Icon icon="mdi:check" class="text-success-400 text-[0.6rem]" />
									<span class="text-success-300 text-[0.6rem] font-bold">×{owned}</span>
								</div>
							{/if}
						</div>

						<!-- Item Details Section -->
						<div class="bg-surface-900/40 flex flex-1 flex-col justify-between p-4">
							<div>
								<!-- Item Name & Type -->
								<div class="mb-2 flex items-start justify-between">
									<div>
										<h3 class="text-surface-100 text-sm font-bold tracking-wide uppercase">
											{item.name}
										</h3>
										<span
											class="text-[0.6rem] tracking-widest {catConfig?.labelClass ??
												'text-surface-400'}"
											>{catConfig?.label?.toUpperCase() ?? category.toUpperCase()}</span
										>
									</div>
								</div>

								<!-- Description -->
								<p class="text-surface-400 mb-3 text-xs leading-relaxed">
									{item.description}
								</p>

								<!-- Stat Bonuses -->
								{#if stats.length > 0}
									<div class="mb-3 flex flex-wrap gap-2">
										{#each stats as { stat, value } (stat)}
											{@const statInfo = statIcons[stat]}
											{#if statInfo}
												<div
													class="flex items-center gap-1 border {statInfo.borderClass} {statInfo.bgClass} px-2 py-1"
												>
													<Icon icon={statInfo.icon} class="text-xs {statInfo.iconClass}" />
													<span class="text-[0.65rem] font-bold {statInfo.textClass}">{value}</span>
												</div>
											{/if}
										{/each}
									</div>
								{/if}
							</div>

							<!-- Purchase Section -->
							<div class="border-surface-700/30 flex items-center justify-between border-t pt-3">
								<div class="flex items-center gap-2">
									<Icon icon="mdi:coin" class="text-warning-400 text-lg" />
									<span
										class="font-mono text-xl font-black
										{canAfford ? 'text-warning-300' : 'text-error-400'}"
									>
										{cost}
									</span>
								</div>

								<button
									disabled={!canAfford}
									onclick={() => socket.shopBuy(itemName as AllItems)}
									class="relative flex items-center gap-2 overflow-hidden px-5 py-2 text-xs font-bold tracking-wider uppercase transition-all
										{canAfford
										? 'border-warning-500/50 from-warning-600 to-warning-700 hover:from-warning-500 hover:to-warning-600 border bg-gradient-to-r text-white hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]'
										: 'border-surface-600 bg-surface-800 text-surface-500 cursor-not-allowed border'}"
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
						{#each ['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'right-0 bottom-0 border-r-2 border-b-2'] as pos}
							<div
								class="pointer-events-none absolute h-3 w-3 opacity-30 transition-opacity group-hover:opacity-70 {pos}
									{canAfford ? (catConfig?.cornerBorder ?? '') : 'border-surface-600'}"
							></div>
						{/each}
					</article>
				{/each}
			</div>

			<!-- Empty state -->
			{#if shopItems.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<Icon icon="mdi:package-variant" class="text-surface-600 mb-4 text-5xl" />
					<p class="text-surface-400 text-sm">No items available</p>
				</div>
			{/if}
		</div>

		<!-- Footer Status Bar -->
		<footer
			class="border-surface-500/20 bg-surface-950/80 flex items-center justify-end border-t px-6 py-2"
		>
			<div class="text-surface-500 text-[0.6rem] tracking-wider">
				{shopItems.length} ITEMS AVAILABLE
			</div>
		</footer>
	</div>
</PullOutMenu>
