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
  } = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size based on room dimensions
    canvas.width = currentRoom.width * TILE_SIZE;
    canvas.height = currentRoom.height * TILE_SIZE;

    // Initialize renderer
    rendererRef.current = new Renderer(canvas);

    // Initialize input manager
    inputManagerRef.current = new InputManager(
      (direction) => {
        setInput(direction, true);
      },
      (direction) => {
        setInput(direction, false);
      }
    );

    // Add keyboard event listeners
    window.addEventListener('keydown', inputManagerRef.current.handleKeyDown);
    window.addEventListener('keyup', inputManagerRef.current.handleKeyUp);

    // Initialize game loop
    gameLoopRef.current = new GameLoop(
      (deltaTime) => {
        // Update logic
        const state = useGameStore.getState();

        // Handle movement animation
        if (state.player.isMoving) {
          const newPixelPos = movementControllerRef.current.updatePosition(
            state.player.pixelPosition,
            state.player.targetPixelPosition,
            () => {
              completePlayerMove();
            }
          );
          updatePlayerPixelPosition(newPixelPos);
        } else {
          // Check for input and initiate new moves
          const activeDirections = inputManagerRef.current?.getActiveDirections() || [];
          if (activeDirections.length > 0 && movementControllerRef.current.canStartNewMove()) {
            // Take the most recent direction
            const direction = activeDirections[activeDirections.length - 1];
            movePlayer(direction);
            movementControllerRef.current.startMove();
            movementControllerRef.current.recordMove();
          }
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
          Use Arrow Keys or WASD to move
        </p>
      </div>

      <div className="border-4 border-gray-700 shadow-2xl">
        <canvas ref={canvasRef} className="block" />
      </div>

      <div className="mt-4 text-gray-400 text-sm text-center">
        <p>Phase 1: Movement and Collision</p>
        {debugMode && (
          <p className="text-green-400 mt-1">Debug Mode Active</p>
        )}
      </div>
    </div>
  );
}
