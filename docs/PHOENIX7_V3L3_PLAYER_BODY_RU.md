# Phoenix7 v3L3 — базовая модель тела игрока

## Запуск

```text
START_GAME_V3K_WINDOWS.bat
http://localhost:8000/v3k.html
```

Если порт `8000` занят старым Phoenix-сервером, запустите отдельный launcher v3L3:

```text
START_GAME_V3L3_WINDOWS.bat
http://localhost:8033/v3k.html?v=30l3_player_body_1
```

Рабочая ветка:

```text
codex/v3l3-player-body-model
```

## Что добавлено

### Procedural low-poly тело

Новый модуль `src/game/v3/visuals/playerBody.js` создаёт модель только из примитивов Three.js:

- торс и таз;
- две анимированные ноги;
- отдельные сапоги;
- пояс и пряжка;
- широкий силуэт плеч и пальто;
- полы пальто;
- рюкзак и свёрток;
- две разгрузочные лямки;
- руки и голова для debug third-person;
- дополнительные когти, морда, гребень и хвост для рептилоидных профилей.

Внешние GLB/FBX не используются.

### First-person режим

В обычном режиме:

- верх тела скрыт;
- ноги и сапоги остаются видимыми при взгляде вниз;
- ноги разнесены по сторонам и не занимают центр экрана;
- weapon viewmodel остаётся дочерним объектом камеры;
- тело не вмешивается в reload, melee и firearm aim.

### Contact shadow

Под игроком создаётся процедурная мягкая shadow blob:

- является отдельным объектом под body root;
- следует за player rig и высотой рельефа;
- слегка меняет форму во время движения;
- не зависит от видимости верхней части тела.

### Debug third-person

`F8` переключает режим:

- `OFF` — обычная first-person camera, видны только ноги и тень;
- `ON` — камера отодвигается назад, становится видна полная модель.

Также режим можно переключить из консоли:

```js
PHX_V3_ENGINE.togglePlayerBodyDebug()
PHX_V3_ENGINE.togglePlayerBodyDebug(true)
PHX_V3_ENGINE.togglePlayerBodyDebug(false)
```

### Equipment anchors

Созданы точки:

- `backWeapon` / `player-anchor-back-weapon`;
- `beltWeapon` / `player-anchor-belt-weapon`;
- `utility` / `player-anchor-utility`.

Получение точки:

```js
PHX_V3_ENGINE.playerBody.getAnchor('backWeapon')
PHX_V3_ENGINE.playerBody.getAnchor('beltWeapon')
PHX_V3_ENGINE.playerBody.getAnchor('utility')
```

## Расовые body-профили

Модель учитывает разные пропорции гуманоидных рас. Профиль влияет на:

- рост и ширину силуэта;
- высоту first-person camera;
- материалы и цвет;
- длину шага и частоту gait-анимации;
- скорость передвижения;
- дополнительные особенности силуэта.

Доступные базовые профили:

| Профиль | Рост | Скорость | Особенности |
|---|---:|---:|---|
| `human` | 100% | 100% | базовый человеческий силуэт |
| `reptiloid` | 98% | 108% | чешуйчатая голова, морда, гребень, когти, хвост |
| `juniorReptiloid` | 88% | 116% | ниже и быстрее, более лёгкий силуэт |
| `zhuzher` | 94% | 105% | компактный широкий силуэт |
| `tsarbor` | 108% | 94% | высокий тяжёлый силуэт |

Переключение профиля для проверки:

```js
PHX_V3_ENGINE.setPlayerBodyRace('human')
PHX_V3_ENGINE.setPlayerBodyRace('reptiloid')
PHX_V3_ENGINE.setPlayerBodyRace('juniorReptiloid')
PHX_V3_ENGINE.setPlayerBodyRace('zhuzher')
PHX_V3_ENGINE.setPlayerBodyRace('tsarbor')
```

Если в будущем `player.race`, `player.species` или `player.bodyRace` задаётся до загрузки сцены, соответствующий профиль выбирается автоматически.

## Интеграция

`src/game/v3/core/enginePlayerBodyExtensions.js`:

- подключает тело после сборки сцены;
- отключает старый ранний `playerVisuals`-прототип в runtime, не удаляя его файл;
- добавляет `F8`;
- поддерживает first-person и debug third-person camera;
- применяет расовый speed multiplier;
- синхронизирует модель с player rig и рельефом;
- предоставляет диагностический API.

Extension подключён в `src/game/v3/main.js` с cache-buster:

```js
./core/enginePlayerBodyExtensions.js?v=30l3_player_body_1
```

## Smoke test

1. Запустить `START_GAME_V3K_WINDOWS.bat`.
2. Открыть `http://localhost:8000/v3k.html`.
3. Нажать `Start`.
4. Посмотреть вниз — ноги должны быть по сторонам от центра.
5. Проверить ходьбу и бег по неровному рельефу.
6. Проверить стрельбу, `R`, `V`, melee и альтернативную атаку.
7. Нажать `F8`, осмотреть полную модель, затем вернуться в first-person.
8. Проверить расовый профиль младшего рептилоида.
9. Проверить консоль.

Диагностика:

```js
PHX_V3_ENGINE.getPlayerBodyDiagnostics()
```

Ожидается:

- `lowerBodyVisible: true`;
- `upperBodyVisible: false` в first-person;
- `shadowVisible: true`;
- три anchors;
- `firstPersonWeaponAttached: true`;
- `legacyPlayerVisualRemoved: true`;
- небольшое значение `terrainContactGap`.

## Ограничения

- это базовая procedural-модель без скелета и IK;
- ступни не подстраиваются отдельно под угол наклона поверхности;
- third-person предназначен для debug, а не как законченный игровой режим;
- расовые коэффициенты являются первой настройкой и могут балансироваться после игрового теста.
