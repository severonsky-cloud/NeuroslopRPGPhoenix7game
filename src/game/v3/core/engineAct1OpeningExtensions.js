import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { makeMat, labelSprite } from '../world/props.js';

const OPENING_SPAWN = { x: -42, z: -186 };
const SHIP_HALL = { x: -42, z: -150 };
const LANDING_YARD = { x: -42, z: -108 };
const GUARD_POST = { x: -36, z: -92 };
const OFFICE = { x: -18, z: -70 };
const LOOT_ROOM = { x: -4, z: -68 };
const OFFICER = { x: 6, z: -84 };
const WORLD_GATE = { x: 16, z: -101 };

function dist2(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
function h(x, z) { return heightAt(x, z); }
function mat(color, opts = {}) { return makeMat(color, opts); }

function box(scene, x, z, sx, sz, sy, color, y = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat(color));
  mesh.position.set(x, y ?? h(x, z) + sy / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function room(scene, name, x, z, w, d, color, openSide = 'south') {
  const nodes = [];
  nodes.push(box(scene, x, z, w, d, 0.16, 0x17100b, h(x, z) + 0.03));
  nodes.push(box(scene, x, z, w, 0.28, 3.2, color, h(x, z) + 1.6));
  nodes[nodes.length - 1].position.z = z - d / 2;
  nodes.push(box(scene, x, z, w, 0.28, 3.2, color, h(x, z) + 1.6));
  nodes[nodes.length - 1].position.z = z + d / 2;
  nodes.push(box(scene, x, z, 0.28, d, 3.2, color, h(x, z) + 1.6));
  nodes[nodes.length - 1].position.x = x - w / 2;
  nodes.push(box(scene, x, z, 0.28, d, 3.2, color, h(x, z) + 1.6));
  nodes[nodes.length - 1].position.x = x + w / 2;
  const roof = box(scene, x, z, w, d, 0.18, 0x2a1b12, h(x, z) + 3.28);
  nodes.push(roof);
  const label = labelSprite(scene, name, x, z, 4.1, 0.48);
  nodes.push(label);
  return nodes;
}

function npcMarker(scene, name, x, z, color = 0xa67844) {
  const group = new THREE.Group();
  group.name = `opening_npc_${name}`;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.25, 6, 10), mat(color));
  body.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), mat(0xc79a6e));
  head.position.y = 1.9;
  group.add(body, head);
  group.position.set(x, h(x, z), z);
  scene.add(group);
  const label = labelSprite(scene, name, x, z, 2.8, 0.42);
  return [group, label];
}

function propCrate(scene, x, z, id, color = 0x31522b) {
  const g = new THREE.Group();
  g.name = id;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.8), mat(color));
  body.position.y = 0.36;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.86), mat(0x4c7b36));
  lid.position.y = 0.76;
  g.add(body, lid);
  g.position.set(x, h(x, z), z);
  g.userData = { id, openingLoot: true, collected: false };
  scene.add(g);
  return g;
}

function installOpeningStyle() {
  if (document.getElementById('act1OpeningStyle')) return;
  const style = document.createElement('style');
  style.id = 'act1OpeningStyle';
  style.textContent = `
    .openingHero{border:1px solid rgba(216,166,77,.35);background:linear-gradient(135deg,rgba(75,44,22,.42),rgba(0,0,0,.22));padding:12px;border-radius:12px;margin:8px 0}.openingChoice{display:block;width:100%;text-align:left;margin:6px 0;padding:10px;border:1px solid rgba(216,166,77,.28);border-radius:10px;background:rgba(0,0,0,.24);color:#f2dfbf;cursor:pointer}.openingChoice:hover{background:rgba(216,166,77,.14)}.openingGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.statBox{border:1px solid rgba(216,166,77,.24);padding:8px;border-radius:8px;background:rgba(0,0,0,.2)}.statBox b{color:#ffd997}.rpgNote{color:#c9b58c;font-size:13px;line-height:1.35}.openingBadge{display:inline-block;border:1px solid rgba(216,166,77,.4);border-radius:999px;padding:3px 8px;margin:2px;color:#ffd997;background:rgba(0,0,0,.22);font-size:12px}
  `;
  document.head.appendChild(style);
}

function removeNodes(engine) {
  for (const n of engine.act1OpeningNodes || []) {
    n.parent?.remove?.(n);
    n.traverse?.((c) => { c.geometry?.dispose?.(); if (Array.isArray(c.material)) c.material.forEach(m => m?.dispose?.()); else c.material?.dispose?.(); });
  }
  engine.act1OpeningNodes = [];
}

function buildOpeningLocations(engine) {
  if (engine.act1OpeningBuilt) return;
  engine.act1OpeningBuilt = true;
  const nodes = engine.act1OpeningNodes = engine.act1OpeningNodes || [];
  nodes.push(...room(engine.scene, 'Каюта прибывшего корабля', OPENING_SPAWN.x, OPENING_SPAWN.z, 12, 12, 0x263044));
  nodes.push(...room(engine.scene, 'Коридор звёздолёта', SHIP_HALL.x, SHIP_HALL.z, 10, 30, 0x2c3036));
  nodes.push(...room(engine.scene, 'Выход под конвоем', LANDING_YARD.x, LANDING_YARD.z, 18, 12, 0x40301f));
  nodes.push(...room(engine.scene, 'Канцелярия колонии', OFFICE.x, OFFICE.z, 24, 18, 0x5e4630));
  nodes.push(...room(engine.scene, 'Запертая кладовая', LOOT_ROOM.x, LOOT_ROOM.z, 10, 10, 0x3a2b20));
  nodes.push(...npcMarker(engine.scene, 'Охранник регистрации', GUARD_POST.x, GUARD_POST.z, 0x30303a));
  nodes.push(...npcMarker(engine.scene, 'Колониальный офицер', OFFICER.x, OFFICER.z, 0x53623b));
  nodes.push(labelSprite(engine.scene, 'Форт Заря: дорога откроется после поручения', WORLD_GATE.x, WORLD_GATE.z, 3.2, 0.42));
  nodes.push(propCrate(engine.scene, LOOT_ROOM.x + 2.2, LOOT_ROOM.z + 1.7, 'opening_luger_case', 0x2f4d34));
  nodes.push(propCrate(engine.scene, LOOT_ROOM.x - 1.8, LOOT_ROOM.z - 1.4, 'opening_supply_crate', 0x51401e));
  box(engine.scene, SHIP_HALL.x, SHIP_HALL.z + 15, 7, 0.4, 2.2, 0x20242c);
  box(engine.scene, LANDING_YARD.x + 8, LANDING_YARD.z, 0.5, 9, 2.6, 0x5a3a24);
}

function openingState(engine) {
  engine.act1Opening = engine.act1Opening || {
    active: false,
    stage: 0,
    origin: null,
    characterDone: false,
    classPicked: false,
    pointsLeft: 5,
    stats: { strength: 5, agility: 5, endurance: 5, intellect: 5, charisma: 5, luck: 5 },
    skills: { firearms: 20, speech: 20, security: 15, medicine: 10, trade: 15, survival: 15 },
    lootTaken: false,
    officerDone: false,
  };
  return engine.act1Opening;
}

function teleport(engine, p) {
  engine.rig.position.set(p.x, h(p.x, p.z) + 1.7, p.z);
}

function startOpening(engine) {
  installOpeningStyle();
  buildOpeningLocations(engine);
  const s = openingState(engine);
  s.active = true;
  s.stage = 0;
  teleport(engine, OPENING_SPAWN);
  engine.paused = true;
  engine.hud.setObjective('Act 1: каюта корабля. Прочитай интро и начни регистрацию.');
  engine.hud.openPanel(`<h2>Прибытие в Ashgrave</h2><div class="openingHero"><b>Ты просыпаешься в тесной каюте колониального звездолёта.</b><p>Гул двигателей стихает. За переборкой скрипят ботинки конвоя. На двери мигает сухая надпись: “Прибывшие — на регистрацию”.</p></div><p>Это начало первого акта: не открытый мир сразу, а короткая RPG-регистрация, канцелярия, первый лут и первое поручение.</p><button id="openingBeginBtn">Встать с койки</button>`);
  document.getElementById('openingBeginBtn')?.addEventListener('click', () => {
    engine.closePausePanel();
    s.stage = 1;
    engine.hud.setObjective('Иди по коридору корабля к выходу. F3 — телепорт к следующей точке.');
  });
}

function originHtml(engine) {
  return `<h2>Охранник регистрации</h2><p><b>Охранник:</b> “Стой. Откуда прибыл?”</p><button class="openingChoice" data-origin="ship_deserter">С военного транспорта. Документы неполные.</button><button class="openingChoice" data-origin="frontier_worker">С пограничной вахты. Ищу контракт.</button><button class="openingChoice" data-origin="archive_clerk">Из архивной службы. Назначение потерялось.</button><button class="openingChoice" data-origin="convict_pardon">По амнистии. Мне обещали работу.</button><p class="rpgNote">Выбор даст небольшой RPG-уклон и откроет экран персонажа.</p>`;
}

function applyOrigin(engine, origin) {
  const s = openingState(engine);
  s.origin = origin;
  if (origin === 'ship_deserter') { s.skills.firearms += 10; s.stats.endurance += 1; }
  if (origin === 'frontier_worker') { s.skills.survival += 10; s.stats.strength += 1; }
  if (origin === 'archive_clerk') { s.skills.speech += 5; s.skills.trade += 5; s.stats.intellect += 1; }
  if (origin === 'convict_pardon') { s.skills.security += 10; s.stats.luck += 1; }
  s.stage = 3;
  openCharacterCreation(engine);
}

function openCharacterCreation(engine) {
  const s = openingState(engine);
  engine.paused = true;
  const statRows = Object.entries(s.stats).map(([k, v]) => `<div class="statBox"><b>${k}</b><br>${v} <button data-stat="${k}">+</button></div>`).join('');
  const skillRows = Object.entries(s.skills).map(([k, v]) => `<span class="openingBadge">${k}: ${v}</span>`).join('');
  engine.hud.openPanel(`<h2>Создание персонажа</h2><p>Можно ответить на вопросы или распределить очки вручную. Сейчас делаем первый рабочий RPG-срез: SPECIAL-подобные характеристики + навыки в духе Morrowind.</p><div class="openingGrid">${statRows}</div><p><b>Очки:</b> ${s.pointsLeft}</p><p>${skillRows}</p><button id="openingQWar">Ответ: “Я умею выживать и стрелять”.</button> <button id="openingQTalk">Ответ: “Я умею говорить и торговаться”.</button> <button id="openingFinishChar">Готово</button>`);
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
  s.stage = 4;
  engine.closePausePanel();
  engine.player.credits = Math.max(engine.player.credits || 0, 20);
  engine.rpg?.useSkill?.('speech', 1);
  engine.hud.setObjective('Регистрация завершена. Осмотри канцелярию, найди кладовую с лутом, потом поговори с офицером.');
}

function lootOpening(engine) {
  const s = openingState(engine);
  if (s.lootTaken) { engine.hud.setObjective('Кладовая уже обыскана. Пора к офицеру.'); return; }
  s.lootTaken = true;
  engine.player.credits = (engine.player.credits || 0) + 35;
  engine.inventory?.addAmmo?.('pistol9', 18);
  if (engine.inventory?.addWeapon) engine.inventory.addWeapon('lugerP08');
  engine.player.weapon = 'lugerP08';
  engine.buildViewModel?.();
  engine.hud.setObjective('Ты нашёл ценный лут: немного денег, Люгер и патроны. Теперь поговори с колониальным офицером.');
}

function officerPanel(engine) {
  const s = openingState(engine);
  engine.paused = true;
  engine.hud.openPanel(`<h2>Колониальный офицер</h2><p><b>Офицер:</b> “Регистрация закончена. Если хочешь не умереть в первый день, доберись до Форта Заря и найди Герду. Она объяснит, кому здесь можно верить.”</p><div class="openingHero"><b>Первый квест:</b> Форт Заря → поговорить с Гердой.</div><p>Выдано: немного денег, Люгер P08, 18 патронов 9mm. После этого открывается внешний мир.</p><button id="openingAcceptQuest">Принять поручение</button>`);
  document.getElementById('openingAcceptQuest')?.addEventListener('click', () => {
    s.officerDone = true;
    s.stage = 6;
    engine.closePausePanel();
    engine.act1SliceStart?.({ teleport: true });
    engine.hud.setObjective('Первый квест: добраться до Форта Заря и поговорить с Гердой. Открытый мир доступен.');
  });
}

function openingJournal(engine, base = '') {
  const s = openingState(engine);
  return `${base}<hr><h2>Act 1: Прибытие</h2><div class="line"><b>Стадия:</b> ${s.stage}</div><div class="line"><b>Происхождение:</b> ${s.origin || 'ещё не выбрано'}</div><div class="line"><b>Персонаж:</b> ${s.characterDone ? 'создан' : 'не создан'}</div><div class="line"><b>Кладовая:</b> ${s.lootTaken ? 'обыскана' : 'можно найти лут'}</div><div class="line"><b>Первый квест:</b> ${s.officerDone ? 'Форт Заря / Герда' : 'поговорить с колониальным офицером'}</div>`;
}

function openingPrompt(engine) {
  const s = openingState(engine);
  if (!s.active || engine.paused) return;
  const p = engine.rig.position;
  if (s.stage === 1 && dist2(p, SHIP_HALL) < 10) { s.stage = 2; engine.hud.setObjective('Выход под конвоем. Подойди к охраннику регистрации.'); }
  if (s.stage === 2 && dist2(p, GUARD_POST) < 5) engine.hud.showPrompt('[E] Ответить охраннику');
  if (s.stage >= 4 && !s.lootTaken && dist2(p, LOOT_ROOM) < 6) engine.hud.showPrompt('[E] Обыскать кладовую');
  if (s.stage >= 4 && dist2(p, OFFICER) < 6) engine.hud.showPrompt('[E] Поговорить с колониальным офицером');
}

function openingInteract(engine) {
  const s = openingState(engine);
  if (!s.active) return false;
  const p = engine.rig.position;
  if (s.stage === 2 && dist2(p, GUARD_POST) < 6) {
    engine.paused = true;
    engine.hud.openPanel(originHtml(engine));
    document.querySelectorAll('[data-origin]').forEach((btn) => btn.addEventListener('click', () => applyOrigin(engine, btn.dataset.origin)));
    return true;
  }
  if (s.stage >= 4 && !s.lootTaken && dist2(p, LOOT_ROOM) < 6) { lootOpening(engine); return true; }
  if (s.stage >= 4 && dist2(p, OFFICER) < 6) { officerPanel(engine); return true; }
  return false;
}

function teleportObjective(engine) {
  const s = openingState(engine);
  if (!s.active) return false;
  if (s.stage <= 1) teleport(engine, SHIP_HALL);
  else if (s.stage === 2) teleport(engine, GUARD_POST);
  else if (s.stage === 3) teleport(engine, OFFICE);
  else if (s.stage >= 4 && !s.lootTaken) teleport(engine, LOOT_ROOM);
  else if (s.stage >= 4 && !s.officerDone) teleport(engine, OFFICER);
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
    buildOpeningLocations(this);
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
