import type { Position, InteractiveObject, ObjectState, ActionType, ActionDefinition } from './types';

// ========================================
// PROXIMITY DETECTION
// ========================================

/**
 * Calculates the distance between two positions
 */
const getDistance = (pos1: Position, pos2: Position): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Checks if a position is adjacent to another position (8-directional)
 * Adjacent means within 1 tile in any direction, including diagonals
 */
export const isAdjacent = (pos1: Position, pos2: Position): boolean => {
  const dx = Math.abs(pos1.x - pos2.x);
  const dy = Math.abs(pos1.y - pos2.y);
  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
};

/**
 * Checks if the player is adjacent to any tile of an object
 */
export const isAdjacentToObject = (playerPos: Position, object: InteractiveObject): boolean => {
  return object.positions.some((objPos) => isAdjacent(playerPos, objPos));
};

/**
 * Finds the closest object to the player from a list of objects
 * Returns null if no objects are adjacent
 */
export const findClosestObject = (
  playerPos: Position,
  objects: InteractiveObject[]
): InteractiveObject | null => {
  const adjacentObjects = objects.filter((obj) => isAdjacentToObject(playerPos, obj));

  if (adjacentObjects.length === 0) return null;
  if (adjacentObjects.length === 1) return adjacentObjects[0];

  // Find the closest object by calculating distance to nearest tile
  let closestObject: InteractiveObject | null = null;
  let minDistance = Infinity;

  for (const obj of adjacentObjects) {
    for (const objPos of obj.positions) {
      const distance = getDistance(playerPos, objPos);
      if (distance < minDistance) {
        minDistance = distance;
        closestObject = obj;
      }
    }
  }

  return closestObject;
};

/**
 * Gets the center position of an object (for menu placement)
 */
export const getObjectCenter = (object: InteractiveObject): Position => {
  if (object.positions.length === 1) {
    return object.positions[0];
  }

  const sumX = object.positions.reduce((sum, pos) => sum + pos.x, 0);
  const sumY = object.positions.reduce((sum, pos) => sum + pos.y, 0);

  return {
    x: Math.floor(sumX / object.positions.length),
    y: Math.floor(sumY / object.positions.length),
  };
};

// ========================================
// ACTION AVAILABILITY
// ========================================

/**
 * Creates the initial state for an object
 */
export const createInitialObjectState = (objectId: string): ObjectState => ({
  objectId,
  searched: false,
  itemFound: false,
  open: false,
  locked: false,
  enabled: true,
});

/**
 * Checks if an action is available for an object given its current state
 */
export const isActionAvailable = (
  action: ActionType,
  object: InteractiveObject,
  state: ObjectState
): boolean => {
  // Action must be defined on the object
  if (!object.actions.includes(action)) {
    return false;
  }

  // Check specific action requirements
  switch (action) {
    case 'examine':
      // Examine is always available if defined
      return true;

    case 'search':
      // Search is available if object has search capability
      return object.actions.includes('search');

    case 'use':
      // Use is available if object has use capability
      return object.actions.includes('use');

    case 'unlock':
      // Unlock is available if object is locked and player has key
      // For Phase 3, we don't have inventory yet, so always unavailable
      return false;

    case 'open':
      // Open is available if object can be opened and is currently closed
      return object.actions.includes('open') && !state.open;

    case 'close':
      // Close is available if object can be closed and is currently open
      return object.actions.includes('close') && state.open;

    case 'take':
      // Take is available if object can be taken and hasn't been taken yet
      return object.actions.includes('take') && !state.itemFound;

    default:
      return false;
  }
};

/**
 * Builds the list of available actions for an object
 */
export const getAvailableActions = (
  object: InteractiveObject,
  state: ObjectState
): ActionDefinition[] => {
  const actions: ActionDefinition[] = [];

  // Check each possible action type
  const actionTypes: ActionType[] = ['examine', 'search', 'use', 'open', 'close', 'unlock', 'take'];

  for (const actionType of actionTypes) {
    if (object.actions.includes(actionType)) {
      const available = isActionAvailable(actionType, object, state);
      actions.push({
        id: actionType,
        name: capitalizeFirst(actionType),
        available,
      });
    }
  }

  return actions;
};

/**
 * Gets the default selected action (first available action, preferring the object's default)
 */
export const getDefaultSelectedAction = (actions: ActionDefinition[]): number => {
  const availableIndex = actions.findIndex((a) => a.available);
  return availableIndex >= 0 ? availableIndex : 0;
};

// ========================================
// ACTION EXECUTION
// ========================================

export interface ActionResult {
  success: boolean;
  message: string;
  stateChanges?: Partial<ObjectState>;
  itemFound?: {
    itemId: string;
    name: string;
    description: string;
  };
}

/**
 * Executes an action on an object and returns the result
 */
export const executeAction = (
  action: ActionType,
  object: InteractiveObject,
  state: ObjectState
): ActionResult => {
  switch (action) {
    case 'examine':
      return {
        success: true,
        message: object.examineText,
      };

    case 'search':
      if (state.searched) {
        return {
          success: true,
          message: object.searchEmptyText || "You've already searched here.",
        };
      }

      if (object.hiddenItem) {
        return {
          success: true,
          message: object.searchFindText || `You found ${object.hiddenItem.name}!`,
          stateChanges: {
            searched: true,
            itemFound: true,
          },
          itemFound: object.hiddenItem,
        };
      }

      return {
        success: true,
        message: "You search thoroughly but find nothing of interest.",
        stateChanges: {
          searched: true,
        },
      };

    case 'use':
      return {
        success: true,
        message: object.useText || `You use the ${object.name.toLowerCase()}.`,
      };

    case 'open':
      if (state.locked) {
        return {
          success: false,
          message: object.lockedText || `The ${object.name.toLowerCase()} is locked.`,
        };
      }

      return {
        success: true,
        message: `You open the ${object.name.toLowerCase()}.`,
        stateChanges: {
          open: true,
        },
      };

    case 'close':
      return {
        success: true,
        message: `You close the ${object.name.toLowerCase()}.`,
        stateChanges: {
          open: false,
        },
      };

    case 'unlock':
      return {
        success: false,
        message: "You don't have the right key.",
      };

    case 'take':
      if (object.hiddenItem) {
        return {
          success: true,
          message: `You take the ${object.name.toLowerCase()}.`,
          stateChanges: {
            itemFound: true,
          },
          itemFound: object.hiddenItem,
        };
      }
      return {
        success: false,
        message: "You can't take that.",
      };

    default:
      return {
        success: false,
        message: "You can't do that.",
      };
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Capitalizes the first letter of a string
 */
const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
