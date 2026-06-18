export const ITEM_DEFS = {
  fists: { id: 'fists', name: 'Кулаки', type: 'weapon', slot: 'hand', weaponId: 'fists', weight: 0 },
  phaseHand: { id: 'phaseHand', name: 'Фазовая рука', type: 'focus', slot: 'spellHand', weaponId: 'phase', weight: 0 },
  bastard: { id: 'bastard', name: 'Бастард', type: 'weapon', slot: 'hand', weaponId: 'bastard', weight: 4.5 },
  rapier: { id: 'rapier', name: 'Шпага', type: 'weapon', slot: 'hand', weaponId: 'rapier', weight: 1.4 },
  colt1917: { id: 'colt1917', name: 'Кольт 1917', type: 'weapon', slot: 'hand', weaponId: 'colt', weight: 1.2 },
  m1garand: { id: 'm1garand', name: 'M1 Гаранд', type: 'weapon', slot: 'hand', weaponId: 'm1', weight: 4.3 },
  bren: { id: 'bren', name: 'Брен', type: 'weapon', slot: 'hand', weaponId: 'bren', weight: 10.1 },
  clayHelmet: { id: 'clayHelmet', name: 'Шлем красной глины', type: 'armor', slot: 'head', armor: 2, weight: 2 },
  roadCuirass: { id: 'roadCuirass', name: 'Кираса Красной дороги', type: 'armor', slot: 'chest', armor: 5, weight: 7 },
  saltBoots: { id: 'saltBoots', name: 'Соляные сапоги', type: 'armor', slot: 'boots', armor: 1, weight: 1.8 },
  phaseCharm: { id: 'phaseCharm', name: 'Фазовый амулет', type: 'trinket', slot: 'amulet', armor: 0, phaseBonus: 8, weight: 0.2 },
};

export function makeInventoryState() {
  return {
    items: ['fists', 'phaseHand', 'bastard', 'rapier', 'colt1917', 'm1garand', 'bren', 'clayHelmet', 'roadCuirass', 'saltBoots', 'phaseCharm'],
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

  html() {
    const inv = this.player.inventoryState;
    const eq = inv.equipment;
    const doll = ['head', 'chest', 'hands', 'legs', 'boots', 'amulet', 'leftHand', 'rightHand', 'spellHand']
      .map(slot => `<div class="line"><b>${slot}</b>: ${ITEM_DEFS[eq[slot]]?.name || 'пусто'}</div>`)
      .join('');
    const items = inv.items.map(id => {
      const it = ITEM_DEFS[id];
      return `<div class="line"><b>${it?.name || id}</b> — ${it?.type || 'item'} · ${it?.slot || '-'}</div>`;
    }).join('');
    return `<h2>Инвентарь</h2>
      <p><b>Активная рука:</b> ${eq.activeHand === 'leftHand' ? 'левая' : 'правая'} · <b>Вес:</b> ${this.totalWeight().toFixed(1)} · <b>Броня:</b> ${this.armorValue()}</p>
      <h3>Кукла персонажа</h3>${doll}
      <h3>Предметы</h3>${items}
      <p><small>Tab — переключить левый/правый набор оружия. I — открыть/закрыть инвентарь.</small></p>
      <p><button id="closeMapBtn">Закрыть</button></p>`;
  }
}
