import { ARSENAL, AMMO_TYPES } from '../combat/arsenal.js';
import { BIOMES } from '../data/worldData.js';
import { biomeAt } from '../world/terrain.js';
import { itemIconHtml } from '../items/weaponModels.js';

function pct(value, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function stageName(stage) {
  return [
    'Взять заказ',
    'Дойти до дороги',
    'Дорожная встреча',
    'Бронецель и ящики',
    'Сдать маршрут',
    'Маршрут закрыт',
  ][stage] || 'Свободный режим';
}

function stageObjective(state) {
  if (!state?.active) return 'F2 — начать Act 1 route. I — инвентарь. J — журнал.';
  if (state.stage === 0) return 'Стол старосты под большим маркером. Подойди и удержи E.';
  if (state.stage === 1) return 'Иди к дорожному маркеру. Проверь I, если надо сменить оружие.';
  if (state.stage === 2) return `Дорожная встреча: осталось ${state.raiders?.filter((r) => r.userData?.alive !== false && (r.userData.hp ?? 1) > 0).length || 0}.`;
  if (state.stage === 3) return `Останови бронецель и забери ящики ${state.cratesCollected || 0}/${state.cratesNeeded || 3}.`;
  if (state.stage === 4) return 'Все ящики взяты. Вернись к столу старосты и удержи E.';
  return 'Срез пройден. F2 — переиграть.';
}

function installStyle() {
  if (document.getElementById('ashUiStyleV1')) return;
  const style = document.createElement('style');
  style.id = 'ashUiStyleV1';
  style.textContent = `
    #objective { display:none!important; }
    #bars { display:none!important; }
    #bottom { display:none!important; }
    #prompt { z-index:44!important; bottom:165px!important; font:900 15px system-ui!important; color:#ffe1a6!important; border:1px solid rgba(216,166,77,.7)!important; background:rgba(11,7,4,.86)!important; box-shadow:0 10px 35px rgba(0,0,0,.5)!important; border-radius:8px!important; }
    #panel { border:2px solid #b98b45!important; background:linear-gradient(135deg,rgba(37,27,18,.98),rgba(11,8,6,.98))!important; color:#f3dca8!important; box-shadow:0 30px 95px rgba(0,0,0,.82)!important; }
    #crosshair { color:#ffe1a6!important; text-shadow:0 0 16px #000,0 0 4px #d8a64d!important; }
    #ashUiRoot { position:fixed; inset:0; z-index:18; pointer-events:none; color:#f3dca8; font-family:"Trebuchet MS",system-ui,sans-serif; text-shadow:0 2px 10px #000; }
    .ash-panel { position:absolute; border:1px solid rgba(216,166,77,.5); background:linear-gradient(135deg,rgba(34,22,14,.82),rgba(8,5,3,.62)); box-shadow:0 14px 46px rgba(0,0,0,.42), inset 0 0 30px rgba(216,166,77,.04); backdrop-filter:blur(6px); }
    .ash-title { color:#ffd996; font-weight:900; text-transform:uppercase; letter-spacing:.08em; font-size:12px; }
    .ash-muted { color:#bfa279; font-size:12px; line-height:1.3; }
    #ashQuest { left:16px; top:14px; width:min(510px,calc(100vw - 32px)); padding:12px 14px; border-left:4px solid #d8a64d; }
    #ashQuest .stage { display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:7px; }
    #ashQuest .stage b { color:#ffe2aa; font-size:16px; }
    #ashQuest .stage span { color:#0d0905; background:#d8a64d; border-radius:999px; padding:3px 8px; font-weight:900; font-size:11px; text-shadow:none; }
    #ashQuestObjective { color:#f6dfb5; font-size:14px; line-height:1.35; }
    #ashCompass { top:14px; left:50%; transform:translateX(-50%); min-width:260px; padding:9px 14px; text-align:center; border-top:3px solid #d8a64d; }
    #ashClock { top:14px; right:16px; padding:9px 14px; min-width:142px; text-align:right; border-right:4px solid #d8a64d; }
    #ashVitals { left:16px; bottom:20px; width:250px; padding:12px; }
    .ash-bar { display:grid; grid-template-columns:32px 1fr 42px; gap:8px; align-items:center; margin:8px 0; }
    .ash-bar b { color:#ffd996; font-size:12px; }
    .ash-track { height:12px; background:#100b08; border:1px solid rgba(216,166,77,.35); box-shadow:inset 0 0 12px rgba(0,0,0,.8); }
    .ash-fill { height:100%; width:50%; background:linear-gradient(90deg,#8f2f21,#d8a64d); box-shadow:0 0 12px rgba(216,166,77,.35); }
    .ash-st .ash-fill { background:linear-gradient(90deg,#55401c,#e0b45e); }
    .ash-ph .ash-fill { background:linear-gradient(90deg,#2e4778,#7bc6ff); }
    .ash-num { color:#d7c0a0; font-size:11px; text-align:right; }
    #ashWeapon { right:16px; bottom:20px; width:315px; padding:13px; border-right:4px solid #d8a64d; }
    #ashWeaponName { color:#ffe2aa; font-size:20px; font-weight:900; line-height:1.05; }
    #ashWeaponMeta { margin-top:5px; color:#c9b58c; font-size:12px; }
    #ashAmmoLine { display:flex; gap:10px; align-items:center; margin-top:10px; padding-top:10px; border-top:1px solid rgba(216,166,77,.25); }
    #ashAmmoBig { color:#ffe2aa; font-size:26px; font-weight:900; }
    #ashHotbar { left:50%; bottom:20px; transform:translateX(-50%); display:flex; gap:5px; padding:8px; }
    .ash-slot { width:42px; height:42px; border:1px solid rgba(216,166,77,.38); background:rgba(13,8,5,.72); display:grid; place-items:center; position:relative; border-radius:5px; }
    .ash-slot.active { border-color:#ffe2aa; background:rgba(216,166,77,.16); box-shadow:0 0 18px rgba(216,166,77,.28); }
    .ash-slot small { position:absolute; left:3px; top:1px; color:#d8a64d; font-size:10px; font-weight:900; }
    .ash-slot .itemIcon { margin:0!important; transform:scale(.86); }
    #ashActionStrip { left:50%; bottom:76px; transform:translateX(-50%); padding:7px 12px; color:#c9b58c; font-size:12px; border-radius:999px; }
    #ashActionStrip b { color:#ffe2aa; }
    #ashAct1Tracker, #act1QuestTracker { display:none!important; }
    @media(max-width:860px){ #ashCompass{display:none} #ashQuest{width:calc(100vw - 32px)} #ashWeapon{right:10px;bottom:12px;width:250px} #ashVitals{left:10px;bottom:12px;width:210px} #ashHotbar{display:none} }
  `;
  document.head.appendChild(style);
}

function rootHtml() {
  return `<div id="ashUiRoot">
    <section id="ashQuest" class="ash-panel"><div class="stage"><b id="ashQuestStage">Act 1</b><span id="ashQuestPill">ROUTE</span></div><div id="ashQuestObjective">loading...</div></section>
    <section id="ashCompass" class="ash-panel"><div class="ash-title" id="ashLocation">Ashgrave</div><div class="ash-muted" id="ashCoords">x 0 · z 0</div></section>
    <section id="ashClock" class="ash-panel"><div class="ash-title" id="ashTime">08:33 · День</div><div class="ash-muted">F2 route · F3 target</div></section>
    <section id="ashVitals" class="ash-panel"><div class="ash-title">Состояние</div><div class="ash-bar ash-hp"><b>HP</b><div class="ash-track"><div id="ashHp" class="ash-fill"></div></div><span id="ashHpNum" class="ash-num"></span></div><div class="ash-bar ash-st"><b>ST</b><div class="ash-track"><div id="ashSt" class="ash-fill"></div></div><span id="ashStNum" class="ash-num"></span></div><div class="ash-bar ash-ph"><b>PH</b><div class="ash-track"><div id="ashPh" class="ash-fill"></div></div><span id="ashPhNum" class="ash-num"></span></div></section>
    <section id="ashWeapon" class="ash-panel"><div class="ash-title">Оружие</div><div id="ashWeaponName">—</div><div id="ashWeaponMeta">—</div><div id="ashAmmoLine"><div id="ashAmmoBig">—</div><div class="ash-muted" id="ashAmmoMeta">ammo</div></div></section>
    <section id="ashHotbar" class="ash-panel"></section>
    <section id="ashActionStrip" class="ash-panel"><b>I</b> инвентарь · <b>J</b> журнал · <b>U</b> арсенал · <b>N</b> бросить · <b>E</b> действие</section>
  </div>`;
}

function ensureUi() {
  installStyle();
  let root = document.getElementById('ashUiRoot');
  if (!root) {
    document.body.insertAdjacentHTML('beforeend', rootHtml());
    root = document.getElementById('ashUiRoot');
  }
  return root;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setWidth(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.width = `${value}%`;
}

function updateHotbar(engine) {
  const el = document.getElementById('ashHotbar');
  if (!el) return;
  const ids = ['m1911a1','mp40','ppsh41','thompsonM1928','k98k','m1GarandWw2','winchester1897','mg42','bazookaM1','mk2GrenadeProto'];
  el.innerHTML = ids.map((id, index) => `<div class="ash-slot ${engine.player.weapon === id ? 'active' : ''}"><small>${(index + 1) % 10}</small>${itemIconHtml(id)}</div>`).join('');
}

function updateUi(engine) {
  const root = ensureUi();
  root.style.display = engine.mode === 'boot' ? 'none' : 'block';
  if (engine.mode === 'boot') return;

  const p = engine.player;
  setWidth('ashHp', pct(p.hp, p.hpMax));
  setWidth('ashSt', pct(p.st, p.stMax));
  setWidth('ashPh', pct(p.ph, p.phMax));
  setText('ashHpNum', `${Math.round(p.hp)}/${p.hpMax}`);
  setText('ashStNum', `${Math.round(p.st)}/${p.stMax}`);
  setText('ashPhNum', `${Math.round(p.ph)}/${p.phMax}`);

  const biomeId = biomeAt(engine.rig.position.x, engine.rig.position.z);
  const biome = BIOMES.find((b) => b.id === biomeId);
  setText('ashLocation', biome?.name || 'Неизвестная зона');
  setText('ashCoords', `x ${Math.round(engine.rig.position.x)} · z ${Math.round(engine.rig.position.z)}`);

  const s = engine.act1Slice;
  setText('ashQuestStage', s?.active ? stageName(s.stage) : 'Свободный режим');
  setText('ashQuestPill', s?.active ? `ACT 1 · ${Math.min(6, (s.stage || 0) + 1)}/6` : 'F2 START');
  setText('ashQuestObjective', stageObjective(s));

  const w = ARSENAL[p.weapon] || {};
  setText('ashWeaponName', w.name || p.weapon || '—');
  const mode = engine.fireMode || (w.automatic ? 'AUTO' : 'SEMI');
  const condition = engine.firearms?.statusText?.(p.weapon) || '';
  setText('ashWeaponMeta', `${mode}${engine.aimMode ? ' · AIM' : ''}${condition ? ' · ' + condition : ''}`);
  const ammoType = w.ammoType || w.ammo;
  const ammoCount = engine.inventory?.ammoForWeapon?.(p.weapon);
  setText('ashAmmoBig', Number.isFinite(ammoCount) ? String(ammoCount) : '—');
  setText('ashAmmoMeta', `${ammoType ? (AMMO_TYPES[ammoType]?.name || ammoType) : 'no ammo'} · ${engine.paused ? 'PAUSED' : 'live'}`);

  const now = Math.floor((performance.now() / 1000) % 86400);
  const minutes = Math.floor((now / 60) % 60).toString().padStart(2, '0');
  const hours = Math.floor((8 + now / 3600) % 24).toString().padStart(2, '0');
  setText('ashTime', `${hours}:${minutes} · День`);
  updateHotbar(engine);
}

export function installAshgraveInterfaceExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__ashgraveInterfaceInstalled) return;
  PhoenixV3Engine.__ashgraveInterfaceInstalled = true;

  const originalBoot = PhoenixV3Engine.prototype.boot;
  PhoenixV3Engine.prototype.boot = function bootWithAshgraveUi() {
    ensureUi();
    return originalBoot.call(this);
  };

  const originalStart = PhoenixV3Engine.prototype.start;
  PhoenixV3Engine.prototype.start = function startWithAshgraveUi() {
    const result = originalStart.call(this);
    updateUi(this);
    return result;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithAshgraveUi(dt) {
    originalUpdate.call(this, dt);
    updateUi(this);
  };
}
