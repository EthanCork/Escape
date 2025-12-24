export type Direction = 'up' | 'down' | 'left' | 'right';

export type TileType = 'floor' | 'wall' | 'bed' | 'desk' | 'toilet' | 'sink' | 'door' | 'chair' | 'locker';

export type ExitType = 'door' | 'vent' | 'tunnel' | 'climb' | 'hidden';

export type ExitState = 'open' | 'closed' | 'locked' | 'unlocked';

export interface Tile {
  type: TileType;
  walkable: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface SpawnPoint {
  id: string;
  position: Position;
  direction: Direction;
}

export interface Exit {
  id: string;
  position: Position;
  targetRoom: string;
  targetSpawn: string;
  type: ExitType;
  state: ExitState;
  requiredKey?: string;
  direction?: Direction;
}

export interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[][];
  startPosition: Position;
  exits: Exit[];
  spawnPoints: SpawnPoint[];
}

export interface PlayerState {
  gridPosition: Position;
  pixelPosition: Position;
  targetPixelPosition: Position;
  direction: Direction;
  isMoving: boolean;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export type TransitionPhase = 'fadeOut' | 'switch' | 'fadeIn';

export interface TransitionState {
  isTransitioning: boolean;
  phase: TransitionPhase | null;
  progress: number;
  targetRoom: string | null;
  targetSpawn: string | null;
  startTime: number;
}

export interface GameState {
  player: PlayerState;
  currentRoom: Room;
  previousRoom: Room | null;
  input: InputState;
  debugMode: boolean;
  transition: TransitionState;
}
