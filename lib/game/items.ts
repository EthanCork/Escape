// ========================================
// ITEM SYSTEM - Phase 4
// ========================================

export type ItemCategory = 'tool' | 'key' | 'document' | 'uniform' | 'consumable' | 'misc';
export type ContrabandLevel = 'none' | 'low' | 'medium' | 'high';

export interface Item {
  id: string;
  name: string;
  description: string;

  // Inventory properties
  size: 1 | 2; // Slots required (1 = normal, 2 = bulky)
  stackable: boolean;
  maxStack?: number;

  // Categorization
  category: ItemCategory;
  contrabandLevel: ContrabandLevel;

  // Usage
  usableOn: string[]; // IDs of objects this can be used on
  combinesWith: string[]; // IDs of items this can combine with
  consumedOnUse: boolean; // Disappears after use?

  // Special flags
  canExamine: boolean;
  canDrop: boolean;
  canCombine: boolean;

  // For documents
  readableContent?: string;

  // Visual (emoji placeholder for now)
  icon: string;
}

// ========================================
// ITEM DATABASE
// ========================================

export const ITEMS: Record<string, Item> = {
  sharpened_spoon: {
    id: 'sharpened_spoon',
    name: 'Sharpened Spoon',
    description: 'A metal spoon with one edge filed to a crude point. Previous owner put in serious work. Could dig through soft material or serve as a makeshift weapon.',
    size: 1,
    stackable: false,
    category: 'tool',
    contrabandLevel: 'high',
    usableOn: ['cell_wall_weak_spot', 'mattress', 'soft_ground'],
    combinesWith: ['wire'],
    consumedOnUse: false,
    canExamine: true,
    canDrop: true,
    canCombine: true,
    icon: '🥄',
  },

  book: {
    id: 'book',
    name: 'The Count of Monte Cristo',
    description: 'A worn paperback copy of the classic escape story. Some passages are underlined. Previous owner had good taste—or was leaving a message.',
    size: 1,
    stackable: false,
    category: 'document',
    contrabandLevel: 'none',
    usableOn: [],
    combinesWith: [],
    consumedOnUse: false,
    canExamine: true,
    canDrop: true,
    canCombine: false,
    readableContent: `THE COUNT OF MONTE CRISTO
By Alexandre Dumas

Chapter 15: Number 34 and Number 27

"...It was of no use to wait until Faria was seized with one of his fits—he might not have another, or it might come too late; and besides, in this attack the nervous excitement was so great that Faria might have been driven to madness..."

[Several underlined letters spell out: "DIG NORTH WALL"]`,
    icon: '📕',
  },

  guard_schedule: {
    id: 'guard_schedule',
    name: 'Guard Schedule',
    description: 'A partial rotation schedule for Guard Station B. Shows patrol times and shift changes. This information could be very useful.',
    size: 1,
    stackable: false,
    category: 'document',
    contrabandLevel: 'medium',
    usableOn: [],
    combinesWith: [],
    consumedOnUse: false,
    canExamine: true,
    canDrop: true,
    canCombine: false,
    readableContent: `SHIFT ROTATION - STATION B
Date: [REDACTED]

06:00 - Martinez → Cell Block C Patrol
10:00 - Shift Change (5 min gap, desk unmanned)
10:05 - Williams → Cell Block C Patrol
14:00 - Williams → Yard Duty
18:00 - Night Shift begins (Reduced staff)
22:00 - Lights out check
02:00 - Final rounds

Notes:
- Station B desk has direct view of corridor
- Blind spot: Cells C-12 through C-16
- Camera system offline Tuesdays for maintenance`,
    icon: '📄',
  },

  flashlight: {
    id: 'flashlight',
    name: 'Flashlight',
    description: 'A standard-issue guard flashlight. Heavy, metal construction. Batteries seem full. Could illuminate dark areas—or serve as a club in a pinch.',
    size: 1,
    stackable: false,
    category: 'tool',
    contrabandLevel: 'low',
    usableOn: ['dark_area', 'ventilation_shaft'],
    combinesWith: [],
    consumedOnUse: false,
    canExamine: true,
    canDrop: true,
    canCombine: false,
    icon: '🔦',
  },

  wire: {
    id: 'wire',
    name: 'Wire',
    description: 'A length of sturdy wire, maybe 12 inches. Flexible but strong. Could be bent into useful shapes.',
    size: 1,
    stackable: false,
    category: 'tool',
    contrabandLevel: 'medium',
    usableOn: [],
    combinesWith: ['sharpened_spoon'],
    consumedOnUse: false,
    canExamine: true,
    canDrop: true,
    canCombine: true,
    icon: '〰️',
  },

  lockpick: {
    id: 'lockpick',
    name: 'Crude Lockpick',
    description: 'A makeshift lockpick fashioned from a spoon and wire. Not pretty, but it should work on simple locks. Might break after a few uses.',
    size: 1,
    stackable: false,
    category: 'tool',
    contrabandLevel: 'high',
    usableOn: ['cell_door', 'locker', 'desk_drawer'],
    combinesWith: [],
    consumedOnUse: false, // For now, reusable
    canExamine: true,
    canDrop: true,
    canCombine: false,
    icon: '🔓',
  },

  cigarettes: {
    id: 'cigarettes',
    name: 'Cigarettes',
    description: "Prison currency. These can buy information, favors, or silence. Don't smoke them yourself—they're worth more as trade goods.",
    size: 1,
    stackable: true,
    maxStack: 10,
    category: 'consumable',
    contrabandLevel: 'none',
    usableOn: ['npc_guard_bribable', 'npc_inmate_trader'],
    combinesWith: [],
    consumedOnUse: true,
    canExamine: true,
    canDrop: true,
    canCombine: false,
    icon: '🚬',
  },

  rope: {
    id: 'rope',
    name: 'Rope',
    description: 'About 20 feet of sturdy rope, braided from torn bedsheets. Strong enough to support your weight. Takes up a lot of pocket space.',
    size: 2, // Bulky
    stackable: false,
    category: 'tool',
    contrabandLevel: 'high',
    usableOn: ['yard_wall', 'ventilation_shaft', 'elevator_shaft'],
    combinesWith: ['hook'],
    consumedOnUse: false,
    canExamine: true,
    canDrop: true,
    canCombine: true,
    icon: '🪢',
  },

  screwdriver: {
    id: 'screwdriver',
    name: 'Screwdriver',
    description: 'A flathead screwdriver from the maintenance closet. Can remove screws, pry open panels, or disable simple electronics.',
    size: 1,
    stackable: false,
    category: 'tool',
    contrabandLevel: 'medium',
    usableOn: ['cell_c14_vent_cover', 'vent_cover', 'electronic_panel', 'furniture_screws'],
    combinesWith: [],
    consumedOnUse: false,
    canExamine: true,
    canDrop: true,
    canCombine: false,
    icon: '🪛',
  },
};

// ========================================
// ITEM COMBINATION RECIPES
// ========================================

export interface CombinationRecipe {
  inputs: [string, string]; // Two item IDs
  output: string; // Resulting item ID
  message: string; // Success message
}

export const COMBINATION_RECIPES: CombinationRecipe[] = [
  {
    inputs: ['sharpened_spoon', 'wire'],
    output: 'lockpick',
    message: 'You bend the wire around the spoon\'s handle, creating a crude but functional lockpick. The spoon is bent out of shape in the process.',
  },
  // Future combinations can be added here
  // { inputs: ['rope', 'hook'], output: 'grappling_hook', message: '...' },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getItem(itemId: string): Item | null {
  return ITEMS[itemId] || null;
}

export function findCombination(item1Id: string, item2Id: string): CombinationRecipe | null {
  return COMBINATION_RECIPES.find(recipe => {
    const [a, b] = recipe.inputs;
    return (a === item1Id && b === item2Id) || (a === item2Id && b === item1Id);
  }) || null;
}

export function getContrabandWarning(level: ContrabandLevel): string {
  switch (level) {
    case 'none':
      return 'This item is allowed.';
    case 'low':
      return 'Slightly suspicious. Guards might question it.';
    case 'medium':
      return 'Clearly against the rules. If caught, expect consequences.';
    case 'high':
      return 'Highly illegal contraband. If caught with this, you\'ll face serious punishment.';
  }
}
