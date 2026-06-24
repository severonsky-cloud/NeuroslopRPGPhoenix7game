export const NPC_WEAPON_PROFILES = {
  imperial_rifle: { name: 'имперская винтовка', kind: 'firearm', model: 'rifle', damage: 18, range: 34, cooldown: 1.25, windup: 0.55, burst: 1, sound: 'rifle', color: 0xc8b27a },
  imperial_lmg: { name: 'имперский ручной пулемёт', kind: 'firearm', model: 'lmg', damage: 9, range: 28, cooldown: 0.28, windup: 0.35, burst: 3, sound: 'lmg', color: 0xb99a5a },
  smg_zhuzher: { name: 'жужжерский ПП', kind: 'firearm', model: 'smg', damage: 7, range: 24, cooldown: 0.18, windup: 0.22, burst: 4, sound: 'smg', color: 0x8b7a46 },
  nagant_zhuzher: { name: 'жужжерский наган', kind: 'firearm', model: 'nagant', damage: 13, range: 22, cooldown: 0.9, windup: 0.32, burst: 1, sound: 'nagant', color: 0xb0905a },
  elemental_gun: { name: 'элементальный ствол', kind: 'firearm', model: 'phaseGun', damage: 14, range: 30, cooldown: 1.1, windup: 0.48, burst: 1, sound: 'rifle', color: 0x5c8dff, phase: true },
  black_rifle: { name: 'чёрная стеклянная винтовка', kind: 'firearm', model: 'blackRifle', damage: 17, range: 36, cooldown: 1.35, windup: 0.62, burst: 1, sound: 'rifle', color: 0x6a3cff, phase: true },
  knight_sword: { name: 'рыцарский меч', kind: 'melee', model: 'sword', damage: 20, range: 3.1, cooldown: 1.2, windup: 0.55, arc: 1.1, sound: 'blade', color: 0xc8c0a8 },
  order_blade: { name: 'зачарованный клинок ордена', kind: 'melee', model: 'enchantedSword', damage: 24, range: 3.4, cooldown: 1.25, windup: 0.52, arc: 1.05, sound: 'blade', color: 0x8a78ff, phase: true },
  phase_staff: { name: 'фазовый посох', kind: 'phase', model: 'staff', damage: 18, range: 8.0, cooldown: 1.7, windup: 0.75, arc: 0.8, sound: 'phase', color: 0x8a78ff, phase: true },
  tsarbor_club: { name: 'царборская дубина', kind: 'melee', model: 'club', damage: 17, range: 2.8, cooldown: 1.05, windup: 0.5, arc: 1.25, sound: 'club', color: 0x5b3b22 },
  bandit_shotgun: { name: 'бандитский дробовик', kind: 'firearm', model: 'shotgun', damage: 10, range: 18, cooldown: 1.4, windup: 0.42, burst: 5, sound: 'shotgun', color: 0xb45a3c },
  bandit_rifle: { name: 'бандитская винтовка', kind: 'firearm', model: 'rifle', damage: 15, range: 30, cooldown: 1.15, windup: 0.42, burst: 1, sound: 'rifle', color: 0x9a7648 },
  bandit_knife: { name: 'бандитский нож', kind: 'melee', model: 'dagger', damage: 13, range: 2.0, cooldown: 0.55, windup: 0.22, arc: 0.75, sound: 'dagger', color: 0xa0d8d2 },
  peasant_tool: { name: 'крестьянская тяпка', kind: 'melee', model: 'tool', damage: 9, range: 2.3, cooldown: 1.25, windup: 0.6, arc: 1.0, sound: 'club', color: 0x9a6b42 },
  vehicle_lmg: { name: 'турельный пулемёт', kind: 'firearm', model: 'lmg', damage: 8, range: 42, cooldown: 0.18, windup: 0.28, burst: 5, sound: 'lmg', color: 0xb99a5a, vehicleGun: true },
  vehicle_cannon: { name: 'лёгкая пушка техники', kind: 'firearm', model: 'cannon', damage: 18, range: 50, cooldown: 1.45, windup: 0.72, burst: 1, sound: 'rocket', color: 0xd0a75f, vehicleGun: true },
  glass_vehicle_beam: { name: 'стеклянная башенная винтовка', kind: 'firearm', model: 'phaseGun', damage: 16, range: 44, cooldown: 0.9, windup: 0.52, burst: 2, sound: 'rifle', color: 0x5ec7c4, vehicleGun: true, phase: true },
};

export function loadoutForAgent(agent) {
  if (!agent) return 'peasant_tool';
  const f = agent.faction;
  const role = agent.role;
  if (f === 'empire') return role === 'guard' ? 'imperial_lmg' : 'imperial_rifle';
  if (f === 'knights') return 'knight_sword';
  if (f === 'errorOrder' || f === 'soundOrder') return 'order_blade';
  if (f === 'phaseGuild') return 'phase_staff';
  if (f === 'tsarbor') return 'tsarbor_club';
  if (f === 'blueElementals') return 'elemental_gun';
  if (f === 'blackElementals') return 'black_rifle';
  if (f === 'zhuzher') return Math.random() < 0.7 ? 'smg_zhuzher' : 'nagant_zhuzher';
  if (f === 'bandits') return Math.random() < 0.5 ? 'bandit_shotgun' : 'bandit_knife';
  if (f === 'rebels') return Math.random() < 0.5 ? 'bandit_knife' : 'peasant_tool';
  if (f === 'peasants' || f === 'redPeasants') return 'peasant_tool';
  if (role === 'caravan') return 'caravan_guard';
  return 'peasant_tool';
}

export function hostility(a, b) {
  if (!a || !b) return false;
  const fa = a.faction;
  const fb = b.faction;
  if (fa === fb) return false;
  if (fa === 'zhuzher' && (fb === 'empire' || fb === 'travelers')) return true;
  if (fb === 'zhuzher' && (fa === 'empire' || fa === 'travelers')) return true;
  if (fa === 'bandits' && ['empire', 'peasants', 'travelers', 'blueElementals'].includes(fb)) return true;
  if (fb === 'bandits' && ['empire', 'peasants', 'travelers', 'blueElementals'].includes(fa)) return true;
  if (fa === 'rebels' && fb === 'empire') return true;
  if (fb === 'rebels' && fa === 'empire') return true;
  return false;
}

export function hostileToPlayer(agent) {
  if (agent?.conditionalHostile) return Boolean(agent.provoked || agent.autoHostile);
  return ['bandits', 'zhuzher'].includes(agent?.faction);
}
