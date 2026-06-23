export const ACT1_ROADMAP = {
  updatedAt: '2026-06-23',
  iteration: 'v3P2 Act 1 playable slice — locked checkpoint + route trader cycle',
  build: {
    title: 'The elder neuroslops chapter one: Ashgrave',
    subtitle: 'Act 1 Gameplay Layer Launcher',
    recommended: '/v3p2_ww2_live.html?ww2=1&act1=1',
    branch: 'feat/v3p2-ww2-arsenal-microbuild',
    pr: '#12 draft',
    mergePolicy: 'No blind merge: use this launcher for smoke, then merge only after conflicts/tests are clean.',
  },
  launchTargets: [
    { id: 'act1-live', title: 'Act 1 gameplay live build', href: '/v3p2_ww2_live.html?ww2=1&act1=1', primary: true, note: 'Locked playable slice with Ashgrave HUD and elder/trader cycle: староста → дорога → встреча → бронецель → лут → возврат.', checks: ['Start opens Act 1 route', 'new HUD visible', 'E opens elder panel', 'accept job', 'road encounter', 'vehicle target', 'collect crates', 'turn in'] },
    { id: 'vehicle-lab', title: 'Ashgrave modular vehicle lab', href: '/vehicle_lab.html', note: 'GLM V8 vehicle sandbox converted into local Phoenix7 modules: 10 vehicles, hitboxes, structural damage, rockets, loot.', checks: ['1–0 spawn vehicles', 'R/P rockets', 'T PT-rifle', 'Y MG burst', 'B hitboxes', 'L labels', 'C clear'] },
    { id: 'ww2-live-clean', title: 'WW2 live weapon test', href: '/v3p2_ww2_live.html?ww2=1', note: 'Same live build without act1 marker. Useful for weapon-only checks; press F2 to start route manually.', checks: ['F2 starts route', 'T targets', '9 Bazooka', 'U arsenal', 'R reload', 'V aim'] },
    { id: 'checkpoint-doc', title: 'Locked checkpoint notes', href: '/docs/ACT1_PLAYABLE_SLICE_CHECKPOINT.md', note: 'Text checkpoint for current slice: launch URL, locked loop, UI target, smoke checklist, next plan.', checks: ['launch URL', 'locked loop', 'smoke checklist', 'next plan'] },
  ],
  statusColumns: [
    { title: 'Playable now', items: [
      'New visible Ashgrave RPG HUD: quest block, location/coords, clock, vitals, weapon card, ammo card, hotbar',
      'Route elder dialogue panel: accept job, turn in crates, trade ammo, repair active firearm, road rumors',
      'First passable Act 1 loop: settlement quest giver table, road marker, road encounter, vehicle target, loot crates, return reward',
      'Morrowind-style inventory: item icons, character doll, visible slots, drag/drop equip and double-click equip',
      '23 WW2 weapons, fire modes, visible rockets, physical dropped weapons, class weapon progression',
      'Trophy parts from green crates can be sold at the elder/trader panel',
      'Modular GLM V8 vehicle lab with 10 procedural vehicles, hitboxes, structural damage and loot',
    ] },
    { title: 'Needs smoke before merge', items: [
      'UI smoke: new HUD visible after Start, old top/bottom HUD hidden, prompt still visible, I/J/U panels usable',
      'Trader smoke: E at elder opens panel, accept job button works, trade ammo buttons work, active firearm repair works',
      'Act1 route smoke: Start → E at camp → accept job → road encounter → clear enemies → stop vehicle → collect 3 crates → return → turn in',
      'Inventory smoke: drag weapon to left/right hand, armor to body slot, phase hand to spellHand, double-click equip',
      'Run npm run test:v3p2ww2 and npm run build locally',
    ] },
    { title: 'Do not merge blind', items: ['PR is intentionally draft while Act 1 gameplay layer is still moving fast', 'Current GitHub mergeable status must be rechecked after every commit', 'Resolve main conflicts and stale cache keys before merge', 'Update this roadmap after every meaningful iteration'] },
  ],
  roadmap: [
    { phase: '1. Weapon pack foundation', status: 'done', points: ['WW2 arsenal data', 'ammo types', 'inventory grant kit', 'live launcher controls'] },
    { phase: '2. RPG interface slice', status: 'in-progress', points: ['Ashgrave RPG HUD overhaul installed', 'Morrowind-style inventory installed', 'route elder/trader panel installed', 'next: full barter list and item sale rules'] },
    { phase: '3. Act 1 playable slice', status: 'in-progress', points: ['route loop installed', 'quest journal override', 'road encounter', 'vehicle encounter', 'loot crates and turn-in reward', 'checkpoint doc locked'] },
    { phase: '4. Vehicles and anti-vehicle layer', status: 'in-progress', points: ['GLM V8 lab modularized', '10 vehicle silhouettes', 'hitbox/raycast damage', 'next: bridge lab vehicles into Y/T Act 1 spawns and route vehicle encounter'] },
    { phase: '5. Physical weapon world', status: 'in-progress', points: ['drop/pickup', 'combat disarm', 'world value', 'rare NPC offers', 'next: NPC crowd behavior around campaigns'] },
  ],
  controls: [
    ['Start', 'enter play mode and auto-open Act 1 route if URL has act1=1'], ['F2', 'start/restart playable Act 1 route'], ['F3', 'debug teleport to current route objective'], ['J', 'Act 1 route journal'], ['I', 'Morrowind-style inventory / character doll'], ['E', 'quest interaction / pickup / elder panel'], ['1–0', 'quick WW2 weapon switch'], ['H', 'cycle fire mode'], ['R', 'reload / clear jam'], ['V', 'aim mode'], ['U', 'WW2 arsenal menu'], ['N', 'drop active weapon'],
  ],
  nextIteration: [
    'Bridge modular GLM vehicles into the main Act 1 route vehicle encounter.',
    'Replace counter-only trophy parts with real inventory/economy items.',
    'Add two or three road events between elder camp and vehicle target.',
    'Add save/load for route stage, dropped weapons, trader state and community campaigns.',
  ],
};
