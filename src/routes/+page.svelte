<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import GameOnboarding from '$lib/components/game/GameOnboarding.svelte';
	import Players from '$lib/components/game/Players.svelte';
	import CustomWheels from '$lib/components/wheel/CustomWheels.svelte';
	import { currentGame, resetGame } from '$lib/stores/gameStore.svelte';
</script>

{#if !currentGame.value}
	<h2 class="mb-5">Welcome</h2>
	<Button onclick={() => resetGame()}>Start New Game</Button>
{:else if !currentGame.value.started}
	<GameOnboarding />
{:else}
	<Players />
	<CustomWheels />
{/if}
