import type { NPCData, Position, Direction, Room, TimePeriodId, NPCScheduleEntry } from './types';
import { TILE_SIZE, isTileWalkable } from './constants';

// ========================================
// PATROL SYSTEM
// ========================================

/**
 * Updates an NPC's patrol behavior
 * Returns updated NPC state
 */
export function updatePatrol(
  npc: NPCData,
  deltaTime: number,
  currentRoom: Room
): Partial<NPCData> {
  // Only patrol if behavior is 'patrol' and has a route
  if (npc.currentBehavior !== 'patrol' || npc.patrolRoute.length === 0) {
    return {};
  }

  const currentPoint = npc.patrolRoute[npc.currentPatrolIndex];

  // If not moving, we're waiting at a waypoint
  if (!npc.isMoving) {
    // Initialize wait timer if not set
    const waitTimer = npc.waitTimer ?? 0;
    const waitDuration = currentPoint.wait ?? 0;

    // Check if we've waited long enough
    if (waitTimer < waitDuration) {
      // Still waiting, increment timer
      return {
        waitTimer: waitTimer + deltaTime,
      };
    }

    // Done waiting, start moving to next waypoint
    const nextIndex = (npc.currentPatrolIndex + 1) % npc.patrolRoute.length;
    const nextPoint = npc.patrolRoute[nextIndex];

    console.log(`[${npc.name}] Starting movement from (${npc.position.x}, ${npc.position.y}) to (${nextPoint.col}, ${nextPoint.row})`);

    // Start moving to next point
    return {
      isMoving: true,
      targetPosition: { x: nextPoint.col, y: nextPoint.row },
      targetPixelPosition: {
        x: nextPoint.col * TILE_SIZE,
        y: nextPoint.row * TILE_SIZE,
      },
      currentPatrolIndex: nextIndex,
      waitTimer: 0, // Reset wait timer
      direction: getDirectionToTarget(npc.position, {
        x: nextPoint.col,
        y: nextPoint.row,
      }),
    };
  }

  // If moving, update position
  if (npc.targetPosition) {
    const targetPixel = {
      x: npc.targetPosition.x * TILE_SIZE,
      y: npc.targetPosition.y * TILE_SIZE,
    };

    // Calculate movement this frame
    const speed = npc.movementSpeed * TILE_SIZE; // pixels per second
    const distance = speed * deltaTime;

    const dx = targetPixel.x - npc.pixelPosition.x;
    const dy = targetPixel.y - npc.pixelPosition.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    if (distToTarget <= distance) {
      // Reached target
      console.log(`[${npc.name}] Reached target (${npc.targetPosition.x}, ${npc.targetPosition.y})`);
      return {
        position: npc.targetPosition,
        pixelPosition: targetPixel,
        targetPixelPosition: targetPixel,
        isMoving: false,
        targetPosition: null,
        direction: currentPoint.direction || npc.direction,
      };
    } else {
      // Move toward target
      const ratio = distance / distToTarget;
      const newPixelPos = {
        x: npc.pixelPosition.x + dx * ratio,
        y: npc.pixelPosition.y + dy * ratio,
      };

      // Update grid position to match current pixel position (for interaction detection)
      // Calculate which tile the CENTER of the NPC is on
      const centerX = newPixelPos.x + TILE_SIZE / 2;
      const centerY = newPixelPos.y + TILE_SIZE / 2;
      const newGridPos = {
        x: Math.floor(centerX / TILE_SIZE),
        y: Math.floor(centerY / TILE_SIZE),
      };

      return {
        pixelPosition: newPixelPos,
        position: newGridPos,
      };
    }
  }

  return {};
}

/**
 * Get direction from one position to another
 */
function getDirectionToTarget(from: Position, to: Position): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
}

// ========================================
// VISION SYSTEM
// ========================================

/**
 * Check if player is within NPC's vision cone
 */
export function isPlayerInVisionCone(
  npc: NPCData,
  playerPos: Position,
  room: Room
): boolean {
  // No vision if range is 0
  if (npc.visionRange === 0) return false;

  const dx = playerPos.x - npc.position.x;
  const dy = playerPos.y - npc.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Check if within range
  if (distance > npc.visionRange) return false;
  if (distance === 0) return true; // Same tile

  // Check if within angle cone
  const angleToPlayer = Math.atan2(dy, dx) * (180 / Math.PI);
  const guardAngle = getAngleFromDirection(npc.direction);
  const halfCone = npc.visionAngle / 2;

  let angleDiff = Math.abs(angleToPlayer - guardAngle);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;

  if (angleDiff > halfCone) return false;

  // Check line of sight (no walls blocking)
  return hasLineOfSight(npc.position, playerPos, room);
}

/**
 * Get angle in degrees from direction
 */
function getAngleFromDirection(direction: Direction): number {
  switch (direction) {
    case 'right':
      return 0;
    case 'down':
      return 90;
    case 'left':
      return 180;
    case 'up':
      return 270;
    default:
      return 0;
  }
}

/**
 * Check if there's a clear line of sight between two positions
 * Returns false if walls or closed doors block the view
 */
export function hasLineOfSight(from: Position, to: Position, room: Room): boolean {
  // Simple raycast
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(Math.abs(dx), Math.abs(dy));

  for (let i = 0; i <= distance; i++) {
    const t = distance === 0 ? 0 : i / distance;
    const x = Math.round(from.x + dx * t);
    const y = Math.round(from.y + dy * t);

    // Check bounds
    if (x < 0 || x >= room.width || y < 0 || y >= room.height) {
      return false;
    }

    // Check if tile blocks vision
    const tile = room.tiles[y][x];
    if (tile === 'wall') {
      return false;
    }
    // Closed doors block vision (for now, all doors are open, so this is future-proofing)
  }

  return true;
}

/**
 * Calculate detection level based on player state
 * Returns 0-1, where 1 = fully detected
 */
export function calculateDetectionLevel(
  npc: NPCData,
  playerPos: Position,
  playerSneaking: boolean,
  room: Room
): number {
  if (!isPlayerInVisionCone(npc, playerPos, room)) {
    return 0;
  }

  // Base detection
  let detection = 1.0;

  // Reduce detection if sneaking
  if (playerSneaking) {
    detection *= 0.6; // 40% harder to detect when sneaking
  }

  // Distance falloff
  const dx = playerPos.x - npc.position.x;
  const dy = playerPos.y - npc.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const distanceFactor = 1 - distance / npc.visionRange;
  detection *= distanceFactor;

  return Math.max(0, Math.min(1, detection));
}

// ========================================
// ALERT SYSTEM
// ========================================

/**
 * Increase NPC alertness
 */
export function increaseAlertness(npc: NPCData, amount: number): number {
  return Math.min(100, npc.alertness + amount);
}

/**
 * Decrease NPC alertness over time
 */
export function decreaseAlertness(npc: NPCData, deltaTime: number): number {
  // Decrease by 5 per second when nothing suspicious
  const decrease = 5 * deltaTime;
  return Math.max(0, npc.alertness - decrease);
}

/**
 * Determine if NPC should react to player
 */
export function shouldReactToPlayer(npc: NPCData, detectionLevel: number): boolean {
  // Guards react if detection is above threshold
  if (npc.type === 'guard') {
    return detectionLevel > 0.5; // 50% detection threshold
  }

  // Inmates and staff don't react to player visibility
  return false;
}

// ========================================
// NPC INTERACTION
// ========================================

/**
 * Check if NPC is adjacent to player (for dialogue)
 */
export function isNPCAdjacentToPlayer(npc: NPCData, playerPos: Position): boolean {
  const dx = Math.abs(npc.position.x - playerPos.x);
  const dy = Math.abs(npc.position.y - playerPos.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

/**
 * Check if NPC can be talked to
 */
export function canTalkToNPC(npc: NPCData, playerPos: Position): boolean {
  if (!npc.isConscious || !npc.isAlive) return false;
  if (!npc.dialogueTree) return false;
  if (npc.currentBehavior === 'chase') return false;

  return isNPCAdjacentToPlayer(npc, playerPos);
}

// ========================================
// SCHEDULE SYSTEM
// ========================================

/**
 * Update NPC based on current time period
 * Returns changes to apply to NPC
 *
 * @param npc - The NPC to update
 * @param currentPeriod - The current time period
 * @param playerCurrentRoom - The room the player is currently in (to avoid teleporting visible NPCs)
 */
export function updateNPCSchedule(
  npc: NPCData,
  currentPeriod: TimePeriodId,
  playerCurrentRoom?: string
): Partial<NPCData> {
  const scheduleEntry = npc.schedule[currentPeriod];

  if (!scheduleEntry) {
    return {}; // No schedule entry for this period
  }

  const changes: Partial<NPCData> = {};

  // Check if behavior should change
  if (scheduleEntry.behavior !== npc.currentBehavior) {
    changes.currentBehavior = scheduleEntry.behavior;
  }

  // Check if room should change
  if (scheduleEntry.room && scheduleEntry.room !== npc.currentRoom) {
    // Only teleport NPCs that aren't in the player's current room
    // This prevents jarring teleports of visible NPCs
    if (npc.currentRoom !== playerCurrentRoom && scheduleEntry.room !== playerCurrentRoom) {
      // NPC is off-screen, safe to teleport
      changes.currentRoom = scheduleEntry.room;

      const newPosition = getSpawnPositionForRoom(scheduleEntry.room);
      changes.position = newPosition;
      changes.pixelPosition = {
        x: newPosition.x * TILE_SIZE,
        y: newPosition.y * TILE_SIZE,
      };
      changes.targetPixelPosition = {
        x: newPosition.x * TILE_SIZE,
        y: newPosition.y * TILE_SIZE,
      };
      changes.isMoving = false;
      changes.targetPosition = null;
    } else {
      // NPC is visible to player - they need to walk to the exit
      // For now, we'll just mark them as needing to transition
      // In a full implementation, you'd pathfind them to the exit
      console.log(`[${npc.name}] Should transition from ${npc.currentRoom} to ${scheduleEntry.room} (visible to player)`);
      // TODO: Implement visible NPC room transitions
    }
  }

  return changes;
}

/**
 * Get spawn position for a room
 * This should ideally use room data, but for now we'll use simple positions
 */
function getSpawnPositionForRoom(roomId: string): Position {
  // Default positions for each room
  const positions: Record<string, Position> = {
    'cell_c12': { x: 2, y: 3 },
    'cell_c14': { x: 4, y: 4 },
    'corridor_b': { x: 10, y: 4 },
    'guard_station_b': { x: 5, y: 5 },
    'cafeteria': { x: 7, y: 5 },
    'yard': { x: 10, y: 8 },
  };

  return positions[roomId] || { x: 5, y: 5 };
}
