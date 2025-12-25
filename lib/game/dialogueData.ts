import type { DialogueTree } from './types';

// ========================================
// OLD TIMER DIALOGUE TREE
// ========================================

export const oldTimerDialogue: DialogueTree = {
  id: 'old_timer_main',
  startNode: 'greeting_first',
  nodes: {
    greeting_first: {
      id: 'greeting_first',
      speaker: 'Old Timer',
      text: "New fish, huh? I've seen a hundred like you come and go. Name's... well, everyone just calls me Old Timer.",
      responses: [
        {
          text: "I'm trying to get out of here.",
          nextNode: 'escape_interest',
        },
        {
          text: "How long have you been here?",
          nextNode: 'backstory',
        },
        {
          text: "Leave me alone.",
          nextNode: 'end_cold',
          effects: [{ type: 'relationship', value: -5 }],
        },
      ],
    },

    greeting_return: {
      id: 'greeting_return',
      speaker: 'Old Timer',
      text: "Back again? What do you need?",
      responses: [
        {
          text: "Tell me about the guards.",
          nextNode: 'guard_info',
        },
        {
          text: "Know any way out?",
          nextNode: 'escape_info',
        },
        {
          text: "Just passing through.",
          nextNode: 'end_friendly',
        },
      ],
    },

    escape_interest: {
      id: 'escape_interest',
      speaker: 'Old Timer',
      text: "Get out? Ha! Everyone thinks that at first. But this place... it has a way of breaking that spirit. Still... I've heard things over the years.",
      responses: [
        {
          text: "What kind of things?",
          nextNode: 'escape_hints',
        },
        {
          text: "Never mind.",
          nextNode: 'end_neutral',
        },
      ],
    },

    backstory: {
      id: 'backstory',
      speaker: 'Old Timer',
      text: "Twenty-three years. Lost count after the first decade. This place becomes your whole world. But I still remember... still watch. And I see things.",
      responses: [
        {
          text: "What do you see?",
          nextNode: 'escape_hints',
        },
        {
          text: "That's rough, man.",
          nextNode: 'end_friendly',
          effects: [{ type: 'relationship', value: 5 }],
        },
      ],
    },

    escape_hints: {
      id: 'escape_hints',
      speaker: 'Old Timer',
      text: "The vents connect everything. And I mean everything. Old building, old ducts. A man small enough, quiet enough... might go places he shouldn't.",
      responses: [
        {
          text: "Thanks for the tip.",
          nextNode: 'end_friendly',
        },
        {
          text: "Anything else?",
          nextNode: 'more_hints',
        },
      ],
      effects: [
        { type: 'knowledge', value: 'vent_system_hint' },
        { type: 'flag', flagName: 'told_about_vents' },
      ],
    },

    more_hints: {
      id: 'more_hints',
      speaker: 'Old Timer',
      text: "You'll need tools. A screwdriver, maybe. Guards leave things lying around in the guard station. Of course, getting in there without being caught... that's the trick.",
      responses: [
        {
          text: "When's the best time to move around?",
          nextNode: 'guard_info',
        },
        {
          text: "I'll figure it out. Thanks.",
          nextNode: 'end_grateful',
        },
      ],
      effects: [{ type: 'knowledge', value: 'guard_station_tools' }],
    },

    escape_info: {
      id: 'escape_info',
      speaker: 'Old Timer',
      text: "I've thought about it for years. Never had the guts myself. But if I were you? I'd start with the vents. They're your ticket to places you're not supposed to be.",
      responses: [
        {
          text: "How do I access them?",
          nextNode: 'vent_access',
        },
        {
          text: "I'll think about it.",
          nextNode: 'end_neutral',
        },
      ],
    },

    vent_access: {
      id: 'vent_access',
      speaker: 'Old Timer',
      text: "There's a vent cover in your cell. In the ceiling. You'll need something to unscrew it. A screwdriver, if you can get one. Or maybe a coin, if you're patient.",
      responses: [
        {
          text: "Where can I get a screwdriver?",
          nextNode: 'more_hints',
        },
        {
          text: "Got it. Thanks.",
          nextNode: 'end_grateful',
        },
      ],
      effects: [
        { type: 'knowledge', value: 'vent_access_method' },
        { type: 'flag', flagName: 'told_about_vents' },
      ],
    },

    guard_info: {
      id: 'guard_info',
      speaker: 'Old Timer',
      text: "Martinez is decent. Does his rounds like clockwork—walks the whole corridor, east to west and back. Takes him about 26 seconds for the full loop. Williams, though... he's a snake. Loves catching people out.",
      responses: [
        {
          text: "When does Martinez patrol?",
          nextNode: 'patrol_timing',
        },
        {
          text: "Good to know. Thanks.",
          nextNode: 'end_friendly',
        },
      ],
      effects: [
        { type: 'knowledge', value: 'guard_martinez_info' },
        { type: 'flag', flagName: 'told_about_guard_schedule' },
      ],
    },

    patrol_timing: {
      id: 'patrol_timing',
      speaker: 'Old Timer',
      text: "He starts at the east end near the guard station, walks west to the far end, then back. Continuous loop. You've got maybe 4 seconds when he turns around at the far end before he's heading back your way.",
      responses: [
        {
          text: "That's useful. Thanks.",
          nextNode: 'end_grateful',
        },
        {
          text: "I'll watch his pattern.",
          nextNode: 'end_friendly',
        },
      ],
      effects: [{ type: 'knowledge', value: 'guard_patrol_timing' }],
    },

    end_grateful: {
      id: 'end_grateful',
      speaker: 'Old Timer',
      text: "Don't mention it. Literally. If they find out I'm helping you...",
      responses: [],
      effects: [{ type: 'relationship', value: 10 }],
      isEnd: true,
    },

    end_friendly: {
      id: 'end_friendly',
      speaker: 'Old Timer',
      text: "Watch yourself, kid.",
      responses: [],
      effects: [{ type: 'relationship', value: 5 }],
      isEnd: true,
    },

    end_neutral: {
      id: 'end_neutral',
      speaker: 'Old Timer',
      text: "Alright then.",
      responses: [],
      isEnd: true,
    },

    end_cold: {
      id: 'end_cold',
      speaker: 'Old Timer',
      text: "Suit yourself.",
      responses: [],
      isEnd: true,
    },
  },
};

// ========================================
// GUARD GENERIC DIALOGUE (Confrontation)
// ========================================

export const guardGenericDialogue: DialogueTree = {
  id: 'guard_generic',
  startNode: 'confrontation_restricted',
  nodes: {
    confrontation_restricted: {
      id: 'confrontation_restricted',
      speaker: 'Guard',
      text: "Hey! What are you doing here? This area is off-limits to inmates.",
      responses: [
        {
          text: "I got lost, officer.",
          nextNode: 'excuse_lost',
        },
        {
          text: "I was just looking for the bathroom.",
          nextNode: 'excuse_bathroom',
        },
        {
          text: "Sorry, I'll leave.",
          nextNode: 'comply',
        },
      ],
    },

    excuse_lost: {
      id: 'excuse_lost',
      speaker: 'Guard',
      text: "Lost? You've been here long enough to know your way around. Get back to your cell. Now.",
      responses: [
        {
          text: "Yes, officer.",
          nextNode: 'warning',
        },
      ],
    },

    excuse_bathroom: {
      id: 'excuse_bathroom',
      speaker: 'Guard',
      text: "The bathrooms are in your cell, inmate. Don't play dumb with me. Back to your cell.",
      responses: [
        {
          text: "Yes, officer.",
          nextNode: 'warning',
        },
      ],
    },

    comply: {
      id: 'comply',
      speaker: 'Guard',
      text: "Yeah, you better be sorry. I'll be watching you.",
      responses: [],
      isEnd: true,
    },

    warning: {
      id: 'warning',
      speaker: 'Guard',
      text: "I catch you out of bounds again, it's solitary. Understand?",
      responses: [
        {
          text: "Understood.",
          nextNode: 'end_warning',
        },
      ],
    },

    end_warning: {
      id: 'end_warning',
      speaker: 'Guard',
      text: "Move along.",
      responses: [],
      isEnd: true,
    },
  },
};

// ========================================
// DIALOGUE REGISTRY
// ========================================

export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  old_timer_main: oldTimerDialogue,
  guard_generic: guardGenericDialogue,
};

// Helper to get dialogue tree
export const getDialogueTree = (treeId: string): DialogueTree | null => {
  return DIALOGUE_TREES[treeId] || null;
};
