import { ARSENAL, AMMO_TYPES } from '../combat/arsenal.js';
import { itemIconHtml } from './weaponModels.js';

export const ITEM_DEFS = {
  fists: { id: 'fists', name: 'Кулаки', type: 'weapon', slot: 'hand', weaponId: 'fists', weight: 0 },
  phaseHand: { id: 'phaseHand', name: 'Фазовая рука', type: 'focus', slot: 'spellHand', weaponId: 'phase', weight: 0 },
  bastard: { id: 'bastard', name: 'Бастард', type: 'weapon', slot: 'hand', weaponId: 'bastard', weight: 4.5 },
  rapier: { id: 'rapier', name: 'Шпага', type: 'weapon', slot: 'hand', weaponId: 'rapier', weight: 1.4 },
  boardingAxe: { id: 'boardingAxe', name: 'Абордажный топор', type: 'weapon', slot: 'hand', weaponId: 'boardingAxe', weight: 3.3 },
  glassDagger: { id: 'glassDagger', name: 'Стеклянный кинжал', type: 'weapon', slot: 'hand', weaponId: 'glassDagger', weight: 0.7 },
  colt1917: { id: 'colt1917', name: 'Кольт 1917', type: 'weapon', slot: 'hand', weaponId: 'colt', weight: 1.2 },
  m1garand: { id: 'm1garand', name: 'M1 Гаранд', type: 'weapon', slot: 'hand', weaponId: 'm1', weight: 4.3 },
  bren: { id: 'bren', name: 'Брен', type: 'weapon', slot: 'hand', weaponId: 'bren', weight: 10.1 },
  trenchShotgun: { id: 'trenchShotgun', name: 'Окопный дробовик', type: 'weapon', slot: 'hand', weaponId: 'trenchShotgun', weight: 4.1 },
  caravanCarbine: { id: 'caravanCarbine', name: 'Караванный карабин', type: 'weapon', slot: 'hand', weaponId: 'caravanCarbine', weight: 3.4 },
  clayHelmet: { id: 'clayHelmet', name: 'Шлем красной глины', type: 'armor', slot: 'head', armor: 2, weight: 2 },
  roadCuirass: { id: 'roadCuirass', name: 'Кираса Красной дороги', type: 'armor', slot: 'chest', armor: 5, weight: 7 },
  saltBoots: { id: 'saltBoots', name: 'Соляные сапоги', type: 'armor', slot: 'boots', armor: 1, weight: 1.8 },
  phaseCharm: { id: 'phaseCharm', name: 'Фазовый амулет', type: 'trinket', slot: 'amulet', armor: 0, phaseBonus: 8, weight: 0.2 },
};

export function makeInventoryState() {
  return {
    items: ['fists', 'phaseHand', 'bastard', 'rapier', 'boardingAxe', 'glassDagger', 'colt1917', 'm1garand', 'bren', 'trenchShotgun', 'caravanCarbine', 'clayHelmet', 'roadCuirass', 'saltBoots', 'phaseCharm'],
    ammo: { revolver: 18, rifle: 24, lmg: 45, scatter: 10, phaseCell: 2 },
    equipment: {
      head: null,
      chest: null,
      hands: null,
      legs: null,
      boots: null,
      amulet: null,
      leftHand: 'bastard',
      rightHand: 'colt1917',
      activeHand: 'leftHand',
      spellHand: 'phaseHand',
    },
  };
}

export class InventorySystem {
  constructor(player) {
    this.player = player;
    if (!player.inventoryState) player.inventoryState = makeInventoryState();
  }

  activeWeaponId() {
    const eq = this.player.inventoryState.equipment;
    const itemId = eq[eq.activeHand] || 'fists';
    return ITEM_DEFS[itemId]?.weaponId || 'fists';
  }

  switchHands() {
    const eq = this.player.inventoryState.equipment;
    eq.activeHand = eq.activeHand === 'leftHand' ? 'rightHand' : 'leftHand';
    return this.activeWeaponId();
  }

  equip(itemId, slot = null) {
    const item = ITEM_DEFS[itemId];
    if (!item || !this.player.inventoryState.items.includes(itemId)) return false;
    const eq = this.player.inventoryState.equipment;
    const targetSlot = slot || item.slot;
    if (targetSlot === 'leftHand' || targetSlot === 'rightHand') {
      if (item.type !== 'weapon') return false;
      eq[targetSlot] = itemId;
      return true;
    }
    if (targetSlot === 'spellHand') {
      eq.spellHand = itemId;
      return true;
    }
    if (item.slot !== targetSlot) return false;
    eq[targetSlot] = itemId;
    return true;
  }

  ammoForWeapon(weaponId) {
    const w = ARSENAL[weaponId];
    return w?.ammoType ? this.player.inventoryState.ammo[w.ammoType] || 0 : Infinity;
  }

  addAmmo(type, amount) {
    if (!AMMO_TYPES[type]) return false;
    this.player.inventoryState.ammo[type] = (this.player.inventoryState.ammo[type] || 0) + amount;
    return true;
  }

  buyAmmo(type, amount = 1) {
    const ammo = AMMO_TYPES[type];
    if (!ammo) return false;
    const cost = ammo.price * amount;
    if (this.player.credits < cost) return false;
    this.player.credits -= cost;
    this.addAmmo(type, amount);
    return true;
  }

  lootAmmoBundle(table = 'road') {
    const pools = {
      road: [['revolver', 2, 6], ['rifle', 2, 8]],
      raider: [['rifle', 4, 10], ['lmg', 6, 16], ['scatter', 2, 5]],
      elemental: [['phaseCell', 1, 2], ['rifle', 1, 4]],
      bandit: [['revolver', 3, 8], ['scatter', 1, 4]],
    };
    const out = [];
    for (const [type, min, max] of pools[table] || pools.road) {
      if (Math.random() < 0.65) {
        const n = min + Math.floor(Math.random() * (max - min + 1));
        this.addAmmo(type, n);
        out.push(`${AMMO_TYPES[type].name} ×${n}`);
      }
    }
    return out;
  }

  armorValue() {
    const eq = this.player.inventoryState.equipment;
    let armor = 0;
    for (const slot of ['head', 'chest', 'hands', 'legs', 'boots']) {
      const item = ITEM_DEFS[eq[slot]];
      if (item?.armor) armor += item.armor;
    }
    return armor;
  }

  totalWeight() {
    return this.player.inventoryState.items.reduce((sum, id) => sum + (ITEM_DEFS[id]?.weight || 0), 0);
  }

  itemRow(id) {
    const it = ITEM_DEFS[id];
    const w = it?.weaponId ? ARSENAL[it.weaponId] : null;
    const icon = itemIconHtml(it?.weaponId || id);
    let actions = '';
    if (it?.type === 'weapon') {
      actions = `<br><button data-equip-left="${id}">В левый набор</button> <button data-equip-right="${id}">В правый набор</button>`;
    } else if (it?.type === 'armor' || it?.type === 'trinket') {
      actions = `<br><button data-equip-armor="${id}" data-slot="${it.slot}">Надеть: ${it.slot}</button>`;
    } else if (it?.slot === 'spellHand') {
      actions = `<br><button data-equip-armor="${id}" data-slot="spellHand">В фазовую руку</button>`;
    }
    return `<div class="line">${icon} <b>${it?.name || id}</b> — ${it?.type || 'item'} · ${it?.slot || '-'}${w?.ammoType ? ` · ammo ${AMMO_TYPES[w.ammoType].name}` : ''}${actions}</div>`;
  }

  html() {
    const inv = this.player.inventoryState;
    const eq = inv.equipment;
    const doll = ['head', 'chest', 'hands', 'legs', 'boots', 'amulet', 'leftHand', 'rightHand', 'spellHand']
      .map(slot => `<div class="line"><b>${slot}</b>: ${ITEM_DEFS[eq[slot]] ? itemIconHtml(ITEM_DEFS[eq[slot]].weaponId || eq[slot]) : ''} ${ITEM_DEFS[eq[slot]]?.name || 'пусто'}</div>`)
      .join('');
    const ammo = Object.entries(inv.ammo).map(([type, n]) => `<div class="line">${itemIconHtml(type)} <b>${AMMO_TYPES[type]?.name || type}</b>: ${n}</div>`).join('');
    const items = inv.items.map(id => this.itemRow(id)).join('');
    return `<h2>Инвентарь</h2>
      <p><b>Активная рука:</b> ${eq.activeHand === 'leftHand' ? 'левая' : 'правая'} · <b>Вес:</b> ${this.totalWeight().toFixed(1)} · <b>Броня:</b> ${this.armorValue()} · <b>Кредиты:</b> ${this.player.credits}</p>
      <h3>Кукла персонажа</h3>${doll}
      <h3>Патроны</h3>${ammo}
      <h3>Предметы</h3>${items}
      <p><small>Tab — переключить левый/правый набор оружия. R — перезарядка. B — приклад/штык. Y — зачарование.</small></p>
      <p><button id="closeMapBtn">Закрыть</button></p>`;
  }
}
