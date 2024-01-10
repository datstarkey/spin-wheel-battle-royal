<script context="module" lang="ts">
	import 'iconify-icon';
</script>

<script lang="ts">
	export let icon: string;

	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

	export let onclick: (() => void) | undefined = undefined;

	$: role = onclick ? 'button' : 'img';

	const map = {
		sm: 'text-sm',
		md: 'text-md',
		lg: 'text-lg',
		xl: 'text-xl'
	};
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<iconify-icon
	{role}
	tabindex="0"
	{icon}
	class="{map[size]} {$$restProps.class}"
	on:click={() => {
		if (onclick) {
			onclick();
		}
	}}
></iconify-icon>
