<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label: string;
		value: any;
	}
	let { label, value = $bindable(), ...inputProps }: Props = $props();
</script>

<label class="label">
	<span>{label}</span>
	<input class="input" bind:value {...inputProps} />
</label>
