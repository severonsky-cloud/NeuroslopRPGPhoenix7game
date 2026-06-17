# Phoenix7 2.5.1 — Implementation Tasks for Codex

## Current canonical launch

```text
http://localhost:8000/game.html
```

Do not treat `act1_*.html` files as the main game. They are donors/labs only.

## Mission

Bring `game.html` closer to a real 2.5 vertical slice.

The player should be able to test the game without opening any other HTML.

## Priority 1 — Stabilize game.html

### Task 1: runtime safety

- Keep `game.html` self-contained for now.
- Do not add CDN imports back into `game.html` until startup is stable.
- Keep visible JS error overlay.
- Keep save/load working through localStorage.

### Task 2: validate main controls

Check:

```text
WASD
Shift
mouse / arrows
E
Space / LMB
R
1-7
J
I
Q
F1
Esc
```

Fix anything that does not respond.

## Priority 2 — Doors and interiors

The main issue reported by the user: NPCs inside buildings must be reachable.

### Required interiors

- Customs / Rina.
- Oran office / Oran Tiv.
- Gerda house / Gerda.
- Market / merchant.
- Red Node / smuggler.
- Guide camp / Sava.

### Rules

- Buildings may have collision walls.
- Doors must remain passable.
- NPC must not spawn inside wall cells.
- Player must be able to walk to each NPC without F1.

## Priority 3 — Quest clarity

Add clearer guidance directly in game UI.

### Suggested additions

- Current objective text.
- Next target name.
- Distance to next target.
- Simple compass arrow or minimap ping.

Do not overcomplicate. Keep readable.

## Priority 4 — Hands and arsenal polish

Current weapons:

```text
1 fists
2 phase strike
3 bastard
4 rapier
5 Colt 1917
6 M1 Garand
7 Bren
```

### Required fixes

- Phase strike must remain a short-range hand attack.
- Bastard and rapier should look visually different.
- Gun silhouettes should look different enough in HUD/hands.
- Ammo UI must clearly show remaining supply.
- No real-world weapon handling instructions.

## Priority 5 — Loot and rewards

- Enemy death should clearly switch enemy into lootable state.
- `E` should loot nearby defeated enemy.
- Loot result should appear in toast and journal.
- Gerda reward should trigger only after 4/4 preparations.

## Priority 6 — Audio later, not before stability

Do not wire complex audio until `game.html` startup is stable.

When ready:

- UI click fallback.
- Attack sound fallback.
- Phase strike fallback.
- Quest update fallback.

All audio must fail silently if blocked.

## Definition of Done for this pass

```text
1. game.html opens.
2. Quick Start enters the world.
3. Player can reach Rina, Oran, Gerda without teleport.
4. Player can switch all 7 weapon modes.
5. Player can kill and loot at least one enemy.
6. Player can complete at least 2/4 Gerda tasks.
7. No other HTML file is required for gameplay testing.
```
