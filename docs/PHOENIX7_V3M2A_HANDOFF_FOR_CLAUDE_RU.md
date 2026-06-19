# Phoenix7 v3M2A — handoff для Claude

**Дата передачи:** 2026-06-20

**Репозиторий:** `severonsky-cloud/NeuroslopRPGPhoenix7game`

**Завершённый проход:** `v3M2A Character Creation`

**PR:** `#4` — `codex/v3m2a-character-creation → main`

**Последний readiness-коммит:** `5bb123c`

## 1. Состояние билда

v3M1 World Settlements и v3M2A Character Creation интегрированы. Перед merge выполнены:

- `npm.cmd run test:v3m2a` — успешно;
- `npm.cmd run build` — успешно, 71 модуль;
- V3L и V3K — запуск в браузере без console/page errors;
- creator — четыре шага, 8 рас, 8 предысторий, 15 допустимых race/gender-комбинаций;
- legacy migration — 49 сочетаний старых race/background ID;
- procedural body и first-person hands — все 8 рас;
- Q-способности — стоимость, cooldown и эффекты;
- оружие — aim, reload, melee, phase hand и отсутствие накопления transform;
- F8 — переключение first/third person;
- карта, журнал, инвентарь и quality F9/F10/F11;
- 8 поселений, F2-телепорт и дорога Порт–Форт длиной `481.52 м`;
- Fort Zarya сохранён у `(142,176)`;
- совместимый `v3k.html`.

Остаётся предупреждение Vite о крупном main chunk около 804 kB. Это не мешает запуску, но позже желательно разнести редко используемые UI-модули через dynamic import.

## 2. Как запускать

Локальная папка:

`C:\Users\Админ\Documents\My neuroslop Morrowind\NeuroslopRPG`

Главный launcher:

```powershell
START_GAME_V3L_WINDOWS.bat
```

Главная страница:

`http://localhost:8000/v3l.html`

Совместимость:

`http://localhost:8000/v3k.html`

Проверки:

```powershell
npm.cmd run test:v3m2a
npm.cmd run build
```

## 3. Реализованные системы v3M2A

### Профиль персонажа

Ключ localStorage: `phoenix7_v3_character_profile`.

Основные файлы:

- `src/game/v3/data/characterData.js`
- `src/game/v3/character/characterProfile.js`
- `src/game/v3/core/engineCharacterExtensions.js`

Профиль содержит name, race, gender, background, цвета, heightOffset, biographyFlags и migratedFrom. Старый `phx2l_character` мигрируется с backup исходного JSON.

### Creator и preview

- `src/game/v3/ui/characterCreator.js`
- `src/game/v3/visuals/characterPreview.js`
- `src/game/v3/visuals/playerBody.js`

Preview и игровой персонаж используют общий procedural body builder. Позы preview: idle, walk, attack и racial ability.

### Расовый визуал и руки

- `src/game/v3/visuals/playerBody.js`
- `src/game/v3/visuals/playerHands.js`
- `src/game/v3/items/weaponModels.js`

Все модели процедурные, без обязательных внешних GLB/FBX. В дальнейшем внешние модели допустимы, но нельзя ломать procedural fallback, first-person hands, reload/aim/melee hooks и Low quality mode.

### Расовые способности

- `src/game/v3/character/racialAbilities.js`

Q использует stamina или phase, cooldown и HUD-состояние. Blue Ice Step замедляет цели около точки старта и точки приземления.

### Предыстории и стартовый инвентарь

- `src/game/v3/data/characterData.js`
- `src/game/v3/items/inventory.js`

Игрок получает кулаки, базовую фазовую руку и предметы происхождения. Нельзя возвращать весь арсенал каждому новому персонажу.

### Поселения и карта

- `src/game/v3/data/settlementsData.js`
- `src/game/v3/world/settlements.js`
- `src/game/v3/core/engineSettlementExtensions.js`
- `src/game/v3/ui/map.js`

Восемь поселений известны сразу. Карта имеет zoom/pan и LOD подписей, но не fast travel. Услуги поселений пока являются metadata и текстом.

## 4. Канон и обязательные ограничения

Перед нарративной или квестовой работой прочитать:

- `docs/PHOENIX7_V3M1_SETTLEMENT_NARRATIVE_BIBLE_RU.md`
- `docs/PHOENIX7_V3M1_NARRATIVE_HANDOFF_FOR_CODEX_RU.md`
- `docs/PHOENIX7_V3M1_WORLD_SETTLEMENTS_RU.md`
- `docs/PHOENIX7_V3M2A_CHARACTER_CREATION_RU.md`

Соблюдать маркировку Narrative Bible:

- `КАНОН` — можно использовать;
- `УТВЕРЖДЕНО АВТОРОМ` — можно переносить в код как новый утверждённый материал;
- `(предложение)` — не превращать в канон без согласования.

Не менять без отдельного задания:

- координаты Fort Zarya `(142,176)`;
- восемь поселений и основной дорожный маршрут;
- Fort Encounter;
- race IDs и background IDs;
- формат character profile version 1;
- first-person weapon/hands behavior;
- старые launchers и `v3k.html`.

Не переписывать `engine.js` целиком. Новые системы подключать extensions через `src/game/v3/main.js`.

## 5. Следующий рекомендуемый проход

### v3M2B World State + «Налог и глина»

Создать отдельную ветку:

`claude/v3m2b-world-state-tax-and-clay`

Цель:

1. Ввести минимальную сериализуемую границу world state отдельно от character profile.
2. Реализовать первый полноценный квест тракта «Налог и глина».
3. Связать Пост Ришелье, Артель Ланг-До, красных крестьян и имперскую налоговую сцену.
4. Сохранить напряжённое, но не автоматически боевое начало конфликта.
5. Добавить несколько решений: законное, договорное, обманное и силовое.
6. Учитывать race/background/gender и биографический флаг красного мужчины.
7. Сохранять стадии квеста и последствия после refresh.
8. Не начинать строительство Форта и convoy economy в этом проходе.

Предпочтительные новые файлы:

- `src/game/v3/state/worldState.js`
- `src/game/v3/data/questData.js`
- `src/game/v3/quests/taxAndClayQuest.js`
- `src/game/v3/core/engineWorldStateExtensions.js`
- `src/game/v3/core/engineQuestExtensions.js`
- `docs/PHOENIX7_V3M2B_WORLD_STATE_TAX_AND_CLAY_RU.md`

До реализации нужно согласовать с автором:

- точную цену и форму налога;
- допустимые моральные исходы;
- кто может погибнуть;
- какие последствия должны быть обратимыми;
- должна ли агрессия Империи распространяться на весь тракт;
- какие решения доступны каждой расе и предыстории.

## 6. Smoke test следующего прохода

- миграция профиля v3M2A не ломается;
- New Game корректно отделён от world save;
- квест начинается только при нужном триггере;
- refresh сохраняет стадию и последствия;
- NPC не дублируются после reload;
- налоговая сцена не начинает автоматическую перестрелку;
- все четыре типа решения достижимы;
- журнал показывает актуальную стадию;
- creator, Q, hands, reload, melee и F8 не сломаны;
- карта, инвентарь и журнал открываются;
- Fort Encounter остаётся у `(142,176)`;
- V3L и V3K запускаются без ошибок;
- `npm.cmd run test:v3m2a`;
- `npm.cmd run build`.

## 7. Рабочий принцип передачи

Claude может менять код, данные, procedural-модели и подключать новые модели, если это нужно задаче. Любой внешний asset должен иметь понятную лицензию, разумный размер, browser-friendly формат и procedural fallback для Low quality. Большие новые механики нужно вести отдельными ветками и PR.

После завершения Claude должен оставить handoff с:

- веткой и commit hash;
- списком файлов;
- решениями по архитектуре;
- изменениями канона;
- результатами build/smoke test;
- известными рисками;
- точным следующим шагом для Codex.
