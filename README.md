# Phoenix7 — текущий playable build v3L / v3N3

## САМОЕ ВАЖНОЕ: что запускать

На Windows в корне репозитория нажми:

```text
00_START_HERE_CURRENT_BUILD_WINDOWS.bat
```

Это главный файл для обычного теста текущего билда.

Он вызывает реальный launcher:

```text
START_GAME_V3L_WINDOWS.bat
```

И открывает текущий entrypoint:

```text
http://localhost:8000/v3l.html
```

После обновлений жми в браузере `Ctrl+F5`, чтобы не увидеть старую кэшированную версию.

Подробная инструкция: `RUN_CURRENT_BUILD_RU.md`.

## Чего НЕ открывать для обычного теста

В репозитории много старых файлов. Их не надо запускать, если ты просто проверяешь текущую игру:

```text
game.html
real3d.html
act1_*.html
game_v3.html
game_v3i.html
v3k.html
```

Они оставлены как старые прототипы/совместимые входы. Текущая линия — `v3l.html` через launcher.

## Основной запуск вручную

Если не хочешь использовать `00_START_HERE_CURRENT_BUILD_WINDOWS.bat`, можно запустить:

```text
START_GAME_V3L_WINDOWS.bat
```

Лаунчер поднимает локальный PowerShell-сервер и открывает:

```text
http://localhost:8000/v3l.html
```

Можно запустить сервер вручную:

```powershell
powershell -ExecutionPolicy Bypass -File tools/phoenix_server.ps1 -Port 8000
```

Открытие HTML двойным кликом не поддерживается: игре нужны ES modules и локальный HTTP-сервер.

## Что является текущим билдом

- `00_START_HERE_CURRENT_BUILD_WINDOWS.bat` — файл, который надо нажимать для запуска.
- `START_GAME_V3L_WINDOWS.bat` — реальный Windows launcher.
- `v3l.html` — канонический вход в текущую линию v3L / v3N3.
- `src/game/v3/main.js` — сборка движка и установка extensions.
- `src/game/v3/` — текущий модульный игровой runtime.
- `v3k.html` — предыдущий совместимый entrypoint v3K3, не основной.
- `game.html`, `real3d.html`, `act1_*.html` и лаборатории — предыдущие сборки и прототипы.

Three.js r166 хранится локально в `src/game/v3/vendor`, поэтому текущий runtime не зависит от CDN или доступа к интернету.

## Что добавлено в v3L / v3N3

- Видимая модель тела игрока внутри first-person rig.
- Ноги, торс, пояс, рукава и тень игрока двигаются вместе с locomotion.
- Руки от первого лица получили ладони, пальцы, перчатки, манжеты и рукава.
- Отдельные позы для кулаков, фазовой руки, клинков и огнестрела.
- Melee/phase action poses, breathing и locomotion sway.
- Recoil, reload и idle-анимации используют отдельные transform roots и больше не накапливают смещение модели.
- v3N2 Living Ecosystem: караваны, патрули, засады, торговый цикл поселений, награда за спасение каравана.
- v3N3 NPC Visual Pass: процедурные Three.js-модели поверх life-NPC и сюжетных NPC — шлемы, плащи, щиты, груз, жужжерские детали, фазовые орбы, бумаги, посохи и faction props.

## Управление

```text
WASD — движение
Shift — бег
мышь — обзор после клика по игровому полю
ЛКМ или Space — атака
E — взаимодействие / открыть трофеи
1–7 — выбор оружия
Tab — переключить набор оружия
R — перезарядить оружие / устранить осечку
B — альтернативная атака оружием
V — прицел
I — инвентарь
K — персонаж и навыки
P — фазовая магия
O — покупка патронов
Y — зачарование активного оружия
J — журнал
M — карта
Z / X / C / F — способности
F1 — тестовый телепорт
Esc — закрыть панель
F9 / F10 / F11 — качество low / medium / high
```

## Проверка живого мира и NPC models

1. Запусти `00_START_HERE_CURRENT_BUILD_WINDOWS.bat`.
2. В браузере нажми `Ctrl+F5`.
3. На стартовом экране должно быть написано `Phoenix7 v3N3`.
4. Нажимай `F1`, пока не попадёшь на Красную дорогу или к Форту Заря.
5. Открывай журнал `J`.
6. Ищи караваны, патрули, бандитов, Жужжер и рыцарей.
7. Если караван атаковали, стреляй по налётчикам — они созданы как hostile monsters, чтобы текущее оружие работало по ним.

Debug-команды через консоль браузера:

```js
PHX_V3_ENGINE.listLifeVisuals()
PHX_V3_ENGINE.listStoryNpcVisuals()
PHX_V3_ENGINE.rebuildLifeVisuals()
PHX_V3_ENGINE.rebuildStoryNpcVisuals()
PHX_V3_ENGINE.forceNearestCaravanAmbush('bandits')
PHX_V3_ENGINE.forceNearestCaravanAmbush('zhuzher')
PHX_V3_ENGINE.getLivingWorldDiagnostics()
```

## Проверка и сборка

Для разработки:

```bash
npm install
npm run dev
```

Проверка production-сборки:

```bash
npm run build
npm run preview
```

Vite собирает `v3l.html` и совместимый `v3k.html` в каталог `dist`.

## Текущие ограничения

- Полноценное сохранение игрового состояния пока не подключено. `localStorage` сейчас хранит только выбранный профиль качества.
- Музыкальные файлы в репозитории отсутствуют; runtime использует процедурный Web Audio fallback.
- Старые документы в `docs/` описывают предыдущие этапы разработки и не заменяют этот README для запуска v3L / v3N3.

## Правило разработки

Новые игровые изменения должны входить через модульную линию `src/game/v3/` и проверяться через `v3l.html`. Старые HTML-сборки можно использовать как справочные прототипы, но они не являются текущим entrypoint.
