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
- **Tailwind CSS** with Skeleton UI components
- **Vite** as the build tool

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

4. **Persistence**: 
   - Game state serialization/deserialization for save/load functionality
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