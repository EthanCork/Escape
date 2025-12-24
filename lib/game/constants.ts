import type { Tile, TileType } from './types';

// Rendering constants
export const TILE_SIZE = 32;
export const MOVE_DURATION = 180; // milliseconds
export const TARGET_FPS = 60;
export const TRANSITION_DURATION = 250; // milliseconds for fade in/out

// Color palette (placeholder graphics)
export const COLORS = {
  floor: '#3d3d3d',
  wall: '#1a1a1a',
  furniture: '#2d2d2d',
  door: '#8b4513',
  player: '#4a90d9',
  grid: '#2a2a2a',
  background: '#000000',
} as const;

// Tile definitions
export const TILE_DEFINITIONS: Record<TileType, Tile> = {
  floor: { type: 'floor', walkable: true },
  wall: { type: 'wall', walkable: false },
  bed: { type: 'bed', walkable: false },
  desk: { type: 'desk', walkable: false },
  toilet: { type: 'toilet', walkable: false },
  sink: { type: 'sink', walkable: false },
  door: { type: 'door', walkable: true }, // Doors are now walkable (will trigger transitions)
  chair: { type: 'chair', walkable: false },
  locker: { type: 'locker', walkable: false },
};

// Helper function to check if a tile is walkable
export const isTileWalkable = (tileType: TileType): boolean => {
  return TILE_DEFINITIONS[tileType].walkable;
};

// Helper function to get tile color
export const getTileColor = (tileType: TileType): string => {
  switch (tileType) {
    case 'floor':
      return COLORS.floor;
    case 'wall':
      return COLORS.wall;
    case 'bed':
    case 'desk':
    case 'toilet':
    case 'sink':
    case 'chair':
    case 'locker':
      return COLORS.furniture;
    case 'door':
      return COLORS.door;
    default:
      return COLORS.floor;
  }
};
