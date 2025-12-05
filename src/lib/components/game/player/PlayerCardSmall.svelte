<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { generateButtonWheel } from '$lib/game/wheels/buttonWheel';
	import { generateDamageTakenWheel } from '$lib/game/wheels/damageTakenWheel';
	import { generateGamblerWheel } from '$lib/game/wheels/gamblerWheel';
	import { generateLootWheel } from '$lib/game/wheels/lootWheel';
	import { generateLoseWheel } from '$lib/game/wheels/loseWheel';
	import { generateShadowRealmWheel } from '$lib/game/wheels/shadowRealm';
	import { generateWinWheel } from '$lib/game/wheels/winWheel';
	import toast from '$lib/stores/toaster.svelte';
	import AttackPlayer from '../AttackPlayer.svelte';
	import EditPlayer from './EditPlayer.svelte';

	interface Props {
		player: Player;
		currentTurnPlayer?: Player;
	}

	let { player, currentTurnPlayer }: Props = $props();

	let isExpanded = $state(false);
	let isAttackWindowOpen = $state(false);
	let wheelDropdownOpen = $state(false);

	const wheels = [
		{ name: 'Loot Wheel', action: () => generateLootWheel(player.name) },
		{ name: 'Win Wheel', action: () => generateWinWheel(player.name) },
		{ name: 'Lose Wheel', action: () => generateLoseWheel(player.name) },
		{ name: 'Button Wheel', action: () => generateButtonWheel(player.name) },
		{ name: 'Damage Taken Wheel', action: () => generateDamageTakenWheel(player.name) },
		{
			name: 'Shadow Realm Wheel',
			action: () => generateShadowRealmWheel(player.name),
			condition: () => player.inShadowRealm
		},
		{
			name: 'Gambler Wheel',
			action: () => generateGamblerWheel(player.name),
			condition: () => player.classType === 'gambler'
		}
	];

	function addWheel(wheel: (typeof wheels)[0]) {
		wheel.action();
		toast.success(`${wheel.name} Added`);
		wheelDropdownOpen = false;
	}

	let isActiveTurn = $derived(player.hp > 0 && player.name === currentTurnPlayer?.name);
	let isDead = $derived(player.hp <= 0);
	let hpPercent = $derived(Math.max(0, Math.min(100, (player.hp / 20) * 100)));

	// Get first letter for avatar
	let avatarLetter = $derived(player.name.charAt(0).toUpperCase());

	// HP color based on percentage
	let hpColorClass = $derived(
		player.hp <= 5
			? 'from-error-600 to-error-500'
			: player.hp <= 10
				? 'from-warning-600 to-warning-500'
				: 'from-success-600 to-success-500'
	);

	// Border glow based on state
	let borderStateClass = $derived(
		isActiveTurn
			? 'border-primary-500/70 shadow-[0_0_20px_rgba(220,38,38,0.3),inset_0_0_20px_rgba(220,38,38,0.05)]'
			: player.inShadowRealm
				? 'border-tertiary-500/50 shadow-[0_0_20px_rgba(124,58,237,0.25)]'
				: isDead
					? 'border-surface-700/50'
					: 'border-surface-600/30'
	);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group relative"
	onmouseenter={() => (isExpanded = true)}
	onmouseleave={() => {
		if (!wheelDropdownOpen) isExpanded = false;
	}}
>
	<!-- Collapsed State - Compact Bar -->
	<div
		class="relative flex items-center gap-3 overflow-hidden rounded-lg border bg-surface-950/95 px-3 py-2 backdrop-blur-sm transition-all duration-300 ease-out
			{borderStateClass}
			{isDead ? 'opacity-50' : ''}
			{isExpanded ? 'rounded-b-none border-b-0' : ''}"
	>
		<!-- Scan line effect for active turn -->
		{#if isActiveTurn}
			<div
				class="pointer-events-none absolute inset-0 overflow-hidden opacity-20"
			>
				<div
					class="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/30 to-transparent animate-[scan_2s_linear_infinite]"
				></div>
			</div>
		{/if}

		<!-- Avatar Circle -->
		<div
			class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300
				{isActiveTurn
				? 'border-primary-500 bg-primary-500/20 text-primary-400'
				: player.inShadowRealm
					? 'border-tertiary-500 bg-tertiary-500/20 text-tertiary-400'
					: isDead
						? 'border-surface-600 bg-surface-800 text-surface-500'
						: 'border-surface-500 bg-surface-800 text-surface-300'}"
		>
			{#if isDead}
				<Icon icon="mdi:skull" class="text-error-500" />
			{:else}
				{avatarLetter}
			{/if}

			<!-- Active turn pulse ring -->
			{#if isActiveTurn}
				<div
					class="absolute inset-0 rounded-full border-2 border-primary-500 animate-ping opacity-40"
				></div>
			{/if}
		</div>

		<!-- Name & Class -->
		<div class="flex min-w-0 flex-1 flex-col gap-0.5">
			<div class="flex items-center gap-2">
				<span
					class="truncate text-sm font-bold tracking-wide uppercase
						{isDead ? 'text-surface-500 line-through' : 'text-surface-100'}"
				>
					{player.name}
				</span>
				{#if player.inShadowRealm}
					<Icon icon="mdi:star-four-points" class="text-tertiary-400 shrink-0 text-xs" />
				{/if}
			</div>
			<span class="text-[0.6rem] tracking-widest uppercase text-surface-400">
				{player.class.name}
			</span>
		</div>

		<!-- Mini HP Bar -->
		<div class="flex w-20 flex-col gap-1">
			<div class="h-1.5 overflow-hidden rounded-full bg-black/50">
				<div
					class="h-full bg-gradient-to-r transition-all duration-500 {hpColorClass}"
					style:width="{hpPercent}%"
				></div>
			</div>
			<div class="flex items-center justify-end gap-1">
				<Icon icon="mdi:heart" class="text-error-500 text-[0.6rem]" />
				<span class="text-[0.65rem] font-bold text-surface-200">{player.hp}</span>
			</div>
		</div>

		<!-- Quick Stats (visible in collapsed) -->
		<div class="flex items-center gap-2 border-l border-surface-700/50 pl-3">
			<div class="flex items-center gap-1" title="Attack">
				<Icon icon="mdi:sword" class="text-primary-400 text-xs" />
				<span class="text-xs font-bold text-surface-200">{player.attack.toFixed(0)}</span>
			</div>
			<div class="flex items-center gap-1" title="Defense">
				<Icon icon="mdi:shield" class="text-secondary-400 text-xs" />
				<span class="text-xs font-bold text-surface-200">{player.defense.toFixed(0)}</span>
			</div>
			<div class="flex items-center gap-1" title="Gold">
				<Icon icon="mdi:coin" class="text-warning-400 text-xs" />
				<span class="text-xs font-bold text-surface-200">{player.gold}</span>
			</div>
		</div>

		<!-- Expand indicator -->
		<Icon
			icon="mdi:chevron-down"
			class="text-surface-500 shrink-0 text-sm transition-transform duration-300
				{isExpanded ? 'rotate-180' : ''}"
		/>
	</div>

	<!-- Expanded Panel -->
	<div
		class="absolute left-0 right-0 top-full z-50 origin-top rounded-b-lg border border-t-0 bg-surface-950 transition-all duration-300 ease-out
			{borderStateClass}
			{isExpanded ? 'opacity-100' : 'pointer-events-none h-0 overflow-hidden opacity-0'}"
	>
		<div class="p-4">
			<!-- Action Bar -->
			<div class="mb-4 flex items-center justify-between border-b border-surface-700/30 pb-3">
				<div class="flex gap-1">
					<div class="relative">
						<button
							class="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-white/5 text-surface-300 transition-all hover:border-primary-500 hover:bg-white/10 hover:text-surface-100"
							onclick={() => (wheelDropdownOpen = !wheelDropdownOpen)}
							title="Add Wheel"
						>
							<Icon icon="mdi:tire" />
						</button>
						{#if wheelDropdownOpen}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								class="fixed inset-0 z-40"
								onclick={() => (wheelDropdownOpen = false)}
							></div>
							<div
								class="absolute top-full left-0 z-50 mt-1 min-w-40 overflow-hidden rounded border border-white/10 bg-surface-950 shadow-xl"
							>
								{#each wheels as wheel (wheel.name)}
									{#if !wheel.condition || wheel.condition()}
										<button
											class="w-full border-none bg-transparent px-3 py-2 text-left text-xs text-surface-300 transition-all hover:bg-white/5 hover:text-surface-100"
											onclick={() => addWheel(wheel)}
										>
											{wheel.name}
										</button>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
					<EditPlayer {player} />
				</div>

				{#if player.inShadowRealm}
					<div
						class="flex items-center gap-1 rounded-sm border border-tertiary-500/30 bg-tertiary-500/10 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-widest text-tertiary-300"
					>
						<Icon icon="mdi:star-four-points" class="text-xs" />
						Shadow Realm
					</div>
				{/if}
			</div>

			<!-- Stats Grid -->
			<div class="mb-4 grid grid-cols-4 gap-2">
				<div
					class="flex flex-col items-center rounded border border-white/5 bg-black/30 p-2 transition-all hover:border-white/10"
				>
					<Icon icon="mdi:sword" class="text-primary-400 mb-1 text-base" />
					<div class="flex items-baseline gap-1">
						<span class="text-base font-bold text-surface-100"
							>{player.attack.toFixed(0)}</span
						>
						{#if player.bonusAttack > 0 || player.attackMultiplier > 1}
							<span class="text-[0.55rem] text-surface-500">({player.baseAttack})</span>
						{/if}
					</div>
					<span class="text-[0.5rem] uppercase tracking-widest text-surface-500">ATK</span>
				</div>

				<div
					class="flex flex-col items-center rounded border border-white/5 bg-black/30 p-2 transition-all hover:border-white/10"
				>
					<Icon icon="mdi:shield" class="text-secondary-400 mb-1 text-base" />
					<div class="flex items-baseline gap-1">
						<span class="text-base font-bold text-surface-100"
							>{player.defense.toFixed(0)}</span
						>
						{#if player.bonusDefense > 0 || player.defenseMultiplier > 1}
							<span class="text-[0.55rem] text-surface-500">({player.baseDefense})</span
							>
						{/if}
					</div>
					<span class="text-[0.5rem] uppercase tracking-widest text-surface-500">DEF</span>
				</div>

				<div
					class="flex flex-col items-center rounded border border-white/5 bg-black/30 p-2 transition-all hover:border-white/10"
				>
					<Icon icon="mdi:coin" class="text-warning-400 mb-1 text-base" />
					<span class="text-base font-bold text-surface-100">{player.gold}</span>
					<span class="text-[0.5rem] uppercase tracking-widest text-surface-500">GOLD</span
					>
				</div>

				<div
					class="flex flex-col items-center rounded border border-white/5 bg-black/30 p-2 transition-all hover:border-white/10"
				>
					<Icon icon="ion:footsteps" class="text-success-400 mb-1 text-base" />
					<div class="flex items-baseline gap-1">
						<span class="text-base font-bold text-surface-100">{player.movement}</span>
						{#if player.bonusMovement > 0}
							<span class="text-[0.55rem] text-surface-500"
								>({player.baseMovement})</span
							>
						{/if}
					</div>
					<span class="text-[0.5rem] uppercase tracking-widest text-surface-500">MOV</span>
				</div>
			</div>

			<!-- Range -->
			<div
				class="mb-4 flex items-center gap-2 rounded bg-black/20 px-2 py-1.5 text-xs"
			>
				<Icon icon="material-symbols:social-distance" class="text-warning-500" />
				<span class="text-surface-400">Range:</span>
				<span class="font-bold text-surface-100">{player.attackRange}</span>
				{#if player.bonusAttackRange > 0}
					<span class="text-[0.65rem] text-success-400">(+{player.bonusAttackRange})</span>
				{/if}
			</div>

			<!-- Resources -->
			{#if Object.keys(player.resources).length > 0}
				<div class="mb-4">
					{#each Object.entries(player.resources) as [resource, amount] (resource)}
						{#if resource === 'Swenergy'}
							<div class="flex items-center gap-2 rounded bg-black/20 px-2 py-1.5">
								<span
									class="flex min-w-[70px] items-center gap-1 text-[0.65rem] text-surface-300"
								>
									<Icon icon="mdi:cube-outline" class="text-xs text-teal-400" />
									{resource}
								</span>
								<div class="h-1.5 flex-1 overflow-hidden rounded-sm bg-black/40">
									<div
										class="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-300"
										style:width="{(amount / 10) * 100}%"
									></div>
								</div>
								<span
									class="min-w-[30px] text-right text-[0.65rem] font-semibold text-surface-300"
									>{amount}/10</span
								>
							</div>
						{:else}
							<div
								class="mt-1 flex items-center gap-1.5 rounded bg-black/20 px-2 py-1 text-xs"
							>
								<Icon icon="mdi:cube-outline" class="text-teal-400" />
								<span>{resource}</span>
								<span class="ml-auto font-semibold text-surface-100">{amount}</span>
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			<!-- Equipment -->
			<div class="mb-4">
				<div
					class="mb-2 flex items-center gap-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.15em] text-surface-500"
				>
					<Icon icon="mdi:treasure-chest" class="text-xs opacity-70" />
					<span>Equipment</span>
				</div>
				<div class="grid grid-cols-2 gap-1">
					<div
						class="flex items-center gap-1.5 rounded border border-white/[0.03] bg-black/25 px-1.5 py-1"
					>
						<Icon icon="mdi:sword" class="text-primary-400 text-xs opacity-60" />
						<span
							class="truncate text-[0.65rem] {player.gear.mainHand
								? 'text-surface-300'
								: 'italic text-surface-500'}"
						>
							{player.gear.mainHand ?? 'Empty'}
						</span>
					</div>
					<div
						class="flex items-center gap-1.5 rounded border border-white/[0.03] bg-black/25 px-1.5 py-1"
					>
						<Icon icon="mdi:shield-half-full" class="text-secondary-400 text-xs opacity-60" />
						<span
							class="truncate text-[0.65rem] {player.gear.offHand
								? 'text-surface-300'
								: 'italic text-surface-500'}"
						>
							{player.gear.offHand ?? 'Empty'}
						</span>
					</div>
					<div
						class="flex items-center gap-1.5 rounded border border-white/[0.03] bg-black/25 px-1.5 py-1"
					>
						<Icon
							icon="game-icons:crested-helmet"
							class="text-tertiary-400 text-xs opacity-60"
						/>
						<span
							class="truncate text-[0.65rem] {player.gear.helm
								? 'text-surface-300'
								: 'italic text-surface-500'}"
						>
							{player.gear.helm ?? 'Empty'}
						</span>
					</div>
					<div
						class="flex items-center gap-1.5 rounded border border-white/[0.03] bg-black/25 px-1.5 py-1"
					>
						<Icon icon="mdi:tshirt-crew" class="text-warning-400 text-xs opacity-60" />
						<span
							class="truncate text-[0.65rem] {player.gear.chest
								? 'text-surface-300'
								: 'italic text-surface-500'}"
						>
							{player.gear.chest ?? 'Empty'}
						</span>
					</div>
				</div>
			</div>

			<!-- Status Effects -->
			{#if player.statuses.statuses.length > 0}
				<div class="mb-4">
					<div
						class="mb-2 flex items-center gap-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.15em] text-surface-500"
					>
						<Icon icon="mdi:star-four-points" class="text-xs opacity-70" />
						<span>Status Effects</span>
					</div>
					<div class="flex flex-wrap gap-1">
						{#each player.statuses.statuses as status (status.status.name)}
							<div
								class="flex items-center gap-1.5 rounded border border-warning-500/20 bg-warning-500/10 px-1.5 py-0.5"
							>
								<span class="text-[0.6rem] text-warning-400">{status.status.name}</span
								>
								{#if status.duration && status.duration > 0}
									<span
										class="rounded-sm bg-black/30 px-1 py-0.5 text-[0.55rem] font-bold text-warning-500"
										>{status.duration}T</span
									>
								{:else}
									<span class="text-[0.6rem] text-tertiary-400">∞</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Consumables -->
			{#if player.gear.consumables.length > 0}
				<div class="mb-4">
					<div
						class="mb-2 flex items-center gap-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.15em] text-surface-500"
					>
						<Icon icon="iconoir:consumable" class="text-xs opacity-70" />
						<span>Items</span>
					</div>
					<div class="flex flex-col gap-1">
						{#each player.gear.consumables as item (item)}
							<div
								class="flex items-center justify-between rounded border border-white/[0.03] bg-black/25 px-1.5 py-1"
							>
								<span class="text-[0.65rem] text-surface-300">{item}</span>
								<button
									class="rounded-sm border-none bg-gradient-to-br from-primary-600 to-primary-700 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-white transition-all hover:-translate-y-px hover:from-primary-500 hover:to-primary-600 disabled:cursor-not-allowed disabled:opacity-30"
									disabled={isDead || player.name !== currentTurnPlayer?.name}
									onclick={() => player.gear.useConsumable(item)}
								>
									USE
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Attack Button (for active player) -->
			{#if isActiveTurn}
				<div class="border-t border-primary-500/20 pt-3">
					<AttackPlayer bind:showWheel={isAttackWindowOpen} {player} />
				</div>
			{/if}
		</div>
	</div>
</div>
