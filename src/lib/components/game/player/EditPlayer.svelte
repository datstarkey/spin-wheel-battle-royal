<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/forms/Input.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import { classMap } from '$lib/game/classes/classType';
	import type { Player } from '$lib/game/player/player.svelte';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import EditPlayerSpinWheel from './EditPlayerSpinWheel.svelte';
	import EditPlayerStats from './EditPlayerStats.svelte';

	interface Props {
		player: Player;
	}
	let { player }: Props = $props();
	let modifiers = $derived(player.activeModifiers);
</script>

<PullOutMenu position="bottom" width="400px">
	{#snippet trigger(open)}
		<Button onclick={open} icon="mdi:cog" class="btn-icon-sm"></Button>
	{/snippet}
	<div>
		<h1>Edit {player.name}</h1>
	</div>

	<div class="max-h-[85vh] space-y-4 overflow-y-auto p-8">
		<div class="grid grid-cols-2 gap-2">
			<Select label="Class" bind:value={player.class}>
				{#each Object.entries(classMap) as [name, playerClass]}
					<option value={playerClass}>{name}</option>
				{/each}
			</Select>

			<SlideToggle
				name="Shadow Realm"
				bind:checked={player.inShadowRealm}
				active="bg-purple-500"
				class="mb-2 mt-auto">(Shadow Realm)</SlideToggle
			>

			{#each Object.entries(player.resources) as [resource]}
				<Input label={resource} bind:value={player.resources[resource]} />
			{/each}
		</div>
		<hr class="my-8" />

		<div class="grid grid-cols-2 gap-2">
			<Input label="HP" bind:value={player.hp} type="number" />
			<Input label="Gold" bind:value={player.gold} type="number" />
		</div>

		<div class="space-y-2">
			<h3 class="text-lg font-semibold">Combat Stats</h3>
			<div class="grid grid-cols-2 gap-2">
				<div>
					<div class="mb-1 text-sm text-surface-600">Attack</div>
					<div class="flex items-center gap-2">
						<Input label="Base Attack" bind:value={player.baseAttack} type="number" />
						<span class="text-sm">
							Total: <strong>{player.attack}</strong>
							{#if player.bonusAttack !== 0}
								<span class="text-xs text-primary-500">
									({player.bonusAttack > 0 ? '+' : ''}{player.bonusAttack})
								</span>
							{/if}
							{#if player.brassKnucklesMultiplier > 0}
								<span class="text-xs text-warning-500">
									(+{player.brassKnucklesMultiplier.toFixed(1)} from defense)
								</span>
							{/if}
						</span>
					</div>
				</div>
				<div>
					<div class="mb-1 text-sm text-surface-600">Defense</div>
					<div class="flex items-center gap-2">
						<Input label="Base Defense" bind:value={player.baseDefense} type="number" />
						<span class="text-sm">
							Total: <strong>{player.defense}</strong>
							{#if player.bonusDefense !== 0}
								<span class="text-xs text-primary-500">
									({player.bonusDefense > 0 ? '+' : ''}{player.bonusDefense})
								</span>
							{/if}
						</span>
					</div>
				</div>
				<div>
					<div class="mb-1 text-sm text-surface-600">Movement</div>
					<div class="flex items-center gap-2">
						<Input label="Base Movement" bind:value={player.baseMovement} type="number" />
						<span class="text-sm">
							Total: <strong>{player.movement}</strong>
							{#if player.bonusMovement !== 0}
								<span class="text-xs text-primary-500">
									({player.bonusMovement > 0 ? '+' : ''}{player.bonusMovement})
								</span>
							{/if}
						</span>
					</div>
				</div>
				<div>
					<div class="mb-1 text-sm text-surface-600">Attack Range</div>
					<div class="flex items-center gap-2">
						<Input label="Base Range" bind:value={player.baseAttackRange} type="number" />
						<span class="text-sm">
							Total: <strong>{player.attackRange}</strong>
							{#if player.bonusAttackRange !== 0}
								<span class="text-xs text-primary-500">
									({player.bonusAttackRange > 0 ? '+' : ''}{player.bonusAttackRange})
								</span>
							{/if}
						</span>
					</div>
				</div>
			</div>
		</div>

		<hr class="my-8" />

		<div class="space-y-2">
			<h3 class="text-lg font-semibold">Active Modifiers</h3>
			<div class="space-y-1 text-sm">
				{#if Object.keys(modifiers.attack).length > 0}
					<div>Attack: {JSON.stringify(modifiers.attack)}</div>
				{/if}
				{#if Object.keys(modifiers.defense).length > 0}
					<div>Defense: {JSON.stringify(modifiers.defense)}</div>
				{/if}
				{#if Object.keys(modifiers.movement).length > 0}
					<div>Movement: {JSON.stringify(modifiers.movement)}</div>
				{/if}
				{#if Object.keys(modifiers.attackRange).length > 0}
					<div>Attack Range: {JSON.stringify(modifiers.attackRange)}</div>
				{/if}
				{#if Object.keys(modifiers.attack).length === 0 && Object.keys(modifiers.defense).length === 0 && Object.keys(modifiers.movement).length === 0 && Object.keys(modifiers.attackRange).length === 0}
					<div class="text-surface-500">No active modifiers</div>
				{/if}
			</div>
		</div>

		<hr class="my-8" />

		<EditPlayerStats {player} />

		<hr class="my-8" />

		<EditPlayerSpinWheel {player} />
	</div>
</PullOutMenu>
