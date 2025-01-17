<script module lang="ts">
</script>

<script lang="ts">
	import type { WheelBase } from '$lib/game/wheels/wheels';
	import { currentGame, removeCustomWheel } from '$lib/stores/gameStore.svelte';
	import { currentAttackWindow } from '../game/AttackPlayer.svelte';
	import CustomWheel from './CustomWheel.svelte';

	let showWheel = $derived((currentGame.value?.customWheels.size ?? 0) > 0);
	let position = $derived(!showWheel ? '-translate-x-full' : 'translate-x-0');

	let currentWheel = $state(
		currentGame.value?.customWheels.entries().next().value as [string, WheelBase] | undefined
	);

	let amountOfWheels = $derived(currentGame.value?.customWheels.size ?? 0);

	function getWheel() {
		currentWheel ??= currentGame.value?.customWheels.entries().next().value as [string, WheelBase];
	}

	function wheelComplete(key?: [string, WheelBase]) {
		if (!key) return;
		currentWheel = undefined;
		removeCustomWheel(key?.[0]);
		getWheel();
		if (!currentWheel && amountOfWheels === 0 && currentAttackWindow) {
			currentAttackWindow.close();
		}
	}

	$effect(() => {
		if (!currentGame.value) return;
		getWheel();
	});
</script>

<div
	class="bg-surface-100-800-token fixed bottom-0 left-0 top-0 z-50 w-full rounded border border-white p-4 transition-all lg:w-[80vw] {position}"
>
	{#key currentWheel}
		{#if currentWheel}
			<CustomWheel
				key={currentWheel[0]}
				wheel={currentWheel[1]}
				onComplete={() => wheelComplete(currentWheel)}
			/>
		{/if}
	{/key}
</div>
