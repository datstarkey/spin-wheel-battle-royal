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

			{#each Object.entries(player.resources) as [resource, amount]}
				<Input label={resource} bind:value={player.resources[resource]} />
			{/each}
		</div>
		<hr class="my-8" />

		<div class="grid grid-cols-2 gap-2">
			<Input label="HP" bind:value={player.hp} type="number" />
			<Input label="Attack" bind:value={player.baseAttack} type="number" />
			<Input label="Defense" bind:value={player.baseDefense} type="number" />
			<Input label="Gold" bind:value={player.gold} type="number" />
			<Input label="Movement" bind:value={player.baseMovement} type="number" />
			<Input label="Attack Range" bind:value={player.baseAttackRange} type="number" />
		</div>

		<hr class="my-8" />

		<EditPlayerStats {player} />

		<hr class="my-8" />

		<EditPlayerSpinWheel {player} />
	</div>
</PullOutMenu>
