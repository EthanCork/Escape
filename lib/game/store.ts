import { create } from 'zustand';
import type { GameState, Direction, Position } from './types';
import { prisonCell } from './roomData';
import { TILE_SIZE, isTileWalkable } from './constants';

interface GameStore extends GameState {
  // Actions
  movePlayer: (direction: Direction) => void;
  updatePlayerPixelPosition: (position: Position) => void;
  completePlayerMove: () => void;
  setInput: (direction: Direction, pressed: boolean) => void;
  toggleDebug: () => void;
}

// Helper to convert grid position to pixel position
const gridToPixel = (gridPos: Position): Position => ({
  x: gridPos.x * TILE_SIZE,
  y: gridPos.y * TILE_SIZE,
});

// Initial player state
const initialPlayerPosition = prisonCell.startPosition;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  player: {
    gridPosition: { ...initialPlayerPosition },
    pixelPosition: gridToPixel(initialPlayerPosition),
    targetPixelPosition: gridToPixel(initialPlayerPosition),
    direction: 'down',
    isMoving: false,
  },
  currentRoom: prisonCell,
  input: {
    up: false,
    down: false,
    left: false,
    right: false,
  },
  debugMode: true, // Start with debug mode on to see grid

  // Actions
  movePlayer: (direction: Direction) => {
    const state = get();

    // Don't allow new moves while already moving
    if (state.player.isMoving) return;

    const currentPos = state.player.gridPosition;
    let newPos = { ...currentPos };

    // Calculate new position based on direction
    switch (direction) {
      case 'up':
        newPos.y -= 1;
        break;
      case 'down':
        newPos.y += 1;
        break;
      case 'left':
        newPos.x -= 1;
        break;
      case 'right':
        newPos.x += 1;
        break;
    }

    // Bounds check
    if (
      newPos.x < 0 ||
      newPos.x >= state.currentRoom.width ||
      newPos.y < 0 ||
      newPos.y >= state.currentRoom.height
    ) {
      // Out of bounds - just update direction
      set({
        player: {
          ...state.player,
          direction,
        },
      });
      return;
    }

    // Check if tile is walkable
    const tileType = state.currentRoom.tiles[newPos.y][newPos.x];
    if (!isTileWalkable(tileType)) {
      // Not walkable - just update direction
      set({
        player: {
          ...state.player,
          direction,
        },
      });
      return;
    }

    // Valid move - start moving
    const targetPixel = gridToPixel(newPos);
    set({
      player: {
        ...state.player,
        gridPosition: newPos,
        targetPixelPosition: targetPixel,
        direction,
        isMoving: true,
      },
    });
  },

  updatePlayerPixelPosition: (position: Position) => {
    set({
      player: {
        ...get().player,
        pixelPosition: position,
      },
    });
  },

  completePlayerMove: () => {
    const state = get();
    set({
      player: {
        ...state.player,
        pixelPosition: state.player.targetPixelPosition,
        isMoving: false,
      },
    });
  },

  setInput: (direction: Direction, pressed: boolean) => {
    set({
      input: {
        ...get().input,
        [direction]: pressed,
      },
    });
  },

  toggleDebug: () => {
    set({ debugMode: !get().debugMode });
  },
}));
