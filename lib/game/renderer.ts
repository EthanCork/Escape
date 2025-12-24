import type { GameState, Position } from './types';
import { TILE_SIZE, COLORS, getTileColor } from './constants';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  render(state: GameState, fps: number) {
    this.clearScreen();
    this.drawRoom(state);
    this.drawPlayer(state.player.pixelPosition, state.player.direction);

    if (state.debugMode) {
      this.drawGrid(state);
      this.drawDebugInfo(state, fps);
    }
  }

  private clearScreen() {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawRoom(state: GameState) {
    const room = state.currentRoom;

    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        const tileType = room.tiles[y][x];
        const color = getTileColor(tileType);

        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Add slight border for furniture to make it more distinct
        if (tileType === 'bed' || tileType === 'desk' || tileType === 'toilet' || tileType === 'sink') {
          this.ctx.strokeStyle = '#1a1a1a';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }

        // Draw door bars
        if (tileType === 'door') {
          this.ctx.fillStyle = COLORS.door;
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

          // Draw vertical bars
          this.ctx.strokeStyle = '#5a3510';
          this.ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const barX = x * TILE_SIZE + i * 8 + 4;
            this.ctx.beginPath();
            this.ctx.moveTo(barX, y * TILE_SIZE);
            this.ctx.lineTo(barX, y * TILE_SIZE + TILE_SIZE);
            this.ctx.stroke();
          }
        }
      }
    }
  }

  private drawPlayer(pixelPosition: Position, direction: string) {
    const playerSize = TILE_SIZE * 0.7; // Slightly smaller than tile
    const offset = (TILE_SIZE - playerSize) / 2;

    const x = pixelPosition.x + offset;
    const y = pixelPosition.y + offset;

    // Draw player circle
    this.ctx.fillStyle = COLORS.player;
    this.ctx.beginPath();
    this.ctx.arc(x + playerSize / 2, y + playerSize / 2, playerSize / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw direction indicator (small triangle)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();

    const centerX = x + playerSize / 2;
    const centerY = y + playerSize / 2;
    const indicatorSize = 6;

    switch (direction) {
      case 'up':
        this.ctx.moveTo(centerX, centerY - indicatorSize);
        this.ctx.lineTo(centerX - indicatorSize / 2, centerY);
        this.ctx.lineTo(centerX + indicatorSize / 2, centerY);
        break;
      case 'down':
        this.ctx.moveTo(centerX, centerY + indicatorSize);
        this.ctx.lineTo(centerX - indicatorSize / 2, centerY);
        this.ctx.lineTo(centerX + indicatorSize / 2, centerY);
        break;
      case 'left':
        this.ctx.moveTo(centerX - indicatorSize, centerY);
        this.ctx.lineTo(centerX, centerY - indicatorSize / 2);
        this.ctx.lineTo(centerX, centerY + indicatorSize / 2);
        break;
      case 'right':
        this.ctx.moveTo(centerX + indicatorSize, centerY);
        this.ctx.lineTo(centerX, centerY - indicatorSize / 2);
        this.ctx.lineTo(centerX, centerY + indicatorSize / 2);
        break;
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawGrid(state: GameState) {
    const room = state.currentRoom;

    this.ctx.strokeStyle = COLORS.grid;
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= room.width; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * TILE_SIZE, 0);
      this.ctx.lineTo(x * TILE_SIZE, room.height * TILE_SIZE);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= room.height; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * TILE_SIZE);
      this.ctx.lineTo(room.width * TILE_SIZE, y * TILE_SIZE);
      this.ctx.stroke();
    }
  }

  private drawDebugInfo(state: GameState, fps: number) {
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '12px monospace';

    const lines = [
      `FPS: ${Math.round(fps)}`,
      `Grid: (${state.player.gridPosition.x}, ${state.player.gridPosition.y})`,
      `Pixel: (${Math.round(state.player.pixelPosition.x)}, ${Math.round(state.player.pixelPosition.y)})`,
      `Moving: ${state.player.isMoving}`,
      `Direction: ${state.player.direction}`,
    ];

    lines.forEach((line, i) => {
      this.ctx.fillText(line, 10, 20 + i * 15);
    });
  }
}
