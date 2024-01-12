<script context="module" lang="ts">
	export let currentAttackWindow: {
		name: string;
		close: () => void;
	} | null = null;
</script>

<script lang="ts">
	import type { Player } from '$lib/game/player/player';
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore';
	import toast from 'svelte-french-toast';
	import Button from '../Button.svelte';
	import SpinWheel from '../wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '../wheel/types';

	export let player: Player;

	$: availableToAttack =
		$currentGame?.players.filter((p) => p.name !== player.name && player.hp > 0) || [];

	let attackingPlayer: Player | null = null;

	let showWheel = false;

	$: position = !showWheel ? 'translate-x-full' : 'translate-x-0';

	function attackPlayer() {
		if (currentAttackWindow && currentAttackWindow.name != player.name) currentAttackWindow.close();
		showWheel = true;

		currentAttackWindow = {
			name: player.name,
			close: () => {
				showWheel = false;
				player.onAttackEnd(attackingPlayer!);
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

		const won = player.name == winningPlayer.name;

		if (won) {
			toast.success(`${player.name} beat ${attackingPlayer.name}!`);
			player.onWin(attackingPlayer);
		} else {
			toast.error(`${player.name} lost to ${attackingPlayer.name}!`);
			player.onLose(attackingPlayer);
		}
	}

	function attackingPlayerChanged(event: Event) {
		const target = event.target as HTMLSelectElement;
		const selectedPlayer = target.value;
		const newAttackingPlayer = getPlayerByName(selectedPlayer);
		if (newAttackingPlayer) {
			//End the attack phase for the previous player
			if (attackingPlayer && attackingPlayer.name !== newAttackingPlayer.name) {
				player.onAttackEnd(attackingPlayer);
			}
			player.onAttackStart(newAttackingPlayer);
			attackingPlayer = newAttackingPlayer;
		}
	}
</script>

<label class="label">
	<select class="select" value={attackingPlayer?.name} on:change={attackingPlayerChanged}>
		{#each availableToAttack as item}
			<option value={item.name}>{item.name}</option>
		{/each}
	</select>
</label>

<Button
	on:click={attackPlayer}
	disabled={attackingPlayer === null}
	class="variant-filled-primary mt-3 w-full">Attack</Button
>

<div
	class="bg-surface-100-800-token fixed bottom-0 right-0 top-0 z-50 w-full rounded border border-white p-4 transition-all lg:w-[550px] {position}"
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
