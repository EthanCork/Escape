import type { NPCData, Position, Direction, Room } from './types';
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
    // Check if we should start moving to next waypoint
    // For simplicity, we'll just move immediately (no wait logic yet)
    const nextIndex = (npc.currentPatrolIndex + 1) % npc.patrolRoute.length;
    const nextPoint = npc.patrolRoute[nextIndex];

    // Start moving to next point
    return {
      isMoving: true,
      targetPosition: { x: nextPoint.col, y: nextPoint.row },
      targetPixelPosition: {
        x: nextPoint.col * TILE_SIZE,
        y: nextPoint.row * TILE_SIZE,
      },
      currentPatrolIndex: nextIndex,
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
      return {
        pixelPosition: {
          x: npc.pixelPosition.x + dx * ratio,
          y: npc.pixelPosition.y + dy * ratio,
        },
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
