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
  isSneaking: boolean;
  isHiding: boolean;
  hidingSpot: string | null;
  caughtCount: number;
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

// ========================================
// INTERACTION SYSTEM
// ========================================

export type ActionType = 'examine' | 'search' | 'use' | 'open' | 'close' | 'take' | 'unlock';

export interface ActionRequirement {
  type: 'item' | 'state';
  itemId?: string;
  stateKey?: string;
  stateValue?: boolean;
}

export interface ActionDefinition {
  id: ActionType;
  name: string;
  available: boolean;
  requirements?: ActionRequirement[];
}

export interface InteractiveObject {
  id: string;
  name: string;
  roomId: string;
  positions: Position[]; // Multi-tile objects have multiple positions
  actions: ActionType[];
  defaultAction: ActionType;

  // Text descriptions
  examineText: string;
  useText?: string;
  searchEmptyText?: string;
  searchFindText?: string;
  lockedText?: string;

  // Searchable items
  hiddenItem?: {
    itemId: string;
    name: string;
    description: string;
  };

  // Requirements
  unlockRequirement?: string; // Key item ID needed
}

export interface ObjectState {
  objectId: string;
  searched: boolean;
  itemFound: boolean;
  open: boolean;
  locked: boolean;
  enabled: boolean;
}

export type UIMode = 'normal' | 'menu' | 'text' | 'inventory' | 'useItem' | 'combine' | 'dialogue';

export interface ContextMenu {
  isOpen: boolean;
  objectId: string | null;
  actions: ActionDefinition[];
  selectedIndex: number;
  position: Position; // Where to display menu
}

export interface TextDisplay {
  isVisible: boolean;
  text: string;
  title?: string;
}

export interface InteractionState {
  mode: UIMode;
  targetedObject: InteractiveObject | null;
  contextMenu: ContextMenu;
  textDisplay: TextDisplay;
  objectStates: Record<string, ObjectState>;
}

// ========================================
// INVENTORY SYSTEM - Phase 4
// ========================================

export interface InventorySlot {
  itemId: string;
  quantity: number;
  slot: number;
}

export interface DroppedItem {
  itemId: string;
  position: Position;
}

export interface InventoryState {
  isOpen: boolean;
  slots: (InventorySlot | null)[]; // Array of 6 slots (null = empty)
  maxSlots: number; // Default 6, expandable to 8
  selectedSlot: number; // Currently selected slot (0-5)

  // Use item mode
  useItemId: string | null; // Item being used (if in useItem mode)

  // Combine mode
  combineFirstItemSlot: number | null; // First item selected for combining

  // Dropped items per room
  droppedItems: Record<string, DroppedItem[]>; // roomId -> dropped items

  // Taken items (prevent re-finding)
  takenItems: Set<string>; // Set of object IDs that had items taken
}

// ========================================
// NPC SYSTEM - Phase 5
// ========================================

export type NPCType = 'guard' | 'inmate' | 'staff';
export type NPCBehavior = 'idle' | 'patrol' | 'alert' | 'chase' | 'conversation';

export interface PatrolPoint {
  room: string;
  col: number;
  row: number;
  wait: number; // seconds to wait at this point
  direction?: Direction; // direction to face while waiting
}

export interface NPCScheduleEntry {
  behavior: NPCBehavior;
  room?: string;
  patrolRoute?: string; // ID of patrol route to use
}

export interface NPCData {
  id: string;
  name: string;
  type: NPCType;
  sprite: string;

  // Position
  currentRoom: string;
  position: Position;
  direction: Direction;

  // Movement
  patrolRoute: PatrolPoint[];
  currentPatrolIndex: number;
  movementSpeed: number; // tiles per second
  isMoving: boolean;
  targetPosition: Position | null;
  pixelPosition: Position; // For smooth movement
  targetPixelPosition: Position;
  waitTimer?: number; // Current wait time at patrol point (seconds)

  // Behavior
  schedule: Record<string, NPCScheduleEntry>; // time range -> behavior
  currentBehavior: NPCBehavior;
  alertness: number; // 0-100

  // Vision (for guards)
  visionRange: number; // tiles
  visionAngle: number; // degrees

  // Dialogue
  dialogueTree: string | null;
  relationshipLevel: number; // -100 to 100
  talkedTo: boolean;

  // State
  isConscious: boolean;
  isAlive: boolean;
  flags: Record<string, boolean>;
}

export interface AlertState {
  prisonLevel: number; // 0-4
  lastIncidentTime: number | null;
  searchingFor: string | null;
  lockdownActive: boolean;
}

// Dialogue System
export interface DialogueEffect {
  type: 'knowledge' | 'relationship' | 'flag' | 'item' | 'event';
  value?: string | number;
  itemId?: string;
  flagName?: string;
}

export interface DialogueResponse {
  text: string;
  nextNode: string | null; // null = end dialogue
  conditions?: Record<string, boolean>; // flag conditions
  effects?: DialogueEffect[];
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  responses: DialogueResponse[];
  conditions?: Record<string, boolean>;
  effects?: DialogueEffect[];
  isEnd?: boolean;
}

export interface DialogueTree {
  id: string;
  startNode: string;
  nodes: Record<string, DialogueNode>;
}

export interface DialogueState {
  isActive: boolean;
  currentTree: string | null;
  currentNode: string | null;
  npcId: string | null;
  selectedResponse: number;
}

// ========================================
// TIME SYSTEM - Phase 6
// ========================================

export type TimePeriodId =
  | 'early_morning'
  | 'breakfast'
  | 'morning_work'
  | 'lunch'
  | 'afternoon_work'
  | 'recreation'
  | 'dinner'
  | 'evening_free'
  | 'lockdown';

export interface TimePeriod {
  id: TimePeriodId;
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  totalMinutes: number; // Minutes since game start
}

export interface TimeState {
  currentTime: GameTime;
  currentPeriod: TimePeriodId;
  isPaused: boolean;
  timeScale: number; // 1 = normal (1 real second = 1 game minute), higher = faster
  isWaiting: boolean;
  waitTargetTime: GameTime | null;
  periodNotification: string | null; // Shows period transition notification
  notificationTimeout: number | null; // Timeout ID for clearing notification
}

export type AreaRestrictionLevel = 'allowed' | 'suspicious' | 'restricted' | 'forbidden';

export interface AreaRestriction {
  roomId: string;
  period: TimePeriodId | 'all';
  level: AreaRestrictionLevel;
}

export interface TimeLockedDoor {
  exitId: string; // Exit ID from room
  openPeriods: TimePeriodId[];
  defaultState: ExitState;
  overrideKey?: string; // Key item that can open regardless of time
}

export interface GameState {
  player: PlayerState;
  currentRoom: Room;
  previousRoom: Room | null;
  input: InputState;
  debugMode: boolean;
  transition: TransitionState;
  interaction: InteractionState;
  inventory: InventoryState;
  npcs: Record<string, NPCData>;
  alertState: AlertState;
  dialogue: DialogueState;
  playerKnowledge: Set<string>; // Knowledge gained from dialogue
  time: TimeState;
}
