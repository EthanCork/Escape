import { create } from 'zustand';
import type { GameState, Direction, Position, Room, InteractiveObject, ActionType, ObjectState } from './types';
import { cellC14, ROOMS } from './roomData';
import { TILE_SIZE, isTileWalkable, TRANSITION_DURATION } from './constants';
import { getObjectsInRoom } from './interactiveObjects';
import {
  findClosestObject,
  getAvailableActions,
  getDefaultSelectedAction,
  executeAction,
  createInitialObjectState,
  getObjectCenter,
} from './interactions';
import {
  createInitialInventory,
  addItem,
  removeItem,
  dropItem,
  pickupDroppedItem,
  combineItems,
  useItem,
  canUseItemOn,
  hasRoomForItem,
} from './inventory';
import { getItem } from './items';

interface GameStore extends GameState {
  // Movement actions
  movePlayer: (direction: Direction) => void;
  updatePlayerPixelPosition: (position: Position) => void;
  completePlayerMove: () => void;
  setInput: (direction: Direction, pressed: boolean) => void;
  toggleDebug: () => void;
  giveTestItems: () => void;

  // Transition actions
  startTransition: (targetRoomId: string, targetSpawnId: string) => void;
  updateTransition: (currentTime: number) => void;
  changeRoom: (roomId: string, spawnId: string) => void;

  // Interaction actions
  updateTargetedObject: () => void;
  openContextMenu: () => void;
  closeContextMenu: () => void;
  navigateMenu: (direction: 'up' | 'down') => void;
  selectMenuAction: () => void;
  showText: (text: string, title?: string) => void;
  dismissText: () => void;
  getObjectState: (objectId: string) => ObjectState;
  updateObjectState: (objectId: string, changes: Partial<ObjectState>) => void;

  // Inventory actions
  openInventory: () => void;
  closeInventory: () => void;
  navigateInventory: (direction: 'up' | 'down' | 'left' | 'right') => void;
  selectInventorySlot: (slotIndex: number) => void;
  examineInventoryItem: (slotIndex: number) => void;
  dropInventoryItem: (slotIndex: number) => void;
  useInventoryItem: (slotIndex: number) => void;
  startCombine: (slotIndex: number) => void;
  finishCombine: (slotIndex: number) => void;
  cancelCombine: () => void;
  addItemToInventory: (itemId: string) => boolean;
  tryPickupDroppedItem: (roomId: string, itemIndex: number) => void;
  applyItemToObject: (itemId: string, objectId: string) => void;
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
  interaction: {
    mode: 'normal',
    targetedObject: null,
    contextMenu: {
      isOpen: false,
      objectId: null,
      actions: [],
      selectedIndex: 0,
      position: { x: 0, y: 0 },
    },
    textDisplay: {
      isVisible: false,
      text: '',
    },
    objectStates: {},
  },
  inventory: createInitialInventory(),

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

  // Debug function to add test items
  giveTestItems: () => {
    const state = get();
    // Add some test items to inventory
    get().addItemToInventory('sharpened_spoon');
    get().addItemToInventory('book');
    get().addItemToInventory('wire');
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

  // Interaction actions
  updateTargetedObject: () => {
    const state = get();

    // Don't update targeted object if menu is open or text is showing
    if (state.interaction.mode !== 'normal') return;

    const roomObjects = getObjectsInRoom(state.currentRoom.id);
    const targetedObject = findClosestObject(state.player.gridPosition, roomObjects);

    set({
      interaction: {
        ...state.interaction,
        targetedObject,
      },
    });
  },

  openContextMenu: () => {
    const state = get();

    // Can only open menu in normal mode
    if (state.interaction.mode !== 'normal') return;

    const targetedObject = state.interaction.targetedObject;
    if (!targetedObject) return;

    // Get object state
    const objectState = get().getObjectState(targetedObject.id);

    // Build available actions
    const actions = getAvailableActions(targetedObject, objectState);
    const selectedIndex = getDefaultSelectedAction(actions);

    // Calculate menu position (center of object, converted to pixels)
    const objectCenter = getObjectCenter(targetedObject);
    const menuPosition = gridToPixel(objectCenter);

    set({
      interaction: {
        ...state.interaction,
        mode: 'menu',
        contextMenu: {
          isOpen: true,
          objectId: targetedObject.id,
          actions,
          selectedIndex,
          position: menuPosition,
        },
      },
    });
  },

  closeContextMenu: () => {
    const state = get();

    set({
      interaction: {
        ...state.interaction,
        mode: 'normal',
        contextMenu: {
          isOpen: false,
          objectId: null,
          actions: [],
          selectedIndex: 0,
          position: { x: 0, y: 0 },
        },
      },
    });
  },

  navigateMenu: (direction: 'up' | 'down') => {
    const state = get();

    if (!state.interaction.contextMenu.isOpen) return;

    const actions = state.interaction.contextMenu.actions;
    const currentIndex = state.interaction.contextMenu.selectedIndex;

    let newIndex = currentIndex;
    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : actions.length - 1;
    } else {
      newIndex = currentIndex < actions.length - 1 ? currentIndex + 1 : 0;
    }

    set({
      interaction: {
        ...state.interaction,
        contextMenu: {
          ...state.interaction.contextMenu,
          selectedIndex: newIndex,
        },
      },
    });
  },

  selectMenuAction: () => {
    const state = get();

    if (!state.interaction.contextMenu.isOpen) return;

    const menu = state.interaction.contextMenu;
    const selectedAction = menu.actions[menu.selectedIndex];

    if (!selectedAction || !selectedAction.available) {
      // Show "not available" message if action is unavailable
      if (selectedAction) {
        get().showText(`You can't do that right now.`);
        get().closeContextMenu();
      }
      return;
    }

    // Get the object
    const targetedObject = state.interaction.targetedObject;
    if (!targetedObject) return;

    // Get object state
    const objectState = get().getObjectState(targetedObject.id);

    // Execute the action
    const result = executeAction(selectedAction.id, targetedObject, objectState);

    // Update object state if needed
    if (result.stateChanges) {
      get().updateObjectState(targetedObject.id, result.stateChanges);
    }

    // Handle item found from search
    if (result.itemFound && !state.inventory.takenItems.has(targetedObject.id)) {
      const success = get().addItemToInventory(result.itemFound.itemId);

      if (success) {
        // Mark as taken
        set({
          inventory: {
            ...state.inventory,
            takenItems: new Set([...state.inventory.takenItems, targetedObject.id]),
          },
        });
        // Close menu
        get().closeContextMenu();
        // Show success message
        get().showText(`Found ${result.itemFound.name}! Added to inventory.`, targetedObject.name);
      } else {
        // Inventory full
        get().closeContextMenu();
        get().showText(`You found ${result.itemFound.name}, but your inventory is full! Drop something and search again.`, targetedObject.name);
      }
      return;
    }

    // Close menu
    get().closeContextMenu();

    // Show result text
    get().showText(result.message, targetedObject.name);
  },

  showText: (text: string, title?: string) => {
    const state = get();

    set({
      interaction: {
        ...state.interaction,
        mode: 'text',
        textDisplay: {
          isVisible: true,
          text,
          title,
        },
      },
    });
  },

  dismissText: () => {
    const state = get();

    set({
      interaction: {
        ...state.interaction,
        mode: 'normal',
        textDisplay: {
          isVisible: false,
          text: '',
        },
      },
    });
  },

  getObjectState: (objectId: string): ObjectState => {
    const state = get();

    if (!state.interaction.objectStates[objectId]) {
      // Create initial state if it doesn't exist
      const initialState = createInitialObjectState(objectId);
      set({
        interaction: {
          ...state.interaction,
          objectStates: {
            ...state.interaction.objectStates,
            [objectId]: initialState,
          },
        },
      });
      return initialState;
    }

    return state.interaction.objectStates[objectId];
  },

  updateObjectState: (objectId: string, changes: Partial<ObjectState>) => {
    const state = get();
    const currentState = get().getObjectState(objectId);

    set({
      interaction: {
        ...state.interaction,
        objectStates: {
          ...state.interaction.objectStates,
          [objectId]: {
            ...currentState,
            ...changes,
          },
        },
      },
    });
  },

  // Inventory actions
  openInventory: () => {
    const state = get();

    // Only open from normal mode
    if (state.interaction.mode !== 'normal') return;

    set({
      interaction: {
        ...state.interaction,
        mode: 'inventory',
      },
      inventory: {
        ...state.inventory,
        isOpen: true,
      },
    });
  },

  closeInventory: () => {
    const state = get();

    set({
      interaction: {
        ...state.interaction,
        mode: 'normal',
      },
      inventory: {
        ...state.inventory,
        isOpen: false,
        useItemId: null,
        combineFirstItemSlot: null,
      },
    });
  },

  navigateInventory: (direction: 'up' | 'down' | 'left' | 'right') => {
    const state = get();
    if (!state.inventory.isOpen) return;

    const currentSlot = state.inventory.selectedSlot;
    let newSlot = currentSlot;

    // Grid is 2 rows x 3 columns (slots 0-5)
    // Row 0: slots 0, 1, 2
    // Row 1: slots 3, 4, 5

    const row = Math.floor(currentSlot / 3);
    const col = currentSlot % 3;

    switch (direction) {
      case 'up':
        if (row > 0) newSlot = currentSlot - 3;
        break;
      case 'down':
        if (row < 1) newSlot = currentSlot + 3;
        break;
      case 'left':
        if (col > 0) newSlot = currentSlot - 1;
        break;
      case 'right':
        if (col < 2) newSlot = currentSlot + 1;
        break;
    }

    set({
      inventory: {
        ...state.inventory,
        selectedSlot: newSlot,
      },
    });
  },

  selectInventorySlot: (slotIndex: number) => {
    const state = get();

    set({
      inventory: {
        ...state.inventory,
        selectedSlot: slotIndex,
      },
    });
  },

  examineInventoryItem: (slotIndex: number) => {
    const state = get();
    const slot = state.inventory.slots[slotIndex];

    if (!slot) return;

    const item = getItem(slot.itemId);
    if (!item) return;

    // Show item description
    let text = item.description;

    // Add contraband warning
    if (item.contrabandLevel !== 'none') {
      text += `\n\n⚠️ ${getContrabandWarning(item.contrabandLevel)}`;
    }

    // If it's a document, show readable content
    if (item.readableContent) {
      text = item.readableContent;
    }

    get().showText(text, item.name);
  },

  dropInventoryItem: (slotIndex: number) => {
    const state = get();
    const slot = state.inventory.slots[slotIndex];

    if (!slot) return;

    const item = getItem(slot.itemId);
    if (!item || !item.canDrop) {
      get().showText("You can't drop this item.");
      return;
    }

    // Drop at player's current position
    const result = dropItem(
      state.inventory,
      slotIndex,
      state.currentRoom.id,
      state.player.gridPosition
    );

    if (result.success) {
      set({
        inventory: {
          ...state.inventory,
          slots: result.updatedSlots,
          droppedItems: result.updatedDroppedItems,
        },
      });

      get().showText(`Dropped ${item.name}`);
    }
  },

  useInventoryItem: (slotIndex: number) => {
    const state = get();
    const slot = state.inventory.slots[slotIndex];

    if (!slot) return;

    const item = getItem(slot.itemId);
    if (!item) return;

    // Close inventory and enter "use item" mode
    set({
      interaction: {
        ...state.interaction,
        mode: 'useItem',
      },
      inventory: {
        ...state.inventory,
        isOpen: false,
        useItemId: slot.itemId,
      },
    });

    get().showText(`Use ${item.name} on what? (ESC to cancel)`);
  },

  startCombine: (slotIndex: number) => {
    const state = get();
    const slot = state.inventory.slots[slotIndex];

    if (!slot) return;

    const item = getItem(slot.itemId);
    if (!item || !item.canCombine) {
      get().showText("This item can't be combined with anything.");
      return;
    }

    set({
      interaction: {
        ...state.interaction,
        mode: 'combine',
      },
      inventory: {
        ...state.inventory,
        combineFirstItemSlot: slotIndex,
      },
    });

    get().showText(`Combine ${item.name} with what? (ESC to cancel)`);
  },

  finishCombine: (slotIndex: number) => {
    const state = get();

    if (state.inventory.combineFirstItemSlot === null) return;

    const result = combineItems(
      state.inventory,
      state.inventory.combineFirstItemSlot,
      slotIndex
    );

    if (result.success) {
      set({
        interaction: {
          ...state.interaction,
          mode: 'inventory',
        },
        inventory: {
          ...state.inventory,
          slots: result.updatedSlots,
          combineFirstItemSlot: null,
        },
      });

      const newItem = result.newItemId ? getItem(result.newItemId) : null;
      get().showText(result.message, newItem ? `Created: ${newItem.name}` : undefined);
    } else {
      get().showText(result.message);
      set({
        interaction: {
          ...state.interaction,
          mode: 'inventory',
        },
        inventory: {
          ...state.inventory,
          combineFirstItemSlot: null,
        },
      });
    }
  },

  cancelCombine: () => {
    const state = get();

    set({
      interaction: {
        ...state.interaction,
        mode: 'inventory',
      },
      inventory: {
        ...state.inventory,
        combineFirstItemSlot: null,
      },
    });
  },

  addItemToInventory: (itemId: string): boolean => {
    const state = get();
    const result = addItem(state.inventory, itemId);

    if (result.success) {
      set({
        inventory: {
          ...state.inventory,
          slots: result.updatedSlots,
        },
      });
      return true;
    }

    return false;
  },

  tryPickupDroppedItem: (roomId: string, itemIndex: number) => {
    const state = get();
    const result = pickupDroppedItem(state.inventory, roomId, itemIndex);

    if (result.success) {
      set({
        inventory: {
          ...state.inventory,
          slots: result.updatedSlots,
          droppedItems: result.updatedDroppedItems,
        },
      });
      get().showText(result.message);
    } else {
      get().showText(result.message);
    }
  },

  applyItemToObject: (itemId: string, objectId: string) => {
    const state = get();

    // Check if item can be used on this object
    if (!canUseItemOn(itemId, objectId)) {
      get().showText("That doesn't seem to work.");
      // Exit use item mode
      set({
        interaction: {
          ...state.interaction,
          mode: 'normal',
        },
        inventory: {
          ...state.inventory,
          useItemId: null,
        },
      });
      return;
    }

    // Find the item in inventory
    const slotIndex = state.inventory.slots.findIndex(s => s?.itemId === itemId);
    if (slotIndex < 0) return;

    // Use the item
    const useResult = useItem(state.inventory, slotIndex);
    if (!useResult.success) return;

    // Update inventory if item was consumed
    if (useResult.consumed) {
      set({
        inventory: {
          ...state.inventory,
          slots: useResult.updatedSlots,
          useItemId: null,
        },
      });
    }

    // Execute the object interaction
    // TODO: This needs custom logic per object-item combination
    // For now, just show a success message
    const item = getItem(itemId);
    const targetedObject = state.interaction.targetedObject;

    if (item && targetedObject) {
      get().showText(`You used the ${item.name} on the ${targetedObject.name}.`);
    }

    // Exit use item mode
    set({
      interaction: {
        ...state.interaction,
        mode: 'normal',
      },
      inventory: {
        ...state.inventory,
        useItemId: null,
      },
    });
  },
}));

// Helper function for contraband warnings (local to store)
function getContrabandWarning(level: string): string {
  switch (level) {
    case 'low':
      return 'Slightly suspicious. Guards might question it.';
    case 'medium':
      return 'Clearly against the rules. If caught, expect consequences.';
    case 'high':
      return 'Highly illegal contraband. If caught with this, you\'ll face serious punishment.';
    default:
      return '';
  }
}
