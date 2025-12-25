import type { Direction, UIMode } from './types';

// Key mappings for movement
const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
};

// Interaction keys
const INTERACT_KEYS = ['e', 'E', ' ']; // E or Space
const CONFIRM_KEYS = ['e', 'E', 'Enter', ' ']; // E, Enter, or Space
const CANCEL_KEYS = ['Escape'];
const INVENTORY_KEYS = ['i', 'I', 'Tab'];
const SNEAK_KEY = 'Shift';

export interface InputCallbacks {
  onDirectionPress: (direction: Direction) => void;
  onDirectionRelease: (direction: Direction) => void;
  onInteract: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onMenuUp: () => void;
  onMenuDown: () => void;
  getCurrentMode: () => UIMode;

  // Inventory callbacks
  onInventoryToggle: () => void;
  onInventoryNavigate: (direction: Direction) => void;
  onInventoryExamine: () => void;
  onInventoryUse: () => void;
  onInventoryCombine: () => void;
  onInventoryDrop: () => void;

  // NPC/dialogue callbacks
  onSneakToggle: () => void;

  // Debug callback
  onGiveTestItems: () => void;
}

export class InputManager {
  private keyStates: Set<string> = new Set();
  private callbacks: InputCallbacks;

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
  }

  handleKeyDown = (event: KeyboardEvent) => {
    const mode = this.callbacks.getCurrentMode();

    // Handle inventory toggle (works in normal and inventory modes)
    if (INVENTORY_KEYS.includes(event.key) && (mode === 'normal' || mode === 'inventory')) {
      this.callbacks.onInventoryToggle();
      event.preventDefault();
      return;
    }

    // Handle based on current UI mode
    if (mode === 'text') {
      // In text mode, any key dismisses the text
      this.callbacks.onConfirm();
      event.preventDefault();
      return;
    }

    if (mode === 'menu') {
      // In menu mode, handle menu navigation
      if (event.key === 'ArrowUp') {
        this.callbacks.onMenuUp();
        event.preventDefault();
        return;
      }

      if (event.key === 'ArrowDown') {
        this.callbacks.onMenuDown();
        event.preventDefault();
        return;
      }

      if (CONFIRM_KEYS.includes(event.key)) {
        this.callbacks.onConfirm();
        event.preventDefault();
        return;
      }

      if (CANCEL_KEYS.includes(event.key)) {
        this.callbacks.onCancel();
        event.preventDefault();
        return;
      }

      // Block movement keys while menu is open
      event.preventDefault();
      return;
    }

    if (mode === 'inventory' || mode === 'combine') {
      // In inventory mode, handle inventory navigation and actions
      const direction = KEY_MAP[event.key];
      if (direction) {
        this.callbacks.onInventoryNavigate(direction);
        event.preventDefault();
        return;
      }

      if (event.key === 'e' || event.key === 'E') {
        this.callbacks.onInventoryExamine();
        event.preventDefault();
        return;
      }

      if (event.key === 'u' || event.key === 'U') {
        this.callbacks.onInventoryUse();
        event.preventDefault();
        return;
      }

      if (event.key === 'c' || event.key === 'C') {
        this.callbacks.onInventoryCombine();
        event.preventDefault();
        return;
      }

      if (event.key === 'd' || event.key === 'D') {
        this.callbacks.onInventoryDrop();
        event.preventDefault();
        return;
      }

      if (CANCEL_KEYS.includes(event.key)) {
        if (mode === 'combine') {
          this.callbacks.onCancel();
        } else {
          this.callbacks.onInventoryToggle();
        }
        event.preventDefault();
        return;
      }

      // Block other keys
      event.preventDefault();
      return;
    }

    if (mode === 'useItem') {
      // In useItem mode, allow movement and interaction
      const direction = KEY_MAP[event.key];
      if (direction) {
        event.preventDefault();
        if (this.keyStates.has(direction)) return;
        this.keyStates.add(direction);
        this.callbacks.onDirectionPress(direction);
        return;
      }

      if (INTERACT_KEYS.includes(event.key)) {
        this.callbacks.onInteract();
        event.preventDefault();
        return;
      }

      if (CANCEL_KEYS.includes(event.key)) {
        this.callbacks.onCancel();
        event.preventDefault();
        return;
      }

      return;
    }

    // Normal mode - handle movement and interaction
    const direction = KEY_MAP[event.key];
    if (direction) {
      // Prevent default browser scrolling for arrow keys
      event.preventDefault();

      // Don't process if already pressed (prevents key repeat)
      if (this.keyStates.has(direction)) return;

      this.keyStates.add(direction);
      this.callbacks.onDirectionPress(direction);
      return;
    }

    // Check for interact key
    if (INTERACT_KEYS.includes(event.key)) {
      this.callbacks.onInteract();
      event.preventDefault();
      return;
    }

    // Debug: G key for giving test items
    if (event.key === 'g' || event.key === 'G') {
      this.callbacks.onGiveTestItems();
      event.preventDefault();
      return;
    }

    // Sneak toggle (Shift key)
    if (event.key === SNEAK_KEY && mode === 'normal') {
      this.callbacks.onSneakToggle();
      event.preventDefault();
      return;
    }
  };

  handleKeyUp = (event: KeyboardEvent) => {
    // Handle sneak key release
    if (event.key === SNEAK_KEY) {
      const mode = this.callbacks.getCurrentMode();
      if (mode === 'normal') {
        this.callbacks.onSneakToggle();
        event.preventDefault();
      }
      return;
    }
    const direction = KEY_MAP[event.key];
    if (!direction) return;

    event.preventDefault();

    this.keyStates.delete(direction);
    this.callbacks.onDirectionRelease(direction);
  };

  getActiveDirections = (): Direction[] => {
    return Array.from(this.keyStates) as Direction[];
  };

  cleanup = () => {
    this.keyStates.clear();
  };
}
