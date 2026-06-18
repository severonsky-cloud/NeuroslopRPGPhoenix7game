export const ENCHANTMENTS = {
  phase_edge: {
    name: 'Фазовая кромка',
    appliesTo: ['melee'],
    icon: '✦',
    cost: { phaseCell: 1, credits: 12 },
    desc: 'Клинок режет не только тело, но и фазовый контур.',
    damageBonus: 0.16,
    phaseDamage: 8,
    color: '#8a78ff',
  },
  glass_bite: {
    name: 'Стеклянный укус',
    appliesTo: ['melee', 'firearm'],
    icon: '◇',
    cost: { phaseCell: 1, credits: 16 },
    desc: 'Осколки стеклянной вотчины добавляют рваный импакт.',
    damageBonus: 0.10,
    procChance: 0.22,
    procDamage: 12,
    color: '#8fd8d2',
  },
  blue_charge: {
    name: 'Синий заряд',
    appliesTo: ['firearm'],
    icon: '◆',
    cost: { phaseCell: 2, credits: 22 },
    desc: 'Синие элементали стабилизируют старый ствол и усиливают первый импульс.',
    damageBonus: 0.12,
    spreadMul: 0.86,
    jamMul: 0.82,
    color: '#5c8dff',
  },
  black_oath: {
    name: 'Чёрная клятва',
    appliesTo: ['melee', 'firearm'],
    icon: '●',
    cost: { phaseCell: 3, credits: 35 },
    desc: 'Сильнее бьёт по живым, но оружие быстрее портится.',
    damageBonus: 0.24,
    conditionWearMul: 1.35,
    jamMul: 1.18,
    color: '#3b1a66',
  },
  ice_rune: {
    name: 'Ледяная руна',
    appliesTo: ['melee', 'firearm'],
    icon: '❄',
    cost: { credits: 18 },
    desc: 'Холодный след снижает скорость цели и даёт сухой тяжёлый импакт.',
    damageBonus: 0.08,
    staggerBonus: 0.18,
    color: '#a9d8ef',
  },
};

export function makeEnchantState() {
  return {
    weaponEnchants: {
      bastard: ['phase_edge'],
      rapier: [],
      colt: [],
      m1: ['blue_charge'],
      bren: [],
      trenchShotgun: [],
      caravanCarbine: [],
      boardingAxe: [],
      glassDagger: ['glass_bite'],
    },
  };
}

export class EnchantmentSystem {
  constructor(player, inventory) {
    this.player = player;
    this.inventory = inventory;
    if (!player.enchantState) player.enchantState = makeEnchantState();
  }

  listForWeapon(weaponId) {
    return this.player.enchantState.weaponEnchants[weaponId] || [];
  }

  getSummary(weaponId) {
    const ids = this.listForWeapon(weaponId);
    if (!ids.length) return 'без зачарования';
    return ids.map(id => `${ENCHANTMENTS[id]?.icon || '?'} ${ENCHANTMENTS[id]?.name || id}`).join(', ');
  }

  canApply(weaponId, enchantId, weaponClass) {
    const e = ENCHANTMENTS[enchantId];
    if (!e) return false;
    if (!e.appliesTo.includes(weaponClass)) return false;
    const existing = this.listForWeapon(weaponId);
    if (existing.includes(enchantId)) return false;
    return true;
  }

  apply(weaponId, enchantId, weaponClass) {
    const e = ENCHANTMENTS[enchantId];
    if (!this.canApply(weaponId, enchantId, weaponClass)) return { ok: false, reason: 'Нельзя наложить это зачарование.' };
    const cost = e.cost || {};
    if ((cost.credits || 0) > this.player.credits) return { ok: false, reason: 'Не хватает кредитов.' };
    if ((cost.phaseCell || 0) > (this.player.inventoryState?.ammo?.phaseCell || 0)) return { ok: false, reason: 'Не хватает фазовых ячеек.' };
    this.player.credits -= cost.credits || 0;
    if (cost.phaseCell) this.player.inventoryState.ammo.phaseCell -= cost.phaseCell;
    const arr = this.player.enchantState.weaponEnchants[weaponId] || [];
    arr.push(enchantId);
    this.player.enchantState.weaponEnchants[weaponId] = arr;
    return { ok: true, enchantment: e };
  }

  modifyShot(weaponId, payload) {
    const ids = this.listForWeapon(weaponId);
    const out = { ...payload };
    for (const id of ids) {
      const e = ENCHANTMENTS[id];
      if (!e) continue;
      if (e.damageBonus) out.damageScale = (out.damageScale || 1) * (1 + e.damageBonus);
      if (e.spreadMul) out.spreadMul = (out.spreadMul || 1) * e.spreadMul;
      if (e.jamMul) out.jamMul = (out.jamMul || 1) * e.jamMul;
      if (e.conditionWearMul) out.conditionWearMul = (out.conditionWearMul || 1) * e.conditionWearMul;
    }
    return out;
  }

  modifyMelee(weaponId, payload) {
    const ids = this.listForWeapon(weaponId);
    const out = { ...payload, extraDamage: 0, staggerBonus: 0, effects: [] };
    for (const id of ids) {
      const e = ENCHANTMENTS[id];
      if (!e) continue;
      if (e.damageBonus) out.damageScale = (out.damageScale || 1) * (1 + e.damageBonus);
      if (e.phaseDamage) out.extraDamage += e.phaseDamage;
      if (e.staggerBonus) out.staggerBonus += e.staggerBonus;
      if (e.procChance && Math.random() < e.procChance) out.extraDamage += e.procDamage || 0;
      out.effects.push(e);
    }
    return out;
  }

  html(activeWeaponId, weaponClass) {
    const rows = Object.entries(ENCHANTMENTS).map(([id, e]) => {
      const okType = e.appliesTo.includes(weaponClass);
      const owned = this.listForWeapon(activeWeaponId).includes(id);
      const cost = `${e.cost?.credits || 0} кр.${e.cost?.phaseCell ? ` + phase cells ${e.cost.phaseCell}` : ''}`;
      return `<div class="line"><b>${e.icon} ${e.name}</b> ${owned ? '✓' : ''}<br><small>${e.desc}</small><br><small>Цена: ${cost}</small><br><button data-enchant="${id}" ${(!okType || owned) ? 'disabled' : ''}>Наложить</button></div>`;
    }).join('');
    return `<h2>Зачарование оружия</h2>
      <p><b>Активное оружие:</b> ${activeWeaponId}</p>
      <p><b>Сейчас:</b> ${this.getSummary(activeWeaponId)}</p>
      ${rows}
      <p><button id="closeMapBtn">Закрыть</button></p>`;
  }
}
