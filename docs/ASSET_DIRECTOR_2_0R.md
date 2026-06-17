# Phoenix7 2.0R — Asset Director

## File

```text
act1_asset_director.html
```

## Purpose

This is a safe launch director that combines:

- character creation;
- audio manager;
- model manager;
- model manifest check;
- procedural fallback preview;
- compatible Act 1 save;
- Act 1 Loop launch.

## Why this exists

`act1_loop.html` is already playable and large. Editing it directly for every new system is risky.

2.0R creates a controlled staging layer before direct integration:

```text
Asset Director
→ checks audio layer
→ checks model layer
→ creates compatible save
→ launches Act 1 Loop
```

## What is connected

### Audio

Uses:

```text
src/phoenix_audio.js
```

- start sound;
- UI click;
- book/map/task sounds through iframe hooks;
- port ambience.

### Models

Uses:

```text
src/phoenix_models.js
public/assets/models/model-manifest.json
```

The preview tries to load these slots:

- wanderingKnight;
- greenKnight;
- blueKnight;
- oranTiv;
- gerda.

If GLB is missing, the procedural fallback appears.

## Launch

```bash
py -m http.server 8000
```

Open:

```text
http://localhost:8000/act1_asset_director.html
```

## Next step: 2.0S

Direct Act 1 integration:

- replace hardcoded Gerda pawn with `PhoenixModels.character('gerda')`;
- replace Oran with `PhoenixModels.character('oranTiv')`;
- replace wandering knight with `PhoenixModels.character('wanderingKnight')`;
- replace green/blue shrine props with `PhoenixModels.prop()`;
- keep current procedural geometry as fallback.
