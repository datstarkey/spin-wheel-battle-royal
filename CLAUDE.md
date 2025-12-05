# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm i

# Run development server (http://localhost:7654)
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Type checking
pnpm run check
pnpm run check:watch

# Linting and formatting
pnpm run lint      # Run prettier and eslint checks
pnpm run format    # Auto-fix formatting issues
```

## Architecture Overview

This is a **SvelteKit 5** web-based battle royale game with a spinning wheel mechanic. The codebase uses:

- **Svelte 5 with runes** (`$state`, `$derived`) for reactive state management
- **TypeScript** for type safety
- **Tailwind CSS v4** with Skeleton UI v4 design system
- **Vite** as the build tool

### Skeleton Design System (v4)

This project uses the **Skeleton UI v4** design system. When working with UI components:

- **Documentation**: Always reference https://www.skeleton.dev/llms.txt for component lookup and usage
- **Components**: Import from `@skeletonlabs/skeleton-svelte`
- **Theming**: Uses the `crimson` theme, configured via `data-theme` on `<html>`
- **CSS Classes**: Use `preset-*` classes (not the old `variant-*` syntax from v2)
  - `preset-filled-*` for solid backgrounds
  - `preset-tonal-*` for softer/muted backgrounds (replaces `preset-soft-*`)
  - `preset-outlined-*` for bordered elements
- **Token Classes**: Do NOT use old v2 token classes like `bg-surface-100-800-token`. Instead use Tailwind dark mode: `bg-surface-50 dark:bg-surface-900`
- **Button Groups**: Use `<nav class="btn-group preset-*">` with `btn` class on child buttons

### UI/UX Design Guidelines

When modernizing or updating the look and feel of components:

1. **Use the `frontend-design` skill** for design inspiration and distinctive, production-grade interfaces
2. **Implement with Tailwind utility classes** using Skeleton theme CSS variables for consistency
3. Avoid generic "AI slop" aesthetics - commit to bold, intentional design choices
4. **Never use `<style>` blocks** - all styling should be inline Tailwind classes

#### Styling Approach: Tailwind + Skeleton Theme Variables

**IMPORTANT**: All component styling must use Tailwind utility classes with Skeleton's theme CSS variables. This ensures consistency across the app and proper light/dark mode support.

**DO NOT** use custom `<style>` blocks with hardcoded colors. Instead, use Tailwind classes that reference theme variables:

```svelte
<!-- BAD: Custom CSS with hardcoded values -->
<style>
  .card { background: rgba(15, 15, 20, 0.95); color: #e2e8f0; }
</style>

<!-- GOOD: Tailwind with theme variables -->
<div class="bg-surface-900/95 text-surface-100 border-primary-500/50">
```

**Theme Color Mapping** (from `battle-arena.css`):
- `primary-*` → Crimson red (attack, danger, active states)
- `secondary-*` → Cool blue (defense, shields)
- `tertiary-*` → Violet purple (shadow realm, magic)
- `success-*` → Emerald green (health, healing, movement)
- `warning-*` → Amber gold (gold, currency, caution, status effects)
- `error-*` → Blood red (death, critical)
- `surface-*` → Deep charcoal with blue undertone (backgrounds, text, borders)

**Common Patterns**:
```svelte
<!-- Card backgrounds -->
class="bg-surface-900/95 border border-surface-500/30"

<!-- Text hierarchy -->
class="text-surface-100"  <!-- primary text -->
class="text-surface-300"  <!-- secondary text -->
class="text-surface-400"  <!-- muted text -->

<!-- State-based colors -->
class="text-primary-400"   <!-- attack/damage -->
class="text-secondary-400" <!-- defense -->
class="text-warning-400"   <!-- gold/status -->
class="text-success-400"   <!-- health/movement -->
class="text-tertiary-400"  <!-- shadow realm -->

<!-- Glowing effects for active states -->
class="border-primary-500/50 shadow-[0_0_20px_rgba(220,38,38,0.2)]"

<!-- Gradients -->
class="bg-gradient-to-r from-success-600 to-success-500"
class="bg-gradient-to-br from-primary-500 to-primary-700"

<!-- Opacity variations -->
class="bg-black/30 border-white/5"
```

#### Design System: "Battle Arena" Aesthetic

The game uses a **dark, tactical battle arena** visual language inspired by competitive gaming HUDs and card games. The custom theme is defined in `src/themes/battle-arena.css`.

- **Typography**: Monospace fonts (`JetBrains Mono`, `Fira Code`) via `var(--base-font-family)`

- **Visual Elements**:
  - Corner accents (L-shaped borders) on cards using absolute positioning
  - Subtle gradients and box shadows for depth
  - HP bars with color transitions (success → warning → error)
  - Glowing borders for active states using `shadow-[...]` arbitrary values
  - Striped overlay pattern for dead/disabled states using `bg-[repeating-linear-gradient(...)]`
  - Pulsing animations via `animate-pulse` for critical states

- **Component States** (using conditional classes):
  - **Default**: `border-surface-400`, subtle borders
  - **Active Turn**: `border-primary-500 animate-pulse shadow-[...]`
  - **Dead**: `border-surface-600 opacity-40` with striped overlay
  - **Shadow Realm**: `border-tertiary-500 shadow-[...]` purple glow

### Key Architectural Patterns

1. **State Management**: Uses Svelte 5's rune-based reactivity system
   - `$state()` for reactive state
   - `$derived()` for computed values
   - `.svelte.ts` files for shared reactive state (e.g., `game.svelte.ts`, `player.svelte.ts`)

2. **Game Core** (`src/lib/game/`):
   - `game.svelte.ts`: Main game state controller with turn management, shadow realm mechanics, and serialization
   - `player/player.svelte.ts`: Player entity with stats (HP, attack, defense, movement, gold) and event handlers
   - `classes/`: Character classes with unique abilities (e.g., gambler, gigachad, magicman)
   - `items/`: Equipment system with chest, helm, mainhand, offhand slots and consumables
   - `statuses/`: Status effect system
   - `wheels/`: Spin wheel configurations for different game events

3. **Component Structure** (`src/lib/components/`):
   - Game components handle UI for players, combat, initialization steps
   - Reusable UI components (buttons, forms, wheels)
   - Custom wheel implementation using the `spin-wheel` library

4. **Persistence** (`src/lib/game/serialization.ts`):
   - Type-safe game state serialization/deserialization with validation
   - `SerializedGame`, `SerializedPlayer`, `SerializedPlayerGear`, `SerializedPlayerStatuses` interfaces
   - `validateGame()`, `validatePlayer()` functions validate JSON data before deserialization
   - Prevents corrupted saves from breaking game state
   - Local storage integration via `localStorageStore.svelte.ts`

5. **Event System**: Players and items respond to game events:
   - `onTurnStart/End`, `onAttackWin/Lose`, `onDefendWin/Lose`
   - Equipment and status effects hook into these events

### Important Implementation Details

- The game uses a turn-based system with configurable player order
- Combat involves spinning wheels with different outcomes
- Items modify player stats through multipliers and bonuses
- The "Shadow Realm" is a special game state where players can be sent
- Gold serves as both currency and HP for the "gambler" class

---

## Game Mechanics

### Core Gameplay Loop

This is a **turn-based battle royale** where players fight on a board until one remains. Each turn, a player can:

1. **Move** - Up to their movement stat (base 1) across connected tiles
2. **Attack** - Fight a player within attack range (base 1)
3. **Shop** - Buy one item per turn from shop tiles
4. **Casino** - Gamble once per turn (5g entry, free for Gamblers)

**Win Condition**: Last player alive wins.

### Combat System

Combat is resolved via **wheel spins**:
1. Attacker and defender stats are compared
2. Both spin wheels for outcomes
3. **Win Wheel** (victor): Grants buffs like +ATK, +DEF, +HP, +Gold, extra turns, or sends opponent to Shadow Realm
4. **Loss Wheel** (loser): Deals damage scaled by `globalHpReduction` (increases as players die)

### Turn Lifecycle

```
startTurn() → Player Actions → finishTurn() → Next Player
```

State flags track actions: `hasMoved`, `hasFought`, `hasShopped`, `hasUsedCasino`

### Shadow Realm

A banishment mechanic (not death):
- **Entry**: Win wheel outcome, Shadeweaver ability, or landing on shadow realm tile
- **Exit**: Spin shadow realm wheel → "Return to Spawn" outcome
- **Shadeweaver Immunity**: Can freely enter/exit and attack anyone in shadow realm

---

## Player Stats

| Stat | Description |
|------|-------------|
| **HP / MaxHP** | Health. Death at 0 HP |
| **Attack** | `(baseAttack + bonusAttack) × attackMultiplier` |
| **Defense** | `(baseDefense + bonusDefense) × defenseMultiplier` |
| **Gold** | Currency for shops/casino. Also HP for Gamblers |
| **Movement** | Tiles per turn (base 1) |
| **Attack Range** | Combat distance (base 1, Manhattan distance) |

**Stat Modifiers**: Tracked by source (item/status/class name) to allow stacking without conflicts.

**Resources**: `player.resources: Record<string, number>` for class-specific mechanics (Mana, Confidence, Swenergy, etc.)

---

## Classes (`src/lib/game/classes/`)

8 playable classes with unique mechanics:

| Class | HP | ATK | DEF | Range | Special Mechanic |
|-------|---:|----:|----:|------:|------------------|
| **Gambler** | 100 | 15 | 15 | 1 | HP = Gold. Lucky Streak stacks. Free casino. |
| **Shadeweaver** | 100 | 20 | 15 | 1 | Shadow Realm immune. Gains Shade on others' shadow spins. |
| **SWE** | 100 | 15 | 15 | 1 | Builds Swenergy (0-10). At 10 → SWE Supreme (+6 DEF). |
| **Magic Man** | 80 | 20 | 10 | 3 | Mana pool (100). Spells cost 25/50/100. Can ascend to Archmage. |
| **Giga Chad** | 100 | 20 | 5 | 1 | +30% of ATK as bonus DEF. +3 ATK on wins. |
| **Absolute Unit** | 100 | 5 | 15 | 1 | +30% of DEF as bonus ATK. +5 DEF on wins. |
| **Poop Master** | 100 | 8 | 10 | 1 | Destroys items on win. +2 ATK per destroyed item. Takes 20% less damage. |
| **The Intern** | 90 | 12 | 12 | 2 | Confidence (0-100). Overthinking debuff <20. Actually mode at 100. |

### Class Files
- `classType.ts` - Interface & class registry
- Individual files: `gambler.ts`, `shadeweaver.ts`, `swe.ts`, `magicman.ts`, `gigaChad.ts`, `absoluteUnit.ts`, `poopmaster.ts`, `intern.ts`

---

## Items (`src/lib/game/items/`)

### Equipment Slots

| Slot | Purpose | Examples |
|------|---------|----------|
| **Main Hand** | Attack | Lightsaber (+15 ATK), Fireball, Brass Knuckles |
| **Off Hand** | Defense/Utility | Hylian Shield, Shiv |
| **Helm** | Head | Box, A Nice Hat, Kaibrows, Beer Goggles |
| **Chest** | Body | Sports Bra, Barbarian Harness, Kevlar, Go Faster Stripes |
| **Consumables** | Single-use | Health Pot, Jager Shots, Stella Artois, Vodka Redbull, Halo |

### Item Properties
- `baseCost`: Gold price
- `maxAmount`: Stack limit
- `classLocks`: Class restrictions (optional)

### Item Event Hooks
Items can respond to: `onEquip`, `onUnequip`, `onTurnStart`, `onTurnEnd`, `onAttackWin`, `onAttackLose`, `onDefendWin`, `onDefendLose`, `onAttackStart`, `onAttackEnd`, `onDefenseStart`, `onDefenseEnd`

### Key Files
- `itemTypes.ts` - Item interface & registry
- Subdirectories: `mainHand/`, `offHand/`, `helm/`, `chest/`, `consumables/`

---

## Status Effects (`src/lib/game/statuses/`)

Buffs and debuffs with duration tracking:

| Status | Effect | Duration |
|--------|--------|----------|
| **Emotional Damage** | -5 ATK, -5 DEF | 3 turns (stackable) |
| **SWE Supreme** | +6 DEF | While at 10 Swenergy |
| **Overthinking** | -5 ATK, -5 DEF | While Confidence < 20 |
| **Actually** | 20% attack nullification | While Confidence = 100 |
| **Archmage** | 2x mana regen, global attack range | Permanent |
| **Rune of Power** | Required for Archmage ascension | 5 turns on tile |

### Status Properties
- `turnDuration`: How long it lasts
- `allowMultiple`: Can stack multiple instances
- `classLock`: Restricted to specific classes

### Status Event Hooks
Same as items: `onApply`, `onRemove`, `onTurnStart`, `onTurnEnd`, combat events

### Key Files
- `statusTypes.ts` - Status interface & registry
- Individual files: `emotionalDamage.ts`, `swesupreme.ts`, `overthinking.ts`, `actually.ts`, `archmage.ts`, etc.

---

## Wheel System (`src/lib/game/wheels/`)

Spinning wheels determine combat outcomes and rewards.

| Wheel | Trigger | Purpose |
|-------|---------|---------|
| **Win Wheel** | Combat victory | +ATK, +DEF, +HP, +Gold, Extra Turn, Shadow Realm send |
| **Loss Wheel** | Combat defeat | Damage based on `globalHpReduction` |
| **Damage Taken** | After loss | Shows damage dealt |
| **Shadow Realm** | In shadow realm | Escape or penalties |
| **Casino** | Casino tile | Jackpot, gold swings, item trades |
| **Loot** | Various triggers | Random items |
| **Gambler** | Gambler class wins | Class-specific rewards |
| **Button** | Center tile | Special outcomes |

### Wheel Data Structure
```typescript
type WheelBase = SpinWheelItem[]  // Array of outcomes
interface SpinWheelItem {
  label: string
  onWin: (game: Game, player: Player) => void
}
```

### Key Files
- `wheels.ts` - Base types
- Individual files: `winWheel.ts`, `loseWheel.ts`, `shadowRealm.ts`, `casinoWheel.ts`, `gamblerWheel.ts`, `lootWheel.ts`, `buttonWheel.ts`, `damageTakenWheel.ts`

---

## Board System (`src/lib/game/board/`)

24x24 grid-based game board.

### Tile Types

| Type | Color | Behavior |
|------|-------|----------|
| `path` | Blue | Normal walkable |
| `blocked` | Black | Walls/obstacles |
| `spawn_zone` | White | Safe starting area |
| `spawn_point` | Brown | Exact spawn location |
| `spawn_entry` | Green | Zone transition |
| `shop` | Yellow | Buy items |
| `shadow_realm` | Purple | Sends to shadow realm |
| `teleporter_outer` | Blue/Purple | Bidirectional teleport |
| `teleporter_inner` | Blue/Purple | Center exit-only |
| `button` | Red | Spins button wheel |
| `treasure` | Blue/Yellow | One-time loot |
| `casino` | Orange/Red | Gambling |

### Movement
- **Pathfinding**: BFS flood-fill algorithm
- **Connections**: Each tile specifies valid exit directions (N/S/E/W)
- **Position**: `GameBoard.playerPositions: Map<playerName, Position>`

### Key Files
- `board.svelte.ts` - Board state & pathfinding
- `boardData.ts` - Board configuration & tile data
- `types.ts` - Position, Tile, TileType, Direction types
- `tileActions.ts` - Tile interaction handlers

---

## File Structure Reference

```
src/lib/game/
├── game.svelte.ts          # Main game controller
├── serialization.ts        # Save/load system
├── player/
│   ├── player.svelte.ts    # Player entity (26KB)
│   ├── playerGear.svelte.ts
│   └── playerStatuses.svelte.ts
├── board/
│   ├── board.svelte.ts     # Board state & pathfinding
│   ├── boardData.ts        # Tile configuration
│   ├── types.ts            # Type definitions
│   └── tileActions.ts      # Tile interactions
├── classes/
│   ├── classType.ts        # Interface & registry
│   └── {class}.ts          # 8 class implementations
├── items/
│   ├── itemTypes.ts        # Interface & registry
│   └── {slot}/             # Items by equipment slot
├── statuses/
│   ├── statusTypes.ts      # Interface & registry
│   └── {status}.ts         # Status implementations
└── wheels/
    ├── wheels.ts           # Base types
    └── {wheel}.ts          # Wheel configurations
```

---

## Key Entry Points for Understanding

1. **Game Flow**: [game.svelte.ts](src/lib/game/game.svelte.ts) - Turn system, combat resolution
2. **Player Mechanics**: [player.svelte.ts](src/lib/game/player/player.svelte.ts) - Stats, events, resources
3. **Class System**: [classType.ts](src/lib/game/classes/classType.ts) - Class interface and registry
4. **Combat Rewards**: [winWheel.ts](src/lib/game/wheels/winWheel.ts) - Victory outcomes
5. **Board Movement**: [board.svelte.ts](src/lib/game/board/board.svelte.ts) - Pathfinding, positions