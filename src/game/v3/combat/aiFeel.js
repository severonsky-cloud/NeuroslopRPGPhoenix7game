import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { heightAt } from '../world/terrain.js';
import { makeMat } from '../world/props.js';

function hpRatio(obj) {
  const u = obj?.userData || {};
  const max = u.hpMax || u.maxHp || 80;
  return Math.max(0, Math.min(1, (u.hp ?? max) / max));
}

function forwardOf(obj) {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(obj.quaternion).setY(0).normalize();
}

function sideOf(obj) {
  return new THREE.Vector3(1, 0, 0).applyQuaternion(obj.quaternion).setY(0).normalize();
}

export class AIFeelSystem {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.scene;
    this.alerts = [];
    this.lootCaches = [];
    this.deadSeen = new WeakSet();
    this.time = 0;
  }

  build() {
    for (const obj of this.allActors()) this.initActor(obj);
  }

  allActors() {
    return [...(this.engine.livingWorld?.agents || []), ...(this.engine.monsters || [])];
  }

  initActor(obj) {
    const u = obj.userData || {};
    if (u.aiFeelReady) return;
    u.aiFeelReady = true;
    u.hpMax = u.hpMax || u.hp || (u.type === 'lifeAgent' ? 55 : 80);
    u.aiState = u.aiState || 'routine';
    u.guardT = 0;
    u.dodgeT = 0;
    u.retreatT = 0;
    u.heardT = 0;
    u.morale = u.morale ?? (u.faction === 'empire' ? 0.72 : u.faction === 'zhuzher' ? 0.62 : 0.55);
  }

  notifyNoise(pos, radius = 46, tag = 'noise') {
    this.alerts.unshift({ pos: pos.clone ? pos.clone() : new THREE.Vector3(pos.x, pos.y || 0, pos.z), radius, tag, t: 6 });
    if (this.alerts.length > 8) this.alerts.pop();
    for (const obj of this.allActors()) {
      const d = obj.position.distanceTo(pos);
      if (d < radius) {
        const u = obj.userData;
        u.heardT = 5;
        if (u.faction === 'empire' && obj.position.distanceTo(new THREE.Vector3(142, 0, 176)) < 95) {
          u.aiState = 'fort_alert';
          this.engine.hud?.setObjective?.('Форт Заря поднял тревогу. Патрули реагируют на шум.');
        } else if (u.aiState === 'routine') {
          u.aiState = 'investigate';
        }
      }
    }
  }

  update(dt) {
    this.time += dt;
    for (const a of this.alerts) a.t -= dt;
    this.alerts = this.alerts.filter(a => a.t > 0);

    for (const obj of this.allActors()) {
      this.initActor(obj);
      const u = obj.userData;
      if (u.alive === false) {
        this.ensureLootCache(obj);
        continue;
      }
      u.guardT = Math.max(0, u.guardT - dt);
      u.dodgeT = Math.max(0, u.dodgeT - dt);
      u.retreatT = Math.max(0, u.retreatT - dt);
      u.heardT = Math.max(0, u.heardT - dt);

      if (hpRatio(obj) < 0.28 && u.aiState !== 'retreat') {
        u.aiState = 'retreat';
        u.retreatT = 4 + Math.random() * 3;
      }
      if (u.aiState === 'retreat') this.retreatFromPlayer(obj, dt);
      else if (u.aiState === 'investigate' || u.aiState === 'fort_alert') this.investigateLatest(obj, dt);
      this.combatPose(obj, dt);
    }
    this.updateLootVisuals(dt);
  }

  combatPose(obj, dt) {
    const u = obj.userData;
    const d = obj.position.distanceTo(this.engine.rig.position);
    const hostileToPlayer = ['bandits', 'zhuzher'].includes(u.faction) || u.type === 'monster';
    if (!hostileToPlayer || d > 16) return;

    if (u.dodgeT <= 0 && Math.random() < dt * 0.18) {
      u.dodgeT = 0.55;
      const side = sideOf(obj).multiplyScalar(Math.random() < 0.5 ? 1 : -1);
      obj.position.addScaledVector(side, 1.2 + Math.random() * 0.9);
      obj.position.y = heightAt(obj.position.x, obj.position.z);
      u.x = obj.position.x; u.z = obj.position.z;
    }
    if (u.guardT <= 0 && Math.random() < dt * 0.12) {
      u.guardT = 0.8;
    }
    const lean = u.guardT > 0 ? -0.08 : u.dodgeT > 0 ? 0.12 : 0;
    obj.rotation.x = THREE.MathUtils.damp(obj.rotation.x, lean, 8, dt);
  }

  retreatFromPlayer(obj, dt) {
    const away = obj.position.clone().sub(this.engine.rig.position).setY(0);
    if (away.lengthSq() < 0.1) away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    away.normalize();
    obj.position.addScaledVector(away, dt * 2.2);
    obj.position.y = heightAt(obj.position.x, obj.position.z);
    obj.lookAt(this.engine.rig.position.x, heightAt(this.engine.rig.position.x, this.engine.rig.position.z) + 1, this.engine.rig.position.z);
    obj.userData.x = obj.position.x;
    obj.userData.z = obj.position.z;
    if (obj.userData.retreatT <= 0) obj.userData.aiState = 'investigate';
  }

  investigateLatest(obj, dt) {
    const alert = this.alerts[0];
    if (!alert) return;
    const to = alert.pos.clone().sub(obj.position).setY(0);
    if (to.length() < 4) return;
    to.normalize();
    obj.position.addScaledVector(to, dt * (obj.userData.aiState === 'fort_alert' ? 1.6 : 1.0));
    obj.position.y = heightAt(obj.position.x, obj.position.z);
    obj.userData.x = obj.position.x;
    obj.userData.z = obj.position.z;
    obj.lookAt(alert.pos.x, heightAt(alert.pos.x, alert.pos.z) + 1, alert.pos.z);
  }

  ensureLootCache(obj) {
    if (this.deadSeen.has(obj)) return;
    this.deadSeen.add(obj);
    const pos = obj.position.clone();
    const box = new THREE.Group();
    box.name = 'loot_cache';
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.45), makeMat(0x3b2517));
    base.position.y = 0.18;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), makeMat(0xd8a64d));
    lid.position.y = 0.38;
    box.add(base, lid);
    box.position.set(pos.x, heightAt(pos.x, pos.z) + 0.05, pos.z);
    box.userData = { type: 'lootCache', opened: false, ownerName: obj.userData.name || 'enemy', table: this.lootTableFor(obj) };
    this.scene.add(box);
    this.lootCaches.push(box);
  }

  lootTableFor(obj) {
    const u = obj.userData || {};
    if (u.faction === 'zhuzher') return 'raider';
    if (u.faction === 'bandits') return 'bandit';
    if (u.faction === 'blackElementals' || u.faction === 'blueElementals' || u.archetype === 'black' || u.archetype === 'phase') return 'elemental';
    return 'road';
  }

  nearLoot(playerPos, distance = 2.2) {
    return this.lootCaches.find(c => !c.userData.opened && c.position.distanceTo(playerPos) < distance) || null;
  }

  openLoot(cache) {
    if (!cache || cache.userData.opened) return [];
    cache.userData.opened = true;
    cache.visible = false;
    const loot = this.engine.inventory.lootAmmoBundle(cache.userData.table);
    if (Math.random() < 0.35) {
      const coins = 2 + Math.floor(Math.random() * 8);
      this.engine.player.credits += coins;
      loot.push(`credits ×${coins}`);
    }
    return loot;
  }

  updateLootVisuals(dt) {
    for (const c of this.lootCaches) {
      if (!c.visible) continue;
      c.rotation.y += dt * 0.3;
    }
  }
}
