<script lang="ts">
	import { getMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';
	import { getSocketStore } from '$lib/multiplayer/socketStore.svelte';

	const socket = getSocketStore();
	import { getAttackWindowStore } from '$lib/stores/attackWindowStore.svelte';
	import type { CustomWheelConfig } from '$lib/game/wheels/wheels';
	import CustomWheel from './CustomWheel.svelte';

	const mp = getMultiplayerStore();
	const attackStore = getAttackWindowStore();

	let myName = $derived(mp.myPlayerName);
	let isGM = $derived(mp.iAmGM);
	let mpWheels = $derived(mp.pendingWheels);
	let showWheel = $derived(mpWheels.length > 0);
	let amountOfWheels = $derived(mpWheels.length);
	let activeWheelData = $derived(mpWheels.length > 0 ? mpWheels[0] : undefined);

	// Derive the current wheel from pending wheels
	let activeWheel = $derived.by((): [string, CustomWheelConfig] | undefined => {
		if (!activeWheelData) return undefined;
		return [
			activeWheelData.key,
			{
				items: activeWheelData.items.map((i) => ({ label: i.label, weight: i.weight })),
				theme: activeWheelData.theme
			}
		];
	});

	// Can the current user spin this wheel?
	let canSpin = $derived(
		activeWheelData ? activeWheelData.forPlayerName === myName || isGM : false
	);
	let forPlayerName = $derived(activeWheelData?.forPlayerName ?? '');
	let shuffledOrder = $derived(activeWheelData?.shuffledOrder);
	let spinState = $derived(activeWheelData?.spinState);
	let spinParams = $derived(activeWheelData?.spinParams);

	/** Request server to pick winner and broadcast spin params to all clients */
	function requestSpin(key: string) {
		socket.requestWheelSpin(key);
	}

	/** After wheel lands, notify store so other clients see "Waiting for X to continue..." */
	function handleSpinComplete(key: string) {
		mp.setWheelLanded(key);
	}

	/** Confirm wheel result — map shuffled index back to original and send to server */
	function confirmResult(key: string, selectedIndex?: number) {
		if (selectedIndex !== undefined) {
			// Map shuffled display index back to original item index
			const order = activeWheelData?.shuffledOrder;
			const originalIndex = order ? order[selectedIndex] : selectedIndex;
			socket.sendWheelSpinResult(key, originalIndex);
		}
		// Don't locally remove — wait for server's room:wheel_dismiss

		const attackWindow = attackStore.current;
		if (amountOfWheels <= 1 && attackWindow) {
			attackWindow.close();
		}
	}
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
			class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] opacity-20"
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
		? 'scale-100 opacity-100'
		: 'pointer-events-none scale-95 opacity-0'}"
>
	{#key activeWheel}
		{#if activeWheel}
			<div
				class="border-primary-500/30 from-surface-950 via-surface-900 to-surface-950 relative max-h-[100dvh] w-full max-w-4xl overflow-hidden rounded-xl border-2 bg-gradient-to-br shadow-[0_0_80px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
			>
				<!-- Top decorative bar -->
				<div
					class="via-primary-500 absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent"
				></div>

				<!-- Corner accents -->
				<div
					class="border-primary-500/50 pointer-events-none absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2"
				></div>
				<div
					class="border-primary-500/50 pointer-events-none absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2"
				></div>
				<div
					class="border-primary-500/50 pointer-events-none absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2"
				></div>
				<div
					class="border-primary-500/50 pointer-events-none absolute right-0 bottom-0 h-8 w-8 border-r-2 border-b-2"
				></div>

				<!-- Wheel queue indicator -->
				{#if amountOfWheels > 1}
					<div
						class="border-warning-500/30 absolute top-4 left-4 z-50 flex items-center gap-2 rounded-full border bg-black/50 px-3 py-1 backdrop-blur-sm"
					>
						<iconify-icon icon="mdi:layers-triple" class="text-warning-400"></iconify-icon>
						<span class="text-warning-400 font-mono text-xs font-bold"
							>{amountOfWheels} wheels queued</span
						>
					</div>
				{/if}

				<!-- Scrollable content area -->
				<div class="max-h-[95dvh] overflow-y-auto">
					<CustomWheel
						key={activeWheel[0]}
						wheel={activeWheel[1].items}
						theme={activeWheel[1].theme}
						skipOnWin={true}
						{canSpin}
						{forPlayerName}
						{shuffledOrder}
						{spinState}
						{spinParams}
						onRequestSpin={() => requestSpin(activeWheel[0])}
						onSpinComplete={() => handleSpinComplete(activeWheel[0])}
						onComplete={(selectedIndex) => confirmResult(activeWheel[0], selectedIndex)}
						onCancel={canSpin ? () => confirmResult(activeWheel[0]) : undefined}
					/>
				</div>

				<!-- Bottom decorative bar -->
				<div
					class="via-secondary-500 absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent"
				></div>
			</div>
		{/if}
	{/key}
</div>
