'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/game/store';
import { Renderer } from '@/lib/game/renderer';
import { InputManager } from '@/lib/game/input';
import { GameLoop, MovementController } from '@/lib/game/gameLoop';
import { TILE_SIZE } from '@/lib/game/constants';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const movementControllerRef = useRef<MovementController>(new MovementController());
  const [fps, setFps] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);

  const {
    player,
    currentRoom,
    movePlayer,
    updatePlayerPixelPosition,
    completePlayerMove,
    setInput,
    debugMode,
    updateTransition,
    updateTargetedObject,
    openContextMenu,
    closeContextMenu,
    navigateMenu,
    selectMenuAction,
    dismissText,
    interaction,
    inventory,
    openInventory,
    closeInventory,
    navigateInventory,
    examineInventoryItem,
    useInventoryItem,
    startCombine,
    finishCombine,
    cancelCombine,
    dropInventoryItem,
    applyItemToObject,
  } = useGameStore();

  // Function to start game
  const startGame = () => {
    setGameStarted(true);
  };

  // Main initialization effect
  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Function to update canvas size
    const updateCanvasSize = () => {
      // Get the base game dimensions
      const baseWidth = currentRoom.width * TILE_SIZE;
      const baseHeight = currentRoom.height * TILE_SIZE;

      // Get available screen space (with some padding)
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const padding = 80;

      // Calculate scale to fit screen while maintaining aspect ratio
      const scaleX = (screenWidth - padding) / baseWidth;
      const scaleY = (screenHeight - padding) / baseHeight;
      let scale = Math.min(scaleX, scaleY);

      // Prefer integer scaling for crisp pixels
      if (scale >= 2) {
        scale = Math.floor(scale);
      } else if (scale >= 1.5) {
        scale = 1.5;
      } else {
        scale = Math.max(1, scale);
      }

      // Set canvas INTERNAL resolution to the DISPLAY size (no scaling!)
      // This is the key fix - render at actual size, not scaled up
      const displayWidth = baseWidth * scale;
      const displayHeight = baseHeight * scale;

      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // Set CSS size to match (1:1 ratio, no CSS scaling)
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // Disable image smoothing for crisp pixel art
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        // Scale the drawing context to match
        ctx.scale(scale, scale);
      }
    };

    // Initialize canvas size first
    updateCanvasSize();

    // Then initialize renderer
    rendererRef.current = new Renderer(canvas);

    // Add resize listener
    window.addEventListener('resize', updateCanvasSize);

    // Initialize input manager
    inputManagerRef.current = new InputManager({
      onDirectionPress: (direction) => {
        setInput(direction, true);
      },
      onDirectionRelease: (direction) => {
        setInput(direction, false);
      },
      onInteract: () => {
        const state = useGameStore.getState();

        // If in useItem mode, apply item to targeted object
        if (state.interaction.mode === 'useItem' && state.inventory.useItemId && state.interaction.targetedObject) {
          applyItemToObject(state.inventory.useItemId, state.interaction.targetedObject.id);
        } else {
          openContextMenu();
        }
      },
      onConfirm: () => {
        const state = useGameStore.getState();
        if (state.interaction.mode === 'menu') {
          selectMenuAction();
        } else if (state.interaction.mode === 'text') {
          dismissText();
        }
      },
      onCancel: () => {
        const state = useGameStore.getState();
        if (state.interaction.mode === 'useItem') {
          // Exit use item mode
          closeInventory(); // This will reset mode to normal
        } else if (state.interaction.mode === 'combine') {
          cancelCombine();
        } else {
          closeContextMenu();
        }
      },
      onMenuUp: () => {
        navigateMenu('up');
      },
      onMenuDown: () => {
        navigateMenu('down');
      },
      getCurrentMode: () => {
        return useGameStore.getState().interaction.mode;
      },

      // Inventory callbacks
      onInventoryToggle: () => {
        const state = useGameStore.getState();
        if (state.inventory.isOpen) {
          closeInventory();
        } else {
          openInventory();
        }
      },
      onInventoryNavigate: (direction) => {
        navigateInventory(direction);
      },
      onInventoryExamine: () => {
        const state = useGameStore.getState();
        examineInventoryItem(state.inventory.selectedSlot);
      },
      onInventoryUse: () => {
        const state = useGameStore.getState();
        useInventoryItem(state.inventory.selectedSlot);
      },
      onInventoryCombine: () => {
        const state = useGameStore.getState();
        if (state.interaction.mode === 'combine') {
          // Second item selected for combining
          finishCombine(state.inventory.selectedSlot);
        } else {
          // First item selected for combining
          startCombine(state.inventory.selectedSlot);
        }
      },
      onInventoryDrop: () => {
        const state = useGameStore.getState();
        dropInventoryItem(state.inventory.selectedSlot);
      },

      // Debug callback
      onGiveTestItems: () => {
        const state = useGameStore.getState();
        state.giveTestItems();
      },
    });

    // Add keyboard event listeners
    window.addEventListener('keydown', inputManagerRef.current.handleKeyDown);
    window.addEventListener('keyup', inputManagerRef.current.handleKeyUp);

    // Initialize game loop
    gameLoopRef.current = new GameLoop(
      (deltaTime) => {
        // Update logic
        const state = useGameStore.getState();

        // Update room transitions
        if (state.transition.isTransitioning) {
          updateTransition(performance.now());
        }

        // Handle movement animation
        if (state.player.isMoving) {
          const newPixelPos = movementControllerRef.current.updatePosition(
            state.player.pixelPosition,
            state.player.targetPixelPosition,
            () => {
              completePlayerMove();
              // Update targeted object after movement completes
              updateTargetedObject();
            }
          );
          updatePlayerPixelPosition(newPixelPos);
        } else if (!state.transition.isTransitioning) {
          // Check for input and initiate new moves (only if not transitioning)
          const activeDirections = inputManagerRef.current?.getActiveDirections() || [];
          if (activeDirections.length > 0 && movementControllerRef.current.canStartNewMove()) {
            // Take the most recent direction
            const direction = activeDirections[activeDirections.length - 1];
            movePlayer(direction);
            movementControllerRef.current.startMove();
            movementControllerRef.current.recordMove();
          }
        }

        // Update targeted object based on current position (for non-moving states)
        if (!state.player.isMoving && !state.transition.isTransitioning) {
          updateTargetedObject();
        }
      },
      (currentFps) => {
        // Render logic
        if (rendererRef.current) {
          const state = useGameStore.getState();
          rendererRef.current.render(state, currentFps);
          setFps(currentFps);
        }
      }
    );

    // Start the game loop
    gameLoopRef.current.start();

    // Cleanup
    return () => {
      gameLoopRef.current?.stop();
      window.removeEventListener('resize', updateCanvasSize);
      if (inputManagerRef.current) {
        window.removeEventListener('keydown', inputManagerRef.current.handleKeyDown);
        window.removeEventListener('keyup', inputManagerRef.current.handleKeyUp);
        inputManagerRef.current.cleanup();
      }
    };
  }, [gameStarted, currentRoom]);

  // Show title screen if game hasn't started
  if (!gameStarted) {
    return (
      <div
        className="fixed inset-0 bg-black"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh'
        }}
      >
        <div className="text-center">
          <h1 className="text-7xl font-bold text-gray-200 tracking-wider mb-6">
            IRONGATE PENITENTIARY
          </h1>
          <p className="text-2xl text-gray-400 italic mb-12">
            Your escape begins now...
          </p>

          <button
            onClick={startGame}
            className="px-16 py-6 text-3xl font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border-4 border-gray-600 hover:border-gray-500 transition-all duration-200 transform hover:scale-105"
          >
            PRESS TO PLAY
          </button>

          <div className="mt-12 text-sm text-gray-500 space-y-1">
            <p>Arrow Keys or WASD to move</p>
            <p>E to interact | I for inventory | G for test items</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', margin: '0' }}
      />

      {/* Debug info removed */}

      {/* Interaction prompts - always show */}
      <div className="absolute bottom-4 left-4 text-gray-400 text-sm">
        {interaction.targetedObject && interaction.mode === 'normal' && (
          <p className="text-yellow-400">
            Press E to interact with {interaction.targetedObject.name}
          </p>
        )}
        {interaction.mode === 'useItem' && inventory.useItemId && (
          <p className="text-cyan-400">
            Use item mode - Press E on object or ESC to cancel
          </p>
        )}
      </div>
    </div>
  );
}
