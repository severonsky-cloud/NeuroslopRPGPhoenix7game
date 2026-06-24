import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
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
  if (weapon.archetype === 'atLauncher') return weapon.id === 'panzerfaust30' ? 5.2 : 4.4;
  return 0;
}

function isHeavyKinetic(weapon) {
  return weapon.archetype === 'atRifle' || weapon.recoil >= 0.7 || weapon.damage >= 75;
}

function isVehicleTarget(target) {
  const u = target?.userData;
  return Boolean(u?.vehicle || u?.vehicleArmor || String(u?.archetype || '').includes('Vehicle'));
}

function isAntiVehicleWeapon(weapon) {
  return weapon.archetype === 'atLauncher' || weapon.archetype === 'atRifle' || weapon.archetype === 'thrownExplosive' || Boolean(weapon.extra?.blastRadius);
}

function vehicleDamageScale(weapon, target) {
  const armor = target?.userData?.vehicleArmor || target?.userData?.armor || 0;
  if (!isAntiVehicleWeapon(weapon)) return 0;
  let scale = 1;
  if (weapon.archetype === 'atLauncher') scale = 1.24;
  else if (weapon.archetype === 'atRifle') scale = 0.72;
  else if (weapon.id === 'mk2GrenadeProto') scale = 0.42;
  else if (weapon.id === 'molotovProto') scale = target?.userData?.explosiveDeath ? 0.58 : 0.22;
  scale *= Math.max(0.28, 1 - armor * 0.032);
  return scale;
}

function markDead(target) {
  target.userData.alive = false;
  target.scale.y = target.userData?.vehicle ? 0.72 : 0.28;
}

function stylizedBreakup(scene, target, hitPoint, power = 1.0, color = 0xffb05f) {
  if (!target?.userData || target.userData.brokenByHeavyHit) return [];
  target.userData.brokenByHeavyHit = true;
  target.visible = false;
  const chunks = [];
  const vehicle = isVehicleTarget(target);
  const root = target.position.clone().add(new THREE.Vector3(0, vehicle ? 0.9 : 1.0, 0));
  const direction = root.clone().sub(hitPoint).normalize();
  if (!Number.isFinite(direction.x)) direction.set(0, 0.4, 1).normalize();
  const count = vehicle ? 16 : 9;
  for (let i = 0; i < count; i += 1) {
    const size = (vehicle ? 0.24 : 0.14) + Math.random() * (vehicle ? 0.46 : 0.28);
    const chunk = new THREE.Mesh(
      new THREE.BoxGeometry(size * (0.7 + Math.random() * 0.9), size, size * (0.6 + Math.random() * 0.8)),
      new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x2a241d : color, roughness: 0.78, metalness: vehicle || i % 4 === 0 ? 0.24 : 0 })
    );
    chunk.position.copy(root).add(new THREE.Vector3(randSpread(vehicle ? 1.3 : 0.7), randSpread(vehicle ? 0.9 : 0.7), randSpread(vehicle ? 1.1 : 0.7)));
    chunk.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    chunk.userData.life = (vehicle ? 1.55 : 1.05) + Math.random() * 0.65;
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

  for (let i = 0; i < 24; i += 1) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.045 + Math.random() * 0.065, 6, 6),
      new THREE.MeshStandardMaterial({ color: i % 4 === 0 ? 0x3a3127 : color, emissive: color, emissiveIntensity: i % 4 === 0 ? 0.12 : 0.7, roughness: 0.7 })
    );
    p.position.copy(pos).add(new THREE.Vector3(randSpread(0.7), Math.random() * 0.55, randSpread(0.7)));
    p.userData.life = 0.42 + Math.random() * 0.42;
    p.userData.vel = new THREE.Vector3(randSpread(radius * 1.9), Math.random() * radius * 1.4, randSpread(radius * 1.9));
    scene.add(p);
    out.push(p);
  }
  return out;
}

function closestPointOnSegment(a, b, p) {
  const ab = b.clone().sub(a);
  const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / Math.max(0.0001, ab.lengthSq()), 0, 1);
  return a.clone().addScaledVector(ab, t);
}

function makeRocketMesh(weapon) {
  const root = new THREE.Group();
  root.name = `projectile_${weapon.id}`;
  const bodyMat = new THREE.MeshStandardMaterial({ color: weapon.id === 'panzerfaust30' ? 0x6f5b35 : 0x4e4a3d, roughness: 0.62, metalness: 0.25 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0x2b261d, roughness: 0.68, metalness: 0.18 });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a34, transparent: true, opacity: 0.8, depthWrite: false });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, weapon.id === 'panzerfaust30' ? 0.72 : 0.58, 10), bodyMat);
  body.rotation.x = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(weapon.id === 'panzerfaust30' ? 0.15 : 0.1, 0.28, 10), noseMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -0.43;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 9), flameMat);
  flame.rotation.x = Math.PI / 2;
  flame.position.z = 0.42;
  const light = new THREE.PointLight(0xff7a2f, 1.4, 5.5);
  light.position.z = 0.34;
  root.add(body, nose, flame, light);
  root.userData.flame = flame;
  root.userData.light = light;
  return root;
}

function aimDirection(camera, weapon, aimMode, skillLevel, spreadMul) {
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const spread = (weapon.spread || 0.02) * spreadMul * (aimMode ? 0.35 : 1.0) * Math.max(0.35, 1.1 - skillLevel / 80);
  dir.x += randSpread(spread);
  dir.y += randSpread(spread * 0.6);
  dir.z += randSpread(spread);
  return dir.normalize();
}

export class BallisticSystem {
  constructor(scene) {
    this.scene = scene;
    this.tracers = [];
    this.sparks = [];
    this.projectiles = [];
    this.events = [];
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  fire({ weaponId, camera, monsters, aimMode = false, skillLevel = 5, damageScale = 1, spreadMul = 1 }) {
    const weapon = ARSENAL[weaponId];
    if (!weapon || !weapon.ammoType) return { ok: false, reason: 'not_firearm' };
    if (weapon.archetype === 'atLauncher') return this.launchRocket({ weapon, camera, monsters, aimMode, skillLevel, damageScale, spreadMul });

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

  launchRocket({ weapon, camera, monsters, aimMode, skillLevel, damageScale, spreadMul }) {
    const from = camera.getWorldPosition(new THREE.Vector3());
    const dir = aimDirection(camera, weapon, aimMode, skillLevel, spreadMul);
    const start = from.clone().addScaledVector(dir, 1.35).add(new THREE.Vector3(0, -0.08, 0));
    const mesh = makeRocketMesh(weapon);
    mesh.position.copy(start);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir.clone().normalize());
    this.scene.add(mesh);
    const speed = weapon.id === 'panzerfaust30' ? 24 : 32;
    this.projectiles.push({
      mesh,
      weapon,
      monsters,
      damageScale,
      pos: start,
      last: start.clone(),
      vel: dir.multiplyScalar(speed),
      travelled: 0,
      life: weapon.id === 'panzerfaust30' ? 2.2 : 3.4,
      radius: weapon.id === 'panzerfaust30' ? 0.62 : 0.52,
    });
    this.events.push({ type: 'rocketLaunch', weaponId: weapon.id, point: start.clone() });
    return { ok: true, pendingProjectile: true, results: [], rocket: true, point: start };
  }

  directDamage({ weapon, target, point, damageScale = 1 }) {
    if (!target?.userData?.alive) return null;
    const scale = isVehicleTarget(target) ? vehicleDamageScale(weapon, target) : 1;
    if (isVehicleTarget(target) && scale <= 0) {
      this.sparks.push(...makeImpact(this.scene, point, 0xc8c0a8, 12, 1.25));
      return { hit: true, target, damage: 0, point, armorBlocked: true };
    }
    const dmg = Math.max(1, Math.round(weapon.damage * damageScale * scale));
    target.userData.hp -= dmg;
    if (target.userData.conditionalHostile) target.userData.provoked = true;
    target.userData.staggerT = Math.max(target.userData.staggerT || 0, isVehicleTarget(target) ? 0.36 : 0.55);
    let broken = false;
    if (target.userData.hp <= 0) {
      markDead(target);
      if (weapon.archetype === 'atLauncher' || weapon.archetype === 'atRifle' || isVehicleTarget(target)) {
        broken = true;
        this.sparks.push(...stylizedBreakup(this.scene, target, point, 1.25, isVehicleTarget(target) ? 0xa08a70 : 0xd2b070));
      }
    }
    this.sparks.push(...makeImpact(this.scene, point, isVehicleTarget(target) ? 0xffb05f : 0xffd28a, isVehicleTarget(target) ? 22 : 12, isVehicleTarget(target) ? 1.8 : 1.2));
    return { hit: true, target, damage: dmg, point, broken, vehicleHit: isVehicleTarget(target), directPierce: true };
  }

  applyBlast({ weapon, point, monsters, damageScale = 1, directTarget = null }) {
    const radius = weaponBlastRadius(weapon);
    const color = weapon.id === 'molotovProto' ? 0xff6a1a : 0xffa34f;
    this.sparks.push(...makeExplosion(this.scene, point, radius, color));
    const splash = [];
    for (const obj of monsters || []) {
      const m = obj.userData;
      if (!m?.alive) continue;
      const center = obj.position.clone().add(new THREE.Vector3(0, m.vehicle ? 1.25 : 1.0, 0));
      const d = center.distanceTo(point);
      if (d > radius) continue;
      const falloff = Math.max(0.12, 1 - d / radius);
      const directMul = obj === directTarget ? 0.16 : 0.78;
      const targetScale = isVehicleTarget(obj) ? vehicleDamageScale(weapon, obj) : 1;
      if (isVehicleTarget(obj) && targetScale <= 0) {
        this.sparks.push(...makeImpact(this.scene, center, 0xc8c0a8, 10, 1.25));
        splash.push({ target: obj, damage: 0, distance: d, armorBlocked: true });
        continue;
      }
      const dmg = Math.max(1, Math.round(weapon.damage * damageScale * falloff * directMul * targetScale));
      m.hp -= dmg;
      if (m.conditionalHostile) m.provoked = true;
      obj.userData.staggerT = Math.max(obj.userData.staggerT || 0, 0.45 + falloff * 0.7);
      if (!m.vehicle) obj.rotation.z = randSpread(0.55) * falloff;
      const push = center.clone().sub(point).setY(0).normalize();
      if (Number.isFinite(push.x)) obj.position.addScaledVector(push, Math.min(m.vehicle ? 0.45 : 1.6, falloff * 1.1));
      let broken = false;
      if (m.hp <= 0) {
        markDead(obj);
        if (weapon.archetype === 'atLauncher' || weapon.extra?.blastRadius || m.vehicle) {
          broken = true;
          this.sparks.push(...stylizedBreakup(this.scene, obj, point, 0.8 + falloff, m.vehicle ? 0xa08a70 : 0xff8f45));
        }
      }
      splash.push({ target: obj, damage: dmg, distance: d, broken });
    }
    const event = { type: 'explosion', weaponId: weapon.id, point: point.clone(), radius, splash, directTarget };
    this.events.push(event);
    return { point, radius, damage: weapon.damage, splash };
  }

  fireSingle({ weapon, camera, monsters, aimMode, skillLevel, damageScale, spreadMul }) {
    const from = camera.getWorldPosition(new THREE.Vector3());
    const dir = aimDirection(camera, weapon, aimMode, skillLevel, spreadMul);

    const maxRange = weapon.range || 60;
    const velocity = weapon.muzzleVelocity || 80;
    const gravity = weapon.gravity || 0.03;
    let best = null;
    let bestD = Infinity;
    let bestPoint = from.clone().addScaledVector(dir, maxRange);

    for (const obj of monsters) {
      const m = obj.userData;
      if (!m.alive) continue;
      const target = obj.position.clone().add(new THREE.Vector3(0, m.vehicle ? 1.25 : 1.0, 0));
      const to = target.clone().sub(from);
      const along = to.dot(dir);
      if (along < 0 || along > maxRange) continue;
      const travelTime = along / velocity;
      const drop = gravity * travelTime * travelTime * 50;
      const ballisticPoint = from.clone().addScaledVector(dir, along);
      ballisticPoint.y -= drop;
      const miss = ballisticPoint.distanceTo(target);
      const hitRadius = m.vehicle ? 1.65 : m.archetype === 'brute' ? 0.95 : 0.72;
      if (miss < hitRadius && along < bestD) {
        best = obj;
        bestD = along;
        bestPoint = ballisticPoint;
      }
    }

    this.tracers.push(makeTracer(this.scene, from, bestPoint, weapon.ammoType === 'phaseCell' ? 0x8a78ff : 0xffd28a));
    if (best) {
      const targetScale = isVehicleTarget(best) ? vehicleDamageScale(weapon, best) : 1;
      if (isVehicleTarget(best) && targetScale <= 0) {
        if (best.userData.conditionalHostile) best.userData.provoked = true;
        this.sparks.push(...makeImpact(this.scene, bestPoint, 0xc8c0a8, 12, 1.25));
        return { hit: true, target: best, damage: 0, point: bestPoint, armorBlocked: true, heavy: false };
      }
      const dmg = Math.round(weapon.damage * damageScale * (weapon.pellets ? 0.7 : 1) * targetScale);
      if (best.userData.conditionalHostile) best.userData.provoked = true;
      best.userData.hp -= dmg;
      let broken = false;
      if (best.userData.hp <= 0) {
        markDead(best);
        if ((isHeavyKinetic(weapon) && weaponBlastRadius(weapon) <= 0) || isVehicleTarget(best)) {
          broken = true;
          this.sparks.push(...stylizedBreakup(this.scene, best, bestPoint, 1.0 + Math.min(0.9, weapon.recoil || 0.5), isVehicleTarget(best) ? 0xa08a70 : 0xd2b070));
        }
      }
      this.sparks.push(...makeImpact(this.scene, bestPoint, weapon.ammoType === 'phaseCell' ? 0x8a78ff : isHeavyKinetic(weapon) ? 0xffb05f : 0xffd28a, isHeavyKinetic(weapon) ? 18 : 8, isHeavyKinetic(weapon) ? 1.55 : 1));
      return { hit: true, target: best, damage: dmg, point: bestPoint, broken, heavy: isHeavyKinetic(weapon), vehicleHit: isVehicleTarget(best) };
    }
    return { hit: false, point: bestPoint, heavy: isHeavyKinetic(weapon) };
  }

  updateRocketProjectile(p, dt) {
    p.life -= dt;
    p.last.copy(p.pos);
    p.vel.y -= (p.weapon.gravity || 0.09) * 18 * dt;
    p.pos.addScaledVector(p.vel, dt);
    p.travelled += p.pos.distanceTo(p.last);
    p.mesh.position.copy(p.pos);
    if (p.vel.lengthSq() > 0.0001) p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), p.vel.clone().normalize());
    const flame = p.mesh.userData.flame;
    if (flame) flame.scale.setScalar(0.75 + Math.random() * 0.5);
    const light = p.mesh.userData.light;
    if (light) light.intensity = 0.9 + Math.random() * 1.4;

    for (const obj of p.monsters || []) {
      const m = obj.userData;
      if (!m?.alive) continue;
      const center = obj.position.clone().add(new THREE.Vector3(0, m.vehicle ? 1.35 : 1.0, 0));
      const closest = closestPointOnSegment(p.last, p.pos, center);
      const hitRadius = m.vehicle ? 1.9 : m.archetype === 'brute' ? 1.02 : 0.76;
      if (closest.distanceTo(center) <= hitRadius + p.radius) {
        const direct = this.directDamage({ weapon: p.weapon, target: obj, point: closest, damageScale: p.damageScale });
        const explosion = this.applyBlast({ weapon: p.weapon, point: closest, monsters: p.monsters, damageScale: p.damageScale, directTarget: obj });
        this.events.push({ type: 'rocketImpact', weaponId: p.weapon.id, point: closest.clone(), direct, explosion });
        return true;
      }
    }

    const ground = heightAt(p.pos.x, p.pos.z) + 0.08;
    if (p.pos.y <= ground || p.life <= 0 || p.travelled > (p.weapon.range || 80) * 1.35) {
      const impact = p.pos.clone();
      impact.y = Math.max(impact.y, ground);
      const explosion = this.applyBlast({ weapon: p.weapon, point: impact, monsters: p.monsters, damageScale: p.damageScale, directTarget: null });
      this.events.push({ type: 'rocketImpact', weaponId: p.weapon.id, point: impact.clone(), direct: null, explosion });
      return true;
    }
    return false;
  }

  update(dt) {
    for (const p of this.projectiles) {
      if (this.updateRocketProjectile(p, dt)) {
        this.scene.remove(p.mesh);
        p.mesh.traverse?.((node) => {
          node.geometry?.dispose?.();
          if (Array.isArray(node.material)) node.material.forEach((mat) => mat?.dispose?.());
          else node.material?.dispose?.();
        });
        p.dead = true;
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);

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
