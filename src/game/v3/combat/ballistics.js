import * as THREE from '../vendor/three.module.js';
import { ARSENAL } from './arsenal.js';

function randSpread(amount) {
  return (Math.random() - 0.5) * amount;
}

function makeTracer(scene, from, to, color = 0xffd28a) {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
  const line = new THREE.Line(geo, mat);
  line.userData.life = 0.07;
  scene.add(line);
  return line;
}

function makeImpact(scene, pos, color = 0xffd28a) {
  const sparks = [];
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 6, 6),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.85 })
    );
    p.position.copy(pos);
    p.userData.life = 0.22 + Math.random() * 0.18;
    p.userData.vel = new THREE.Vector3(randSpread(2.5), Math.random() * 1.6, randSpread(2.5));
    scene.add(p);
    sparks.push(p);
  }
  return sparks;
}

export class BallisticSystem {
  constructor(scene) {
    this.scene = scene;
    this.tracers = [];
    this.sparks = [];
  }

  fire({ weaponId, camera, monsters, aimMode = false, skillLevel = 5, damageScale = 1, spreadMul = 1 }) {
    const weapon = ARSENAL[weaponId];
    if (!weapon || !weapon.ammoType) return { ok: false, reason: 'not_firearm' };

    const pellets = weapon.pellets || 1;
    const results = [];
    for (let i = 0; i < pellets; i++) {
      results.push(this.fireSingle({ weapon, camera, monsters, aimMode, skillLevel, damageScale, spreadMul, pelletIndex: i }));
    }
    return { ok: true, results };
  }

  fireSingle({ weapon, camera, monsters, aimMode, skillLevel, damageScale, spreadMul }) {
    const from = camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const spread = weapon.spread * spreadMul * (aimMode ? 0.35 : 1.0) * Math.max(0.35, 1.1 - skillLevel / 80);
    dir.x += randSpread(spread);
    dir.y += randSpread(spread * 0.6);
    dir.z += randSpread(spread);
    dir.normalize();

    const maxRange = weapon.range || 60;
    const velocity = weapon.muzzleVelocity || 80;
    const gravity = weapon.gravity || 0.03;
    let best = null;
    let bestD = Infinity;
    let bestPoint = from.clone().addScaledVector(dir, maxRange);

    for (const obj of monsters) {
      const m = obj.userData;
      if (!m.alive) continue;
      const target = obj.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const to = target.clone().sub(from);
      const along = to.dot(dir);
      if (along < 0 || along > maxRange) continue;
      const travelTime = along / velocity;
      const drop = gravity * travelTime * travelTime * 50;
      const ballisticPoint = from.clone().addScaledVector(dir, along);
      ballisticPoint.y -= drop;
      const miss = ballisticPoint.distanceTo(target);
      const hitRadius = m.archetype === 'brute' ? 0.95 : 0.72;
      if (miss < hitRadius && along < bestD) {
        best = obj;
        bestD = along;
        bestPoint = ballisticPoint;
      }
    }

    this.tracers.push(makeTracer(this.scene, from, bestPoint, weapon.ammoType === 'phaseCell' ? 0x8a78ff : 0xffd28a));
    if (best) {
      const dmg = Math.round(weapon.damage * damageScale * (weapon.pellets ? 0.7 : 1));
      if (best.userData.conditionalHostile) best.userData.provoked = true;
      best.userData.hp -= dmg;
      if (best.userData.hp <= 0) {
        best.userData.alive = false;
        best.scale.y = 0.28;
      }
      this.sparks.push(...makeImpact(this.scene, bestPoint, weapon.ammoType === 'phaseCell' ? 0x8a78ff : 0xffd28a));
      return { hit: true, target: best, damage: dmg, point: bestPoint };
    }
    return { hit: false, point: bestPoint };
  }

  update(dt) {
    for (const t of this.tracers) {
      t.userData.life -= dt;
      t.material.opacity = Math.max(0, t.userData.life / 0.07);
      if (t.userData.life <= 0) { this.scene.remove(t); t.dead = true; }
    }
    this.tracers = this.tracers.filter(t => !t.dead);

    for (const p of this.sparks) {
      p.userData.life -= dt;
      p.position.addScaledVector(p.userData.vel, dt);
      p.scale.multiplyScalar(0.98);
      if (p.userData.life <= 0) { this.scene.remove(p); p.dead = true; }
    }
    this.sparks = this.sparks.filter(p => !p.dead);
  }
}
