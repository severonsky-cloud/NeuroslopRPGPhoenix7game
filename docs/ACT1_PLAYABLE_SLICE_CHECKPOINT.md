# Ashgrave Act 1 Playable Slice — Locked Checkpoint

Updated: 2026-06-23
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

## Locked gameplay loop

The current playable slice is:

1. Start near the route elder camp.
2. Walk to **Староста маршрута**.
3. Press **E** at the table.
4. Use the elder dialogue panel to accept the route job.
5. Follow the road marker.
6. Clear the road encounter.
7. Stop the vehicle target.
8. Pick up three green crates with **E**.
9. Return to the elder.
10. Press **E** and turn in the route.

## Locked UI layer

The current UI target is the **Ashgrave RPG HUD**:

- upper-left quest block;
- top center location/coordinates;
- top-right clock;
- lower-left HP/ST/PH bars;
- lower-right weapon/ammo card;
- bottom hotbar with item icons;
- old top/bottom HUD hidden;
- Morrowind-style inventory with character doll and drag/drop equip.

## Newly added hub services

The route elder panel now includes:

- route job accept/turn-in;
- ammo trading;
- active firearm repair;
- road rumors;
- sale of trophy parts from green crates.

## Smoke checklist

```text
Ctrl+F5
Start
new Ashgrave HUD visible
E at elder table opens dialogue panel
Accept route job
I opens character doll inventory
road marker advances stage
road encounter spawns and clears
vehicle target spawns
green crates can be collected with E
return to elder opens turn-in panel
trade/repair buttons work
J journal still works
F2 restarts route
F3 teleports to objective
```

## Do not merge blind

This is still a draft gameplay layer. Before merge:

- recheck PR mergeability;
- run browser smoke;
- run `npm run test:v3p2ww2`;
- run `npm run build`;
- resolve branch conflicts if GitHub reports `mergeable: false`.

## Next plan

1. Bridge modular GLM vehicle lab vehicles into the main Act 1 route encounter.
2. Make vehicle destruction loot use real inventory/economy items, not only counters.
3. Add two or three road events between the elder camp and the vehicle target.
4. Add save/load for route stage, dropped weapons, trader state, and community campaigns.
