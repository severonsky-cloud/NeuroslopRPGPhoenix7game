# Phoenix7 v3L4.1 — PR Polish

## Что исправлено

- У Bren очищена центральная линия обзора при прицеливании на `V`.
- Верхний магазин сохранён: в ADS он немного уменьшен, смещён влево и наклонён, а весь Bren слегка сдвинут вправо и вниз.
- Hip-fire силуэт Bren не изменён.
- Расовые body-профили больше не меняют фактическую скорость игрока. Различия сохранены только в пропорциях и визуальном темпе gait-анимации.
- Обновлены cache-busters `main.js`, `v3l.html` и `v3k.html`.

## Что проверено

- first-person hands: Colt, M1, Bren, Trench Shotgun, Caravan Carbine, melee и phase hand;
- reload poses: Bren, M1, Colt и Trench Shotgun, включая возврат частей к базовым transform;
- ноги и contact shadow в first-person;
- `F8` third-person debug, скрытие рук и возврат в first-person;
- запуск `v3l.html` и совместимость `v3k.html`;
- fog, sky, дороги и roadside dressing;
- `F9` / `F10` / `F11`, inventory, map, journal и browser console;
- production build через `npm.cmd run build`.

## Что остаётся после merge

- Финальная балансировка скорости разных рас должна выполняться отдельным character creation/gameplay pass.
- Third-person остаётся диагностическим режимом без полноценного скелета и IK.
- Визуальные offsets оружия могут потребовать мелкой калибровки под другие FOV и размеры экрана.
