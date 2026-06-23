# Phoenix7 v3N3 — пакет встраивания в билд

## Статус

Этот пакет готовит текущий результат к нормальному встраиванию в playable build.

Текущий канон запуска:

```text
00_START_HERE_CURRENT_BUILD_WINDOWS.bat
START_GAME_V3L_WINDOWS.bat
http://localhost:8000/v3l.html
src/game/v3/
```

Стартовый экран должен показывать:

```text
Phoenix7 v3N3
```

HUD должен показывать:

```text
v3N3 · improved NPC models
```

## Что входит

### 1. Living Ecosystem

Файлы:

```text
src/game/v3/data/lifeData.js
src/game/v3/world/life.js
```

Содержимое:

- расширенные фракции и товары;
- экономика поселений;
- караваны с cargo / credits / origin / destination / tradeState;
- патрули Империи;
- красные общины;
- бандитские и жужжерские угрозы;
- торговый цикл каравана;
- засады рядом с игроком;
- награда за спасение каравана;
- простые события Орденов;
- фазовая помощь производству.

Важно: засадники создаются через `createMonster`, поэтому текущая система оружия, баллистики и фазовых атак должна работать по ним.

### 2. Procedural Life NPC Visuals

Файл:

```text
src/game/v3/world/lifeVisuals.js
```

Содержимое:

- имперские шлемы, винтовки и знамёна;
- груз и флаги на караванах;
- красные элементальные детали у крестьян;
- бандитские капюшоны и ножи;
- жужжерские усики, панцири и лапы;
- рыцарские щиты, мечи и знаки Орденов;
- фазовые кольца и орбы;
- визуальные детали путешественников, царборцев и элементалей.

Это overlay поверх старой capsule-модели, без внешних ассетов.

### 3. Procedural Story NPC Visuals

Файл:

```text
src/game/v3/world/storyNpcVisuals.js
```

Содержимое:

- Рина — форма, документы, служебные детали;
- торговец — глина, мешки, бумаги;
- крестьянин-глиняник — инструменты и красная глина;
- Оран — бумаги и канцелярский образ;
- Герда — более читаемый синий силуэт;
- Сава — проводник с посохом и картой;
- контрабандист — тёмный силуэт и мешок;
- разведчик царборцев — саженец и лесные детали;
- стеклянный монах — стеклянный нимб/осколки;
- смотритель шельфа — ледяной капюшон/снаряжение;
- караванщик — походные вещи.

### 4. Build manifest

Файл:

```text
src/game/v3/buildInfo.js
```

Runtime export:

```js
PHX_V3_ENGINE.getBuildInfo()
window.PHX_V3_BUILD
```

Manifest перечисляет:

- ID билда;
- entrypoint;
- launchers;
- runtime path;
- список фич;
- integration files;
- browser checks;
- build commands;
- known limitations.

### 5. Smoke test

Файл:

```text
tools/v3n3_integration_smoke.mjs
```

Команда:

```bash
npm run test:v3n3
```

Проверяет наличие ключевых файлов и маркеров:

- `Phoenix7 v3N3` в `v3l.html`;
- актуальный cache key;
- `PHOENIX_BUILD_INFO`;
- `upgradeLivingWorldVisuals`;
- `upgradeStoryNpcVisuals`;
- `getBuildInfo`;
- `listLifeVisuals`;
- `listStoryNpcVisuals`;
- `forceNearestCaravanAmbush`;
- `spawnCaravanAmbush`;
- `rewardCaravanDefense`;
- visualTier-маркеры.

## Команды интеграции

Перед сборкой:

```bash
npm install
npm run test:v3n3
npm run build
```

Локальная проверка после сборки:

```bash
npm run preview
```

Обычная ручная проверка без production build:

```text
00_START_HERE_CURRENT_BUILD_WINDOWS.bat
Ctrl+F5 в браузере
```

## Browser debug checks

В консоли браузера:

```js
PHX_V3_ENGINE.getBuildInfo()
PHX_V3_ENGINE.getLivingWorldDiagnostics()
PHX_V3_ENGINE.listCaravans()
PHX_V3_ENGINE.listLifeVisuals()
PHX_V3_ENGINE.listStoryNpcVisuals()
PHX_V3_ENGINE.forceNearestCaravanAmbush('bandits')
PHX_V3_ENGINE.forceNearestCaravanAmbush('zhuzher')
```

Ожидаемые признаки:

```text
getBuildInfo().id === 'phoenix7-v3n3-living-ecosystem-npc-visuals'
listLifeVisuals() показывает visualTier: v3N3_procedural_life_model у части/большинства life agents
listStoryNpcVisuals() показывает visualTier: v3N3_story_npc_model у сюжетных NPC
forceNearestCaravanAmbush('bandits') создаёт врагов рядом с ближайшим караваном
forceNearestCaravanAmbush('zhuzher') создаёт Жужжер рядом с ближайшим караваном
```

## Ручной playtest checklist

1. Запустить `00_START_HERE_CURRENT_BUILD_WINDOWS.bat`.
2. Нажать `Ctrl+F5`.
3. Убедиться, что стартовый экран показывает `Phoenix7 v3N3`.
4. Создать/запустить персонажа.
5. Нажать `J` и проверить журнал.
6. Нажать `F1` до Порта Рейчел.
7. Осмотреть Рину, торговца, крестьянина и караванщика.
8. Нажать `F1` до Красной дороги.
9. Осмотреть караваны, патрули, рыцарей, фазового мага.
10. Нажать `F1` до Форта Заря.
11. Осмотреть Орана, Герду, караульного, Орден Звука, Орден Системных Ошибок.
12. Через консоль вызвать `PHX_V3_ENGINE.forceNearestCaravanAmbush('bandits')`.
13. Убедиться, что враги появились и по ним работает оружие.
14. Убить врагов и проверить награду/журнал.
15. Повторить с `PHX_V3_ENGINE.forceNearestCaravanAmbush('zhuzher')`.
16. Проверить, что FPS не падает критически.

## Что НЕ входит в этот пакет

- полноценная авиация Жужжер;
- бипланы с хитбоксами;
- глобальная война фракций;
- полноценное сохранение состояния мира;
- импортированные skinned 3D assets;
- сложный faction-vs-faction combat AI.

Эти темы лучше вести отдельными проходами:

```text
v3N4 — Aerial Raids / shootable biplanes
v3N5 — faction combat AI and settlement raids
v3N6 — save serialization for living world
v3N7 — imported GLB character models / animation cleanup
```

## Файлы, которые нельзя случайно откатить

```text
v3l.html
src/game/v3/main.js
src/game/v3/buildInfo.js
src/game/v3/data/lifeData.js
src/game/v3/world/life.js
src/game/v3/world/lifeVisuals.js
src/game/v3/world/storyNpcVisuals.js
RUN_CURRENT_BUILD_RU.md
README.md
package.json
tools/v3n3_integration_smoke.mjs
```

## Решение о встраивании

Для включения в текущий билд достаточно оставить `v3l.html` основным entrypoint в `vite.config.js` и запускать сборку обычной командой:

```bash
npm run build
```

`vite.config.js` уже собирает `v3l.html`, поэтому отдельный новый HTML-entrypoint не нужен.
