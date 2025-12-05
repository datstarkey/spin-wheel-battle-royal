<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import AttackPlayer from '../AttackPlayer.svelte';
	import EditPlayer from './EditPlayer.svelte';
	import { generateButtonWheel } from '$lib/game/wheels/buttonWheel';
	import { generateLootWheel } from '$lib/game/wheels/lootWheel';
	import { generateLoseWheel } from '$lib/game/wheels/loseWheel';
	import { generateShadowRealmWheel } from '$lib/game/wheels/shadowRealm';
	import { generateWinWheel } from '$lib/game/wheels/winWheel';
	import { generateDamageTakenWheel } from '$lib/game/wheels/damageTakenWheel';
	import { generateGamblerWheel } from '$lib/game/wheels/gamblerWheel';
	import toast from 'svelte-french-toast';

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
		{ name: 'Shadow Realm Wheel', action: () => generateShadowRealmWheel(player.name), condition: () => player.inShadowRealm },
		{ name: 'Gambler Wheel', action: () => generateGamblerWheel(player.name), condition: () => player.classType === 'gambler' }
	];

	function addWheel(wheel: typeof wheels[0]) {
		wheel.action();
		toast.success(`${wheel.name} Added`);
		wheelDropdownOpen = false;
	}
</script>

<div
	class="card variant-soft-secondary w-full p-3 shadow"
	class:variant-soft-error={player.hp <= 0}
	class:variant-soft-success={player.hp > 0 && player.name == currentTurnPlayer?.name}
>
	<header class="mb-2 flex items-center justify-between gap-3">
		<div class="flex grow flex-col">
			<h3 class="h4">
				{player.name}
				{#if player.hp <= 0}
					<span class="text-sm text-error-500">(DEAD)</span>
				{/if}

				{#if player.inShadowRealm}
					<span class="variant-filled-surface badge mb-2 text-sm text-purple-500">
						<Icon icon="mdi:star-cog" class="mr-2 text-xs text-purple-500" />

						Shadow Realm
					</span>
				{/if}
			</h3>
			<span class="variant-filled-primary badge text-xs">{player.class.name}</span>
		</div>
		<div class="flex gap-1">
			<div class="relative">
				<button
					class="btn-icon btn-icon-sm"
					onclick={() => wheelDropdownOpen = !wheelDropdownOpen}
					title="Add Wheel"
				>
					<Icon icon="mdi:tire" />
				</button>
				{#if wheelDropdownOpen}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div 
						class="fixed inset-0 z-10" 
						onclick={() => wheelDropdownOpen = false}
					></div>
					<div class="absolute right-0 top-full mt-1 z-20 w-48 bg-surface-100-800-token rounded-lg shadow-xl border border-surface-300-600-token">
						{#each wheels as wheel}
							{#if !wheel.condition || wheel.condition()}
								<button
									class="w-full text-left px-3 py-2 hover:bg-surface-200-700-token text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
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
			<Icon icon="ion:footsteps" class="text-warning-500" />
			<span class="whitespace-nowrap">
				{player.baseMovement}
				{#if player.bonusMovement > 0}
					<span class="text-xs">+{player.bonusMovement}</span>
				{/if}
				{#if player.bonusMovement > 0}
					<span class="text-xs">({player.movement})</span>
				{/if}
			</span>
		</div>

		<div class="flex items-center gap-1">
			<Icon icon="material-symbols:social-distance" class="text-warning-500" />
			<span class="whitespace-nowrap">
				{player.baseAttackRange}
				{#if player.bonusAttackRange > 0}
					<span class="text-xs">+{player.bonusAttackRange}</span>
				{/if}
				{#if player.bonusAttackRange > 0}
					<span class="text-xs">({player.attackRange})</span>
				{/if}
			</span>
		</div>

		<div class="flex items-center gap-1">
			<Icon icon="mdi:sword" class="text-primary-500" />
			<span class="whitespace-nowrap text-sm">
				{player.baseAttack}
				{#if player.bonusAttack > 0}
					<span class="text-xs">+{player.bonusAttack.toFixed(0)}</span>
				{/if}
				{#if player.brassKnucklesMultiplier > 0}
					<span class="text-xs">+{player.brassKnucklesMultiplier.toFixed(0)}</span>
				{/if}
				{#if player.attackMultiplier > 1}
					<span class="text-xs">×{player.attackMultiplier.toFixed(1)}</span>
				{/if}
				{#if player.bonusAttack > 0 || player.attackMultiplier > 1 || player.brassKnucklesMultiplier > 0}
					<span class="text-xs">({player.attack.toFixed(0)})</span>
				{/if}
			</span>
		</div>
		<div class="flex items-center gap-1">
			<Icon icon="mdi:shield" class="text-secondary-500" />
			<span class="whitespace-nowrap text-sm">
				{player.baseDefense}
				{#if player.bonusDefense > 0}
					<span class="text-xs">+{player.bonusDefense.toFixed(0)}</span>
				{/if}
				{#if player.defenseMultiplier > 1}
					<span class="text-xs">×{player.defenseMultiplier.toFixed(1)}</span>
				{/if}
				{#if player.bonusDefense > 0 || player.defenseMultiplier > 1}
					<span class="text-xs">({player.defense.toFixed(0)})</span>
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

	<div class="grid grid-cols-1 gap-1 text-sm mt-2">
		<div class="flex items-center justify-between rounded bg-surface-500/10 p-1">
			<span class="flex items-center gap-1 text-xs">
				<Icon icon="mdi:sword" class="text-xs" />
				Main
			</span>
			<span class="ml-2 truncate text-xs">{player.gear.mainHand ?? 'None'}</span>
		</div>
		<div class="flex items-center justify-between rounded bg-surface-500/10 p-1">
			<span class="flex items-center gap-1 text-xs">
				<Icon icon="mdi:shield" class="text-xs" />
				Off
			</span>
			<span class="ml-2 truncate text-xs">{player.gear.offHand ?? 'None'}</span>
		</div>

		<div class="flex items-center justify-between rounded bg-surface-500/10 p-1">
			<span class="flex items-center gap-1 text-xs">
				<Icon icon="game-icons:crested-helmet" class="text-xs" />
				Helm
			</span>
			<span class="ml-2 truncate text-xs">{player.gear.helm ?? 'None'}</span>
		</div>

		<div class="flex items-center justify-between rounded bg-surface-500/10 p-1">
			<span class="flex items-center gap-1 text-xs">
				<Icon icon="mdi:tshirt-crew" class="text-xs" />
				Chest
			</span>
			<span class="ml-2 truncate text-xs">{player.gear.chest ?? 'None'}</span>
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
