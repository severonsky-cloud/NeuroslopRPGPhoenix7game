export const ACT1_ROADMAP = {
  updatedAt: '2026-06-23',
  iteration: 'v3P2 Act 1 gameplay slice — Morrowind-style inventory pass',
  build: {
    title: 'The elder neuroslops chapter one: Ashgrave',
    subtitle: 'Act 1 Gameplay Layer Launcher',
    recommended: '/v3p2_ww2_live.html?ww2=1&act1=1',
    branch: 'feat/v3p2-ww2-arsenal-microbuild',
    pr: '#12 draft',
    mergePolicy: 'No blind merge: use this launcher for smoke, then merge only after conflicts/tests are clean.',
  },
  launchTargets: [
    { id: 'act1-live', title: 'Act 1 gameplay live build', href: '/v3p2_ww2_live.html?ww2=1&act1=1', primary: true, note: 'Main working build: WW2 arsenal, physical weapons, class progression, Morrowind-style inventory, living-world offers.', checks: ['Start', 'I inventory', 'drag item to doll', '1–0 weapons', 'N drop weapon', 'E pickup / talk', 'Y vehicles'] },
    { id: 'vehicle-lab', title: 'Ashgrave modular vehicle lab', href: '/vehicle_lab.html', note: 'GLM V8 vehicle sandbox converted into local Phoenix7 modules: 10 vehicles, hitboxes, structural damage, rockets, loot.', checks: ['1–0 spawn vehicles', 'R/P rockets', 'T PT-rifle', 'Y MG burst', 'B hitboxes', 'L labels', 'C clear'] },
    { id: 'ww2-live-clean', title: 'WW2 live weapon test', href: '/v3p2_ww2_live.html?ww2=1', note: 'Same live build without act1 marker. Useful for weapon-only checks.', checks: ['T targets', '9 Bazooka', 'U Panzerfaust/PTRD/Boys AT', 'R reload', 'V aim'] },
    { id: 'ww2-micro', title: 'WW2 arsenal micro data check', href: '/tools/v3p2_ww2_micro_build.html', note: 'Fast browser page for data sanity, not the full RPG layer.', checks: ['23 weapons', '12 ammo types', 'icons', 'roles'] },
    { id: 'legacy-v3l', title: 'Legacy v3L reference build', href: '/v3l.html', note: 'Reference page for old weapon/hands feel if something regresses.', checks: ['old viewmodel', 'old HUD', 'old inventory flow'] },
  ],
  statusColumns: [
    {
      title: 'Playable now',
      items: [
        '23 WW2 weapons wired into arsenal/inventory/ammo',
        'SEMI / BURST×3 / AUTO modes on automatic firearms',
        'Visible ballistic rockets for Bazooka/Panzerfaust with direct + splash damage',
        'Class-based weapon progression: pistols, SMGs, rifles, shotguns, MGs, launchers, AT rifles, throwables',
        'Morrowind-style inventory: item icons, character doll, visible slots, drag/drop equip and double-click equip',
        'Physical dropped weapons: N drop, E pickup, combat disarm chance',
        'NPC weapon offers tuned rarer and gated to truly valuable / prestige weapons',
        'Modular GLM V8 vehicle lab with 10 procedural vehicles, hitboxes, structural damage and loot',
        'Race-aware first-person arms and reload poses',
      ],
    },
    {
      title: 'Needs smoke before merge',
      items: [
        'Inventory smoke: drag weapon to left/right hand, armor to body slot, phase hand to spellHand, double-click equip',
        'Browser smoke for all quick weapons 1–0 after latest class-based progression pass',
        'Vehicle lab smoke: spawn all vehicles, hitboxes toggle, rockets, AT rifle, MG burst, fuel truck secondary blast',
        'Check that MP40 and PPSh both level Pistols-MGs / Пистолеты-пулемёты, not individual weapon samples',
        'Check dropped weapon pickup after switching hands and after combat disarm',
        'Run npm run test:v3p2ww2 and npm run build locally',
      ],
    },
    {
      title: 'Do not merge blind',
      items: ['PR is intentionally draft while Act 1 gameplay layer is still moving fast', 'Current GitHub mergeable status must be rechecked after every commit', 'Resolve main conflicts and stale cache keys before merge', 'Update this roadmap after every meaningful iteration'],
    },
  ],
  roadmap: [
    { phase: '1. Weapon pack foundation', status: 'done', points: ['WW2 arsenal data', 'ammo types', 'inventory grant kit', 'live launcher controls'] },
    { phase: '2. RPG interface slice', status: 'in-progress', points: ['Morrowind-style inventory installed', 'drag/drop paper doll slots', 'icons and category filters', 'next: quest/looting/trader screen in same visual language'] },
    { phase: '3. Vehicles and anti-vehicle layer', status: 'in-progress', points: ['GLM V8 lab modularized', '10 vehicle silhouettes', 'hitbox/raycast damage', 'structural wheels/legs/turret damage', 'next: bridge lab vehicles into Y/T Act 1 spawns'] },
    { phase: '4. Physical weapon world', status: 'in-progress', points: ['drop/pickup', 'combat disarm', 'world value', 'rare NPC offers', 'quieter community fund campaigns', 'next: NPC crowd behavior around campaigns'] },
    { phase: '5. Weapon models and animations', status: 'in-progress', points: ['first polish layer for model details', 'moving parts', 'race-aware hands', 'next: family-specific hand choreography and third-person carried weapons'] },
    { phase: '6. Act 1 playable slice', status: 'next', points: ['zone-to-zone route', 'quest hooks', 'traders/stashes', 'loot economy', 'enemy loadout balance', 'save/load for dropped weapons and campaigns'] },
  ],
  controls: [
    ['Start', 'enter play mode'], ['I', 'Morrowind-style inventory / character doll'], ['F1', 'jump through debug zones'], ['1–0', 'quick WW2 weapon switch'], ['H', 'cycle fire mode'], ['Hold LMB', 'AUTO fire if supported'], ['R', 'reload / clear jam'], ['V', 'aim mode'], ['U', 'WW2 arsenal menu'], ['G', 'restock kit/ammo'], ['T', 'targets + large vehicles'], ['Y', 'large vehicles only'], ['N', 'drop active weapon'], ['E', 'pickup dropped weapon / discuss weapon offer near NPC'],
  ],
  nextIteration: [
    'Bridge modular GLM vehicles into the main Act 1 Y/T vehicle spawn pipeline.',
    'Build the first passable route: intro settlement → road fight → vehicle encounter → loot/trader return.',
    'Quest journal and loot/trader panels in the same classic RPG UI language.',
    'Connect vehicle destruction loot to Act 1 inventory/economy and weapon-class progression.',
  ],
};
