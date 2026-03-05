<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { MAX_MANA } from '$lib/game/wheels/spellWheels';
	import { Swenergy as SWENERGY_RESOURCE } from '$lib/game/classes/swe';
	import { getHpColorClass, getHpGlowClass, SWENERGY_MAX } from './playerDisplayConstants';

	interface Props {
		player: Player;
		compact?: boolean;
		isDead?: boolean;
	}

	let { player, compact = false, isDead = false }: Props = $props();

	let hpPercent = $derived(
		Math.max(0, Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100))
	);
	let hpColorClass = $derived(getHpColorClass(player.hp));
	let hpGlowClass = $derived(getHpGlowClass(player.hp));

	let iconSize = $derived(compact ? 'text-xs' : 'text-sm');
	let valueSize = $derived(compact ? 'text-xs' : 'text-sm');
	let baseSize = $derived(compact ? 'text-[0.5rem]' : 'text-[0.6rem]');
	let labelSize = $derived(compact ? 'text-[0.5rem]' : 'text-[0.55rem]');
	let padding = $derived(compact ? 'p-2' : 'p-1.5');
</script>

<!-- HP Bar -->
<div class="mb-3 {isDead ? 'opacity-40' : ''}">
	<div class="flex items-center gap-2">
		<div class="h-2 flex-1 overflow-hidden rounded-sm border border-white/5 bg-black/40">
			<div
				class="h-full bg-gradient-to-r transition-all duration-500 {hpColorClass} {hpGlowClass}"
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
		class="flex flex-col items-center rounded-sm border border-white/5 bg-black/30 {padding} transition-all hover:border-white/10 hover:bg-black/40"
	>
		<Icon icon="mdi:sword" class="text-primary-400 mb-0.5 {iconSize}" />
		<div class="flex items-baseline gap-0.5">
			<span class="text-surface-100 {valueSize} font-bold">{player.attack.toFixed(0)}</span>
			{#if player.bonusAttack > 0 || player.attackMultiplier > 1}
				<span class="text-surface-400 {baseSize}">({player.baseAttack})</span>
			{/if}
		</div>
		<span class="text-surface-400 mt-0.5 {labelSize} tracking-widest">ATK</span>
	</div>

	<div
		class="flex flex-col items-center rounded-sm border border-white/5 bg-black/30 {padding} transition-all hover:border-white/10 hover:bg-black/40"
	>
		<Icon icon="mdi:shield" class="text-secondary-400 mb-0.5 {iconSize}" />
		<div class="flex items-baseline gap-0.5">
			<span class="text-surface-100 {valueSize} font-bold">{player.defense.toFixed(0)}</span>
			{#if player.bonusDefense > 0 || player.defenseMultiplier > 1}
				<span class="text-surface-400 {baseSize}">({player.baseDefense})</span>
			{/if}
		</div>
		<span class="text-surface-400 mt-0.5 {labelSize} tracking-widest">DEF</span>
	</div>

	<div
		class="flex flex-col items-center rounded-sm border border-white/5 bg-black/30 {padding} transition-all hover:border-white/10 hover:bg-black/40"
	>
		<Icon icon="mdi:coin" class="text-warning-400 mb-0.5 {iconSize}" />
		<div class="flex items-baseline gap-0.5">
			<span class="text-surface-100 {valueSize} font-bold">{player.gold}</span>
		</div>
		<span class="text-surface-400 mt-0.5 {labelSize} tracking-widest">GOLD</span>
	</div>

	<div
		class="flex flex-col items-center rounded-sm border border-white/5 bg-black/30 {padding} transition-all hover:border-white/10 hover:bg-black/40"
	>
		<Icon icon="ion:footsteps" class="text-success-400 mb-0.5 {iconSize}" />
		<div class="flex items-baseline gap-0.5">
			<span class="text-surface-100 {valueSize} font-bold">{player.movement}</span>
			{#if player.bonusMovement > 0}
				<span class="text-surface-400 {baseSize}">({player.baseMovement})</span>
			{/if}
		</div>
		<span class="text-surface-400 mt-0.5 {labelSize} tracking-widest">MOV</span>
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
{#if player.classType === 'magicman' || player.classType === 'swe' || Object.keys(player.resources).length > 0}
	<div class="mb-3 {isDead ? 'opacity-40' : ''}">
		<!-- Mana bar for Magic Man -->
		{#if player.classType === 'magicman'}
			{@const manaAmount = player.resources['Mana'] ?? 0}
			<div class="flex items-center gap-2 rounded-sm bg-black/20 px-2 py-1.5">
				<span class="text-surface-300 flex min-w-[50px] items-center gap-1 text-[0.65rem]">
					<Icon icon="mdi:wizard-hat" class="text-xs text-violet-400" />
					Mana
				</span>
				<div class="h-1.5 flex-1 overflow-hidden rounded-sm bg-black/40">
					<div
						class="h-full bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all duration-300"
						style:width="{(manaAmount / MAX_MANA) * 100}%"
					></div>
				</div>
				<span class="min-w-[45px] text-right text-[0.65rem] font-semibold text-violet-300"
					>{manaAmount}/{MAX_MANA}</span
				>
			</div>
		{/if}

		<!-- SWEnergy bar for SWE -->
		{#if player.classType === 'swe'}
			{@const swenergyAmount = player.resources[SWENERGY_RESOURCE] ?? 0}
			<div class="flex items-center gap-2 rounded-sm bg-black/20 px-2 py-1.5">
				<span class="text-surface-300 flex min-w-[70px] items-center gap-1 text-[0.65rem]">
					<Icon icon="mdi:code-braces" class="text-secondary-400 text-xs" />
					SWEnergy
				</span>
				<div class="h-1.5 flex-1 overflow-hidden rounded-sm bg-black/40">
					<div
						class="from-secondary-500 to-secondary-400 h-full bg-gradient-to-r transition-all duration-300"
						style:width="{(swenergyAmount / SWENERGY_MAX) * 100}%"
					></div>
				</div>
				<span class="text-secondary-300 min-w-[30px] text-right text-[0.65rem] font-semibold"
					>{swenergyAmount}/{SWENERGY_MAX}</span
				>
			</div>
		{/if}

		<!-- Other resources -->
		{#each Object.entries(player.resources) as [resource, amount] (resource)}
			{#if resource !== 'Mana' && resource !== SWENERGY_RESOURCE && resource !== 'RuneOfPowerTurns'}
				<div class="mt-1 flex items-center gap-1.5 rounded-sm bg-black/20 px-2 py-1 text-xs">
					<Icon icon="mdi:cube-outline" class="text-teal-400" />
					<span>{resource}</span>
					<span class="text-surface-100 ml-auto font-semibold">{amount}</span>
				</div>
			{/if}
		{/each}
	</div>
{/if}
