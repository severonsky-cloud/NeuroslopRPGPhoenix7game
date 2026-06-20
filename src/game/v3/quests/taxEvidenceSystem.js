import * as THREE from '../vendor/three.module.js';
import { TAX_POSITIONS, TAX_QUEST_ID, TAX_STAGES } from '../data/taxQuestData.js';
import { worldClock } from '../world/dayNight.js';
import { heightAt } from '../world/terrain.js';
import { makeMat } from '../world/props.js';

function ensureAwarenessElement() {
  let element = document.getElementById('taxAwareness');
  if (!element) {
    element = document.createElement('div');
    element.id = 'taxAwareness';
    element.innerHTML = '<span>НАБЛЮДЕНИЕ</span><i></i>';
    element.style.cssText =
      'position:fixed;left:50%;bottom:148px;transform:translateX(-50%);z-index:13;width:220px;' +
      'font:800 10px system-ui;letter-spacing:1px;color:#f1d09a;text-align:center;pointer-events:none;' +
      'opacity:0;transition:opacity .18s';
    const bar = element.querySelector('i');
    bar.style.cssText =
      'display:block;height:7px;margin-top:4px;background:#bd4b32;transform-origin:left center;transform:scaleX(0);' +
      'box-shadow:0 0 8px rgba(189,75,50,.75)';
    document.body.appendChild(element);
  }
  return element;
}

function ensureFlashElement() {
  let element = document.getElementById('taxCameraFlash');
  if (!element) {
    element = document.createElement('div');
    element.id = 'taxCameraFlash';
    element.style.cssText =
      'position:fixed;inset:0;z-index:40;background:#fff;pointer-events:none;opacity:0;transition:opacity .25s';
    document.body.appendChild(element);
  }
  return element;
}

function makeCameraViewModel() {
  const root = new THREE.Group();
  root.name = 'tax-evidence-camera-viewmodel';
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.17, 0.14),
    makeMat(0x292725, { roughness: 0.65, metalness: 0.18 }),
  );
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.065, 0.12, 12),
    makeMat(0x17191c, { roughness: 0.25, metalness: 0.35 }),
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.z = -0.11;
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 12),
    makeMat(0x608ca0, { emissive: 0x183848, emissiveIntensity: 0.45 }),
  );
  glass.position.z = -0.175;
  const finder = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.055, 0.055), makeMat(0x3b3731));
  finder.position.set(0.06, 0.105, 0);
  root.add(body, lens, glass, finder);
  root.position.set(-0.33, -0.31, -0.62);
  root.rotation.set(-0.08, 0.18, -0.08);
  root.visible = false;
  return root;
}

function makeLedgerTable() {
  const root = new THREE.Group();
  root.name = 'tax-ledger-table';
  const wood = makeMat(0x4a2c1a, { roughness: 0.92 });
  const paper = makeMat(0xd1b882, { roughness: 0.95, emissive: 0x3b2b13, emissiveIntensity: 0.08 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 0.72), wood);
  top.position.y = 0.85;
  for (const x of [-0.5, 0.5]) {
    for (const z of [-0.25, 0.25]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.82, 0.1), wood);
      leg.position.set(x, 0.41, z);
      root.add(leg);
    }
  }
  const ledger = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.36), paper);
  ledger.name = 'dumont-ledger-prop';
  ledger.position.set(0.08, 0.94, 0);
  ledger.rotation.y = 0.18;
  root.add(top, ledger);
  return root;
}

function distXZ(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function isTaxEvidenceActive(quest) {
  return quest?.route === 'investigation'
    && quest.status === 'active'
    && quest.stage === TAX_STAGES.INVESTIGATING;
}

export class TaxEvidenceSystem {
  constructor(engine) {
    this.engine = engine;
    this.awareness = 0;
    this.alertT = 0;
    this.previousSegment = worldClock.segment;
    this.awarenessEl = ensureAwarenessElement();
    this.flashEl = ensureFlashElement();
    this.cameraView = makeCameraViewModel();
    this.engine.camera.add(this.cameraView);
    this.ledgerTable = makeLedgerTable();
    this.ledgerTable.position.set(
      TAX_POSITIONS.ledger.x,
      heightAt(TAX_POSITIONS.ledger.x, TAX_POSITIONS.ledger.z),
      TAX_POSITIONS.ledger.z,
    );
    this.engine.scene.add(this.ledgerTable);
  }

  quest() {
    return this.engine.worldState.questState(TAX_QUEST_ID);
  }

  agent(id) {
    return this.engine.livingWorld?.agents?.find((agent) => agent.userData.id === id) || null;
  }

  setCaravanHold(active) {
    const caravan = this.agent('red_rural_caravan');
    if (!caravan) return;
    caravan.userData.questHold = active;
    if (active) {
      caravan.userData.x = -72.2;
      caravan.userData.z = 75.2;
      caravan.position.set(caravan.userData.x, heightAt(caravan.userData.x, caravan.userData.z), caravan.userData.z);
      caravan.lookAt(TAX_POSITIONS.post.x, caravan.position.y + 1, TAX_POSITIONS.post.z);
    }
  }

  isInvestigating() {
    return isTaxEvidenceActive(this.quest());
  }

  observerVisibility(observer) {
    if (!observer?.visible || observer.userData.alive === false) return 0;
    const toPlayer = this.engine.rig.position.clone().sub(observer.position).setY(0);
    const distance = toPlayer.length();
    if (distance > 10 || distance < 0.01) return 0;
    toPlayer.normalize();
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(observer.quaternion).setY(0).normalize();
    const cone = Math.max(0, forward.dot(toPlayer));
    const nightPenalty = worldClock.nightFactor > 0.55 ? 0.58 : 1;
    return Math.max(0, 1 - distance / 10) * (0.2 + cone * 0.8) * nightPenalty;
  }

  updateAwareness(dt) {
    const nearLedger = distXZ(this.engine.rig.position, TAX_POSITIONS.ledger) < 11;
    if (!nearLedger || worldClock.nightFactor <= 0.45) {
      this.awareness = Math.max(0, this.awareness - dt * 0.65);
    } else {
      const seen = Math.max(
        this.observerVisibility(this.agent('marcel-dumont')),
        this.observerVisibility(this.agent('corporal-voss')),
      );
      this.awareness = THREE.MathUtils.clamp(this.awareness + dt * (seen * 1.45 - 0.32), 0, 1);
    }
    const bar = this.awarenessEl.querySelector('i');
    bar.style.transform = `scaleX(${this.awareness.toFixed(3)})`;
    this.awarenessEl.style.opacity = nearLedger && this.isInvestigating() ? '1' : '0';
    if (this.awareness >= 1 && !this.alertT) this.failAttempt('ledger');
  }

  unlockAtDawn() {
    if (this.previousSegment !== 'dawn' && worldClock.segment === 'dawn') {
      const vars = this.quest().vars || {};
      if (vars.photoBlocked || vars.ledgerBlocked) {
        this.engine.worldState.patchQuest(TAX_QUEST_ID, {
          vars: { photoBlocked: false, ledgerBlocked: false },
        });
        this.engine.log.unshift('Налог и глина: после рассвета охрана ослабила поиск улик.');
      }
    }
    this.previousSegment = worldClock.segment;
  }

  startAlert() {
    this.alertT = 25;
    for (const id of ['marcel-dumont', 'corporal-voss']) {
      const agent = this.agent(id);
      if (!agent) continue;
      agent.userData.conditionalHostile = true;
      agent.userData.provoked = true;
      agent.userData.questEvidenceAlert = true;
    }
  }

  stopAlert() {
    this.alertT = 0;
    for (const id of ['marcel-dumont', 'corporal-voss']) {
      const agent = this.agent(id);
      if (!agent?.userData.questEvidenceAlert) continue;
      agent.userData.conditionalHostile = false;
      agent.userData.provoked = false;
      agent.userData.questEvidenceAlert = false;
    }
  }

  failAttempt(method) {
    const vars = method === 'photo' ? { photoBlocked: true } : { ledgerBlocked: true };
    this.engine.worldState.patchQuest(TAX_QUEST_ID, { vars });
    if (method === 'photo') this.engine.worldState.removeQuestItem('extortionPhoto');
    else this.engine.worldState.removeQuestItem('dumontLedger');
    this.engine.inventory?.removeItem?.(method === 'photo' ? 'extortionPhoto' : 'dumontLedger');
    this.engine.worldState.applyPersistentRewards(this.engine);
    this.startAlert();
    this.awareness = 0;
    this.engine.hud.setObjective('Тебя заметили. Улика конфискована — уходи от поста! Другой способ расследования ещё доступен.');
    this.engine.log.unshift(`Налог и глина: попытка добыть ${method === 'photo' ? 'снимок' : 'ведомость'} провалилась.`);
  }

  flash() {
    this.flashEl.style.transition = 'none';
    this.flashEl.style.opacity = '0.92';
    requestAnimationFrame(() => {
      this.flashEl.style.transition = 'opacity .28s';
      this.flashEl.style.opacity = '0';
    });
  }

  completeEvidence(method, item) {
    this.engine.worldState.addQuestItem(item);
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.EVIDENCE_READY,
      status: 'active',
      vars: { evidenceMethod: method },
    });
    this.engine.worldState.applyPersistentRewards(this.engine);
    this.setCaravanHold(false);
    this.cameraView.visible = false;
    this.engine.hud.setObjective('Доказательство добыто. Отнеси его Герде в Форт Заря.');
    this.engine.log.unshift(`Налог и глина: получена улика — ${method === 'photo' ? 'снимок поборов' : 'ведомость Дюмона'}.`);
  }

  interact() {
    if (!this.isInvestigating()) return false;
    const quest = this.quest();
    const player = this.engine.rig.position;
    const caravan = this.agent('red_rural_caravan');
    const nearPhoto = distXZ(player, TAX_POSITIONS.photoCover) < 3.4
      || (caravan && distXZ(player, caravan.position) < 6);
    const nearLedger = distXZ(player, TAX_POSITIONS.ledger) < 2.4;

    if (nearPhoto && this.engine.worldState.hasQuestItem('evidenceCamera')) {
      if (quest.vars.photoBlocked) {
        this.engine.hud.setObjective('Охрана ищет камеру. Дождись следующего рассвета или укради ведомость.');
        return true;
      }
      this.flash();
      const inCover = distXZ(player, TAX_POSITIONS.photoCover) < 3.4;
      if (!inCover || this.awareness > 0.55) this.failAttempt('photo');
      else this.completeEvidence('photo', 'extortionPhoto');
      return true;
    }

    if (nearLedger) {
      if (worldClock.nightFactor <= 0.55) {
        this.engine.hud.setObjective('Днём к ведомости не подойти. Вернись ночью.');
        return true;
      }
      if (quest.vars.ledgerBlocked) {
        this.engine.hud.setObjective('После тревоги стол опечатан до рассвета. Попробуй сделать снимок.');
        return true;
      }
      if (this.awareness >= 0.72) this.failAttempt('ledger');
      else {
        this.ledgerTable.getObjectByName('dumont-ledger-prop').visible = false;
        this.completeEvidence('ledger', 'dumontLedger');
      }
      return true;
    }
    return false;
  }

  update(dt) {
    this.unlockAtDawn();
    const investigating = this.isInvestigating();
    const hasCamera = this.engine.worldState.hasQuestItem('evidenceCamera');
    const needsPhoto = investigating && hasCamera && !this.quest().vars.photoBlocked;
    this.setCaravanHold(needsPhoto);
    this.cameraView.visible = needsPhoto && distXZ(this.engine.rig.position, TAX_POSITIONS.photoCover) < 12;
    this.ledgerTable.visible = investigating && !this.engine.worldState.hasQuestItem('dumontLedger');
    this.updateAwareness(dt);

    if (this.alertT > 0) {
      this.alertT = Math.max(0, this.alertT - dt);
      const escaped = distXZ(this.engine.rig.position, TAX_POSITIONS.post) > 42;
      if (this.alertT <= 0 || escaped) this.stopAlert();
    }

    if (!investigating) return;
    const player = this.engine.rig.position;
    const caravan = this.agent('red_rural_caravan');
    if (hasCamera && (
      distXZ(player, TAX_POSITIONS.photoCover) < 4.5
      || (caravan && distXZ(player, caravan.position) < 7)
    )) {
      const covered = distXZ(player, TAX_POSITIONS.photoCover) < 3.4;
      this.engine.hud.showPrompt(covered
        ? 'E — снять передачу пошлины из укрытия'
        : 'E — сделать рискованный снимок на глазах у охраны');
    } else if (distXZ(player, TAX_POSITIONS.ledger) < 3.2) {
      this.engine.hud.showPrompt(worldClock.nightFactor > 0.55 ? 'E — украсть ведомость поборов' : 'Ведомость доступна только ночью');
    }
  }

  resetRuntime() {
    this.stopAlert();
    this.awareness = 0;
    this.cameraView.visible = false;
    this.ledgerTable.getObjectByName('dumont-ledger-prop').visible = true;
    this.setCaravanHold(false);
  }

  diagnostics() {
    const quest = this.quest();
    return {
      awareness: Math.round(this.awareness * 100) / 100,
      alertT: Math.round(this.alertT * 10) / 10,
      photoBlocked: !!quest.vars.photoBlocked,
      ledgerBlocked: !!quest.vars.ledgerBlocked,
      camera: this.engine.worldState.hasQuestItem('evidenceCamera'),
      photo: this.engine.worldState.hasQuestItem('extortionPhoto'),
      ledger: this.engine.worldState.hasQuestItem('dumontLedger'),
      caravanHeld: !!this.agent('red_rural_caravan')?.userData.questHold,
    };
  }
}
