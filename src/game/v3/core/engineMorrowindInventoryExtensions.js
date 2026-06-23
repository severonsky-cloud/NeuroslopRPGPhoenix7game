import { ARSENAL, AMMO_TYPES } from '../combat/arsenal.js';
import { ITEM_DEFS } from '../items/inventory.js';
import { itemIconHtml } from '../items/weaponModels.js';

const SLOT_LABELS = {
  head: 'Голова',
  amulet: 'Амулет',
  chest: 'Корпус',
  hands: 'Руки',
  legs: 'Ноги',
  boots: 'Сапоги',
  leftHand: 'Левая рука',
  rightHand: 'Правая рука',
  spellHand: 'Фазовая рука',
};

const SLOT_POSITIONS = {
  head: 'top: 3%; left: 50%; transform: translateX(-50%);',
  amulet: 'top: 20%; left: 50%; transform: translateX(-50%);',
  chest: 'top: 34%; left: 50%; transform: translateX(-50%);',
  hands: 'top: 48%; left: 50%; transform: translateX(-50%);',
  legs: 'top: 64%; left: 50%; transform: translateX(-50%);',
  boots: 'top: 82%; left: 50%; transform: translateX(-50%);',
  leftHand: 'top: 42%; left: 7%;',
  rightHand: 'top: 42%; right: 7%;',
  spellHand: 'top: 66%; right: 4%;',
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function bindClose(engine) {
  document.getElementById('closeMapBtn')?.addEventListener('click', () => engine.closePausePanel());
}

function itemIcon(itemId) {
  const item = ITEM_DEFS[itemId];
  return itemIconHtml(item?.weaponId || itemId);
}

function itemMeta(itemId) {
  const item = ITEM_DEFS[itemId];
  const weapon = item?.weaponId ? ARSENAL[item.weaponId] : null;
  const tags = [];
  if (item?.type) tags.push(item.type);
  if (item?.slot) tags.push(item.slot);
  if (weapon?.ww2) tags.push('WW2');
  if (weapon?.ammoType) tags.push(AMMO_TYPES[weapon.ammoType]?.name || weapon.ammoType);
  if (weapon?.automatic) tags.push('AUTO');
  if (weapon?.archetype === 'atLauncher') tags.push('AT launcher');
  if (weapon?.archetype === 'atRifle') tags.push('AT rifle');
  if (item?.armor) tags.push(`armor ${item.armor}`);
  if (item?.weight) tags.push(`${item.weight}w`);
  return tags.join(' · ');
}

function canDropOnSlot(itemId, slot) {
  const item = ITEM_DEFS[itemId];
  if (!item) return false;
  if (slot === 'leftHand' || slot === 'rightHand') return item.type === 'weapon';
  if (slot === 'spellHand') return item.slot === 'spellHand' || item.type === 'focus';
  return item.slot === slot;
}

function categoryFor(itemId) {
  const item = ITEM_DEFS[itemId];
  const weapon = item?.weaponId ? ARSENAL[item.weaponId] : null;
  if (item?.type === 'weapon') {
    if (weapon?.archetype === 'atLauncher' || weapon?.archetype === 'atRifle') return 'heavy';
    if (weapon?.ammoType) return 'weapons';
    return 'weapons';
  }
  if (item?.type === 'armor' || item?.type === 'trinket' || item?.type === 'focus') return 'equipment';
  return 'misc';
}

function sortItems(items) {
  const order = { weapons: 0, heavy: 1, equipment: 2, misc: 3 };
  return [...items].sort((a, b) => {
    const ca = order[categoryFor(a)] ?? 9;
    const cb = order[categoryFor(b)] ?? 9;
    if (ca !== cb) return ca - cb;
    return (ITEM_DEFS[a]?.name || a).localeCompare(ITEM_DEFS[b]?.name || b, 'ru');
  });
}

function slotHtml(eq, slot) {
  const itemId = eq[slot];
  const item = ITEM_DEFS[itemId];
  const filled = item ? 'filled' : 'empty';
  return `<div class="mw-slot ${filled}" style="${SLOT_POSITIONS[slot]}" data-equip-slot="${slot}">
    <div class="mw-slot-label">${SLOT_LABELS[slot]}</div>
    <div class="mw-slot-icon">${item ? itemIcon(itemId) : '<span class="mw-empty-dot">◇</span>'}</div>
    <div class="mw-slot-name">${escapeHtml(item?.name || 'пусто')}</div>
  </div>`;
}

function dollHtml(eq) {
  const slots = ['head', 'amulet', 'chest', 'hands', 'legs', 'boots', 'leftHand', 'rightHand', 'spellHand'].map((slot) => slotHtml(eq, slot)).join('');
  return `<section class="mw-doll-panel">
    <h3>Кукла персонажа</h3>
    <div class="mw-doll">
      <div class="mw-body-silhouette">
        <div class="mw-head"></div><div class="mw-torso"></div><div class="mw-arm left"></div><div class="mw-arm right"></div><div class="mw-leg left"></div><div class="mw-leg right"></div>
      </div>
      ${slots}
    </div>
    <div class="mw-help">Перетащи предмет из сумки на слот. Tab переключает активную руку.</div>
  </section>`;
}

function itemCardHtml(itemId, eq) {
  const item = ITEM_DEFS[itemId];
  if (!item) return '';
  const equippedSlots = Object.entries(eq).filter(([, value]) => value === itemId).map(([slot]) => SLOT_LABELS[slot] || slot);
  const equipped = equippedSlots.length ? `<span class="mw-equipped">${equippedSlots.join(', ')}</span>` : '';
  return `<div class="mw-item-card" draggable="true" data-item-id="${escapeHtml(itemId)}" data-category="${categoryFor(itemId)}">
    <div class="mw-item-icon">${itemIcon(itemId)}</div>
    <div class="mw-item-text"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(itemMeta(itemId))}</small>${equipped}</div>
  </div>`;
}

function ammoHtml(inv) {
  return Object.entries(inv.ammo)
    .filter(([, n]) => n > 0)
    .sort(([a], [b]) => (AMMO_TYPES[a]?.name || a).localeCompare(AMMO_TYPES[b]?.name || b, 'ru'))
    .map(([type, n]) => `<div class="mw-ammo-line">${itemIconHtml(type)} <b>${escapeHtml(AMMO_TYPES[type]?.name || type)}</b><span>${n}</span></div>`)
    .join('');
}

function statHtml(engine) {
  const inv = engine.player.inventoryState;
  const active = inv.equipment.activeHand === 'leftHand' ? 'левая' : 'правая';
  return `<div class="mw-stats">
    <div><b>HP</b><span>${Math.round(engine.player.hp)}/${engine.player.hpMax}</span></div>
    <div><b>ST</b><span>${Math.round(engine.player.st)}/${engine.player.stMax}</span></div>
    <div><b>PH</b><span>${Math.round(engine.player.ph)}/${engine.player.phMax}</span></div>
    <div><b>Броня</b><span>${engine.inventory.armorValue()}</span></div>
    <div><b>Вес</b><span>${engine.inventory.totalWeight().toFixed(1)}</span></div>
    <div><b>Кредиты</b><span>${engine.player.credits}</span></div>
    <div><b>Активная рука</b><span>${active}</span></div>
  </div>`;
}

function inventoryHtml(engine) {
  const inv = engine.player.inventoryState;
  const eq = inv.equipment;
  const cards = sortItems(inv.items).map((id) => itemCardHtml(id, eq)).join('');
  return `<div class="mw-root">
    <div class="mw-topbar"><div><b>Инвентарь Ashgrave</b><span>классический RPG-экран с куклой персонажа</span></div><button id="closeMapBtn">Закрыть</button></div>
    <div class="mw-layout">
      ${dollHtml(eq)}
      <section class="mw-bag-panel"><h3>Сумка</h3><div class="mw-filter-row"><button data-mw-filter="all">Все</button><button data-mw-filter="weapons">Оружие</button><button data-mw-filter="heavy">Тяжёлое</button><button data-mw-filter="equipment">Снаряжение</button></div><div class="mw-bag-grid">${cards}</div></section>
      <section class="mw-side-panel"><h3>Статы</h3>${statHtml(engine)}<h3>Патроны</h3><div class="mw-ammo-list">${ammoHtml(inv)}</div><div class="mw-help">Двойной клик по предмету экипирует его в подходящий слот. Оружие по двойному клику идёт в активную руку.</div></section>
    </div>
  </div>`;
}

function installStyle() {
  if (document.getElementById('mwInventoryStyle')) return;
  const style = document.createElement('style');
  style.id = 'mwInventoryStyle';
  style.textContent = `
    #panel:has(.mw-root) { width:min(1180px,96vw)!important; max-height:92vh!important; overflow:hidden!important; padding:0!important; background:linear-gradient(135deg,rgba(43,31,20,.98),rgba(18,14,11,.98))!important; border:2px solid #b98b45!important; box-shadow:0 0 0 2px rgba(0,0,0,.7),0 28px 90px rgba(0,0,0,.8)!important; color:#f2dfbd!important; font-family:"Trebuchet MS",Georgia,serif!important; }
    .mw-root{min-height:680px;background:radial-gradient(circle at 50% 20%,rgba(138,88,44,.22),transparent 40%),linear-gradient(135deg,#2a1d14,#120f0b);}
    .mw-topbar{height:58px;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(205,158,83,.45);background:rgba(0,0,0,.25)}
    .mw-topbar b{display:block;font-size:22px;color:#ffd690}.mw-topbar span{display:block;color:#bca17a;font-size:12px}.mw-topbar button,.mw-filter-row button{background:#4a3725;color:#f0dfc2;border:1px solid #98723d;border-radius:4px;padding:7px 10px;font-weight:800;cursor:pointer}.mw-topbar button:hover,.mw-filter-row button:hover{background:#725432}
    .mw-layout{display:grid;grid-template-columns:380px 1fr 280px;gap:10px;padding:10px;height:calc(92vh - 58px);min-height:620px}.mw-doll-panel,.mw-bag-panel,.mw-side-panel{border:1px solid rgba(190,145,74,.55);background:rgba(16,12,9,.72);box-shadow:inset 0 0 30px rgba(0,0,0,.35);padding:10px;overflow:auto}.mw-doll-panel h3,.mw-bag-panel h3,.mw-side-panel h3{margin:0 0 8px;color:#ffd690;border-bottom:1px solid rgba(190,145,74,.35);padding-bottom:5px;text-transform:uppercase;font-size:14px;letter-spacing:.06em}
    .mw-doll{position:relative;height:570px;background:radial-gradient(ellipse at center,rgba(90,69,44,.5),rgba(0,0,0,.25) 62%);border:1px solid rgba(190,145,74,.35);overflow:hidden}.mw-body-silhouette{position:absolute;inset:65px 94px 70px;opacity:.72;filter:drop-shadow(0 0 18px #000)}.mw-head{position:absolute;left:50%;top:0;transform:translateX(-50%);width:54px;height:64px;border-radius:45%;background:#3c2d22;border:1px solid #906d3e}.mw-torso{position:absolute;left:50%;top:70px;transform:translateX(-50%);width:105px;height:185px;border-radius:42px 42px 26px 26px;background:#30251d;border:1px solid #906d3e}.mw-arm{position:absolute;top:95px;width:36px;height:178px;border-radius:20px;background:#2b211a;border:1px solid #906d3e}.mw-arm.left{left:35px;transform:rotate(14deg)}.mw-arm.right{right:35px;transform:rotate(-14deg)}.mw-leg{position:absolute;top:250px;width:42px;height:180px;border-radius:18px;background:#2a2019;border:1px solid #906d3e}.mw-leg.left{left:93px;transform:rotate(5deg)}.mw-leg.right{right:93px;transform:rotate(-5deg)}
    .mw-slot{position:absolute;width:112px;min-height:74px;padding:5px;border:1px solid #856034;background:rgba(21,15,10,.84);text-align:center;border-radius:4px;transition:.12s}.mw-slot.drag-over{outline:3px solid #ffd477;background:rgba(98,69,33,.95)}.mw-slot.filled{border-color:#c39452}.mw-slot-label{font-size:10px;text-transform:uppercase;color:#c9aa78}.mw-slot-icon .item-icon,.mw-item-icon .item-icon,.mw-ammo-line .item-icon{vertical-align:middle}.mw-empty-dot{font-size:23px;color:#604a32}.mw-slot-name{font-size:11px;color:#f0dfc2;line-height:1.1}.mw-help{font-size:12px;color:#bca17a;margin-top:8px;line-height:1.35}
    .mw-filter-row{display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap}.mw-filter-row button{font-size:12px;padding:5px 8px}.mw-bag-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:7px;align-content:start}.mw-item-card{display:grid;grid-template-columns:44px 1fr;gap:7px;align-items:center;min-height:58px;padding:7px;border:1px solid rgba(151,112,60,.55);background:rgba(36,27,18,.78);cursor:grab;border-radius:4px}.mw-item-card:hover{background:rgba(74,55,33,.95);border-color:#d6a45c}.mw-item-card.dragging{opacity:.45}.mw-item-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);border:1px solid rgba(190,145,74,.25)}.mw-item-text b{display:block;color:#f8e6c5;font-size:13px}.mw-item-text small{display:block;color:#a99170;font-size:11px;line-height:1.25}.mw-equipped{display:inline-block;margin-top:3px;padding:2px 5px;background:#3d5b32;color:#d7ffc9;font-size:10px;border-radius:3px}.mw-stats{display:grid;grid-template-columns:1fr;gap:5px;margin-bottom:12px}.mw-stats div,.mw-ammo-line{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(190,145,74,.2);padding:5px 0}.mw-stats b,.mw-ammo-line b{color:#e8c989}.mw-stats span,.mw-ammo-line span{color:#f5e1c2}.mw-ammo-list{max-height:290px;overflow:auto}
    @media(max-width:920px){.mw-layout{grid-template-columns:1fr;height:auto}.mw-root{min-height:auto}.mw-doll{height:520px}}
  `;
  document.head.appendChild(style);
}

function refreshEngineWeapon(engine) {
  engine.player.weapon = engine.inventory.activeWeaponId();
  engine.burstFireState = { weaponId: null, remaining: 0 };
  engine.aimMode = false;
  engine.camera.fov = 72;
  engine.camera.updateProjectionMatrix();
  engine.buildViewModel?.();
  engine.updateCrosshair?.();
}

function equipToSlot(engine, itemId, slot) {
  if (!canDropOnSlot(itemId, slot)) {
    engine.hud.setObjective(`${ITEM_DEFS[itemId]?.name || itemId} сюда не подходит.`);
    return false;
  }
  const ok = engine.inventory.equip(itemId, slot);
  if (!ok) return false;
  if (slot === 'leftHand' || slot === 'rightHand') {
    engine.player.inventoryState.equipment.activeHand = slot;
    refreshEngineWeapon(engine);
  }
  engine.hud.setObjective(`Экипировано: ${ITEM_DEFS[itemId]?.name || itemId} → ${SLOT_LABELS[slot] || slot}`);
  return true;
}

function smartEquip(engine, itemId) {
  const item = ITEM_DEFS[itemId];
  if (!item) return false;
  const eq = engine.player.inventoryState.equipment;
  let slot = item.slot;
  if (item.type === 'weapon') slot = eq.activeHand || 'rightHand';
  if (item.type === 'focus') slot = 'spellHand';
  return equipToSlot(engine, itemId, slot);
}

function bindInventory(engine) {
  let dragged = null;
  document.querySelectorAll('.mw-item-card').forEach((card) => {
    card.addEventListener('dragstart', (event) => {
      dragged = card.dataset.itemId;
      card.classList.add('dragging');
      event.dataTransfer?.setData('text/plain', dragged);
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dblclick', () => { if (smartEquip(engine, card.dataset.itemId)) engine.openInventory(); });
  });
  document.querySelectorAll('[data-equip-slot]').forEach((slot) => {
    slot.addEventListener('dragover', (event) => { event.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', (event) => {
      event.preventDefault();
      slot.classList.remove('drag-over');
      const itemId = event.dataTransfer?.getData('text/plain') || dragged;
      if (itemId && equipToSlot(engine, itemId, slot.dataset.equipSlot)) engine.openInventory();
    });
  });
  document.querySelectorAll('[data-mw-filter]').forEach((btn) => btn.addEventListener('click', () => {
    const filter = btn.dataset.mwFilter;
    document.querySelectorAll('.mw-item-card').forEach((card) => { card.style.display = filter === 'all' || card.dataset.category === filter ? '' : 'none'; });
  }));
  bindClose(engine);
}

export function installMorrowindInventoryExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__morrowindInventoryInstalled) return;
  PhoenixV3Engine.__morrowindInventoryInstalled = true;

  PhoenixV3Engine.prototype.openInventory = function openMorrowindInventory() {
    installStyle();
    this.paused = true;
    this.hud.openPanel(inventoryHtml(this));
    bindInventory(this);
  };
}
