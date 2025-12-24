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

export interface InputCallbacks {
  onDirectionPress: (direction: Direction) => void;
  onDirectionRelease: (direction: Direction) => void;
  onInteract: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onMenuUp: () => void;
  onMenuDown: () => void;
  getCurrentMode: () => UIMode;
}

export class InputManager {
  private keyStates: Set<string> = new Set();
  private callbacks: InputCallbacks;

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
  }

  handleKeyDown = (event: KeyboardEvent) => {
    const mode = this.callbacks.getCurrentMode();

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
  };

  handleKeyUp = (event: KeyboardEvent) => {
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
