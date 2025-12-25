import type { GameState, Position, InteractiveObject, ContextMenu, TextDisplay, InventorySlot, NPCData, Direction } from './types';
import { TILE_SIZE, COLORS, getTileColor } from './constants';
import { getItem } from './items';
import { getNPCsInRoom } from './npcData';
import { getDialogueTree } from './dialogueData';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    // Disable image smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false;
  }

  render(state: GameState, fps: number) {
    this.clearScreen();
    this.drawRoom(state);

    // Draw NPCs in the current room
    this.drawNPCs(state);

    this.drawPlayer(state.player.pixelPosition, state.player.direction, state.player.isSneaking);

    // Draw dropped items in the room
    this.drawDroppedItems(state);

    // Draw interaction UI
    if (state.interaction.targetedObject && state.interaction.mode === 'normal') {
      this.drawInteractionIndicator(state.interaction.targetedObject);
    }

    if (state.interaction.contextMenu.isOpen) {
      this.drawContextMenu(state.interaction.contextMenu);
    }

    // Draw inventory UI
    if (state.inventory.isOpen) {
      this.drawInventory(state);
    }

    // Draw "use item" mode indicator
    if (state.interaction.mode === 'useItem' && state.inventory.useItemId) {
      this.drawUseItemMode(state);
    }

    // Draw dialogue UI
    if (state.dialogue.isActive) {
      this.drawDialogue(state);
    }

    if (state.interaction.textDisplay.isVisible) {
      this.drawTextDisplay(state.interaction.textDisplay);
    }

    if (state.transition.isTransitioning) {
      this.drawTransitionOverlay(state.transition.progress);
    }

    // Debug mode disabled - remove all debug rendering
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

  private drawPlayer(pixelPosition: Position, direction: string, isSneaking: boolean = false) {
    const playerSize = TILE_SIZE * 0.7; // Slightly smaller than tile
    const offset = (TILE_SIZE - playerSize) / 2;

    const x = pixelPosition.x + offset;
    const y = pixelPosition.y + offset;

    // Draw player circle
    this.ctx.fillStyle = isSneaking ? '#4a7c4a' : COLORS.player; // Darker green when sneaking
    this.ctx.beginPath();
    this.ctx.arc(x + playerSize / 2, y + playerSize / 2, playerSize / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Add sneaking indicator (border)
    if (isSneaking) {
      this.ctx.strokeStyle = '#2a4c2a';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

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

  // Debug info is now rendered as HTML overlay in GameCanvas.tsx
  // This function is no longer used

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
    // Save and reset transform for UI elements
    this.ctx.save();

    // Get the current scale from the transform
    const transform = this.ctx.getTransform();
    const scale = transform.a; // The x-scale factor

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    const menuWidth = 160;
    const lineHeight = 24;
    const padding = 8;
    const menuHeight = menu.actions.length * lineHeight + padding * 2;

    // Position menu near the object - menu.position is in game coords, need to scale to screen coords
    let menuX = (menu.position.x * scale) + (TILE_SIZE * scale) / 2 - menuWidth / 2;
    let menuY = (menu.position.y * scale) - menuHeight - 10;

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

    // Restore context state
    this.ctx.restore();
  }

  private drawTextDisplay(textDisplay: TextDisplay) {
    // Save the current context state (including any scaling)
    this.ctx.save();

    // Reset transform to draw UI elements at actual pixel size
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

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

    // Restore the previous context state
    this.ctx.restore();
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

  private drawInventory(state: GameState) {
    // Save and reset transform for UI elements
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    const panelWidth = 400;
    const panelHeight = 350;
    const panelX = this.canvas.width - panelWidth - 20;
    const panelY = 20;
    const padding = 20;

    // Draw semi-transparent background overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw inventory panel background
    this.ctx.fillStyle = 'rgba(30, 30, 30, 0.98)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

    // Draw panel border
    this.ctx.strokeStyle = '#888888';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Inner border
    this.ctx.strokeStyle = '#555555';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(panelX + 4, panelY + 4, panelWidth - 8, panelHeight - 8);

    // Draw title
    this.ctx.font = 'bold 18px monospace';
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillText('INVENTORY', panelX + padding, panelY + padding + 15);

    // Draw slot grid (2 rows x 3 columns)
    const slotSize = 80;
    const slotSpacing = 10;
    const gridStartX = panelX + padding + 20;
    const gridStartY = panelY + padding + 50;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const slotIndex = row * 3 + col;
        const slotX = gridStartX + col * (slotSize + slotSpacing);
        const slotY = gridStartY + row * (slotSize + slotSpacing);

        this.drawInventorySlot(state, slotIndex, slotX, slotY, slotSize);
      }
    }

    // Draw slots used indicator
    const usedSlots = state.inventory.slots.filter(s => s !== null).reduce((count, slot) => {
      if (slot) {
        const item = getItem(slot.itemId);
        return count + (item?.size || 1);
      }
      return count;
    }, 0);

    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = '#cccccc';
    this.ctx.fillText(`Slots: ${usedSlots}/${state.inventory.maxSlots}`, panelX + padding, panelY + panelHeight - 80);

    // Draw action prompts
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#999999';
    const prompts = [
      '[E] Examine  [U] Use  [C] Combine',
      '[D] Drop     [I/ESC] Close',
    ];
    prompts.forEach((prompt, i) => {
      this.ctx.fillText(prompt, panelX + padding, panelY + panelHeight - 50 + i * 18);
    });

    // Restore context state
    this.ctx.restore();
  }

  private drawInventorySlot(state: GameState, slotIndex: number, x: number, y: number, size: number) {
    const slot = state.inventory.slots[slotIndex];
    const isSelected = state.inventory.selectedSlot === slotIndex;
    const inCombineMode = state.interaction.mode === 'combine';
    const isFirstCombineItem = state.inventory.combineFirstItemSlot === slotIndex;

    // Draw slot background
    if (slot) {
      this.ctx.fillStyle = '#3a3a3a';
    } else {
      this.ctx.fillStyle = '#1a1a1a';
    }
    this.ctx.fillRect(x, y, size, size);

    // Draw slot border
    if (isSelected) {
      this.ctx.strokeStyle = '#ffff00';
      this.ctx.lineWidth = 3;
    } else if (isFirstCombineItem) {
      this.ctx.strokeStyle = '#ff8800';
      this.ctx.lineWidth = 3;
    } else {
      this.ctx.strokeStyle = '#555555';
      this.ctx.lineWidth = 2;
    }
    this.ctx.strokeRect(x, y, size, size);

    // Draw item if present
    if (slot) {
      const item = getItem(slot.itemId);
      if (item) {
        // Draw item icon (emoji)
        this.ctx.font = '40px monospace';
        this.ctx.fillStyle = '#ffffff';
        const iconWidth = this.ctx.measureText(item.icon).width;
        this.ctx.fillText(item.icon, x + (size - iconWidth) / 2, y + size / 2 + 15);

        // Draw contraband warning
        if (item.contrabandLevel !== 'none') {
          this.ctx.font = '16px monospace';
          this.ctx.fillText('⚠️', x + size - 20, y + 18);
        }

        // Draw stack count if stackable
        if (item.stackable && slot.quantity > 1) {
          this.ctx.font = 'bold 14px monospace';
          this.ctx.fillStyle = '#ffff00';
          this.ctx.fillText(`x${slot.quantity}`, x + 5, y + size - 5);
        }

        // Draw item name below slot
        this.ctx.font = '11px monospace';
        this.ctx.fillStyle = '#cccccc';
        const nameLines = this.truncateText(item.name, size - 4);
        this.ctx.fillText(nameLines, x + 2, y + size + 14);
      }
    } else {
      // Draw "Empty" text for empty slots
      this.ctx.font = '12px monospace';
      this.ctx.fillStyle = '#666666';
      this.ctx.fillText('Empty', x + size / 2 - 25, y + size / 2 + 5);
    }
  }

  private drawDroppedItems(state: GameState) {
    const droppedItems = state.inventory.droppedItems[state.currentRoom.id];
    if (!droppedItems || droppedItems.length === 0) return;

    for (const dropped of droppedItems) {
      const item = getItem(dropped.itemId);
      if (!item) continue;

      const x = dropped.position.x * TILE_SIZE;
      const y = dropped.position.y * TILE_SIZE;

      // Draw a small glowing circle to indicate item
      this.ctx.fillStyle = 'rgba(255, 255, 100, 0.6)';
      this.ctx.beginPath();
      this.ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw item icon
      this.ctx.font = '20px monospace';
      this.ctx.fillStyle = '#ffffff';
      const iconWidth = this.ctx.measureText(item.icon).width;
      this.ctx.fillText(item.icon, x + (TILE_SIZE - iconWidth) / 2, y + TILE_SIZE / 2 + 7);
    }
  }

  private drawUseItemMode(state: GameState) {
    if (!state.inventory.useItemId) return;

    const item = getItem(state.inventory.useItemId);
    if (!item) return;

    // Save and reset transform for UI elements
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw item icon in corner
    const cornerX = this.canvas.width - 80;
    const cornerY = 20;

    this.ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
    this.ctx.fillRect(cornerX, cornerY, 60, 60);

    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(cornerX, cornerY, 60, 60);

    this.ctx.font = '30px monospace';
    this.ctx.fillStyle = '#ffffff';
    const iconWidth = this.ctx.measureText(item.icon).width;
    this.ctx.fillText(item.icon, cornerX + (60 - iconWidth) / 2, cornerY + 42);

    // Restore context state
    this.ctx.restore();
  }

  private truncateText(text: string, maxWidth: number): string {
    this.ctx.font = '11px monospace';
    if (this.ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (this.ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  }

  // ========================================
  // NPC RENDERING
  // ========================================

  private drawNPCs(state: GameState) {
    // Get NPCs in current room
    const npcsInRoom = Object.values(state.npcs).filter(
      (npc) => npc.currentRoom === state.currentRoom.id
    );

    npcsInRoom.forEach((npc) => {
      this.drawNPC(npc);
    });
  }

  private drawNPC(npc: NPCData) {
    const npcSize = TILE_SIZE * 0.7;
    const offset = (TILE_SIZE - npcSize) / 2;

    const x = npc.pixelPosition.x + offset;
    const y = npc.pixelPosition.y + offset;

    // Different colors for different NPC types
    let color = '#888888';
    if (npc.type === 'guard') {
      color = '#cc3333'; // Red for guards
    } else if (npc.type === 'inmate') {
      color = '#ff8833'; // Orange for inmates
    } else if (npc.type === 'staff') {
      color = '#33cc66'; // Green for staff
    }

    // Draw NPC circle
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x + npcSize / 2, y + npcSize / 2, npcSize / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw direction indicator
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();

    const centerX = x + npcSize / 2;
    const centerY = y + npcSize / 2;
    const indicatorSize = 6;

    switch (npc.direction) {
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

    // Draw name label above NPC
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(npc.name, centerX, y - 5);
  }

  // ========================================
  // DIALOGUE RENDERING
  // ========================================

  private drawDialogue(state: GameState) {
    if (!state.dialogue.currentTree || !state.dialogue.currentNode) return;

    const tree = getDialogueTree(state.dialogue.currentTree);
    if (!tree) return;

    const node = tree.nodes[state.dialogue.currentNode];
    if (!node) return;

    // Draw semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dialogue box dimensions
    const boxWidth = 600;
    const boxHeight = 300;
    const boxX = (this.canvas.width - boxWidth) / 2;
    const boxY = this.canvas.height - boxHeight - 40;

    // Draw dialogue box background
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Draw border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Draw speaker name
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(node.speaker, boxX + 20, boxY + 30);

    // Draw dialogue text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    const textLines = this.wrapText(node.text, boxWidth - 40);
    textLines.forEach((line, i) => {
      this.ctx.fillText(line, boxX + 20, boxY + 60 + i * 20);
    });

    // Draw response options
    const responsesY = boxY + 140;
    node.responses.forEach((response, i) => {
      const isSelected = i === state.dialogue.selectedResponse;
      const optionY = responsesY + i * 30;

      // Draw selection indicator
      if (isSelected) {
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(boxX + 10, optionY - 18, boxWidth - 20, 25);
      }

      // Draw response number and text
      this.ctx.fillStyle = isSelected ? '#ffcc00' : '#cccccc';
      this.ctx.font = '14px monospace';
      this.ctx.fillText(`${i + 1}. ${response.text}`, boxX + 20, optionY);
    });

    // Draw instruction at bottom
    this.ctx.fillStyle = '#888888';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'Arrow Keys to navigate • E/Enter to select',
      boxX + boxWidth / 2,
      boxY + boxHeight - 15
    );
  }
}
