<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import PullOutMenu from '$lib/components/pullOutMenu/PullOutMenu.svelte';
	import { classMap } from '$lib/game/classes/classType';
	import type { Player } from '$lib/game/player/player.svelte';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import EditPlayerResources from './edit/EditPlayerResources.svelte';
	import EditPlayerEquipment from './edit/EditPlayerEquipment.svelte';
	import EditPlayerStatuses from './edit/EditPlayerStatuses.svelte';
	import EditPlayerModifiers from './edit/EditPlayerModifiers.svelte';

	interface Props {
		player: Player;
	}
	let { player }: Props = $props();
</script>

{#snippet statStepper(
	baseValue: number,
	totalValue: number,
	bonusValue: number,
	onBaseChange: (val: number) => void,
	onBonusChange: ((val: number) => void) | null,
	icon: string,
	label: string,
	colorClass: string
)}
	{@const getStep = (e: MouseEvent) => (e.ctrlKey || e.metaKey ? 100 : e.shiftKey ? 10 : 1)}
	<div
		class="group relative overflow-hidden rounded border border-white/10 bg-black/30 transition-all hover:border-white/20"
	>
		<!-- Total value display -->
		<div class="flex items-center justify-center gap-1 border-b border-white/5 py-1">
			<Icon {icon} class="{colorClass} text-xs" />
			<span class="text-surface-100 text-base font-bold tabular-nums">{totalValue}</span>
			<span class="text-surface-500 text-[0.55rem] tracking-widest uppercase">{label}</span>
		</div>
		<!-- Base value stepper -->
		<div class="flex items-center border-b border-white/5">
			<button
				type="button"
				class="text-surface-400 flex h-8 w-8 items-center justify-center border-r border-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95"
				onclick={(e) => onBaseChange(Math.max(0, baseValue - getStep(e)))}
			>
				<Icon icon="mdi:minus" class="text-xs" />
			</button>
			<div class="flex flex-1 items-center justify-center gap-1.5 px-2">
				<span class="text-surface-500 text-[0.5rem] font-semibold tracking-widest uppercase"
					>Base</span
				>
				<span class="text-surface-200 text-sm font-bold tabular-nums">{baseValue}</span>
			</div>
			<button
				type="button"
				class="text-surface-400 flex h-8 w-8 items-center justify-center border-l border-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95"
				onclick={(e) => onBaseChange(baseValue + getStep(e))}
			>
				<Icon icon="mdi:plus" class="text-xs" />
			</button>
		</div>
		<!-- Bonus value stepper -->
		{#if onBonusChange}
			<div class="flex items-center">
				<button
					type="button"
					class="text-surface-400 flex h-8 w-8 items-center justify-center border-r border-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95"
					onclick={(e) => onBonusChange(bonusValue - getStep(e))}
				>
					<Icon icon="mdi:minus" class="text-xs" />
				</button>
				<div class="flex flex-1 items-center justify-center gap-1.5 px-2">
					<span class="text-surface-500 text-[0.5rem] font-semibold tracking-widest uppercase"
						>Bonus</span
					>
					<span
						class="text-sm font-bold tabular-nums {bonusValue > 0
							? 'text-success-400'
							: bonusValue < 0
								? 'text-error-400'
								: 'text-surface-400'}"
					>
						{bonusValue > 0 ? '+' : ''}{bonusValue}
					</span>
				</div>
				<button
					type="button"
					class="text-surface-400 flex h-8 w-8 items-center justify-center border-l border-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95"
					onclick={(e) => onBonusChange(bonusValue + getStep(e))}
				>
					<Icon icon="mdi:plus" class="text-xs" />
				</button>
			</div>
		{:else}
			<!-- Read-only bonus display when no callback provided -->
			<div class="flex items-center justify-center gap-1.5 py-1.5">
				<span class="text-surface-500 text-[0.5rem] font-semibold tracking-widest uppercase"
					>Bonus</span
				>
				<span
					class="text-sm font-bold tabular-nums {bonusValue > 0
						? 'text-success-400'
						: bonusValue < 0
							? 'text-error-400'
							: 'text-surface-400'}"
				>
					{bonusValue > 0 ? '+' : ''}{bonusValue}
				</span>
			</div>
		{/if}
	</div>
{/snippet}

<PullOutMenu position="left" width="600px">
	{#snippet trigger(open)}
		<Button onclick={open} icon="mdi:cog" class="btn-icon-sm"></Button>
	{/snippet}

	<!-- Header -->
	<div class="mb-6 flex items-center gap-4">
		<div
			class="border-primary-500/50 from-primary-500/20 to-primary-700/20 flex h-12 w-12 items-center justify-center rounded-lg border-2 bg-linear-to-br shadow-[0_0_20px_rgba(220,38,38,0.2)]"
		>
			<span class="text-primary-400 text-xl font-black">{player.name.charAt(0).toUpperCase()}</span>
		</div>
		<div>
			<h1 class="text-surface-100 text-xl font-black tracking-wide uppercase">
				Edit {player.name}
			</h1>
			<span class="text-surface-500 text-xs font-semibold tracking-widest uppercase"
				>{player.class.name}</span
			>
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
		<EditPlayerResources {player} />

		<!-- Divider: Vitals -->
		<div class="flex items-center gap-3">
			<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
			<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
				>Vitals</span
			>
			<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
		</div>

		<!-- HP & Gold -->
		<div class="grid grid-cols-2 gap-3">
			<Stepper
				value={player.hp}
				onChange={(val) => (player.hp = val)}
				icon="mdi:heart"
				label="HP"
				colorClass="text-error-400"
				min={0}
			/>
			<Stepper
				value={player.gold}
				onChange={(val) => (player.gold = val)}
				icon="mdi:coin"
				label="Gold"
				colorClass="text-warning-400"
				min={0}
			/>
		</div>

		<!-- Divider: Combat Stats -->
		<div class="flex items-center gap-3">
			<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
			<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
				>Combat Stats</span
			>
			<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
		</div>

		<!-- Combat Stats Grid -->
		<div class="grid grid-cols-2 gap-3">
			{@render statStepper(
				player.baseAttack,
				player.attack,
				player.rawBonusAttack,
				(val) => (player.baseAttack = val),
				(val) => (player.bonusAttack = val),
				'mdi:sword',
				'Attack',
				'text-primary-400'
			)}
			{@render statStepper(
				player.baseDefense,
				player.defense,
				player.rawBonusDefense,
				(val) => (player.baseDefense = val),
				(val) => (player.bonusDefense = val),
				'mdi:shield',
				'Defense',
				'text-secondary-400'
			)}
			{@render statStepper(
				player.baseMovement,
				player.movement,
				player.bonusMovement,
				(val) => (player.baseMovement = val),
				null,
				'ion:footsteps',
				'Movement',
				'text-success-400'
			)}
			{@render statStepper(
				player.baseAttackRange,
				player.attackRange,
				player.bonusAttackRange,
				(val) => (player.baseAttackRange = val),
				null,
				'material-symbols:social-distance',
				'Range',
				'text-warning-400'
			)}
		</div>

		<!-- Active Modifiers -->
		<EditPlayerModifiers {player} />

		<!-- Equipment & Consumables -->
		<EditPlayerEquipment {player} />

		<!-- Status Effects -->
		<EditPlayerStatuses {player} />
	</div>
</PullOutMenu>
