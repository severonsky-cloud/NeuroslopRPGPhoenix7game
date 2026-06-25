import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { makeMat, labelSprite } from '../world/props.js';

const BASE = { x: 760, z: 760 };
const CENTER = { x: BASE.x, z: BASE.z };
const DOOR = { x: BASE.x, z: BASE.z + 8 };
const SIDE = { x: BASE.x + 6, z: BASE.z + 2 };
const NPC = { x: BASE.x, z: BASE.z - 4 };
const LOOT = { x: BASE.x + 5, z: BASE.z - 3 };

function dist2(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
function yAt(x, z) { return heightAt(x, z); }
function material(color, opts = {}) { return makeMat(color, opts); }
function addNode(engine, obj) { engine.act1OpeningNodes ||= []; engine.act1OpeningNodes.push(obj); return obj; }

function disposeNode(obj) {
  obj.traverse?.((c) => {
    c.geometry?.dispose?.();
    if (Array.isArray(c.material)) c.material.forEach((m) => m?.dispose?.());
    else c.material?.dispose?.();
  });
  obj.parent?.remove?.(obj);
}

function clearOpeningScene(engine) {
  for (const n of engine.act1OpeningNodes || []) disposeNode(n);
  engine.act1OpeningNodes = [];
}

function mesh(engine, geo, color, pos, opts = {}) {
  const m = new THREE.Mesh(geo, material(color));
  m.position.set(pos.x, pos.y, pos.z);
  if (opts.rot) m.rotation.set(opts.rot.x || 0, opts.rot.y || 0, opts.rot.z || 0);
  m.castShadow = opts.castShadow ?? true;
  m.receiveShadow = opts.receiveShadow ?? true;
  engine.scene.add(m);
  return addNode(engine, m);
}

function box(engine, x, z, sx, sy, sz, color, y = null, opts = {}) {
  return mesh(engine, new THREE.BoxGeometry(sx, sy, sz), color, { x, y: y ?? yAt(x, z) + sy / 2, z }, opts);
}

function cyl(engine, x, z, radius, depth, color, y, rot = { x: Math.PI / 2 }) {
  return mesh(engine, new THREE.CylinderGeometry(radius, radius, depth, 16), color, { x, y, z }, { rot });
}

function light(engine, x, z, color = 0xffc879, intensity = 1.4, distance = 18, y = 3.1) {
  const l = new THREE.PointLight(color, intensity, distance);
  l.position.set(x, yAt(x, z) + y, z);
  engine.scene.add(l);
  return addNode(engine, l);
}

function label(engine, text, x, z, y = 3.4) {
  return addNode(engine, labelSprite(engine.scene, text, x, z, y, 0.44));
}

function buildShell(engine, title, w = 18, d = 18, wallColor = 0x26303a, floorColor = 0x11100e) {
  const x = CENTER.x; const z = CENTER.z; const y = yAt(x, z);
  box(engine, x, z, w, 0.18, d, floorColor, y + 0.04, { receiveShadow: true });
  box(engine, x, z, w, 0.2, d, 0x0b0d10, y + 3.2, { castShadow: false });
  box(engine, x, z - d / 2, w, 3.2, 0.32, wallColor, y + 1.6);
  box(engine, x, z + d / 2, w, 3.2, 0.32, wallColor, y + 1.6);
  box(engine, x - w / 2, z, 0.32, 3.2, d, wallColor, y + 1.6);
  box(engine, x + w / 2, z, 0.32, 3.2, d, wallColor, y + 1.6);
  light(engine, x - 4, z - 5, 0x89b8ff, 1.15, 15, 2.8);
  light(engine, x + 4, z + 4, 0xffb36a, 0.95, 13, 2.8);
  label(engine, title, x, z - d / 2 + 1.1, 3.7);
}

function makeDoor(engine, text = 'переход') {
  box(engine, DOOR.x, DOOR.z + 0.25, 4.2, 2.5, 0.22, 0x1b232b, yAt(DOOR.x, DOOR.z) + 1.25);
  box(engine, DOOR.x - 2.35, DOOR.z + 0.18, 0.18, 2.8, 0.4, 0xd0a05a, yAt(DOOR.x, DOOR.z) + 1.4);
  box(engine, DOOR.x + 2.35, DOOR.z + 0.18, 0.18, 2.8, 0.4, 0xd0a05a, yAt(DOOR.x, DOOR.z) + 1.4);
  label(engine, text, DOOR.x, DOOR.z + 0.6, 2.7);
}

function npc(engine, name, x = NPC.x, z = NPC.z, color = 0x445066) {
  const g = new THREE.Group();
  g.name = `opening_npc_${name}`;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 1.25, 6, 10), material(color));
  body.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), material(0xc69a70));
  head.position.y = 1.92;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.48), material(0x151515));
  cap.position.y = 2.18;
  g.add(body, head, cap);
  g.position.set(x, yAt(x, z), z);
  engine.scene.add(g);
  addNode(engine, g);
  label(engine, name, x, z, 2.8);
  return g;
}

function consoleProp(engine, x, z, name = 'терминал') {
  box(engine, x, z, 2.2, 0.85, 0.9, 0x20242a, yAt(x, z) + 0.42);
  const screen = box(engine, x, z - 0.48, 1.7, 0.72, 0.08, 0x1c5f6e, yAt(x, z) + 0.96, { castShadow: false });
  screen.userData.name = name;
}

function starWindow(engine, x, z) {
  box(engine, x, z, 4.8, 2.0, 0.08, 0x05070b, yAt(x, z) + 1.9, { castShadow: false });
  for (let i = 0; i < 18; i += 1) {
    const sx = x - 2 + Math.random() * 4;
    const sy = yAt(x, z) + 1.1 + Math.random() * 1.5;
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.025 + Math.random() * 0.025, 6, 4), material(0xdce9ff));
    star.position.set(sx, sy, z - 0.08);
    engine.scene.add(star);
    addNode(engine, star);
  }
}

function bed(engine, x, z) {
  box(engine, x, z, 2.1, 0.35, 4.1, 0x2a3038, yAt(x, z) + 0.34);
  box(engine, x, z - 1.2, 1.9, 0.22, 1.2, 0x516175, yAt(x, z) + 0.67);
}

function crate(engine, x, z, id, color = 0x31522b) {
  const g = new THREE.Group();
  g.name = id;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.8), material(color));
  body.position.y = 0.36;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.86), material(0x4c7b36));
  lid.position.y = 0.76;
  g.add(body, lid);
  g.position.set(x, yAt(x, z), z);
  g.userData = { id, openingLoot: true, collected: false };
  engine.scene.add(g);
  return addNode(engine, g);
}

function setAtmosphere(engine, kind) {
  engine.__openingAtmosphereSaved ||= {
    bg: engine.scene.background?.clone?.(),
    fog: engine.scene.fog,
  };
  if (kind === 'ship') {
    engine.scene.background = new THREE.Color(0x05070c);
    engine.scene.fog = new THREE.FogExp2(0x05070c, 0.025);
  } else if (kind === 'office') {
    engine.scene.background = new THREE.Color(0x1c120b);
    engine.scene.fog = new THREE.FogExp2(0x1c120b, 0.018);
  } else if (kind === 'outside') {
    engine.scene.background = new THREE.Color(0x6a3d25);
    engine.scene.fog = new THREE.FogExp2(0x6a3d25, 0.012);
  }
}

function restoreAtmosphere(engine) {
  const saved = engine.__openingAtmosphereSaved;
  if (!saved) return;
  engine.scene.background = saved.bg || engine.scene.background;
  engine.scene.fog = saved.fog || engine.scene.fog;
}

function teleport(engine, x = CENTER.x, z = CENTER.z) {
  engine.rig.position.set(x, yAt(x, z) + 1.7, z);
  engine.yaw = Math.PI;
}

function loadOpeningScene(engine, sceneId) {
  clearOpeningScene(engine);
  const s = openingState(engine);
  s.location = sceneId;

  if (sceneId === 'cabin') {
    setAtmosphere(engine, 'ship');
    buildShell(engine, 'Каюта звездолёта “Белая Аврора”', 14, 14, 0x202a38, 0x0d1014);
    bed(engine, CENTER.x - 3.3, CENTER.z + 1.2);
    consoleProp(engine, CENTER.x + 3.5, CENTER.z - 2.5, 'бортовой терминал');
    starWindow(engine, CENTER.x, CENTER.z - 6.85);
    makeDoor(engine, '[E] выйти в коридор корабля');
    teleport(engine, CENTER.x, CENTER.z + 2.8);
    engine.hud.setObjective('Каюта звездолёта. Осмотрись: это отдельная interior-локация, не открытый мир. Иди к двери.');
  }

  if (sceneId === 'corridor') {
    setAtmosphere(engine, 'ship');
    buildShell(engine, 'Коридор звездолёта', 10, 28, 0x252c33, 0x0f1114);
    for (let i = -10; i <= 10; i += 5) {
      cyl(engine, CENTER.x - 4.4, CENTER.z + i, 0.06, 3.5, 0x6a4c2d, yAt(CENTER.x, CENTER.z) + 2.65, { z: Math.PI / 2 });
      cyl(engine, CENTER.x + 4.4, CENTER.z + i, 0.06, 3.5, 0x6a4c2d, yAt(CENTER.x, CENTER.z) + 2.65, { z: Math.PI / 2 });
      box(engine, CENTER.x, CENTER.z + i, 8.4, 0.08, 0.18, 0xd0a05a, yAt(CENTER.x, CENTER.z) + 2.9, { castShadow: false });
    }
    npc(engine, 'Конвоир', CENTER.x - 2.6, CENTER.z + 4, 0x30323a);
    makeDoor(engine, '[E] к шлюзу и рампе');
    teleport(engine, CENTER.x, CENTER.z - 8);
    engine.hud.setObjective('Коридор звездолёта. Конвой ведёт прибывших к выходу. Иди к шлюзу.');
  }

  if (sceneId === 'ramp') {
    setAtmosphere(engine, 'outside');
    buildShell(engine, 'Шлюз и посадочная рампа', 20, 18, 0x48311f, 0x18100b);
    box(engine, CENTER.x, CENTER.z + 5, 8, 0.18, 8, 0x3a3f46, yAt(CENTER.x, CENTER.z) + 0.18);
    box(engine, CENTER.x, CENTER.z - 5.5, 12, 2.8, 0.34, 0x20242a, yAt(CENTER.x, CENTER.z) + 1.4);
    box(engine, CENTER.x - 5.6, CENTER.z + 2.2, 0.3, 2.2, 8, 0xd0a05a, yAt(CENTER.x, CENTER.z) + 1.1);
    box(engine, CENTER.x + 5.6, CENTER.z + 2.2, 0.3, 2.2, 8, 0xd0a05a, yAt(CENTER.x, CENTER.z) + 1.1);
    npc(engine, 'Солдат конвоя', CENTER.x - 4, CENTER.z + 0.5, 0x38362e);
    npc(engine, 'Солдат конвоя', CENTER.x + 4, CENTER.z + 0.5, 0x38362e);
    makeDoor(engine, '[E] пройти к посту регистрации');
    teleport(engine, CENTER.x, CENTER.z - 5.5);
    engine.hud.setObjective('Шлюз и рампа. Снаружи уже Ashgrave. Конвой просит пройти к регистрации.');
  }

  if (sceneId === 'guard') {
    setAtmosphere(engine, 'office');
    buildShell(engine, 'Пост регистрации колонии', 18, 16, 0x4a3827, 0x15100c);
    box(engine, CENTER.x, CENTER.z - 2.2, 8, 1.0, 1.2, 0x2f2117, yAt(CENTER.x, CENTER.z) + 0.5);
    consoleProp(engine, CENTER.x - 2.4, CENTER.z - 3.1, 'регистрационный терминал');
    npc(engine, 'Охранник регистрации', CENTER.x + 2.7, CENTER.z - 2.3, 0x30303a);
    makeDoor(engine, '[E] к канцелярии после регистрации');
    teleport(engine, CENTER.x, CENTER.z + 3.8);
    engine.hud.setObjective('Пост регистрации. Подойди к охраннику и ответь, откуда ты прибыл.');
  }

  if (sceneId === 'office') {
    setAtmosphere(engine, 'office');
    buildShell(engine, 'Канцелярия колонии', 22, 18, 0x5d432b, 0x17100b);
    for (let i = -6; i <= 6; i += 4) {
      box(engine, CENTER.x - 5, CENTER.z + i, 3.2, 0.8, 1.6, 0x332319, yAt(CENTER.x, CENTER.z) + 0.4);
      box(engine, CENTER.x + 4.8, CENTER.z + i, 3.2, 0.8, 1.6, 0x332319, yAt(CENTER.x, CENTER.z) + 0.4);
    }
    consoleProp(engine, CENTER.x, CENTER.z - 5.7, 'архив канцелярии');
    npc(engine, 'Колониальный офицер', CENTER.x + 6.3, CENTER.z - 4.7, 0x53623b);
    label(engine, 'кладовая с ценным лутом', LOOT.x, LOOT.z, 2.5);
    crate(engine, LOOT.x, LOOT.z, 'opening_luger_case', 0x2f4d34);
    crate(engine, LOOT.x + 1.3, LOOT.z + 1.2, 'opening_supply_crate', 0x51401e);
    makeDoor(engine, '[E] принять поручение и выйти в мир');
    teleport(engine, CENTER.x, CENTER.z + 3.5);
    engine.hud.setObjective('Канцелярия. Можно найти кладовую с лутом, затем поговорить с колониальным офицером.');
  }
}

function installOpeningStyle() {
  if (document.getElementById('act1OpeningStyle')) return;
  const style = document.createElement('style');
  style.id = 'act1OpeningStyle';
  style.textContent = `
    .openingHero{border:1px solid rgba(216,166,77,.35);background:linear-gradient(135deg,rgba(75,44,22,.42),rgba(0,0,0,.22));padding:12px;border-radius:12px;margin:8px 0}.openingChoice{display:block;width:100%;text-align:left;margin:6px 0;padding:10px;border:1px solid rgba(216,166,77,.28);border-radius:10px;background:rgba(0,0,0,.24);color:#f2dfbf;cursor:pointer}.openingChoice:hover{background:rgba(216,166,77,.14)}.openingGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.statBox{border:1px solid rgba(216,166,77,.24);padding:8px;border-radius:8px;background:rgba(0,0,0,.2)}.statBox b{color:#ffd997}.rpgNote{color:#c9b58c;font-size:13px;line-height:1.35}.openingBadge{display:inline-block;border:1px solid rgba(216,166,77,.4);border-radius:999px;padding:3px 8px;margin:2px;color:#ffd997;background:rgba(0,0,0,.22);font-size:12px}.openingTerminal{font-family:ui-monospace,Consolas,monospace;color:#9ee7ff;background:rgba(0,0,0,.3);border:1px solid rgba(120,190,220,.25);padding:8px;border-radius:8px}
  `;
  document.head.appendChild(style);
}

function openingState(engine) {
  engine.act1Opening = engine.act1Opening || {
    active: false,
    stage: 0,
    location: null,
    origin: null,
    characterDone: false,
    pointsLeft: 5,
    stats: { strength: 5, agility: 5, endurance: 5, intellect: 5, charisma: 5, luck: 5 },
    skills: { firearms: 20, speech: 20, security: 15, medicine: 10, trade: 15, survival: 15 },
    lootTaken: false,
    officerDone: false,
  };
  return engine.act1Opening;
}

function startOpening(engine) {
  installOpeningStyle();
  const s = openingState(engine);
  s.active = true;
  s.stage = 0;
  s.origin = null;
  s.characterDone = false;
  s.pointsLeft = 5;
  s.lootTaken = false;
  s.officerDone = false;
  loadOpeningScene(engine, 'cabin');
  engine.paused = true;
  engine.hud.openPanel(`<h2>Прибытие в Ashgrave</h2><div class="openingHero"><b>Ты просыпаешься в каюте звездолёта.</b><p>Это не открытый мир. Это первая отдельная локация: металл, потолок, иллюминатор, шум корабля и закрытая дверь.</p></div><div class="openingTerminal">БОРТОВОЙ ТЕРМИНАЛ: “Прибывшие направляются на регистрацию. Конвой ждёт у шлюза.”</div><button id="openingBeginBtn">Встать с койки</button>`);
  document.getElementById('openingBeginBtn')?.addEventListener('click', () => {
    engine.closePausePanel();
    s.stage = 1;
    engine.hud.setObjective('Каюта звездолёта. Подойди к двери и нажми E.');
  });
}

function originHtml() {
  return `<h2>Охранник регистрации</h2><p><b>Охранник:</b> “Стой. Откуда прибыл?”</p><button class="openingChoice" data-origin="ship_deserter">С военного транспорта. Документы неполные.</button><button class="openingChoice" data-origin="frontier_worker">С пограничной вахты. Ищу контракт.</button><button class="openingChoice" data-origin="archive_clerk">Из архивной службы. Назначение потерялось.</button><button class="openingChoice" data-origin="convict_pardon">По амнистии. Мне обещали работу.</button><p class="rpgNote">Выбор даст небольшой RPG-уклон и откроет экран персонажа.</p>`;
}

function applyOrigin(engine, origin) {
  const s = openingState(engine);
  s.origin = origin;
  if (origin === 'ship_deserter') { s.skills.firearms += 10; s.stats.endurance += 1; }
  if (origin === 'frontier_worker') { s.skills.survival += 10; s.stats.strength += 1; }
  if (origin === 'archive_clerk') { s.skills.speech += 5; s.skills.trade += 5; s.stats.intellect += 1; }
  if (origin === 'convict_pardon') { s.skills.security += 10; s.stats.luck += 1; }
  s.stage = 4;
  openCharacterCreation(engine);
}

function openCharacterCreation(engine) {
  const s = openingState(engine);
  engine.paused = true;
  const statRows = Object.entries(s.stats).map(([k, v]) => `<div class="statBox"><b>${k}</b><br>${v} <button data-stat="${k}">+</button></div>`).join('');
  const skillRows = Object.entries(s.skills).map(([k, v]) => `<span class="openingBadge">${k}: ${v}</span>`).join('');
  engine.hud.openPanel(`<h2>Создание персонажа</h2><p>Канцелярия задаёт вопросы, но можно распределить очки вручную. Это первый рабочий RPG-слой: характеристики + навыки в духе Morrowind.</p><div class="openingGrid">${statRows}</div><p><b>Очки:</b> ${s.pointsLeft}</p><p>${skillRows}</p><button id="openingQWar">Ответ: “Я умею выживать и стрелять”.</button> <button id="openingQTalk">Ответ: “Я умею говорить и торговаться”.</button> <button id="openingFinishChar">Готово</button>`);
  document.querySelectorAll('[data-stat]').forEach((btn) => btn.addEventListener('click', () => {
    if (s.pointsLeft <= 0) return;
    s.stats[btn.dataset.stat] += 1;
    s.pointsLeft -= 1;
    openCharacterCreation(engine);
  }));
  document.getElementById('openingQWar')?.addEventListener('click', () => { s.skills.firearms += 10; s.skills.survival += 5; s.pointsLeft = Math.max(0, s.pointsLeft - 1); openCharacterCreation(engine); });
  document.getElementById('openingQTalk')?.addEventListener('click', () => { s.skills.speech += 10; s.skills.trade += 5; s.pointsLeft = Math.max(0, s.pointsLeft - 1); openCharacterCreation(engine); });
  document.getElementById('openingFinishChar')?.addEventListener('click', () => finishCharacter(engine));
}

function finishCharacter(engine) {
  const s = openingState(engine);
  s.characterDone = true;
  s.stage = 5;
  engine.closePausePanel();
  loadOpeningScene(engine, 'office');
  engine.player.credits = Math.max(engine.player.credits || 0, 20);
  engine.rpg?.useSkill?.('speech', 1);
  engine.hud.setObjective('Регистрация завершена. Ты в канцелярии. Найди кладовую с лутом, затем поговори с офицером.');
}

function grantOpeningLoot(engine) {
  const s = openingState(engine);
  if (s.lootTaken) { engine.hud.setObjective('Кладовая уже обыскана. Пора к офицеру.'); return; }
  s.lootTaken = true;
  engine.player.credits = (engine.player.credits || 0) + 35;
  engine.player.inventoryState.items = [...new Set([...(engine.player.inventoryState.items || []), 'lugerP08'])];
  engine.player.inventoryState.equipment.rightHand = 'lugerP08';
  engine.player.inventoryState.equipment.activeHand = 'rightHand';
  engine.inventory?.addAmmo?.('pistol9', 18);
  engine.player.weapon = 'lugerP08';
  engine.buildViewModel?.();
  engine.hud.setObjective('Кладовая: найден Люгер P08, 18 патронов 9mm и немного денег. Теперь к колониальному офицеру.');
}

function officerPanel(engine) {
  const s = openingState(engine);
  engine.paused = true;
  engine.hud.openPanel(`<h2>Колониальный офицер</h2><p><b>Офицер:</b> “Регистрация закончена. Если хочешь не умереть в первый день, доберись до Форта Заря и найди Герду. Она объяснит, кому здесь можно верить.”</p><div class="openingHero"><b>Первый квест:</b> Форт Заря → поговорить с Гердой.</div><p>Выдано: немного денег, Люгер P08, 18 патронов 9mm. После этого открывается внешний мир.</p><button id="openingAcceptQuest">Принять поручение и выйти в мир</button>`);
  document.getElementById('openingAcceptQuest')?.addEventListener('click', () => {
    s.officerDone = true;
    s.stage = 7;
    s.active = false;
    engine.closePausePanel();
    clearOpeningScene(engine);
    restoreAtmosphere(engine);
    engine.act1SliceStart?.({ teleport: true });
    engine.hud.setObjective('Первый квест: добраться до Форта Заря и поговорить с Гердой. Открытый мир доступен.');
  });
}

function openingJournal(engine, base = '') {
  const s = openingState(engine);
  return `${base}<hr><h2>Act 1: Прибытие</h2><div class="line"><b>Локация:</b> ${s.location || '—'}</div><div class="line"><b>Стадия:</b> ${s.stage}</div><div class="line"><b>Происхождение:</b> ${s.origin || 'ещё не выбрано'}</div><div class="line"><b>Персонаж:</b> ${s.characterDone ? 'создан' : 'не создан'}</div><div class="line"><b>Кладовая:</b> ${s.lootTaken ? 'обыскана' : 'можно найти лут'}</div><div class="line"><b>Первый квест:</b> ${s.officerDone ? 'Форт Заря / Герда' : 'поговорить с колониальным офицером'}</div>`;
}

function openingPrompt(engine) {
  const s = openingState(engine);
  if (!s.active || engine.paused) return;
  const p = engine.rig.position;
  if (['cabin', 'corridor', 'ramp'].includes(s.location) && dist2(p, DOOR) < 5) engine.hud.showPrompt('[E] перейти дальше');
  if (s.location === 'guard' && dist2(p, NPC) < 6) engine.hud.showPrompt('[E] ответить охраннику');
  if (s.location === 'office' && !s.lootTaken && dist2(p, LOOT) < 5.5) engine.hud.showPrompt('[E] обыскать кладовую');
  if (s.location === 'office' && dist2(p, { x: CENTER.x + 6.3, z: CENTER.z - 4.7 }) < 5.8) engine.hud.showPrompt('[E] поговорить с колониальным офицером');
}

function openingInteract(engine) {
  const s = openingState(engine);
  if (!s.active) return false;
  const p = engine.rig.position;
  if (s.location === 'cabin' && dist2(p, DOOR) < 5.5) { s.stage = 2; loadOpeningScene(engine, 'corridor'); return true; }
  if (s.location === 'corridor' && dist2(p, DOOR) < 5.5) { s.stage = 3; loadOpeningScene(engine, 'ramp'); return true; }
  if (s.location === 'ramp' && dist2(p, DOOR) < 5.5) { s.stage = 3; loadOpeningScene(engine, 'guard'); return true; }
  if (s.location === 'guard' && dist2(p, NPC) < 6) {
    engine.paused = true;
    engine.hud.openPanel(originHtml());
    document.querySelectorAll('[data-origin]').forEach((btn) => btn.addEventListener('click', () => applyOrigin(engine, btn.dataset.origin)));
    return true;
  }
  if (s.location === 'office' && !s.lootTaken && dist2(p, LOOT) < 5.8) { grantOpeningLoot(engine); return true; }
  if (s.location === 'office' && dist2(p, { x: CENTER.x + 6.3, z: CENTER.z - 4.7 }) < 6) { officerPanel(engine); return true; }
  return false;
}

function teleportObjective(engine) {
  const s = openingState(engine);
  if (!s.active) return false;
  if (['cabin', 'corridor', 'ramp'].includes(s.location)) teleport(engine, DOOR.x, DOOR.z - 1.4);
  else if (s.location === 'guard') teleport(engine, NPC.x, NPC.z + 2);
  else if (s.location === 'office' && !s.lootTaken) teleport(engine, LOOT.x, LOOT.z + 1.8);
  else if (s.location === 'office') teleport(engine, CENTER.x + 6.3, CENTER.z - 2.5);
  else return false;
  return true;
}

export function installAct1OpeningExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__act1OpeningInstalled) return;
  PhoenixV3Engine.__act1OpeningInstalled = true;

  PhoenixV3Engine.prototype.startAct1Opening = function startAct1Opening() { startOpening(this); };

  const originalBoot = PhoenixV3Engine.prototype.boot;
  PhoenixV3Engine.prototype.boot = function bootAct1Opening(...args) {
    const result = originalBoot.call(this, ...args);
    installOpeningStyle();
    return result;
  };

  const originalStart = PhoenixV3Engine.prototype.start;
  PhoenixV3Engine.prototype.start = function startWithOpening(...args) {
    originalStart.call(this, ...args);
    const params = new URLSearchParams(location.search);
    if (params.get('opening') === '1' || params.get('act1') === '1') startOpening(this);
  };

  const originalInteract = PhoenixV3Engine.prototype.interact;
  PhoenixV3Engine.prototype.interact = function interactOpening(...args) {
    if (openingInteract(this)) return;
    return originalInteract.call(this, ...args);
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionOpening(code, event) {
    if (code === 'F3' && teleportObjective(this)) { event?.preventDefault?.(); return; }
    if (code === 'F6') { event?.preventDefault?.(); startOpening(this); return; }
    return originalOnAction.call(this, code, event);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateOpening(dt) {
    originalUpdate.call(this, dt);
    openingPrompt(this);
  };

  const originalJournal = PhoenixV3Engine.prototype.act1SliceJournalHtml;
  PhoenixV3Engine.prototype.act1SliceJournalHtml = function act1JournalOpening() {
    const base = originalJournal ? originalJournal.call(this) : '';
    return openingJournal(this, base);
  };
}
