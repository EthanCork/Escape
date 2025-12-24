import type { Room, TileType } from './types';

// W = wall, F = floor, B = bed, D = desk, T = toilet, S = sink, O = door
const cellLayout: TileType[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'bed', 'bed', 'floor', 'floor', 'floor', 'floor', 'toilet', 'floor', 'wall'],
  ['wall', 'bed', 'bed', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'sink', 'floor', 'wall'],
  ['wall', 'desk', 'desk', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'door', 'door', 'wall', 'wall', 'wall', 'wall'],
];

export const prisonCell: Room = {
  width: 10,
  height: 8,
  tiles: cellLayout,
  startPosition: { x: 4, y: 4 }, // Center-ish of the walkable area
};
