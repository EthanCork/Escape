import type { Direction } from './types';
import { MOVE_DURATION } from './constants';

export class GameLoop {
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private moveStartTime = 0;
  private isRunning = false;

  constructor(
    private onUpdate: (deltaTime: number) => void,
    private onRender: (fps: number) => void
  ) {}

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    const fps = deltaTime > 0 ? 1000 / deltaTime : 60;

    this.onUpdate(deltaTime);
    this.onRender(fps);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}

// Smooth movement interpolation
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

// Calculate movement progress (0 to 1)
export const getMovementProgress = (startTime: number, currentTime: number): number => {
  const elapsed = currentTime - startTime;
  return Math.min(elapsed / MOVE_DURATION, 1);
};

// Movement update logic
export class MovementController {
  private moveStartTime = 0;
  private lastMoveTime = 0;
  private readonly MOVE_COOLDOWN = 50; // Small cooldown between moves when holding key

  startMove() {
    this.moveStartTime = performance.now();
  }

  updatePosition(
    currentPixel: { x: number; y: number },
    targetPixel: { x: number; y: number },
    onComplete: () => void
  ): { x: number; y: number } {
    const now = performance.now();
    const progress = getMovementProgress(this.moveStartTime, now);

    if (progress >= 1) {
      onComplete();
      return targetPixel;
    }

    // Ease-out cubic for smooth deceleration
    const t = 1 - Math.pow(1 - progress, 3);

    return {
      x: lerp(currentPixel.x, targetPixel.x, t),
      y: lerp(currentPixel.y, targetPixel.y, t),
    };
  }

  canStartNewMove(): boolean {
    const now = performance.now();
    return now - this.lastMoveTime >= this.MOVE_COOLDOWN;
  }

  recordMove() {
    this.lastMoveTime = performance.now();
  }
}
