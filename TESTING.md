# Phase 1 Testing Checklist

## How to Run
```bash
npm run dev
```
Then open http://localhost:3003 (or the port shown in terminal)

## Success Criteria

### Test 1: Basic Display
- [ ] See a gray room with dark walls
- [ ] See furniture shapes (bed top-left, desk left-side, toilet/sink right-side)
- [ ] See metal door bars at the bottom center
- [ ] See blue player circle in the center area
- [ ] See white directional indicator on player

### Test 2: Movement Works
- [ ] Press RIGHT arrow → player smoothly moves right one tile
- [ ] Press UP arrow → player smoothly moves up one tile
- [ ] Press LEFT arrow → player smoothly moves left one tile
- [ ] Press DOWN arrow → player smoothly moves down one tile
- [ ] Try WASD keys → same smooth movement
- [ ] Movement is smooth animation, not instant teleportation

### Test 3: Collision Detection
- [ ] Walk toward any wall → player stops at wall, cannot pass through
- [ ] Walk toward bed (top-left) → player stops, cannot pass through
- [ ] Walk toward desk (left side) → player stops, cannot pass through
- [ ] Walk toward toilet → player stops, cannot pass through
- [ ] Walk toward sink → player stops, cannot pass through
- [ ] Walk toward door bars → player stops, cannot pass through
- [ ] Player can walk on all gray floor tiles

### Test 4: Input Feel
- [ ] Tap arrow key → player moves exactly one tile
- [ ] Hold arrow key → player keeps moving tile by tile
- [ ] Release key → player stops after completing current tile movement
- [ ] No noticeable input delay or lag
- [ ] Direction indicator points in the direction of last movement

### Test 5: Technical Health
- [ ] Debug overlay shows in top-left (FPS, position, direction)
- [ ] FPS stays at or near 60
- [ ] Grid lines visible (helps verify collision)
- [ ] No browser console errors
- [ ] Canvas is centered on page with title and instructions

## Expected Behavior

**Grid System**: The entire game operates on a 10x8 tile grid. Each tile is 32x32 pixels.

**Movement Speed**: Moving from one tile to the next takes approximately 180ms (smooth interpolation).

**Collision**: When you press a direction key:
- If the target tile is walkable (floor), player moves there
- If the target tile is blocked (wall/furniture), player turns to face that direction but doesn't move

**Debug Mode**: Currently enabled by default. Shows:
- Current FPS
- Grid position (which tile player is on)
- Pixel position (exact x,y coordinates)
- Movement state (moving/not moving)
- Current direction

## Known Limitations (Phase 1)

These are intentionally NOT implemented yet:

- No pixel art sprites (using colored rectangles)
- No door opening/interaction
- No items or inventory
- No NPCs
- No sound effects
- No additional rooms
- No save/load
- No pause menu (just refresh to restart)

Phase 1 is solely focused on: **Can you walk around the cell without walking through walls?**

If the answer is YES, Phase 1 is complete.
