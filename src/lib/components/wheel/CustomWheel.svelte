<script lang="ts">
	import type { PendingWheelPayload } from '#lib/multiplayer/types.js';
	import { getMultiplayerStore } from '#lib/multiplayer/multiplayerStore.svelte.js';
	import { getSocketStore } from '#lib/multiplayer/socketStore.svelte.js';
	import SlotReel from './SlotReel.svelte';
	import WheelStage from './WheelStage.svelte';
	import type { WheelPhase } from './types';
	import { WHEEL_THEMES, themeFromKey } from './wheelThemes';

	interface Props {
		wheel: PendingWheelPayload;
		queued: number;
	}

	let { wheel, queued }: Props = $props();

	const mp = getMultiplayerStore();
	const socket = getSocketStore();

	let result = $state<string>();
	let phase = $derived<WheelPhase>(result ? 'landed' : wheel.spinParams ? 'spinning' : 'ready');
	let canSpin = $derived(wheel.forPlayerName === mp.myPlayerName || mp.iAmGM);
	let theme = $derived(WHEEL_THEMES[wheel.theme ?? themeFromKey(wheel.key)]);
</script>

<WheelStage
	{theme}
	{phase}
	{result}
	{canSpin}
	{queued}
	spinnerName={wheel.forPlayerName}
	onSpin={() => socket.requestWheelSpin(wheel.key)}
	onContinue={() => socket.confirmWheel(wheel.key)}
>
	<SlotReel
		labels={wheel.items.map((item) => item.label)}
		shuffledOrder={wheel.shuffledOrder}
		spinParams={wheel.spinParams}
		accent={theme.accent}
		onLanded={(label) => (result = label)}
	/>
</WheelStage>
