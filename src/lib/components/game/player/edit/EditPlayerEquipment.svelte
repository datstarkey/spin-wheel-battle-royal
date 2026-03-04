<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import {
		mainhands,
		offhands,
		helms,
		chests,
		consumables,
		type MainHands,
		type OffHands,
		type Helms,
		type Chests,
		type Consumables
	} from '$lib/game/items/itemTypes';

	interface Props {
		player: Player;
	}

	let { player }: Props = $props();

	let selectedMainHand = $state<MainHands | ''>('');
	let selectedOffHand = $state<OffHands | ''>('');
	let selectedHelm = $state<Helms | ''>('');
	let selectedChest = $state<Chests | ''>('');
	let selectedConsumable = $state<Consumables | ''>('');

	function addEquipment(type: 'mainhand' | 'offHand' | 'helm' | 'chest' | 'consumable') {
		switch (type) {
			case 'mainhand':
				if (selectedMainHand) {
					player.gear.addItem(selectedMainHand);
					selectedMainHand = '';
				}
				break;
			case 'offHand':
				if (selectedOffHand) {
					player.gear.addItem(selectedOffHand);
					selectedOffHand = '';
				}
				break;
			case 'helm':
				if (selectedHelm) {
					player.gear.addItem(selectedHelm);
					selectedHelm = '';
				}
				break;
			case 'chest':
				if (selectedChest) {
					player.gear.addItem(selectedChest);
					selectedChest = '';
				}
				break;
			case 'consumable':
				if (selectedConsumable) {
					player.gear.addItem(selectedConsumable);
					selectedConsumable = '';
				}
				break;
		}
	}
</script>

{#snippet equipmentSlot(
	icon: string,
	label: string,
	colorClass: string,
	currentItem: string | null,
	onRemove: () => void
)}
	<div class="flex items-center gap-2 rounded border border-white/10 bg-black/20 px-2 py-1.5">
		<Icon {icon} class="{colorClass} text-sm" />
		<span class="text-surface-500 text-[0.65rem] font-semibold tracking-widest uppercase"
			>{label}</span
		>
		{#if currentItem}
			<span class="text-surface-200 ml-auto text-xs">{currentItem}</span>
			<button
				type="button"
				class="text-surface-500 hover:text-error-400 transition-colors"
				onclick={onRemove}
			>
				<Icon icon="mdi:close" class="text-xs" />
			</button>
		{:else}
			<span class="text-surface-600 ml-auto text-xs italic">Empty</span>
		{/if}
	</div>
{/snippet}

<!-- Divider: Equipment -->
<div class="flex items-center gap-3">
	<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
	<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
		>Equipment</span
	>
	<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
</div>

<!-- Current Equipment -->
<div class="grid grid-cols-2 gap-2">
	{@render equipmentSlot('mdi:sword', 'Main', 'text-primary-400', player.gear.mainHand, () =>
		player.gear.unequipItem('mainhand')
	)}
	{@render equipmentSlot(
		'mdi:shield-half-full',
		'Off',
		'text-secondary-400',
		player.gear.offHand,
		() => player.gear.unequipItem('offHand')
	)}
	{@render equipmentSlot(
		'game-icons:crested-helmet',
		'Helm',
		'text-tertiary-400',
		player.gear.helm,
		() => player.gear.unequipItem('helm')
	)}
	{@render equipmentSlot('mdi:tshirt-crew', 'Chest', 'text-warning-400', player.gear.chest, () =>
		player.gear.unequipItem('chest')
	)}
</div>

<!-- Add Equipment Dropdowns -->
<div class="grid grid-cols-2 gap-2">
	<div class="flex gap-1">
		<select class="select flex-1 text-xs" bind:value={selectedMainHand}>
			<option value="">+ Main Hand</option>
			{#each Object.keys(mainhands) as item (item)}
				<option value={item}>{item}</option>
			{/each}
		</select>
		<button
			type="button"
			class="text-surface-400 hover:border-primary-500/50 hover:bg-primary-500/20 rounded border border-white/10 bg-black/30 px-2 transition-all hover:text-white disabled:opacity-30"
			disabled={!selectedMainHand}
			onclick={() => addEquipment('mainhand')}
		>
			<Icon icon="mdi:plus" />
		</button>
	</div>
	<div class="flex gap-1">
		<select class="select flex-1 text-xs" bind:value={selectedOffHand}>
			<option value="">+ Off Hand</option>
			{#each Object.keys(offhands) as item (item)}
				<option value={item}>{item}</option>
			{/each}
		</select>
		<button
			type="button"
			class="text-surface-400 hover:border-secondary-500/50 hover:bg-secondary-500/20 rounded border border-white/10 bg-black/30 px-2 transition-all hover:text-white disabled:opacity-30"
			disabled={!selectedOffHand}
			onclick={() => addEquipment('offHand')}
		>
			<Icon icon="mdi:plus" />
		</button>
	</div>
	<div class="flex gap-1">
		<select class="select flex-1 text-xs" bind:value={selectedHelm}>
			<option value="">+ Helm</option>
			{#each Object.keys(helms) as item (item)}
				<option value={item}>{item}</option>
			{/each}
		</select>
		<button
			type="button"
			class="text-surface-400 hover:border-tertiary-500/50 hover:bg-tertiary-500/20 rounded border border-white/10 bg-black/30 px-2 transition-all hover:text-white disabled:opacity-30"
			disabled={!selectedHelm}
			onclick={() => addEquipment('helm')}
		>
			<Icon icon="mdi:plus" />
		</button>
	</div>
	<div class="flex gap-1">
		<select class="select flex-1 text-xs" bind:value={selectedChest}>
			<option value="">+ Chest</option>
			{#each Object.keys(chests) as item (item)}
				<option value={item}>{item}</option>
			{/each}
		</select>
		<button
			type="button"
			class="text-surface-400 hover:border-warning-500/50 hover:bg-warning-500/20 rounded border border-white/10 bg-black/30 px-2 transition-all hover:text-white disabled:opacity-30"
			disabled={!selectedChest}
			onclick={() => addEquipment('chest')}
		>
			<Icon icon="mdi:plus" />
		</button>
	</div>
</div>

<!-- Divider: Consumables -->
<div class="flex items-center gap-3">
	<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
	<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
		>Consumables</span
	>
	<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
</div>

<!-- Current Consumables -->
{#if player.gear.consumables.length > 0}
	<div class="flex flex-wrap gap-1">
		{#each player.gear.consumables as item, index (index)}
			<div class="flex items-center gap-1 rounded border border-white/10 bg-black/20 px-2 py-1">
				<Icon icon="iconoir:consumable" class="text-success-400 text-xs" />
				<span class="text-surface-200 text-xs">{item}</span>
				<button
					type="button"
					class="text-surface-500 hover:text-error-400 transition-colors"
					onclick={() => player.gear.deleteItem('consumables', index)}
				>
					<Icon icon="mdi:close" class="text-xs" />
				</button>
			</div>
		{/each}
	</div>
{/if}

<!-- Add Consumable -->
<div class="flex gap-1">
	<select class="select flex-1 text-xs" bind:value={selectedConsumable}>
		<option value="">+ Add Consumable</option>
		{#each Object.keys(consumables) as item (item)}
			<option value={item}>{item}</option>
		{/each}
	</select>
	<button
		type="button"
		class="text-surface-400 hover:border-success-500/50 hover:bg-success-500/20 rounded border border-white/10 bg-black/30 px-3 transition-all hover:text-white disabled:opacity-30"
		disabled={!selectedConsumable}
		onclick={() => addEquipment('consumable')}
	>
		<Icon icon="mdi:plus" />
	</button>
</div>
