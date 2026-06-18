# Phoenix7 — план внедрения Codex

## Задача

Codex должен стать не заменой разработчика, а рабочим помощником для маленьких безопасных итераций.

Главная цель:

```text
не ломать рабочий билд
не переписывать проект целиком
делать изолированные улучшения
каждый проход проверять запускателем
оставлять резервные версии
```

## Текущий рабочий контекст

Основной репозиторий:

```text
severonsky-cloud/NeuroslopRPGPhoenix7game
```

Текущая линия разработки:

```text
Phoenix7 v3
```

Актуальный запускатель:

```text
START_GAME_V3K_WINDOWS.bat
http://localhost:8000/v3k.html
```

Резервные запускатели:

```text
START_GAME_V3H_WINDOWS.bat
START_GAME_V3I_WINDOWS.bat
START_GAME_V3J_WINDOWS.bat
```

Правило:

```text
если новый слой ломается, резервные запускатели должны оставаться рабочими
```

## Архитектурное правило для Codex

Codex не должен переписывать большой `engine.js` без необходимости.

Правильный формат изменений:

```text
src/game/v3/<area>/<newModule>.js
src/game/v3/core/engine<Name>Extensions.js
main.js cache-buster
отдельный launcher при необходимости
короткий doc в docs/
```

Примеры хорошего подхода:

```text
feel/gunFeel.js
feel/reloadFeel.js
feel/hitFeel.js
core/engineFeelExtensions.js
visuals/actorVisuals.js
core/engineActorVisualExtensions.js
```

Плохой подход:

```text
переписать весь engine.js
смешать UI, AI, world и combat в одном файле
удалить старые запускатели
создать большой HTML с длинным описанием
добавить тяжёлые ассеты без проверки размера
```

## Ветка и PR-правила

Каждая задача Codex должна идти в отдельной ветке.

Формат веток:

```text
codex/v3k3-hit-feel-audit
codex/v3k4-melee-feel
codex/v3l-npc-density
codex/fix-road-terrain
```

Формат PR:

```text
[Phoenix7] v3K4 melee feel pass
```

В PR обязательно:

```text
что изменено
какие файлы затронуты
как запускать
что проверять вручную
что НЕ трогалось
```

## Главные инструкции для Codex

Codex должен перед началом задачи прочитать:

```text
docs/PHOENIX7_V3K_FEEL_REBUILD_PLAN_RU.md
docs/PHOENIX7_V3J1_BUILD_REVIEW_RU.md
docs/PHOENIX7_VERSION_3_PLAN_RU.md
docs/PHOENIX7_V3_ARCHITECTURE_STATUS_RU.md
```

Если задача касается боя:

```text
src/game/v3/combat/
src/game/v3/feel/
src/game/v3/core/engineFeelExtensions.js
```

Если задача касается мира:

```text
src/game/v3/world/
src/game/v3/data/worldData.js
src/game/v3/data/lifeData.js
```

Если задача касается NPC:

```text
src/game/v3/world/life.js
src/game/v3/combat/armedWorld.js
src/game/v3/visuals/actorVisuals.js
```

## Что поручать Codex сначала

### 1. Static build audit

Задача:

```text
найти очевидные ошибки импорта
найти missing exports
найти undefined method calls
найти несовпадения cache-buster
найти потенциальные null/undefined
```

Результат:

```text
docs/CODEX_AUDIT_<date>.md
маленький fix PR, если нужны правки
```

### 2. v3K4 Melee Feel Pass

Задача:

```text
улучшить ближний бой
slash/thrust/heavy feel
wind-up/release/recovery
лучшие trail effects
hit pause для сильного попадания
```

Важно:

```text
не добавлять новые крупные механики
не трогать Fort Encounter
не трогать world generation
```

### 3. v3K5 HUD Feel Pass

Задача:

```text
сделать боевой HUD понятнее
condition display
reload display
hit marker
screen feedback
small fading combat log
```

### 4. v3L NPC Density Pass

Задача:

```text
добавить больше NPC-групп через lifeData
не перегружать сцену
плотнее только форт/порт/дороги
```

### 5. v3M Fort Random Event Polish

Задача:

```text
сделать событие форта более staged
не привязывать к квестам
сохранять random event state
```

## Что НЕ поручать Codex пока

```text
полный перенос на другой движок
большая замена renderer
массовый импорт 3D-ассетов
переписывание всего UI
генерация огромных HTML-файлов
```

## Политика ассетов

Для моделей и анимаций:

```text
сначала procedural / low-poly geometry
потом внешние ассеты только маленькими пачками
каждый ассет должен иметь лицензию
assets/third_party/<pack_name>/LICENSE.txt
```

Разрешённые типы ассетов:

```text
нейтральные персонажи
общие low-poly props
окружение
животные / караваны / палатки / ящики
UI icons
SFX / ambience / music с понятной лицензией
```

Не добавлять ассеты без лицензии.

## Музыка

Музыкальные файлы класть сюда:

```text
assets/audio/
```

Рекомендуемые имена:

```text
main_theme.mp3
road_theme.mp3
menu_ambience.mp3
combat_sting.mp3
```

Большие WAV лучше конвертировать в MP3 или OGG.

## Проверка перед merge

Каждый PR должен проходить ручную проверку:

```text
1. открыть START_GAME_V3K_WINDOWS.bat
2. Ctrl+F5
3. нажать Start
4. проверить консоль браузера
5. проверить, что HUD жив
6. проверить, что игрок двигается
7. проверить, что атака работает
8. проверить, что инвентарь открывается
9. проверить, что старый резервный launcher не сломан
```

Минимальный smoke test:

```text
v3k.html загружается
нет красного error overlay
Start работает
движение работает
I открывает инвентарь
R показывает reload если активен огнестрел
J открывает журнал
M открывает карту
```

## Формат задач для Codex

Каждую задачу формулировать так:

```text
Работай только в ветке codex/<name>.
Не переписывай engine.js целиком.
Сделай изменение отдельным extension/module.
Добавь короткий doc в docs/.
Обнови cache-buster только в main.js и launcher, если нужно.
В конце дай список файлов и ручной smoke test.
```

## Первый prompt для Codex

```text
Ты работаешь в репозитории severonsky-cloud/NeuroslopRPGPhoenix7game.
Нужно сделать static build audit текущей v3K-линии.
Сначала прочитай docs/PHOENIX7_CODEX_INTEGRATION_PLAN_RU.md и docs/PHOENIX7_V3K_FEEL_REBUILD_PLAN_RU.md.
Не переписывай engine.js целиком.
Проверь импорты, missing exports, null/undefined, cache-busters, runtime launchers.
Запускатель: START_GAME_V3K_WINDOWS.bat или http://localhost:8000/v3k.html.
Если найдёшь баги, исправляй маленькими безопасными патчами.
Добавь отчёт docs/CODEX_AUDIT_V3K_RU.md.
В конце дай список файлов, что изменено, и ручной smoke test.
```

## Рабочий порядок

```text
1. Мы делаем K3/K4 вручную или вместе с Codex
2. Codex делает static audit
3. Codex делает маленький fix PR
4. Мы проверяем запуск
5. Потом Codex получает v3K4 melee feel как отдельную задачу
```

## Главная цель внедрения

Codex должен помогать закрывать узкие задачи:

```text
аудит
small fixes
рефакторинг маленьких модулей
документация
тестовые запускатели
UI polish
```

Но решения по направлению игры, стилю и лору остаются за автором проекта.
