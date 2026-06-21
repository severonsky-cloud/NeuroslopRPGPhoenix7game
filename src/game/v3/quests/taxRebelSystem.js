import * as THREE from '../vendor/three.module.js';
import { createMonster } from '../entities/monster.js';
import {
  TAX_POSITIONS,
  TAX_QUEST_ID,
  TAX_REWARDS,
  TAX_STAGES,
} from '../data/taxQuestData.js';
import { worldClock } from '../world/dayNight.js';
import { heightAt } from '../world/terrain.js';
import { makeMat } from '../world/props.js';

export const REBEL_COMBAT_DURATION = 45;
const REBEL_CONTACT_STAGES = new Set([
  TAX_STAGES.REBELS_CODE,
  TAX_STAGES.REBELS_CONTACT,
  TAX_STAGES.REBELS_CAMP,
]);
const INTERRUPTED_REBEL_STAGES = new Set([
  TAX_STAGES.REBELS_APPROACH,
  TAX_STAGES.REBELS_INFILTRATION,
  TAX_STAGES.REBELS_CLEAN,
  TAX_STAGES.REBELS_COMBAT,
  TAX_STAGES.REBELS_EXTRACTION,
]);

const CLEAN_LINES = Object.freeze([
  ['Связной', 'Свет погас. Держись у стены — теперь работают те, кого не должно быть видно.'],
  ['Ньен Ло', 'Восс, смотри на дорогу. За офисом только ветер.'],
  ['Дюмон', 'Вы не понимаете, кого забираете. Я вернусь сюда с приказом.'],
]);

const BLOODY_LINES = Object.freeze([
  ['Связной', 'Двор чист. Выводим его, пока дорога ещё смотрит на стрельбу.'],
  ['Дюмон', 'Это не арест. Вы исчезнете вместе со мной.'],
]);

function distXZ(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function cloneAmmo(engine) {
  return {
    inventory: { ...(engine.player.inventoryState?.ammo || {}) },
    firearm: JSON.parse(JSON.stringify(engine.player.firearmState || {})),
  };
}

function restoreAmmo(engine, snapshot) {
  if (!snapshot) return;
  if (engine.player.inventoryState) engine.player.inventoryState.ammo = { ...snapshot.inventory };
  engine.player.firearmState = JSON.parse(JSON.stringify(snapshot.firearm || {}));
}

export function isInterruptedRebelStage(stage) {
  return INTERRUPTED_REBEL_STAGES.has(Number(stage));
}

export function isRebelContactStage(stage) {
  return REBEL_CONTACT_STAGES.has(Number(stage));
}

export function isCleanRebelOutcome(mode) {
  return mode === 'clean' || mode === 'rebels_clean';
}

export function rebelAwarenessMultiplier(profile = {}, skills = {}) {
  const raceModifiers = {
    black: 0.72,
    deimur: 0.82,
    juniorReptiloid: 0.75,
    seniorReptiloid: 0.90,
    blue: 0.85,
  };
  const backgroundModifiers = {
    guide: 0.78,
    deserter: 0.88,
    archive: 0.90,
    resonant: 0.90,
  };
  const race = profile.race || 'human';
  const background = profile.background || 'lunar';
  const skillLevel = (id) => Number(skills[id]?.level ?? skills[id] ?? 0) || 0;
  const training = Math.max(0, skillLevel('survival') + skillLevel('dodge') - 4);
  const skillModifier = 1 - Math.min(0.18, training * 0.018);
  return THREE.MathUtils.clamp(
    (raceModifiers[race] || 1) * (backgroundModifiers[background] || 1) * skillModifier,
    0.55,
    1,
  );
}

function ensureAwarenessElement() {
  let element = document.getElementById('taxRebelAwareness');
  if (!element) {
    element = document.createElement('div');
    element.id = 'taxRebelAwareness';
    element.innerHTML = '<span>ВНИМАНИЕ КАРАУЛА</span><i></i>';
    element.style.cssText =
      'position:fixed;left:50%;bottom:148px;transform:translateX(-50%);z-index:14;width:230px;' +
      'font:800 10px system-ui;letter-spacing:1px;color:#f1d09a;text-align:center;pointer-events:none;' +
      'opacity:0;transition:opacity .18s';
    element.querySelector('i').style.cssText =
      'display:block;height:7px;margin-top:4px;background:#c94b32;transform-origin:left center;' +
      'transform:scaleX(0);box-shadow:0 0 8px rgba(201,75,50,.75)';
    document.body.appendChild(element);
  }
  return element;
}

function makeCampfire(quality) {
  const root = new THREE.Group();
  root.name = 'tax-rebel-campfire';
  const stone = makeMat(0x4b443b, { roughness: 0.95 });
  const wood = makeMat(0x3d2415, { roughness: 0.92 });
  const ember = makeMat(0xe85b2d, {
    roughness: 0.55,
    emissive: 0x9d210d,
    emissiveIntensity: 1.35,
  });
  for (let index = 0; index < 8; index += 1) {
    const angle = index / 8 * Math.PI * 2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), stone);
    rock.position.set(Math.cos(angle) * 0.62, 0.12, Math.sin(angle) * 0.62);
    root.add(rock);
  }
  for (const rotation of [-0.6, 0.6]) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.05, 7), wood);
    log.position.y = 0.18;
    log.rotation.set(Math.PI / 2, 0, rotation);
    root.add(log);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 7), ember);
  flame.position.y = 0.55;
  root.add(flame);
  if (quality?.realtimeAccentLights) {
    const light = new THREE.PointLight(0xff7a35, 0.85, 11, 2);
    light.position.y = 1.3;
    root.add(light);
  }
  return root;
}

function makePostPowerRig(quality) {
  const root = new THREE.Group();
  root.name = 'tax-rebel-power-rig';
  const metal = makeMat(0x34383a, { roughness: 0.7, metalness: 0.2 });
  const wire = makeMat(0x161819, { roughness: 0.9 });
  const lampMaterial = makeMat(0xf0b75b, {
    roughness: 0.35,
    emissive: 0xd26a18,
    emissiveIntensity: 1.15,
  });
  const indicatorMaterial = makeMat(0xc23b22, {
    roughness: 0.42,
    emissive: 0x7b1308,
    emissiveIntensity: 0.95,
  });

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.22), metal);
  box.position.set(0, 0.95, 0);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.08), metal);
  lever.name = 'tax-rebel-switch-lever';
  lever.position.set(0, 1.02, -0.16);
  lever.rotation.z = 0.36;
  const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), indicatorMaterial);
  indicator.position.set(0.17, 1.2, -0.13);
  root.add(box, lever, indicator);

  const lights = [];
  for (const [x, z] of [[7, -3], [-5, -7]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 4.2, 7), metal);
    pole.position.set(x, 2.1, z);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.05, 7), metal);
    arm.position.set(x + 0.43, 4.05, z);
    arm.rotation.z = Math.PI / 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 7), lampMaterial);
    bulb.position.set(x + 0.88, 3.92, z);
    root.add(pole, arm, bulb);
    if (quality?.realtimeAccentLights) {
      const light = new THREE.PointLight(0xffbf68, 0.8, 18, 2);
      light.position.copy(bulb.position);
      root.add(light);
      lights.push(light);
    }
  }
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 7.8, 6), wire);
  cable.position.set(3.5, 4.0, -1.5);
  cable.rotation.z = Math.PI / 2;
  root.add(cable);
  return { root, lever, lampMaterial, indicatorMaterial, lights };
}

export class TaxRebelSystem {
  constructor(engine, subtitle) {
    this.engine = engine;
    this.subtitle = subtitle;
    this.awarenessEl = ensureAwarenessElement();
    this.awareness = 0;
    this.checkpoint = null;
    this.contact = null;
    this.allies = [];
    this.enemies = [];
    this.combat = null;
    this.extraction = null;
    this.lightsOn = true;

    this.campfire = makeCampfire(engine.quality);
    this.campfire.position.set(
      TAX_POSITIONS.rebelCamp.x,
      heightAt(TAX_POSITIONS.rebelCamp.x, TAX_POSITIONS.rebelCamp.z),
      TAX_POSITIONS.rebelCamp.z,
    );
    this.engine.scene.add(this.campfire);

    const power = makePostPowerRig(engine.quality);
    this.powerRig = power.root;
    this.switchLever = power.lever;
    this.lampMaterial = power.lampMaterial;
    this.indicatorMaterial = power.indicatorMaterial;
    this.postLights = power.lights;
    this.powerRig.position.set(
      TAX_POSITIONS.rebelSwitch.x,
      heightAt(TAX_POSITIONS.rebelSwitch.x, TAX_POSITIONS.rebelSwitch.z),
      TAX_POSITIONS.rebelSwitch.z,
    );
    this.engine.scene.add(this.powerRig);

    this.normalizeInterruptedOperation();
    this.restoreStageRuntime();
    this.applyPersistentWorld();
  }

  quest() {
    return this.engine.worldState.questState(TAX_QUEST_ID);
  }

  lifeAgent(id) {
    return this.engine.livingWorld?.agents?.find((agent) => agent.userData.id === id) || null;
  }

  isActive() {
    return this.quest().route === 'rebels' && this.quest().status !== 'complete';
  }

  setActorHeld(id, held) {
    const actor = this.lifeAgent(id);
    if (actor) actor.userData.questHold = held;
  }

  setLights(on) {
    this.lightsOn = on;
    this.lampMaterial.emissiveIntensity = on ? 1.15 : 0.02;
    this.indicatorMaterial.emissiveIntensity = on ? 0.95 : 0.05;
    this.switchLever.rotation.z = on ? 0.36 : -0.42;
    for (const light of this.postLights) {
      light.visible = on;
      light.intensity = on ? 0.8 : 0;
    }
    const hearth = this.engine.scene.getObjectByName('demo-hearth-richelieu-post');
    if (hearth && !on) {
      hearth.visible = false;
      hearth.intensity = 0;
    }
  }

  captureCheckpoint() {
    return {
      position: {
        x: this.engine.rig.position.x,
        y: this.engine.rig.position.y,
        z: this.engine.rig.position.z,
      },
      hp: this.engine.player.hp,
      st: this.engine.player.st,
      ph: this.engine.player.ph,
      ammo: cloneAmmo(this.engine),
    };
  }

  restoreCheckpoint() {
    const snapshot = this.checkpoint || this.quest().vars.rebelCheckpoint;
    if (snapshot) {
      this.engine.rig.position.set(
        snapshot.position.x,
        snapshot.position.y ?? heightAt(snapshot.position.x, snapshot.position.z),
        snapshot.position.z,
      );
      this.engine.player.hp = Math.max(1, snapshot.hp);
      this.engine.player.st = snapshot.st;
      this.engine.player.ph = snapshot.ph;
      restoreAmmo(this.engine, snapshot.ammo);
      return;
    }
    const { x, z } = TAX_POSITIONS.rebelCheckpoint;
    this.engine.rig.position.set(x, heightAt(x, z), z);
    this.engine.player.hp = this.engine.player.hpMax;
    this.engine.player.st = this.engine.player.stMax;
    this.engine.player.ph = this.engine.player.phMax;
  }

  normalizeInterruptedOperation() {
    const quest = this.quest();
    if (quest.route !== 'rebels') return;
    if (!isInterruptedRebelStage(quest.stage) && quest.status !== 'combat') return;
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.REBELS_INFILTRATION,
      route: 'rebels',
      status: 'active',
      vars: {
        rebelCheckpointReady: true,
        rebelCombatRemaining: null,
        rebelLightsOff: false,
      },
    });
    this.engine.timeOfDay?.setPhase?.(0.82);
    this.restoreCheckpoint();
    this.engine.log.unshift('Налог и глина: прерванная операция восстановлена у рубильника.');
  }

  spawnAlly(data, loadout) {
    const actor = this.engine.livingWorld.addAgent({
      faction: 'rebels',
      role: 'rebel',
      hp: 68,
      speed: 1.25,
      text: 'Повстанец проверяет двор и держит оружие ниже линии глаз.',
      ...data,
    });
    actor.userData.questRebel = true;
    actor.userData.alive = true;
    actor.userData.hp = actor.userData.hp || data.hp || 68;
    actor.userData.hpMax = actor.userData.hpMax || actor.userData.hp;
    actor.userData.questHold = true;
    actor.userData.questCombatNeutral = true;
    this.engine.armedWorld?.configureActor?.(actor, loadout);
    this.engine.aiFeel?.initActor?.(actor);
    this.engine.actorVisuals?.enhance?.(actor);
    this.allies.push(actor);
    return actor;
  }

  spawnContact() {
    if (this.contact && this.engine.livingWorld?.agents?.includes(this.contact)) return this.contact;
    const actor = this.engine.livingWorld.addAgent({
      id: 'rebel_cell',
      name: 'Связной Красной дороги',
      faction: 'rebels',
      role: 'rebel',
      x: TAX_POSITIONS.rebelCamp.x - 1.15,
      z: TAX_POSITIONS.rebelCamp.z + 0.8,
      hp: 68,
      speed: 0,
      text: 'Связной греет ладони у дорожного костра и следит за трактом.',
    });
    actor.userData.questRebelContact = true;
    actor.userData.questHold = true;
    actor.userData.questCombatNeutral = true;
    actor.userData.conditionalHostile = false;
    actor.userData.alive = true;
    this.engine.actorVisuals?.enhance?.(actor);
    this.contact = actor;
    return actor;
  }

  spawnAllies(atCamp = false) {
    if (this.allies.length) return;
    const origin = atCamp ? TAX_POSITIONS.rebelCamp : TAX_POSITIONS.rebelCheckpoint;
    this.spawnAlly({
      id: 'tax-rebel-sable',
      name: 'Связной «Соболь»',
      x: origin.x - 1.4,
      z: origin.z + 1.1,
    }, 'bandit_shotgun');
    this.spawnAlly({
      id: 'tax-rebel-lantern',
      name: 'Повстанец «Фонарь»',
      x: origin.x + 1.5,
      z: origin.z + 0.5,
    }, 'imperial_rifle');
  }

  removeLivingActor(actor) {
    if (!actor) return;
    if (actor.userData.label) {
      this.engine.scene.remove(actor.userData.label);
      const labelIndex = this.engine.labels.indexOf(actor.userData.label);
      if (labelIndex >= 0) this.engine.labels.splice(labelIndex, 1);
    }
    this.engine.scene.remove(actor);
    const index = this.engine.livingWorld.agents.indexOf(actor);
    if (index >= 0) this.engine.livingWorld.agents.splice(index, 1);
  }

  removeContact() {
    if (!this.contact) return;
    this.removeLivingActor(this.contact);
    this.contact = null;
  }

  removeAllies() {
    for (const actor of this.allies) this.removeLivingActor(actor);
    this.allies = [];
  }

  spawnEnemy(data, loadout = 'imperial_rifle') {
    const actor = createMonster(this.engine.scene, {
      archetype: 'brute',
      faction: 'empire',
      role: 'patrol',
      hp: 56,
      speed: 1.15,
      conditionalHostile: true,
      autoHostile: true,
      provoked: true,
      color: 0x7c765f,
      ...data,
    });
    this.engine.monsters.push(actor);
    this.engine.armedWorld?.configureActor?.(actor, loadout);
    this.engine.aiFeel?.initActor?.(actor);
    this.engine.actorVisuals?.enhance?.(actor);
    this.enemies.push(actor);
    return actor;
  }

  removeEnemies() {
    for (const actor of this.enemies) {
      actor.userData.alive = false;
      this.engine.scene.remove(actor);
      const index = this.engine.monsters.indexOf(actor);
      if (index >= 0) this.engine.monsters.splice(index, 1);
    }
    this.enemies = [];
  }

  positionAlliesForInfiltration() {
    const positions = [
      { x: -80.5, z: 86.8 },
      { x: -78.6, z: 89.2 },
    ];
    this.allies.forEach((actor, index) => {
      const target = positions[index] || positions[0];
      actor.position.set(target.x, heightAt(target.x, target.z), target.z);
      actor.userData.x = target.x;
      actor.userData.z = target.z;
      actor.userData.questHold = true;
    });
  }

  moveActor(actor, target, dt, speed = 3.2) {
    if (!actor || actor.userData.alive === false) return;
    const to = new THREE.Vector3(target.x, 0, target.z).sub(actor.position).setY(0);
    const distance = to.length();
    if (distance > 0.35) actor.position.addScaledVector(to.normalize(), dt * Math.min(speed, distance * 2));
    actor.position.y = heightAt(actor.position.x, actor.position.z);
    actor.userData.x = actor.position.x;
    actor.userData.z = actor.position.z;
  }

  beginApproach() {
    this.removeContact();
    this.spawnAllies(true);
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.REBELS_APPROACH,
      route: 'rebels',
      status: 'active',
      vars: { rebelWaitedAtCamp: true },
    });
    this.engine.hud.setObjective('Два повстанца идут за тобой. Веди их к задней стене Поста Ришелье.');
  }

  enterInfiltration({ restored = false } = {}) {
    this.spawnAllies(false);
    if (!restored) this.checkpoint = this.captureCheckpoint();
    else this.restoreCheckpoint();
    this.positionAlliesForInfiltration();
    this.awareness = 0;
    this.setActorHeld('marcel-dumont', true);
    this.setActorHeld('corporal-voss', true);
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.REBELS_INFILTRATION,
      route: 'rebels',
      status: 'active',
      vars: {
        rebelCheckpointReady: true,
        rebelCheckpoint: this.checkpoint,
        rebelLightsOff: false,
        rebelCombatRemaining: null,
      },
    });
    this.engine.hud.setObjective('Проберись к рубильнику за постом. Не задерживайся в поле зрения Дюмона и Восса.');
  }

  observerVisibility(observer) {
    if (!observer?.visible || observer.userData.alive === false) return 0;
    const toPlayer = this.engine.rig.position.clone().sub(observer.position).setY(0);
    const distance = toPlayer.length();
    if (distance > 13 || distance < 0.01) return 0;
    toPlayer.normalize();
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(observer.quaternion).setY(0).normalize();
    const cone = Math.max(0, forward.dot(toPlayer));
    return Math.max(0, 1 - distance / 13) * (0.18 + cone * 0.82);
  }

  updateAwareness(dt) {
    const nearSwitch = distXZ(this.engine.rig.position, TAX_POSITIONS.rebelSwitch) < 15;
    const multiplier = rebelAwarenessMultiplier(
      this.engine.player?.characterProfile || this.engine.characterProfile || this.engine.player || {},
      this.engine.player?.rpg?.skills || {},
    );
    if (!nearSwitch) {
      this.awareness = Math.max(0, this.awareness - dt * 0.55);
    } else {
      const seen = Math.max(
        this.observerVisibility(this.lifeAgent('marcel-dumont')),
        this.observerVisibility(this.lifeAgent('corporal-voss')),
      );
      this.awareness = THREE.MathUtils.clamp(this.awareness + dt * (seen * 1.42 * multiplier - 0.18), 0, 1);
    }
    this.awarenessEl.querySelector('i').style.transform = `scaleX(${this.awareness.toFixed(3)})`;
    this.awarenessEl.style.opacity = '1';
    if (this.awareness >= 1) this.startCombat('караул заметил движение у рубильника');
  }

  startCleanExtraction() {
    this.setLights(false);
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.REBELS_CLEAN,
      route: 'rebels',
      status: 'active',
      vars: { rebelLightsOff: true, rebelOutcome: 'rebels_clean' },
    });
    this.extraction = { mode: 'clean', elapsed: 0, line: -1, dumontHidden: false };
    this.awarenessEl.style.opacity = '0';
    this.engine.hud.setObjective('Свет погас. Держись у стены, пока повстанцы выводят Дюмона.');
  }

  spawnCombatWave(index) {
    const waves = [
      [
        { id: 'tax-rebel-wave-1-voss', name: 'Капрал Восс', x: -66, z: 82, hp: 72, loadout: 'imperial_lmg' },
        { id: 'tax-rebel-wave-1-guard', name: 'Ночной караульный', x: -72, z: 78, hp: 54, loadout: 'imperial_rifle' },
      ],
      [
        { id: 'tax-rebel-wave-2-road', name: 'Патрульный с дороги', x: -57, z: 72, hp: 58, loadout: 'imperial_rifle' },
        { id: 'tax-rebel-wave-2-gate', name: 'Стрелок шлагбаума', x: -63, z: 88, hp: 62, loadout: 'imperial_lmg' },
      ],
    ];
    for (const data of waves[index] || []) this.spawnEnemy(data, data.loadout);
    this.combat.spawned[index] = true;
    this.engine.log.unshift(`Налог и глина: повстанческая операция — волна ${index + 1}/2.`);
  }

  startCombat(reason = 'тревога') {
    if (this.combat || this.quest().stage !== TAX_STAGES.REBELS_INFILTRATION) return;
    this.spawnAllies(false);
    this.positionAlliesForInfiltration();
    for (const actor of this.allies) actor.userData.questCombatNeutral = false;
    this.setLights(false);
    this.setActorHeld('marcel-dumont', true);
    this.setActorHeld('corporal-voss', true);
    const dumont = this.lifeAgent('marcel-dumont');
    if (dumont) dumont.userData.questCombatNeutral = true;
    const voss = this.lifeAgent('corporal-voss');
    if (voss) {
      voss.visible = false;
      voss.userData.settlementCulled = true;
      if (voss.userData.label) voss.userData.label.visible = false;
    }
    this.combat = {
      elapsed: 0,
      remaining: REBEL_COMBAT_DURATION,
      spawned: [false, false],
    };
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.REBELS_COMBAT,
      route: 'rebels',
      status: 'combat',
      vars: {
        rebelLightsOff: true,
        rebelCombatRemaining: REBEL_COMBAT_DURATION,
        rebelOutcome: 'rebels_bloody',
      },
    });
    this.spawnCombatWave(0);
    this.awarenessEl.style.opacity = '0';
    this.engine.aiFeel?.notifyNoise?.(this.engine.rig.position, 38, 'rebel-operation');
    this.engine.hud.setObjective(`Тревога: ${reason}. Прикрой похищение 45 секунд.`);
  }

  resetOperation(reason) {
    this.removeEnemies();
    this.removeAllies();
    this.combat = null;
    this.extraction = null;
    this.awareness = 0;
    this.awarenessEl.style.opacity = '0';
    this.setLights(true);
    this.restoreStaticPost();
    this.restoreCheckpoint();
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.REBELS_INFILTRATION,
      route: 'rebels',
      status: 'active',
      outcome: null,
      vars: {
        rebelCheckpointReady: true,
        rebelLightsOff: false,
        rebelCombatRemaining: null,
        rebelOutcome: null,
      },
    });
    this.spawnAllies(false);
    this.positionAlliesForInfiltration();
    this.engine.hud.setObjective(`Операция сорвалась: ${reason}. Попробуй снова от checkpoint у рубильника.`);
  }

  beginExtraction(mode) {
    this.removeEnemies();
    this.combat = null;
    for (const actor of this.allies) actor.userData.questCombatNeutral = true;
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.REBELS_EXTRACTION,
      route: 'rebels',
      status: 'active',
      vars: {
        rebelLightsOff: true,
        rebelCombatRemaining: null,
        rebelOutcome: mode,
      },
    });
    this.extraction = { mode, elapsed: 0, line: -1, dumontHidden: false };
    this.engine.hud.setObjective('Дюмона выводят с поста. Прикрой последние секунды отхода.');
  }

  showExtractionLine(lines, index) {
    if (!lines[index]) return;
    this.subtitle.textContent = `${lines[index][0]}: ${lines[index][1]}`;
    this.subtitle.style.opacity = '1';
  }

  updateExtraction(dt) {
    if (!this.extraction) return;
    this.extraction.elapsed += dt;
    const lines = isCleanRebelOutcome(this.extraction.mode) ? CLEAN_LINES : BLOODY_LINES;
    const lineIndex = Math.min(lines.length - 1, Math.floor(this.extraction.elapsed / 2.1));
    if (lineIndex !== this.extraction.line) {
      this.extraction.line = lineIndex;
      this.showExtractionLine(lines, lineIndex);
    }

    if (this.quest().stage === TAX_STAGES.REBELS_CLEAN) {
      for (const actor of this.allies) this.moveActor(actor, TAX_POSITIONS.post, dt, 3.3);
      if (this.extraction.elapsed >= 5.8) {
        this.extraction.elapsed = 0;
        this.extraction.line = -1;
        this.beginExtraction('rebels_clean');
      }
      return;
    }

    if (!this.extraction.dumontHidden) {
      this.extraction.dumontHidden = true;
      const dumont = this.lifeAgent('marcel-dumont');
      if (dumont) {
        dumont.visible = false;
        dumont.userData.settlementCulled = true;
        if (dumont.userData.label) dumont.userData.label.visible = false;
      }
    }
    for (const actor of this.allies) this.moveActor(actor, TAX_POSITIONS.rebelExtraction, dt, 4.0);
    if (this.extraction.elapsed >= 4.8) this.finish(this.extraction.mode);
  }

  finish(outcome) {
    const reward = TAX_REWARDS[outcome];
    if (!reward) return;
    this.subtitle.style.opacity = '0';
    this.engine.worldState.setFlag('dumont_abducted');
    this.engine.worldState.grantRewardOnce(`tax:${outcome}`, reward);
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.REBELS_DONE,
      route: 'rebels',
      status: 'complete',
      outcome,
      vars: {
        rebelCheckpointReady: false,
        rebelCheckpoint: null,
        rebelLightsOff: false,
        rebelCombatRemaining: null,
        rebelOutcome: outcome,
      },
    });
    this.engine.worldState.applyPersistentRewards(this.engine);
    this.removeEnemies();
    this.removeAllies();
    this.combat = null;
    this.extraction = null;
    this.awareness = 0;
    this.awarenessEl.style.opacity = '0';
    this.setLights(true);
    this.restoreStaticPost({ keepDumontHidden: true });
    this.engine.hud.setObjective(outcome === 'rebels_clean'
      ? 'Дюмон исчез без выстрела. Связной оставил тебе Наган.'
      : 'Дюмон исчез под прикрытием боя. Повстанцы оставили тебе Обрез.');
    this.engine.log.unshift('Налог и глина: Дюмона увели в ночь. Ньен Ло и Восс временно удерживают пост.');
  }

  restoreStaticPost({ keepDumontHidden = false } = {}) {
    for (const id of ['marcel-dumont', 'corporal-voss']) {
      const actor = this.lifeAgent(id);
      if (!actor) continue;
      actor.userData.questHold = false;
      actor.userData.conditionalHostile = false;
      actor.userData.provoked = false;
      actor.userData.questCombatNeutral = false;
      actor.userData.alive = true;
      const hidden = keepDumontHidden && id === 'marcel-dumont';
      actor.visible = !hidden;
      actor.userData.settlementCulled = hidden;
      if (actor.userData.label) actor.userData.label.visible = !hidden;
    }
  }

  restoreStageRuntime() {
    const quest = this.quest();
    if (quest.route !== 'rebels') return;
    if (isRebelContactStage(quest.stage)) this.spawnContact();
    if (quest.stage === TAX_STAGES.REBELS_APPROACH) this.spawnAllies(true);
    if (quest.stage === TAX_STAGES.REBELS_INFILTRATION) {
      this.enterInfiltration({ restored: true });
    }
  }

  applyPersistentWorld() {
    if (!this.engine.worldState.getFlag('dumont_abducted')) return;
    const dumont = this.lifeAgent('marcel-dumont');
    if (dumont) {
      dumont.visible = false;
      dumont.userData.settlementCulled = true;
      if (dumont.userData.label) dumont.userData.label.visible = false;
    }
    this.restoreStaticPost({ keepDumontHidden: true });
  }

  updateApproach(dt) {
    if (worldClock.nightFactor < 0.35) {
      this.removeAllies();
      this.engine.worldState.patchQuest(TAX_QUEST_ID, {
        stage: TAX_STAGES.REBELS_CAMP,
        route: 'rebels',
        status: 'active',
      });
      this.engine.hud.setObjective('Рассвет сорвал подход. Вернись к костру и дождись следующей ночи.');
      return;
    }
    this.spawnAllies(true);
    this.allies.forEach((actor, index) => {
      const side = index === 0 ? -1.4 : 1.4;
      const target = {
        x: this.engine.rig.position.x + side,
        z: this.engine.rig.position.z + 3.2 + index,
      };
      this.moveActor(actor, target, dt, 5.2);
    });
    if (distXZ(this.engine.rig.position, TAX_POSITIONS.post) < 22) this.enterInfiltration();
  }

  updateInfiltration(dt) {
    if (worldClock.nightFactor < 0.35) {
      this.removeAllies();
      this.restoreStaticPost();
      this.awareness = 0;
      this.awarenessEl.style.opacity = '0';
      this.engine.worldState.patchQuest(TAX_QUEST_ID, {
        stage: TAX_STAGES.REBELS_CAMP,
        route: 'rebels',
        status: 'active',
      });
      this.engine.hud.setObjective('Рассвело. Вернись к костру и повтори операцию следующей ночью.');
      return;
    }
    this.updateAwareness(dt);
    if (distXZ(this.engine.rig.position, TAX_POSITIONS.rebelSwitch) < 3.2) {
      this.engine.hud.showPrompt(this.awareness < 0.72
        ? 'E — бесшумно отключить свет поста'
        : 'E — рвануть рубильник, пока караул уже смотрит сюда');
    }
  }

  updateCombat(dt) {
    if (!this.combat) return;
    const distance = distXZ(this.engine.rig.position, TAX_POSITIONS.post);
    const alliesAlive = this.allies.filter((actor) => actor.userData.alive !== false).length;
    if (this.engine.player.hp <= 0) {
      this.resetOperation('ты пал во дворе поста');
      return;
    }
    if (distance > 75) {
      this.resetOperation('ты бросил группу и ушёл слишком далеко');
      return;
    }
    if (alliesAlive === 0) {
      this.resetOperation('оба повстанца погибли');
      return;
    }
    this.combat.elapsed += dt;
    this.combat.remaining = Math.max(0, REBEL_COMBAT_DURATION - this.combat.elapsed);
    if (this.combat.elapsed >= REBEL_COMBAT_DURATION / 2 && !this.combat.spawned[1]) this.spawnCombatWave(1);
    if (this.combat.remaining <= 0) {
      this.beginExtraction('rebels_bloody');
      return;
    }
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      vars: { rebelCombatRemaining: this.combat.remaining },
    });
  }

  interact() {
    const quest = this.quest();
    const player = this.engine.rig.position;
    if (quest.route !== 'rebels') return false;
    if (quest.stage === TAX_STAGES.REBELS_CAMP && distXZ(player, TAX_POSITIONS.rebelCamp) < 3.2) {
      if (worldClock.nightFactor <= 0.55) this.engine.timeOfDay?.setPhase?.(0.82);
      this.beginApproach();
      return true;
    }
    if (quest.stage === TAX_STAGES.REBELS_INFILTRATION && distXZ(player, TAX_POSITIONS.rebelSwitch) < 2.5) {
      if (worldClock.nightFactor <= 0.55) {
        this.engine.hud.setObjective('Рубильник охраняют. Операция возможна только ночью.');
        return true;
      }
      if (this.awareness >= 0.72) this.startCombat('рубильник загрохотал под взглядом караула');
      else this.startCleanExtraction();
      return true;
    }
    return false;
  }

  update(dt) {
    const quest = this.quest();
    if (quest.route === 'rebels' && isRebelContactStage(quest.stage)) this.spawnContact();
    else this.removeContact();
    const activeVisuals = quest.route === 'rebels' && quest.stage >= TAX_STAGES.REBELS_CAMP && quest.stage <= TAX_STAGES.REBELS_EXTRACTION;
    this.campfire.visible = quest.route === 'rebels' && quest.stage >= TAX_STAGES.REBELS_CODE && quest.stage <= TAX_STAGES.REBELS_CAMP;
    this.powerRig.visible = activeVisuals || quest.stage === TAX_STAGES.REBELS_DONE;
    if (!this.lightsOn) this.setLights(false);

    if (quest.stage === TAX_STAGES.REBELS_CAMP && distXZ(this.engine.rig.position, TAX_POSITIONS.rebelCamp) < 4) {
      this.engine.hud.showPrompt(worldClock.nightFactor > 0.55
        ? 'E — дать знак и начать ночную операцию'
        : 'E — ждать у костра до ночи');
    }
    if (quest.stage === TAX_STAGES.REBELS_APPROACH) this.updateApproach(dt);
    if (quest.stage === TAX_STAGES.REBELS_INFILTRATION) this.updateInfiltration(dt);
    if (quest.stage === TAX_STAGES.REBELS_COMBAT) this.updateCombat(dt);
    if (quest.stage === TAX_STAGES.REBELS_CLEAN || quest.stage === TAX_STAGES.REBELS_EXTRACTION) {
      const distance = distXZ(this.engine.rig.position, TAX_POSITIONS.post);
      if (this.engine.player.hp <= 0 || distance > 75 || this.allies.every((actor) => actor.userData.alive === false)) {
        this.resetOperation('группа не смогла завершить отход');
      } else {
        this.updateExtraction(dt);
      }
    }
  }

  bannerText() {
    const quest = this.quest();
    switch (quest.stage) {
      case TAX_STAGES.REBELS_CODE: return '◐ Налог и глина — найди связного на Красной дороге';
      case TAX_STAGES.REBELS_CONTACT: return '◐ Налог и глина — подтверди связному участие в операции';
      case TAX_STAGES.REBELS_CAMP: return '☾ Налог и глина — дождись ночи у костра повстанцев';
      case TAX_STAGES.REBELS_APPROACH: return '☾ Налог и глина — проведи группу к задней стене поста';
      case TAX_STAGES.REBELS_INFILTRATION: return '◉ Налог и глина — отключи свет поста';
      case TAX_STAGES.REBELS_CLEAN: return '◐ Налог и глина — не мешай тихому похищению';
      case TAX_STAGES.REBELS_COMBAT: return `⚔ Прикрой похищение — ${Math.ceil(this.combat?.remaining || 0)} сек`;
      case TAX_STAGES.REBELS_EXTRACTION: return '◐ Налог и глина — прикрой отход группы';
      default: return '';
    }
  }

  resetRuntime() {
    this.removeEnemies();
    this.removeContact();
    this.removeAllies();
    this.combat = null;
    this.extraction = null;
    this.checkpoint = null;
    this.awareness = 0;
    this.awarenessEl.style.opacity = '0';
    this.subtitle.style.opacity = '0';
    this.setLights(true);
    this.restoreStaticPost();
    this.campfire.visible = false;
    this.powerRig.visible = false;
  }

  setDebugStage(stage) {
    this.resetRuntime();
    if (isRebelContactStage(stage)) this.spawnContact();
    if (stage === TAX_STAGES.REBELS_APPROACH) this.spawnAllies(true);
    if (stage === TAX_STAGES.REBELS_INFILTRATION) this.enterInfiltration({ restored: true });
  }

  diagnostics() {
    const quest = this.quest();
    return {
      stage: quest.route === 'rebels' ? quest.stage : null,
      awareness: Math.round(this.awareness * 100) / 100,
      lightsOn: this.lightsOn,
      allies: this.allies.map((actor) => ({
        id: actor.userData.id,
        alive: actor.userData.alive !== false,
        hp: Math.round(actor.userData.hp || 0),
      })),
      contact: this.contact ? {
        id: this.contact.userData.id,
        alive: this.contact.userData.alive !== false,
      } : null,
      enemiesAlive: this.enemies.filter((actor) => actor.userData.alive !== false).length,
      waves: this.combat ? [...this.combat.spawned] : null,
      remaining: this.combat ? Math.round(this.combat.remaining * 10) / 10 : null,
      checkpoint: !!this.checkpoint || !!quest.vars.rebelCheckpointReady,
      outcome: quest.outcome,
    };
  }
}
