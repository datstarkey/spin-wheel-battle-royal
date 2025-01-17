<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Props extends HTMLSelectAttributes {
		label: string;
		value: any;
	}
	let { value = $bindable(), label, ...props }: Props = $props();
</script>

<label class="label">
	<span>{label}</span>
	<select class="select" bind:value>
		{@render props.children?.()}
	</select>
</label>
