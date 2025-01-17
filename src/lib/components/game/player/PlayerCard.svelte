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
					+ {player.bonusAttack.toPrecision(2)} ({player.attack.toPrecision(2)})
				{/if}
				{#if player.attackMultiplier > 1}
					* {player.attackMultiplier.toPrecision(2)}
				{/if}
			</span>
		</div>
		<div class="flex items-center gap-1">
			<Icon icon="mdi:shield" class="text-secondary-500" />
			<span>
				{player.baseDefense}
				{#if player.bonusDefense > 0}
					+ {player.bonusDefense.toPrecision(2)}
				{/if}
				{#if player.defenseMultiplier > 1}
					* {player.defenseMultiplier.toPrecision(2)}
				{/if}
			</span>
		</div>

		{#each Object.entries(player.resources) as [resource, amount]}
			{#if resource === 'Swenergy'}
				<div class="col-span-2">
					<span class="flex items-center gap-1 text-xs">
						<Icon icon="mdi:cube-outline" class="text-xs text-tertiary-500" />
						{resource}
					</span>
					<div class="flex items-center gap-2">
						<div class="h-2 w-20 overflow-hidden rounded-full bg-surface-600">
							<div
								class="h-full bg-tertiary-500 transition-all duration-300"
								style:width="{(amount / 10) * 100}%"
							></div>
						</div>
						<span class="text-xs">{amount}/10</span>
					</div>
				</div>
			{:else}
				<div class="flex items-center justify-between rounded bg-surface-500/10 p-1">
					<span class="flex items-center gap-1">
						<Icon icon="mdi:cube-outline" class="text-xs text-tertiary-500" />
						{resource}
					</span>
					<span>{amount}</span>
				</div>
			{/if}
		{/each}
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

	<div class="mt-3 grid grid-cols-1 gap-1">
		{#each player.statuses.statuses as status}
			<div class="flex items-center justify-between gap-3 rounded bg-surface-500/10 p-1">
				<span class="flex items-center gap-1">
					<Icon icon="mdi:star-cog" class="text-xs text-warning-500" />
					<span>{status.status.name}</span>
				</span>
				{#if status.duration && status.duration > 0}
					<span class="variant-soft-warning badge text-xs">{status.duration} turns</span>
				{:else}
					<span class="variant-soft-secondary badge text-xs">Permanent</span>
				{/if}
			</div>
		{/each}
	</div>

	<div class="mt-3 grid grid-cols-1 gap-1">
		{#each player.gear.consumables as item}
			<div class="flex items-center justify-between rounded bg-surface-500/10">
				<span class="flex items-center gap-1 text-xs">
					<Icon icon="iconoir:consumable" class=" text-primary-500" />
					<span>{item}</span>
				</span>
				<button
					class="variant-soft-primary btn-icon btn-icon-sm"
					disabled={player.hp <= 0 || player.name !== currentTurnPlayer?.name}
					onclick={() => player.gear.useConsumable(item)}
				>
					<Icon icon="mdi:hand-pointing-up" class="text-xs" />
				</button>
			</div>
		{/each}
	</div>

	{#if player.hp > 0 && player.name == currentTurnPlayer?.name}
		<div class="mt-3">
			<AttackPlayer bind:showWheel={isAttackWindowOpen} {player} />
		</div>
	{/if}
</div>
