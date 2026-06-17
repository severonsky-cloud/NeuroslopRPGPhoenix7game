# Phoenix7 2.0T — Arsenal World

## Files

```text
src/phoenix_arsenal.js
act1_arsenal_world.html
```

## Goal

Add the requested early arsenal while keeping the content as abstract RPG game mechanics.

## Weapon slots

```text
1 — Кулаки
2 — Фазовый удар рукой
3 — Бастард
4 — Шпага
5 — Кольт 1917
6 — M1 Гаранд
7 — Пулемёт Брен
```

## Phase strike

The phase strike is no longer a distant fireball.

It is a short-range hand attack:

```text
range: short
cost: stamina + phase
role: close combat burst
visual: glowing hands
```

## Ammo / supplies

The game tracks abstract supplies:

```text
sidearmSupply — боезапас к Кольту 1917
rifleSupply — боезапас к M1 Гаранд
supportSupply — боезапас к Брену
```

## Enemy loot

Enemies roll different loot tables:

- road_mutant;
- sandy_carrion;
- red_rat;
- phase_echo.

Loot can include:

- different supplies;
- credits;
- road token;
- canal tag;
- phase residue.

## Launch

```bash
py -m http.server 8000
```

Open:

```text
http://localhost:8000/act1_arsenal_world.html
```

## Next step

2.0U should merge this arsenal with the better Asset Director flow:

- keep 2.0R startup;
- use 2.0T weapon data;
- add attack sounds;
- add basic equipment slots;
- add weapon pickup/loot UI;
- connect arsenal to Act 1 quest rewards.
