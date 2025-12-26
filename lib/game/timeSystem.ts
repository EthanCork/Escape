import type { TimePeriod, TimePeriodId, GameTime, TimeLockedDoor, AreaRestriction } from './types';

// ========================================
// TIME PERIODS - Prison Daily Schedule
// ========================================

export const TIME_PERIODS: TimePeriod[] = [
  {
    id: 'early_morning',
    name: 'Wake-Up',
    startHour: 6,
    startMinute: 0,
    endHour: 7,
    endMinute: 0,
  },
  {
    id: 'breakfast',
    name: 'Breakfast',
    startHour: 7,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
  },
  {
    id: 'morning_work',
    name: 'Morning Work',
    startHour: 8,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
  },
  {
    id: 'lunch',
    name: 'Lunch',
    startHour: 12,
    startMinute: 0,
    endHour: 13,
    endMinute: 0,
  },
  {
    id: 'afternoon_work',
    name: 'Afternoon Work',
    startHour: 13,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
  },
  {
    id: 'recreation',
    name: 'Recreation',
    startHour: 16,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
  },
  {
    id: 'dinner',
    name: 'Dinner',
    startHour: 18,
    startMinute: 0,
    endHour: 20,
    endMinute: 0,
  },
  {
    id: 'evening_free',
    name: 'Evening Free Time',
    startHour: 20,
    startMinute: 0,
    endHour: 22,
    endMinute: 0,
  },
  {
    id: 'lockdown',
    name: 'Lockdown',
    startHour: 22,
    startMinute: 0,
    endHour: 6,
    endMinute: 0,
  },
];

// ========================================
// TIME-LOCKED DOORS
// ========================================

export const TIME_LOCKED_DOORS: TimeLockedDoor[] = [
  // Cafeteria door - only open during meals
  {
    exitId: 'cafeteria_door',
    openPeriods: ['breakfast', 'lunch', 'dinner'],
    defaultState: 'locked',
    overrideKey: 'staff_key',
  },
  // Yard gate - only open during recreation
  {
    exitId: 'yard_gate',
    openPeriods: ['recreation'],
    defaultState: 'locked',
    overrideKey: 'guard_key',
  },
  // Cell doors - locked during lockdown
  {
    exitId: 'cell_c14_door',
    openPeriods: [
      'early_morning',
      'breakfast',
      'morning_work',
      'lunch',
      'afternoon_work',
      'recreation',
      'dinner',
      'evening_free',
    ],
    defaultState: 'locked',
    overrideKey: 'cell_key',
  },
  {
    exitId: 'cell_c12_door',
    openPeriods: [
      'early_morning',
      'breakfast',
      'morning_work',
      'lunch',
      'afternoon_work',
      'recreation',
      'dinner',
      'evening_free',
    ],
    defaultState: 'locked',
    overrideKey: 'cell_key',
  },
];

// ========================================
// AREA RESTRICTIONS
// ========================================

export const AREA_RESTRICTIONS: AreaRestriction[] = [
  // Guard Station B - always forbidden
  {
    roomId: 'guard_station_b',
    period: 'all',
    level: 'forbidden',
  },
  // Corridors - forbidden during lockdown
  {
    roomId: 'corridor_b',
    period: 'lockdown',
    level: 'forbidden',
  },
  {
    roomId: 'corridor_a',
    period: 'lockdown',
    level: 'forbidden',
  },
  // Cafeteria - suspicious outside meal times
  {
    roomId: 'cafeteria',
    period: 'morning_work',
    level: 'suspicious',
  },
  {
    roomId: 'cafeteria',
    period: 'afternoon_work',
    level: 'suspicious',
  },
  // Yard - restricted outside recreation
  {
    roomId: 'yard',
    period: 'early_morning',
    level: 'restricted',
  },
  {
    roomId: 'yard',
    period: 'lockdown',
    level: 'forbidden',
  },
];

// ========================================
// TIME HELPER FUNCTIONS
// ========================================

/**
 * Convert time to total minutes for easy comparison
 */
export function timeToMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/**
 * Get the current time period based on hour and minute
 */
export function getPeriodForTime(hour: number, minute: number): TimePeriodId {
  const currentMinutes = timeToMinutes(hour, minute);

  for (const period of TIME_PERIODS) {
    const startMinutes = timeToMinutes(period.startHour, period.startMinute);
    let endMinutes = timeToMinutes(period.endHour, period.endMinute);

    // Handle midnight wraparound for lockdown (22:00 - 06:00)
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
      // Check if we're in the wrapped range
      if (currentMinutes >= startMinutes || currentMinutes < timeToMinutes(period.endHour, period.endMinute)) {
        return period.id;
      }
    } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return period.id;
    }
  }

  // Fallback to lockdown (shouldn't happen)
  return 'lockdown';
}

/**
 * Get period information by ID
 */
export function getPeriod(periodId: TimePeriodId): TimePeriod | undefined {
  return TIME_PERIODS.find((p) => p.id === periodId);
}

/**
 * Advance time by a given number of real milliseconds
 * Returns new GameTime and whether period changed
 */
export function advanceTime(
  currentTime: GameTime,
  realDeltaMs: number,
  timeScale: number = 1
): { newTime: GameTime; periodChanged: boolean; newPeriod: TimePeriodId } {
  const oldPeriod = getPeriodForTime(currentTime.hour, currentTime.minute);

  // Time compression: 1 real second = 1 game minute (at scale 1)
  const gameMinutesElapsed = (realDeltaMs / 1000) * timeScale;

  let newTotalMinutes = currentTime.totalMinutes + gameMinutesElapsed;
  let newMinute = currentTime.minute + gameMinutesElapsed;
  let newHour = currentTime.hour;
  let newDay = currentTime.day;

  // Handle minute overflow
  while (newMinute >= 60) {
    newMinute -= 60;
    newHour += 1;
  }

  // Handle hour overflow
  while (newHour >= 24) {
    newHour -= 24;
    newDay += 1;
  }

  // Clamp values to valid ranges and floor them
  const finalHour = Math.max(0, Math.min(23, Math.floor(newHour)));
  const finalMinute = Math.max(0, Math.min(59, Math.floor(newMinute)));

  const newTime: GameTime = {
    day: newDay,
    hour: finalHour,
    minute: finalMinute,
    totalMinutes: newTotalMinutes,
  };

  const newPeriod = getPeriodForTime(newTime.hour, newTime.minute);
  const periodChanged = oldPeriod !== newPeriod;

  return { newTime, periodChanged, newPeriod };
}

/**
 * Create initial game time (06:00 Day 1)
 */
export function createInitialTime(): GameTime {
  return {
    day: 1,
    hour: 6,
    minute: 0,
    totalMinutes: 0,
  };
}

/**
 * Format time as HH:00 (24-hour format, hours only)
 */
export function formatTime(time: GameTime): string {
  const hours = time.hour.toString().padStart(2, '0');
  return `${hours}:00`;
}

/**
 * Check if a door should be open based on current period
 */
export function isDoorOpenBySchedule(exitId: string, currentPeriod: TimePeriodId): boolean {
  const door = TIME_LOCKED_DOORS.find((d) => d.exitId === exitId);
  if (!door) return true; // Not a time-locked door

  return door.openPeriods.includes(currentPeriod);
}

/**
 * Get the restriction level for a room in a given period
 */
export function getAreaRestrictionLevel(
  roomId: string,
  period: TimePeriodId
): 'allowed' | 'suspicious' | 'restricted' | 'forbidden' {
  // Check for specific period restriction
  const periodRestriction = AREA_RESTRICTIONS.find(
    (r) => r.roomId === roomId && r.period === period
  );
  if (periodRestriction) return periodRestriction.level;

  // Check for 'all' period restriction
  const allRestriction = AREA_RESTRICTIONS.find(
    (r) => r.roomId === roomId && r.period === 'all'
  );
  if (allRestriction) return allRestriction.level;

  // Default to allowed
  return 'allowed';
}

/**
 * Get next period and time until it starts
 */
export function getNextPeriod(currentTime: GameTime): {
  nextPeriod: TimePeriodId;
  minutesUntil: number;
} {
  const currentPeriod = getPeriodForTime(currentTime.hour, currentTime.minute);
  const currentIndex = TIME_PERIODS.findIndex((p) => p.id === currentPeriod);

  // Get next period (wrap around)
  const nextIndex = (currentIndex + 1) % TIME_PERIODS.length;
  const nextPeriod = TIME_PERIODS[nextIndex];

  // Calculate minutes until next period
  const currentMinutes = timeToMinutes(currentTime.hour, currentTime.minute);
  let nextMinutes = timeToMinutes(nextPeriod.startHour, nextPeriod.startMinute);

  // Handle midnight wraparound
  if (nextMinutes <= currentMinutes) {
    nextMinutes += 24 * 60;
  }

  const minutesUntil = nextMinutes - currentMinutes;

  return {
    nextPeriod: nextPeriod.id,
    minutesUntil,
  };
}

/**
 * Check if waiting is safe at current location
 */
export function canWaitSafely(
  roomId: string,
  playerPosition: { x: number; y: number },
  npcs: Array<{ position: { x: number; y: number }; visionRange: number }>
): boolean {
  // Check if any NPC can see the player
  for (const npc of npcs) {
    const distance = Math.sqrt(
      Math.pow(npc.position.x - playerPosition.x, 2) +
      Math.pow(npc.position.y - playerPosition.y, 2)
    );
    if (distance <= npc.visionRange) {
      return false; // NPC too close
    }
  }

  // Safe to wait
  return true;
}
