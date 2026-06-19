import * as THREE from '../vendor/three.module.js';
import { raceDefinition } from '../data/characterData.js';
import { heightAt } from '../world/terrain.js';
import { hostileToPlayer } from '../combat/npcLoadouts.js';

function aliveTargets(engine, radius) {
  return [...(engine.monsters || []), ...(engine.livingWorld?.agents || [])]
    .filter((target) => target?.userData?.alive !== false && target.visible !== false)
    .filter((target) => target.userData.type === 'monster' || hostileToPlayer(target.userData))
    .filter((target) => target.position.distanceTo(engine.rig.position) <= radius);
}

function pushFromPlayer(engine, target, distance) {
  const delta = target.position.clone().sub(engine.rig.position).setY(0);
  if (delta.lengthSq() < 0.01) delta.set(1, 0, 0);
  delta.normalize().multiplyScalar(distance);
  target.position.add(delta);
  target.userData.x = target.position.x;
  target.userData.z = target.position.z;
  target.position.y = heightAt(target.position.x, target.position.z);
}

function forward(engine) {
  return new THREE.Vector3(0, 0, -1)
    .applyQuaternion(engine.camera.getWorldQuaternion(new THREE.Quaternion()))
    .setY(0)
    .normalize();
}

export class RacialAbilitySystem {
  constructor(engine) {
    this.engine = engine;
    this.cooldown = 0;
    this.activeT = 0;
    this.lastAbility = null;
    this.hud = null;
    this.ensureHud();
  }

  race() {
    return raceDefinition(this.engine.player.race);
  }

  ensureHud() {
    let node = document.getElementById('phxRacialAbility');
    if (!node) {
      node = document.createElement('div');
      node.id = 'phxRacialAbility';
      node.style.cssText = 'position:fixed;right:18px;bottom:128px;z-index:14;pointer-events:none;min-width:235px;padding:9px 11px;background:rgba(9,7,5,.7);border:1px solid rgba(216,166,77,.45);color:#f3dca8;font:700 13px system-ui;text-shadow:0 2px 8px #000;';
      document.body.appendChild(node);
    }
    this.hud = node;
  }

  resetRuntime() {
    const player = this.engine.player;
    const race = this.race();
    const runtime = player.characterRuntime || {};
    runtime.moveSpeed = race.stats.moveSpeed;
    runtime.staminaRegen = race.id === 'blue' ? 1.3 : race.id === 'juniorReptiloid' ? 1.45 : 1;
    runtime.phaseRegen = race.id === 'deimur' ? 1.25 : race.id === 'black' ? 1.18 : 1;
    runtime.meleeDamage = race.id === 'red' ? 1.18 : 1;
    runtime.phaseDamage = ['deimur', 'black'].includes(race.id) ? 1.15 : 1;
    runtime.firearmSpread = race.id === 'human' ? 0.9 : 1;
    runtime.reloadDuration = race.id === 'human' ? 0.92 : 1;
    runtime.incomingDamage = race.id === 'seniorReptiloid' ? 0.86 : 1;
    runtime.nullVeil = false;
    runtime.rooted = false;
    runtime.evade = false;
    runtime.heatResistance = race.id === 'red' ? 0.55 : 1;
    runtime.coldResistance = race.id === 'blue' ? 0.55 : 1;
    runtime.anomalySense = race.id === 'deimur' ? 46 : race.id === 'black' ? 54 : 0;

    if (this.activeT > 0) {
      if (race.id === 'human') {
        runtime.firearmSpread = 0.52;
        runtime.reloadDuration = 0.62;
      } else if (race.id === 'deimur') {
        runtime.phaseDamage = 1.6;
        runtime.phaseRegen = 1.8;
      } else if (race.id === 'red') {
        runtime.meleeDamage = 1.52;
      } else if (race.id === 'black') {
        runtime.nullVeil = true;
        runtime.incomingDamage = 0.55;
      } else if (race.id === 'juniorReptiloid') {
        runtime.evade = true;
        runtime.moveSpeed *= 1.18;
      } else if (race.id === 'tsarbor') {
        runtime.rooted = true;
        runtime.incomingDamage = 0.42;
      }
    }
    player.characterRuntime = runtime;
  }

  spend(ability) {
    const player = this.engine.player;
    const field = ability.resource === 'phase' ? 'ph' : 'st';
    if (player[field] < ability.cost) return false;
    player[field] -= ability.cost;
    return true;
  }

  activate() {
    if (this.cooldown > 0) {
      this.engine.hud.setObjective(`Q ещё восстанавливается: ${this.cooldown.toFixed(1)} сек.`);
      return false;
    }
    const race = this.race();
    const ability = race.ability;
    if (!this.spend(ability)) {
      this.engine.hud.setObjective(`Не хватает ${ability.resource === 'phase' ? 'фазы' : 'выносливости'} для ${ability.name}.`);
      return false;
    }

    this.cooldown = ability.cooldown;
    this.activeT = ability.duration;
    this.lastAbility = ability.id;
    const engine = this.engine;
    const player = engine.player;

    if (race.id === 'red') {
      for (const target of aliveTargets(engine, 5.5)) {
        if (target.userData.conditionalHostile) target.userData.provoked = true;
        target.userData.hp = (target.userData.hp ?? 45) - 24;
        target.userData.staggerT = Math.max(target.userData.staggerT || 0, 1.2);
        if (target.userData.hp <= 0) {
          target.userData.alive = false;
          target.scale.y = 0.28;
        }
        pushFromPlayer(engine, target, 1.4);
      }
    } else if (race.id === 'blue') {
      const slowedTargets = new Set(aliveTargets(engine, 5.5));
      const direction = forward(engine);
      engine.rig.position.addScaledVector(direction, 6.2);
      engine.rig.position.y = heightAt(engine.rig.position.x, engine.rig.position.z);
      for (const target of aliveTargets(engine, 5.5)) slowedTargets.add(target);
      for (const target of slowedTargets) {
        if (target.userData.conditionalHostile) target.userData.provoked = true;
        target.userData.slowT = Math.max(target.userData.slowT || 0, 3.5);
      }
    } else if (race.id === 'seniorReptiloid') {
      for (const target of aliveTargets(engine, 6.5)) {
        if (target.userData.conditionalHostile) target.userData.provoked = true;
        target.userData.staggerT = Math.max(target.userData.staggerT || 0, 2.2);
        target.userData.fearT = Math.max(target.userData.fearT || 0, 4);
        target.userData.aiState = 'retreat';
        pushFromPlayer(engine, target, 0.8);
      }
    } else if (race.id === 'juniorReptiloid') {
      const direction = forward(engine);
      engine.rig.position.addScaledVector(direction, 8.2);
      engine.rig.position.y = heightAt(engine.rig.position.x, engine.rig.position.z);
    }

    player.characterRuntime = player.characterRuntime || {};
    this.resetRuntime();
    engine.playerBody?.setPoseMode?.('racial');
    engine.hud.setObjective(`Q — ${ability.name}: ${ability.description}`);
    setTimeout(() => engine.playerBody?.setPoseMode?.('idle'), Math.min(900, ability.duration * 1000));
    return true;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.activeT = Math.max(0, this.activeT - dt);
    this.resetRuntime();

    const player = this.engine.player;
    const race = this.race();
    const speed = Math.hypot(player.motion?.vx || 0, player.motion?.vz || 0);
    if (race.id === 'tsarbor' && speed < 0.18 && !this.engine.paused) {
      const regen = this.activeT > 0 ? 6.2 : 1.5;
      player.hp = Math.min(player.hpMax, player.hp + dt * regen);
    }
    if (player.characterRuntime.evade && Math.random() < dt * 0.45) {
      player.characterRuntime.incomingDamage *= 0.4;
    }

    for (const target of [...(this.engine.monsters || []), ...(this.engine.livingWorld?.agents || [])]) {
      if (target.userData.slowT > 0) target.userData.slowT = Math.max(0, target.userData.slowT - dt);
      if (target.userData.fearT > 0) target.userData.fearT = Math.max(0, target.userData.fearT - dt);
    }
    const ability = race.ability;
    const state = this.cooldown > 0 ? `${this.cooldown.toFixed(1)} сек.` : 'ГОТОВО';
    const active = this.activeT > 0 ? ` · активно ${this.activeT.toFixed(1)}` : '';
    let sense = '';
    if (player.characterRuntime.anomalySense > 0) {
      const anomaly = (this.engine.monsters || [])
        .filter((target) => ['phase', 'glass', 'black'].includes(target.userData.archetype) && target.userData.alive !== false)
        .map((target) => ({ target, distance: target.position.distanceTo(this.engine.rig.position) }))
        .filter((entry) => entry.distance <= player.characterRuntime.anomalySense)
        .sort((a, b) => a.distance - b.distance)[0];
      if (anomaly) sense = `<br><span style="color:#9ee8ff">аномальный отклик: ${Math.round(anomaly.distance)} м</span>`;
      else if (race.id === 'black') sense = '<br><span style="color:#b778ff">антиматериальный шёпот: тихо</span>';
    }
    this.hud.innerHTML = `<b>Q — ${ability.name}</b><br><span style="color:${this.cooldown > 0 ? '#b6a78b' : '#ffd18b'}">${state}${active}</span> · ${ability.resource === 'phase' ? 'PH' : 'ST'} ${ability.cost}${sense}`;
  }

  diagnostics() {
    return {
      race: this.race().id,
      ability: this.race().ability.id,
      cooldown: this.cooldown,
      activeT: this.activeT,
      runtime: { ...this.engine.player.characterRuntime },
    };
  }
}
