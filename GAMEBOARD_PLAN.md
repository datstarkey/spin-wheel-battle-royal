# Gameboard Implementation Plan

## Overview

Transform the pixel-art Map.svg into an interactive game board system with tile-based movement, special locations, and player position tracking.

---

## 1. Analysis of Existing Map

### Map Dimensions
- **480x480 pixels** in the SVG (1:1 pixel ratio)
- Each "tile" in the game appears to be roughly **10x10 pixels** based on visual patterns
- This gives us a **48x48 tile grid** for the game board

### Color Mapping (from SVG analysis)

| Color Hex | Count | Tile Type | Description |
|-----------|-------|-----------|-------------|
| `#000000` | 161,604 | `blocked` | Non-walkable/void |
| `#249FDE` | 39,096 | `path` | Blue walkable paths |
| `#060608` | 11,960 | `path_shadow` | Path shadow details (treat as path) |
| `#DCDCDC` | 5,480 | `spawn_zone` | White corner areas (4 spawn zones) |
| `#430067` | 3,600 | `shadow_realm` | Purple Shadow Realm tiles |
| `#59C135` | 2,096 | `spawn_entry` | Green spawn point entries |
| `#DBA463` | 1,296 | `spawn_point` | Brown/tan spawn points |
| `#FFFC40` | 1,200 | `shop` | Yellow shop tiles |
| `#285CC4` | 1,008 | `teleporter` | Blue/purple teleporter tiles |
| `#DF3E23` | 624 | `center_feature` | Red center button |
| `#B4202A` | 608 | `center_feature` | Red center button shadow |
| `#FA6A0A` | 268 | `center_arrow` | Orange diamonds near center |
| `#FFFFFF` | 348 | `ignored` | White details |

---

## 2. Architecture

### 2.1 Core Data Structures

```typescript
// src/lib/game/board/types.ts

export type TileType =
  | 'blocked'      // Cannot walk
  | 'path'         // Normal walkable
  | 'spawn_zone'   // Corner spawn areas (white)
  | 'spawn_point'  // Brown spawn markers
  | 'spawn_entry'  // Green entry points
  | 'shop'         // Yellow shop tiles
  | 'shadow_realm' // Purple shadow realm
  | 'teleporter'   // Blue teleporter tiles
  | 'center';      // Center feature

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface Position {
  x: number;  // Column (0-47)
  y: number;  // Row (0-47)
}

export interface Tile {
  type: TileType;
  position: Position;
  walkable: boolean;
  connections: Direction[];  // Which directions can you exit this tile
  teleportTarget?: Position; // If this is a teleporter, where does it go
  spawnGroup?: number;       // Which spawn zone (1-4) does this belong to
}

export interface GameBoard {
  tiles: Tile[][];           // 48x48 grid
  spawnZones: SpawnZone[];   // 4 corner spawn zones
  shops: Position[];         // Shop tile positions
  teleporters: TeleporterPair[]; // Linked teleporter pairs
  shadowRealmTiles: Position[];
}

export interface SpawnZone {
  id: number;           // 1-4
  center: Position;     // Center of spawn zone
  entryPoints: Position[]; // Green entry tiles
  spawnPoints: Position[]; // Brown spawn markers
}

export interface TeleporterPair {
  a: Position;
  b: Position;
}
```

### 2.2 File Structure

```
src/lib/game/board/
├── types.ts              # Type definitions
├── board.svelte.ts       # Main board state (reactive)
├── boardData.ts          # Static board layout data (generated from SVG)
├── pathfinding.ts        # Movement/pathfinding logic
├── tileActions.ts        # Tile interaction handlers
└── boardParser.ts        # One-time script to parse SVG → JSON
```

### 2.3 Component Structure

```
src/lib/components/board/
├── GameBoard.svelte      # Main board container
├── BoardTile.svelte      # Individual tile component
├── PlayerToken.svelte    # Player position marker
├── TileOverlay.svelte    # Highlights for valid moves, etc.
└── MiniMap.svelte        # Optional compact view
```

---

## 3. Implementation Steps

### Phase 1: Board Data Generation (One-time)

1. **Create SVG parser script** (`scripts/parseSvgBoard.ts`)
   - Read Map.svg
   - Sample pixels at 10px intervals (or detect tile boundaries)
   - Map colors to tile types
   - Detect connections between adjacent walkable tiles
   - Output to `boardData.ts` as static JSON

2. **Manual refinement**
   - Identify the 4 teleporter pairs and link them
   - Define spawn zone boundaries (corners 1-4)
   - Verify path connectivity

### Phase 2: Core Board System

3. **Create type definitions** (`types.ts`)
   - All interfaces as shown above

4. **Create board state manager** (`board.svelte.ts`)
   ```typescript
   class Board {
     tiles: Tile[][] = $state(boardData.tiles);
     playerPositions: Map<string, Position> = $state(new Map());

     getValidMoves(playerId: string, range: number): Position[];
     movePlayer(playerId: string, to: Position): boolean;
     getTileAt(pos: Position): Tile | undefined;
     getPlayersAt(pos: Position): string[];
   }
   ```

5. **Add position to Player class** (`player.svelte.ts`)
   ```typescript
   // Add to existing Player class
   private _position = $state<Position | null>(null);
   public get position(): Position | null { return this._position; }
   public set position(value: Position | null) { ... }
   ```

### Phase 3: Pathfinding & Movement

6. **Implement pathfinding** (`pathfinding.ts`)
   - BFS/flood fill for valid move calculation
   - Respect tile connections (direction restrictions)
   - Handle blocked tiles
   - Calculate movement range based on player.movement

7. **Implement tile actions** (`tileActions.ts`)
   - `onEnterShop(player)` - Open shop UI
   - `onEnterShadowRealm(player)` - Set inShadowRealm = true
   - `onEnterTeleporter(player)` - Move to linked teleporter
   - `onLeaveShadowRealm(player)` - Set inShadowRealm = false

### Phase 4: UI Components

8. **GameBoard.svelte**
   - Render 48x48 grid of tiles
   - Show player tokens
   - Handle click interactions
   - Highlight valid moves on turn start

9. **BoardTile.svelte**
   - Render appropriate tile graphic
   - Show hover states
   - Handle click to move

10. **PlayerToken.svelte**
    - Show player avatar/color
    - Animate movement between tiles
    - Show current player indicator

### Phase 5: Game Integration

11. **Integrate with turn system**
    - At turn start: calculate valid moves
    - Player selects destination
    - Execute movement with animation
    - Trigger tile effects
    - Then proceed to attack/action phase

12. **Update serialization**
    - Add player positions to save/load
    - Add board state if needed (e.g., depleted shops)

---

## 4. Tile-Specific Logic

### Path Tiles (Blue)
- Standard walkable tiles
- Can move in any direction where connected to another path

### Spawn Zones (White/Corner)
- Special starting areas
- Players spawn here at game start
- Can only exit through green entry points

### Spawn Entry (Green)
- Gateway between spawn zone and main board
- Directional - controls flow in/out

### Shop (Yellow)
- Landing triggers shop UI
- Players can buy items when movement ends here

### Shadow Realm (Purple)
- Player's `inShadowRealm` flag set to true while here
- Triggers shadow realm wheel each turn
- Must spin to escape (or walk out?)

### Teleporter (Blue/Purple)
- **4 Outer teleporters** (one in each quadrant) - entry/exit points
- **1 Inner teleporter** (center area) - EXIT ONLY
- When entering an outer teleporter, player chooses which OTHER outer teleporter to exit from
- Cannot teleport INTO the inner/center teleporter
- Teleportation is instant (no extra movement cost)

### Center Feature (Red Button)
- Landing here triggers the **Button Wheel**
- Powerful rewards: player rotation, extra attacks, loot wheels, stat boosts, gold

---

## 5. Movement Rules

1. **Movement Points** = `player.movement` (base + bonuses)
2. **Each tile costs 1 movement point**
3. **Diagonal movement**: Not allowed (4-directional only based on connections)
4. **Attack Range**: Separate from movement, calculated after move
5. **Can't move through other players?** - TBD
6. **Can share tiles?** - TBD

---

## 6. Visual Approach

### Option A: Recreate as SVG Components
- Create individual SVG tile components
- Compose into grid
- Pro: Crisp at any size, easy styling
- Con: Need to design each tile type

### Option B: Use Original SVG as Background
- Overlay clickable tile grid
- Calculate tile positions from coordinates
- Pro: Uses existing artwork
- Con: Harder to show individual tile states

### Recommended: Option A (SVG Components)
- Create simple colored tiles with subtle textures
- Match the original color scheme
- Add borders to show connectivity

---

## 7. Game Rules (Confirmed)

1. **Can players share tiles?** ✅ YES - players can occupy the same tile
2. **Combat trigger:** Players must be within 1 tile OR on the same tile. Current player chooses to initiate combat.
3. **Can players move through occupied tiles?** ✅ YES
4. **Center Button:** Activates the Button Wheel - a special reward wheel with effects like:
   - Rotate all players clockwise/counter-clockwise
   - Get an extra attack
   - Spin 1-4 loot wheels
   - Gain +5 to all stats
   - Gain 10 gold
5. **Teleporter Rules:**
   - **Outer teleporters (4 corners):** Entry points - player chooses which outer teleporter to exit from
   - **Inner teleporter (center):** Exit only - cannot teleport INTO the center, only OUT
   - Teleportation is instant (no movement cost beyond reaching the teleporter)
6. **Shops:** TBD - assumed infinite for now
7. **Shadow Realm:** TBD - assumed triggered by landing/ending turn there

---

## 8. Implementation Order

1. ✅ Analyze SVG structure
2. 🔲 Create types.ts with all interfaces
3. 🔲 Write SVG parser script
4. 🔲 Generate boardData.ts
5. 🔲 Create board.svelte.ts state manager
6. 🔲 Add position to Player class
7. 🔲 Implement pathfinding.ts
8. 🔲 Create basic GameBoard.svelte component
9. 🔲 Create BoardTile.svelte with tile graphics
10. 🔲 Create PlayerToken.svelte
11. 🔲 Integrate movement into turn system
12. 🔲 Implement tile actions
13. 🔲 Update serialization
14. 🔲 Polish animations and UI

---

## Next Steps

Let me know:
1. Which questions from section 7 you'd like to answer
2. If the tile size estimation (10px = 1 tile) is correct
3. Any adjustments to the plan before we start implementing
