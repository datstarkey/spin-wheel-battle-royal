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
	import {
		enterMovementMode,
		exitMovementMode,
		getHasMovedThisTurn,
		getIsMovementMode
	} from '$lib/stores/gameStore.svelte';
	import toast from '$lib/stores/toaster.svelte';
	import AttackPlayer from '../AttackPlayer.svelte';
	import EditPlayer from './EditPlayer.svelte';

	// Derive movement state
	let isMovementMode = $derived(getIsMovementMode());
	let hasMovedThisTurn = $derived(getHasMovedThisTurn());

	interface Props {
		player: Player;
		currentTurnPlayer?: Player;
	}

	let { player, currentTurnPlayer }: Props = $props();

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
</script>

<div
	class="bg-surface-900/95 border-surface-500/30 relative rounded border p-4 transition-all duration-300
		{wheelDropdownOpen ? 'z-50' : ''}
		{isActiveTurn
		? 'border-primary-500/50 shadow-[0_0_20px_rgba(220,38,38,0.2),inset_0_0_30px_rgba(220,38,38,0.05)]'
		: ''}
		{isDead ? 'border-surface-600/50' : ''}
		{player.inShadowRealm
		? 'border-tertiary-500/40 shadow-[0_0_25px_rgba(124,58,237,0.15),inset_0_0_40px_rgba(124,58,237,0.05)]'
		: ''}"
>
	<!-- Gradient overlay -->
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.02] via-transparent to-black/10"
	></div>

	<!-- Dead overlay -->
	{#if isDead}
		<div
			class="pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]"
		></div>
	{/if}

	<!-- Corner accents -->
	<div
		class="pointer-events-none absolute top-1 left-1 h-3 w-3 border-t-2 border-l-2 opacity-50 transition-all duration-300
		{isActiveTurn ? 'border-primary-500 animate-pulse opacity-100' : ''}
		{isDead ? 'border-surface-600' : 'border-surface-400'}
		{player.inShadowRealm ? 'border-tertiary-500' : ''}"
	></div>
	<div
		class="pointer-events-none absolute top-1 right-1 h-3 w-3 border-t-2 border-r-2 opacity-50 transition-all duration-300
		{isActiveTurn ? 'border-primary-500 animate-pulse opacity-100' : ''}
		{isDead ? 'border-surface-600' : 'border-surface-400'}
		{player.inShadowRealm ? 'border-tertiary-500' : ''}"
	></div>
	<div
		class="pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b-2 border-l-2 opacity-50 transition-all duration-300
		{isActiveTurn ? 'border-primary-500 animate-pulse opacity-100' : ''}
		{isDead ? 'border-surface-600' : 'border-surface-400'}
		{player.inShadowRealm ? 'border-tertiary-500' : ''}"
	></div>
	<div
		class="pointer-events-none absolute right-1 bottom-1 h-3 w-3 border-r-2 border-b-2 opacity-50 transition-all duration-300
		{isActiveTurn ? 'border-primary-500 animate-pulse opacity-100' : ''}
		{isDead ? 'border-surface-600' : 'border-surface-400'}
		{player.inShadowRealm ? 'border-tertiary-500' : ''}"
	></div>

	<!-- Card Header -->
	<header class="relative mb-3 flex items-start justify-between">
		<div class="flex flex-col gap-1">
			<h3
				class="text-surface-100 flex items-center gap-2 text-lg font-bold tracking-wide uppercase
				{isDead ? 'text-surface-500' : ''}"
			>
				{player.name}
				{#if isDead}
					<Icon icon="mdi:skull" class="text-error-500 animate-bounce" />
				{/if}
			</h3>
			<div
				class="inline-flex w-fit rounded-sm px-2 py-0.5
				{isActiveTurn ? 'from-primary-500 to-primary-700 bg-gradient-to-br' : ''}
				{isDead
					? 'from-surface-600 to-surface-700 bg-gradient-to-br'
					: 'from-surface-400 to-surface-600 bg-gradient-to-br'}
				{player.inShadowRealm ? 'from-tertiary-500 to-tertiary-700 bg-gradient-to-br' : ''}"
			>
				<span class="text-[0.65rem] font-semibold tracking-widest text-white uppercase"
					>{player.class.name}</span
				>
			</div>
		</div>

		<div class="flex gap-1">
			<div class="relative">
				<button
					class="text-surface-300 hover:border-primary-500 hover:text-surface-100 flex h-7 w-7 items-center justify-center rounded-sm border border-white/10 bg-white/5 transition-all hover:bg-white/10"
					onclick={() => (wheelDropdownOpen = !wheelDropdownOpen)}
					title="Add Wheel"
				>
					<Icon icon="mdi:tire" />
				</button>
				{#if wheelDropdownOpen}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div class="fixed inset-0 z-40" onclick={() => (wheelDropdownOpen = false)}></div>
					<div
						class="bg-surface-950 absolute top-full right-0 z-50 mt-1 min-w-40 overflow-hidden rounded border border-white/10 shadow-xl"
					>
						{#each wheels as wheel (wheel.name)}
							{#if !wheel.condition || wheel.condition()}
								<button
									class="text-surface-300 hover:text-surface-100 w-full border-none bg-transparent px-3 py-2 text-left text-xs transition-all hover:bg-white/5"
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
	</header>

	<!-- Shadow Realm Badge -->
	{#if player.inShadowRealm}
		<div
			class="border-tertiary-500/30 from-tertiary-500/20 to-tertiary-400/20 text-tertiary-300 mb-3 flex items-center justify-center gap-1 rounded-sm border bg-gradient-to-r px-2 py-1 text-[0.65rem] font-semibold tracking-widest uppercase"
		>
			<Icon icon="mdi:star-four-points" />
			Shadow Realm
		</div>
	{/if}

	<!-- HP Bar -->
	<div class="mb-3 {isDead ? 'opacity-40' : ''}">
		<div class="flex items-center gap-2">
			<div class="h-2 flex-1 overflow-hidden rounded-sm border border-white/5 bg-black/40">
				<div
					class="h-full transition-all duration-500
						{player.hp <= 5
						? 'from-error-600 to-error-500 animate-pulse bg-gradient-to-r shadow-[0_0_10px_rgba(220,38,38,0.5)]'
						: ''}
						{player.hp > 5 && player.hp <= 10
						? 'from-warning-600 to-warning-500 bg-gradient-to-r shadow-[0_0_10px_rgba(234,179,8,0.4)]'
						: ''}
						{player.hp > 10
						? 'from-success-600 to-success-500 bg-gradient-to-r shadow-[0_0_10px_rgba(34,197,94,0.4)]'
						: ''}"
					style:width="{hpPercent}%"
				></div>
			</div>
			<div class="flex min-w-10 items-center gap-1">
				<Icon icon="mdi:heart" class="text-error-500 text-sm" />
				<span class="text-surface-100 text-sm font-bold {isDead ? 'text-surface-500' : ''}"
					>{player.hp}</span
				>
			</div>
		</div>
	</div>

	<!-- Primary Stats Grid -->
	<div class="mb-2 grid grid-cols-4 gap-2 {isDead ? 'opacity-40' : ''}">
		<div
			class="flex flex-col items-center rounded-sm border border-white/5 bg-black/30 p-1.5 transition-all hover:border-white/10 hover:bg-black/40"
		>
			<Icon icon="mdi:sword" class="text-primary-400 mb-0.5 text-sm" />
			<div class="flex items-baseline gap-0.5">
				<span class="text-surface-100 text-sm font-bold">{player.attack.toFixed(0)}</span>
				{#if player.bonusAttack > 0 || player.attackMultiplier > 1}
					<span class="text-surface-400 text-[0.6rem]">({player.baseAttack})</span>
				{/if}
			</div>
			<span class="text-surface-400 mt-0.5 text-[0.55rem] tracking-widest">ATK</span>
		</div>

		<div
			class="flex flex-col items-center rounded-sm border border-white/5 bg-black/30 p-1.5 transition-all hover:border-white/10 hover:bg-black/40"
		>
			<Icon icon="mdi:shield" class="text-secondary-400 mb-0.5 text-sm" />
			<div class="flex items-baseline gap-0.5">
				<span class="text-surface-100 text-sm font-bold">{player.defense.toFixed(0)}</span>
				{#if player.bonusDefense > 0 || player.defenseMultiplier > 1}
					<span class="text-surface-400 text-[0.6rem]">({player.baseDefense})</span>
				{/if}
			</div>
			<span class="text-surface-400 mt-0.5 text-[0.55rem] tracking-widest">DEF</span>
		</div>

		<div
			class="flex flex-col items-center rounded-sm border border-white/5 bg-black/30 p-1.5 transition-all hover:border-white/10 hover:bg-black/40"
		>
			<Icon icon="mdi:coin" class="text-warning-400 mb-0.5 text-sm" />
			<div class="flex items-baseline gap-0.5">
				<span class="text-surface-100 text-sm font-bold">{player.gold}</span>
			</div>
			<span class="text-surface-400 mt-0.5 text-[0.55rem] tracking-widest">GOLD</span>
		</div>

		<div
			class="flex flex-col items-center rounded-sm border border-white/5 bg-black/30 p-1.5 transition-all hover:border-white/10 hover:bg-black/40"
		>
			<Icon icon="ion:footsteps" class="text-success-400 mb-0.5 text-sm" />
			<div class="flex items-baseline gap-0.5">
				<span class="text-surface-100 text-sm font-bold">{player.movement}</span>
				{#if player.bonusMovement > 0}
					<span class="text-surface-400 text-[0.6rem]">({player.baseMovement})</span>
				{/if}
			</div>
			<span class="text-surface-400 mt-0.5 text-[0.55rem] tracking-widest">MOV</span>
		</div>
	</div>

	<!-- Range Stat -->
	<div
		class="mb-3 flex items-center gap-1.5 rounded-sm bg-black/20 px-2 py-1.5 text-xs {isDead
			? 'opacity-40'
			: ''}"
	>
		<Icon icon="material-symbols:social-distance" class="text-warning-500" />
		<span class="text-surface-400">Range:</span>
		<span class="text-surface-100 font-bold">{player.attackRange}</span>
		{#if player.bonusAttackRange > 0}
			<span class="text-success-400 text-[0.65rem]">(+{player.bonusAttackRange})</span>
		{/if}
	</div>

	<!-- Resources -->
	{#if Object.keys(player.resources).length > 0}
		<div class="mb-3 {isDead ? 'opacity-40' : ''}">
			{#each Object.entries(player.resources) as [resource, amount] (resource)}
				{#if resource === 'Swenergy'}
					<div class="flex items-center gap-2 rounded-sm bg-black/20 px-2 py-1.5">
						<span class="text-surface-300 flex min-w-[70px] items-center gap-1 text-[0.65rem]">
							<Icon icon="mdi:cube-outline" class="text-xs text-teal-400" />
							{resource}
						</span>
						<div class="h-1.5 flex-1 overflow-hidden rounded-sm bg-black/40">
							<div
								class="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-300"
								style:width="{(amount / 10) * 100}%"
							></div>
						</div>
						<span class="text-surface-300 min-w-[30px] text-right text-[0.65rem] font-semibold"
							>{amount}/10</span
						>
					</div>
				{:else}
					<div class="mt-1 flex items-center gap-1.5 rounded-sm bg-black/20 px-2 py-1 text-xs">
						<Icon icon="mdi:cube-outline" class="text-teal-400" />
						<span>{resource}</span>
						<span class="text-surface-100 ml-auto font-semibold">{amount}</span>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Equipment Section -->
	<div class="mb-3 {isDead ? 'opacity-40' : ''}">
		<div
			class="text-surface-400 mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-semibold tracking-[0.15em] uppercase"
		>
			<Icon icon="mdi:treasure-chest" class="text-xs opacity-70" />
			<span>Equipment</span>
		</div>
		<div class="grid grid-cols-2 gap-1">
			<div
				class="flex items-center gap-1.5 rounded-sm border border-white/[0.03] bg-black/25 px-1.5 py-1"
			>
				<Icon icon="mdi:sword" class="text-primary-400 text-xs opacity-60" />
				<span
					class="truncate text-[0.65rem] {player.gear.mainHand
						? 'text-surface-300'
						: 'text-surface-400 italic'}"
				>
					{player.gear.mainHand ?? 'Empty'}
				</span>
			</div>
			<div
				class="flex items-center gap-1.5 rounded-sm border border-white/[0.03] bg-black/25 px-1.5 py-1"
			>
				<Icon icon="mdi:shield-half-full" class="text-secondary-400 text-xs opacity-60" />
				<span
					class="truncate text-[0.65rem] {player.gear.offHand
						? 'text-surface-300'
						: 'text-surface-400 italic'}"
				>
					{player.gear.offHand ?? 'Empty'}
				</span>
			</div>
			<div
				class="flex items-center gap-1.5 rounded-sm border border-white/[0.03] bg-black/25 px-1.5 py-1"
			>
				<Icon icon="game-icons:crested-helmet" class="text-tertiary-400 text-xs opacity-60" />
				<span
					class="truncate text-[0.65rem] {player.gear.helm
						? 'text-surface-300'
						: 'text-surface-400 italic'}"
				>
					{player.gear.helm ?? 'Empty'}
				</span>
			</div>
			<div
				class="flex items-center gap-1.5 rounded-sm border border-white/[0.03] bg-black/25 px-1.5 py-1"
			>
				<Icon icon="mdi:tshirt-crew" class="text-warning-400 text-xs opacity-60" />
				<span
					class="truncate text-[0.65rem] {player.gear.chest
						? 'text-surface-300'
						: 'text-surface-400 italic'}"
				>
					{player.gear.chest ?? 'Empty'}
				</span>
			</div>
		</div>
	</div>

	<!-- Status Effects -->
	{#if player.statuses.statuses.length > 0}
		<div class="mb-3 {isDead ? 'opacity-40' : ''}">
			<div
				class="text-surface-400 mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-semibold tracking-[0.15em] uppercase"
			>
				<Icon icon="mdi:star-four-points" class="text-xs opacity-70" />
				<span>Status Effects</span>
			</div>
			<div class="flex flex-wrap gap-1">
				{#each player.statuses.statuses as status (status.status.name)}
					<div
						class="border-warning-500/20 bg-warning-500/10 flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5"
					>
						<span class="text-warning-400 text-[0.6rem]">{status.status.name}</span>
						{#if status.duration && status.duration > 0}
							<span
								class="text-warning-500 rounded-sm bg-black/30 px-1 py-0.5 text-[0.55rem] font-bold"
								>{status.duration}T</span
							>
						{:else}
							<span class="text-tertiary-400 text-[0.6rem]">∞</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Consumables -->
	{#if player.gear.consumables.length > 0}
		<div class="mb-2 {isDead ? 'opacity-40' : ''}">
			<div
				class="text-surface-400 mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-semibold tracking-[0.15em] uppercase"
			>
				<Icon icon="iconoir:consumable" class="text-xs opacity-70" />
				<span>Items</span>
			</div>
			<div class="flex flex-col gap-1">
				{#each player.gear.consumables as item (item)}
					<div
						class="flex items-center justify-between rounded-sm border border-white/[0.03] bg-black/25 px-1.5 py-1"
					>
						<span class="text-surface-300 text-[0.65rem]">{item}</span>
						<button
							class="from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 rounded-sm border-none bg-gradient-to-br px-1.5 py-0.5 text-[0.55rem] font-bold tracking-widest text-white uppercase transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-30"
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

	<!-- Action Panel (only for active player) -->
	{#if isActiveTurn}
		<div class="border-primary-500/20 mt-3 border-t pt-3">
			<!-- Movement Button -->
			<div class="mb-3">
				{#if isMovementMode}
					<button
						class="from-warning-600 to-warning-700 hover:from-warning-500 hover:to-warning-600 flex w-full items-center justify-center gap-2 rounded-sm border-none bg-gradient-to-br px-3 py-2 text-xs font-bold tracking-widest text-white uppercase transition-all"
						onclick={() => exitMovementMode()}
					>
						<Icon icon="mdi:close" />
						Cancel Move
					</button>
				{:else}
					<button
						class="from-success-600 to-success-700 hover:from-success-500 hover:to-success-600 flex w-full items-center justify-center gap-2 rounded-sm border-none bg-gradient-to-br px-3 py-2 text-xs font-bold tracking-widest text-white uppercase transition-all disabled:cursor-not-allowed disabled:opacity-30"
						disabled={hasMovedThisTurn}
						onclick={() => enterMovementMode()}
					>
						<Icon icon="ion:footsteps" />
						{hasMovedThisTurn ? 'Already Moved' : `Move (${player.movement} tiles)`}
					</button>
				{/if}
			</div>

			<AttackPlayer bind:showWheel={isAttackWindowOpen} {player} />
		</div>
	{/if}
</div>
