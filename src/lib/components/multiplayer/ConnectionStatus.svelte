<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';

	const mp = getMultiplayerStore();

	let status = $derived(mp.connectionStatus);
	let roomCode = $derived(mp.roomCode);
	let playerCount = $derived(mp.connectedPlayers.filter((p) => p.connected).length);
	let show = $derived(mp.isConnected);

	const statusConfig = $derived.by(() => {
		switch (status) {
			case 'connected':
				return {
					color: 'text-success-400',
					bg: 'bg-success-500/20',
					icon: 'mdi:wifi',
					label: 'Connected'
				};
			case 'connecting':
				return {
					color: 'text-warning-400',
					bg: 'bg-warning-500/20',
					icon: 'mdi:wifi-strength-1',
					label: 'Connecting...'
				};
			case 'reconnecting':
				return {
					color: 'text-warning-400',
					bg: 'bg-warning-500/20',
					icon: 'mdi:wifi-off',
					label: 'Reconnecting...'
				};
			default:
				return {
					color: 'text-error-400',
					bg: 'bg-error-500/20',
					icon: 'mdi:wifi-off',
					label: 'Disconnected'
				};
		}
	});
</script>

{#if show}
	<div
		class="border-surface-500/30 flex items-center gap-2 rounded border {statusConfig.bg} px-3 py-1.5 text-sm"
	>
		<Icon icon={statusConfig.icon} class="{statusConfig.color} text-base" />
		{#if roomCode}
			<span class="text-surface-200 font-mono font-bold">{roomCode}</span>
			<span class="text-surface-500">|</span>
		{/if}
		<span class={statusConfig.color}>{playerCount} online</span>
	</div>
{/if}
