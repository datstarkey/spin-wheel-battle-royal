<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		icon?: string | undefined;
		children?: import('svelte').Snippet;
		[key: string]: any;
	}

	let { icon = undefined, children, ...rest }: Props = $props();

	let type = $derived(!icon ? 'btn' : 'btn-icon');
</script>

<button type="button" {...rest} class="{type} preset-filled {rest.class}">
	{#if icon}
		<Icon {icon} size="xl" />
	{/if}
	{@render children?.()}
</button>
