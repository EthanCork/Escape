# Interaction System Quick Reference

## Player Controls

### Movement
- **Arrow Keys** or **WASD**: Move in four directions
- Movement disabled while menu is open or text is displayed

### Interaction
- **E** or **Space**: Open interaction menu (when near object)
- **E** or **Space** or **Enter**: Confirm menu selection
- **Escape**: Close menu without action
- **Arrow Up/Down**: Navigate menu options
- **Any Key**: Dismiss text display

## How Interactions Work

### 1. Approach an Object
Walk adjacent to any interactive object (furniture, doors, etc.)
- Yellow outline appears on the object
- Text prompt shows: "Press E to interact with [Object Name]"

### 2. Open Context Menu
Press **E** to open the interaction menu
- Menu shows available actions
- First available action is pre-selected
- Unavailable actions are grayed out

### 3. Select an Action
Use **Arrow Up/Down** to highlight different actions
Press **E** to execute the selected action

### 4. Read the Result
Text box appears with the action result
Press **E** or any key to dismiss

## Action Types

### Examine
- **Always available** on all interactive objects
- Shows a description of the object
- May contain hints about other actions or hidden items

### Search
- Available on searchable objects (beds, desks, etc.)
- First search may find hidden items
- Subsequent searches show "nothing else" message
- Items are marked as found (for future inventory)

### Use
- Available on usable objects (toilet, sink, etc.)
- Performs the object's primary function
- Usually just flavor text in Phase 3

### Open/Close
- Available on containers and doors (future phases)
- Toggles open/closed state
- May be locked

### Unlock
- Shown but grayed out (no inventory yet)
- Will require correct key in Phase 4

### Take
- Not yet available (inventory in Phase 4)
- Structure in place for future use

## Interactive Objects by Room

### Cell C-14 (Your Cell)

**Bed** (2x2 tiles)
- Actions: Examine, Search
- Hidden item: Sharpened Spoon
- Tip: Search the mattress thoroughly

**Desk** (2x1 tiles)
- Actions: Examine, Search
- Hidden item: The Count of Monte Cristo (book)
- Tip: Check the drawer

**Toilet** (1x1 tile)
- Actions: Examine, Use
- Use: Flavor text only
- No hidden items

**Sink** (1x1 tile)
- Actions: Examine, Use
- Use: Splash water to focus
- No hidden items

**Cell Door** (2x1 tiles)
- Actions: Examine only
- Door is controlled by guards
- Walking through it triggers room transition

### Corridor B

**Other Cell Doors** (C-11, C-12, C-13, C-15, C-16)
- Actions: Examine only
- Locked, can see prisoners inside
- No interaction possible

**Your Cell Door** (from outside)
- Actions: Examine only
- Different description than from inside
- Walking through returns to cell

**Guard Station Door** (2x1 tiles)
- Actions: Examine only
- Can see inside through window
- Walking through enters guard station

### Guard Station B

**Guard Desk** (2x2 tiles)
- Actions: Examine, Search
- Hidden item: Guard Schedule (document)
- Tip: Rifle through the papers

**Office Chair** (1x1 tile)
- Actions: Examine only
- Worn and molded to guard's shape
- No hidden items

**Weapon Locker** (2x1 tiles)
- Actions: Examine only
- Locked tight
- Will need key or tools (future)

## Tips for Exploration

1. **Examine everything** - Descriptions contain hints
2. **Search searchable objects** - Find items for later use
3. **Objects remember state** - Can't search same place twice
4. **Items are tracked** - Found items saved for Phase 4
5. **Pay attention to descriptions** - They build the story

## Visual Indicators

### Yellow Outline
- Object is targeted
- You're adjacent and can interact
- Press E to open menu

### Context Menu
- Dark box with action list
- Yellow arrow shows selection
- Grayed text = action unavailable

### Text Display
- Semi-transparent screen overlay
- Dark box with metal frame border
- Yellow title (object name)
- White description text
- Gray "Press E" prompt at bottom

## Troubleshooting

**"Nothing happens when I press E"**
- Make sure you're adjacent to an object (within 1 tile)
- Look for yellow outline indicating targetable object
- Some tiles don't have interactive objects

**"Action is grayed out"**
- Action requires something you don't have yet
- Example: Unlock needs a key (not available in Phase 3)
- Examine should always be available

**"Menu won't close"**
- Press Escape to close without selecting
- Or select an action and dismiss the resulting text

**"I already searched this"**
- Objects remember if they've been searched
- Each searchable object can only yield items once
- This is intentional to prevent item duplication

## Development Notes

### Adding New Objects

To add a new interactive object:

1. Define object in [lib/game/interactiveObjects.ts](lib/game/interactiveObjects.ts)
2. Add to INTERACTIVE_OBJECTS registry
3. Ensure positions match room tile layout
4. Object automatically appears in game

Example:
```typescript
export const myObject: InteractiveObject = createObject(
  'my_object_id',
  'My Object Name',
  'room_id',
  [{ x: 5, y: 5 }], // Position(s)
  "Examine text goes here.",
  ['examine', 'search'], // Available actions
  {
    searchFindText: "Found something!",
    hiddenItem: {
      itemId: 'my_item',
      name: 'My Item',
      description: 'Item description',
    },
  }
);
```

### Modifying Actions

Action logic is in [lib/game/interactions.ts](lib/game/interactions.ts):
- `isActionAvailable()` - Determines if action can be used
- `executeAction()` - Performs the action and returns result
- Modify these functions to change action behavior

### State Management

Object states stored in Zustand store:
- Access via `useGameStore().interaction.objectStates`
- Persisted across room changes
- Could be saved to localStorage for save games

## Future Enhancements (Post-Phase 3)

These are NOT yet implemented:
- Inventory system to carry found items
- Using items on objects (e.g., key on lock)
- Combining items
- Taking items from world
- More complex action requirements
- Sound effects for actions
- Animations for searching/using
- NPCs with dialogue (use similar system)

## Code References

- **Object Definitions**: [lib/game/interactiveObjects.ts](lib/game/interactiveObjects.ts)
- **Interaction Logic**: [lib/game/interactions.ts](lib/game/interactions.ts)
- **Type Definitions**: [lib/game/types.ts](lib/game/types.ts)
- **State Management**: [lib/game/store.ts](lib/game/store.ts)
- **Input Handling**: [lib/game/input.ts](lib/game/input.ts)
- **Rendering**: [lib/game/renderer.ts](lib/game/renderer.ts)

---

**Happy exploring! Remember: every object has a story, and some hold secrets that could help you escape.**
