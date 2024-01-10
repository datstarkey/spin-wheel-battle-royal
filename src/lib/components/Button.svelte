<script lang="ts">
	import Icon from './Icon.svelte';

	export let icon: string | undefined = undefined;

	$: type = !icon ? 'btn' : 'btn-icon';
</script>

<button on:click type="button" {...$$restProps} class="{type} variant-filled {$$restProps.class}">
	{#if icon}
		<Icon {icon} size="xl" />
	{/if}
	<slot />
</button>
