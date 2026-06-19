import * as THREE from '../vendor/three.module.js';
import { NPC_WEAPON_PROFILES, loadoutForAgent, hostility, hostileToPlayer } from './npcLoadouts.js';
import { heightAt } from '../world/terrain.js';
import { makeMat } from '../world/props.js';

function dist2(a, b) {
  const dx = (a.userData.x ?? a.position.x) - (b.userData.x ?? b.position.x);
  const dz = (a.userData.z ?? a.position.z) - (b.userData.z ?? b.position.z);
  return dx * dx + dz * dz;
}

function addWeaponMesh(agentObj, profile) {
  if (!agentObj || !profile) return;
  const old = agentObj.getObjectByName('npc_weapon');
  if (old) agentObj.remove(old);
  const g = new THREE.Group();
  g.name = 'npc_weapon';
  const metal = makeMat(profile.color || 0xc8c0a8, { roughness: 0.42, metalness: 0.15 });
  const wood = makeMat(0x4a2d18);

  if (profile.kind === 'firearm') {
    const len = profile.model === 'smg' ? 0.62 : profile.model === 'nagant' ? 0.32 : profile.model === 'shotgun' ? 0.75 : 0.88;
    const body = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.09), metal);
    body.position.set(0.38, 1.25, 0.08);
    body.rotation.y = -0.42;
    g.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, len * 0.72, 7), metal);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.42 + len * 0.35, 1.25, 0.08);
    barrel.rotation.y = -0.42;
    g.add(barrel);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.08), wood);
    stock.position.set(0.02, 1.15, 0.17);
    stock.rotation.z = 0.34;
    g.add(stock);
    if (profile.model === 'smg') {
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.06), metal);
      mag.position.set(0.34, 1.04, 0.1);
      g.add(mag);
    }
  } else if (profile.model === 'club' || profile.model === 'tool') {
    const club = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.9, 7), wood);
    club.position.set(0.38, 1.18, 0.1);
    club.rotation.z = -0.75;
    g.add(club);
  } else if (profile.model === 'staff') {
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.35, 7), metal);
    staff.position.set(0.42, 1.15, 0.1);
    staff.rotation.z = -0.28;
    g.add(staff);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), makeMat(0x8a78ff, { emissive: 0x5b3dff, emissiveIntensity: 0.7 }));
    orb.position.set(0.62, 1.82, 0.1);
    g.add(orb);
  } else {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.8, 0.045), metal);
    blade.position.set(0.42, 1.35, 0.1);
    blade.rotation.z = -0.55;
    g.add(blade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.035), makeMat(0xd8a64d));
    guard.position.set(0.22, 1.02, 0.1);
    guard.rotation.z = -0.55;
    g.add(guard);
  }
  agentObj.add(g);
}

function makeTracer(scene, from, to, color) {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.72 });
  const line = new THREE.Line(geo, mat);
  line.userData.life = 0.09;
  scene.add(line);
  return line;
}

function makeSwing(scene, attacker, target, color) {
  const a = attacker.position.clone().add(new THREE.Vector3(0, 1.25, 0));
  const b = target.clone().add(new THREE.Vector3(0, 1.1, 0));
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 });
  const line = new THREE.Line(geo, mat);
  line.userData.life = 0.14;
  scene.add(line);
  return line;
}

export class ArmedWorldSystem {
  constructor(engine, audio) {
    this.engine = engine;
    this.scene = engine.scene;
    this.audio = audio;
    this.tracers = [];
    this.started = false;
    this.combatLog = [];
  }

  build() {
    const lifeAgents = this.engine.livingWorld?.agents || [];
    for (const obj of lifeAgents) {
      const u = obj.userData;
      const loadout = loadoutForAgent(u);
      const profile = NPC_WEAPON_PROFILES[loadout] || NPC_WEAPON_PROFILES.peasant_tool;
      u.weaponProfileId = loadout;
      u.weaponProfile = profile;
      u.armed = true;
      u.combatCooldown = Math.random() * 0.6;
      u.windupT = 0;
      u.target = null;
      u.combatState = 'routine';
      u.ammoNpc = profile.kind === 'firearm' ? 20 + Math.floor(Math.random() * 20) : 0;
      addWeaponMesh(obj, profile);
    }
    for (const obj of this.engine.monsters || []) {
      const u = obj.userData;
      let profile = null;
      if (u.id?.includes('zhuzher')) profile = NPC_WEAPON_PROFILES.smg_zhuzher;
      if (u.archetype === 'black') profile = NPC_WEAPON_PROFILES.black_rifle;
      if (u.archetype === 'glass' || u.archetype === 'phase') profile = NPC_WEAPON_PROFILES.elemental_gun;
      if (!profile && u.archetype === 'brute') profile = NPC_WEAPON_PROFILES.tsarbor_club;
      if (profile) {
        u.weaponProfile = profile;
        u.weaponProfileId = Object.keys(NPC_WEAPON_PROFILES).find(k => NPC_WEAPON_PROFILES[k] === profile);
        u.armed = true;
        u.combatCooldown = Math.random() * 0.8;
        u.windupT = 0;
        u.target = null;
        u.ammoNpc = profile.kind === 'firearm' ? 18 : 0;
        addWeaponMesh(obj, profile);
      }
    }
    this.started = true;
  }

  update(dt) {
    if (!this.started) this.build();
    const engine = this.engine;
    const playerPos = engine.rig.position;
    const lifeAgents = engine.livingWorld?.agents || [];
    const all = [...lifeAgents, ...(engine.monsters || []).filter(m => m.userData.alive !== false)];

    for (const obj of all) {
      const u = obj.userData;
      const profile = u.weaponProfile;
      if (!profile || u.alive === false || u.settlementCulled) continue;
      if (u.staggerT > 0) { u.staggerT -= dt; continue; }
      u.combatCooldown = Math.max(0, (u.combatCooldown || 0) - dt);
      if (u.windupT > 0) {
        u.windupT -= dt;
        obj.rotation.x = Math.sin(performance.now() * 0.03) * 0.04;
        if (u.windupT <= 0) this.releaseAttack(obj, u.windupTarget || null);
        continue;
      }

      const target = this.pickTarget(obj, all, playerPos);
      if (!target) {
        u.combatState = 'routine';
        continue;
      }
      u.combatState = 'combat';
      u.target = target;
      const targetPos = target === 'player' ? playerPos : target.position;
      obj.lookAt(targetPos.x, heightAt(targetPos.x, targetPos.z) + 1, targetPos.z);
      const d = obj.position.distanceTo(targetPos);
      if (d > (profile.kind === 'firearm' ? profile.range * 0.72 : profile.range * 0.85)) {
        this.moveToward(obj, targetPos, dt, profile.kind === 'firearm' ? 0.8 : 1.25);
      }
      if (u.combatCooldown <= 0 && d < profile.range) {
        u.windupT = profile.windup;
        u.windupTarget = target;
        u.combatCooldown = profile.cooldown + Math.random() * 0.45;
        this.audio?.aggro();
      }
    }

    for (const t of this.tracers) {
      t.userData.life -= dt;
      t.material.opacity = Math.max(0, t.userData.life / 0.09);
      if (t.userData.life <= 0) { this.scene.remove(t); t.dead = true; }
    }
    this.tracers = this.tracers.filter(t => !t.dead);
  }

  pickTarget(obj, all, playerPos) {
    const u = obj.userData;
    const profile = u.weaponProfile;
    const dp = obj.position.distanceTo(playerPos);
    if (hostileToPlayer(u) && dp < Math.min(profile.range, 28)) return 'player';

    let best = null;
    let bestD = Infinity;
    for (const other of all) {
      if (other === obj || other.userData.alive === false || other.userData.settlementCulled) continue;
      if (!hostility(u, other.userData)) continue;
      const d = dist2(obj, other);
      if (d < bestD && d < 34 * 34) { best = other; bestD = d; }
    }
    return best;
  }

  moveToward(obj, targetPos, dt, speed) {
    const u = obj.userData;
    const dx = targetPos.x - obj.position.x;
    const dz = targetPos.z - obj.position.z;
    const d = Math.hypot(dx, dz) || 1;
    u.x = (u.x ?? obj.position.x) + dx / d * dt * speed;
    u.z = (u.z ?? obj.position.z) + dz / d * dt * speed;
    obj.position.set(u.x, heightAt(u.x, u.z), u.z);
  }

  releaseAttack(obj, target) {
    const u = obj.userData;
    const profile = u.weaponProfile;
    if (!target || !profile) return;
    if (profile.kind === 'firearm') this.fire(obj, target, profile);
    else if (profile.kind === 'phase') this.phase(obj, target, profile);
    else this.melee(obj, target, profile);
    obj.rotation.x = 0;
  }

  targetPosition(target) {
    if (target === 'player') return this.engine.rig.position.clone().add(new THREE.Vector3(0, 1.1, 0));
    return target.position.clone().add(new THREE.Vector3(0, 1.0, 0));
  }

  dealDamage(target, dmg, kind) {
    if (target === 'player') {
      const engine = this.engine;
      const armor = engine.inventory?.armorValue?.() || 0;
      const final = Math.max(1, Math.round(dmg * (1 - Math.min(0.45, armor * 0.025))));
      engine.player.hp = Math.max(0, engine.player.hp - final);
      engine.hud.hitMarker?.(`-${final}`);
      engine.hud.setObjective(`Попадание: ${kind} · HP ${engine.player.hp}/${engine.player.hpMax}`);
      this.audio?.hit(armor ? 'armor' : 'body');
      return;
    }
    const u = target.userData;
    u.hp = (u.hp ?? 40) - dmg;
    u.staggerT = Math.max(u.staggerT || 0, 0.2);
    if (u.hp <= 0) {
      u.alive = false;
      target.scale.y = 0.28;
    }
  }

  fire(obj, target, profile) {
    const from = obj.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    const to = this.targetPosition(target);
    const d = from.distanceTo(to);
    const spread = 0.35 + d * 0.018;
    to.x += (Math.random() - 0.5) * spread;
    to.y += (Math.random() - 0.5) * spread * 0.55;
    to.z += (Math.random() - 0.5) * spread;
    const color = profile.phase ? 0x8a78ff : 0xffd28a;
    for (let i = 0; i < (profile.burst || 1); i++) {
      setTimeout(() => {
        this.tracers.push(makeTracer(this.scene, from, to, color));
        this.audio?.fire(profile.sound || 'rifle');
      }, i * 60);
    }
    const hitChance = Math.max(0.18, Math.min(0.78, 0.72 - d * 0.015));
    if (Math.random() < hitChance) this.dealDamage(target, profile.damage, profile.name);
    else if (Math.random() < 0.08) this.audio?.jam();
  }

  melee(obj, target, profile) {
    const to = this.targetPosition(target);
    this.tracers.push(makeSwing(this.scene, obj, to, profile.color || 0xffd28a));
    this.audio?.melee(profile.sound || 'blade');
    const d = obj.position.distanceTo(to);
    if (d < profile.range + 0.5) this.dealDamage(target, profile.damage, profile.name);
  }

  phase(obj, target, profile) {
    const to = this.targetPosition(target);
    this.tracers.push(makeSwing(this.scene, obj, to, 0x8a78ff));
    this.audio?.phase();
    const d = obj.position.distanceTo(to);
    if (d < profile.range + 1.0) this.dealDamage(target, profile.damage, profile.name);
  }
}
