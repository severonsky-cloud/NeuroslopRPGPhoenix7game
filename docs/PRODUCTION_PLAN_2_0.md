# Phoenix7 2.0 Production Plan

## Производственный принцип

Старый 1.6 больше не патчим. 2.0 строится как новый чистый браузерный RPG-фундамент на Three.js. Старые наработки переносим только после ревью: карта, лор, Книга дорог, идеи фракций, звуки, Meshy-рефы и worldkit-ассеты.

## Запрещено переносить из 1.6 напрямую

- стартовую ветку Гравийного рубежа;
- Приказ №7 как первый квест;
- старые final/perfection overrides;
- MutationObserver-hotfixes;
- несколько версий currentQuest/updateQuestUI;
- сломанные runtime-перехваты персонажей.

## Цель 2.0B

Игрок стартует в Порту Рейчел, видит читаемый причал, дорогу, Форт Заря, первые NPC, живой дорожный слой и Книгу дорог. Игра должна ощущаться как маленький, но честный кусок Morrowind-подобного мира.

## Сейчас в main

- Three.js сцена.
- Порт Рейчел.
- Дорога Синего Шельфа.
- Форт Заря.
- NPC и диалоги.
- Регистрация у Орана Тива.
- Герда как следующий узел.
- Зелёный и Синий орден как дорожные места/послушники.
- Караван и патрули как движущиеся объекты.
- Книга дорог и карта.

## 2.0C — Герда и актовый узел

- Полноценный диалог Герды.
- Гейт “доживи до уровня/опыта”.
- Побочные направления: ордена, караван, рынок, фазовые маги.
- Первый выбор игрока: идти через торговцев, разведчиков или рыцарей.

## 2.0D — Asset integration

- Подключить GLBLoader.
- Добавить `public/assets/models/`.
- Поддержать fallback: если GLB не загрузился, используется low-poly procedural pawn.
- Первые модели: wandering knight, green knight, blue knight, port worker, clerk, Oran Tiv.

## 2.0E — Audio pack

- Добавить `public/assets/audio/`.
- Подключить реальные WAV пользователя.
- Сделать AudioManager с categories: ui, ambience, quest, world, combat.
- Меню: dark retro RPG ambience.
- Книга дорог: open/page/quest update/complete.

## 2.1 — Карта и мир

- JSON-сцены: Port Rachel, Road, Fort Zarya.
- Редактор world-data через простые координаты.
- Карта с поселениями, монастырями, дорогами и сетью рек.

## 2.2 — Living Road

- Караваны идут по дорогам.
- Рыцари патрулируют.
- Мутанты/опасности появляются как дорожные сцены.
- Книга дорог автоматически пишет события.

## 2.3 — Quest system

- Data-driven quests.
- Triggers by location, NPC, inventory, faction reputation.
- No hardcoded giant function as the only quest source.

## 2.4 — Combat prototype

- Simple melee lock-on.
- No blood/gore focus.
- Readable enemy states: idle, warn, attack, stagger, defeated.

## 2.5 — Demo vertical slice

- Port Rachel → Fort Zarya → Gerda → first road task.
- One knight-order side scene.
- One caravan scene.
- One market/rumor scene.
- Exportable build for itch/GitHub Pages.
