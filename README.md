# Irongate Penitentiary

A top-down prison escape game built with Next.js, TypeScript, and HTML5 Canvas.

## Current Status: Phase 1 Complete

Phase 1 establishes the foundation: a playable prison cell where the player can walk around freely without passing through walls or furniture.

## Quick Start

```bash
npm install
npm run dev
```

Open your browser to the URL shown (typically http://localhost:3000)

## Controls

- **Arrow Keys** or **WASD** - Move the player
- Movement is grid-based (tile by tile)
- Smooth interpolation between tiles

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page component
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   └── GameCanvas.tsx     # Main game component
├── lib/game/              # Core game logic
│   ├── types.ts           # TypeScript type definitions
│   ├── constants.ts       # Game constants and helpers
│   ├── roomData.ts        # Room layout definitions
│   ├── store.ts           # Zustand state management
│   ├── input.ts           # Keyboard input handling
│   ├── renderer.ts        # Canvas rendering
│   └── gameLoop.ts        # Game loop and movement
└── TESTING.md             # Testing checklist
```

## Architecture

**State Management**: Zustand for simple, performant state updates

**Rendering**: HTML5 Canvas with custom renderer module

**Input**: Event-driven keyboard manager with arrow keys + WASD support

**Movement**: Grid-based with smooth interpolation (180ms per tile)

**Collision**: Tile-based walkability checking

## Technical Details

- **Grid**: 10 tiles wide × 8 tiles tall
- **Tile Size**: 32×32 pixels
- **Canvas Size**: 320×256 pixels
- **Target FPS**: 60
- **Movement Duration**: 180ms per tile

## Features

- Grid-based movement system
- Smooth tile-to-tile interpolation
- Collision detection with walls and furniture
- Debug overlay (FPS, position, direction)
- Responsive input handling

## What's Next

Future phases will add:
- Multiple connected rooms
- Interactable objects
- Inventory system
- NPCs and dialogue
- Puzzle mechanics
- Pixel art sprites

## Testing

See [TESTING.md](./TESTING.md) for the complete testing checklist and success criteria.

## License

ISC
