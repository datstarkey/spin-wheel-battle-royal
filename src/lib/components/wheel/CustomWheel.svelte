<script lang="ts">
	import type { WheelBase } from '$lib/game/wheels/wheels';
	import Button from '../Button.svelte';
	import SpinWheel from './SpinWheel.svelte';

	interface Props {
		key: string;
		wheel: WheelBase;

		onComplete: () => void;
	}

	let { key, wheel, onComplete }: Props = $props();

	let hasWon = $state(false);
</script>

<h1 class="mb-5 text-center">{key}</h1>
<SpinWheel items={wheel} buttonText="Spin" showSpin={!hasWon} onWinner={() => (hasWon = true)}
></SpinWheel>

{#if hasWon}
	<Button class=" mt-6 w-full" onclick={() => onComplete()}>Continue</Button>
{/if}
