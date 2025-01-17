<script lang="ts">
	import AddPlayerStep from '../lib/components/game/initalizationSteps/AddPlayerStep.svelte';

	import Button from '$lib/components/Button.svelte';
	import AddPlayerButton from '$lib/components/game/AddPlayerButton.svelte';
	import ChooseClasses from '$lib/components/game/initalizationSteps/ChooseClasses.svelte';
	import ChooseGameOrder from '$lib/components/game/initalizationSteps/ChooseGameOrder.svelte';
	import Players from '$lib/components/game/Players.svelte';
	import CustomWheels from '$lib/components/wheel/CustomWheels.svelte';
	import { currentGame, resetGame, startGame } from '$lib/stores/gameStore.svelte';
	import { Step, Stepper } from '@skeletonlabs/skeleton';
</script>

{#if !currentGame.value}
	<h2 class="mb-5">Welcome</h2>
	<Button onclick={() => resetGame()}>Start New Game</Button>
{/if}

{#if currentGame.value && !currentGame.value.started && currentGame.value.players.length}
	<div class="w-full max-w-lg">
		<Stepper on:complete={startGame}>
			<Step locked={currentGame.value.players.length < 2}>
				<div class="mb-5 flex items-center justify-between gap-3">
					<h2>Players</h2>

					{#if currentGame.value.players.length < 2}
						<p class="text-error-500">Requires at least 2 players to play</p>
					{/if}
				</div>

				<AddPlayerStep></AddPlayerStep>

				<AddPlayerButton></AddPlayerButton>
			</Step>
			<Step
				locked={currentGame.value.players.length !==
					Object.keys(currentGame.value.playerOrder).length}
			>
				<ChooseGameOrder></ChooseGameOrder>
			</Step>

			<Step locked={currentGame.value.players.some((x) => x.class.name == 'None')}>
				<ChooseClasses></ChooseClasses>
			</Step>
		</Stepper>
	</div>
{:else}
	<CustomWheels></CustomWheels>
	<Players></Players>
{/if}
