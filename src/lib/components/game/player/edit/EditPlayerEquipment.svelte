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

	type EquipmentSlotKey = 'mainhand' | 'offHand' | 'helm' | 'chest';
	type EquipmentSelectionKey = EquipmentSlotKey | 'consumable';
	type EquipmentSelections = {
		mainhand: MainHands | '';
		offHand: OffHands | '';
		helm: Helms | '';
		chest: Chests | '';
		consumable: Consumables | '';
	};

	interface Props {
		player: Player;
	}

	let { player }: Props = $props();

	let selectedItems = $state<EquipmentSelections>({
		mainhand: '',
		offHand: '',
		helm: '',
		chest: '',
		consumable: ''
	});

	const equipmentSlots: {
		key: EquipmentSlotKey;
		gearKey: 'mainHand' | 'offHand' | 'helm' | 'chest';
		placeholder: string;
		label: string;
		icon: string;
		colorClass: string;
		buttonClass: string;
		options: string[];
	}[] = [
		{
			key: 'mainhand',
			gearKey: 'mainHand',
			placeholder: '+ Main Hand',
			label: 'Main',
			icon: 'mdi:sword',
			colorClass: 'text-primary-400',
			buttonClass:
				'text-surface-400 hover:border-primary-500/50 hover:bg-primary-500/20 rounded border border-white/10 bg-black/30 px-2 transition-all hover:text-white disabled:opacity-30',
			options: Object.keys(mainhands)
		},
		{
			key: 'offHand',
			gearKey: 'offHand',
			placeholder: '+ Off Hand',
			label: 'Off',
			icon: 'mdi:shield-half-full',
			colorClass: 'text-secondary-400',
			buttonClass:
				'text-surface-400 hover:border-secondary-500/50 hover:bg-secondary-500/20 rounded border border-white/10 bg-black/30 px-2 transition-all hover:text-white disabled:opacity-30',
			options: Object.keys(offhands)
		},
		{
			key: 'helm',
			gearKey: 'helm',
			placeholder: '+ Helm',
			label: 'Helm',
			icon: 'game-icons:crested-helmet',
			colorClass: 'text-tertiary-400',
			buttonClass:
				'text-surface-400 hover:border-tertiary-500/50 hover:bg-tertiary-500/20 rounded border border-white/10 bg-black/30 px-2 transition-all hover:text-white disabled:opacity-30',
			options: Object.keys(helms)
		},
		{
			key: 'chest',
			gearKey: 'chest',
			placeholder: '+ Chest',
			label: 'Chest',
			icon: 'mdi:tshirt-crew',
			colorClass: 'text-warning-400',
			buttonClass:
				'text-surface-400 hover:border-warning-500/50 hover:bg-warning-500/20 rounded border border-white/10 bg-black/30 px-2 transition-all hover:text-white disabled:opacity-30',
			options: Object.keys(chests)
		}
	];

	const consumableConfig = {
		key: 'consumable' as const,
		placeholder: '+ Add Consumable',
		buttonClass:
			'text-surface-400 hover:border-success-500/50 hover:bg-success-500/20 rounded border border-white/10 bg-black/30 px-3 transition-all hover:text-white disabled:opacity-30',
		options: Object.keys(consumables)
	};

	function addEquipment(type: EquipmentSelectionKey) {
		const item = selectedItems[type];
		if (!item) return;

		player.gear.addItem(item);
		selectedItems[type] = '';
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
	{#each equipmentSlots as slot (slot.key)}
		{@render equipmentSlot(
			slot.icon,
			slot.label,
			slot.colorClass,
			player.gear[slot.gearKey],
			() => player.gear.unequipItem(slot.key)
		)}
	{/each}
</div>

<!-- Add Equipment Dropdowns -->
<div class="grid grid-cols-2 gap-2">
	{#each equipmentSlots as slot (slot.key)}
		<div class="flex gap-1">
			<select class="select flex-1 text-xs" bind:value={selectedItems[slot.key]}>
				<option value="">{slot.placeholder}</option>
				{#each slot.options as item (item)}
					<option value={item}>{item}</option>
				{/each}
			</select>
			<button
				type="button"
				class={slot.buttonClass}
				disabled={!selectedItems[slot.key]}
				onclick={() => addEquipment(slot.key)}
			>
				<Icon icon="mdi:plus" />
			</button>
		</div>
	{/each}
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
	<select class="select flex-1 text-xs" bind:value={selectedItems[consumableConfig.key]}>
		<option value="">{consumableConfig.placeholder}</option>
		{#each consumableConfig.options as item (item)}
			<option value={item}>{item}</option>
		{/each}
	</select>
	<button
		type="button"
		class={consumableConfig.buttonClass}
		disabled={!selectedItems[consumableConfig.key]}
		onclick={() => addEquipment(consumableConfig.key)}
	>
		<Icon icon="mdi:plus" />
	</button>
</div>
