<script module lang="ts">
	export let currentAttackWindow: {
		name: string;
		close: () => void;
	} | null = null;
</script>

<script lang="ts">
	import type { Player } from '$lib/game/player/player.svelte';
	import { currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
	import toast from 'svelte-french-toast';
	import Button from '../Button.svelte';
	import SpinWheel from '../wheel/SpinWheel.svelte';
	import type { SpinWheelItem } from '../wheel/types';
	import PlayerShop from './player/PlayerShop.svelte';

	interface Props {
		player: Player;
		showWheel: boolean;
	}

	let { player, showWheel = $bindable(false) }: Props = $props();

	let availableToAttack = $derived(
		currentGame.value?.players.filter((p) => p.name !== player.name && player.hp > 0) || []
	);

	let defendingPlayer: Player | null = $state(null);

	let position = $derived(!showWheel ? 'translate-x-full' : 'translate-x-0');

	$effect(() => {
		if (availableToAttack.length > 0 && !defendingPlayer) {
			defendingPlayer = availableToAttack[0];
		}
	});

	let shopOpen = $state(false);

	function attackPlayer() {
		if (!defendingPlayer) {
			toast.error('Something went wrong could not find defending player');
			return;
		}
		if (currentAttackWindow && currentAttackWindow.name != player.name) currentAttackWindow.close();
		showWheel = true;
		console.log('opening attack window');
		player.onAttackStart(defendingPlayer);
		defendingPlayer.onDefenseStart(player);

		currentAttackWindow = {
			name: player.name,

			close: () => {
				showWheel = false;
				console.log('closing attack window');
				player.onAttackEnd(defendingPlayer!);
				defendingPlayer!.onDefenseEnd(player);
			}
		};
	}

	function onWinner(item: SpinWheelItem): void {
		const winningPlayer = getPlayerByName(item.label);
		if (!winningPlayer) {
			toast.error('Something went wrong could not find player ' + item.label);
			return;
		}
		if (!defendingPlayer) {
			toast.error('Something went wrong could not find defending player');
			return;
		}

		const won = player.name == winningPlayer.name;

		if (won) {
			toast.success(`${player.name} beat ${defendingPlayer.name}!`);
			player.onAttackWin(defendingPlayer);
			defendingPlayer.onDefendWin(player);
		} else {
			toast.error(`${player.name} lost to ${defendingPlayer.name}!`);
			player.onAttackLose(defendingPlayer);
			defendingPlayer.onDefendLose(player);
		}
	}

	function defendingPlayerChanged(event: Event) {
		const target = event.target as HTMLSelectElement;
		const selectedPlayer = target.value;
		const newDefendingPlayer = getPlayerByName(selectedPlayer);
		if (newDefendingPlayer) {
			defendingPlayer = newDefendingPlayer;
		}
	}
</script>

<PlayerShop {player} bind:open={shopOpen} />

<label class="label mt-4">
	<span>Player To Attack</span>
	<select class="select" value={defendingPlayer?.name} onchange={defendingPlayerChanged}>
		{#each availableToAttack as item}
			<option value={item.name}>{item.name}</option>
		{/each}
	</select>
</label>

<div class="flex w-full justify-center">
	<div class="variant-filled-primary btn-group mx-auto mt-4">
		<button onclick={attackPlayer} disabled={defendingPlayer === null || showWheel}>Attack</button>
		<button onclick={() => (shopOpen = true)} disabled={showWheel || shopOpen}> Shop</button>
		<button onclick={() => currentGame?.value?.finishTurn()} disabled={showWheel}>Finish</button>
	</div>
</div>

<div
	class="bg-surface-100-800-token fixed bottom-0 right-0 top-0 z-50 w-full rounded border border-white p-4 transition-all lg:w-[550px] {position}"
>
	<div class="flex justify-end">
		<Button icon="mdi:close" onclick={() => currentAttackWindow?.close()}></Button>
	</div>

	{#if defendingPlayer}
		{#key defendingPlayer}
			{#key showWheel}
				<div>
					<h1 class="mb-5 text-center">{player.name} vs {defendingPlayer.name}</h1>

					<SpinWheel
						items={[
							{ label: player.name, weight: player.attack },
							{ label: defendingPlayer.name, weight: defendingPlayer.defense }
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
							{defendingPlayer.name} | Defense | {defendingPlayer.defense}
						</p>
					</div>
				</div>
			{/key}
		{/key}
	{/if}
</div>
