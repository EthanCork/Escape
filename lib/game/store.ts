import { create } from 'zustand';
import type { GameState, Direction, Position, Room, InteractiveObject, ActionType, ObjectState, NPCData, DialogueNode } from './types';
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
import { NPCS, getNPCAdjacentToPosition } from './npcData';
import { getDialogueTree } from './dialogueData';
import { updatePatrol, isPlayerInVisionCone, calculateDetectionLevel, canTalkToNPC, shouldReactToPlayer, updateNPCSchedule } from './npcSystems';
import {
  createInitialTime,
  advanceTime as advanceGameTime,
  getPeriodForTime,
  formatTime,
  isDoorOpenBySchedule,
  getPeriod,
} from './timeSystem';

interface GameStore extends GameState {
  // Movement actions
  movePlayer: (direction: Direction) => void;
  updatePlayerPixelPosition: (position: Position) => void;
  completePlayerMove: () => void;
  setInput: (direction: Direction, pressed: boolean) => void;
  toggleDebug: () => void;
  giveTestItems: () => void;
  toggleSneak: () => void;

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

  // NPC actions
  updateNPCs: (deltaTime: number) => void;
  updateNPC: (npcId: string, changes: Partial<NPCData>) => void;

  // Dialogue actions
  startDialogue: (npcId: string) => void;
  selectDialogueResponse: (responseIndex: number) => void;
  navigateDialogueResponses: (direction: 'up' | 'down') => void;
  closeDialogue: () => void;

  // Time actions
  updateTime: (deltaTime: number) => void;
  pauseTime: () => void;
  resumeTime: () => void;
  startWait: () => void;
  cancelWait: () => void;
  sleep: () => void;
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
    isSneaking: false,
    isHiding: false,
    hidingSpot: null,
    caughtCount: 0,
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
  npcs: { ...NPCS },
  alertState: {
    prisonLevel: 0,
    lastIncidentTime: null,
    searchingFor: null,
    lockdownActive: false,
  },
  dialogue: {
    isActive: false,
    currentTree: null,
    currentNode: null,
    npcId: null,
    selectedResponse: 0,
  },
  playerKnowledge: new Set<string>(),
  time: {
    currentTime: createInitialTime(),
    currentPeriod: 'early_morning',
    isPaused: false,
    timeScale: 0.333, // 1 real second = 0.333 game minutes (3 real minutes = 1 game hour)
    isWaiting: false,
    waitTargetTime: null,
    periodNotification: null,
    notificationTimeout: null,
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

    if (exit) {
      // Check if door should be open based on time
      const shouldBeOpen = isDoorOpenBySchedule(exit.id, state.time.currentPeriod);
      const isUnlocked = exit.state === 'open' || exit.state === 'unlocked';

      // Also check if player has override key
      let hasOverrideKey = false;
      if (exit.requiredKey) {
        hasOverrideKey = state.inventory.slots.some(slot => slot?.itemId === exit.requiredKey);
      }

      if ((shouldBeOpen && isUnlocked) || hasOverrideKey) {
        // Trigger room transition
        get().startTransition(exit.targetRoom, exit.targetSpawn);
        return;
      } else if (!shouldBeOpen) {
        // Door is time-locked
        set({
          player: {
            ...state.player,
            direction,
          },
        });
        // Could show a message here about the door being locked
        return;
      }
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
    get().addItemToInventory('screwdriver');
    get().addItemToInventory('cigarettes');
    get().addItemToInventory('cigarettes');
    get().addItemToInventory('cigarettes');
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

    // Check for NPCs adjacent to player first (highest priority)
    const playerPos = state.player.gridPosition;
    const adjacentNPC = getNPCAdjacentToPosition(state.currentRoom.id, playerPos);

    // Check for dropped items at player position
    const droppedItems = state.inventory.droppedItems[state.currentRoom.id] || [];

    // Find dropped item at or adjacent to player
    const droppedAtPlayer = droppedItems.findIndex(dropped => {
      const dx = Math.abs(dropped.position.x - playerPos.x);
      const dy = Math.abs(dropped.position.y - playerPos.y);
      return dx <= 1 && dy <= 1;
    });

    // Priority: NPCs > Dropped items > Objects
    let targetedObject: InteractiveObject | null = null;

    if (adjacentNPC && canTalkToNPC(adjacentNPC, playerPos)) {
      // Create a temporary interactive object for the NPC
      targetedObject = {
        id: `__npc_${adjacentNPC.id}`,
        name: adjacentNPC.name,
        roomId: state.currentRoom.id,
        positions: [adjacentNPC.position],
        actions: ['examine'],
        defaultAction: 'examine',
        examineText: `${adjacentNPC.name} is here. You could talk to them.`,
      };
    } else if (droppedAtPlayer >= 0) {
      const droppedItem = droppedItems[droppedAtPlayer];
      const item = getItem(droppedItem.itemId);
      if (item) {
        targetedObject = {
          id: `__dropped_${droppedAtPlayer}`,
          name: item.name,
          roomId: state.currentRoom.id,
          positions: [droppedItem.position],
          actions: ['examine', 'take'],
          defaultAction: 'take',
          examineText: item.description,
          hiddenItem: {
            itemId: item.id,
            name: item.name,
            description: item.description,
          },
        };
      }
    } else {
      targetedObject = findClosestObject(state.player.gridPosition, roomObjects);
    }

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

    // Check if this is an NPC - if so, start dialogue instead of menu
    if (targetedObject.id.startsWith('__npc_')) {
      const npcId = targetedObject.id.replace('__npc_', '');
      get().startDialogue(npcId);
      return;
    }

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

    // Special handling for bed "use" action - trigger sleep
    if (targetedObject.id === 'cell_c14_bed' && selectedAction.id === 'use') {
      get().closeContextMenu();
      get().sleep();
      return;
    }

    // Execute the action
    const result = executeAction(selectedAction.id, targetedObject, objectState);

    // Update object state if needed
    if (result.stateChanges) {
      get().updateObjectState(targetedObject.id, result.stateChanges);
    }

    // Handle dropped item pickup
    if (targetedObject.id.startsWith('__dropped_')) {
      const droppedIndex = parseInt(targetedObject.id.replace('__dropped_', ''));
      get().tryPickupDroppedItem(state.currentRoom.id, droppedIndex);
      get().closeContextMenu();
      return;
    }

    // Handle item found from search or take
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
        const actionVerb = selectedAction.id === 'take' ? 'Picked up' : 'Found';
        get().showText(`${actionVerb} ${result.itemFound.name}! Added to inventory.`, targetedObject.name);
      } else {
        // Inventory full
        get().closeContextMenu();
        const actionVerb = selectedAction.id === 'take' ? 'pick up' : 'take';
        get().showText(`You found ${result.itemFound.name}, but your inventory is full! Drop something and try to ${actionVerb} it again.`, targetedObject.name);
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

    // Execute the object interaction with custom logic
    const item = getItem(itemId);
    const targetedObject = state.interaction.targetedObject;

    if (item && targetedObject) {
      // Handle specific item-object interactions
      let message = '';
      let stateChanges: Partial<ObjectState> = {};

      // Screwdriver + Vent Cover
      if (itemId === 'screwdriver' && objectId === 'cell_c14_vent_cover') {
        message = "You carefully remove the four screws. The vent cover comes loose, revealing a dark shaft leading up into the ventilation system. A potential escape route.";
        stateChanges = { open: true };
      }
      // Lockpick + Cell Door
      else if (itemId === 'lockpick' && objectId.includes('cell_door')) {
        message = "You work the lockpick into the lock mechanism. After several tense seconds of probing and turning, you hear a satisfying click. The door is unlocked.";
        stateChanges = { locked: false };
      }
      // Lockpick + Locker
      else if (itemId === 'lockpick' && objectId === 'guard_station_locker') {
        message = "You insert the lockpick into the padlock. It takes some finesse, but eventually the lock springs open. The locker is now accessible.";
        stateChanges = { locked: false, open: true };
      }
      // Default message
      else {
        message = `You used the ${item.name} on the ${targetedObject.name}.`;
      }

      // Update object state if there are changes
      if (Object.keys(stateChanges).length > 0) {
        get().updateObjectState(objectId, stateChanges);
      }

      get().showText(message);
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

  // NPC actions
  updateNPCs: (deltaTime: number) => {
    const state = get();
    const updatedNPCs: Record<string, NPCData> = { ...state.npcs };

    Object.keys(updatedNPCs).forEach((npcId) => {
      const npc = updatedNPCs[npcId];

      // Only update NPCs in current room
      if (npc.currentRoom !== state.currentRoom.id) return;

      // Update patrol
      if (npc.currentBehavior === 'patrol') {
        const updates = updatePatrol(npc, deltaTime, state.currentRoom);
        if (Object.keys(updates).length > 0) {
          updatedNPCs[npcId] = { ...npc, ...updates };
        }
      }

      // Check vision for guards
      if (npc.type === 'guard' && !state.player.isHiding) {
        const detectionLevel = calculateDetectionLevel(
          npc,
          state.player.gridPosition,
          state.player.isSneaking,
          state.currentRoom
        );

        if (shouldReactToPlayer(npc, detectionLevel)) {
          // Guard detected player - start confrontation
          console.log(`${npc.name} detected player!`);
          // For now, just show a message (will implement full confrontation later)
          if (npc.dialogueTree) {
            get().startDialogue(npcId);
          }
        }
      }
    });

    set({ npcs: updatedNPCs });
  },

  updateNPC: (npcId: string, changes: Partial<NPCData>) => {
    const state = get();
    const npc = state.npcs[npcId];
    if (!npc) return;

    set({
      npcs: {
        ...state.npcs,
        [npcId]: {
          ...npc,
          ...changes,
        },
      },
    });
  },

  toggleSneak: () => {
    const state = get();
    set({
      player: {
        ...state.player,
        isSneaking: !state.player.isSneaking,
      },
    });
  },

  // Dialogue actions
  startDialogue: (npcId: string) => {
    const state = get();
    const npc = state.npcs[npcId];

    if (!npc || !npc.dialogueTree) return;

    // Check if NPC is in the current room
    if (npc.currentRoom !== state.currentRoom.id) {
      get().showText("You're too far away to talk.");
      return;
    }

    // Check if NPC can be talked to
    if (!canTalkToNPC(npc, state.player.gridPosition)) {
      get().showText("You're too far away to talk.");
      return;
    }

    const tree = getDialogueTree(npc.dialogueTree);
    if (!tree) return;

    // Determine start node based on whether player has talked to NPC before
    let startNodeId = tree.startNode;
    if (npc.talkedTo && tree.nodes['greeting_return']) {
      startNodeId = 'greeting_return';
    }

    const startNode = tree.nodes[startNodeId];
    if (!startNode) return;

    // Mark NPC as talked to
    get().updateNPC(npcId, { talkedTo: true });

    // Start dialogue
    set({
      dialogue: {
        isActive: true,
        currentTree: tree.id,
        currentNode: startNodeId,
        npcId,
        selectedResponse: 0,
      },
      interaction: {
        ...state.interaction,
        mode: 'dialogue',
      },
    });
  },

  navigateDialogueResponses: (direction: 'up' | 'down') => {
    const state = get();
    if (!state.dialogue.isActive || !state.dialogue.currentNode) return;

    const tree = state.dialogue.currentTree ? getDialogueTree(state.dialogue.currentTree) : null;
    if (!tree) return;

    const node = tree.nodes[state.dialogue.currentNode];
    if (!node) return;

    const numResponses = node.responses.length;
    let newIndex = state.dialogue.selectedResponse;

    if (direction === 'up') {
      newIndex = newIndex > 0 ? newIndex - 1 : numResponses - 1;
    } else {
      newIndex = newIndex < numResponses - 1 ? newIndex + 1 : 0;
    }

    set({
      dialogue: {
        ...state.dialogue,
        selectedResponse: newIndex,
      },
    });
  },

  selectDialogueResponse: (responseIndex: number) => {
    const state = get();
    if (!state.dialogue.isActive || !state.dialogue.currentNode) return;

    const tree = state.dialogue.currentTree ? getDialogueTree(state.dialogue.currentTree) : null;
    if (!tree) return;

    const node = tree.nodes[state.dialogue.currentNode];
    if (!node) return;

    // If this is an end node (no responses), just close the dialogue
    if (node.responses.length === 0) {
      get().closeDialogue();
      return;
    }

    const response = node.responses[responseIndex];
    if (!response) return;

    // Apply node effects
    if (node.effects) {
      node.effects.forEach((effect) => {
        if (effect.type === 'knowledge' && effect.value) {
          const newKnowledge = new Set(state.playerKnowledge);
          newKnowledge.add(effect.value as string);
          set({ playerKnowledge: newKnowledge });
        } else if (effect.type === 'relationship' && state.dialogue.npcId) {
          const npc = state.npcs[state.dialogue.npcId];
          if (npc) {
            get().updateNPC(state.dialogue.npcId, {
              relationshipLevel: npc.relationshipLevel + (effect.value as number),
            });
          }
        } else if (effect.type === 'flag' && effect.flagName && state.dialogue.npcId) {
          const npc = state.npcs[state.dialogue.npcId];
          if (npc) {
            get().updateNPC(state.dialogue.npcId, {
              flags: { ...npc.flags, [effect.flagName]: true },
            });
          }
        }
      });
    }

    // Apply response effects
    if (response.effects) {
      response.effects.forEach((effect) => {
        if (effect.type === 'knowledge' && effect.value) {
          const newKnowledge = new Set(state.playerKnowledge);
          newKnowledge.add(effect.value as string);
          set({ playerKnowledge: newKnowledge });
        } else if (effect.type === 'relationship' && state.dialogue.npcId) {
          const npc = state.npcs[state.dialogue.npcId];
          if (npc) {
            get().updateNPC(state.dialogue.npcId, {
              relationshipLevel: npc.relationshipLevel + (effect.value as number),
            });
          }
        } else if (effect.type === 'flag' && effect.flagName && state.dialogue.npcId) {
          const npc = state.npcs[state.dialogue.npcId];
          if (npc) {
            get().updateNPC(state.dialogue.npcId, {
              flags: { ...npc.flags, [effect.flagName]: true },
            });
          }
        }
      });
    }

    // Move to next node or end dialogue
    if (response.nextNode) {
      const nextNode = tree.nodes[response.nextNode];
      if (nextNode) {
        set({
          dialogue: {
            ...state.dialogue,
            currentNode: response.nextNode,
            selectedResponse: 0,
          },
        });
      } else {
        get().closeDialogue();
      }
    } else {
      get().closeDialogue();
    }
  },

  closeDialogue: () => {
    const state = get();
    set({
      dialogue: {
        isActive: false,
        currentTree: null,
        currentNode: null,
        npcId: null,
        selectedResponse: 0,
      },
      interaction: {
        ...state.interaction,
        mode: 'normal',
      },
    });
  },

  // Time actions
  updateTime: (deltaTime: number) => {
    const state = get();

    // Don't advance time if paused or in certain UI modes
    // NOTE: Removed 'text' mode from blocking conditions - time should advance even when text is showing
    if (
      state.time.isPaused ||
      state.interaction.mode === 'inventory' ||
      state.interaction.mode === 'dialogue' ||
      state.interaction.mode === 'menu' ||
      state.transition.isTransitioning
    ) {
      console.log('[updateTime] BLOCKED - mode:', state.interaction.mode);
      return;
    }

    const timeScale = state.time.isWaiting ? 100 : state.time.timeScale;
    const result = advanceGameTime(state.time.currentTime, deltaTime, timeScale);

    // Debug: Log occasionally to verify it's running
    if (Math.random() < 0.01) { // Log ~1% of frames
      console.log('[updateTime] Running - hour:', result.newTime.hour, 'minute:', result.newTime.minute);
    }

    // Update time
    set({
      time: {
        ...state.time,
        currentTime: result.newTime,
        currentPeriod: result.newPeriod,
      },
    });

    // Handle period change
    if (result.periodChanged) {
      const period = getPeriod(result.newPeriod);
      if (period) {
        console.log(`Period changed to: ${period.name} (${result.newPeriod})`);

        // Update all NPC schedules
        const updatedNPCs: Record<string, NPCData> = { ...state.npcs };
        Object.keys(updatedNPCs).forEach((npcId) => {
          const npc = updatedNPCs[npcId];
          const scheduleChanges = updateNPCSchedule(npc, result.newPeriod, state.currentRoom.id);
          if (Object.keys(scheduleChanges).length > 0) {
            updatedNPCs[npcId] = { ...npc, ...scheduleChanges };
            console.log(`[${npc.name}] Schedule updated: ${scheduleChanges.currentRoom || npc.currentRoom}, ${scheduleChanges.currentBehavior || npc.currentBehavior}`);
          }
        });

        set({ npcs: updatedNPCs });

        // Show period transition notification
        if (state.time.notificationTimeout) {
          clearTimeout(state.time.notificationTimeout);
        }

        const timeout = setTimeout(() => {
          set({
            time: {
              ...get().time,
              periodNotification: null,
              notificationTimeout: null,
            },
          });
        }, 3000) as unknown as number;

        set({
          time: {
            ...state.time,
            currentTime: result.newTime,
            currentPeriod: result.newPeriod,
            periodNotification: period.name.toUpperCase(),
            notificationTimeout: timeout,
          },
        });
      }
    }

    // Check if waiting target reached
    if (state.time.isWaiting && state.time.waitTargetTime) {
      const target = state.time.waitTargetTime;
      const current = result.newTime;

      if (
        current.day >= target.day &&
        current.hour >= target.hour &&
        current.minute >= target.minute
      ) {
        // Waiting complete
        set({
          time: {
            ...state.time,
            currentTime: result.newTime,
            currentPeriod: result.newPeriod,
            isWaiting: false,
            waitTargetTime: null,
          },
        });
        console.log('Wait complete');
      }
    }
  },

  pauseTime: () => {
    set({
      time: {
        ...get().time,
        isPaused: true,
      },
    });
  },

  resumeTime: () => {
    set({
      time: {
        ...get().time,
        isPaused: false,
      },
    });
  },

  startWait: () => {
    const state = get();

    // Can't wait in certain conditions
    if (
      state.interaction.mode !== 'normal' ||
      state.transition.isTransitioning ||
      state.player.isMoving
    ) {
      return;
    }

    // For now, wait until next period starts
    const currentTime = state.time.currentTime;
    const currentPeriod = getPeriod(state.time.currentPeriod);

    if (!currentPeriod) return;

    // Calculate target time (end of current period)
    const targetTime = {
      day: currentTime.day,
      hour: currentPeriod.endHour,
      minute: currentPeriod.endMinute,
      totalMinutes: currentTime.totalMinutes, // Will be updated by advanceTime
    };

    // Handle midnight wraparound
    if (targetTime.hour < currentTime.hour) {
      targetTime.day += 1;
    }

    set({
      time: {
        ...state.time,
        isWaiting: true,
        waitTargetTime: targetTime,
      },
    });

    console.log(`Waiting until ${formatTime(targetTime)}...`);
  },

  cancelWait: () => {
    set({
      time: {
        ...get().time,
        isWaiting: false,
        waitTargetTime: null,
      },
    });
  },

  sleep: () => {
    const state = get();

    // Can only sleep in your cell during lockdown or late evening
    if (state.currentRoom.id !== 'cell_c14') {
      get().showText("You can only sleep in your own cell.");
      return;
    }

    const currentHour = state.time.currentTime.hour;
    if (currentHour < 20 && currentHour >= 6) {
      get().showText("It's too early to sleep. Lights out is at 22:00.");
      return;
    }

    // Sleep advances time to 06:00 next day
    const currentDay = state.time.currentTime.day;
    const nextDay = currentHour >= 22 || currentHour < 6 ? currentDay + 1 : currentDay;

    const newTime = {
      day: nextDay,
      hour: 6,
      minute: 0,
      totalMinutes: state.time.currentTime.totalMinutes + (24 * 60), // Add a full day
    };

    // Clear any notifications
    if (state.time.notificationTimeout) {
      clearTimeout(state.time.notificationTimeout);
    }

    set({
      time: {
        ...state.time,
        currentTime: newTime,
        currentPeriod: 'early_morning',
        periodNotification: 'WAKE-UP CALL',
        notificationTimeout: setTimeout(() => {
          set({
            time: {
              ...get().time,
              periodNotification: null,
              notificationTimeout: null,
            },
          });
        }, 3000) as unknown as number,
      },
    });

    // Update all NPCs for the new period
    const updatedNPCs: Record<string, NPCData> = { ...state.npcs };
    Object.keys(updatedNPCs).forEach((npcId) => {
      const npc = updatedNPCs[npcId];
      const scheduleChanges = updateNPCSchedule(npc, 'early_morning', state.currentRoom.id);
      if (Object.keys(scheduleChanges).length > 0) {
        updatedNPCs[npcId] = { ...npc, ...scheduleChanges };
      }
    });

    set({ npcs: updatedNPCs });

    console.log(`Slept until Day ${nextDay}, 06:00`);
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
