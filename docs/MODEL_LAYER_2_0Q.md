# Phoenix7 2.0Q — Model / GLB Layer

## Files

```text
src/phoenix_models.js
model_lab.html
```

## Goal

Prepare the game for real `.glb` assets without breaking the build when assets are missing.

The model layer does this:

```text
try GLB from model manifest
→ if GLB exists, show real model
→ if missing/error, show procedural fallback
→ game keeps running
```

## Test page

Open:

```text
http://localhost:8000/model_lab.html
```

Buttons test these slots:

- wanderingKnight
- greenKnight
- blueKnight
- oranTiv
- gerda
- portRachelKit
- fortZaryaKit
- greenShrine
- blueShrine

## Manifest

Uses:

```text
public/assets/models/model-manifest.json
```

Expected model paths:

```text
public/assets/models/wandering_knight_v0.glb
public/assets/models/green_knight_v0.glb
public/assets/models/blue_knight_v0.glb
public/assets/models/oran_tiv_v0.glb
public/assets/models/gerda_v0.glb
public/assets/models/port_worker_v0.glb
public/assets/models/port_rachel_props_v0.glb
public/assets/models/fort_zarya_props_v0.glb
```

## What is already supported

- Dynamic GLTFLoader import.
- Manifest loading.
- Per-model cache.
- Character fallback.
- Prop fallback.
- Shadows enabled on loaded GLB meshes.
- `window.PhoenixModels` installer helper.

## Why separate from Act 1

The current Act 1 Loop is playable. The model layer is isolated first so it can be tested without breaking gameplay.

## Next step

2.0R should integrate `PhoenixModels` into Act 1:

- replace Gerda procedural pawn with model/fallback;
- replace Oran procedural pawn;
- replace wandering knight;
- replace green/blue faction markers;
- keep old procedural NPCs as fallback.
