import type { Direction } from './types';

// Key mappings
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

export class InputManager {
  private keyStates: Set<string> = new Set();
  private onDirectionPress: (direction: Direction) => void;
  private onDirectionRelease: (direction: Direction) => void;

  constructor(
    onDirectionPress: (direction: Direction) => void,
    onDirectionRelease: (direction: Direction) => void
  ) {
    this.onDirectionPress = onDirectionPress;
    this.onDirectionRelease = onDirectionRelease;
  }

  handleKeyDown = (event: KeyboardEvent) => {
    const direction = KEY_MAP[event.key];
    if (!direction) return;

    // Prevent default browser scrolling for arrow keys
    event.preventDefault();

    // Don't process if already pressed (prevents key repeat)
    if (this.keyStates.has(direction)) return;

    this.keyStates.add(direction);
    this.onDirectionPress(direction);
  };

  handleKeyUp = (event: KeyboardEvent) => {
    const direction = KEY_MAP[event.key];
    if (!direction) return;

    event.preventDefault();

    this.keyStates.delete(direction);
    this.onDirectionRelease(direction);
  };

  getActiveDirections = (): Direction[] => {
    return Array.from(this.keyStates) as Direction[];
  };

  cleanup = () => {
    this.keyStates.clear();
  };
}
