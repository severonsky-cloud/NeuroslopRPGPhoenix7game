# Phoenix7 v3P2 — WW2 Arsenal Integration Notes

This branch adds the first playable WW2 weapon data pack for the v3 arsenal layer.

## Added

- `src/game/v3/combat/ww2ArsenalData.js`
  - new ammo types: `pistol9`, `pistol45`, `pistol762`, `rifle3006`, `rifle792`, `rifle303`, `rifle762r`, `rifle77`, `kurz792`, `atrifle`, `rocketAT`, `thrown`;
  - new archetypes: pistol, rifle, SMG, shotgun, LMG, AT launcher, AT rifle, thrown prototype;
  - 23 first-pass playable weapons with clip size, recoil, spread, velocity, reload timing, jam profile, slots, role notes.
- `src/game/v3/combat/arsenal.js`
  - imports and exposes the WW2 ammo, archetypes, and weapons through the existing `AMMO_TYPES`, `WEAPON_ARCHETYPES`, and `ARSENAL` exports.
- `src/game/v3/items/inventory.js`
  - exposes the WW2 weapons as inventory items;
  - adds a WW2 test loadout to the default inventory;
  - adds `grantWw2TestKit()` for debug/test restoration.
- `src/game/v3/combat/firearmState.js`
  - supports per-weapon `reloadSeconds`, `jamBase`, `conditionWear`, and WW2 archetype-specific defaults.
- `tools/v3p2_ww2_arsenal_smoke.mjs`
  - Node smoke test: verifies ammo, archetypes, item defs, firing, reload, and legacy M1 compatibility.
- `tools/v3p2_ww2_micro_build.html`
  - standalone browser micro build for weapon/enemy testing without loading the full map.

## Run

```bash
npm run test:v3p2ww2
npm run dev
```

Then open:

```text
/tools/v3p2_ww2_micro_build.html
```

## Current limitations

- Most new weapons reuse the existing generic first-person firearm viewmodel. They are functional, but their model silhouettes still need a second pass.
- `mk2GrenadeProto` and `molotovProto` are marked as throw prototypes. They use the same fire/reload state layer for now; true arc physics, splash damage, and fire patches should be added in the next combat pass.
- `Panzerfaust 30` currently consumes `rocketAT` as a test charge instead of being destroyed as a one-shot item.
