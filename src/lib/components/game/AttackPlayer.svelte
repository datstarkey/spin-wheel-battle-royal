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
	import toast from '$lib/stores/toaster.svelte';
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

	// Default to first available player, allow manual override via select
	let selectedPlayerName = $state<string | null>(null);

	let defendingPlayer = $derived.by(() => {
		// If user selected a player, use that
		if (selectedPlayerName) {
			const selected = availableToAttack.find((p) => p.name === selectedPlayerName);
			if (selected) return selected;
		}
		// Otherwise default to first available
		return availableToAttack[0] ?? null;
	});

	let winningPlayer = $state<Player | null>();

	let position = $derived(!showWheel ? 'translate-x-full' : 'translate-x-0');

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
				defendingPlayer?.onDefenseEnd(player);
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
		selectedPlayerName = target.value;
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
		{#each availableToAttack as item (item.name)}
			<option value={item.name}>{item.name}</option>
		{/each}
	</select>
</label>

<div class="mx-auto mt-4 flex justify-center gap-2">
	<button
		class="rounded border border-primary-600 bg-primary-600 px-4 py-2 font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
		onclick={attackPlayer}
		disabled={defendingPlayer === null || showWheel || hasPlayerAttacked.value == true}
	>
		Attack
	</button>
	<button
		class="rounded border border-warning-600 bg-warning-600 px-4 py-2 font-semibold text-white transition-all hover:bg-warning-700 disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => (shopOpen = true)}
		disabled={showWheel || shopOpen || player.classType == 'gambler' || player.inShadowRealm}
	>
		Shop
	</button>
	<button
		class="rounded border border-success-600 bg-success-600 px-4 py-2 font-semibold text-white transition-all hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => currentGame?.value?.finishTurn()}
		disabled={showWheel}
	>
		Finish
	</button>
</div>

<div
	class="bg-surface-50 dark:bg-surface-900 fixed top-0 right-0 bottom-0 z-50 w-full rounded border border-white p-4 transition-all lg:w-[550px] {position}"
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
						showSpin={hasPlayerAttacked.value == false}
						onSpin={() => {
							addAuditTrail(`${player.name} attacks ${defendingPlayer?.name}!`);
						}}
					></SpinWheel>

					<div
						class="card preset-tonal-surface mt-5 flex items-center justify-center gap-3 p-4 text-lg font-bold"
					>
						<p class="text-primary-500">{player.name} | Attack | {player.attack}</p>
						<p class="text-tertiary-500">VS</p>
						<p class="text-secondary-500">
							{defendingPlayer.name} | Defense | {defendingPlayer.defense}
						</p>
					</div>

					{#if winningPlayer}
						<div
							class="card preset-tonal-surface mt-5 flex items-center justify-center gap-3 p-4 text-lg font-bold"
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
