import type { NPCData, Position } from './types';
import { TILE_SIZE } from './constants';

// ========================================
// HELPER FUNCTIONS
// ========================================

const gridToPixel = (gridPos: Position): Position => ({
  x: gridPos.x * TILE_SIZE,
  y: gridPos.y * TILE_SIZE,
});

// ========================================
// GUARD A - Officer Martinez
// Regular patrol guard in corridor
// ========================================

export const guardMartinez: NPCData = {
  id: 'guard_martinez',
  name: 'Officer Martinez',
  type: 'guard',
  sprite: 'guard_regular',

  // Position - Starts in guard station at 06:00 (early_morning)
  currentRoom: 'guard_station_b',
  position: { x: 5, y: 5 },
  direction: 'down',

  // Movement
  patrolRoute: [
    { room: 'corridor_b', col: 2, row: 4, wait: 2, direction: 'right' },
    { room: 'corridor_b', col: 17, row: 4, wait: 2, direction: 'left' },
  ],
  currentPatrolIndex: 0,
  movementSpeed: 2, // tiles per second
  isMoving: false,
  targetPosition: null,
  pixelPosition: gridToPixel({ x: 5, y: 5 }),
  targetPixelPosition: gridToPixel({ x: 5, y: 5 }),

  // Behavior - Full daily schedule
  schedule: {
    'early_morning': {
      behavior: 'idle',
      room: 'guard_station_b',
    },
    'breakfast': {
      behavior: 'patrol',
      room: 'corridor_b',
      patrolRoute: 'corridor_main',
    },
    'morning_work': {
      behavior: 'patrol',
      room: 'corridor_b',
      patrolRoute: 'corridor_main',
    },
    'lunch': {
      behavior: 'patrol',
      room: 'corridor_b',
      patrolRoute: 'corridor_main',
    },
    'afternoon_work': {
      behavior: 'patrol',
      room: 'corridor_b',
      patrolRoute: 'corridor_main',
    },
    'recreation': {
      behavior: 'idle',
      room: 'guard_station_b',
    },
    'dinner': {
      behavior: 'idle',
      room: 'guard_station_b',
    },
    'evening_free': {
      behavior: 'idle',
      room: 'guard_station_b',
    },
    'lockdown': {
      behavior: 'idle',
      room: 'guard_station_b',
    },
  },
  currentBehavior: 'idle', // Starts at 06:00 (early_morning)
  alertness: 0,

  // Vision
  visionRange: 5,
  visionAngle: 90,

  // Dialogue
  dialogueTree: 'guard_generic',
  relationshipLevel: 0,
  talkedTo: false,

  // State
  isConscious: true,
  isAlive: true,
  flags: {},
};

// ========================================
// OLD TIMER - Experienced Inmate
// Stationary in Cell C-12, provides information
// ========================================

export const oldTimer: NPCData = {
  id: 'old_timer',
  name: 'Old Timer',
  type: 'inmate',
  sprite: 'inmate_old',

  // Position
  currentRoom: 'cell_c12',
  position: { x: 2, y: 3 },
  direction: 'down',

  // Movement
  patrolRoute: [], // Stationary
  currentPatrolIndex: 0,
  movementSpeed: 0,
  isMoving: false,
  targetPosition: null,
  pixelPosition: gridToPixel({ x: 2, y: 3 }),
  targetPixelPosition: gridToPixel({ x: 2, y: 3 }),

  // Behavior - Full daily schedule
  schedule: {
    'early_morning': {
      behavior: 'idle',
      room: 'cell_c12',
    },
    'breakfast': {
      behavior: 'idle',
      room: 'cafeteria',
    },
    'morning_work': {
      behavior: 'idle',
      room: 'yard',
    },
    'lunch': {
      behavior: 'idle',
      room: 'cafeteria',
    },
    'afternoon_work': {
      behavior: 'idle',
      room: 'yard',
    },
    'recreation': {
      behavior: 'idle',
      room: 'yard',
    },
    'dinner': {
      behavior: 'idle',
      room: 'cafeteria',
    },
    'evening_free': {
      behavior: 'idle',
      room: 'cell_c12',
    },
    'lockdown': {
      behavior: 'idle',
      room: 'cell_c12',
    },
  },
  currentBehavior: 'idle',
  alertness: 0,

  // Vision (doesn't detect player)
  visionRange: 0,
  visionAngle: 0,

  // Dialogue
  dialogueTree: 'old_timer_main',
  relationshipLevel: 0,
  talkedTo: false,

  // State
  isConscious: true,
  isAlive: true,
  flags: {
    told_about_tunnel: false,
    told_about_guard_schedule: false,
    told_about_vents: false,
  },
};

// ========================================
// NPC REGISTRY
// ========================================

export const NPCS: Record<string, NPCData> = {
  guard_martinez: guardMartinez,
  old_timer: oldTimer,
};

// Helper function to get NPCs in a specific room
export const getNPCsInRoom = (roomId: string): NPCData[] => {
  return Object.values(NPCS).filter((npc) => npc.currentRoom === roomId);
};

// Helper function to get NPC at a specific position
export const getNPCAtPosition = (roomId: string, position: Position): NPCData | null => {
  const npcs = getNPCsInRoom(roomId);
  return (
    npcs.find((npc) => npc.position.x === position.x && npc.position.y === position.y) || null
  );
};

// Helper function to get NPC adjacent to position
export const getNPCAdjacentToPosition = (
  roomId: string,
  position: Position
): NPCData | null => {
  const npcs = getNPCsInRoom(roomId);
  return (
    npcs.find((npc) => {
      const dx = Math.abs(npc.position.x - position.x);
      const dy = Math.abs(npc.position.y - position.y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }) || null
  );
};
