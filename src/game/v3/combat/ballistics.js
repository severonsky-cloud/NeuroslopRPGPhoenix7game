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

function makeImpact(scene, pos, color = 0xffd28a, count = 8, power = 1) {
  const sparks = [];
  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 * power, 6, 6),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.85 })
    );
    p.position.copy(pos);
    p.userData.life = 0.22 + Math.random() * 0.18;
    p.userData.vel = new THREE.Vector3(randSpread(2.5 * power), Math.random() * 1.6 * power, randSpread(2.5 * power));
    scene.add(p);
    sparks.push(p);
  }
  return sparks;
}

function weaponBlastRadius(weapon) {
  if (weapon.extra?.blastRadius) return weapon.extra.blastRadius;
  if (weapon.archetype === 'atLauncher') return weapon.id === 'panzerfaust30' ? 4.8 : 4.2;
  return 0;
}

function isHeavyKinetic(weapon) {
  return weapon.archetype === 'atRifle' || weapon.recoil >= 0.7 || weapon.damage >= 75;
}

function markDead(target) {
  target.userData.alive = false;
  target.scale.y = 0.28;
}

function stylizedBreakup(scene, target, hitPoint, power = 1.0, color = 0xffb05f) {
  if (!target?.userData || target.userData.brokenByHeavyHit) return [];
  target.userData.brokenByHeavyHit = true;
  target.visible = false;
  const chunks = [];
  const root = target.position.clone().add(new THREE.Vector3(0, 1.0, 0));
  const direction = root.clone().sub(hitPoint).normalize();
  if (!Number.isFinite(direction.x)) direction.set(0, 0.4, 1).normalize();
  for (let i = 0; i < 9; i += 1) {
    const size = 0.14 + Math.random() * 0.28;
    const chunk = new THREE.Mesh(
      new THREE.BoxGeometry(size * (0.7 + Math.random() * 0.9), size, size * (0.6 + Math.random() * 0.8)),
      new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x2a241d : color, roughness: 0.78, metalness: i % 4 === 0 ? 0.12 : 0 })
    );
    chunk.position.copy(root).add(new THREE.Vector3(randSpread(0.7), randSpread(0.7), randSpread(0.7)));
    chunk.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    chunk.userData.life = 1.05 + Math.random() * 0.55;
    chunk.userData.vel = new THREE.Vector3(
      randSpread(3.4 * power) + direction.x * 1.7 * power,
      1.2 + Math.random() * 3.0 * power,
      randSpread(3.4 * power) + direction.z * 1.7 * power,
    );
    scene.add(chunk);
    chunks.push(chunk);
  }
  return chunks;
}

function makeExplosion(scene, pos, radius = 3.2, color = 0xffa34f) {
  const out = [];
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(0.35, radius * 0.22), 12, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.62, depthWrite: false })
  );
  flash.position.copy(pos).add(new THREE.Vector3(0, 0.75, 0));
  flash.userData.life = 0.16;
  flash.userData.expand = 1.08 + radius * 0.15;
  scene.add(flash);
  out.push(flash);

  const ringGeo = new THREE.RingGeometry(radius * 0.24, radius * 0.3, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos).add(new THREE.Vector3(0, 0.06, 0));
  ring.rotation.x = -Math.PI / 2;
  ring.userData.life = 0.22;
  ring.userData.expand = 1.12 + radius * 0.18;
  scene.add(ring);
  out.push(ring);

  for (let i = 0; i < 20; i += 1) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.045 + Math.random() * 0.055, 6, 6),
      new THREE.MeshStandardMaterial({ color: i % 4 === 0 ? 0x3a3127 : color, emissive: color, emissiveIntensity: i % 4 === 0 ? 0.12 : 0.7, roughness: 0.7 })
    );
    p.position.copy(pos).add(new THREE.Vector3(randSpread(0.6), Math.random() * 0.55, randSpread(0.6)));
    p.userData.life = 0.42 + Math.random() * 0.42;
    p.userData.vel = new THREE.Vector3(randSpread(radius * 1.9), Math.random() * radius * 1.4, randSpread(radius * 1.9));
    scene.add(p);
    out.push(p);
  }
  return out;
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

    const radius = weaponBlastRadius(weapon);
    let explosion = null;
    if (radius > 0 && results[0]?.point) explosion = this.applyBlast({ weapon, point: results[0].point, monsters, damageScale, directTarget: results[0].target });
    return { ok: true, results, explosion };
  }

  applyBlast({ weapon, point, monsters, damageScale = 1, directTarget = null }) {
    const radius = weaponBlastRadius(weapon);
    const color = weapon.id === 'molotovProto' ? 0xff6a1a : 0xffa34f;
    this.sparks.push(...makeExplosion(this.scene, point, radius, color));
    const splash = [];
    for (const obj of monsters || []) {
      const m = obj.userData;
      if (!m?.alive) continue;
      const center = obj.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const d = center.distanceTo(point);
      if (d > radius) continue;
      const falloff = Math.max(0.12, 1 - d / radius);
      const directMul = obj === directTarget ? 0.35 : 0.75;
      const dmg = Math.max(1, Math.round(weapon.damage * damageScale * falloff * directMul));
      m.hp -= dmg;
      if (m.conditionalHostile) m.provoked = true;
      obj.userData.staggerT = Math.max(obj.userData.staggerT || 0, 0.45 + falloff * 0.7);
      obj.rotation.z = randSpread(0.55) * falloff;
      const push = center.clone().sub(point).setY(0).normalize();
      if (Number.isFinite(push.x)) obj.position.addScaledVector(push, Math.min(1.6, falloff * 1.1));
      let broken = false;
      if (m.hp <= 0) {
        markDead(obj);
        if (weapon.archetype === 'atLauncher' || weapon.extra?.blastRadius) {
          broken = true;
          this.sparks.push(...stylizedBreakup(this.scene, obj, point, 0.8 + falloff, 0xff8f45));
        }
      }
      splash.push({ target: obj, damage: dmg, distance: d, broken });
    }
    return { point, radius, damage: weapon.damage, splash };
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
      let broken = false;
      if (best.userData.hp <= 0) {
        markDead(best);
        if (isHeavyKinetic(weapon) && weaponBlastRadius(weapon) <= 0) {
          broken = true;
          this.sparks.push(...stylizedBreakup(this.scene, best, bestPoint, 1.0 + Math.min(0.9, weapon.recoil || 0.5), 0xd2b070));
        }
      }
      this.sparks.push(...makeImpact(this.scene, bestPoint, weapon.ammoType === 'phaseCell' ? 0x8a78ff : isHeavyKinetic(weapon) ? 0xffb05f : 0xffd28a, isHeavyKinetic(weapon) ? 18 : 8, isHeavyKinetic(weapon) ? 1.55 : 1));
      return { hit: true, target: best, damage: dmg, point: bestPoint, broken, heavy: isHeavyKinetic(weapon) };
    }
    return { hit: false, point: bestPoint, heavy: isHeavyKinetic(weapon) };
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
      p.position.addScaledVector(p.userData.vel || new THREE.Vector3(), dt);
      if (p.userData.expand) p.scale.multiplyScalar(p.userData.expand);
      else p.scale.multiplyScalar(0.98);
      if (p.material?.opacity !== undefined) p.material.opacity = Math.max(0, p.userData.life / 0.28);
      if (p.userData.life <= 0) {
        this.scene.remove(p);
        p.geometry?.dispose?.();
        p.material?.dispose?.();
        p.dead = true;
      }
    }
    this.sparks = this.sparks.filter(p => !p.dead);
  }
}
