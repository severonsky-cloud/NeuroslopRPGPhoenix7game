import * as THREE from '../vendor/three.module.js';
import { createMonster } from '../entities/monster.js';
import { ITEM_DEFS } from '../items/inventory.js';
import { ARSENAL } from '../combat/arsenal.js';
import { triggerWeaponViewModelAction } from '../items/weaponModels.js';
import {
  TAX_ARREST_SQUAD,
  TAX_POSITIONS,
  TAX_QUEST_ID,
  TAX_REPLACEMENT_GARRISON,
  TAX_REWARDS,
  TAX_STAGES,
} from '../data/taxQuestData.js';
import { heightAt } from '../world/terrain.js';

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

export class TaxCombatSystem {
  constructor(engine) {
    this.engine = engine;
    this.assassination = null;
    this.shockTimer = 0;
    this.standoff = null;
    this.questActors = [];
    this.arrestSquad = [];
    this.postHidden = new Map();
    this.shockSaveT = 0;
    this.normalizeInterruptedCombat();
    this.applyPersistentWorld();
    if (this.quest().stage === TAX_STAGES.ASSASSINATION_ESCAPE) this.resumeAssassinationEscape();
  }

  quest() {
    return this.engine.worldState.questState(TAX_QUEST_ID);
  }

  lifeAgent(id) {
    return this.engine.livingWorld?.agents?.find((agent) => agent.userData.id === id) || null;
  }

  hideLifeAgent(id, hidden = true) {
    const agent = this.lifeAgent(id);
    if (!agent) return;
    if (!this.postHidden.has(id)) this.postHidden.set(id, {
      visible: agent.visible,
      culled: !!agent.userData.settlementCulled,
    });
    agent.visible = !hidden;
    agent.userData.settlementCulled = hidden;
    if (agent.userData.label) agent.userData.label.visible = !hidden;
  }

  restoreLifeAgent(id) {
    const agent = this.lifeAgent(id);
    const snapshot = this.postHidden.get(id);
    if (!agent || !snapshot) return;
    agent.visible = snapshot.visible;
    agent.userData.settlementCulled = snapshot.culled;
    if (agent.userData.label) agent.userData.label.visible = snapshot.visible;
    agent.userData.conditionalHostile = false;
    agent.userData.provoked = false;
    this.postHidden.delete(id);
  }

  spawnCombatant(data, loadout = 'imperial_rifle') {
    const actor = createMonster(this.engine.scene, {
      archetype: 'brute',
      faction: 'empire',
      role: 'patrol',
      hp: 58,
      speed: 1.2,
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
    this.questActors.push(actor);
    return actor;
  }

  removeQuestActors() {
    for (const actor of this.questActors) {
      actor.userData.alive = false;
      this.engine.scene.remove(actor);
      const index = this.engine.monsters.indexOf(actor);
      if (index >= 0) this.engine.monsters.splice(index, 1);
    }
    this.questActors = [];
  }

  meleeFallback() {
    const inventory = this.engine.player.inventoryState?.items || [];
    const meleeItem = inventory.find((id) => {
      const weaponId = ITEM_DEFS[id]?.weaponId;
      const weapon = ARSENAL[weaponId];
      return weaponId && weaponId !== 'fists' && !weapon?.ammoType && weapon?.archetype !== 'phase';
    });
    return ITEM_DEFS[meleeItem]?.weaponId || (inventory.includes('phaseHand') ? 'phase' : 'fists');
  }

  startAssassination() {
    if (this.assassination) return;
    const previousWeapon = this.engine.player.weapon;
    const weapon = this.meleeFallback();
    this.engine.player.weapon = weapon;
    this.engine.buildViewModel?.();
    triggerWeaponViewModelAction(this.engine.hands, 'primary');
    this.engine.player.characterRuntime.rooted = true;
    this.assassination = { elapsed: 0, previousWeapon, weapon };
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.ASSASSINATION_SCENE,
      route: 'assassination',
      status: 'active',
      vars: { cinematic: true },
    });
    this.engine.hud.setObjective(`Казнь Дюмона: ${ARSENAL[weapon]?.name || 'удар'}`);
  }

  finishAssassination() {
    const dumont = this.lifeAgent('marcel-dumont');
    if (dumont) {
      dumont.userData.alive = false;
      this.hideLifeAgent('marcel-dumont', true);
    }
    this.engine.worldState.setFlag('dumont_dead');
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.ASSASSINATION_ESCAPE,
      route: 'assassination',
      status: 'active',
      vars: { cinematic: false, shockRemaining: 120 },
    });
    this.engine.player.characterRuntime.rooted = false;
    this.shockTimer = 120;
    this.spawnCombatant({ id: 'tax-assassination-voss', name: 'Капрал Восс', x: -65, z: 82, hp: 72 }, 'imperial_lmg');
    this.spawnCombatant({ id: 'tax-assassination-guard-a', name: 'Стрелок поста', x: -71, z: 81 }, 'imperial_rifle');
    this.spawnCombatant({ id: 'tax-assassination-guard-b', name: 'Дорожный караульный', x: -63, z: 75 }, 'imperial_rifle');
    this.hideLifeAgent('corporal-voss', true);
    this.assassination = null;
    this.engine.log.unshift('Налог и глина: Дюмон казнён. Охрана поста открыла огонь.');
  }

  resumeAssassinationEscape() {
    if (this.questActors.length) return;
    this.shockTimer = Math.max(0, Number(this.quest().vars.shockRemaining) || 120);
    this.hideLifeAgent('marcel-dumont', true);
    this.hideLifeAgent('corporal-voss', true);
    this.spawnCombatant({ id: 'tax-assassination-voss', name: 'Капрал Восс', x: -65, z: 82, hp: 72 }, 'imperial_lmg');
    this.spawnCombatant({ id: 'tax-assassination-guard-a', name: 'Стрелок поста', x: -71, z: 81 }, 'imperial_rifle');
    this.spawnCombatant({ id: 'tax-assassination-guard-b', name: 'Дорожный караульный', x: -63, z: 75 }, 'imperial_rifle');
  }

  updateAssassination(dt) {
    if (this.assassination) {
      this.assassination.elapsed += dt;
      const t = this.assassination.elapsed / 1.8;
      this.engine.camera.rotation.z = Math.sin(Math.min(1, t) * Math.PI) * -0.035;
      if (this.assassination.elapsed >= 1.8) this.finishAssassination();
      return;
    }
    const quest = this.quest();
    if (quest.stage !== TAX_STAGES.ASSASSINATION_ESCAPE) return;
    this.shockTimer = Math.max(0, (this.shockTimer || 120) - dt);
    this.shockSaveT += dt;
    if (this.shockSaveT >= 1) {
      this.shockSaveT = 0;
      this.engine.worldState.patchQuest(TAX_QUEST_ID, { vars: { shockRemaining: this.shockTimer } });
    }
    const distance = distXZ(this.engine.rig.position, TAX_POSITIONS.post);
    if (this.shockTimer <= 0 && distance > 70) {
      this.engine.worldState.patchQuest(TAX_QUEST_ID, {
        stage: TAX_STAGES.ASSASSINATION_GERDA,
        route: 'assassination',
        status: 'active',
      });
      this.removeQuestActors();
      this.restoreLifeAgent('corporal-voss');
      this.engine.hud.setObjective('Ты скрылся. Найди Герду в Форте Заря.');
      this.engine.log.unshift('Налог и глина: погоня отстала. Герда должна услышать твою версию.');
    }
  }

  captureCheckpoint() {
    return {
      position: this.engine.rig.position.clone(),
      hp: this.engine.player.hp,
      st: this.engine.player.st,
      ph: this.engine.player.ph,
      ammo: cloneAmmo(this.engine),
    };
  }

  restoreCheckpoint(snapshot) {
    if (!snapshot) return;
    this.engine.rig.position.copy(snapshot.position);
    this.engine.player.hp = Math.max(1, snapshot.hp);
    this.engine.player.st = snapshot.st;
    this.engine.player.ph = snapshot.ph;
    restoreAmmo(this.engine, snapshot.ammo);
  }

  setPostCiviliansHidden(hidden) {
    for (const id of ['marcel-dumont', 'corporal-voss', 'nyen-lo', 'red_rural_caravan']) {
      if (hidden) this.hideLifeAgent(id, true);
      else this.restoreLifeAgent(id);
    }
  }

  spawnWave(index) {
    const waves = [
      [
        { id: 'tax-wave-1a', name: 'Караульный Ришелье', x: -66, z: 80, hp: 52, loadout: 'imperial_rifle' },
        { id: 'tax-wave-1b', name: 'Дюмон', x: -69, z: 77, hp: 76, loadout: 'imperial_lmg' },
      ],
      [
        { id: 'tax-wave-2a', name: 'Патрульный с дороги', x: -57, z: 72, hp: 58, loadout: 'imperial_rifle' },
        { id: 'tax-wave-2b', name: 'Сержант поста', x: -61, z: 86, hp: 64, loadout: 'imperial_lmg' },
      ],
      [
        { id: 'tax-wave-3a', name: 'Подручный Дюмона', x: -78, z: 88, hp: 58, loadout: 'imperial_rifle' },
        { id: 'tax-wave-3b', name: 'Пулемётчик шлагбаума', x: -72, z: 89, hp: 68, loadout: 'imperial_lmg' },
        { id: 'tax-wave-3c', name: 'Последний караульный', x: -55, z: 80, hp: 56, loadout: 'imperial_rifle' },
      ],
    ];
    for (const actor of waves[index] || []) this.spawnCombatant(actor, actor.loadout);
    this.standoff.spawned[index] = true;
    this.engine.log.unshift(`Налог и глина: волна ${index + 1}/3.`);
  }

  startStandoff() {
    if (this.standoff) return;
    this.standoff = {
      elapsed: 0,
      remaining: 90,
      checkpoint: this.captureCheckpoint(),
      spawned: [false, false, false],
    };
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.STANDOFF_COMBAT,
      route: 'standoff',
      status: 'combat',
      vars: { checkpointReady: true },
    });
    this.setPostCiviliansHidden(true);
    this.spawnWave(0);
    this.engine.hud.setObjective('Продержись 90 секунд. Крестьяне ушли за помощью.');
  }

  resetStandoff(reason = 'поражение') {
    const checkpoint = this.standoff?.checkpoint;
    this.removeQuestActors();
    this.setPostCiviliansHidden(false);
    this.restoreCheckpoint(checkpoint);
    this.standoff = null;
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.OFFERED,
      route: null,
      status: 'active',
      outcome: null,
      vars: { checkpointReady: false },
    });
    this.engine.hud.setObjective(`Сцена перезапущена: ${reason}. Поговори с Дюмоном и выбери путь.`);
  }

  spawnReplacementGarrison() {
    for (const data of TAX_REPLACEMENT_GARRISON) {
      const existing = this.lifeAgent(data.id);
      const agent = existing || this.engine.livingWorld.addAgent({ ...data, settlementId: 'richelieu-post', residentDistance: 68 });
      agent.userData.race = data.id.includes('reptiloid') ? 'seniorReptiloid' : data.id.includes('deimur') ? 'deimur' : 'blue';
      this.engine.armedWorld?.configureActor?.(agent);
      this.engine.aiFeel?.initActor?.(agent);
      this.engine.actorVisuals?.enhance?.(agent);
    }
  }

  finishStandoff() {
    this.removeQuestActors();
    this.setPostCiviliansHidden(false);
    this.hideLifeAgent('marcel-dumont', true);
    this.hideLifeAgent('corporal-voss', true);
    this.engine.worldState.setFlag('dumont_defeated_standoff');
    this.engine.worldState.grantRewardOnce('tax:standoff', TAX_REWARDS.standoff);
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.STANDOFF_DONE,
      route: 'standoff',
      status: 'complete',
      outcome: 'standoff',
      vars: { checkpointReady: false },
    });
    this.engine.worldState.applyPersistentRewards(this.engine);
    this.spawnReplacementGarrison();
    this.standoff = null;
    this.engine.hud.setObjective('Крестьяне вернулись с подкреплением. Старый гарнизон заменён.');
    this.engine.log.unshift('Налог и глина: оборона выдержана. Пост получил новый нейтральный гарнизон.');
  }

  updateStandoff(dt) {
    if (!this.standoff) return;
    if (this.engine.player.hp <= 0) {
      this.resetStandoff('ты пал в обороне');
      return;
    }
    this.standoff.elapsed += dt;
    this.standoff.remaining = Math.max(0, 90 - this.standoff.elapsed);
    if (this.standoff.elapsed >= 30 && !this.standoff.spawned[1]) this.spawnWave(1);
    if (this.standoff.elapsed >= 60 && !this.standoff.spawned[2]) this.spawnWave(2);
    if (this.standoff.remaining <= 0) this.finishStandoff();
  }

  spawnArrestSquad() {
    if (this.arrestSquad.length) return;
    TAX_ARREST_SQUAD.forEach((data, index) => {
      const angle = index * Math.PI * 2 / 3;
      const agent = this.engine.livingWorld.addAgent({
        ...data,
        x: TAX_POSITIONS.gerda.x + Math.cos(angle) * 2.5,
        z: TAX_POSITIONS.gerda.z + Math.sin(angle) * 2.5,
        residentDistance: 9999,
      });
      agent.userData.questFollower = true;
      agent.userData.questFollowIndex = index;
      this.engine.armedWorld?.configureActor?.(agent, index === 0 ? 'imperial_lmg' : 'imperial_rifle');
      this.engine.aiFeel?.initActor?.(agent);
      this.engine.actorVisuals?.enhance?.(agent);
      this.arrestSquad.push(agent);
    });
  }

  removeArrestSquad() {
    for (const actor of this.arrestSquad) {
      const label = actor.userData.label;
      if (label) {
        this.engine.scene.remove(label);
        const labelIndex = this.engine.labels.indexOf(label);
        if (labelIndex >= 0) this.engine.labels.splice(labelIndex, 1);
      }
      this.engine.scene.remove(actor);
      const index = this.engine.livingWorld.agents.indexOf(actor);
      if (index >= 0) this.engine.livingWorld.agents.splice(index, 1);
    }
    this.arrestSquad = [];
  }

  updateArrestSquad(dt) {
    if (this.quest().stage !== TAX_STAGES.ARREST_MARCH) return;
    this.spawnArrestSquad();
    const yaw = this.engine.yaw || 0;
    this.arrestSquad.forEach((actor, index) => {
      const row = index === 0 ? 0 : 1;
      const side = index === 1 ? -1 : index === 2 ? 1 : 0;
      const target = this.engine.rig.position.clone();
      target.x += Math.sin(yaw) * (2.4 + row * 1.4) + Math.cos(yaw) * side * 1.8;
      target.z += Math.cos(yaw) * (2.4 + row * 1.4) - Math.sin(yaw) * side * 1.8;
      const to = target.sub(actor.position).setY(0);
      const distance = to.length();
      if (distance > 22) {
        actor.position.copy(this.engine.rig.position).add(new THREE.Vector3(side * 1.4, 0, 3 + row));
      } else if (distance > 0.8) {
        actor.position.addScaledVector(to.normalize(), dt * Math.min(7, 2.5 + distance * 0.18));
      }
      actor.position.y = heightAt(actor.position.x, actor.position.z);
      actor.userData.x = actor.position.x;
      actor.userData.z = actor.position.z;
      actor.lookAt(this.engine.rig.position.x, this.engine.rig.position.y + 1, this.engine.rig.position.z);
    });
    if (distXZ(this.engine.rig.position, TAX_POSITIONS.post) < 18) {
      this.engine.worldState.patchQuest(TAX_QUEST_ID, {
        stage: TAX_STAGES.ARREST_CHOICE,
        route: 'investigation',
        status: 'active',
      });
      this.engine.hud.setObjective('Следственная группа заняла пост. Поговори с Дюмоном.');
    }
  }

  finishArrest(outcome) {
    if (!TAX_REWARDS[outcome]) return;
    this.hideLifeAgent('marcel-dumont', true);
    this.engine.worldState.setFlag('dumont_arrested');
    this.engine.worldState.grantRewardOnce(`tax:arrest:${outcome}`, TAX_REWARDS[outcome]);
    if (outcome === 'community') this.engine.worldState.setFlag('lang_do_services_unlocked');
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.ARREST_DONE,
      route: 'investigation',
      status: 'complete',
      outcome,
      vars: { arrestPending: false },
    });
    this.engine.worldState.applyPersistentRewards(this.engine);
    this.removeArrestSquad();
    this.engine.hud.setObjective('Дюмон арестован. Ньен Ло и Восс временно управляют постом.');
    this.engine.log.unshift(`Налог и глина: арест оформлен исходом «${outcome}». Дюмон обещал вернуться.`);
  }

  normalizeInterruptedCombat() {
    const quest = this.quest();
    if (quest.stage === TAX_STAGES.STANDOFF_COMBAT || quest.status === 'combat') {
      this.engine.worldState.patchQuest(TAX_QUEST_ID, {
        stage: TAX_STAGES.OFFERED,
        route: null,
        status: 'active',
        vars: { checkpointReady: false },
      });
      this.engine.rig.position.set(
        TAX_POSITIONS.checkpoint.x,
        heightAt(TAX_POSITIONS.checkpoint.x, TAX_POSITIONS.checkpoint.z),
        TAX_POSITIONS.checkpoint.z,
      );
      this.engine.player.hp = this.engine.player.hpMax;
      this.engine.player.st = this.engine.player.stMax;
      this.engine.player.ph = this.engine.player.phMax;
      this.engine.log.unshift('Налог и глина: прерванная оборона восстановлена у checkpoint перед ссорой.');
    }
  }

  applyPersistentWorld() {
    const quest = this.quest();
    if (this.engine.worldState.getFlag('dumont_dead') || this.engine.worldState.getFlag('dumont_arrested')) {
      this.hideLifeAgent('marcel-dumont', true);
    }
    if (quest.outcome === 'standoff' || this.engine.worldState.getFlag('dumont_defeated_standoff')) {
      this.hideLifeAgent('marcel-dumont', true);
      this.hideLifeAgent('corporal-voss', true);
      this.spawnReplacementGarrison();
    }
    if (quest.stage === TAX_STAGES.ARREST_MARCH) this.spawnArrestSquad();
    if (quest.stage === TAX_STAGES.ARREST_CHOICE) {
      this.spawnArrestSquad();
      this.arrestSquad.forEach((actor, index) => {
        actor.position.set(-73 + index * 2.4, heightAt(-73 + index * 2.4, 73), 73);
        actor.userData.x = actor.position.x;
        actor.userData.z = actor.position.z;
      });
    }
  }

  update(dt) {
    this.updateAssassination(dt);
    this.updateStandoff(dt);
    this.updateArrestSquad(dt);
  }

  resetRuntime() {
    this.removeQuestActors();
    this.removeArrestSquad();
    this.assassination = null;
    this.standoff = null;
    this.shockTimer = 0;
    if (this.engine.player.characterRuntime) this.engine.player.characterRuntime.rooted = false;
    for (const id of [...this.postHidden.keys()]) this.restoreLifeAgent(id);
    for (const id of ['marcel-dumont', 'corporal-voss', 'nyen-lo', 'red_rural_caravan']) {
      const actor = this.lifeAgent(id);
      if (!actor) continue;
      actor.userData.alive = true;
      actor.visible = true;
      actor.userData.settlementCulled = false;
      actor.userData.conditionalHostile = false;
      actor.userData.provoked = false;
      if (actor.userData.label) actor.userData.label.visible = true;
    }
    for (const data of TAX_REPLACEMENT_GARRISON) {
      const actor = this.lifeAgent(data.id);
      if (!actor) continue;
      if (actor.userData.label) {
        this.engine.scene.remove(actor.userData.label);
        const labelIndex = this.engine.labels.indexOf(actor.userData.label);
        if (labelIndex >= 0) this.engine.labels.splice(labelIndex, 1);
      }
      this.engine.scene.remove(actor);
      const index = this.engine.livingWorld.agents.indexOf(actor);
      if (index >= 0) this.engine.livingWorld.agents.splice(index, 1);
    }
  }

  diagnostics() {
    return {
      assassinationScene: this.assassination ? Math.round(this.assassination.elapsed * 100) / 100 : null,
      shockTimer: Math.round(this.shockTimer * 10) / 10,
      standoff: this.standoff ? {
        remaining: Math.round(this.standoff.remaining * 10) / 10,
        spawned: [...this.standoff.spawned],
        alive: this.questActors.filter((actor) => actor.userData.alive !== false).length,
      } : null,
      arrestSquad: this.arrestSquad.length,
      replacements: TAX_REPLACEMENT_GARRISON.filter((data) => this.lifeAgent(data.id)).length,
    };
  }
}
