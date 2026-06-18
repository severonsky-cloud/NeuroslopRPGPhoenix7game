export const AMMO_TYPES = {
  revolver: { name: '.45 revolver', icon: '◉', price: 2, color: 0xd8b56e },
  rifle: { name: 'rifle clips', icon: '▣', price: 3, color: 0xc8b27a },
  lmg: { name: 'Bren magazines', icon: '▤', price: 5, color: 0xb99a5a },
  scatter: { name: 'shot shells', icon: '⬤', price: 4, color: 0xb45a3c },
  phaseCell: { name: 'phase cells', icon: '✦', price: 8, color: 0x8a78ff },
};

export const WEAPON_ARCHETYPES = {
  unarmed: { class: 'melee', icon: '拳', model: 'fists' },
  phase: { class: 'phase', icon: '✦', model: 'phaseHand' },
  sword: { class: 'melee', icon: '†', model: 'sword' },
  rapier: { class: 'melee', icon: '⌁', model: 'rapier' },
  axe: { class: 'melee', icon: '⚒', model: 'axe' },
  dagger: { class: 'melee', icon: '∕', model: 'dagger' },
  revolver: { class: 'firearm', icon: '⌐', model: 'revolver' },
  rifle: { class: 'firearm', icon: '—', model: 'rifle' },
  lmg: { class: 'firearm', icon: '▰', model: 'lmg' },
  shotgun: { class: 'firearm', icon: '≡', model: 'shotgun' },
  carbine: { class: 'firearm', icon: '–', model: 'carbine' },
};

export const ARSENAL = {
  fists: {
    id: 'fists', name: 'Кулаки', archetype: 'unarmed', icon: '✊', damage: 9, range: 1.7, stamina: 7, cooldown: 0.38,
    attacks: { primary: { name: 'удар', type: 'punch', damageMul: 1, range: 1.7, arc: 1.35, impact: 'blunt' } },
  },
  phase: {
    id: 'phase', name: 'Фазовая рука', archetype: 'phase', icon: '✦', damage: 30, range: 3.8, stamina: 12, phase: 18, cooldown: 0.52,
    attacks: { primary: { name: 'фазовый удар', type: 'phase', damageMul: 1, range: 3.8, arc: 1.55, impact: 'phase' } },
  },
  bastard: {
    id: 'bastard', name: 'Бастард', archetype: 'sword', icon: '†', damage: 37, range: 4.0, stamina: 18, cooldown: 0.72,
    attacks: {
      primary: { name: 'рубящий удар', type: 'slash', damageMul: 1, range: 4.0, arc: 1.35, impact: 'blade' },
      heavy: { name: 'тяжёлый удар', type: 'heavySlash', damageMul: 1.45, range: 3.7, arc: 1.05, staminaMul: 1.7, impact: 'heavyBlade' },
    },
  },
  rapier: {
    id: 'rapier', name: 'Шпага', archetype: 'rapier', icon: '⌁', damage: 22, range: 4.4, stamina: 10, cooldown: 0.42,
    attacks: {
      primary: { name: 'укол', type: 'thrust', damageMul: 1, range: 4.4, arc: 0.8, impact: 'pierce' },
      heavy: { name: 'точный выпад', type: 'lunge', damageMul: 1.35, range: 4.8, arc: 0.55, staminaMul: 1.5, impact: 'pierce' },
    },
  },
  boardingAxe: {
    id: 'boardingAxe', name: 'Абордажный топор', archetype: 'axe', icon: '⚒', damage: 34, range: 3.2, stamina: 17, cooldown: 0.66,
    attacks: { primary: { name: 'косой удар', type: 'chop', damageMul: 1.1, range: 3.2, arc: 1.1, impact: 'axe' } },
  },
  glassDagger: {
    id: 'glassDagger', name: 'Стеклянный кинжал', archetype: 'dagger', icon: '∕', damage: 17, range: 2.5, stamina: 7, cooldown: 0.28,
    attacks: { primary: { name: 'быстрый порез', type: 'quickCut', damageMul: 1, range: 2.5, arc: 0.9, impact: 'glassCut' } },
  },
  colt: {
    id: 'colt', name: 'Кольт 1917', archetype: 'revolver', icon: '⌐', damage: 30, range: 48, stamina: 4, cooldown: 0.36,
    ammoType: 'revolver', clipSize: 6, muzzleVelocity: 72, gravity: 0.04, spread: 0.018, recoil: 0.22, sight: true,
    attacks: { butt: { name: 'удар рукоятью', type: 'butt', damageMul: 0.45, range: 1.55, arc: 0.85, impact: 'blunt' } },
  },
  m1: {
    id: 'm1', name: 'M1 Гаранд', archetype: 'rifle', icon: '—', damage: 42, range: 86, stamina: 7, cooldown: 0.54,
    ammoType: 'rifle', clipSize: 8, muzzleVelocity: 110, gravity: 0.025, spread: 0.009, recoil: 0.26, sight: true,
    bayonet: true,
    attacks: {
      butt: { name: 'удар прикладом', type: 'butt', damageMul: 0.55, range: 1.75, arc: 0.9, impact: 'blunt' },
      bayonet: { name: 'удар штыком', type: 'bayonet', damageMul: 0.82, range: 3.2, arc: 0.5, impact: 'pierce' },
    },
  },
  bren: {
    id: 'bren', name: 'Брен', archetype: 'lmg', icon: '▰', damage: 19, range: 62, stamina: 13, cooldown: 0.13,
    ammoType: 'lmg', clipSize: 30, muzzleVelocity: 96, gravity: 0.03, spread: 0.022, recoil: 0.36, sight: true, automatic: true,
    attacks: { butt: { name: 'удар прикладом', type: 'butt', damageMul: 0.72, range: 1.8, arc: 0.9, impact: 'heavyBlunt' } },
  },
  trenchShotgun: {
    id: 'trenchShotgun', name: 'Окопный дробовик', archetype: 'shotgun', icon: '≡', damage: 14, range: 30, stamina: 9, cooldown: 0.72,
    ammoType: 'scatter', clipSize: 5, pellets: 7, muzzleVelocity: 65, gravity: 0.055, spread: 0.08, recoil: 0.42, sight: true,
    bayonet: true,
    attacks: { butt: { name: 'удар прикладом', type: 'butt', damageMul: 0.62, range: 1.75, arc: 0.9, impact: 'blunt' }, bayonet: { name: 'короткий штык', type: 'bayonet', damageMul: 0.75, range: 2.8, arc: 0.55, impact: 'pierce' } },
  },
  caravanCarbine: {
    id: 'caravanCarbine', name: 'Караванный карабин', archetype: 'carbine', icon: '–', damage: 34, range: 64, stamina: 6, cooldown: 0.48,
    ammoType: 'rifle', clipSize: 5, muzzleVelocity: 88, gravity: 0.035, spread: 0.014, recoil: 0.2, sight: true,
    attacks: { butt: { name: 'удар ложей', type: 'butt', damageMul: 0.5, range: 1.65, arc: 0.9, impact: 'blunt' } },
  },
};

export function isFirearm(id) { return ARSENAL[id]?.ammoType; }
export function attackProfile(id, mode = 'primary') { return ARSENAL[id]?.attacks?.[mode] || ARSENAL[id]?.attacks?.primary || null; }
export function weaponIcon(id) { return ARSENAL[id]?.icon || '?'; }
