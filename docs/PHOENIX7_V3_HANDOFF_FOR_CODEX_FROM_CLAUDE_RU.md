# Phoenix7 v3 — отчёт/handoff для Codex и GPT (от Claude)

**Ветка (на origin):** `claude/v3-integration-build` — весь рабочий билд. В `main` НЕ влит (мержить — по решению автора).
**Запуск:** `START_GAME_V3L_WINDOWS.bat` → `http://localhost:8000/v3l.html` (Ctrl+F5). Папка билда = обычная папка игры, она уже на этой ветке.
**Проверки:** `npm.cmd run build` (≈88 модулей, без ошибок), `npm.cmd run test:v3m2b` (→ `{"ok":true,...,"outcomes":6}`), `npm.cmd run test:v3m2a`.

## Состав билда (поверх v3M2A «создание персонажа»)

- **v3N1 день-ночь:** `world/dayNight.js` (+`worldClock`), `core/engineDayNightExtensions.js`. Клавиша `T`. Распорядок жителей в `world/life.js`.
- **v3N2 точки интереса:** `world/poiData.js`, `world/poiSystem.js`, `core/enginePoiExtensions.js`. Находки → журнал + маркеры на карте.
- **v3N3 «смысл+атмосфера»:** `core/engineDemoHooksExtensions.js` — цель к Форту + трекер находок, награда +10 кр за POI, ночные огни поселений.
- **Фикс Брена:** `feel/gunFeel.js` (камера: `rotation.z=0` каждый кадр, pitch/отдача ограничены) + компактная модель `items/weaponModels.js`.
- **Движок квестов+диалогов (v3M2B):** `state/worldState.js` v2 (localStorage `phoenix7_v3_world_state`), `dialogue/dialogueEngine.js` (условия `any/all`, race/bg/flag/quest/skill; эффекты `questPatch/questItem/reward/reputation/credits/journal/setFlag`), `ui/dialogueView.js` (темы-гиперссылки + выборы), `core/engineDialogueExtensions.js` (E→диалог; **New Game сбрасывает worldState**).
- **Квест «Налог и глина» (расширен Codex, проверен Claude):** `data/taxQuestData.js`, `data/questData.js`, `quests/taxQuestSystem.js`, `quests/taxCombatSystem.js`, `quests/taxEvidenceSystem.js`, `core/engineTaxQuestExtensions.js`, тексты в `dialogue/dialogueData.js`.

Все системы — extensions через `src/game/v3/main.js`. `engine.js` не переписан.

## Квест «Налог и глина» — СТАТУС: 3 маршрута играбельны и проверены в рантайме

| Маршрут | Поток | Статус |
|---|---|---|
| **Казнь** | завязка-сцена у поста (субтитры+журнал, «?»-маркеры) → расово-окрашенная реплика → кинематик-убийство → охрана стреляет → **шок 1 мин + красная виньетка** → отрыв (таймер+дистанция ИЛИ дикая зона: Лес царборцев/Ледяной шельф) → Герда | ✅ |
| **Расследование** | выбор → Рина даёт камеру (quest-item) → evidence-трекинг (снимок/ведомость) → отряд Герды → 4 способа ареста | ✅ |
| **Оборона** | «Сними форму» → «Я никуда не уйду» → 90с защита (3 волны) → выжил → гарнизон заменён 3 пресет-офицерами, outcome `standoff`, награда; погиб → graceful fail-and-retry | ✅ |

world-state v2: quest-items, persistent-награды, локальная репутация. Smoke `test:v3m2b` = 6 исходов, `ok:true`.

## Сделано в последней сессии Claude (поверх расширения Codex)

1. **Фикс краша:** `TaxCombatSystem.resetRuntime`/`finishAssassination` обращались к `player.characterRuntime.rooted` без проверки → краш на сбросе квеста/New Game. Добавлен guard (2 места).
2. **Ощущаемость по просьбе автора:** шок-таймер казни **2 мин → 1 мин** (`SHOCK_DURATION=60`); **побег в дикую зону** (`SAFE_BIOMES=['tsarbor','ice']`) завершает погоню сразу с флейвором; **красная паническая виньетка** во время побега (усиливается к концу таймера, гаснет при отрыве).
3. **Полная рантайм-проверка** всех трёх маршрутов (выше) + повторный smoke-тест: консоль чистая, ошибок нет.

## Где автор пишет тексты (НЕ менять формат, только тексты)

- `dialogue/dialogueData.js` — реплики/темы/выборы NPC (Дюмон, Рина, Ньен Ло, Герда). Памятка: `docs/PHOENIX7_DIALOGUE_WRITING_GUIDE_RU.md`.
- `core/engineTaxQuestExtensions.js` / `quests/taxCombatSystem.js` — `SCENE_LINES`, `WITNESS_LINES`, объективы.

## Диагностика (консоль)

`PHX_V3_ENGINE.` → `getTaxQuestDiagnostics()` (route/stage/outcome/combat/evidence/reputation/rewards) · `getQuestDiagnostics()` · `getDayNightDiagnostics()` · `getPoiDiagnostics()` · `getDemoHooksDiagnostics()`. Дебаг: `setTaxQuestDebugStage(n)`, `resetTaxQuestDebug()`.

## Следующие шаги (полный замысел — `docs/PHOENIX7_QUEST_TAX_AND_CLAY_DESIGN_RU.md`)

- **Тир-2:** озвучка субтитров (TTS/звук); повторяющийся цикл КЭК-каравана (Порт↔Форт, торговля, повторная оплата у поста); мирные под-ветки (повстанцы ночью со светом, мобилизация крестьян); фазовый путь (призраки планеты).
- **Тир-3 (отдельные проходы):** вымогательство → контрабанда в Порту → девушка-киборг из чёрного ящика → имперский «Шерман»; заложники + синдикат; репутация Красных (Империя/независимость).
- Технический разбор расширения — `docs/PHOENIX7_V3M2B1_TAX_AND_CLAY_EXPANSION_RU.md`.

## Границы (не трогать без задания)

Координаты Форта `(142,176)`, 8 поселений и тракт, Fort Encounter, race/background ID, формат профиля v1, старые launcher'ы и `v3k.html`. Новые системы — только extensions через `main.js`. Крупная механика — отдельная ветка/PR. Автор пишет диалоги; Codex/Claude строят машину.
