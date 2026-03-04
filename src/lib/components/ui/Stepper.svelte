<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		value: number;
		onChange: (val: number) => void;
		icon: string;
		label: string;
		colorClass: string;
		min?: number;
		step?: number;
	}

	let { value, onChange, icon, label, colorClass, min, step }: Props = $props();

	let actualStep = $derived(step ?? 1);
</script>

<div
	class="group relative overflow-hidden rounded border border-white/10 bg-black/30 transition-all hover:border-white/20"
>
	<div class="flex items-center">
		<button
			type="button"
			class="text-surface-400 flex h-10 w-10 items-center justify-center border-r border-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95"
			onclick={() =>
				onChange(min !== undefined ? Math.max(min, value - actualStep) : value - actualStep)}
		>
			<Icon icon="mdi:minus" />
		</button>
		<div class="flex flex-1 flex-col items-center justify-center px-3 py-1.5">
			<div class="flex items-center gap-1.5">
				<Icon {icon} class="{colorClass} text-sm" />
				<span class="text-surface-100 text-lg font-bold tabular-nums">{value}</span>
			</div>
			<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
				>{label}</span
			>
		</div>
		<button
			type="button"
			class="text-surface-400 flex h-10 w-10 items-center justify-center border-l border-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95"
			onclick={() => onChange(value + actualStep)}
		>
			<Icon icon="mdi:plus" />
		</button>
	</div>
</div>
