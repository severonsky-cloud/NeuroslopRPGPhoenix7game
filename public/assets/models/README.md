# Model assets

Сюда кладём GLB-модели Phoenix7.

## Первые модели

```text
wandering_knight_v0.glb
green_knight_v0.glb
blue_knight_v0.glb
oran_tiv_v0.glb
gerda_v0.glb
port_worker_v0.glb
port_rachel_props_v0.glb
fort_zarya_props_v0.glb
```

## Правило загрузки

1. Код пробует загрузить GLB через GLTFLoader.
2. Если файл отсутствует или загрузка падает — остаётся procedural fallback.
3. Нельзя ломать игровой билд из-за отсутствия одной модели.

## Требования к моделям

- Low/mid-poly.
- Browser-friendly.
- Чёткий силуэт.
- Без текста на модели.
- Без лишнего фона.
- Сначала статичная модель, потом анимация.
- Масштаб персонажа: примерно 1.7–2.2 метра.

## Meshy prompt core

```text
Game-ready low-poly dark frontier RPG character, readable silhouette, simple materials, worn coat, dull metal, leather, neutral standing pose, no text, no background, browser-game optimized, glb asset.
```
