# Phoenix7 Asset Pipeline

## Цель

Перейти от процедурных кубов и временных NPC к нормальным low/mid-poly ассетам без повторения хаоса 1.6.

## Правило ассетов

Каждый ассет должен иметь:

```text
public/assets/<type>/<name>/
  source.png или ref.png
  model.glb
  texture.png
  README.md
```

## Персонажи

Первые GLB:

1. `wandering_knight_v0.glb`
2. `green_knight_v0.glb`
3. `blue_knight_v0.glb`
4. `oran_tiv_v0.glb`
5. `gerda_v0.glb`
6. `port_worker_v0.glb`

## Требования к Meshy/GLB

- Low/mid-poly.
- Browser-game friendly.
- Не киношная поза, лучше A-pose или спокойная стойка.
- Чёткий силуэт.
- Без текста на модели.
- Без лишнего фона.
- Материалы простые: cloth, leather, dull metal, old brass.
- Сначала статичные модели, анимации позже.

## Fallback

Если GLB не загрузился, движок обязан показывать procedural pawn, а не ломаться.

## Окружение

Первые наборы:

1. `port_rachel_kit.glb` — причал, склад, таможня, мокрые доски.
2. `fort_zarya_kit.glb` — ворота, канцелярия, стены, рынок.
3. `green_error_shrine.glb` — знак системных ошибок, терминал, обелиск.
4. `blue_sound_shrine.glb` — камертон, синий резонатор, дорожный знак.

## Звук

Первые WAV пользователя кладём в:

```text
public/assets/audio/ui_button_click.wav
public/assets/audio/start_game.wav
public/assets/audio/menu_ambience.wav
public/assets/audio/book_open.wav
public/assets/audio/page_turn.wav
public/assets/audio/quest_update.wav
public/assets/audio/quest_complete.wav
```

AudioManager должен:

- не ломать билд, если файла нет;
- сначала играть WebAudio fallback;
- при наличии WAV играть WAV;
- иметь категории `ui`, `ambience`, `quest`, `world`, `combat`.

## Что не делать

- Не вшивать base64-ассеты в основной JS.
- Не смешивать весь мир в один HTML.
- Не делать новый runtime-hotfix для каждой проблемы.
- Не использовать один огромный currentQuest как мозг игры.
