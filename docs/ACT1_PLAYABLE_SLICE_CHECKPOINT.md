# Ashgrave Act 1 Playable Slice — Vehicle Combat Actor Checkpoint

Updated: 2026-06-25
Branch: `feat/vehicle-combat-actor-pass`
Base: `main`

## Current canonical launch

Use the launcher:

```bash
npm run dev:act1
```

Then click **Играть Act 1 квест**.

Direct gameplay URL:

```text
/v3p2_ww2_live.html?ww2=1&act1=1
```

Cache key for this vehicle pass:

```text
vehicle_combat_actor_1
```

## Locked gameplay loop

The current playable slice must remain:

1. Start near the route elder camp.
2. Walk to **Староста маршрута**.
3. Press **E** at the table.
4. Use the elder dialogue panel to accept the route job.
5. Follow the road marker.
6. Inspect optional road events.
7. Clear the road encounter.
8. Fight **Puma VehicleCombatActor**.
9. Destroy vehicle, leave wreck, spawn green crates outside hull.
10. Pick up three green crates with **E**.
11. Return to the elder.
12. Press **E** and turn in the route.
13. See completion impact.

## Vehicle Combat Actor pass

New files:

```text
src/game/v3/vehicles/vehicleCombatActor.js
src/game/v3/vehicles/vehicleCombatSystem.js
src/game/v3/core/engineVehicleCombatExtensions.js
```

Purpose:

- stop treating Act 1 Puma as only monster/userData/repair target;
- use GLM `createVehicle(type)` only as visual backend;
- keep combat state in `VehicleCombatActor`;
- register vehicles in `VehicleCombatSystem`;
- bridge player weapon shots into vehicle raycast/part damage;
- emit vehicle events: hit, armor blocked, immobilized, burning, destroyed;
- let Act 1 route listen to vehicle destruction and spawn crates around wreck;
- keep old repair layers as fallback only.

## Vehicle actor state

`VehicleCombatActor` owns:

```text
id, type, root/model, hp/hpMax, armor, baseMobility, mobility,
faction, state, parts, lastHitPart, lastDamageReason, questTags, wreck
```

States:

```text
active → immobilized → burning → destroyed
```

Wreck is represented as a prop/object created from the actor root. The actor state remains `destroyed`, not immediately overwritten to `wreck`.

## Weapon behavior target

```text
M1911 / SMG / rifle → armor ping or very small chip
MG / BAR / Bren / MG42 → wheel/soft-target chip
PTRD / Boys → part damage, engine/wheels, immobilize chance
Bazooka / Panzerfaust → heavy hull damage, burning/destroyed
Q during Act 1 vehicle stage → debug emergency hit
```

## Smoke checklist for vehicle pass

```text
Ctrl+F5
F2 start Act 1
E at elder table, accept route
clear road encounter
Puma appears with prompt: VehicleCombatActor puma: HP/state/last part
F8 shows vehicle labels/source
M1911 or SMG gives PING / armor blocked
PTRD or Boys changes lastHitPart and HP
Bazooka or Panzerfaust does heavy damage
vehicleDestroyed event fires
Puma remains as wreck/prop
three crates spawn around wreck, not inside hull
E collects crates
return to elder
completion screen still works
F2 restart clears old Act 1 vehicle actor from VehicleCombatSystem registry
console: PHX_V3_ENGINE.getVehicleCombatDiagnostics()
console: PHX_V3_ENGINE.damageAct1VehicleDebug('bazooka')
```

## Do not merge blind

Before merge:

- run browser smoke;
- run `npm run test:v3p2ww2`;
- run `npm run build`;
- verify Act 1 can still be completed;
- verify old repair layers are fallback, not primary vehicle combat path;
- verify F2 restart does not leave stale vehicle actors.

## Next plan after this pass

1. Move non-Puma vehicles into `VehicleCombatActor` too.
2. Add real explosion bridge for rockets and grenades.
3. Add visible hit feedback: sparks, armor ping, smoke, burning.
4. Add vehicle UI card or debug mini-panel.
5. Isolate legacy vehicles into sandbox/debug only.
6. Replace repair layers after VehicleCombatActor proves stable.
