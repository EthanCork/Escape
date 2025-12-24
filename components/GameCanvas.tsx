'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/game/store';
import { Renderer } from '@/lib/game/renderer';
import { InputManager } from '@/lib/game/input';
import { GameLoop, MovementController } from '@/lib/game/gameLoop';
import { TILE_SIZE } from '@/lib/game/constants';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const movementControllerRef = useRef<MovementController>(new MovementController());
  const [fps, setFps] = useState(60);

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
  } = useGameStore();

  // Effect to handle canvas size updates when room changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size based on room dimensions
    canvas.width = currentRoom.width * TILE_SIZE;
    canvas.height = currentRoom.height * TILE_SIZE;

    // Re-initialize renderer if needed
    if (!rendererRef.current) {
      rendererRef.current = new Renderer(canvas);
    }
  }, [currentRoom]);

  // Main initialization effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial canvas setup
    canvas.width = currentRoom.width * TILE_SIZE;
    canvas.height = currentRoom.height * TILE_SIZE;

    // Initialize renderer
    rendererRef.current = new Renderer(canvas);

    // Initialize input manager
    inputManagerRef.current = new InputManager({
      onDirectionPress: (direction) => {
        setInput(direction, true);
      },
      onDirectionRelease: (direction) => {
        setInput(direction, false);
      },
      onInteract: () => {
        openContextMenu();
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
        closeContextMenu();
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
      if (inputManagerRef.current) {
        window.removeEventListener('keydown', inputManagerRef.current.handleKeyDown);
        window.removeEventListener('keyup', inputManagerRef.current.handleKeyUp);
        inputManagerRef.current.cleanup();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-200 text-center">
          Irongate Penitentiary
        </h1>
        <p className="text-sm text-gray-400 text-center mt-2">
          Use Arrow Keys or WASD to move | Press E to interact
        </p>
      </div>

      <div className="border-4 border-gray-700 shadow-2xl">
        <canvas ref={canvasRef} className="block" />
      </div>

      <div className="mt-4 text-gray-400 text-sm text-center">
        <p>Phase 3: Interaction System</p>
        {debugMode && (
          <p className="text-green-400 mt-1">Debug Mode Active</p>
        )}
        {interaction.targetedObject && interaction.mode === 'normal' && (
          <p className="text-yellow-400 mt-1">
            Press E to interact with {interaction.targetedObject.name}
          </p>
        )}
      </div>
    </div>
  );
}
