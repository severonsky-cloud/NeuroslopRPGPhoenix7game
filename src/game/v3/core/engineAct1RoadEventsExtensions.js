import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { labelSprite, makeMat } from '../world/props.js';

function removeNode(scene, node) {
  if (!node) return;
  scene.remove(node);
  node.parent?.remove?.(node);
  node.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((mat) => mat?.dispose?.());
    else child.material?.dispose?.();
  });
}

function near2D(a, b, radius) {
  return Math.hypot(a.x - b.x, a.z - b.z) <= radius;
}

function mid(a, b, t, side = 0) {
  const x = a.x + (b.x - a.x) * t;
  const z = a.z + (b.z - a.z) * t;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  const sx = dz / len;
  const sz = -dx / len;
  return new THREE.Vector3(x + sx * side, heightAt(x + sx * side, z + sz * side), z + sz * side);
}

function box(group, mat, size, pos, rotY = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...pos);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function makeAbandonedCrate(scene, pos) {
  const group = new THREE.Group();
  group.name = 'act1_road_event_abandoned_crate';
  const wood = makeMat(0x5b3a22, { roughness: 0.95 });
  const cloth = makeMat(0x2f4d34, { roughness: 0.9 });
  box(group, wood, [1.1, 0.65, 0.9], [0, 0.36, 0], 0.18);
  box(group, cloth, [0.62, 0.12, 0.68], [0.12, 0.74, 0.02], -0.1);
  group.position.set(pos.x, heightAt(pos.x, pos.z), pos.z);
  scene.add(group);
  return group;
}

function makeBurnedWagon(scene, pos) {
  const group = new THREE.Group();
  group.name = 'act1_road_event_burned_wagon';
  const dark = makeMat(0x14100c, { roughness: 1, metalness: 0.08 });
  const ember = makeMat(0x7b2a18, { roughness: 0.88, emissive: 0x351008, emissiveIntensity: 0.25 });
  box(group, dark, [2.3, 0.35, 1.1], [0, 0.35, 0], 0.2);
  box(group, ember, [1.7, 0.18, 0.22], [0.1, 0.78, -0.46], -0.12);
  for (const x of [-0.95, 0.95]) for (const z of [-0.52, 0.52]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 6, 12), dark);
    wheel.position.set(x, 0.24, z);
    wheel.rotation.y = Math.PI / 2;
    wheel.castShadow = true;
    group.add(wheel);
  }
  group.position.set(pos.x, heightAt(pos.x, pos.z), pos.z);
  group.rotation.y = -0.45;
  scene.add(group);
  return group;
}

function makeInjuredCaravanMan(scene, pos) {
  const group = new THREE.Group();
  group.name = 'act1_road_event_injured_caravan_man';
  const coat = makeMat(0x4a3326, { roughness: 0.92 });
  const skin = makeMat(0x9b7652, { roughness: 0.78 });
  box(group, coat, [0.55, 0.28, 1.15], [0, 0.18, 0], 0.55);
  box(group, skin, [0.26, 0.22, 0.24], [-0.45, 0.26, -0.22], 0.35);
  box(group, coat, [1.05, 0.12, 0.2], [0.05, 0.22, 0.42], 0.2);
  group.position.set(pos.x, heightAt(pos.x, pos.z) + 0.02, pos.z);
  scene.add(group);
  return group;
}

function makeRoadNote(scene, pos) {
  const group = new THREE.Group();
  group.name = 'act1_road_event_note_sign';
  const wood = makeMat(0x5b3a22, { roughness: 0.9 });
  const paper = makeMat(0xb49a6b, { roughness: 0.96 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 8), wood);
  post.position.y = 0.75;
  const board = box(group, paper, [1.3, 0.46, 0.05], [0, 1.38, 0], 0);
  group.add(post, board);
  group.position.set(pos.x, heightAt(pos.x, pos.z), pos.z);
  group.rotation.y = 0.32;
  scene.add(group);
  return group;
}

function spawnRoadEvents(engine) {
  const s = engine.act1Slice;
  if (!s?.active || s.roadEventsSpawned || !s.camp || !s.vehiclePoint) return;
  s.roadEventsSpawned = true;
  const events = [
    { id: 'abandoned_crate', title: 'Брошенный ящик', pos: mid(s.camp, s.road, 0.55, -3.1), make: makeAbandonedCrate, inspected: false, reward: () => { engine.inventory.addAmmo('pistol9', 10); engine.player.credits += 8; engine.log.unshift('Брошенный ящик: найдено немного 9mm и мелочь.'); return '+10 pistol9, +8 кредитов'; } },
    { id: 'road_note', title: 'Записка у знака', pos: mid(s.road, s.ambush, 0.2, 2.6), make: makeRoadNote, inspected: false, reward: () => { engine.log.unshift('Записка у знака: “броня любит дорогу, но не любит колёса и корму”.'); return 'слух о слабых местах техники'; } },
    { id: 'injured_caravan_man', title: 'Раненый караванщик', pos: mid(s.road, s.ambush, 0.62, -3.4), make: makeInjuredCaravanMan, inspected: false, reward: () => { engine.rpg?.useSkill?.('speech', 0.5); engine.inventory.addAmmo('rifle792', 4); engine.log.unshift('Раненый караванщик прошептал: “после бронецели ищи зелёные ящики”.'); return '+4 rifle792, подсказка о ящиках'; } },
    { id: 'burned_wagon', title: 'Сожжённая телега', pos: mid(s.ambush, s.vehiclePoint, 0.48, 3.8), make: makeBurnedWagon, inspected: false, reward: () => { s.trophyParts = (s.trophyParts || 0) + 1; engine.log.unshift('Сожжённая телега: снята одна трофейная деталь.'); return '+1 трофейная деталь'; } },
  ];
  s.roadEvents = events;
  engine.act1RoadEventNodes = engine.act1RoadEventNodes || [];
  for (const event of events) {
    const node = event.make(engine.scene, event.pos);
    node.userData.act1RoadEvent = true;
    node.userData.source = 'act1Route';
    node.userData.eventId = event.id;
    event.node = node;
    engine.act1RoadEventNodes.push(node);
    const label = labelSprite(engine.scene, event.title, event.pos.x, event.pos.z, 2.5, 0.42);
    label.userData.act1RoadEvent = true;
    label.userData.source = 'act1Route';
    engine.labels.push(label);
    engine.act1RoadEventNodes.push(label);
  }
  engine.log.unshift('Act 1 road events spawned: abandoned crate, note sign, injured caravan man, burned wagon.');
}

function tryInteractRoadEvent(engine) {
  const s = engine.act1Slice;
  if (!s?.active || !s.roadEvents?.length) return false;
  const event = s.roadEvents.find((item) => !item.inspected && near2D(engine.rig.position, item.pos, 3.2));
  if (!event) return false;
  event.inspected = true;
  const reward = event.reward?.() || 'осмотрено';
  engine.hud?.setObjective?.(`${event.title}: ${reward}.`);
  if (event.node) event.node.scale.setScalar(0.92);
  return true;
}

function updateRoadEventPrompt(engine) {
  const s = engine.act1Slice;
  if (!s?.active || engine.paused || !s.roadEvents?.length) return;
  const event = s.roadEvents.find((item) => !item.inspected && near2D(engine.rig.position, item.pos, 3.2));
  if (event) engine.hud?.showPrompt?.(`[E] Осмотреть: ${event.title}`);
}

export function installAct1RoadEventsExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__act1RoadEventsInstalled) return;
  PhoenixV3Engine.__act1RoadEventsInstalled = true;

  const originalStart = PhoenixV3Engine.prototype.act1SliceStart;
  PhoenixV3Engine.prototype.act1SliceStart = function act1SliceStartRoadEvents(...args) {
    const result = originalStart.call(this, ...args);
    spawnRoadEvents(this);
    return result;
  };

  const originalClear = PhoenixV3Engine.prototype.act1SliceClear;
  PhoenixV3Engine.prototype.act1SliceClear = function act1SliceClearRoadEvents(...args) {
    for (const node of this.act1RoadEventNodes || []) removeNode(this.scene, node);
    this.act1RoadEventNodes = [];
    return originalClear.call(this, ...args);
  };

  const originalTryInteract = PhoenixV3Engine.prototype.act1TryInteract;
  PhoenixV3Engine.prototype.act1TryInteract = function act1TryInteractRoadEvents() {
    if (tryInteractRoadEvent(this)) return true;
    return originalTryInteract.call(this);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateRoadEvents(dt) {
    originalUpdate.call(this, dt);
    updateRoadEventPrompt(this);
  };

  const originalJournal = PhoenixV3Engine.prototype.act1SliceJournalHtml;
  PhoenixV3Engine.prototype.act1SliceJournalHtml = function act1SliceJournalHtmlRoadEvents() {
    const html = originalJournal.call(this);
    const s = this.act1Slice || {};
    const events = (s.roadEvents || []).map((event) => `${event.inspected ? '✓' : '•'} ${event.title}`).join('<br>') || 'ещё не появились';
    return `${html}<div class="line"><b>Дорожные события:</b><br>${events}</div>`;
  };
}
