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