# Irongate Penitentiary - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Window                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              GameCanvas Component                      │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │          HTML5 Canvas Element                    │ │ │
│  │  │                                                  │ │ │
│  │  │    [Prison Cell Rendered Here]                   │ │ │
│  │  │    - 320×256 pixels (10×8 tiles)                 │ │ │
│  │  │    - Walls, furniture, player                    │ │ │
│  │  │    - Debug overlay                               │ │ │
│  │  │                                                  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Systems

### 1. State Management (Zustand)

```
┌───────────────────────────────────────┐
│        Game State Store               │
├───────────────────────────────────────┤
│ Player State:                         │
│  • gridPosition (x, y)                │
│  • pixelPosition (x, y)               │
│  • targetPixelPosition (x, y)         │
│  • direction (up/down/left/right)     │
│  • isMoving (boolean)                 │
│                                       │
│ Room State:                           │
│  • currentRoom (Room object)          │
│  • tiles (2D array of TileType)       │
│                                       │
│ Input State:                          │
│  • up, down, left, right (booleans)   │
│                                       │
│ Debug State:                          │
│  • debugMode (boolean)                │
└───────────────────────────────────────┘
```

### 2. Input System

```
┌──────────────────┐
│  Keyboard Event  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  InputManager    │
├──────────────────┤
│ • handleKeyDown  │
│ • handleKeyUp    │
│ • KEY_MAP        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Zustand Store   │
│  setInput()      │
└──────────────────┘
```

**Key Mappings:**
- Arrow Up / W → 'up'
- Arrow Down / S → 'down'
- Arrow Left / A → 'left'
- Arrow Right / D → 'right'

### 3. Movement System

```
Movement Flow:
┌─────────────────┐
│ Key Pressed     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ InputManager                │
│ • Converts key to direction │
│ • Updates input state       │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ GameLoop Update              │
│ • Checks if player can move  │
│ • Initiates movePlayer()     │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Store: movePlayer(direction) │
│ • Calculate new grid pos     │
│ • Check bounds               │
│ • Check tile walkability     │
│ • Set target position        │
│ • Set isMoving = true        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ GameLoop (next N frames)     │
│ • updatePlayerPixelPosition  │
│ • Lerp from current → target │
│ • Ease-out cubic             │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Movement Complete            │
│ • completePlayerMove()       │
│ • Snap to target position    │
│ • Set isMoving = false       │
│ • Ready for next input       │
└──────────────────────────────┘
```

### 4. Collision Detection

```
When movePlayer(direction) is called:

1. Calculate new grid position
   gridPos(4,4) + direction(right) = newPos(5,4)

2. Bounds check
   if (newPos.x < 0 || newPos.x >= width) → BLOCKED
   if (newPos.y < 0 || newPos.y >= height) → BLOCKED

3. Tile walkability check
   tileType = room.tiles[newPos.y][newPos.x]
   if (!isTileWalkable(tileType)) → BLOCKED

4. If BLOCKED:
   - Update direction only
   - Don't move

5. If WALKABLE:
   - Start movement animation
   - Update target position
   - Set isMoving = true
```

**Walkable Tiles:** floor
**Blocked Tiles:** wall, bed, desk, toilet, sink, door

### 5. Rendering Pipeline

```
Game Loop (60 FPS):

┌──────────────────────────────┐
│ requestAnimationFrame        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Update Phase                 │
│ • Process input              │
│ • Update movement animation  │
│ • Update pixel positions     │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Render Phase                 │
│ • Clear canvas               │
│ • Draw room                  │
│ • Draw player                │
│ • Draw debug info            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Screen Updated               │
│ User sees new frame          │
└──────────────────────────────┘
```

**Render Layers (bottom to top):**
1. Background (black)
2. Floor tiles (gray)
3. Walls (dark gray)
4. Furniture (darker gray with borders)
5. Door (brown with bars)
6. Player (blue circle with white direction indicator)
7. Debug overlay (green text)

### 6. Game Loop

```typescript
GameLoop {
  lastFrameTime: number

  loop(currentTime) {
    deltaTime = currentTime - lastFrameTime
    fps = 1000 / deltaTime

    // Update
    if (player.isMoving) {
      progress = getMovementProgress()
      newPos = lerp(current, target, progress)
      updatePlayerPixelPosition(newPos)

      if (progress >= 1) {
        completePlayerMove()
      }
    } else {
      // Check for new input
      if (hasActiveInput() && canStartNewMove()) {
        movePlayer(direction)
      }
    }

    // Render
    renderer.render(gameState, fps)

    requestAnimationFrame(loop)
  }
}
```

### 7. Room Data Structure

```typescript
Room {
  width: 10,
  height: 8,
  tiles: [
    ['wall', 'wall', 'wall', ...],
    ['wall', 'floor', 'floor', ...],
    ['wall', 'bed', 'bed', ...],
    ...
  ],
  startPosition: { x: 4, y: 4 }
}
```

**Prison Cell Layout:**
```
┌─────────────────────────────────────────┐
│█ = wall   F = floor   B = bed           │
│D = desk   T = toilet  S = sink          │
│O = door   P = player start              │
└─────────────────────────────────────────┘

Row 0: █ █ █ █ █ █ █ █ █ █
Row 1: █ F F F F F F F F █
Row 2: █ B B F F F F T F █
Row 3: █ B B F F P F F F █
Row 4: █ F F F F F F S F █
Row 5: █ D D F F F F F F █
Row 6: █ F F F F F F F F █
Row 7: █ █ █ █ O O █ █ █ █
```

## Data Flow Examples

### Example 1: Player Presses Right Arrow

```
1. User presses ArrowRight
   ↓
2. InputManager.handleKeyDown(event)
   - KEY_MAP['ArrowRight'] = 'right'
   - setInput('right', true)
   ↓
3. GameLoop.update()
   - Sees input.right = true
   - Player not moving
   - Calls movePlayer('right')
   ↓
4. Store.movePlayer('right')
   - Current: (4, 4)
   - New: (5, 4)
   - Check tiles[4][5] = 'floor' ✓
   - Set target: (160, 128) pixels
   - Set isMoving: true
   - Set direction: 'right'
   ↓
5. GameLoop.update() (next ~10 frames)
   - Calculate progress: 0.1, 0.2, ..., 1.0
   - Lerp position with ease-out
   - Update pixelPosition
   - Renderer draws at new position
   ↓
6. Progress reaches 1.0
   - completePlayerMove()
   - Snap to target
   - Set isMoving: false
   ↓
7. Ready for next move
```

### Example 2: Player Tries to Walk Into Wall

```
1. User presses ArrowUp
   ↓
2. InputManager → setInput('up', true)
   ↓
3. GameLoop calls movePlayer('up')
   ↓
4. Store.movePlayer('up')
   - Current: (4, 1)
   - New: (4, 0)
   - Check tiles[0][4] = 'wall' ✗
   - Set direction: 'up'
   - Don't move (isMoving stays false)
   ↓
5. Renderer shows direction indicator pointing up
   - Player faces wall but doesn't move
```

## Performance Optimizations

### 1. Efficient Rendering
- Only clear and redraw changed areas
- Use requestAnimationFrame for optimal timing
- Minimal state reads per frame

### 2. Input Handling
- Debounce with movement cooldown (50ms)
- Prevent key repeat spam
- Single move at a time

### 3. State Updates
- Zustand provides minimal re-renders
- Only update what changed
- No unnecessary calculations

### 4. Movement Interpolation
- Ease-out cubic for smooth feel
- Fixed duration (180ms)
- Efficient lerp calculations

## Constants Reference

```typescript
TILE_SIZE = 32           // pixels per tile
MOVE_DURATION = 180      // ms per tile movement
TARGET_FPS = 60          // frames per second

COLORS = {
  floor: '#3d3d3d',
  wall: '#1a1a1a',
  furniture: '#2d2d2d',
  door: '#8b4513',
  player: '#4a90d9',
  grid: '#2a2a2a',
  background: '#000000',
}
```

## Type Reference

```typescript
type Direction = 'up' | 'down' | 'left' | 'right'
type TileType = 'floor' | 'wall' | 'bed' | 'desk' | 'toilet' | 'sink' | 'door'

interface Position {
  x: number
  y: number
}

interface Tile {
  type: TileType
  walkable: boolean
}

interface Room {
  width: number
  height: number
  tiles: TileType[][]
  startPosition: Position
}
```

## Module Dependencies

```
GameCanvas.tsx
  ├─ useGameStore (store.ts)
  ├─ Renderer (renderer.ts)
  ├─ InputManager (input.ts)
  ├─ GameLoop (gameLoop.ts)
  └─ MovementController (gameLoop.ts)

store.ts
  ├─ types.ts
  ├─ constants.ts
  └─ roomData.ts

renderer.ts
  ├─ types.ts
  └─ constants.ts

input.ts
  └─ types.ts

gameLoop.ts
  ├─ types.ts
  └─ constants.ts

roomData.ts
  └─ types.ts
```

## Future Architecture Considerations

### Phase 2: Room System
- Room loader
- Room transitions
- Door activation
- Camera panning

### Phase 3: Interaction System
- Object registry
- Interaction handlers
- Context menus
- Action queue

### Phase 4: Inventory System
- Item definitions
- Inventory state
- Item combinations
- UI overlay

### Phase 5+: Advanced Features
- NPC AI system
- Dialogue engine
- Quest system
- Save/load manager
- Audio system
- Particle effects
