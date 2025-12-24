import type { GameState, Position, InteractiveObject, ContextMenu, TextDisplay } from './types';
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

    // Draw interaction UI
    if (state.interaction.targetedObject && state.interaction.mode === 'normal') {
      this.drawInteractionIndicator(state.interaction.targetedObject);
    }

    if (state.interaction.contextMenu.isOpen) {
      this.drawContextMenu(state.interaction.contextMenu);
    }

    if (state.interaction.textDisplay.isVisible) {
      this.drawTextDisplay(state.interaction.textDisplay);
    }

    if (state.transition.isTransitioning) {
      this.drawTransitionOverlay(state.transition.progress);
    }

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
        if (tileType === 'bed' || tileType === 'desk' || tileType === 'toilet' || tileType === 'sink' || tileType === 'chair' || tileType === 'locker') {
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
      `Room: ${state.currentRoom.name}`,
      `Grid: (${state.player.gridPosition.x}, ${state.player.gridPosition.y})`,
      `Pixel: (${Math.round(state.player.pixelPosition.x)}, ${Math.round(state.player.pixelPosition.y)})`,
      `Moving: ${state.player.isMoving}`,
      `Direction: ${state.player.direction}`,
      `Transitioning: ${state.transition.isTransitioning}`,
    ];

    lines.forEach((line, i) => {
      this.ctx.fillText(line, 10, 20 + i * 15);
    });
  }

  private drawTransitionOverlay(progress: number) {
    this.ctx.fillStyle = `rgba(0, 0, 0, ${progress})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawInteractionIndicator(object: InteractiveObject) {
    // Draw a subtle highlight/outline around the interactive object
    for (const pos of object.positions) {
      const x = pos.x * TILE_SIZE;
      const y = pos.y * TILE_SIZE;

      // Draw glowing outline
      this.ctx.strokeStyle = '#ffff00';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

      // Add a subtle inner glow effect
      this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    }
  }

  private drawContextMenu(menu: ContextMenu) {
    const menuWidth = 160;
    const lineHeight = 24;
    const padding = 8;
    const menuHeight = menu.actions.length * lineHeight + padding * 2;

    // Position menu near the object, but ensure it stays on screen
    let menuX = menu.position.x + TILE_SIZE / 2 - menuWidth / 2;
    let menuY = menu.position.y - menuHeight - 10;

    // Clamp to screen bounds
    menuX = Math.max(10, Math.min(menuX, this.canvas.width - menuWidth - 10));
    menuY = Math.max(10, Math.min(menuY, this.canvas.height - menuHeight - 10));

    // Draw menu background
    this.ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
    this.ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    // Draw menu border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Draw menu items
    this.ctx.font = '14px monospace';
    menu.actions.forEach((action, index) => {
      const itemY = menuY + padding + index * lineHeight + lineHeight / 2 + 4;
      const isSelected = index === menu.selectedIndex;
      const isAvailable = action.available;

      // Draw selection highlight
      if (isSelected) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(menuX + 4, menuY + padding + index * lineHeight, menuWidth - 8, lineHeight);
      }

      // Draw arrow for selected item
      if (isSelected) {
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillText('►', menuX + padding, itemY);
      }

      // Draw action text
      if (isAvailable) {
        this.ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
      } else {
        this.ctx.fillStyle = '#666666';
      }
      this.ctx.fillText(action.name, menuX + padding + 20, itemY);
    });
  }

  private drawTextDisplay(textDisplay: TextDisplay) {
    const boxWidth = Math.min(500, this.canvas.width - 40);
    const padding = 20;
    const lineHeight = 20;
    const maxLineWidth = boxWidth - padding * 2;

    // Word wrap the text
    const lines = this.wrapText(textDisplay.text, maxLineWidth);
    const titleLines = textDisplay.title ? 1 : 0;
    const boxHeight = (lines.length + titleLines) * lineHeight + padding * 2 + 20;

    // Position box in lower third of screen
    const boxX = (this.canvas.width - boxWidth) / 2;
    const boxY = this.canvas.height - boxHeight - 40;

    // Draw semi-transparent dark background for whole screen
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw text box background
    this.ctx.fillStyle = 'rgba(30, 30, 30, 0.98)';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Draw text box border (prison-like metal frame)
    this.ctx.strokeStyle = '#888888';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Inner border
    this.ctx.strokeStyle = '#555555';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(boxX + 4, boxY + 4, boxWidth - 8, boxHeight - 8);

    // Draw title if present
    let textY = boxY + padding + lineHeight;
    if (textDisplay.title) {
      this.ctx.font = 'bold 16px monospace';
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillText(textDisplay.title, boxX + padding, textY);
      textY += lineHeight + 5;
    }

    // Draw text lines
    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = '#ffffff';
    lines.forEach((line) => {
      this.ctx.fillText(line, boxX + padding, textY);
      textY += lineHeight;
    });

    // Draw "Press E to continue" prompt
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#999999';
    const promptText = '[Press E to continue]';
    const promptWidth = this.ctx.measureText(promptText).width;
    this.ctx.fillText(promptText, boxX + boxWidth - promptWidth - padding, boxY + boxHeight - padding);
  }

  private wrapText(text: string, maxWidth: number): string[] {
    this.ctx.font = '14px monospace';
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }
}
