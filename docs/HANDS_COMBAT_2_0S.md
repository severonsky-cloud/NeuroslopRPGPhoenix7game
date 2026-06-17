# Phoenix7 2.0S — Hands + Phase Combat World

## File

```text
act1_hands_world.html
```

## Goal

Make the player feel physically present in the world.

The player now has visible first-person hands attached to the camera.

## Combat modes

```text
1 — fists
2 — blade
3 — phase magic
R — block / phase focus
Left mouse / Space — attack
```

## What is implemented

- First-person hands attached to camera.
- Race-colored hands.
- Fist mode.
- Blade mode with visible simple weapon.
- Phase mode with glowing hands/orb.
- Phase projectile.
- Basic melee range differences:
  - fists: short range;
  - blade: longer reach;
  - phase: ranged projectile.
- Enemies react to the player.
- Blocking/focusing with `R` reduces incoming damage.
- NPCs introduced in world:
  - Rina;
  - Oran Tiv;
  - Gerda Geigermanica;
  - wandering knight;
  - green order trace;
  - blue order trace;
  - merchant;
  - smuggler;
  - guide.

## Act 1 structure preserved

The build keeps the Act 1 preparation structure:

- road/shelter;
- market;
- factions;
- contraband;
- guide/camp.

## Launch

```bash
py -m http.server 8000
```

Open:

```text
http://localhost:8000/act1_hands_world.html
```

## Current limitations

- Hands are procedural primitives, not final meshes.
- The blade is a placeholder.
- Phase magic is a simple projectile.
- This is a standalone hands/combat candidate, not yet merged into `act1_loop.html`.

## Next step

2.0T should merge the hands/combat layer with the Asset Director:

- use PhoenixModels for player arms/weapon later;
- use PhoenixAudio for attack/phase sounds;
- add basic weapon/item slots;
- make NPCs use model layer;
- keep fallback if assets are missing.
