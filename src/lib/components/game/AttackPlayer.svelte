<script context="module" lang="ts">
	export let currentAttackWindow: {
		name: string;
		close: () => void;
	} | null = null;
</script>

<script lang="ts">
	import type { Player } from '$lib/game/player';
	import {
		currentGame,
		getPlayerByName,
		increasePlayerGold,
		reducePlayerHp
	} from '$lib/stores/gameStore';
	import toast from 'svelte-french-toast';
	import Button from '../Button.svelte';
	import SpinWheel from '../wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '../wheel/types';

	export let player: Player;

	$: availableToAttack =
		$currentGame?.players.filter((p) => p.name !== player.name && player.hp > 0) || [];

	let attackingPlayer: Player | null =
		$currentGame?.players.filter((p) => p.name !== player.name && player.hp > 0)[0] ?? null;

	let showWheel = false;

	$: position = !showWheel ? 'translate-x-full' : 'translate-x-0';

	function attackPlayer() {
		if (currentAttackWindow && currentAttackWindow.name != player.name) currentAttackWindow.close();
		showWheel = true;

		currentAttackWindow = {
			name: player.name,
			close: () => {
				showWheel = false;
			}
		};
	}

	function onWinner(item: SpinWheelItem): void {
		const winningPlayer = getPlayerByName(item.label);
		if (!winningPlayer) {
			toast.error('Something went wrong could not find player ' + item.label);
			return;
		}
		if (!attackingPlayer) {
			toast.error('Something went wrong could not find attacking player');
			return;
		}

		if (player.name == winningPlayer.name) {
			toast.success(`${player.name} beat ${attackingPlayer.name}!`);
			reducePlayerHp(attackingPlayer.name);
			increasePlayerGold(player.name);
		} else {
			toast.error(`${player.name} lost to ${attackingPlayer.name}!`);
			reducePlayerHp(player.name);
			increasePlayerGold(attackingPlayer.name);
		}
	}
</script>

<label class="label">
	<select class="select" bind:value={attackingPlayer}>
		{#each availableToAttack as item}
			<option value={item}>{item.name}</option>
		{/each}
	</select>
</label>

<Button
	on:click={attackPlayer}
	disabled={attackingPlayer === null}
	class="variant-filled-primary mt-3 w-full">Attack</Button
>

<div
	class="bg-surface-100-800-token fixed bottom-0 right-0 top-0 z-50 w-[550px] rounded border border-white p-4 transition-all {position}"
>
	<div class="flex justify-end">
		<Button icon="mdi:close" on:click={() => (showWheel = false)}></Button>
	</div>

	{#if attackingPlayer}
		{#key attackingPlayer}
			{#key showWheel}
				<div>
					<h1 class="mb-5 text-center">{player.name} vs {attackingPlayer.name}</h1>

					<SpinWheel
						items={[
							{ label: player.name, weight: player.attack },
							{ label: attackingPlayer.name, weight: attackingPlayer.defense }
						]}
						buttonText="Attack"
						{onWinner}
					></SpinWheel>

					<div
						class="card variant-soft-surface mt-5 flex items-center justify-center gap-3 p-4 text-lg font-bold"
					>
						<p class="text-primary-500">{player.name} | Attack | {player.attack}</p>
						<p class="text-tertiary-500">VS</p>
						<p class="text-secondary-500">
							{attackingPlayer.name} | Defense | {attackingPlayer.defense}
						</p>
					</div>
				</div>
			{/key}
		{/key}
	{/if}
</div>
