# Phoenix7 v3 — трекер готовности

## Текущий статус

```text
Текущий playable backup: 2.5I
Новый основной путь: v3
Текущий этап v3: v3.0B Art Direction Pass начат
```

## Готовность по крупным блокам

```text
2.5I playable backup:        45%
v3 architecture foundation:  35%
v3 performance foundation:   30%
v3 art direction:            20%
v3 living world:             20%
v3 combat rebuild:           15%
v3 quest loop:               15%
v3 vertical slice:           18%
```

## Что уже сделано в v3

```text
game_v3.html
START_GAME_V3_WINDOWS.bat
модульный engine
input system
save shell
terrain module
world data module
chunks shell
InstancedMesh для камней/деревьев/кристаллов
quality presets Low / Medium / High
NPC module
monster module
combat shell
HUD/map modules
atmosphere module
landmarks module
биомная атмосфера
landmark-и для ключевых биомов
```

## Что означает текущий процент

v3 уже не пустой. У него есть архитектура и он запускается как отдельный билд.

Но v3 ещё не является полноценной игрой, потому что:

```text
Act 1 loop ещё не перенесён полностью
NPC schedules ещё базовые
боёвка ещё shell, не финальная
нет полного chunk streaming
нет финального visual polish
нет нормального звука/ambient system
нет полноценного UI квестов
нет production-ready monster AI
```

## План дальше

### v3.0C — Living World System

Цель: мир должен жить.

Нужно сделать:

```text
NPC schedules
caravan routes
patrol logic
faction zones
simple encounter spawner
NPC reaction to nearby combat
ambient events
```

### v3.0D — Combat Rebuild

Цель: бой должен ощущаться руками.

Нужно сделать:

```text
melee sweep hitbox
phase cone attack
block/parry
stagger
enemy wind-up
impact particles pool
weapon animation curves
```

### v3.0E — Act 1 Quest Loop

Цель: первый акт должен проходиться.

```text
Рина
Дорожный навес
Оран
Герда
4 подготовки
Сава
переход к Мёртвой Саванне
```

### v3.0F — Vertical Slice Polish

Цель: демо-состояние.

```text
стабильный FPS
читаемая карта
красивые биомы
живые NPC
монстры по силуэтам
боёвка работает
первый акт можно пройти
```

## Оценка до готовности

До хорошего v3 playable vertical slice:

```text
5–7 крупных проходов
```

До демо, которое можно показывать:

```text
8–12 крупных проходов
```

## Следующий обязательный шаг

```text
v3.0C — Living World System
```

Не надо дальше просто добавлять декор. Следующий шаг — сделать систему живого мира:

```text
NPC state machine
routes
schedules
encounters
patrol/caravan behaviour
```
