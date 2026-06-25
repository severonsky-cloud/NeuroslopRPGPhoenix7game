# Phoenix7 — следующий план разработки после v3M1

Дата: 2026-06-20

Документ фиксирует текущий штабной план разработки, чтобы Codex, Claude и человек не смешивали большие системы в один неуправляемый PR.

## 1. Текущее состояние проекта

### Канонический запуск

```text
START_GAME_V3L_WINDOWS.bat
http://localhost:8000/v3l.html
```

Совместимость:

```text
http://localhost:8000/v3k.html
```

Правило: новые игровые изменения идут через модульную линию `src/game/v3/` и проверяются через `v3l.html`. Старые HTML-сборки остаются справочными прототипами.

### Уже в main

#### v3L — визуальная и боевая основа

В main уже есть:

- first-person hands;
- procedural weapon viewmodels;
- aim/reload/melee pose hooks;
- player body, visible legs, contact shadow, F8 debug third-person;
- visual atmosphere: sky, haze, fog, roadside dressing;
- локальный Three.js runtime;
- Vite build;
- совместимые `v3l.html` и `v3k.html`.

#### v3M1 — дорога, поселения и карта

В main уже есть большой слой мира между Port Rachel и Fort Zarya:

- длинная дорога Port Rachel → Fort Zarya;
- восемь data-driven поселений;
- NPC-группы у поселений;
- караваны и патрули;
- settlement props;
- карта с zoom/pan и LOD подписей;
- диагностика settlement layer.

Список поселений:

1. Бен-Хао — рыбацкая община.
2. Пост Ришелье — имперская пошлина / checkpoint.
3. Артель Ланг-До — лагерь красной глины.
4. Тау-Верона — караван-сарай.
5. Нам-Хоа — фермерская община.
6. Реле «Тесла-6» — заброшенная станция связи.
7. Чи-Кассини — фазовый лагерь наблюдения.
8. Бивак Арколь — передовой военный привал перед Fort Zarya.

## 2. Открытые PR и порядок интеграции

### PR #4 — v3M2A Character Creation

Статус: открыт, draft, mergeable.

Содержит:

- четыре шага создания персонажа;
- имя, race/gender, background, цвета, рост;
- один активный character profile в localStorage;
- восемь playable races;
- восемь backgrounds;
- стартовые инвентари и loadouts;
- race-specific body/hands;
- Q abilities;
- ограничения: недоступное оружие нельзя взять цифровыми клавишами.

Почему это важно:

- меняет старт игры;
- меняет inventory/loadout;
- меняет player body/hands;
- меняет combat feel indirectly через starting weapons и racial abilities.

Решение: PR #4 проверять и интегрировать первым, до PR #5 и до новых world-state задач.

### PR #5 — v3N1 Living World: день-ночь и распорядок

Статус: открыт, not draft, mergeable.

Содержит:

- cycle day-night;
- `worldClock`;
- HUD-часы;
- клавиша `T` для ускорения времени;
- луна и звёзды;
- жители поселений работают днём и отдыхают ночью;
- события времени суток в журнале.

Почему не мержить первым:

- PR #4 меняет старт игры и `main.js`;
- PR #5 тоже меняет `main.js` и `life.js`;
- проще сначала влить Character Creation, затем rebase/update PR #5.

Решение: PR #5 интегрировать после PR #4, отдельным небольшим pass.

## 3. Ближайший порядок работ

### Шаг A — Review PR #4 Character Creation

Цель:
убедиться, что новый character creator не ломает текущий v3M1-мир.

Проверить:

- `npm.cmd run build`;
- `v3l.html` стартует без профиля;
- четыре шага creator работают;
- 8 рас работают;
- 8 backgrounds работают;
- стартовый инвентарь выдается правильно;
- цифровые клавиши не достают оружие, которого нет у персонажа;
- race-specific hands/body не ломают Bren aim, reload, melee, phase hand;
- Q ability не конфликтует с Z/X/C/F;
- inventory/map/journal открываются;
- F8 third-person body работает;
- `v3k.html` still starts;
- консоль чистая.

Если PR #4 проходит smoke test — можно merge.

### Шаг B — Rebase / update PR #5 Day-Night после PR #4

Цель:
поставить day-night поверх Character Creation, не ломая creator и settlement layer.

Проверить:

- конфликт по `main.js` imports/install order;
- конфликт по `life.js` residents/schedules;
- `T` time scale;
- HUD clock;
- night/day visual transition;
- residents working/resting;
- journal time events;
- map/journal/dialogue;
- compatibility with new character profile.

Если PR #5 проходит smoke test — можно merge.

### Шаг C — v3M2B World State Boundary

Это следующий обязательный архитектурный слой до строительства Fort Zarya.

Цель:
создать минимальный контейнер состояния мира без полноценного save всей игры.

Нужно подготовить:

- `worldState.js`;
- versioned world state object;
- act number;
- fort construction state;
- fort damage state;
- supply state placeholders;
- convoy placeholders;
- time-of-day placeholder, если PR #5 уже в main;
- safe diagnostics;
- migration boundary for future save.

Важно:
это не полноценный save/load и не квестовая система. Это место, куда будущие systems смогут писать состояние.

Предложенные файлы:

```text
src/game/v3/world/worldState.js
src/game/v3/core/engineWorldStateExtensions.js
docs/PHOENIX7_V3M2B_WORLD_STATE_RU.md
```

Smoke test:

- новый мир создаёт default worldState;
- character profile не затирается;
- settlement layer читает мир как раньше;
- day-night, если уже смержен, не конфликтует;
- diagnostics доступны через `PHX_V3_ENGINE.getWorldStateDiagnostics()`.

### Шаг D — v3M2C Fort Zarya Construction by Acts

Делать только после v3M2B.

Цель:
Fort Zarya строится по актам, рабочие строят новые здания, жужеры во время атак пытаются повреждать постройки.

Стадии:

#### Act 1 — маленький аванпост

- палатки;
- временный склад;
- слабая стена;
- несколько рабочих;
- мало солдат;
- один базовый торговец.

#### Act 2 — первые настоящие укрепления

- ворота;
- первые стены;
- казарма;
- склад припасов;
- больше рабочих;
- больше патрулей.

#### Act 3 — рабочий форт

- мастерская;
- медпункт;
- торговый двор;
- ремонтная зона;
- внутренняя площадь.

#### Act 4 — техника и военная инфраструктура

- vehicle yard;
- техническая площадка;
- укреплённые углы;
- запасные части;
- инженерные NPC;
- техника чаще появляется при хорошем supply.

#### Act 5 — форт-городок

- двойные стены;
- внутренний двор;
- несколько магазинов;
- сильная оборона;
- большой склад;
- полноценная строительная зона.

Предложенные файлы:

```text
src/game/v3/data/fortZaryaConstructionData.js
src/game/v3/world/fortZaryaConstruction.js
src/game/v3/core/engineFortConstructionExtensions.js
docs/PHOENIX7_V3M2C_FORT_CONSTRUCTION_RU.md
```

Интеграция:

- читать/писать состояние через `worldState`;
- не ломать существующий Fort Encounter;
- жужеры выбирают target buildings;
- здания имеют states: planned, under_construction, complete, damaged, destroyed, repairing.

### Шаг E — v3M3 Port Rachel Supply Convoys

Делать после v3M2C или после минимального Fort state.

Цель:
Port Rachel принимает звездолёты, из порта выходят конвои, Fort Zarya получает или теряет снабжение.

Ресурсы:

- food;
- ammo;
- medicine;
- fuel;
- building_materials;
- spare_parts;
- weapons;
- armor.

Supply levels:

- critical;
- low;
- normal;
- stocked;
- surplus.

Влияние на Fort Zarya:

- магазины;
- боеприпасы;
- солдатское снаряжение;
- техника;
- скорость строительства;
- скорость ремонта.

Предложенные файлы:

```text
src/game/v3/data/supplyData.js
src/game/v3/world/portRachelTraffic.js
src/game/v3/world/supplyConvoys.js
src/game/v3/core/engineSupplyExtensions.js
docs/PHOENIX7_V3M3_SUPPLY_CONVOYS_RU.md
```

Важное ограничение:
на первом pass можно делать simulated convoy с progress 0…1, без сложного pathfinding. Визуальный конвой показывать только рядом с дорогой, а системные события писать в journal/world log.

### Шаг F — v3M4 Shops, Soldiers and Vehicles react to Supply

Делать после v3M3.

Цель:
состояние supply реально меняет игру, а не просто лежит в diagnostics.

Примеры эффектов:

- low ammo → мало патронов у торговцев;
- stocked ammo → больше ammo в магазинах;
- weapons/armor → лучше loadouts у soldiers;
- fuel/spare_parts → техника чаще появляется и быстрее чинится;
- medicine → гарнизон быстрее восстанавливается;
- building_materials → строительство и ремонт быстрее.

### Шаг G — v3M5 First Quest Consequences

Делать после того, как worldState и supply уже существуют.

Цель:
первые квестовые последствия, которые меняют мир.

Примеры:

- помочь Бен-Хао → больше еды/воды для конвоя;
- договориться на Посту Ришелье → меньше задержек конвоев;
- помочь Ланг-До → больше building_materials;
- стабилизировать Чи-Кассини → безопаснее phase route;
- очистить Тесла-6 → быстрее связь между Port Rachel и Fort Zarya;
- защитить Арколь → лучше военный escort.

## 4. Что нельзя смешивать в одном PR

Нельзя смешивать:

- character creation + day-night + fort construction;
- fort construction + supply economy + shops + quests;
- worldState + полноценный save/load всей игры;
- visual polish + изменение баланса боя;
- settlement map + Fort Encounter rewrite;
- race passives + NPC faction diplomacy;
- convoy visuals + complex pathfinding.

Правило:
один PR = одна система + документация + smoke test.

## 5. Роли Codex и Claude

### Codex

Давать Codex задачи, где нужен код:

- маленький bugfix;
- реализация конкретной системы;
- интеграция extension;
- diagnostics;
- build fixes;
- smoke checklist.

Формат задания Codex:

```text
branch
files to touch
files not to touch
exact goal
debug controls
smoke test
final report format
```

### Claude

Давать Claude задачи, где нужно мышление и дизайн:

- system design;
- narrative bible;
- balancing table;
- data schema;
- quest consequences;
- ревью конфликтов между системами;
- формулировка PR plan для Codex.

Claude не должен без необходимости переписывать runtime-код, если задача — дизайн.

## 6. Smoke test baseline для всех будущих PR

Каждый PR должен проверять минимум:

```text
npm.cmd run build
START_GAME_V3L_WINDOWS.bat
http://localhost:8000/v3l.html
Start / Character Creation if active
weapon switch 1–7
Bren V aim
R reload
melee attack
phase hand
inventory I
character K
phase P
journal J
map M
F8 third-person body
F9/F10/F11 quality
v3k.html still starts
browser console clean
```

Для world PR дополнительно:

```text
F2 settlement teleport if available
map labels
settlement NPCs
caravans/patrols
Fort Zarya coordinates unchanged unless task says otherwise
```

Для Fort PR дополнительно:

```text
switch fort act
building states
damage state
repair state
Fort Encounter still works
```

Для supply PR дополнительно:

```text
spawn starship arrival
spawn convoy
advance convoy progress
Fort supply state changes
shop/soldier/vehicle diagnostics
```

## 7. Самый ближайший план решений

1. Провести ревью PR #4 v3M2A Character Creation.
2. Если PR #4 проходит smoke — merge.
3. Обновить PR #5 v3N1 Day-Night поверх нового main.
4. Если PR #5 проходит smoke — merge.
5. Создать v3M2B World State Boundary.
6. Только потом делать Fort Zarya Construction by Acts.
7. Потом Port Rachel Supply Convoys.
8. Потом shops/soldiers/vehicles react to supply.
9. Потом первые quest consequences.

## 8. Следующий prompt для Codex

Следующая задача Codex после этого roadmap:

```text
Review PR #4 v3M2A Character Creation before merge.
Do not add new features.
Check creator flow, race/gender/background combinations, starting inventory, Q abilities, weapon restrictions, body/hands compatibility, V3L/V3K launch, build, console.
Return: merge/no-merge verdict and exact fixes if needed.
```

## 9. Следующий prompt для Claude

Следующая задача Claude после PR #4:

```text
Rebase/review PR #5 v3N1 Day-Night after Character Creation merge.
Focus on integration order, worldClock with character profile, life.js schedule compatibility, map/journal/dialogue regressions, and whether day-night should affect future Fort/supply systems.
```

## 10. Главная цель текущего этапа

Сейчас цель не в том, чтобы добавить максимум систем. Цель — сделать так, чтобы Phoenix7 стал настоящей RPG-основой:

```text
созданный персонаж
живой тракт между поселениями
далёкий Fort Zarya
время суток
мир, который помнит состояние
форт, который строится и ломается
снабжение, которое реально влияет на игру
квесты, которые меняют карту
```

Если придерживаться этого порядка, проект будет расти как RPG, а не как набор несвязанных демо.
