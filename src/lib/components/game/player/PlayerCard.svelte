<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { getMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';
	import { getSocketStore } from '$lib/multiplayer/socketStore.svelte';
	import { canCastSpell } from '$lib/game/wheels/spellWheels';
	import { getGameStore } from '$lib/stores/gameStore.svelte';
	import { getMovementStore } from '$lib/stores/movementStore.svelte';
	import AttackPlayer from '../AttackPlayer.svelte';
	import EditPlayer from './EditPlayer.svelte';
	import WheelDropdown from './WheelDropdown.svelte';
	import PlayerStats from './shared/PlayerStats.svelte';
	import PlayerEquipment from './shared/PlayerEquipment.svelte';
	import PlayerStatuses from './shared/PlayerStatuses.svelte';
	import PlayerConsumables from './shared/PlayerConsumables.svelte';

	const gs = getGameStore();
	const mp = getMultiplayerStore();
	const socket = getSocketStore();
	const movement = getMovementStore();

	let isMovementMode = $derived(movement.isMovementMode);
	let hasMovedThisTurn = $derived(movement.hasMovedThisTurn);

	interface Props {
		player: Player;
		currentTurnPlayer?: Player;
	}

	let { player, currentTurnPlayer }: Props = $props();

	let isActiveTurn = $derived(player.hp > 0 && player.name === currentTurnPlayer?.name);
	let isDead = $derived(player.hp <= 0);
	let isMe = $derived(player.name === mp.myPlayerName);
	let mpCanAct = $derived(mp.canAct);
	let mpIsGM = $derived(mp.iAmGM);
</script>

<div
	class="bg-surface-900/95 border-surface-500/30 relative rounded border p-4 transition-all duration-300
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
	{#each ['top-1 left-1 border-t-2 border-l-2', 'top-1 right-1 border-t-2 border-r-2', 'bottom-1 left-1 border-b-2 border-l-2', 'right-1 bottom-1 border-r-2 border-b-2'] as pos}
		<div
			class="pointer-events-none absolute h-3 w-3 opacity-50 transition-all duration-300 {pos}
				{isActiveTurn ? 'border-primary-500 animate-pulse opacity-100' : ''}
				{isDead ? 'border-surface-600' : 'border-surface-400'}
				{player.inShadowRealm ? 'border-tertiary-500' : ''}"
		></div>
	{/each}

	<!-- Card Header -->
	<header class="relative mb-3 flex items-center justify-between">
		<div class="flex flex-col gap-1">
			<h3
				class="text-surface-100 flex items-center gap-2 text-lg font-bold tracking-wide uppercase
				{isDead ? 'text-surface-500' : ''}"
			>
				{player.name}
				{#if isMe}
					<span
						class="border-success-500/40 bg-success-500/20 text-success-400 rounded px-1.5 py-0.5 text-[0.55rem] font-bold tracking-widest"
						>YOU</span
					>
				{/if}
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
				{#if player.class.icon}
					<img src={player.class.icon} alt="" class="h-4 w-4" style="image-rendering: pixelated;" />
				{/if}
				<span class="text-[0.65rem] font-semibold tracking-widest text-white uppercase"
					>{player.class.name}</span
				>
			</div>
		</div>

		<div class="flex items-center gap-1">
			{#if mpIsGM}
				<WheelDropdown {player} />
				<EditPlayer {player} />
			{/if}
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

	<!-- Shared stats, equipment, statuses, consumables -->
	<PlayerStats {player} {isDead} />
	<PlayerEquipment {player} {isDead} />
	<PlayerStatuses {player} {isDead} />
	<PlayerConsumables {player} {isDead} {currentTurnPlayer} />

	<!-- Action Panel (only for active player) -->
	{#if isActiveTurn}
		<div class="border-primary-500/20 mt-3 border-t pt-3">
			<!-- Movement Button -->
			<div class="mb-3">
				{#if isMovementMode}
					<button
						class="from-warning-600 to-warning-700 hover:from-warning-500 hover:to-warning-600 flex w-full items-center justify-center gap-2 rounded-sm border-none bg-gradient-to-br px-3 py-2 text-xs font-bold tracking-widest text-white uppercase transition-all"
						onclick={() => movement.exitMovementMode()}
					>
						<Icon icon="mdi:close" />
						Cancel Move
					</button>
				{:else}
					<button
						class="from-success-600 to-success-700 hover:from-success-500 hover:to-success-600 flex w-full items-center justify-center gap-2 rounded-sm border-none bg-gradient-to-br px-3 py-2 text-xs font-bold tracking-widest text-white uppercase transition-all disabled:cursor-not-allowed disabled:opacity-30"
						disabled={hasMovedThisTurn || !mpCanAct}
						onclick={() => movement.enterMovementMode()}
					>
						<Icon icon="ion:footsteps" />
						{hasMovedThisTurn ? 'Already Moved' : `Move (${player.movement} tiles)`}
					</button>
				{/if}
			</div>

			<!-- Magic Man Spell Buttons -->
			{#if player.classType === 'magicman'}
				{@const hasFought = gs.game?.hasFought === true}
				<div class="mb-3">
					<div
						class="text-surface-400 mb-2 flex items-center gap-1.5 text-[0.6rem] font-semibold tracking-[0.15em] uppercase"
					>
						<Icon icon="mdi:wizard-hat" class="text-xs text-violet-400" />
						<span>Cast Spell</span>
						{#if hasFought}
							<span class="text-error-400 ml-auto text-[0.55rem]">(Used Action)</span>
						{/if}
					</div>
					<div class="grid grid-cols-3 gap-1.5">
						<button
							class="flex flex-col items-center gap-1 rounded-sm border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-violet-700/10 px-2 py-2 text-center transition-all hover:border-violet-400/50 hover:from-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40"
							disabled={!canCastSpell(player, 25) || hasFought || !mpCanAct}
							onclick={() => socket.castSpell('minor')}
							title="Minor Spell - 25 Mana"
						>
							<Icon icon="mdi:star-outline" class="text-lg text-violet-400" />
							<span class="text-[0.6rem] font-bold text-violet-300">Minor</span>
							<span class="text-[0.5rem] text-violet-400/70">25 MP</span>
						</button>

						<button
							class="flex flex-col items-center gap-1 rounded-sm border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-violet-700/10 px-2 py-2 text-center transition-all hover:border-violet-400/50 hover:from-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40"
							disabled={!canCastSpell(player, 50) || hasFought || !mpCanAct}
							onclick={() => socket.castSpell('major')}
							title="Major Spell - 50 Mana"
						>
							<Icon icon="mdi:star-half-full" class="text-lg text-violet-400" />
							<span class="text-[0.6rem] font-bold text-violet-300">Major</span>
							<span class="text-[0.5rem] text-violet-400/70">50 MP</span>
						</button>

						<button
							class="flex flex-col items-center gap-1 rounded-sm border border-violet-500/30 bg-gradient-to-br from-violet-600/30 to-violet-800/20 px-2 py-2 text-center transition-all hover:border-violet-400/50 hover:from-violet-500/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
							disabled={!canCastSpell(player, 100) || hasFought || !mpCanAct}
							onclick={() => socket.castSpell('ultimate')}
							title="Ultimate Spell - 100 Mana"
						>
							<Icon icon="mdi:star-shooting" class="animate-pulse text-lg text-violet-300" />
							<span class="text-[0.6rem] font-bold text-violet-200">Ultimate</span>
							<span class="text-[0.5rem] text-violet-400/70">100 MP</span>
						</button>
					</div>
				</div>
			{/if}

			<AttackPlayer {player} />
		</div>
	{/if}
</div>
