import { create } from 'zustand';
import type { GameState, Direction, Position, Room } from './types';
import { cellC14, ROOMS } from './roomData';
import { TILE_SIZE, isTileWalkable, TRANSITION_DURATION } from './constants';

interface GameStore extends GameState {
  // Actions
  movePlayer: (direction: Direction) => void;
  updatePlayerPixelPosition: (position: Position) => void;
  completePlayerMove: () => void;
  setInput: (direction: Direction, pressed: boolean) => void;
  toggleDebug: () => void;
  startTransition: (targetRoomId: string, targetSpawnId: string) => void;
  updateTransition: (currentTime: number) => void;
  changeRoom: (roomId: string, spawnId: string) => void;
}

// Helper to convert grid position to pixel position
const gridToPixel = (gridPos: Position): Position => ({
  x: gridPos.x * TILE_SIZE,
  y: gridPos.y * TILE_SIZE,
});

// Initial player state
const initialPlayerPosition = cellC14.startPosition;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  player: {
    gridPosition: { ...initialPlayerPosition },
    pixelPosition: gridToPixel(initialPlayerPosition),
    targetPixelPosition: gridToPixel(initialPlayerPosition),
    direction: 'down',
    isMoving: false,
  },
  currentRoom: cellC14,
  previousRoom: null,
  input: {
    up: false,
    down: false,
    left: false,
    right: false,
  },
  debugMode: true, // Start with debug mode on to see grid
  transition: {
    isTransitioning: false,
    phase: null,
    progress: 0,
    targetRoom: null,
    targetSpawn: null,
    startTime: 0,
  },

  // Actions
  movePlayer: (direction: Direction) => {
    const state = get();

    // Don't allow new moves while already moving or transitioning
    if (state.player.isMoving || state.transition.isTransitioning) return;

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

    // Check if this position is an exit
    const exit = state.currentRoom.exits.find(
      (e) => e.position.x === newPos.x && e.position.y === newPos.y
    );

    if (exit && (exit.state === 'open' || exit.state === 'unlocked')) {
      // Trigger room transition
      get().startTransition(exit.targetRoom, exit.targetSpawn);
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

  startTransition: (targetRoomId: string, targetSpawnId: string) => {
    set({
      transition: {
        isTransitioning: true,
        phase: 'fadeOut',
        progress: 0,
        targetRoom: targetRoomId,
        targetSpawn: targetSpawnId,
        startTime: performance.now(),
      },
    });
  },

  updateTransition: (currentTime: number) => {
    const state = get();
    if (!state.transition.isTransitioning) return;

    const elapsed = currentTime - state.transition.startTime;

    if (state.transition.phase === 'fadeOut') {
      const progress = Math.min(elapsed / TRANSITION_DURATION, 1);

      if (progress >= 1) {
        // Fade out complete, switch rooms
        if (state.transition.targetRoom && state.transition.targetSpawn) {
          get().changeRoom(state.transition.targetRoom, state.transition.targetSpawn);
        }
        set({
          transition: {
            ...state.transition,
            phase: 'fadeIn',
            startTime: currentTime,
            progress: 1,
          },
        });
      } else {
        set({
          transition: {
            ...state.transition,
            progress,
          },
        });
      }
    } else if (state.transition.phase === 'fadeIn') {
      const progress = 1 - Math.min(elapsed / TRANSITION_DURATION, 1);

      if (progress <= 0) {
        // Fade in complete, transition done
        set({
          transition: {
            isTransitioning: false,
            phase: null,
            progress: 0,
            targetRoom: null,
            targetSpawn: null,
            startTime: 0,
          },
        });
      } else {
        set({
          transition: {
            ...state.transition,
            progress,
          },
        });
      }
    }
  },

  changeRoom: (roomId: string, spawnId: string) => {
    const state = get();
    const newRoom = ROOMS[roomId];

    if (!newRoom) {
      console.error(`Room ${roomId} not found`);
      return;
    }

    const spawnPoint = newRoom.spawnPoints.find((sp) => sp.id === spawnId);

    if (!spawnPoint) {
      console.error(`Spawn point ${spawnId} not found in room ${roomId}`);
      return;
    }

    const newPixelPosition = gridToPixel(spawnPoint.position);

    set({
      previousRoom: state.currentRoom,
      currentRoom: newRoom,
      player: {
        ...state.player,
        gridPosition: { ...spawnPoint.position },
        pixelPosition: newPixelPosition,
        targetPixelPosition: newPixelPosition,
        direction: spawnPoint.direction,
        isMoving: false,
      },
    });
  },
}));
