// Phoenix7 v3P2 WW2 arsenal data pack.
// Pure data: safe to import from the main game, smoke tests, and standalone micro builds.

export const WW2_AMMO_TYPES = {
  pistol9: { name: '9×19 Parabellum', icon: '9', price: 2, color: 0xd8b56e },
  pistol45: { name: '.45 ACP', icon: '45', price: 3, color: 0xc79558 },
  pistol762: { name: '7.62×25 TT', icon: '7', price: 2, color: 0xc9a05d },
  rifle3006: { name: '.30-06 Springfield', icon: '30', price: 4, color: 0xd0b06a },
  rifle792: { name: '7.92×57 Mauser', icon: '92', price: 4, color: 0xc8a25a },
  rifle303: { name: '.303 British', icon: '303', price: 4, color: 0xbfa56a },
  rifle762r: { name: '7.62×54R', icon: '54', price: 4, color: 0xc7ad70 },
  rifle77: { name: '7.7×58 Arisaka', icon: '77', price: 4, color: 0xb69b61 },
  kurz792: { name: '7.92×33 Kurz', icon: 'K', price: 3, color: 0xbd8f55 },
  atrifle: { name: '14.5/20mm AT rifle rounds', icon: 'AT', price: 11, color: 0x9f8a64 },
  rocketAT: { name: 'AT rockets / shaped charges', icon: 'R', price: 18, color: 0xb66a3a },
  thrown: { name: 'grenades / bottles', icon: '●', price: 6, color: 0x8c7b55 },
};

export const WW2_WEAPON_ARCHETYPES = {
  pistolAuto: { class: 'firearm', icon: '⌐', model: 'revolver' },
  pistolRevolver: { class: 'firearm', icon: '◉', model: 'revolver' },
  rifleBolt: { class: 'firearm', icon: '—', model: 'rifle' },
  rifleSemi: { class: 'firearm', icon: '—', model: 'rifle' },
  assaultRifle: { class: 'firearm', icon: '≋', model: 'carbine' },
  smg: { class: 'firearm', icon: '≋', model: 'carbine' },
  shotgunPump: { class: 'firearm', icon: '≡', model: 'shotgun' },
  shotgunSemi: { class: 'firearm', icon: '≡', model: 'shotgun' },
  shotgunBreak: { class: 'firearm', icon: '═', model: 'shotgun' },
  lmgMag: { class: 'firearm', icon: '▰', model: 'lmg' },
  lmgBelt: { class: 'firearm', icon: '▰', model: 'lmg' },
  atLauncher: { class: 'firearm', icon: '▱', model: 'lmg' },
  atRifle: { class: 'firearm', icon: '⇥', model: 'rifle' },
  thrownExplosive: { class: 'firearm', icon: '●', model: 'carbine' },
};

const SLOTS = Object.freeze({
  pistol: ['receiver', 'barrel', 'magazine', 'sight', 'muzzle', 'internal'],
  rifle: ['receiver', 'barrel', 'magazine', 'sight', 'stock', 'bayonet', 'internal'],
  smg: ['receiver', 'barrel', 'magazine', 'muzzle', 'stock', 'sight', 'internal'],
  shotgun: ['receiver', 'barrel', 'magazine', 'stock', 'sight', 'internal'],
  lmg: ['receiver', 'barrel', 'magazineOrBelt', 'bipod', 'stock', 'sight', 'internal'],
  atLauncher: ['receiver', 'sight', 'charge'],
  atRifle: ['receiver', 'barrel', 'magazine', 'sight', 'bipod'],
  thrown: ['charge', 'enchant'],
});

function firearm({ id, name, archetype, icon, damage, range, stamina, cooldown, ammoType, clipSize, muzzleVelocity, gravity, spread, recoil, automatic = false, pellets = 1, bayonet = false, reqStr = 0, reloadSeconds, jamBase, conditionWear, country, year, role, slots, extra = {} }) {
  const attacks = {};
  if (!['pistolAuto', 'pistolRevolver', 'thrownExplosive', 'atLauncher'].includes(archetype)) {
    attacks.butt = { name: 'удар прикладом', type: 'butt', damageMul: archetype.startsWith('lmg') ? 0.72 : 0.55, range: 1.75, arc: 0.9, impact: archetype.startsWith('lmg') ? 'heavyBlunt' : 'blunt' };
  }
  if (bayonet) attacks.bayonet = { name: 'удар штыком', type: 'bayonet', damageMul: 0.82, range: 3.2, arc: 0.5, staminaMul: 1.45, impact: 'pierce' };
  return { id, name, archetype, icon, damage, range, stamina, cooldown, ammoType, clipSize, muzzleVelocity, gravity, spread, recoil, sight: true, automatic, pellets, bayonet, reqStr, reloadSeconds, jamBase, conditionWear, country, year, role, slots, ww2: true, attacks, ...extra };
}

export const WW2_ARSENAL = {
  m1911a1: firearm({ id: 'm1911a1', name: 'Colt M1911A1', archetype: 'pistolAuto', icon: '⌐', damage: 32, range: 44, stamina: 4, cooldown: 0.34, ammoType: 'pistol45', clipSize: 7, muzzleVelocity: 62, gravity: 0.045, spread: 0.024, recoil: 0.27, reloadSeconds: 1.35, jamBase: 0.03, conditionWear: 0.0032, country: 'USA', year: 1924, role: 'мощный пистолет с сильной отдачей', slots: SLOTS.pistol }),
  lugerP08: firearm({ id: 'lugerP08', name: 'Luger P08', archetype: 'pistolAuto', icon: '⌐', damage: 25, range: 50, stamina: 3, cooldown: 0.3, ammoType: 'pistol9', clipSize: 8, muzzleVelocity: 68, gravity: 0.042, spread: 0.017, recoil: 0.19, reloadSeconds: 1.4, jamBase: 0.045, conditionWear: 0.0037, country: 'Germany', year: 1908, role: 'точный, но капризный пистолет', slots: SLOTS.pistol }),
  tt33: firearm({ id: 'tt33', name: 'Tokarev TT-33', archetype: 'pistolAuto', icon: '⌐', damage: 28, range: 52, stamina: 3, cooldown: 0.31, ammoType: 'pistol762', clipSize: 8, muzzleVelocity: 76, gravity: 0.038, spread: 0.02, recoil: 0.21, reloadSeconds: 1.25, jamBase: 0.032, conditionWear: 0.0032, country: 'USSR', year: 1933, role: 'быстрый и пробивной пистолет', slots: SLOTS.pistol }),
  webleyMkVI: firearm({ id: 'webleyMkVI', name: 'Webley Mk VI', archetype: 'pistolRevolver', icon: '◉', damage: 31, range: 42, stamina: 4, cooldown: 0.42, ammoType: 'revolver', clipSize: 6, muzzleVelocity: 58, gravity: 0.05, spread: 0.026, recoil: 0.24, reloadSeconds: 1.7, jamBase: 0.014, conditionWear: 0.0022, country: 'Britain', year: 1915, role: 'надёжный револьвер с медленной перезарядкой', slots: SLOTS.pistol }),
  k98k: firearm({ id: 'k98k', name: 'Mauser K98k', archetype: 'rifleBolt', icon: '—', damage: 47, range: 96, stamina: 7, cooldown: 0.92, ammoType: 'rifle792', clipSize: 5, muzzleVelocity: 118, gravity: 0.022, spread: 0.008, recoil: 0.31, bayonet: true, reloadSeconds: 1.85, jamBase: 0.014, conditionWear: 0.002, country: 'Germany', year: 1935, role: 'базовая болтовая винтовка со штыком', slots: SLOTS.rifle }),
  mosin9130: firearm({ id: 'mosin9130', name: 'Mosin-Nagant 91/30', archetype: 'rifleBolt', icon: '—', damage: 48, range: 94, stamina: 7, cooldown: 1.02, ammoType: 'rifle762r', clipSize: 5, muzzleVelocity: 116, gravity: 0.023, spread: 0.01, recoil: 0.34, bayonet: true, reloadSeconds: 1.95, jamBase: 0.016, conditionWear: 0.002, country: 'USSR', year: 1930, role: 'дешёвая мощная болтовка', slots: SLOTS.rifle }),
  leeEnfieldNo4: firearm({ id: 'leeEnfieldNo4', name: 'Lee-Enfield No.4', archetype: 'rifleBolt', icon: '—', damage: 43, range: 90, stamina: 7, cooldown: 0.78, ammoType: 'rifle303', clipSize: 10, muzzleVelocity: 108, gravity: 0.026, spread: 0.011, recoil: 0.29, bayonet: true, reloadSeconds: 2.05, jamBase: 0.015, conditionWear: 0.002, country: 'Britain', year: 1941, role: 'быстрая болтовка с ёмким магазином', slots: SLOTS.rifle }),
  m1GarandWw2: firearm({ id: 'm1GarandWw2', name: 'M1 Garand (.30-06)', archetype: 'rifleSemi', icon: '—', damage: 42, range: 88, stamina: 7, cooldown: 0.54, ammoType: 'rifle3006', clipSize: 8, muzzleVelocity: 110, gravity: 0.025, spread: 0.009, recoil: 0.27, bayonet: true, reloadSeconds: 1.55, jamBase: 0.026, conditionWear: 0.003, country: 'USA', year: 1936, role: 'мощная самозарядная винтовка', slots: SLOTS.rifle }),
  mp40: firearm({ id: 'mp40', name: 'MP40', archetype: 'smg', icon: '≋', damage: 17, range: 48, stamina: 5, cooldown: 0.095, ammoType: 'pistol9', clipSize: 32, muzzleVelocity: 70, gravity: 0.043, spread: 0.034, recoil: 0.18, automatic: true, reloadSeconds: 1.6, jamBase: 0.038, conditionWear: 0.004, country: 'Germany', year: 1940, role: 'управляемый складной ПП', slots: SLOTS.smg }),
  ppsh41: firearm({ id: 'ppsh41', name: 'PPSh-41', archetype: 'smg', icon: '≋', damage: 16, range: 46, stamina: 5, cooldown: 0.068, ammoType: 'pistol762', clipSize: 71, muzzleVelocity: 76, gravity: 0.039, spread: 0.045, recoil: 0.23, automatic: true, reloadSeconds: 2.2, jamBase: 0.047, conditionWear: 0.0048, country: 'USSR', year: 1941, role: 'очень высокий темп и тяжёлый диск', slots: SLOTS.smg }),
  thompsonM1928: firearm({ id: 'thompsonM1928', name: 'Thompson M1928A1', archetype: 'smg', icon: '≋', damage: 21, range: 45, stamina: 6, cooldown: 0.105, ammoType: 'pistol45', clipSize: 30, muzzleVelocity: 60, gravity: 0.047, spread: 0.036, recoil: 0.29, automatic: true, reloadSeconds: 1.8, jamBase: 0.04, conditionWear: 0.0042, country: 'USA', year: 1928, role: 'мощный тяжёлый ПП', slots: SLOTS.smg }),
  winchester1897: firearm({ id: 'winchester1897', name: 'Winchester Model 1897', archetype: 'shotgunPump', icon: '≡', damage: 14, range: 31, stamina: 9, cooldown: 0.68, ammoType: 'scatter', clipSize: 5, pellets: 8, muzzleVelocity: 64, gravity: 0.056, spread: 0.082, recoil: 0.44, bayonet: true, reloadSeconds: 1.95, jamBase: 0.032, conditionWear: 0.0035, country: 'USA', year: 1897, role: 'trench broom, сильный в упор', slots: SLOTS.shotgun }),
  browningAuto5: firearm({ id: 'browningAuto5', name: 'Browning Auto-5', archetype: 'shotgunSemi', icon: '≡', damage: 13, range: 30, stamina: 9, cooldown: 0.52, ammoType: 'scatter', clipSize: 5, pellets: 7, muzzleVelocity: 63, gravity: 0.057, spread: 0.075, recoil: 0.4, reloadSeconds: 1.85, jamBase: 0.04, conditionWear: 0.004, country: 'Belgium/USA', year: 1902, role: 'полуавтоматический дробовик', slots: SLOTS.shotgun }),
  doubleBarrelSawedOff: firearm({ id: 'doubleBarrelSawedOff', name: 'Обрез двустволки', archetype: 'shotgunBreak', icon: '═', damage: 16, range: 18, stamina: 8, cooldown: 0.36, ammoType: 'scatter', clipSize: 2, pellets: 10, muzzleVelocity: 54, gravity: 0.07, spread: 0.13, recoil: 0.5, reloadSeconds: 1.55, jamBase: 0.012, conditionWear: 0.002, country: 'partisan', year: 1939, role: 'партизанский упорный урон', slots: SLOTS.shotgun }),
  mg42: firearm({ id: 'mg42', name: 'MG42', archetype: 'lmgBelt', icon: '▰', damage: 20, range: 74, stamina: 14, cooldown: 0.058, ammoType: 'rifle792', clipSize: 50, muzzleVelocity: 104, gravity: 0.028, spread: 0.033, recoil: 0.47, automatic: true, reloadSeconds: 3.0, jamBase: 0.06, conditionWear: 0.006, country: 'Germany', year: 1942, role: 'ленточная циркулярка, высокий перегрев/износ', slots: SLOTS.lmg }),
  dp28: firearm({ id: 'dp28', name: 'DP-28 Degtyaryov', archetype: 'lmgMag', icon: '▰', damage: 22, range: 70, stamina: 13, cooldown: 0.11, ammoType: 'rifle762r', clipSize: 47, muzzleVelocity: 98, gravity: 0.03, spread: 0.026, recoil: 0.37, automatic: true, reloadSeconds: 2.65, jamBase: 0.044, conditionWear: 0.0048, country: 'USSR', year: 1928, role: 'верхний блинный диск, устойчивый темп', slots: SLOTS.lmg }),
  brenMk1Ww2: firearm({ id: 'brenMk1Ww2', name: 'Bren Mk I (.303)', archetype: 'lmgMag', icon: '▰', damage: 21, range: 70, stamina: 13, cooldown: 0.13, ammoType: 'rifle303', clipSize: 30, muzzleVelocity: 96, gravity: 0.03, spread: 0.022, recoil: 0.35, automatic: true, reloadSeconds: 2.35, jamBase: 0.035, conditionWear: 0.0042, country: 'Britain', year: 1938, role: 'точный магазинный ручной пулемёт', slots: SLOTS.lmg }),
  bazookaM1: firearm({ id: 'bazookaM1', name: 'Bazooka M1', archetype: 'atLauncher', icon: '▱', damage: 118, range: 82, stamina: 16, cooldown: 1.4, ammoType: 'rocketAT', clipSize: 1, muzzleVelocity: 48, gravity: 0.09, spread: 0.024, recoil: 0.62, reloadSeconds: 2.8, jamBase: 0.022, conditionWear: 0.005, country: 'USA', year: 1942, role: 'противотанковая ракета; пока через баллистику без blast-radius', slots: SLOTS.atLauncher }),
  panzerfaust30: firearm({ id: 'panzerfaust30', name: 'Panzerfaust 30', archetype: 'atLauncher', icon: '▱', damage: 150, range: 38, stamina: 18, cooldown: 1.8, ammoType: 'rocketAT', clipSize: 1, muzzleVelocity: 34, gravity: 0.13, spread: 0.04, recoil: 0.7, reloadSeconds: 3.3, jamBase: 0.012, conditionWear: 0.006, country: 'Germany', year: 1943, role: 'одноразовый профиль, сейчас расходует rocketAT как тестовый заряд', slots: SLOTS.atLauncher }),
  ptrd41: firearm({ id: 'ptrd41', name: 'PTRD-41', archetype: 'atRifle', icon: '⇥', damage: 92, range: 118, stamina: 18, cooldown: 1.65, ammoType: 'atrifle', clipSize: 1, muzzleVelocity: 132, gravity: 0.018, spread: 0.006, recoil: 0.82, reqStr: 12, reloadSeconds: 2.45, jamBase: 0.018, conditionWear: 0.0045, country: 'USSR', year: 1941, role: 'тяжёлое однозарядное ПТ-ружьё под сильных персонажей', slots: SLOTS.atRifle }),
  boysAT: firearm({ id: 'boysAT', name: 'Boys AT Rifle', archetype: 'atRifle', icon: '⇥', damage: 78, range: 104, stamina: 17, cooldown: 1.15, ammoType: 'atrifle', clipSize: 5, muzzleVelocity: 118, gravity: 0.022, spread: 0.008, recoil: 0.72, reqStr: 11, reloadSeconds: 2.25, jamBase: 0.026, conditionWear: 0.0045, country: 'Britain', year: 1937, role: 'магазинное ПТ-ружьё', slots: SLOTS.atRifle }),
  mk2GrenadeProto: firearm({ id: 'mk2GrenadeProto', name: 'Mk 2 Grenade (throw proto)', archetype: 'thrownExplosive', icon: '●', damage: 64, range: 24, stamina: 10, cooldown: 1.15, ammoType: 'thrown', clipSize: 1, muzzleVelocity: 32, gravity: 0.16, spread: 0.06, recoil: 0.08, reloadSeconds: 1.05, jamBase: 0, conditionWear: 0, country: 'USA', year: 1918, role: 'тест броскового оружия: в основном для micro-build до дуговой физики', slots: SLOTS.thrown, extra: { thrown: true, blastRadius: 3.2 } }),
  molotovProto: firearm({ id: 'molotovProto', name: 'Molotov Cocktail (fire proto)', archetype: 'thrownExplosive', icon: '●', damage: 38, range: 20, stamina: 9, cooldown: 1.05, ammoType: 'thrown', clipSize: 1, muzzleVelocity: 28, gravity: 0.18, spread: 0.075, recoil: 0.06, reloadSeconds: 1.0, jamBase: 0, conditionWear: 0, country: 'universal', year: 1939, role: 'тест зажигательного броска: damage over time будет отдельным шагом', slots: SLOTS.thrown, extra: { thrown: true, firePatchSeconds: 5, blastRadius: 2.2 } }),
};

export const WW2_ITEM_DEFS = Object.fromEntries(Object.values(WW2_ARSENAL).map((weapon) => [weapon.id, { id: weapon.id, name: weapon.name, type: 'weapon', slot: 'hand', weaponId: weapon.id, weight: weapon.archetype === 'atRifle' ? 16 : weapon.archetype === 'atLauncher' ? 8 : weapon.archetype.startsWith('lmg') ? 10 : weapon.archetype.startsWith('shotgun') ? 4.2 : weapon.archetype === 'smg' ? 3.8 : weapon.archetype.startsWith('rifle') ? 4.1 : weapon.archetype.startsWith('pistol') ? 1.1 : 0.7 }]));

export const WW2_TEST_LOADOUT_ITEMS = Object.freeze(Object.keys(WW2_ITEM_DEFS));

export const WW2_DEFAULT_AMMO = Object.freeze({ pistol9: 96, pistol45: 72, pistol762: 110, rifle3006: 48, rifle792: 120, rifle303: 70, rifle762r: 82, rifle77: 40, kurz792: 60, scatter: 28, atrifle: 14, rocketAT: 5, thrown: 8 });

export const WW2_TEST_ENEMIES = Object.freeze([
  { id: 'dummyRaider', name: 'Raider dummy', hp: 80, distance: 18, armor: 0 },
  { id: 'clayBrute', name: 'Clay brute dummy', hp: 180, distance: 42, armor: 6 },
  { id: 'armoredCrawler', name: 'Armored crawler dummy', hp: 130, distance: 74, armor: 12 },
]);

export function ww2WeaponIds() { return Object.keys(WW2_ARSENAL); }
export function isWw2Weapon(weaponId) { return Boolean(WW2_ARSENAL[weaponId]); }
