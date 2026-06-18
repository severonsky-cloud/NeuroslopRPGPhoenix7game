import { ARSENAL, WEAPON_ARCHETYPES } from './arsenal.js';

const keyMap = {
  fists: '1', phase: '2', bastard: '3', rapier: '4', colt: '5', m1: '6', bren: '7',
  boardingAxe: null, glassDagger: null, trenchShotgun: null, caravanCarbine: null,
};

function compatibleWeapon(id, data) {
  const arch = WEAPON_ARCHETYPES[data.archetype] || {};
  const cls = arch.class || 'melee';
  const kind = cls === 'firearm' ? 'gun' : cls === 'phase' ? 'phase' : data.archetype === 'unarmed' ? 'melee' : 'blade';
  const primary = data.attacks?.primary || {};
  return {
    key: keyMap[id],
    ...data,
    kind,
    hold: arch.model || data.archetype,
    ammo: data.ammoType || null,
    phase: data.phase || 0,
    arc: primary.arc ?? data.arc ?? 1.0,
    range: primary.range ?? data.range,
    recoil: data.recoil ?? 0.12,
    spread: data.spread ?? 0,
    muzzleVelocity: data.muzzleVelocity ?? 0,
    gravity: data.gravity ?? 0,
  };
}

export const WEAPONS = Object.fromEntries(Object.entries(ARSENAL).map(([id, data]) => [id, compatibleWeapon(id, data)]));

export function weaponByDigit(code) {
  const map = { Digit1: 'fists', Digit2: 'phase', Digit3: 'bastard', Digit4: 'rapier', Digit5: 'colt', Digit6: 'm1', Digit7: 'bren' };
  return map[code] || null;
}

export function weaponDisplay(id) {
  const w = WEAPONS[id];
  return w ? `${w.icon || ''} ${w.name}` : id;
}
