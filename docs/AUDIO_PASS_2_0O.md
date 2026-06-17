# Phoenix7 2.0O — Audio + Dev Toolkit

## Files

```text
src/phoenix_audio.js
audio_lab.html
```

## What this adds

A safe audio layer for Phoenix7.

The manager tries to use real audio files from:

```text
public/assets/audio/audio-manifest.json
```

If a file is missing, it uses procedural WebAudio fallback instead.

This means the game should never break just because a WAV file is not uploaded yet.

## Test page

Open:

```text
http://localhost:8000/audio_lab.html
```

Buttons:

- UI click.
- Start game.
- Book open.
- Page turn.
- Quest update.
- Quest complete.
- Map open.
- Port ambience.
- Stop ambience.

## Next integration target

2.0P should connect `PhoenixAudio` into `act1_integrated.html` and/or `act1_loop.html`:

- click sound on UI buttons;
- start-game swell when Act 1 begins;
- book-open sound on `J`;
- map-open sound on `M`;
- quest-update sound when stage changes;
- quest-complete sound when Gerda rewards the player;
- ambience by location: Port Rachel / Fort Zarya / road.

## Real WAV files

Expected filenames from `audio-manifest.json`:

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

## Current limitation

Binary WAV upload is not handled through the simple text-file GitHub action. The code and manifest are ready, but actual WAV files should be uploaded through GitHub web UI, Git LFS, or a binary-capable commit flow.
