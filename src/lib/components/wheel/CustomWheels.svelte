<script module lang="ts">
</script>

<script lang="ts">
	import type { CustomWheelConfig } from '$lib/game/wheels/wheels';
	import { currentGame, removeCustomWheel } from '$lib/stores/gameStore.svelte';
	import { currentAttackWindow } from '../game/AttackPlayer.svelte';
	import CustomWheel from './CustomWheel.svelte';

	let showWheel = $derived((currentGame.value?.customWheels.size ?? 0) > 0);

	let currentWheel = $state(
		currentGame.value?.customWheels.entries().next().value as [string, CustomWheelConfig] | undefined
	);

	let amountOfWheels = $derived(currentGame.value?.customWheels.size ?? 0);

	function getWheel() {
		currentWheel ??= currentGame.value?.customWheels.entries().next().value as [string, CustomWheelConfig];
	}

	function wheelComplete(key?: [string, CustomWheelConfig]) {
		if (!key) return;
		currentWheel = undefined;
		removeCustomWheel(key?.[0]);
		getWheel();
		if (!currentWheel && amountOfWheels === 0 && currentAttackWindow) {
			currentAttackWindow.close();
		}
	}

	function cancelWheel(key?: [string, CustomWheelConfig]) {
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

<!-- Epic Backdrop with animated effects -->
{#if showWheel}
	<div class="fixed inset-0 z-9998 bg-black/85 backdrop-blur-sm transition-opacity duration-300">
		<!-- Animated radial pulse -->
		<div
			class="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1)_0%,transparent_70%)]"
		></div>
		<!-- Scan lines overlay -->
		<div
			class="pointer-events-none absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]"
		></div>
		<!-- Corner vignette -->
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]"
		></div>
	</div>
{/if}

<!-- Main wheel container -->
<div
	class="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden p-4 transition-all duration-500 {showWheel
		? 'opacity-100 scale-100'
		: 'pointer-events-none opacity-0 scale-95'}"
>
	{#key currentWheel}
		{#if currentWheel}
			<div
				class="relative max-h-[100dvh] w-full max-w-4xl overflow-hidden rounded-xl border-2 border-primary-500/30 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 shadow-[0_0_80px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
			>
				<!-- Top decorative bar -->
				<div
					class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"
				></div>

				<!-- Corner accents -->
				<div class="pointer-events-none absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 border-primary-500/50"></div>
				<div class="pointer-events-none absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-primary-500/50"></div>
				<div class="pointer-events-none absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-primary-500/50"></div>
				<div class="pointer-events-none absolute right-0 bottom-0 h-8 w-8 border-r-2 border-b-2 border-primary-500/50"></div>

				<!-- Wheel queue indicator -->
				{#if amountOfWheels > 1}
					<div class="absolute top-4 left-4 z-50 flex items-center gap-2 rounded-full border border-warning-500/30 bg-black/50 px-3 py-1 backdrop-blur-sm">
						<iconify-icon icon="mdi:layers-triple" class="text-warning-400"></iconify-icon>
						<span class="font-mono text-xs font-bold text-warning-400">{amountOfWheels} wheels queued</span>
					</div>
				{/if}

				<!-- Scrollable content area -->
				<div class="max-h-[95dvh] overflow-y-auto">
					<CustomWheel
						key={currentWheel[0]}
						wheel={currentWheel[1].items}
						theme={currentWheel[1].theme}
						onComplete={() => wheelComplete(currentWheel)}
						onCancel={() => cancelWheel(currentWheel)}
					/>
				</div>

				<!-- Bottom decorative bar -->
				<div
					class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary-500 to-transparent"
				></div>
			</div>
		{/if}
	{/key}
</div>
