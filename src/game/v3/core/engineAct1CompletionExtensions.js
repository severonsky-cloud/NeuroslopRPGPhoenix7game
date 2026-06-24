import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { labelSprite, makeMat } from '../world/props.js';

function removeNode(scene, node) {
  if (!node) return;
  scene.remove(node);
  node.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((mat) => mat?.dispose?.());
    else child.material?.dispose?.();
  });
}

function near2D(a, b, radius) {
  return Math.hypot(a.x - b.x, a.z - b.z) <= radius;
}

function box(group, mat, size, pos) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function cyl(group, mat, rt, rb, h, pos) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), mat);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function makeCompletionFlag(scene, pos) {
  const group = new THREE.Group();
  group.name = 'act1_completion_camp_flag';
  const wood = makeMat(0x5b351f, { roughness: 0.88 });
  const gold = makeMat(0xd8a64d, { roughness: 0.5, metalness: 0.08, emissive: 0x402400, emissiveIntensity: 0.18 });
  cyl(group, wood, 0.04, 0.05, 3.2, [0, 1.6, 0]);
  box(group, gold, [1.25, 0.62, 0.045], [0.66, 2.55, 0]);
  box(group, wood, [1.7, 0.18, 0.35], [0, 0.1, 0]);
  group.position.set(pos.x + 2.8, heightAt(pos.x + 2.8, pos.z + 1.9), pos.z + 1.9);
  scene.add(group);
  return group;
}

function makeSalvageRack(scene, pos) {
  const group = new THREE.Group();
  group.name = 'act1_completion_salvage_rack';
  const wood = makeMat(0x4b3020, { roughness: 0.9 });
  const metal = makeMat(0x34312c, { roughness: 0.72, metalness: 0.42 });
  box(group, wood, [2.4, 0.18, 0.4], [0, 0.45, 0]);
  box(group, wood, [0.16, 0.9, 0.16], [-1.0, 0.45, 0]);
  box(group, wood, [0.16, 0.9, 0.16], [1.0, 0.45, 0]);
  box(group, metal, [0.9, 0.28, 0.28], [-0.55, 0.86, 0]);
  box(group, metal, [0.65, 0.18, 0.18], [0.58, 0.82, 0]);
  cyl(group, metal, 0.12, 0.12, 0.5, [1.03, 0.82, 0]);
  group.position.set(pos.x - 3.2, heightAt(pos.x - 3.2, pos.z + 2.1), pos.z + 2.1);
  group.rotation.y = Math.PI * 0.08;
  scene.add(group);
  return group;
}

function makeGuardPost(scene, pos) {
  const group = new THREE.Group();
  group.name = 'act1_completion_guard_post';
  const cloth = makeMat(0x6b3a2a, { roughness: 0.92 });
  const dark = makeMat(0x1a140f, { roughness: 0.85 });
  box(group, dark, [1.8, 0.18, 1.1], [0, 0.1, 0]);
  box(group, cloth, [1.25, 1.1, 0.32], [0, 0.76, 0]);
  box(group, dark, [0.8, 0.18, 0.18], [0, 1.45, -0.23]);
  group.position.set(pos.x + 5.0, heightAt(pos.x + 5.0, pos.z - 1.3), pos.z - 1.3);
  group.rotation.y = -0.55;
  scene.add(group);
  return group;
}

function completionHtml(engine) {
  const s = engine.act1Slice || {};
  const reputation = engine.player.routeReputation || 0;
  return `<h2>Маршрут закрыт</h2>
    <p><b>Act 1 loop теперь ощущается как законченная доставка:</b> дорога очищена, бронецель оставлена как wreck, зелёные ящики сданы старосте.</p>
    <div class="line"><b>Награда:</b> базовая сдача маршрута уже выдана: кредиты, ракета, дробь и опыт речи.</div>
    <div class="line"><b>Дополнительно:</b> репутация маршрута +1, аварийный товар у старосты открыт, лагерь визуально укреплён.</div>
    <div class="line"><b>Текущая репутация дороги:</b> ${reputation}</div>
    <div class="line"><b>Ящики:</b> ${s.cratesCollected || 0}/${s.cratesNeeded || 3} · <b>статус журнала:</b> Маршрут закрыт.</div>
    <p>Дальше сюда можно наращивать вторую задачу: караван, новый заказ, ремонт техники, фракционную реакцию и последствия на карте.</p>
    <p><button id="closeMapBtn">Оставить результат и продолжить</button> <button id="replayAct1RouteBtn">Переиграть маршрут F2</button></p>`;
}

function bindCompletionPanel(engine) {
  document.getElementById('closeMapBtn')?.addEventListener('click', () => engine.closePausePanel());
  document.getElementById('replayAct1RouteBtn')?.addEventListener('click', () => {
    engine.closePausePanel();
    engine.act1SliceStart?.({ teleport: true });
  });
}

function applyCompletionImpact(engine) {
  const s = engine.act1Slice;
  if (!s || s.completionImpactShown) return;
  s.completionImpactShown = true;
  s.journalStatus = 'Маршрут закрыт';
  s.traderUnlockedTier = Math.max(s.traderUnlockedTier || 0, 1);
  engine.player.routeReputation = (engine.player.routeReputation || 0) + 1;

  if (!s.completionBonusGiven) {
    s.completionBonusGiven = true;
    engine.player.credits += 35;
    engine.log.unshift('Староста добавил дорожную премию: +35 кредитов и +1 репутация маршрута. У торговца открыт аварийный запас.');
  }

  for (const node of engine.act1CompletionNodes || []) removeNode(engine.scene, node);
  engine.act1CompletionNodes = [];
  if (s.camp) {
    engine.act1CompletionNodes.push(makeCompletionFlag(engine.scene, s.camp));
    engine.act1CompletionNodes.push(makeSalvageRack(engine.scene, s.camp));
    engine.act1CompletionNodes.push(makeGuardPost(engine.scene, s.camp));
    const label = labelSprite(engine.scene, 'Лагерь: дорога открыта', s.camp.x + 1.5, s.camp.z + 4.6, 3.2, 0.5);
    label.userData.act1Completion = true;
    engine.labels.push(label);
    engine.act1CompletionNodes.push(label);
  }

  engine.hud.setObjective('Маршрут закрыт: лагерь обновлён, товар открыт, репутация дороги +1.');
  engine.paused = true;
  engine.hud.openPanel(completionHtml(engine));
  bindCompletionPanel(engine);
}

export function installAct1CompletionExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__act1CompletionInstalled) return;
  PhoenixV3Engine.__act1CompletionInstalled = true;

  PhoenixV3Engine.prototype.act1ApplyCompletionImpact = function act1ApplyCompletionImpact() {
    applyCompletionImpact(this);
  };

  const originalClear = PhoenixV3Engine.prototype.act1SliceClear;
  PhoenixV3Engine.prototype.act1SliceClear = function act1SliceClearCompletion(...args) {
    for (const node of this.act1CompletionNodes || []) removeNode(this.scene, node);
    this.act1CompletionNodes = [];
    this.labels = (this.labels || []).filter((label) => !label.userData?.act1Completion);
    return originalClear.call(this, ...args);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateAct1Completion(dt) {
    originalUpdate.call(this, dt);
    const s = this.act1Slice;
    if (s?.active && s.completed && !s.completionImpactShown) applyCompletionImpact(this);
    if (s?.stage === 5 && s.camp && near2D(this.rig.position, s.camp, 12)) {
      this.hud?.showPrompt?.('Маршрут закрыт · у старосты открыт аварийный товар · F2 переиграть');
    }
  };

  const originalJournal = PhoenixV3Engine.prototype.act1SliceJournalHtml;
  PhoenixV3Engine.prototype.act1SliceJournalHtml = function act1SliceJournalHtmlCompletion() {
    const html = originalJournal.call(this);
    const s = this.act1Slice || {};
    if (!s.completed) return html;
    return `${html}<div class="line"><b>Итог:</b> маршрут закрыт, лагерь укреплён, репутация дороги ${this.player.routeReputation || 1}, trader tier ${s.traderUnlockedTier || 1}.</div>`;
  };
}
