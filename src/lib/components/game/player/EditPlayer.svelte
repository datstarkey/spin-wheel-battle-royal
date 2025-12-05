<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import { classMap } from '$lib/game/classes/classType';
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
	import type { Player } from '$lib/game/player/player.svelte';
	import statusEffects, { type StatusType } from '$lib/game/statuses/statusTypes';
	import { MANA_RESOURCE, MAX_MANA } from '$lib/game/wheels/spellWheels';
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	interface Props {
		player: Player;
	}
	let { player }: Props = $props();
	let modifiers = $derived(player.activeModifiers);
	let hasModifiers = $derived(
		Object.keys(modifiers.attack).length > 0 ||
			Object.keys(modifiers.defense).length > 0 ||
			Object.keys(modifiers.movement).length > 0 ||
			Object.keys(modifiers.attackRange).length > 0
	);

	// Dropdown selections
	let selectedStatus = $state<StatusType | ''>('');
	let selectedMainHand = $state<MainHands | ''>('');
	let selectedOffHand = $state<OffHands | ''>('');
	let selectedHelm = $state<Helms | ''>('');
	let selectedChest = $state<Chests | ''>('');
	let selectedConsumable = $state<Consumables | ''>('');

	function addStatus() {
		if (selectedStatus && player.statuses.canHaveStatus(selectedStatus)) {
			player.statuses.addStatus(selectedStatus);
			selectedStatus = '';
		}
	}

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

	// Get available statuses (ones the player can have and doesn't already have)
	let availableStatuses = $derived(
		Object.entries(statusEffects).filter(
			([key]) =>
				player.statuses.canHaveStatus(key as StatusType) &&
				!player.statuses.hasStatus(key as StatusType)
		)
	);
</script>

{#snippet stepper(
	value: number,
	onChange: (val: number) => void,
	icon: string,
	label: string,
	colorClass: string,
	min?: number,
	step?: number
)}
	{@const actualStep = step ?? 1}
	<div class="group relative overflow-hidden rounded border border-white/10 bg-black/30 transition-all hover:border-white/20">
		<div class="flex items-center">
			<button
				type="button"
				class="flex h-10 w-10 items-center justify-center border-r border-white/10 text-surface-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
				onclick={() => onChange(min !== undefined ? Math.max(min, value - actualStep) : value - actualStep)}
			>
				<Icon icon="mdi:minus" />
			</button>
			<div class="flex flex-1 flex-col items-center justify-center px-3 py-1.5">
				<div class="flex items-center gap-1.5">
					<Icon {icon} class="{colorClass} text-sm" />
					<span class="text-surface-100 text-lg font-bold tabular-nums">{value}</span>
				</div>
				<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">{label}</span>
			</div>
			<button
				type="button"
				class="flex h-10 w-10 items-center justify-center border-l border-white/10 text-surface-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
				onclick={() => onChange(value + actualStep)}
			>
				<Icon icon="mdi:plus" />
			</button>
		</div>
	</div>
{/snippet}

{#snippet statStepper(
	baseValue: number,
	totalValue: number,
	bonusValue: number,
	onChange: (val: number) => void,
	icon: string,
	label: string,
	colorClass: string
)}
	<div class="group relative overflow-hidden rounded border border-white/10 bg-black/30 transition-all hover:border-white/20">
		<div class="flex items-center">
			<button
				type="button"
				class="flex h-12 w-9 items-center justify-center border-r border-white/10 text-surface-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
				onclick={() => onChange(Math.max(0, baseValue - 1))}
			>
				<Icon icon="mdi:minus" />
			</button>
			<div class="flex flex-1 flex-col items-center justify-center px-2 py-1">
				<div class="flex items-center gap-1">
					<Icon {icon} class="{colorClass} text-xs" />
					<span class="text-surface-100 text-base font-bold tabular-nums">{totalValue}</span>
					{#if bonusValue !== 0}
						<span class="text-[0.6rem] {bonusValue > 0 ? 'text-success-400' : 'text-error-400'}">
							({bonusValue > 0 ? '+' : ''}{bonusValue})
						</span>
					{/if}
				</div>
				<div class="flex items-center gap-1">
					<span class="text-surface-500 text-[0.55rem] tracking-widest uppercase">{label}</span>
					<span class="text-surface-600 text-[0.5rem]">base: {baseValue}</span>
				</div>
			</div>
			<button
				type="button"
				class="flex h-12 w-9 items-center justify-center border-l border-white/10 text-surface-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
				onclick={() => onChange(baseValue + 1)}
			>
				<Icon icon="mdi:plus" />
			</button>
		</div>
	</div>
{/snippet}

{#snippet equipmentSlot(
	icon: string,
	label: string,
	colorClass: string,
	currentItem: string | null,
	onRemove: () => void
)}
	<div class="flex items-center gap-2 rounded border border-white/10 bg-black/20 px-2 py-1.5">
		<Icon {icon} class="{colorClass} text-sm" />
		<span class="text-surface-500 text-[0.65rem] font-semibold tracking-widest uppercase">{label}</span>
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

<PullOutMenu position="left" width="600px">
	{#snippet trigger(open)}
		<Button onclick={open} icon="mdi:cog" class="btn-icon-sm"></Button>
	{/snippet}

	<!-- Header -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary-500/50 bg-linear-to-br from-primary-500/20 to-primary-700/20 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
			<span class="text-xl font-black text-primary-400">{player.name.charAt(0).toUpperCase()}</span>
		</div>
		<div>
			<h1 class="text-surface-100 text-xl font-black tracking-wide uppercase">Edit {player.name}</h1>
			<span class="text-surface-500 text-xs font-semibold tracking-widest uppercase">{player.class.name}</span>
		</div>
	</div>

	<div class="space-y-4 overflow-y-auto pr-2">
		<!-- Class & Shadow Realm Row -->
		<div class="grid grid-cols-2 gap-3">
			<Select label="Class" bind:value={player.class}>
				{#each Object.entries(classMap) as [name, playerClass] (name)}
					<option value={playerClass}>{name}</option>
				{/each}
			</Select>

			<div class="flex items-end pb-1">
				<Switch
					checked={player.inShadowRealm}
					onCheckedChange={(details) => (player.inShadowRealm = details.checked)}
				>
					<Switch.Control class="data-[state=checked]:bg-tertiary-500">
						<Switch.Thumb />
					</Switch.Control>
					<Switch.Label class="flex items-center gap-2">
						<Icon icon="mdi:star-four-points" class="text-tertiary-400" />
						<span>Shadow Realm</span>
					</Switch.Label>
					<Switch.HiddenInput />
				</Switch>
			</div>
		</div>

		<!-- Class-Specific Resources -->
		{#if player.classType === 'magicman'}
			<!-- Magic Man: Always show Mana -->
			{@const mana = player.resources[MANA_RESOURCE] ?? 0}
			<div class="grid grid-cols-1 gap-3">
				<div class="group relative overflow-hidden rounded border border-tertiary-500/30 bg-tertiary-500/10 transition-all hover:border-tertiary-500/50">
					<div class="flex items-center">
						<button
							type="button"
							class="flex h-10 w-10 items-center justify-center border-r border-tertiary-500/20 text-tertiary-400 transition-all hover:bg-tertiary-500/20 hover:text-white active:scale-95"
							onclick={() => (player.resources[MANA_RESOURCE] = Math.max(0, mana - 10))}
						>
							<Icon icon="mdi:minus" />
						</button>
						<div class="flex flex-1 flex-col items-center justify-center px-3 py-1.5">
							<div class="flex items-center gap-1.5">
								<Icon icon="mdi:wizard-hat" class="text-tertiary-400 text-sm" />
								<span class="text-surface-100 text-lg font-bold tabular-nums">{mana}</span>
								<span class="text-tertiary-500 text-xs">/ {MAX_MANA}</span>
							</div>
							<span class="text-tertiary-400 text-[0.6rem] font-semibold tracking-widest uppercase">Mana</span>
						</div>
						<button
							type="button"
							class="flex h-10 w-10 items-center justify-center border-l border-tertiary-500/20 text-tertiary-400 transition-all hover:bg-tertiary-500/20 hover:text-white active:scale-95"
							onclick={() => (player.resources[MANA_RESOURCE] = Math.min(MAX_MANA, mana + 10))}
						>
							<Icon icon="mdi:plus" />
						</button>
					</div>
				</div>
			</div>
		{:else if player.classType === 'swe'}
			<!-- SWE: Always show SWEnergy -->
			{@const swenergy = player.resources['SWEnergy'] ?? 0}
			<div class="grid grid-cols-1 gap-3">
				<div class="group relative overflow-hidden rounded border border-secondary-500/30 bg-secondary-500/10 transition-all hover:border-secondary-500/50">
					<div class="flex items-center">
						<button
							type="button"
							class="flex h-10 w-10 items-center justify-center border-r border-secondary-500/20 text-secondary-400 transition-all hover:bg-secondary-500/20 hover:text-white active:scale-95"
							onclick={() => (player.resources['SWEnergy'] = Math.max(0, swenergy - 1))}
						>
							<Icon icon="mdi:minus" />
						</button>
						<div class="flex flex-1 flex-col items-center justify-center px-3 py-1.5">
							<div class="flex items-center gap-1.5">
								<Icon icon="mdi:code-braces" class="text-secondary-400 text-sm" />
								<span class="text-surface-100 text-lg font-bold tabular-nums">{swenergy}</span>
							</div>
							<span class="text-secondary-400 text-[0.6rem] font-semibold tracking-widest uppercase">SWEnergy</span>
						</div>
						<button
							type="button"
							class="flex h-10 w-10 items-center justify-center border-l border-secondary-500/20 text-secondary-400 transition-all hover:bg-secondary-500/20 hover:text-white active:scale-95"
							onclick={() => (player.resources['SWEnergy'] = swenergy + 1)}
						>
							<Icon icon="mdi:plus" />
						</button>
					</div>
				</div>
			</div>
		{:else if Object.keys(player.resources).length > 0}
			<!-- Other classes: Show generic resources if any -->
			<div class="grid grid-cols-2 gap-3">
				{#each Object.entries(player.resources) as [resource, amount] (resource)}
					{@render stepper(
						amount,
						(val) => (player.resources[resource] = val),
						'mdi:cube-outline',
						resource,
						'text-teal-400',
						0
					)}
				{/each}
			</div>
		{/if}

		<!-- Divider: Vitals -->
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
			<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">Vitals</span>
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
		</div>

		<!-- HP & Gold -->
		<div class="grid grid-cols-2 gap-3">
			{@render stepper(player.hp, (val) => (player.hp = val), 'mdi:heart', 'HP', 'text-error-400', 0)}
			{@render stepper(player.gold, (val) => (player.gold = val), 'mdi:coin', 'Gold', 'text-warning-400', 0)}
		</div>

		<!-- Divider: Combat Stats -->
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
			<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">Combat Stats</span>
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
		</div>

		<!-- Combat Stats Grid -->
		<div class="grid grid-cols-2 gap-3">
			{@render statStepper(
				player.baseAttack,
				player.attack,
				player.bonusAttack,
				(val) => (player.baseAttack = val),
				'mdi:sword',
				'Attack',
				'text-primary-400'
			)}
			{@render statStepper(
				player.baseDefense,
				player.defense,
				player.bonusDefense,
				(val) => (player.baseDefense = val),
				'mdi:shield',
				'Defense',
				'text-secondary-400'
			)}
			{@render statStepper(
				player.baseMovement,
				player.movement,
				player.bonusMovement,
				(val) => (player.baseMovement = val),
				'ion:footsteps',
				'Movement',
				'text-success-400'
			)}
			{@render statStepper(
				player.baseAttackRange,
				player.attackRange,
				player.bonusAttackRange,
				(val) => (player.baseAttackRange = val),
				'material-symbols:social-distance',
				'Range',
				'text-warning-400'
			)}
		</div>

		<!-- Active Modifiers -->
		{#if hasModifiers}
			<div class="rounded border border-white/10 bg-black/20 p-3">
				<div class="text-surface-400 mb-2 flex items-center gap-2 text-[0.65rem] font-semibold tracking-widest uppercase">
					<Icon icon="mdi:tune-variant" class="text-xs" />
					<span>Active Modifiers</span>
				</div>
				<div class="grid gap-1 text-xs">
					{#if Object.keys(modifiers.attack).length > 0}
						<div class="flex items-center gap-2">
							<Icon icon="mdi:sword" class="text-primary-400 text-xs" />
							<span class="text-surface-400">ATK:</span>
							<span class="text-surface-300 font-mono">{JSON.stringify(modifiers.attack)}</span>
						</div>
					{/if}
					{#if Object.keys(modifiers.defense).length > 0}
						<div class="flex items-center gap-2">
							<Icon icon="mdi:shield" class="text-secondary-400 text-xs" />
							<span class="text-surface-400">DEF:</span>
							<span class="text-surface-300 font-mono">{JSON.stringify(modifiers.defense)}</span>
						</div>
					{/if}
					{#if Object.keys(modifiers.movement).length > 0}
						<div class="flex items-center gap-2">
							<Icon icon="ion:footsteps" class="text-success-400 text-xs" />
							<span class="text-surface-400">MOV:</span>
							<span class="text-surface-300 font-mono">{JSON.stringify(modifiers.movement)}</span>
						</div>
					{/if}
					{#if Object.keys(modifiers.attackRange).length > 0}
						<div class="flex items-center gap-2">
							<Icon icon="material-symbols:social-distance" class="text-warning-400 text-xs" />
							<span class="text-surface-400">RNG:</span>
							<span class="text-surface-300 font-mono">{JSON.stringify(modifiers.attackRange)}</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Divider: Equipment -->
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
			<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">Equipment</span>
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
		</div>

		<!-- Current Equipment -->
		<div class="grid grid-cols-2 gap-2">
			{@render equipmentSlot('mdi:sword', 'Main', 'text-primary-400', player.gear.mainHand, () => player.gear.unequipItem('mainhand'))}
			{@render equipmentSlot('mdi:shield-half-full', 'Off', 'text-secondary-400', player.gear.offHand, () => player.gear.unequipItem('offHand'))}
			{@render equipmentSlot('game-icons:crested-helmet', 'Helm', 'text-tertiary-400', player.gear.helm, () => player.gear.unequipItem('helm'))}
			{@render equipmentSlot('mdi:tshirt-crew', 'Chest', 'text-warning-400', player.gear.chest, () => player.gear.unequipItem('chest'))}
		</div>

		<!-- Add Equipment Dropdowns -->
		<div class="grid grid-cols-2 gap-2">
			<div class="flex gap-1">
				<select
					class="select flex-1 text-xs"
					bind:value={selectedMainHand}
				>
					<option value="">+ Main Hand</option>
					{#each Object.keys(mainhands) as item (item)}
						<option value={item}>{item}</option>
					{/each}
				</select>
				<button
					type="button"
					class="rounded border border-white/10 bg-black/30 px-2 text-surface-400 transition-all hover:border-primary-500/50 hover:bg-primary-500/20 hover:text-white disabled:opacity-30"
					disabled={!selectedMainHand}
					onclick={() => addEquipment('mainhand')}
				>
					<Icon icon="mdi:plus" />
				</button>
			</div>
			<div class="flex gap-1">
				<select
					class="select flex-1 text-xs"
					bind:value={selectedOffHand}
				>
					<option value="">+ Off Hand</option>
					{#each Object.keys(offhands) as item (item)}
						<option value={item}>{item}</option>
					{/each}
				</select>
				<button
					type="button"
					class="rounded border border-white/10 bg-black/30 px-2 text-surface-400 transition-all hover:border-secondary-500/50 hover:bg-secondary-500/20 hover:text-white disabled:opacity-30"
					disabled={!selectedOffHand}
					onclick={() => addEquipment('offHand')}
				>
					<Icon icon="mdi:plus" />
				</button>
			</div>
			<div class="flex gap-1">
				<select
					class="select flex-1 text-xs"
					bind:value={selectedHelm}
				>
					<option value="">+ Helm</option>
					{#each Object.keys(helms) as item (item)}
						<option value={item}>{item}</option>
					{/each}
				</select>
				<button
					type="button"
					class="rounded border border-white/10 bg-black/30 px-2 text-surface-400 transition-all hover:border-tertiary-500/50 hover:bg-tertiary-500/20 hover:text-white disabled:opacity-30"
					disabled={!selectedHelm}
					onclick={() => addEquipment('helm')}
				>
					<Icon icon="mdi:plus" />
				</button>
			</div>
			<div class="flex gap-1">
				<select
					class="select flex-1 text-xs"
					bind:value={selectedChest}
				>
					<option value="">+ Chest</option>
					{#each Object.keys(chests) as item (item)}
						<option value={item}>{item}</option>
					{/each}
				</select>
				<button
					type="button"
					class="rounded border border-white/10 bg-black/30 px-2 text-surface-400 transition-all hover:border-warning-500/50 hover:bg-warning-500/20 hover:text-white disabled:opacity-30"
					disabled={!selectedChest}
					onclick={() => addEquipment('chest')}
				>
					<Icon icon="mdi:plus" />
				</button>
			</div>
		</div>

		<!-- Divider: Consumables -->
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
			<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">Consumables</span>
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
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
			<select
				class="select flex-1 text-xs"
				bind:value={selectedConsumable}
			>
				<option value="">+ Add Consumable</option>
				{#each Object.keys(consumables) as item (item)}
					<option value={item}>{item}</option>
				{/each}
			</select>
			<button
				type="button"
				class="rounded border border-white/10 bg-black/30 px-3 text-surface-400 transition-all hover:border-success-500/50 hover:bg-success-500/20 hover:text-white disabled:opacity-30"
				disabled={!selectedConsumable}
				onclick={() => addEquipment('consumable')}
			>
				<Icon icon="mdi:plus" />
			</button>
		</div>

		<!-- Divider: Status Effects -->
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
			<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase">Status Effects</span>
			<div class="h-px flex-1 bg-linear-to-r from-transparent via-surface-600 to-transparent"></div>
		</div>

		<!-- Current Status Effects -->
		{#if player.statuses.statuses.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each player.statuses.statuses as status (status.status.name)}
					<div class="flex items-center gap-1.5 rounded border border-warning-500/20 bg-warning-500/10 px-2 py-1">
						<span class="text-warning-400 text-xs">{status.status.name}</span>
						{#if status.duration && status.duration > 0}
							<span class="text-warning-500 rounded bg-black/30 px-1 py-0.5 text-[0.6rem] font-bold">{status.duration}T</span>
						{:else}
							<span class="text-tertiary-400 text-xs">∞</span>
						{/if}
						<button
							type="button"
							class="text-surface-500 hover:text-error-400 transition-colors"
							onclick={() => {
								const key = Object.entries(statusEffects).find(([_, s]) => s.name === status.status.name)?.[0] as StatusType | undefined;
								if (key) player.statuses.removeStatus(key);
							}}
						>
							<Icon icon="mdi:close" class="text-xs" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Add Status Effect -->
		<div class="flex gap-1">
			<select
				class="select flex-1 text-xs"
				bind:value={selectedStatus}
			>
				<option value="">+ Add Status Effect</option>
				{#each availableStatuses as [key, status] (key)}
					<option value={key}>{status.name}</option>
				{/each}
			</select>
			<button
				type="button"
				class="rounded border border-white/10 bg-black/30 px-3 text-surface-400 transition-all hover:border-warning-500/50 hover:bg-warning-500/20 hover:text-white disabled:opacity-30"
				disabled={!selectedStatus}
				onclick={addStatus}
			>
				<Icon icon="mdi:plus" />
			</button>
		</div>
	</div>
</PullOutMenu>
