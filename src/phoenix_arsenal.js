// Phoenix7 2.0T Arsenal Data
// Abstract game-balance data for fictional RPG use only.

export const PHOENIX_ARSENAL = {
  fists: { id: 'fists', name: 'Кулаки', kind: 'melee', damage: 10, range: 1.35, cost: { st: 7, ph: 0 }, ammo: null },
  phaseStrike: { id: 'phaseStrike', name: 'Фазовый удар рукой', kind: 'phase_melee', damage: 24, range: 2.25, cost: { st: 10, ph: 18 }, ammo: null },
  bastard: { id: 'bastard', name: 'Бастард', kind: 'sword_heavy', damage: 31, range: 2.45, cost: { st: 17, ph: 0 }, ammo: null },
  rapier: { id: 'rapier', name: 'Шпага', kind: 'sword_light', damage: 19, range: 2.85, cost: { st: 10, ph: 0 }, ammo: null },
  revolver1917: { id: 'revolver1917', name: 'Кольт 1917', kind: 'sidearm_relic', damage: 28, range: 22, cost: { st: 4, ph: 0 }, ammo: 'sidearmSupply' },
  oldRifle: { id: 'oldRifle', name: 'M1 Гаранд', kind: 'rifle_relic', damage: 38, range: 36, cost: { st: 7, ph: 0 }, ammo: 'rifleSupply' },
  brenRelic: { id: 'brenRelic', name: 'Пулемёт Брен', kind: 'support_relic', damage: 18, range: 30, burst: 3, cost: { st: 13, ph: 0 }, ammo: 'supportSupply' },
};

export const PHOENIX_SUPPLIES = {
  sidearmSupply: { id: 'sidearmSupply', name: 'боезапас к Кольту 1917', short: 'Кольт' },
  rifleSupply: { id: 'rifleSupply', name: 'боезапас к M1 Гаранд', short: 'винт.' },
  supportSupply: { id: 'supportSupply', name: 'боезапас к Брену', short: 'Брен' },
};

export const PHOENIX_LOOT = {
  road_mutant: [ ['sidearmSupply', 1, 5, 0.55], ['rifleSupply', 1, 4, 0.35], ['credits', 1, 6, 0.8], ['roadToken', 1, 1, 0.25] ],
  sandy_carrion: [ ['sidearmSupply', 1, 3, 0.35], ['supportSupply', 3, 10, 0.28], ['credits', 1, 4, 0.65] ],
  red_rat: [ ['rifleSupply', 2, 8, 0.55], ['supportSupply', 2, 12, 0.45], ['canalTag', 1, 1, 0.4] ],
  phase_echo: [ ['sidearmSupply', 1, 2, 0.25], ['rifleSupply', 1, 6, 0.3], ['phaseResidue', 1, 2, 0.75] ],
};

export function rollPhoenixLoot(tableKey, rng = Math.random) {
  const table = PHOENIX_LOOT[tableKey] || PHOENIX_LOOT.road_mutant;
  const out = [];
  for (const row of table) {
    const [item, min, max, chance] = row;
    if (rng() <= chance) out.push({ item, count: min + Math.floor(rng() * (max - min + 1)) });
  }
  if (!out.length) out.push({ item: 'credits', count: 1 });
  return out;
}

export function describeLootItem(id) {
  return PHOENIX_SUPPLIES[id]?.name || ({ credits: 'кредиты', roadToken: 'сломанный жетон дороги', canalTag: 'канальная бирка', phaseResidue: 'фазовый осадок' }[id] || id);
}
