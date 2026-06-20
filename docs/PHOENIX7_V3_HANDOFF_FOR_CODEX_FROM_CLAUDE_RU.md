# Phoenix7 v3 — handoff Codex'у (от Claude)

**Ветка (на origin):** `claude/v3-integration-build` — собран весь рабочий билд. В `main` НЕ влит (мержить — по решению автора).
**Запуск:** `START_GAME_V3L_WINDOWS.bat` → `http://localhost:8000/v3l.html` (Ctrl+F5). Сборка: `npm.cmd run build` (≈84 модуля, без ошибок).

## Что в билде поверх v3M2A

- **v3N1 день-ночь:** `world/dayNight.js` (+ `worldClock`), `core/engineDayNightExtensions.js`. Клавиша `T` — скорость времени. Распорядок жителей в `world/life.js`.
- **v3N2 точки интереса:** `world/poiData.js`, `world/poiSystem.js`, `core/enginePoiExtensions.js`. Находки → журнал + маркеры на карте (`ui/map.js` принимает `pois`; `core/engineSettlementExtensions.js` openMap/openJournal прокидывают).
- **v3N3 «смысл+атмосфера»:** `core/engineDemoHooksExtensions.js` — цель к Форту + трекер находок (HUD), награда +10 кр за POI (`poiSystem.discover`), ночные огни поселений.
- **Фикс Брена:** `feel/gunFeel.js` (камера: `rotation.z=0` каждый кадр, pitch/отдача ограничены) + компактная модель в `items/weaponModels.js`.
- **Движок квестов + диалогов (v3M2B):** `state/worldState.js` (localStorage `phoenix7_v3_world_state`, отдельно от профиля), `dialogue/dialogueEngine.js` (условия race/background/flag/quest/skill, эффекты), `ui/dialogueView.js` (темы-гиперссылки + выборы), `core/engineDialogueExtensions.js` (E → диалог если есть данные; **New Game сбрасывает worldState**).
- **Квест «Налог и глина», ветка НАСИЛИЕ (играбельна):** `core/engineTaxQuestExtensions.js` + `data/questData.js`. Завязка-сцена у Поста Ришелье (субтитры `#phxSubtitle` + журнал), «?»-маркеры над Дюмоном и крестьянином, баннер задачи `#phxQuestBanner`. Поток: наблюдение → расовая реплика казни (диалог Дюмона) → удаление офицера + шок-таймер 2 мин → побег (>70 м от поста) → разговор с Гердой (+250 кр, закрытие).

Все системы — extensions, подключены в `src/game/v3/main.js`. `engine.js` не переписан.

## Где автор пишет тексты (НЕ менять формат, только тексты)

- `dialogue/dialogueData.js` — реплики/темы/выборы NPC (Дюмон, Герда). Образец + памятка: `docs/PHOENIX7_DIALOGUE_WRITING_GUIDE_RU.md`.
- `core/engineTaxQuestExtensions.js` — `SCENE_LINES` (сцена вымогательства), `WITNESS_LINES` (расовый внутренний голос).

## Диагностика (консоль)

`PHX_V3_ENGINE.` → `getTaxQuestDiagnostics()` · `getQuestDiagnostics()` · `getDayNightDiagnostics()` · `getPoiDiagnostics()` · `getDemoHooksDiagnostics()`.

## Следующие шаги (полный замысел — `docs/PHOENIX7_QUEST_TAX_AND_CLAY_DESIGN_RU.md`)

Квест «Налог и глина» — три группы исходов, ~10 концовок. Сделана 1 (насилие/казнь). Дальше:
- **Тир-2:** мили-анимация добивания + враждебность охраны поста (локально); повторяющийся цикл КЭК-каравана (Пост → Форт → торговля → возврат → повторная оплата у поста); озвучка субтитров (TTS/звук).
- **Другие ветки:** мирная (улики→Герда→арест; повстанцы ночью; мобилизация крестьян), вымогательство (вышибала → давление на артель → контрабанда в Порту).
- **Тир-3 (крупные системы, отдельные проходы):** заложники+синдикат, контрабандный звездолёт, девушка-киборг из чёрного ящика, фазовые призраки планеты, имперский «Шерман», репутация Красных (Империя/независимость).

## Границы (не трогать без задания)

Координаты Форта `(142,176)`, 8 поселений и тракт, Fort Encounter, race/background ID, формат профиля v1, старые launcher'ы и `v3k.html`. Новые системы — только extensions через `main.js`. Каждая крупная механика — отдельная ветка/PR. Автор пишет диалоги; Codex строит машину.
