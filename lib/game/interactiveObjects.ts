import type { InteractiveObject, Position } from './types';

// ========================================
// HELPER FUNCTIONS
// ========================================

const createObject = (
  id: string,
  name: string,
  roomId: string,
  positions: Position[],
  examineText: string,
  actions: InteractiveObject['actions'] = ['examine'],
  additionalProps?: Partial<InteractiveObject>
): InteractiveObject => ({
  id,
  name,
  roomId,
  positions,
  actions,
  defaultAction: 'examine',
  examineText,
  ...additionalProps,
});

// ========================================
// CELL C-14 OBJECTS
// ========================================

export const cellC14Bed: InteractiveObject = createObject(
  'cell_c14_bed',
  'Bed',
  'cell_c14',
  [
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
  ],
  "A thin mattress on a rusted metal frame. Standard prison issue. The mattress looks lumpy—something might be hidden inside.",
  ['examine', 'search', 'use'],
  {
    searchFindText: "Hidden inside the mattress stuffing, you find a sharpened spoon. Previous occupant's work, perhaps.",
    searchEmptyText: "You've already searched the mattress thoroughly.",
    useText: "You lay down on the bed. Time to rest.",
    hiddenItem: {
      itemId: 'sharpened_spoon',
      name: 'Sharpened Spoon',
      description: 'A metal spoon filed to a sharp point. Could be useful as a tool.',
    },
  }
);

export const cellC14Desk: InteractiveObject = createObject(
  'cell_c14_desk',
  'Desk',
  'cell_c14',
  [
    { x: 1, y: 5 },
    { x: 2, y: 5 },
  ],
  "A small metal desk welded to the wall. There's a drawer underneath, and the surface is covered in scratched graffiti.",
  ['examine', 'search'],
  {
    searchFindText: "The drawer contains a worn paperback book. 'The Count of Monte Cristo'—how appropriate.",
    searchEmptyText: "The drawer is empty.",
    hiddenItem: {
      itemId: 'book',
      name: 'The Count of Monte Cristo',
      description: 'A classic tale of imprisonment and escape. Perhaps it contains inspiration.',
    },
  }
);

export const cellC14Toilet: InteractiveObject = createObject(
  'cell_c14_toilet',
  'Toilet',
  'cell_c14',
  [{ x: 7, y: 2 }],
  "A metal toilet bolted to the floor. Cold, uncomfortable, and offering zero privacy. At least it flushes.",
  ['examine', 'use'],
  {
    useText: "You use the toilet. Some dignity remains, even here.",
  }
);

export const cellC14Sink: InteractiveObject = createObject(
  'cell_c14_sink',
  'Sink',
  'cell_c14',
  [{ x: 7, y: 4 }],
  "A small metal sink with a single tap. The water runs cold. A fragment of mirror above it shows your tired reflection.",
  ['examine', 'use'],
  {
    useText: "You splash cold water on your face. It helps you focus.",
  }
);

export const cellC14Door: InteractiveObject = createObject(
  'cell_c14_door',
  'Cell Door',
  'cell_c14',
  [
    { x: 4, y: 7 },
    { x: 5, y: 7 },
  ],
  "Heavy metal bars set in a steel frame. The lock looks solid. During the day, guards control when these open.",
  ['examine']
);

// ========================================
// CORRIDOR B OBJECTS
// ========================================

const createCellDoor = (cellNumber: string, position: Position): InteractiveObject =>
  createObject(
    `corridor_cell_${cellNumber}_door`,
    `Cell ${cellNumber} Door`,
    'corridor_b',
    [position],
    `Cell ${cellNumber}. The door is locked. You can see a dark shape inside—another prisoner, lost in thought or asleep.`,
    ['examine']
  );

export const corridorCellC11Door = createCellDoor('C-11', { x: 2, y: 2 });
export const corridorCellC12Door: InteractiveObject = createObject(
  'corridor_cell_c12_door',
  'Cell C-12 Door',
  'corridor_b',
  [{ x: 5, y: 2 }],
  "Cell C-12. The door stands open. You can hear someone inside.",
  ['examine']
);
export const corridorCellC13Door = createCellDoor('C-13', { x: 8, y: 2 });
export const corridorCellC14Door: InteractiveObject = createObject(
  'corridor_cell_c14_door',
  'Cell C-14 Door',
  'corridor_b',
  [{ x: 11, y: 2 }],
  "Your cell. Home sweet home. The door stands open during free movement hours.",
  ['examine']
);
export const corridorCellC15Door = createCellDoor('C-15', { x: 14, y: 2 });
export const corridorCellC16Door = createCellDoor('C-16', { x: 17, y: 2 });

export const corridorGuardStationDoor: InteractiveObject = createObject(
  'corridor_guard_station_door',
  'Guard Station Door',
  'corridor_b',
  [
    { x: 17, y: 6 },
    { x: 18, y: 6 },
  ],
  "The entrance to Guard Station B. Through the reinforced glass window, you can see a desk and monitors.",
  ['examine']
);

// ========================================
// GUARD STATION B OBJECTS
// ========================================

export const guardStationDesk: InteractiveObject = createObject(
  'guard_station_desk',
  'Guard Desk',
  'guard_station_b',
  [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
  ],
  "A metal desk covered in paperwork, coffee rings, and a dusty computer monitor. Guards aren't known for tidiness.",
  ['examine', 'search'],
  {
    searchFindText: "You rifle through the papers. Most are routine reports. One document catches your eye—a partial guard rotation schedule.",
    searchEmptyText: "You've already gone through the papers.",
    hiddenItem: {
      itemId: 'guard_schedule',
      name: 'Guard Schedule',
      description: 'A partial rotation schedule. Could be useful for planning movements.',
    },
  }
);

export const guardStationChair: InteractiveObject = createObject(
  'guard_station_chair',
  'Office Chair',
  'guard_station_b',
  [{ x: 3, y: 4 }],
  "A worn office chair. The cushion is permanently molded to someone else's shape.",
  ['examine']
);

export const guardStationLocker: InteractiveObject = createObject(
  'guard_station_locker',
  'Weapon Locker',
  'guard_station_b',
  [
    { x: 7, y: 3 },
    { x: 7, y: 4 },
  ],
  "A tall metal locker with a heavy padlock. Standard equipment storage—batons, cuffs, maybe pepper spray.",
  ['examine'],
  {
    lockedText: "The locker is locked tight. You'd need the key or some serious tools to get in here.",
  }
);

export const guardStationFlashlight: InteractiveObject = createObject(
  'guard_station_flashlight',
  'Flashlight',
  'guard_station_b',
  [{ x: 2, y: 2 }], // On the desk
  "A heavy-duty flashlight sitting on the desk. Standard guard issue. The batteries look fresh.",
  ['examine', 'take'],
  {
    hiddenItem: {
      itemId: 'flashlight',
      name: 'Flashlight',
      description: 'A standard-issue guard flashlight.',
    },
  }
);

// ========================================
// CELL C-14 ADDITIONAL OBJECTS
// ========================================

export const cellC14VentCover: InteractiveObject = createObject(
  'cell_c14_vent_cover',
  'Vent Cover',
  'cell_c14',
  [{ x: 4, y: 0 }], // Ceiling vent
  "A metal vent cover in the ceiling, held in place by four screws. It's been painted over many times, but you can still make out the screw heads.",
  ['examine']
);

// ========================================
// OBJECT REGISTRY
// ========================================

export const INTERACTIVE_OBJECTS: Record<string, InteractiveObject> = {
  // Cell C-14
  cell_c14_bed: cellC14Bed,
  cell_c14_desk: cellC14Desk,
  cell_c14_toilet: cellC14Toilet,
  cell_c14_sink: cellC14Sink,
  cell_c14_door: cellC14Door,
  cell_c14_vent_cover: cellC14VentCover,

  // Corridor
  corridor_cell_c11_door: corridorCellC11Door,
  corridor_cell_c12_door: corridorCellC12Door,
  corridor_cell_c13_door: corridorCellC13Door,
  corridor_cell_c14_door: corridorCellC14Door,
  corridor_cell_c15_door: corridorCellC15Door,
  corridor_cell_c16_door: corridorCellC16Door,
  corridor_guard_station_door: corridorGuardStationDoor,

  // Guard Station
  guard_station_desk: guardStationDesk,
  guard_station_chair: guardStationChair,
  guard_station_locker: guardStationLocker,
  guard_station_flashlight: guardStationFlashlight,
};

// Helper function to get objects in a specific room
export const getObjectsInRoom = (roomId: string): InteractiveObject[] => {
  return Object.values(INTERACTIVE_OBJECTS).filter((obj) => obj.roomId === roomId);
};

// Helper function to get object at a specific position
export const getObjectAtPosition = (roomId: string, position: Position): InteractiveObject | null => {
  const objects = getObjectsInRoom(roomId);
  return objects.find((obj) =>
    obj.positions.some((pos) => pos.x === position.x && pos.y === position.y)
  ) || null;
};
