<script lang="ts">
	import AddPlayerStep from '../lib/components/game/initalizationSteps/AddPlayerStep.svelte';

	import Button from '$lib/components/Button.svelte';
	import AddPlayerButton from '$lib/components/game/AddPlayerButton.svelte';
	import ChooseGameOrder from '$lib/components/game/initalizationSteps/ChooseGameOrder.svelte';
	import { currentGame, resetGame, startGame } from '$lib/stores/gameStore';
	import { Step, Stepper } from '@skeletonlabs/skeleton';
	import ChooseClasses from '$lib/components/game/initalizationSteps/ChooseClasses.svelte';
	import Players from '$lib/components/game/Players.svelte';
	import CustomWheels from '$lib/components/wheel/CustomWheels.svelte';

	$: console.log($currentGame);
</script>

{#if !$currentGame}
	<h2 class="mb-5">Welcome</h2>
	<Button on:click={() => resetGame()}>Start New Game</Button>
{/if}

{#if $currentGame && !$currentGame?.started}
	<div class="w-full max-w-lg">
		<Stepper on:complete={startGame}>
			<Step locked={$currentGame.players.length < 2}>
				<div class="mb-5 flex items-center justify-between gap-3">
					<h2>Players</h2>

					{#if $currentGame.players.length < 2}
						<p class="text-error-500">Requires at least 2 players to play</p>
					{/if}
				</div>

				<AddPlayerStep></AddPlayerStep>

				<AddPlayerButton></AddPlayerButton>
			</Step>
			<Step locked={$currentGame.players.length !== Object.keys($currentGame.playerOrder).length}>
				<ChooseGameOrder></ChooseGameOrder>
			</Step>

			<Step locked={$currentGame.players.some((x) => x.class.name == 'None')}>
				<ChooseClasses></ChooseClasses>
			</Step>
		</Stepper>
	</div>
{:else}
	<CustomWheels></CustomWheels>
	<Players></Players>
{/if}
