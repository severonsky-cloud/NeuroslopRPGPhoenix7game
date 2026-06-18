import * as THREE from '../vendor/three.module.js';
import { WEAPONS } from './weapons.js';

function forwardVector(camera) {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
}

export function findMeleeTarget({ weaponId, playerRig, camera, monsters }) {
  const w = WEAPONS[weaponId];
  const f = forwardVector(camera);
  let best = null;
  let bestScore = -999;
  for (const obj of monsters) {
    const m = obj.userData;
    if (!m.alive) continue;
    const to = new THREE.Vector3(m.x - playerRig.position.x, 0, m.z - playerRig.position.z);
    const d = to.length();
    if (d > w.range) continue;
    to.normalize();
    const dot = f.dot(to);
    const nearBonus = d < 1.9 ? 0.7 : 0;
    const ok = dot > Math.cos(w.arc ?? 1.1) || d < 1.7;
    if (ok && dot + nearBonus - d * 0.03 > bestScore) {
      best = obj;
      bestScore = dot + nearBonus - d * 0.03;
    }
  }
  return best;
}

export function damageMonster(obj, amount) {
  const m = obj.userData;
  m.hp -= amount;
  obj.scale.setScalar(1.1);
  setTimeout(() => obj.scale.set(1, m.alive ? 1 : 0.28, 1), 80);
  if (m.hp <= 0) {
    m.alive = false;
    obj.scale.y = 0.28;
  }
  return m;
}

export function shootProjectile({ scene, camera, weapon, damage }) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xff8a24, emissiveIntensity: 0.9 })
  );
  mesh.position.copy(camera.getWorldPosition(new THREE.Vector3()));
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
  dir.x += (Math.random() - 0.5) * 0.018;
  dir.z += (Math.random() - 0.5) * 0.018;
  dir.normalize();
  scene.add(mesh);
  return { mesh, velocity: dir.multiplyScalar(42), life: 1.8, damage, name: weapon.name };
}

export function updateProjectiles({ scene, projectiles, monsters, dt, onHit }) {
  for (const pr of projectiles) {
    pr.mesh.position.addScaledVector(pr.velocity, dt);
    pr.life -= dt;
    for (const obj of monsters) {
      const m = obj.userData;
      if (m.alive && obj.position.distanceTo(pr.mesh.position) < 0.95) {
        damageMonster(obj, pr.damage);
        onHit?.(obj, pr.damage, pr.name);
        pr.life = 0;
      }
    }
    if (pr.life <= 0) {
      scene.remove(pr.mesh);
      pr.dead = true;
    }
  }
  return projectiles.filter(p => !p.dead);
}
