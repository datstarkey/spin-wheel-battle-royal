<script lang="ts">
	import type { WheelBase } from '$lib/game/wheels/wheels';
	import Button from '../Button.svelte';
	import SpinWheel from './SpinWheel.svelte';

	export let key: string;
	export let wheel: WheelBase;

	export let onComplete: () => void;

	let hasWon = false;
</script>

<h1 class="mb-5 text-center">{key}</h1>
<SpinWheel items={wheel} buttonText="Spin" onWinner={() => (hasWon = true)}></SpinWheel>

{#if hasWon}
	<Button on:click={() => onComplete()}>Continue</Button>
{/if}
