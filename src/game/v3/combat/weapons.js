export const WEAPONS = {
  fists: { key: '1', name: 'Кулаки', kind: 'melee', damage: 9, range: 1.7, stamina: 7, phase: 0, ammo: null, hold: 'fists', cooldown: 0.40, arc: 1.35 },
  phase: { key: '2', name: 'Фазовый удар рукой', kind: 'phase', damage: 30, range: 3.8, stamina: 12, phase: 18, ammo: null, hold: 'phase', cooldown: 0.52, arc: 1.55 },
  bastard: { key: '3', name: 'Бастард', kind: 'blade', damage: 37, range: 4.0, stamina: 18, phase: 0, ammo: null, hold: 'heavyBlade', cooldown: 0.72, arc: 1.35 },
  rapier: { key: '4', name: 'Шпага', kind: 'blade', damage: 22, range: 4.4, stamina: 10, phase: 0, ammo: null, hold: 'rapier', cooldown: 0.42, arc: 0.95 },
  colt: { key: '5', name: 'Кольт 1917', kind: 'gun', damage: 30, range: 42, stamina: 4, phase: 0, ammo: 'colt', hold: 'pistol', cooldown: 0.38 },
  m1: { key: '6', name: 'M1 Гаранд', kind: 'gun', damage: 42, range: 64, stamina: 7, phase: 0, ammo: 'm1', hold: 'rifle', cooldown: 0.55 },
  bren: { key: '7', name: 'Брен', kind: 'gun', damage: 19, range: 48, stamina: 13, phase: 0, ammo: 'bren', burst: 3, hold: 'lmg', cooldown: 0.72 },
};

export function weaponByDigit(code) {
  const map = { Digit1: 'fists', Digit2: 'phase', Digit3: 'bastard', Digit4: 'rapier', Digit5: 'colt', Digit6: 'm1', Digit7: 'bren' };
  return map[code] || null;
}
