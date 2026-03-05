<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { getMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';
	import AttackPlayer from '../AttackPlayer.svelte';
	import EditPlayer from './EditPlayer.svelte';
	import WheelDropdown from './WheelDropdown.svelte';
	import PlayerStats from './shared/PlayerStats.svelte';
	import PlayerEquipment from './shared/PlayerEquipment.svelte';
	import PlayerStatuses from './shared/PlayerStatuses.svelte';
	import PlayerConsumables from './shared/PlayerConsumables.svelte';
	import { getHpColorClass } from './shared/playerDisplayConstants';

	const mp = getMultiplayerStore();

	interface Props {
		player: Player;
		currentTurnPlayer?: Player;
	}

	let { player, currentTurnPlayer }: Props = $props();

	let isExpanded = $state(false);

	let isActiveTurn = $derived(player.hp > 0 && player.name === currentTurnPlayer?.name);
	let isDead = $derived(player.hp <= 0);
	let isMe = $derived(player.name === mp.myPlayerName);
	let hpPercent = $derived(
		Math.max(0, Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100))
	);
	let avatarLetter = $derived(player.name.charAt(0).toUpperCase());
	let hpColorClass = $derived(getHpColorClass(player.hp));

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
		isExpanded = false;
	}}
>
	<!-- Collapsed State - Compact Bar -->
	<div
		class="bg-surface-950/95 relative flex items-center gap-3 overflow-hidden rounded-lg border px-3 py-2 backdrop-blur-sm transition-all duration-300 ease-out
			{borderStateClass}
			{isDead ? 'opacity-50' : ''}
			{isExpanded ? 'rounded-b-none border-b-0' : ''}"
	>
		<!-- Scan line effect for active turn -->
		{#if isActiveTurn}
			<div class="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
				<div
					class="via-primary-500/30 absolute inset-0 animate-[scan_2s_linear_infinite] bg-gradient-to-b from-transparent to-transparent"
				></div>
			</div>
		{/if}

		<!-- Avatar Circle with Class Icon -->
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
			{:else if player.class.icon}
				<img
					src={player.class.icon}
					alt={player.class.name}
					class="h-7 w-7 rounded-full"
					style="image-rendering: pixelated;"
				/>
			{:else}
				{avatarLetter}
			{/if}

			{#if isActiveTurn}
				<div
					class="border-primary-500 absolute inset-0 animate-ping rounded-full border-2 opacity-40"
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
				{#if isMe}
					<span
						class="border-success-500/40 bg-success-500/20 text-success-400 shrink-0 rounded px-1 py-0.5 text-[0.5rem] font-bold tracking-widest"
						>YOU</span
					>
				{/if}
				{#if player.inShadowRealm}
					<Icon icon="mdi:star-four-points" class="text-tertiary-400 shrink-0 text-xs" />
				{/if}
			</div>
			<span
				class="text-surface-400 flex items-center gap-1 text-[0.6rem] tracking-widest uppercase"
			>
				{#if player.class.icon}
					<img src={player.class.icon} alt="" class="h-3 w-3" style="image-rendering: pixelated;" />
				{/if}
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
				<span class="text-surface-200 text-[0.65rem] font-bold">{player.hp}</span>
			</div>
		</div>

		<!-- Quick Stats (visible in collapsed) -->
		<div class="border-surface-700/50 flex items-center gap-2 border-l pl-3">
			<div class="flex items-center gap-1" title="Attack">
				<Icon icon="mdi:sword" class="text-primary-400 text-xs" />
				<span class="text-surface-200 text-xs font-bold">{player.attack.toFixed(0)}</span>
			</div>
			<div class="flex items-center gap-1" title="Defense">
				<Icon icon="mdi:shield" class="text-secondary-400 text-xs" />
				<span class="text-surface-200 text-xs font-bold">{player.defense.toFixed(0)}</span>
			</div>
			<div class="flex items-center gap-1" title="Gold">
				<Icon icon="mdi:coin" class="text-warning-400 text-xs" />
				<span class="text-surface-200 text-xs font-bold">{player.gold}</span>
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
		class="bg-surface-950 absolute top-full right-0 left-0 z-20 origin-top rounded-b-lg border border-t-0 transition-all duration-300 ease-out
			{borderStateClass}
			{isExpanded ? 'opacity-100' : 'pointer-events-none h-0 overflow-hidden opacity-0'}"
	>
		<div class="p-4">
			<!-- Action Bar -->
			<div class="border-surface-700/30 mb-4 flex items-center justify-between border-b pb-3">
				<div class="flex items-center gap-1">
					<WheelDropdown {player} align="left" />
					<EditPlayer {player} />
				</div>

				{#if player.inShadowRealm}
					<div
						class="border-tertiary-500/30 bg-tertiary-500/10 text-tertiary-300 flex items-center gap-1 rounded-sm border px-2 py-1 text-[0.6rem] font-semibold tracking-widest uppercase"
					>
						<Icon icon="mdi:star-four-points" class="text-xs" />
						Shadow Realm
					</div>
				{/if}
			</div>

			<!-- Shared stats, equipment, statuses, consumables -->
			<PlayerStats {player} compact {isDead} />
			<PlayerEquipment {player} compact {isDead} />
			<PlayerStatuses {player} compact {isDead} />
			<PlayerConsumables {player} compact {isDead} {currentTurnPlayer} />

			<!-- Attack Button (for active player) -->
			{#if isActiveTurn}
				<div class="border-primary-500/20 border-t pt-3">
					<AttackPlayer {player} />
				</div>
			{/if}
		</div>
	</div>
</div>
