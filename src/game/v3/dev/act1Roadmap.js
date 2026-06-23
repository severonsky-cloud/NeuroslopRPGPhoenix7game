export const ACT1_ROADMAP = {
  updatedAt: '2026-06-23',
  iteration: 'v3P2 Act 1 playable slice — route, ambush, vehicle, loot return',
  build: {
    title: 'The elder neuroslops chapter one: Ashgrave',
    subtitle: 'Act 1 Gameplay Layer Launcher',
    recommended: '/v3p2_ww2_live.html?ww2=1&act1=1',
    branch: 'feat/v3p2-ww2-arsenal-microbuild',
    pr: '#12 draft',
    mergePolicy: 'No blind merge: use this launcher for smoke, then merge only after conflicts/tests are clean.',
  },
  launchTargets: [
    { id: 'act1-live', title: 'Act 1 gameplay live build', href: '/v3p2_ww2_live.html?ww2=1&act1=1', primary: true, note: 'Playable slice: староста → дорога → засада → бронецель → лут → возврат.', checks: ['Start auto-opens Act 1 route', 'E at camp', 'fight ambush', 'kill vehicle', 'collect crates', 'return'] },
    { id: 'vehicle-lab', title: 'Ashgrave modular vehicle lab', href: '/vehicle_lab.html', note: 'GLM V8 vehicle sandbox converted into local Phoenix7 modules: 10 vehicles, hitboxes, structural damage, rockets, loot.', checks: ['1–0 spawn vehicles', 'R/P rockets', 'T PT-rifle', 'Y MG burst', 'B hitboxes', 'L labels', 'C clear'] },
    { id: 'ww2-live-clean', title: 'WW2 live weapon test', href: '/v3p2_ww2_live.html?ww2=1', note: 'Same live build without act1 marker. Useful for weapon-only checks.', checks: ['T targets', '9 Bazooka', 'U Panzerfaust/PTRD/Boys AT', 'R reload', 'V aim'] },
    { id: 'ww2-micro', title: 'WW2 arsenal micro data check', href: '/tools/v3p2_ww2_micro_build.html', note: 'Fast browser page for data sanity, not the full RPG layer.', checks: ['23 weapons', '12 ammo types', 'icons', 'roles'] },
  ],
  statusColumns: [
    { title: 'Playable now', items: [
      'First passable Act 1 loop: settlement quest giver table, road marker, ambush, vehicle target, loot crates, return reward',
      'Morrowind-style inventory: item icons, character doll, visible slots, drag/drop equip and double-click equip',
      '23 WW2 weapons, fire modes, visible rockets, physical dropped weapons, class weapon progression',
      'NPC weapon offers tuned rarer and gated to truly valuable / prestige weapons',
      'Modular GLM V8 vehicle lab with 10 procedural vehicles, hitboxes, structural damage and loot',
    ] },
    { title: 'Needs smoke before merge', items: [
      'Act1 route smoke: Start → E at camp → road ambush → kill raiders → destroy vehicle → collect 3 crates → return to camp',
      'Inventory smoke: drag weapon to left/right hand, armor to body slot, phase hand to spellHand, double-click equip',
      'Check vehicle target stability and that Bazooka/Panzerfaust/PTRD/Boys AT all work during the route',
      'Check J journal during each route stage and F3 debug teleport',
      'Run npm run test:v3p2ww2 and npm run build locally',
    ] },
    { title: 'Do not merge blind', items: ['PR is intentionally draft while Act 1 gameplay layer is still moving fast', 'Current GitHub mergeable status must be rechecked after every commit', 'Resolve main conflicts and stale cache keys before merge', 'Update this roadmap after every meaningful iteration'] },
  ],
  roadmap: [
    { phase: '1. Weapon pack foundation', status: 'done', points: ['WW2 arsenal data', 'ammo types', 'inventory grant kit', 'live launcher controls'] },
    { phase: '2. RPG interface slice', status: 'in-progress', points: ['Morrowind-style inventory installed', 'drag/drop paper doll slots', 'icons and category filters', 'next: trader screen in same visual language'] },
    { phase: '3. Act 1 playable slice', status: 'in-progress', points: ['route loop installed', 'quest journal override', 'ambush encounter', 'vehicle encounter', 'loot crates and turn-in reward', 'next: real dialogue/trader pass'] },
    { phase: '4. Vehicles and anti-vehicle layer', status: 'in-progress', points: ['GLM V8 lab modularized', '10 vehicle silhouettes', 'hitbox/raycast damage', 'next: bridge lab vehicles into Y/T Act 1 spawns'] },
    { phase: '5. Physical weapon world', status: 'in-progress', points: ['drop/pickup', 'combat disarm', 'world value', 'rare NPC offers', 'next: NPC crowd behavior around campaigns'] },
  ],
  controls: [
    ['Start', 'enter play mode and auto-open Act 1 route if URL has act1=1'], ['F2', 'start/restart playable Act 1 route'], ['F3', 'debug teleport to current route objective'], ['J', 'Act 1 route journal'], ['I', 'Morrowind-style inventory / character doll'], ['E', 'quest interaction / pickup / talk'], ['1–0', 'quick WW2 weapon switch'], ['H', 'cycle fire mode'], ['R', 'reload / clear jam'], ['V', 'aim mode'], ['U', 'WW2 arsenal menu'], ['N', 'drop active weapon'],
  ],
  nextIteration: [
    'Replace placeholder route table with real dialogue/trader panel in the same classic RPG UI language.',
    'Bridge modular GLM vehicles into the main Act 1 Y/T vehicle spawn pipeline.',
    'Connect vehicle destruction loot to Act 1 inventory/economy and weapon-class progression more deeply.',
    'Add save/load for route stage, dropped weapons and community campaigns.',
  ],
};
