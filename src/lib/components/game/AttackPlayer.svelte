<script module lang="ts">
	export let currentAttackWindow: {
		name: string;
		close: () => void;
	} | null = null;

	export const hasPlayerAttacked = $state({
		value: false
	});
</script>

<script lang="ts">
	import type { Player } from '$lib/game/player/player.svelte';
	import { addAuditTrail, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
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
		currentGame.value?.players.filter(
			(p) => p.name !== player.name && player.hp > 0 && p.inShadowRealm == player.inShadowRealm
		) || []
	);

	let defendingPlayer: Player | null = $state(null);

	let winningPlayer = $state<Player | null>();

	let position = $derived(!showWheel ? 'translate-x-full' : 'translate-x-0');

	$effect(() => {
		if (availableToAttack.length > 0 && !defendingPlayer) {
			defendingPlayer = availableToAttack[0];
		}
		if (availableToAttack.length == 0) {
			defendingPlayer = null;
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
		player.onAttackStart(defendingPlayer);
		defendingPlayer.onDefenseStart(player);
		hasPlayerAttacked.value = false;
		currentAttackWindow = {
			name: player.name,
			close: () => {
				showWheel = false;
				winningPlayer = null;
				player.onAttackEnd(defendingPlayer!);
				defendingPlayer!.onDefenseEnd(player);
			}
		};
	}

	function onWinner(item: SpinWheelItem): void {
		winningPlayer = getPlayerByName(item.label);
		hasPlayerAttacked.value = true;
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
			addAuditTrail(`${player.name} beat ${defendingPlayer.name}!`);
			player.onAttackWin(defendingPlayer);
			defendingPlayer.onDefendWin(player);
		} else {
			addAuditTrail(`${player.name} lost to ${defendingPlayer.name}!`);
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
	<select
		class="select"
		value={defendingPlayer?.name}
		onchange={defendingPlayerChanged}
		placeholder="None"
	>
		{#each availableToAttack as item}
			<option value={item.name}>{item.name}</option>
		{/each}
	</select>
</label>

<div class="flex w-full justify-center">
	<div class="variant-filled-primary btn-group mx-auto mt-4">
		<button
			onclick={attackPlayer}
			disabled={defendingPlayer === null || showWheel || hasPlayerAttacked.value}>Attack</button
		>
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
						onSpin={() => {
							addAuditTrail(`${player.name} attacks ${defendingPlayer?.name}!`);
						}}
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

					{#if winningPlayer}
						<div
							class="card variant-soft-surface mt-5 flex items-center justify-center gap-3 p-4 text-lg font-bold"
						>
							<p class="text-primary-500">{winningPlayer?.name} wins!</p>
						</div>

						<Button class="mt-4 w-full" onclick={() => currentAttackWindow?.close()}>Close</Button>
					{/if}
				</div>
			{/key}
		{/key}
	{/if}
</div>
