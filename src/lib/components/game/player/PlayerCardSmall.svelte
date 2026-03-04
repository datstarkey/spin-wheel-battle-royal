<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import AttackPlayer from '../AttackPlayer.svelte';
	import EditPlayer from './EditPlayer.svelte';
	import WheelDropdown from './WheelDropdown.svelte';

	interface Props {
		player: Player;
		currentTurnPlayer?: Player;
	}

	let { player, currentTurnPlayer }: Props = $props();

	let isExpanded = $state(false);
	let isAttackWindowOpen = $state(false);

	let isActiveTurn = $derived(player.hp > 0 && player.name === currentTurnPlayer?.name);
	let isDead = $derived(player.hp <= 0);
	let hpPercent = $derived(
		Math.max(0, Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100))
	);

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

			<!-- Active turn pulse ring -->
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

			<!-- Stats Grid -->
			<div class="mb-4 grid grid-cols-4 gap-2">
				<div
					class="flex flex-col items-center rounded border border-white/5 bg-black/30 p-2 transition-all hover:border-white/10"
				>
					<Icon icon="mdi:sword" class="text-primary-400 mb-1 text-base" />
					<div class="flex items-baseline gap-1">
						<span class="text-surface-100 text-base font-bold">{player.attack.toFixed(0)}</span>
						{#if player.bonusAttack > 0 || player.attackMultiplier > 1}
							<span class="text-surface-500 text-[0.55rem]">({player.baseAttack})</span>
						{/if}
					</div>
					<span class="text-surface-500 text-[0.5rem] tracking-widest uppercase">ATK</span>
				</div>

				<div
					class="flex flex-col items-center rounded border border-white/5 bg-black/30 p-2 transition-all hover:border-white/10"
				>
					<Icon icon="mdi:shield" class="text-secondary-400 mb-1 text-base" />
					<div class="flex items-baseline gap-1">
						<span class="text-surface-100 text-base font-bold">{player.defense.toFixed(0)}</span>
						{#if player.bonusDefense > 0 || player.defenseMultiplier > 1}
							<span class="text-surface-500 text-[0.55rem]">({player.baseDefense})</span>
						{/if}
					</div>
					<span class="text-surface-500 text-[0.5rem] tracking-widest uppercase">DEF</span>
				</div>

				<div
					class="flex flex-col items-center rounded border border-white/5 bg-black/30 p-2 transition-all hover:border-white/10"
				>
					<Icon icon="mdi:coin" class="text-warning-400 mb-1 text-base" />
					<span class="text-surface-100 text-base font-bold">{player.gold}</span>
					<span class="text-surface-500 text-[0.5rem] tracking-widest uppercase">GOLD</span>
				</div>

				<div
					class="flex flex-col items-center rounded border border-white/5 bg-black/30 p-2 transition-all hover:border-white/10"
				>
					<Icon icon="ion:footsteps" class="text-success-400 mb-1 text-base" />
					<div class="flex items-baseline gap-1">
						<span class="text-surface-100 text-base font-bold">{player.movement}</span>
						{#if player.bonusMovement > 0}
							<span class="text-surface-500 text-[0.55rem]">({player.baseMovement})</span>
						{/if}
					</div>
					<span class="text-surface-500 text-[0.5rem] tracking-widest uppercase">MOV</span>
				</div>
			</div>

			<!-- Range -->
			<div class="mb-4 flex items-center gap-2 rounded bg-black/20 px-2 py-1.5 text-xs">
				<Icon icon="material-symbols:social-distance" class="text-warning-500" />
				<span class="text-surface-400">Range:</span>
				<span class="text-surface-100 font-bold">{player.attackRange}</span>
				{#if player.bonusAttackRange > 0}
					<span class="text-success-400 text-[0.65rem]">(+{player.bonusAttackRange})</span>
				{/if}
			</div>

			<!-- Resources -->
			{#if Object.keys(player.resources).length > 0}
				<div class="mb-4">
					{#each Object.entries(player.resources) as [resource, amount] (resource)}
						{#if resource === 'Swenergy'}
							<div class="flex items-center gap-2 rounded bg-black/20 px-2 py-1.5">
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
							<div class="mt-1 flex items-center gap-1.5 rounded bg-black/20 px-2 py-1 text-xs">
								<Icon icon="mdi:cube-outline" class="text-teal-400" />
								<span>{resource}</span>
								<span class="text-surface-100 ml-auto font-semibold">{amount}</span>
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			<!-- Equipment -->
			<div class="mb-4">
				<div
					class="text-surface-500 mb-2 flex items-center gap-1.5 text-[0.55rem] font-semibold tracking-[0.15em] uppercase"
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
								: 'text-surface-500 italic'}"
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
								: 'text-surface-500 italic'}"
						>
							{player.gear.offHand ?? 'Empty'}
						</span>
					</div>
					<div
						class="flex items-center gap-1.5 rounded border border-white/[0.03] bg-black/25 px-1.5 py-1"
					>
						<Icon icon="game-icons:crested-helmet" class="text-tertiary-400 text-xs opacity-60" />
						<span
							class="truncate text-[0.65rem] {player.gear.helm
								? 'text-surface-300'
								: 'text-surface-500 italic'}"
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
								: 'text-surface-500 italic'}"
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
						class="text-surface-500 mb-2 flex items-center gap-1.5 text-[0.55rem] font-semibold tracking-[0.15em] uppercase"
					>
						<Icon icon="mdi:star-four-points" class="text-xs opacity-70" />
						<span>Status Effects</span>
					</div>
					<div class="flex flex-wrap gap-1">
						{#each player.statuses.statuses as status (status.status.name)}
							<div
								class="border-warning-500/20 bg-warning-500/10 flex items-center gap-1.5 rounded border px-1.5 py-0.5"
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
				<div class="mb-4">
					<div
						class="text-surface-500 mb-2 flex items-center gap-1.5 text-[0.55rem] font-semibold tracking-[0.15em] uppercase"
					>
						<Icon icon="iconoir:consumable" class="text-xs opacity-70" />
						<span>Items</span>
					</div>
					<div class="flex flex-col gap-1">
						{#each player.gear.consumables as item (item)}
							<div
								class="flex items-center justify-between rounded border border-white/[0.03] bg-black/25 px-1.5 py-1"
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

			<!-- Attack Button (for active player) -->
			{#if isActiveTurn}
				<div class="border-primary-500/20 border-t pt-3">
					<AttackPlayer bind:showWheel={isAttackWindowOpen} {player} />
				</div>
			{/if}
		</div>
	</div>
</div>
