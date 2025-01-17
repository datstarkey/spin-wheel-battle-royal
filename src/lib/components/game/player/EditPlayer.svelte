<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/forms/Input.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import { classMap } from '$lib/game/classes/classType';
	import type { Player } from '$lib/game/player/player.svelte';

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
		<h1>Edit {player.name} Stats</h1>
	</div>

	<div class="p-8">
		<div class="grid grid-cols-2 gap-2">
			<Select label="Class" bind:value={player.class}>
				{#each Object.entries(classMap) as [name, playerClass]}
					<option value={playerClass}>{name}</option>
				{/each}
			</Select>
		</div>
		<hr class="my-8" />

		<div class="grid grid-cols-2 gap-2">
			<Input label="HP" bind:value={player.hp} />
			<Input label="Attack" bind:value={player.baseAttack} />
			<Input label="Defense" bind:value={player.baseDefense} />
			<Input label="Gold" bind:value={player.gold} />
		</div>
	</div>
</PullOutMenu>
