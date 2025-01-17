<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import AttackPlayer from '../AttackPlayer.svelte';
	import EditPlayer from './EditPlayer.svelte';

	interface Props {
		player: Player;
		currentTurnPlayer?: Player;
		isAttackWindowOpen: boolean;
	}

	let { player, currentTurnPlayer, isAttackWindowOpen = $bindable() }: Props = $props();
</script>

<div
	class="card variant-soft-secondary min-w-48 p-3 shadow"
	class:variant-soft-error={player.hp <= 0}
	class:variant-soft-success={player.hp > 0 && player.name == currentTurnPlayer?.name}
>
	<header class="mb-2 flex items-center justify-between">
		<div class="flex flex-col">
			<h3 class="h4">
				{player.name}
				{#if player.hp <= 0}
					<span class="text-sm text-error-500">(DEAD)</span>
				{/if}
			</h3>
			<span class="variant-filled-primary badge text-xs">{player.class.name}</span>
		</div>
		<EditPlayer {player} />
	</header>

	<div class="mb-3 grid grid-cols-2 gap-2" class:opacity-50={player.hp <= 0}>
		<div class="flex items-center gap-1">
			<Icon icon="mdi:heart" class="text-success-500" />
			<span>{player.hp}</span>
		</div>

		<div class="flex items-center gap-1">
			<Icon icon="mdi:coin" class="text-warning-500" />
			<span>{player.gold}</span>
		</div>

		<div class="flex items-center gap-1">
			<Icon icon="mdi:sword" class="text-primary-500" />
			<span>
				{player.baseAttack}
				{#if player.bonusAttack > 0}
					+ {player.bonusAttack.toFixed(2)} ({player.attack.toFixed(2)})
				{/if}
				{#if player.attackMultiplier > 1}
					* {player.attackMultiplier}
				{/if}
			</span>
		</div>
		<div class="flex items-center gap-1">
			<Icon icon="mdi:shield" class="text-secondary-500" />
			<span>{player.baseDefense} + ({player.bonusDefense})</span>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-1 text-sm">
		<div class="flex items-center justify-between rounded bg-surface-500/10 p-1">
			<span class="flex items-center gap-1">
				<Icon icon="mdi:sword" class="text-xs" />
				Main
			</span>
			<span class="ml-2 truncate">{player.gear.mainHand ?? 'None'}</span>
		</div>
		<div class="flex items-center justify-between rounded bg-surface-500/10 p-1">
			<span class="flex items-center gap-1">
				<Icon icon="mdi:shield" class="text-xs" />
				Off
			</span>
			<span class="ml-2 truncate">{player.gear.offHand ?? 'None'}</span>
		</div>
		<div class="flex items-center justify-between rounded bg-surface-500/10 p-1">
			<span class="flex items-center gap-1">
				<Icon icon="mdi:tshirt-crew" class="text-xs" />
				Chest
			</span>
			<span class="ml-2 truncate">{player.gear.chest ?? 'None'}</span>
		</div>
	</div>

	{#if player.hp > 0 && player.name == currentTurnPlayer?.name}
		<div class="mt-3">
			<AttackPlayer bind:showWheel={isAttackWindowOpen} {player} />
		</div>
	{/if}
</div>
