// ========================================
// INVENTORY SYSTEM - Core Functions
// ========================================

import type { InventorySlot, InventoryState, Position } from './types';
import { getItem, findCombination, ITEMS } from './items';

// ========================================
// INVENTORY CAPACITY & VALIDATION
// ========================================

/**
 * Calculate how many slots an item would require
 */
export function getItemSlotRequirement(itemId: string): number {
  const item = getItem(itemId);
  return item ? item.size : 1;
}

/**
 * Count how many slots are currently used
 */
export function getUsedSlots(inventory: InventoryState): number {
  let used = 0;
  for (const slot of inventory.slots) {
    if (slot) {
      const item = getItem(slot.itemId);
      if (item) {
        used += item.size;
      }
    }
  }
  return used;
}

/**
 * Get number of free slots
 */
export function getFreeSlots(inventory: InventoryState): number {
  return inventory.maxSlots - getUsedSlots(inventory);
}

/**
 * Check if there's room for an item
 */
export function hasRoomForItem(inventory: InventoryState, itemId: string): boolean {
  const item = getItem(itemId);
  if (!item) return false;

  const requiredSlots = item.size;
  const freeSlots = getFreeSlots(inventory);

  // Special case: stackable items
  if (item.stackable) {
    // Check if we already have this item (can stack)
    const existingSlot = inventory.slots.find(s => s && s.itemId === itemId);
    if (existingSlot && existingSlot.quantity < (item.maxStack || 99)) {
      return true; // Can stack with existing
    }
  }

  return freeSlots >= requiredSlots;
}

/**
 * Find the first empty slot index
 */
export function findEmptySlot(inventory: InventoryState): number {
  for (let i = 0; i < inventory.maxSlots; i++) {
    if (!inventory.slots[i]) {
      return i;
    }
  }
  return -1;
}

/**
 * Find a slot containing a specific item
 */
export function findItemSlot(inventory: InventoryState, itemId: string): number {
  for (let i = 0; i < inventory.slots.length; i++) {
    if (inventory.slots[i]?.itemId === itemId) {
      return i;
    }
  }
  return -1;
}

// ========================================
// INVENTORY MODIFICATION
// ========================================

/**
 * Add an item to inventory
 * Returns success status and optional message
 */
export function addItem(
  inventory: InventoryState,
  itemId: string
): { success: boolean; message: string; updatedSlots: (InventorySlot | null)[] } {
  const item = getItem(itemId);
  if (!item) {
    return { success: false, message: 'Invalid item', updatedSlots: inventory.slots };
  }

  const newSlots = [...inventory.slots];

  // Check if stackable and already exists
  if (item.stackable) {
    const existingIndex = findItemSlot(inventory, itemId);
    if (existingIndex >= 0 && newSlots[existingIndex]) {
      const existing = newSlots[existingIndex]!;
      const maxStack = item.maxStack || 99;

      if (existing.quantity < maxStack) {
        // Can add to stack
        newSlots[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        return {
          success: true,
          message: `Added ${item.name} (${existing.quantity + 1}/${maxStack})`,
          updatedSlots: newSlots,
        };
      }
      // Stack is full, need new slot
    }
  }

  // Check if there's room
  if (!hasRoomForItem(inventory, itemId)) {
    return {
      success: false,
      message: "Your inventory is full. Drop something first.",
      updatedSlots: inventory.slots,
    };
  }

  // Find empty slot
  const emptySlot = findEmptySlot(inventory);
  if (emptySlot < 0) {
    return {
      success: false,
      message: "No empty slots available.",
      updatedSlots: inventory.slots,
    };
  }

  // Add to inventory
  newSlots[emptySlot] = {
    itemId,
    quantity: 1,
    slot: emptySlot,
  };

  return {
    success: true,
    message: `Added ${item.name}`,
    updatedSlots: newSlots,
  };
}

/**
 * Remove an item from inventory
 */
export function removeItem(
  inventory: InventoryState,
  slotIndex: number,
  amount: number = 1
): { success: boolean; updatedSlots: (InventorySlot | null)[] } {
  const slot = inventory.slots[slotIndex];
  if (!slot) {
    return { success: false, updatedSlots: inventory.slots };
  }

  const newSlots = [...inventory.slots];
  const item = getItem(slot.itemId);

  if (item?.stackable && slot.quantity > amount) {
    // Reduce stack
    newSlots[slotIndex] = {
      ...slot,
      quantity: slot.quantity - amount,
    };
  } else {
    // Remove entirely
    newSlots[slotIndex] = null;
  }

  return { success: true, updatedSlots: newSlots };
}

/**
 * Drop an item from inventory into the world
 */
export function dropItem(
  inventory: InventoryState,
  slotIndex: number,
  roomId: string,
  position: Position
): {
  success: boolean;
  updatedSlots: (InventorySlot | null)[];
  updatedDroppedItems: Record<string, { itemId: string; position: Position }[]>;
} {
  const slot = inventory.slots[slotIndex];
  if (!slot) {
    return {
      success: false,
      updatedSlots: inventory.slots,
      updatedDroppedItems: inventory.droppedItems,
    };
  }

  // Remove from inventory
  const { success, updatedSlots } = removeItem(inventory, slotIndex);
  if (!success) {
    return {
      success: false,
      updatedSlots: inventory.slots,
      updatedDroppedItems: inventory.droppedItems,
    };
  }

  // Add to dropped items for this room
  const updatedDroppedItems = { ...inventory.droppedItems };
  if (!updatedDroppedItems[roomId]) {
    updatedDroppedItems[roomId] = [];
  }
  updatedDroppedItems[roomId] = [
    ...updatedDroppedItems[roomId],
    { itemId: slot.itemId, position },
  ];

  return { success: true, updatedSlots, updatedDroppedItems };
}

/**
 * Pick up a dropped item from the world
 */
export function pickupDroppedItem(
  inventory: InventoryState,
  roomId: string,
  droppedItemIndex: number
): {
  success: boolean;
  message: string;
  updatedSlots: (InventorySlot | null)[];
  updatedDroppedItems: Record<string, { itemId: string; position: Position }[]>;
} {
  const droppedItems = inventory.droppedItems[roomId];
  if (!droppedItems || droppedItemIndex < 0 || droppedItemIndex >= droppedItems.length) {
    return {
      success: false,
      message: 'Item not found',
      updatedSlots: inventory.slots,
      updatedDroppedItems: inventory.droppedItems,
    };
  }

  const droppedItem = droppedItems[droppedItemIndex];
  const { success, message, updatedSlots } = addItem(inventory, droppedItem.itemId);

  if (!success) {
    return {
      success: false,
      message,
      updatedSlots: inventory.slots,
      updatedDroppedItems: inventory.droppedItems,
    };
  }

  // Remove from dropped items
  const updatedDroppedItems = { ...inventory.droppedItems };
  updatedDroppedItems[roomId] = droppedItems.filter((_, i) => i !== droppedItemIndex);

  return {
    success: true,
    message,
    updatedSlots,
    updatedDroppedItems,
  };
}

// ========================================
// ITEM COMBINATION
// ========================================

/**
 * Attempt to combine two items
 */
export function combineItems(
  inventory: InventoryState,
  slot1: number,
  slot2: number
): {
  success: boolean;
  message: string;
  updatedSlots: (InventorySlot | null)[];
  newItemId?: string;
} {
  const item1 = inventory.slots[slot1];
  const item2 = inventory.slots[slot2];

  if (!item1 || !item2) {
    return {
      success: false,
      message: "Can't combine empty slots",
      updatedSlots: inventory.slots,
    };
  }

  if (slot1 === slot2) {
    return {
      success: false,
      message: "Can't combine an item with itself",
      updatedSlots: inventory.slots,
    };
  }

  // Find combination recipe
  const recipe = findCombination(item1.itemId, item2.itemId);
  if (!recipe) {
    return {
      success: false,
      message: "These items can't be combined",
      updatedSlots: inventory.slots,
    };
  }

  // Check if there's room for the result (in case we need a new slot)
  const newItem = getItem(recipe.output);
  if (!newItem) {
    return {
      success: false,
      message: 'Invalid combination result',
      updatedSlots: inventory.slots,
    };
  }

  // Remove both input items
  let newSlots = [...inventory.slots];
  newSlots[slot1] = null;
  newSlots[slot2] = null;

  // Add result item to first available slot
  const emptySlot = newSlots.findIndex(s => s === null);
  if (emptySlot >= 0) {
    newSlots[emptySlot] = {
      itemId: recipe.output,
      quantity: 1,
      slot: emptySlot,
    };
  }

  return {
    success: true,
    message: recipe.message,
    updatedSlots: newSlots,
    newItemId: recipe.output,
  };
}

// ========================================
// ITEM USAGE
// ========================================

/**
 * Check if an item can be used on a specific object
 */
export function canUseItemOn(itemId: string, objectId: string): boolean {
  const item = getItem(itemId);
  if (!item) return false;
  return item.usableOn.includes(objectId);
}

/**
 * Use an item (may consume it)
 */
export function useItem(
  inventory: InventoryState,
  slotIndex: number
): {
  success: boolean;
  itemId: string;
  updatedSlots: (InventorySlot | null)[];
  consumed: boolean;
} {
  const slot = inventory.slots[slotIndex];
  if (!slot) {
    return {
      success: false,
      itemId: '',
      updatedSlots: inventory.slots,
      consumed: false,
    };
  }

  const item = getItem(slot.itemId);
  if (!item) {
    return {
      success: false,
      itemId: '',
      updatedSlots: inventory.slots,
      consumed: false,
    };
  }

  let updatedSlots = inventory.slots;
  let consumed = false;

  // If item is consumed on use, remove it
  if (item.consumedOnUse) {
    const result = removeItem(inventory, slotIndex);
    updatedSlots = result.updatedSlots;
    consumed = true;
  }

  return {
    success: true,
    itemId: slot.itemId,
    updatedSlots,
    consumed,
  };
}

// ========================================
// INITIALIZATION
// ========================================

export function createInitialInventory(): InventoryState {
  return {
    isOpen: false,
    slots: Array(6).fill(null),
    maxSlots: 6,
    selectedSlot: 0,
    useItemId: null,
    combineFirstItemSlot: null,
    droppedItems: {},
    takenItems: new Set(),
  };
}
