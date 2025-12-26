import type { Room, TileType } from './types';

// ========================================
// CELL C-14 (Player's Cell)
// ========================================

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

export const cellC14: Room = {
  id: 'cell_c14',
  name: 'Cell C-14',
  width: 10,
  height: 8,
  tiles: cellLayout,
  startPosition: { x: 4, y: 4 },
  exits: [
    {
      id: 'cell_door_left',
      position: { x: 4, y: 7 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_cell_c14',
      type: 'door',
      state: 'open',
    },
    {
      id: 'cell_door_right',
      position: { x: 5, y: 7 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_cell_c14',
      type: 'door',
      state: 'open',
    },
  ],
  spawnPoints: [
    {
      id: 'default',
      position: { x: 4, y: 4 },
      direction: 'down',
    },
    {
      id: 'from_corridor',
      position: { x: 4, y: 6 },
      direction: 'up',
    },
  ],
};

// ========================================
// CELL C-12 (Old Timer's Cell)
// ========================================

const cellC12Layout: TileType[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'bed', 'bed', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'bed', 'bed', 'floor', 'floor', 'floor', 'floor', 'toilet', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'desk', 'desk', 'floor', 'floor', 'floor', 'floor', 'sink', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'door', 'door', 'wall', 'wall', 'wall', 'wall'],
];

export const cellC12: Room = {
  id: 'cell_c12',
  name: 'Cell C-12',
  width: 10,
  height: 8,
  tiles: cellC12Layout,
  startPosition: { x: 4, y: 4 },
  exits: [
    {
      id: 'cell_door_left',
      position: { x: 4, y: 7 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_cell_c12',
      type: 'door',
      state: 'open',
    },
    {
      id: 'cell_door_right',
      position: { x: 5, y: 7 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_cell_c12',
      type: 'door',
      state: 'open',
    },
  ],
  spawnPoints: [
    {
      id: 'default',
      position: { x: 4, y: 4 },
      direction: 'down',
    },
    {
      id: 'from_corridor',
      position: { x: 4, y: 6 },
      direction: 'up',
    },
  ],
};

// ========================================
// CORRIDOR (Cell Block B)
// ========================================

const corridorLayout: TileType[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'door', 'wall', 'wall', 'wall', 'wall', 'wall', 'door', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['door', 'door', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'door', 'door', 'wall', 'wall', 'wall', 'wall', 'wall', 'door', 'door', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
];

export const corridor: Room = {
  id: 'corridor_b',
  name: 'Cell Block B Corridor',
  width: 20,
  height: 8,
  tiles: corridorLayout,
  startPosition: { x: 11, y: 3 },
  exits: [
    // Cell doors (top wall)
    {
      id: 'cell_c12_door',
      position: { x: 5, y: 2 },
      targetRoom: 'cell_c12',
      targetSpawn: 'from_corridor',
      type: 'door',
      state: 'open',
    },
    {
      id: 'cell_c14_door',
      position: { x: 11, y: 2 },
      targetRoom: 'cell_c14',
      targetSpawn: 'from_corridor',
      type: 'door',
      state: 'open',
    },
    // Cafeteria doors (left wall)
    {
      id: 'cafeteria_door_left',
      position: { x: 0, y: 6 },
      targetRoom: 'cafeteria',
      targetSpawn: 'from_corridor',
      type: 'door',
      state: 'open', // Time-locked
    },
    {
      id: 'cafeteria_door_right',
      position: { x: 1, y: 6 },
      targetRoom: 'cafeteria',
      targetSpawn: 'from_corridor',
      type: 'door',
      state: 'open',
    },
    // Yard gates (bottom middle)
    {
      id: 'yard_gate_left',
      position: { x: 10, y: 6 },
      targetRoom: 'yard',
      targetSpawn: 'from_corridor',
      type: 'door',
      state: 'open', // Time-locked
    },
    {
      id: 'yard_gate_right',
      position: { x: 11, y: 6 },
      targetRoom: 'yard',
      targetSpawn: 'from_corridor',
      type: 'door',
      state: 'open',
    },
    // Guard station (right wall)
    {
      id: 'guard_station_door_left',
      position: { x: 17, y: 6 },
      targetRoom: 'guard_station_b',
      targetSpawn: 'from_corridor',
      type: 'door',
      state: 'open',
    },
    {
      id: 'guard_station_door_right',
      position: { x: 18, y: 6 },
      targetRoom: 'guard_station_b',
      targetSpawn: 'from_corridor',
      type: 'door',
      state: 'open',
    },
  ],
  spawnPoints: [
    {
      id: 'from_cell_c12',
      position: { x: 5, y: 3 },
      direction: 'down',
    },
    {
      id: 'from_cell_c14',
      position: { x: 11, y: 3 },
      direction: 'down',
    },
    {
      id: 'from_guard_station',
      position: { x: 17, y: 5 },
      direction: 'up',
    },
    {
      id: 'from_cafeteria',
      position: { x: 1, y: 5 },
      direction: 'right',
    },
    {
      id: 'from_yard',
      position: { x: 10, y: 5 },
      direction: 'up',
    },
  ],
};

// ========================================
// GUARD STATION B
// ========================================

const guardStationLayout: TileType[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'desk', 'desk', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'desk', 'desk', 'floor', 'floor', 'floor', 'locker', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'chair', 'floor', 'floor', 'floor', 'locker', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'door', 'door', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
];

export const guardStation: Room = {
  id: 'guard_station_b',
  name: 'Guard Station B',
  width: 12,
  height: 10,
  tiles: guardStationLayout,
  startPosition: { x: 2, y: 7 },
  exits: [
    {
      id: 'corridor_door_left',
      position: { x: 2, y: 8 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_guard_station',
      type: 'door',
      state: 'open',
    },
    {
      id: 'corridor_door_right',
      position: { x: 3, y: 8 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_guard_station',
      type: 'door',
      state: 'open',
    },
  ],
  spawnPoints: [
    {
      id: 'from_corridor',
      position: { x: 2, y: 7 },
      direction: 'up',
    },
  ],
};

// ========================================
// CAFETERIA
// ========================================

const cafeteriaLayout: TileType[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'desk', 'desk', 'floor', 'floor', 'desk', 'desk', 'floor', 'floor', 'desk', 'desk', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'desk', 'desk', 'floor', 'floor', 'desk', 'desk', 'floor', 'floor', 'desk', 'desk', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'desk', 'desk', 'floor', 'floor', 'desk', 'desk', 'floor', 'floor', 'desk', 'desk', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'desk', 'desk', 'floor', 'floor', 'desk', 'desk', 'floor', 'floor', 'desk', 'desk', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'door', 'door', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
];

export const cafeteria: Room = {
  id: 'cafeteria',
  name: 'Cafeteria',
  width: 15,
  height: 11,
  tiles: cafeteriaLayout,
  startPosition: { x: 7, y: 9 },
  exits: [
    {
      id: 'cafeteria_door_left',
      position: { x: 5, y: 10 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_cafeteria',
      type: 'door',
      state: 'open', // Time-locked, but starts as potentially open
    },
    {
      id: 'cafeteria_door_right',
      position: { x: 6, y: 10 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_cafeteria',
      type: 'door',
      state: 'open',
    },
  ],
  spawnPoints: [
    {
      id: 'from_corridor',
      position: { x: 5, y: 9 },
      direction: 'up',
    },
  ],
};

// ========================================
// YARD
// ========================================

const yardLayout: TileType[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'door', 'door', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
];

export const yard: Room = {
  id: 'yard',
  name: 'Recreation Yard',
  width: 20,
  height: 13,
  tiles: yardLayout,
  startPosition: { x: 10, y: 11 },
  exits: [
    {
      id: 'yard_gate_left',
      position: { x: 9, y: 12 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_yard',
      type: 'door',
      state: 'open', // Time-locked
    },
    {
      id: 'yard_gate_right',
      position: { x: 10, y: 12 },
      targetRoom: 'corridor_b',
      targetSpawn: 'from_yard',
      type: 'door',
      state: 'open',
    },
  ],
  spawnPoints: [
    {
      id: 'from_corridor',
      position: { x: 9, y: 11 },
      direction: 'up',
    },
  ],
};

// ========================================
// ROOM REGISTRY
// ========================================

export const ROOMS: Record<string, Room> = {
  cell_c12: cellC12,
  cell_c14: cellC14,
  corridor_b: corridor,
  guard_station_b: guardStation,
  cafeteria: cafeteria,
  yard: yard,
};

// Backwards compatibility
export const prisonCell = cellC14;
