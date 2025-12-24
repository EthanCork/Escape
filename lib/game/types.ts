export type Direction = 'up' | 'down' | 'left' | 'right';

export type TileType = 'floor' | 'wall' | 'bed' | 'desk' | 'toilet' | 'sink' | 'door';

export interface Tile {
  type: TileType;
  walkable: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Room {
  width: number;
  height: number;
  tiles: TileType[][];
  startPosition: Position;
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

export interface GameState {
  player: PlayerState;
  currentRoom: Room;
  input: InputState;
  debugMode: boolean;
}
