# Phoenix7 v3 — статус архитектурного билда

## Новый запуск

Старый рабочий билд сохранён:

```text
game.html
```

Новый архитектурный билд:

```text
game_v3.html
```

Запуск сервера остаётся прежним:

```text
START_GAME_WINDOWS.bat
```

После запуска открыть:

```text
http://localhost:8000/game_v3.html
```

## Что создано

```text
game_v3.html
src/game/v3/main.js
src/game/v3/core/engine.js
src/game/v3/core/input.js
src/game/v3/core/save.js
src/game/v3/world/terrain.js
src/game/v3/world/chunks.js
src/game/v3/world/props.js
src/game/v3/entities/player.js
src/game/v3/entities/npc.js
src/game/v3/entities/monster.js
src/game/v3/combat/weapons.js
src/game/v3/combat/combat.js
src/game/v3/ui/hud.js
src/game/v3/ui/map.js
src/game/v3/data/worldData.js
```

## Что уже работает в v3

- отдельный HTML launcher;
- модульный runtime;
- terrain module;
- world data module;
- player module;
- input module;
- HUD module;
- map panel;
- NPC module;
- monster module;
- combat module;
- weapon data module;
- InstancedMesh для части мира;
- old 2.5I не сломан и остаётся backup.

## Почему это важно

В 2.5I всё было в одном огромном `main.js`. Добавлять туда новый живой мир становилось опасно:

- тормоза;
- сложно чинить баги;
- нельзя нормально расширять;
- монстры/NPC/биомы/оружие мешались друг с другом.

v3 разбивает игру на системы.

## Следующий шаг

v3.0A ещё не финальный контентный билд. Это архитектурный каркас.

Дальше нужно по порядку:

1. довести запуск `game_v3.html` до стабильного playable state;
2. подключить quality presets;
3. расширить chunk loader;
4. перенести лучший визуал 2.5I;
5. перенести квестовый Act 1 loop;
6. добавить расписания NPC;
7. добавить оптимизированные биомные landmark-и;
8. затем уже делать v3.0B Art Direction Pass.
