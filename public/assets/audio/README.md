# Audio assets

Сюда кладём WAV/OGG-файлы Phoenix7.

## Первый SFX-пак

Ожидаемые имена:

```text
ui_button_click.wav
start_game.wav
menu_ambience.wav
book_open.wav
page_turn.wav
quest_update.wav
quest_complete.wav
map_open.wav
port_rachel_ambience.wav
fort_zarya_ambience.wav
```

## Правило подключения

Игровой код должен:

1. Пробовать загрузить файл из `public/assets/audio/`.
2. Если файла нет — использовать WebAudio/procedural fallback.
3. Не ломать игру из-за отсутствующего звука.

## Категории

- `ui` — кнопки, книга, карта.
- `quest` — обновление/завершение квеста.
- `ambience` — фон порта, форта, дороги.
- `combat` — удары, блоки, опасность.
