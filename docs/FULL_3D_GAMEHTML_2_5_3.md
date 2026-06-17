# Phoenix7 2.5.3 — Full WebGL 3D game.html

## Главный запуск

```text
http://localhost:8000/game.html
```

## Главное изменение

`game.html` больше не pseudo-3D/raycast canvas и не iframe wrapper.

Теперь это самодостаточный WebGL 3D build:

```text
single file
no iframe
no Three.js CDN
no module imports
raw WebGL 3D
```

## Что внутри

- 3D camera от первого лица.
- 3D ground.
- 3D здания.
- Здания состоят из стен, а не цельных кубов.
- Двери/проёмы остаются проходами.
- NPC внутри зданий.
- 3D NPC placeholders.
- 3D enemy placeholders.
- 3D projectiles.
- 3D bullets as simple objects.
- First-person hands/weapon overlay.
- HUD.
- Диалоги.
- Задачи Герды.
- Лут.
- Save/load.

## Управление

```text
WASD — движение
Shift — бег
мышь / стрелки ← → — обзор
ЛКМ или Space — атака
E — говорить / обыскать
R — блок
1 — кулаки
2 — фазовый удар рукой
3 — бастард
4 — шпага
5 — Кольт 1917
6 — M1 Гаранд
7 — Брен
J — журнал
I — инвентарь
Q — задачи Герды
F1 — телепорт
Esc — закрыть панель / выйти из pointer lock
```

## Почему raw WebGL

Такой подход сохраняет настоящий 3D, но не зависит от внешнего CDN. Это важнее для стабильного главного запуска.

Позже можно снова добавить Three.js или GLB-слой как optional upgrade, но `game.html` не должен падать без него.

## Следующий проход 2.5.4

- Проверить runtime в браузере.
- Исправить возможные WebGL shader/matrix ошибки.
- Добавить более нормальные 3D модели через примитивы:
  - разные NPC-силуэты;
  - разные враги;
  - разные здания.
- Добавить sky/port/fog в WebGL, а не только overlay.
- Добавить читаемые door markers.
