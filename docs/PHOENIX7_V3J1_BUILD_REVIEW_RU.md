# Phoenix7 v3.0J1 — Build Review / Road Terrain Fix

## Что проверено

```text
runtime v3J
цепочка extensions
случайное событие Форта Заря
дороги на рельефе
кэш ES-модулей
безопасность старых запускателей
```

## Найденные проблемы

### 1. Дороги висели над землёй

Причина:

```text
placeRoadSegment строил дорогу как одну прямую BoxGeometry
высота бралась только по двум концам сегмента
использовалась максимальная высота концов
на неровном рельефе середина дороги висела мостом
```

Исправление:

```text
дорога теперь строится как terrain-following ribbon mesh
сегмент делится на короткие участки
каждая левая/правая вершина дороги берёт heightAt(x,z)
добавлен небольшой offset над землёй
добавлены затемнённые края дороги
включён polygonOffset против z-fighting
```

Файл:

```text
src/game/v3/world/props.js
```

### 2. Браузер мог держать старый props.js

Причина:

```text
chunks.js импортировал props.js без cache-buster
```

Исправление:

```text
import './props.js?v=road_terrain_hug_1'
```

Файл:

```text
src/game/v3/world/chunks.js
```

### 3. Событие Форта Заря стартовало сразу

Ты уточнил, что пока это должно быть случайное событие, не квест.

Исправление:

```text
FortZaryaEncounter теперь стартует в state dormant
событие не создаёт технику и отряды сразу
рядом с Фортом Заря идёт случайный roll таймера
после успешного roll начинается событие
для теста можно открыть страницу с ?fort=1
```

Файл:

```text
src/game/v3/encounters/fortZaryaEncounter.js
```

### 4. Кэш Fort Encounter

Исправление:

```text
engineFortEncounterExtensions импортирует fortZaryaEncounter.js?v=random_event_1
main.js получил новый runtime cache-buster 30j1_build_review_roadfix_1
v3j.html тоже импортирует main.js?v=30j1_build_review_roadfix_1
```

## Как запускать

Обычный v3J1:

```text
START_GAME_V3J_WINDOWS.bat
```

Или вручную:

```text
http://localhost:8000/v3j.html
```

Форс-тест события Форта Заря:

```text
http://localhost:8000/v3j.html?fort=1
```

## Статус

```text
дороги больше не должны висеть коробками
Форт Заря теперь случайное событие
старые v3H/v3I запускатели не тронуты
v3J работает через минимальный безопасный launcher
```
