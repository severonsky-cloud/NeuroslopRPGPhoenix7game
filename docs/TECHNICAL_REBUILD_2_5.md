# Phoenix7 2.5 — Technical Rebuild Plan

## Purpose

Rebuild the main game around the actual vision:

```text
full 3D open-world RPG slice
coastal Port Rachel
road to Fort Zarya
edge of Dead Savannah
Morrowind + Medal of Honor + Phoenix7 cosmo-opera
```

## Main rule

Only one player-facing entry:

```text
game.html
```

## Do not repeat previous mistake

Do not build another empty raw WebGL horizon.

The first playable camera view must already contain:

- ocean;
- ground;
- Port Rachel silhouettes;
- at least one building with a door;
- at least one NPC marker;
- route direction.

## Recommended implementation approach

Use Three.js if possible, but keep the player-facing file stable.

Suggested structure:

```text
game.html
src/game/main.js
src/game/world.js
src/game/player.js
src/game/npc.js
src/game/quests.js
src/game/combat.js
src/game/ui.js
src/game/data.js
```

If CDN is used, `game.html` must show a clear error if Three.js does not load.

Do not silently replace the game with 2D.

## Stage A — Clean 3D Boot

Files:

```text
game.html
src/game/main.js
```

Must show:

- sky;
- ocean plane;
- red clay ground;
- camera at Port Rachel coast;
- simple first-person movement;
- HUD.

Do not add quests yet.

## Stage B — Coast and Port Rachel

Add:

- ocean shoreline;
- red clay beach;
- port road;
- pier / masts / silhouettes;
- customs house with a real doorway;
- market blocks;
- Red Node blockout.

Definition:

```text
A screenshot already reads as Phoenix7 coastal port.
```

## Stage C — Doors and interiors

Add actual walkable interiors for:

- customs;
- Oran office;
- Gerda house.

Rules:

- collision walls only;
- doors passable;
- NPC not inside wall;
- enough room to approach and interact.

## Stage D — Fort Zarya road

Add:

- road from Port Rachel to Fort Zarya;
- old beacon / road shelter;
- Fort Zarya gate silhouette;
- Oran office.

Definition:

```text
Player can walk from Port Rachel to Fort Zarya.
```

## Stage E — Dead Savannah edge

Add:

- visible transition from coastal wet red clay to dry dead savanna;
- guide camp;
- far dead trees / dust wall / red haze.

This is the first promise of Act 2.

## Stage F — NPC and Act 1

Add NPCs:

- Rina;
- Oran Tiv;
- Gerda;
- wandering knight;
- merchant;
- smuggler;
- Sava.

Add Act 1 flow:

```text
Rina
→ road shelter
→ Oran
→ Gerda
→ 4 preparations
→ Sava
```

## Stage G — Hands and combat

Add visible first-person hands and arsenal:

```text
1 fists
2 phase strike
3 bastard
4 rapier
5 Colt 1917
6 M1 Garand
7 Bren
```

Combat must be slow RPG/travel combat, not arena shooter.

## Stage H — Living world

Add:

- walking NPCs;
- patrols;
- caravan or moving silhouettes;
- ambient motion;
- simple day/fog cycle;
- distant ships/masts.

## Stage I — Visual polish

Bring closer to Claude build:

- warmer color grading;
- low-poly silhouettes;
- fog;
- film grain;
- scanlines;
- dirty UI;
- signs;
- distinctive building colors;
- ocean reflections if cheap.

## Milestone labels

Suggested tags:

```text
2.5A_clean_boot
2.5B_coast_port
2.5C_doors_interiors
2.5D_fort_road
2.5E_savanna_edge
2.5F_act1_npc
2.5G_hands_combat
2.5H_living_world
2.5I_visual_polish
```

## Acceptance test for 2.5

A new user should be able to:

1. Open `game.html`.
2. Start game.
3. See ocean coast and Port Rachel.
4. Walk into customs.
5. Talk to Rina.
6. Walk to Fort Zarya.
7. Talk to Oran.
8. Find Gerda.
9. Complete at least two preparations.
10. Fight and loot one enemy.
11. Understand that Dead Savannah is the next destination.

No other HTML file should be required.
