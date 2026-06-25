# Act 1 RPG Opening Slice

Branch: `feat/act1-opening-slice`

## Goal

Create the real beginning of Act 1 before the open world starts.

The slice should feel like an RPG opening, not just a shooter sandbox:

1. Wake up in a starship cabin.
2. Walk through the ship corridor.
3. Leave the ship under escort.
4. Registration guard stops the player and asks where they arrived from.
5. This opens character creation.
6. Player can answer questions or manually distribute points.
7. Player enters the colonial office.
8. Player can explore the office and find a loot room.
9. Loot room gives useful starter loot: money, Luger P08, 9mm ammo.
10. On the way out, colonial officer gives the first quest.
11. First quest: reach Fort Zarya and speak with Gerda.
12. Open world unlocks after accepting the officer quest.

## Current implementation

New extension:

```text
src/game/v3/core/engineAct1OpeningExtensions.js
```

Main wiring:

```text
src/game/v3/main.js
```

Cache key:

```text
act1_opening_1
```

## Controls

```text
F6 — restart opening slice
F3 — teleport to next opening objective
E — interact with guard / loot room / officer
J — journal includes opening status
I — inventory / character doll
```

## Smoke

```text
npm.cmd run dev:act1
open /v3p2_ww2_live.html?ww2=1&act1=1&opening=1
Start
intro panel appears
click “Встать с койки”
walk/F3 to ship hall
walk/F3 to guard
E at guard
pick origin
character creation opens
add points or answer questions
finish character
walk/F3 to loot room
E loot room
Luger P08 + pistol9 ammo + credits granted
walk/F3 to colonial officer
E at officer
accept Fort Zarya / Gerda quest
world opens through existing Act 1 route/open-world layer
J journal shows opening state
```

## Next after this slice

- Replace simple box locations with proper interior rooms.
- Add real doors/loading transitions between cabin, ship, landing yard, office, and open world.
- Improve character creation UI into a full RPG parchment/terminal screen.
- Persist chosen origin, stats and skills into save data.
- Add dialogue history and quest log categories.
- Make guard/officer full NPCs with animation states.
- Improve enemy locomotion and animation separately from this RPG opening slice.
