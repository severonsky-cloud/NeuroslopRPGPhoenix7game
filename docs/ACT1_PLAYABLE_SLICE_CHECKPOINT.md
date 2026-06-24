# Ashgrave Act 1 Playable Slice — Integrated Checkpoint

Updated: 2026-06-24
Branch: `feat/v3p2-ww2-arsenal-microbuild`
PR: `#12 draft`

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

Cache key for this integrated iteration:

```text
v3p2_act1_integrated_1
```

## Locked gameplay loop

The current playable slice is:

1. Start near the route elder camp.
2. Walk to **Староста маршрута**.
3. Press **E** at the table.
4. Use the elder dialogue panel to accept the route job.
5. Follow the road marker.
6. Inspect optional road events: abandoned crate, note sign, injured caravan man, burned wagon.
7. Clear the road encounter.
8. Stop the GLM modular **Puma** vehicle target.
9. Pick up three green crates with **E**.
10. Return to the elder.
11. Press **E** and turn in the route.
12. See completion impact: reward, route reputation, camp changes, journal status.

## Integrated modules added on 2026-06-24

### 1. Universal Ashgrave window shell

File:

```text
src/game/v3/core/engineAshgraveWindowExtensions.js
```

Purpose:

- draggable panel header;
- resize handle in the lower-right corner;
- saved window size/position in `localStorage`;
- double-click header resets layout;
- viewport clamp;
- scrollbars only inside the window body as fallback.

Applies through `hud.openPanel`, so inventory, journal, trader, elder and system panels use the same shell.

### 2. Stronger quest completion

File:

```text
src/game/v3/core/engineAct1CompletionExtensions.js
```

Purpose:

- completion screen after route turn-in;
- route reputation +1;
- trader unlock tier flag;
- extra completion bonus;
- camp visual changes: flag, salvage rack, guard post;
- journal status: route closed.

### 3. Enemy debug and cleanup

File:

```text
src/game/v3/core/engineEntityDebugExtensions.js
```

Purpose:

- **F8** toggles debug labels;
- labels show id, hp, alive/dead, faction/source;
- F2 restart hard-clears stale route spawns;
- invalid/dead route enemies are cleaned up;
- route stage should count only route-owned entities.

### 4. GLM vehicle bridge into Act 1

File:

```text
src/game/v3/core/engineAct1VehicleBridgeExtensions.js
```

Purpose:

- route vehicle is now a GLM modular `createVehicle('puma')` instance;
- vehicle has hitboxes/parts from `ashgraveVehicleLabCore.js`;
- player shots bridge into `getVehicleHit` and `applyVehicleDamage`;
- small arms mostly block on armor;
- Bazooka/Panzerfaust/PTRD become meaningful;
- destroyed vehicle remains as a wreck;
- crates become available after destruction.

### 5. Road events

File:

```text
src/game/v3/core/engineAct1RoadEventsExtensions.js
```

Events:

- abandoned crate;
- road note sign;
- injured caravan man;
- burned wagon.

These are small route beats between the elder camp and the vehicle target. They add ammo, clues, logs or trophy parts.

### 6. Aggregator

File:

```text
src/game/v3/core/engineAct1IntegratedExtensions.js
```

This installs the five integrated extension layers from `main.js` so the build behaves as one slice.

## Locked UI layer

The current UI target is the **Ashgrave RPG HUD**:

- upper-left quest block;
- top center location/coordinates;
- top-right clock;
- lower-left HP/ST/PH bars;
- lower-right weapon/ammo card;
- bottom hotbar with item icons;
- old top/bottom HUD hidden;
- Morrowind-style inventory with character doll and drag/drop equip;
- draggable/resizable panel windows.

## Hub services

The route elder panel includes:

- route job accept/turn-in;
- ammo trading;
- active firearm repair;
- road rumors;
- sale of trophy parts from green crates and road salvage.

## Smoke checklist

```text
Ctrl+F5
Start
new Ashgrave HUD visible
E at elder table opens dialogue panel
Window header can be dragged
Window lower-right corner can resize
Double-click window header resets layout
Accept route job
I opens character doll inventory
road events can be inspected with E
road marker advances stage
road encounter spawns and clears
F8 toggles debug labels over enemies/entities
vehicle target spawns as GLM Puma
small arms mostly block on armor
Bazooka/PTRD/Panzerfaust damage vehicle hitboxes
vehicle destruction leaves wreck
three green crates can be collected with E
return to elder opens turn-in panel
completion screen appears
camp flag/salvage/guard changes appear
trade/repair buttons work
J journal includes route + road events + completion status
F2 restarts route and clears old spawns
F3 teleports to objective
```

## Do not merge blind

This is still a draft gameplay layer. Before merge:

- recheck PR mergeability;
- run browser smoke;
- run `npm run test:v3p2ww2`;
- run `npm run build`;
- resolve branch conflicts if GitHub reports `mergeable: false`;
- only then consider merging.

## Next plan

1. Run local browser smoke and fix console/runtime errors.
2. Replace counter-only trophy parts with real inventory/economy items.
3. Expand trader tier after completion with named goods and prices.
4. Add save/load for route stage, dropped weapons, trader state, and community campaigns.
5. Polish NPC yaw-only facing and role-based enemy movement so they stop walking backwards.
