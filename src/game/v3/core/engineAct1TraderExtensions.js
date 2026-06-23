import { ARSENAL, AMMO_TYPES } from '../combat/arsenal.js';
import { itemIconHtml } from '../items/weaponModels.js';

function near2D(a, b, radius) {
  return Math.hypot(a.x - b.x, a.z - b.z) <= radius;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const TRADER_AMMO = [
  ['pistol9', 24, 'Пистолетный запас'],
  ['pistol45', 16, 'Крупный пистолетный запас'],
  ['rifle792', 12, 'Винтовочные пачки'],
  ['rifle762r', 12, 'Старые винтовочные пачки'],
  ['scatter', 8, 'Дробь для дороги'],
  ['rocketAT', 1, 'Одна дорогая ракета'],
  ['rifle145', 3, 'ПТ-патроны'],
];

function installStyle() {
  if (document.getElementById('act1TraderStyle')) return;
  const style = document.createElement('style');
  style.id = 'act1TraderStyle';
  style.textContent = `
    .routeNpcPanel{min-width:min(760px,92vw);background:radial-gradient(circle at 10% 0%,rgba(154,97,39,.22),transparent 30rem),linear-gradient(135deg,#2a1d14,#0d0906);color:#f4dfb8;border:1px solid rgba(216,166,77,.45);padding:8px}.routeNpcHead{display:grid;grid-template-columns:90px 1fr;gap:14px;align-items:center;border-bottom:1px solid rgba(216,166,77,.28);padding-bottom:12px;margin-bottom:12px}.routePortrait{width:86px;height:86px;border:2px solid #b98b45;background:linear-gradient(#3b2a1b,#17100a);position:relative;box-shadow:inset 0 0 24px rgba(0,0,0,.55)}.routePortrait:before{content:'';position:absolute;left:28px;top:11px;width:30px;height:34px;border-radius:45%;background:#9b7652}.routePortrait:after{content:'';position:absolute;left:20px;top:42px;width:46px;height:32px;border-radius:14px 14px 4px 4px;background:#4b3928}.routeNpcTitle{font-size:26px;font-weight:900;color:#ffe0a2;line-height:1}.routeNpcSub{font-size:13px;color:#bfa279;margin-top:5px}.routeNpcText{color:#d8c2a0;line-height:1.45;margin:10px 0 14px}.routeNpcGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.routeNpcBox{border:1px solid rgba(216,166,77,.25);background:rgba(0,0,0,.22);padding:10px}.routeNpcBox h3{margin:0 0 8px;color:#ffd28a;text-transform:uppercase;font-size:13px;letter-spacing:.07em}.routeNpcActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.routeNpcPanel button{background:#4b3420;color:#f4dfb8;border:1px solid #a77a3b;border-radius:6px;padding:8px 10px;font-weight:800;cursor:pointer}.routeNpcPanel button:hover{background:#72502d}.routeNpcPanel button.primary{background:#d8a64d;color:#120d08}.routeNpcPanel button.danger{background:#7b3327;color:#ffd4c6}.tradeRow{display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(216,166,77,.14)}.tradeRow .itemIcon{margin:0!important}.tradeName b{display:block;color:#f5d8a5}.tradeName span{display:block;color:#a99170;font-size:12px}.tradePrice{color:#ffd28a;font-weight:900}.routeStatus{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.routeStatus div{background:rgba(0,0,0,.24);border:1px solid rgba(216,166,77,.17);padding:7px}.routeStatus b{display:block;color:#ffd28a;font-size:12px}.routeStatus span{color:#d8c2a0}
    @media(max-width:760px){.routeNpcHead,.routeNpcGrid,.routeStatus{grid-template-columns:1fr}.routePortrait{display:none}}
  `;
  document.head.appendChild(style);
}

function bindClose(engine) {
  document.getElementById('closeMapBtn')?.addEventListener('click', () => engine.closePausePanel());
}

function currentRouteStats(engine) {
  const s = engine.act1Slice || {};
  const activeWeapon = engine.player.weapon;
  const fs = engine.firearms?.state?.(activeWeapon);
  const weapon = ARSENAL[activeWeapon];
  return `<div class="routeStatus">
    <div><b>Кредиты</b><span>${engine.player.credits}</span></div>
    <div><b>Ящики</b><span>${s.cratesCollected || 0}/${s.cratesNeeded || 3}</span></div>
    <div><b>Трофейные детали</b><span>${s.trophyParts || 0}</span></div>
    <div><b>Активное оружие</b><span>${escapeHtml(weapon?.name || activeWeapon)}</span></div>
    <div><b>Состояние</b><span>${fs ? Math.round(fs.condition * 100) + '%' : '—'}</span></div>
    <div><b>Стадия</b><span>${Math.min(6, (s.stage || 0) + 1)}/6</span></div>
  </div>`;
}

function dialogueHtml(engine, mode = 'start') {
  const s = engine.act1Slice || {};
  const title = mode === 'turnin' ? 'Староста маршрута — сдача' : 'Староста маршрута';
  const line = mode === 'turnin'
    ? 'Вернулся? Если зелёные ящики целы, дорога снова будет дышать. Сдай груз, получи оплату, потом можешь докупить боезапас.'
    : 'Дорога к старому знаку снова закрыта. Нужен человек, который умеет держать оружие, читать маркеры и не спорить с бронёй лбом.';
  const acceptOrTurn = mode === 'turnin'
    ? `<button class="primary" id="turnInRouteBtn">Сдать ящики и закрыть маршрут</button>`
    : `<button class="primary" id="acceptRouteBtn">Взять заказ и боезапас</button>`;
  return `<div class="routeNpcPanel">
    <div class="routeNpcHead"><div class="routePortrait"></div><div><div class="routeNpcTitle">${title}</div><div class="routeNpcSub">Красная дорога · полевой стол · Act 1 route</div></div></div>
    <div class="routeNpcText">${line}</div>
    ${currentRouteStats(engine)}
    <div class="routeNpcGrid">
      <div class="routeNpcBox"><h3>Работа</h3><p>${mode === 'turnin' ? 'Сдать маршрут можно после трёх ящиков.' : 'Заказ выдаёт ракеты и ПТ-патроны. Цель: дорога, встреча, бронецель, ящики, возврат.'}</p></div>
      <div class="routeNpcBox"><h3>Услуги</h3><p>Боезапас, ремонт активного оружия, продажа трофейных деталей. Это первый хабовый цикл, дальше сюда ляжет полноценная торговля.</p></div>
    </div>
    <div class="routeNpcActions">${acceptOrTurn}<button id="openRouteTradeBtn">Торговать</button><button id="repairActiveWeaponBtn">Ремонт активного оружия</button><button id="routeRumorBtn">Слухи дороги</button><button id="closeMapBtn">Закрыть</button></div>
  </div>`;
}

function tradeHtml(engine) {
  const rows = TRADER_AMMO.map(([type, amount, label]) => {
    const ammo = AMMO_TYPES[type];
    const price = ammo ? ammo.price * amount : 0;
    return `<div class="tradeRow"><div>${itemIconHtml(type)}</div><div class="tradeName"><b>${escapeHtml(label)}</b><span>${escapeHtml(ammo?.name || type)} ×${amount}</span></div><div><span class="tradePrice">${price}</span> <button data-buy-ammo="${type}" data-amount="${amount}">Купить</button></div></div>`;
  }).join('');
  const parts = engine.act1Slice?.trophyParts || 0;
  return `<div class="routeNpcPanel">
    <div class="routeNpcHead"><div class="routePortrait"></div><div><div class="routeNpcTitle">Полевой торговец</div><div class="routeNpcSub">Боезапас, ремонт, дорожные трофеи</div></div></div>
    ${currentRouteStats(engine)}
    <div class="routeNpcBox"><h3>Боезапас</h3>${rows}</div>
    <div class="routeNpcActions"><button id="sellRoutePartsBtn" ${parts <= 0 ? 'disabled' : ''}>Продать трофейные детали ×${parts} за ${parts * 45}</button><button id="repairActiveWeaponBtn">Ремонт активного оружия</button><button id="backRouteDialogueBtn">Назад к старосте</button><button id="closeMapBtn">Закрыть</button></div>
  </div>`;
}

function rumorHtml(engine) {
  return `<div class="routeNpcPanel">
    <div class="routeNpcHead"><div class="routePortrait"></div><div><div class="routeNpcTitle">Слухи Красной дороги</div><div class="routeNpcSub">короткие заметки мира</div></div></div>
    <div class="routeNpcText">“Если броня не берётся — не спорь с ней. Бей в дорогу, колёса, корма, ящики, всё что не хочет быть бронёй.”</div>
    <div class="routeNpcGrid"><div class="routeNpcBox"><h3>О технике</h3><p>У старых бронемашин слабые места часто там, где экипаж сам что-то приварил в поле.</p></div><div class="routeNpcBox"><h3>О стволах</h3><p>Люди теперь замечают ценные образцы оружия. Не каждый просит купить, но слух о хорошем стволе идёт быстро.</p></div></div>
    <div class="routeNpcActions"><button id="backRouteDialogueBtn">Назад</button><button id="closeMapBtn">Закрыть</button></div>
  </div>`;
}

function refreshAfterService(engine) {
  engine.buildViewModel?.();
  engine.updateCrosshair?.();
}

function acceptRoute(engine) {
  const s = engine.act1Slice;
  if (!s || s.stage !== 0) return;
  s.stage = 1;
  s.trophyParts = s.trophyParts || 0;
  engine.inventory.addAmmo('rocketAT', 2);
  engine.inventory.addAmmo('rifle145', 5);
  engine.rpg?.useSkill?.('speech', 0.7);
  engine.log.unshift('Староста маршрута выдал заказ, две ракеты и ПТ-патроны.');
  engine.closePausePanel();
  engine.hud.setObjective('Заказ взят: иди к дорожному знаку.');
}

function turnInRoute(engine) {
  const s = engine.act1Slice;
  if (!s || s.stage !== 4) return;
  if ((s.cratesCollected || 0) < (s.cratesNeeded || 3)) {
    engine.hud.setObjective('Сначала собери все зелёные ящики.');
    return;
  }
  s.stage = 5;
  s.completed = true;
  engine.player.credits += 180;
  engine.inventory.addAmmo('rocketAT', 1);
  engine.inventory.addAmmo('scatter', 8);
  engine.rpg?.useSkill?.('speech', 2.2);
  engine.log.unshift('Act 1 Slice завершён через старосту: дорога очищена, ящики сданы, награда выдана.');
  engine.closePausePanel();
  engine.hud.setObjective('Маршрут закрыт: +180 кредитов, ракета, дробь, опыт речи.');
}

function buyAmmo(engine, type, amount) {
  const ammo = AMMO_TYPES[type];
  if (!ammo) return;
  const cost = ammo.price * amount;
  if (engine.player.credits < cost) {
    engine.hud.setObjective(`Не хватает кредитов: нужно ${cost}.`);
    return;
  }
  engine.player.credits -= cost;
  engine.inventory.addAmmo(type, amount);
  engine.hud.setObjective(`Куплено: ${ammo.name} ×${amount}.`);
  openTrade(engine);
}

function repairActive(engine) {
  const weaponId = engine.player.weapon;
  const weapon = ARSENAL[weaponId];
  if (!weapon?.ammoType || !engine.firearms?.repair) {
    engine.hud.setObjective('Ремонтник работает только с огнестрелом.');
    return;
  }
  const state = engine.firearms.state(weaponId);
  const missing = Math.max(0, 1 - state.condition);
  const cost = Math.max(15, Math.ceil(missing * 95));
  if (state.condition >= 0.98) {
    engine.hud.setObjective(`${weapon.name}: уже почти в порядке.`);
    return;
  }
  if (engine.player.credits < cost) {
    engine.hud.setObjective(`Ремонт стоит ${cost}, кредитов не хватает.`);
    return;
  }
  engine.player.credits -= cost;
  engine.firearms.repair(weaponId, 0.28);
  refreshAfterService(engine);
  engine.hud.setObjective(`${weapon.name}: ремонт + состояние.`);
  openTrade(engine);
}

function sellParts(engine) {
  const s = engine.act1Slice;
  const parts = s?.trophyParts || 0;
  if (!parts) return;
  engine.player.credits += parts * 45;
  s.trophyParts = 0;
  engine.hud.setObjective(`Проданы трофейные детали: +${parts * 45} кредитов.`);
  openTrade(engine);
}

function bindPanel(engine, mode = 'start') {
  document.getElementById('acceptRouteBtn')?.addEventListener('click', () => acceptRoute(engine));
  document.getElementById('turnInRouteBtn')?.addEventListener('click', () => turnInRoute(engine));
  document.getElementById('openRouteTradeBtn')?.addEventListener('click', () => openTrade(engine));
  document.getElementById('backRouteDialogueBtn')?.addEventListener('click', () => openDialogue(engine, mode));
  document.getElementById('routeRumorBtn')?.addEventListener('click', () => openRumor(engine));
  document.getElementById('repairActiveWeaponBtn')?.addEventListener('click', () => repairActive(engine));
  document.getElementById('sellRoutePartsBtn')?.addEventListener('click', () => sellParts(engine));
  document.querySelectorAll('[data-buy-ammo]').forEach((btn) => btn.addEventListener('click', () => buyAmmo(engine, btn.dataset.buyAmmo, Number(btn.dataset.amount || 1))));
  bindClose(engine);
}

function openDialogue(engine, mode = 'start') {
  installStyle();
  engine.paused = true;
  engine.hud.openPanel(dialogueHtml(engine, mode));
  bindPanel(engine, mode);
}

function openTrade(engine) {
  installStyle();
  engine.paused = true;
  engine.hud.openPanel(tradeHtml(engine));
  bindPanel(engine, engine.act1Slice?.stage === 4 ? 'turnin' : 'start');
}

function openRumor(engine) {
  installStyle();
  engine.paused = true;
  engine.hud.openPanel(rumorHtml(engine));
  bindPanel(engine, engine.act1Slice?.stage === 4 ? 'turnin' : 'start');
}

export function installAct1TraderExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__act1TraderInstalled) return;
  PhoenixV3Engine.__act1TraderInstalled = true;

  PhoenixV3Engine.prototype.openAct1RouteDialogue = function openAct1RouteDialogue(mode = 'start') {
    openDialogue(this, mode);
  };

  const originalTryInteract = PhoenixV3Engine.prototype.act1TryInteract;
  PhoenixV3Engine.prototype.act1TryInteract = function act1TryInteractWithTrader() {
    const s = this.act1Slice;
    if (s?.active) {
      const pos = this.rig.position;
      if (s.stage === 0 && near2D(pos, s.camp, 7.5)) { openDialogue(this, 'start'); return true; }
      if (s.stage === 4 && near2D(pos, s.camp, 7.5)) { openDialogue(this, 'turnin'); return true; }
      const beforeCrates = s.cratesCollected || 0;
      const result = originalTryInteract.call(this);
      if (result && (s.cratesCollected || 0) > beforeCrates) {
        s.trophyParts = (s.trophyParts || 0) + 1 + Math.floor(Math.random() * 2);
        this.log.unshift('Из зелёного ящика сняты трофейные детали для продажи у старосты.');
      }
      return result;
    }
    return originalTryInteract.call(this);
  };
}
