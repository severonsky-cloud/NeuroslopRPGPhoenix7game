import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { ARSENAL } from './arsenal.js';

export class ImpactSystem {
  constructor(scene, inventory) {
    this.scene = scene;
    this.inventory = inventory;
    this.trails = [];
    this.impacts = [];
  }

  meleeTrail(camera, color = 0xffd28a, heavy = false) {
    const origin = camera.getWorldPosition(new THREE.Vector3());
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const a = origin.clone().addScaledVector(f, 1.0).addScaledVector(r, heavy ? -0.8 : -0.45);
    const b = origin.clone().addScaledVector(f, heavy ? 3.8 : 2.8).addScaledVector(r, heavy ? 0.9 : 0.5);
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: heavy ? 0.95 : 0.75 });
    const line = new THREE.Line(geo, mat);
    line.userData.life = heavy ? 0.16 : 0.10;
    this.scene.add(line);
    this.trails.push(line);
  }

  hitImpact(position, impact = 'blade') {
    const colorMap = {
      blade: 0xd8d0b8,
      heavyBlade: 0xffd28a,
      pierce: 0xcfe6ff,
      blunt: 0xa88b5e,
      heavyBlunt: 0xffb05f,
      axe: 0xff9f55,
      glassCut: 0x8fd8d2,
      phase: 0x8a78ff,
    };
    const color = colorMap[impact] || 0xffd28a;
    for (let i = 0; i < 7; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.65 })
      );
      p.position.copy(position).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, Math.random() * 0.6, (Math.random() - 0.5) * 0.4));
      p.userData.life = 0.18 + Math.random() * 0.18;
      p.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 2.0, Math.random() * 1.4, (Math.random() - 0.5) * 2.0);
      this.scene.add(p);
      this.impacts.push(p);
    }
  }

  applyStagger(target, amount = 0.3) {
    if (!target?.userData) return;
    target.userData.staggerT = Math.max(target.userData.staggerT || 0, amount);
    target.rotation.z = (Math.random() - 0.5) * 0.24;
    setTimeout(() => { if (target.rotation) target.rotation.z = 0; }, 150);
  }

  lootDeadMonster(monster) {
    const m = monster?.userData;
    if (!m || !m.alive || m.looted) return [];
    return [];
  }

  grantLootForKill(monster) {
    const m = monster?.userData;
    if (!m || m.looted) return [];
    m.looted = true;
    let table = 'road';
    if (m.id?.includes('zhuzher') || m.name?.includes('Жужжер')) table = 'raider';
    if (m.archetype === 'black' || m.archetype === 'glass' || m.archetype === 'phase') table = 'elemental';
    if (m.archetype === 'brute') table = Math.random() < 0.5 ? 'road' : 'bandit';
    return this.inventory?.lootAmmoBundle(table) || [];
  }

  update(dt) {
    for (const t of this.trails) {
      t.userData.life -= dt;
      t.material.opacity = Math.max(0, t.userData.life / 0.16);
      if (t.userData.life <= 0) { this.scene.remove(t); t.dead = true; }
    }
    this.trails = this.trails.filter(t => !t.dead);

    for (const p of this.impacts) {
      p.userData.life -= dt;
      p.position.addScaledVector(p.userData.vel, dt);
      p.scale.multiplyScalar(0.98);
      if (p.userData.life <= 0) { this.scene.remove(p); p.dead = true; }
    }
    this.impacts = this.impacts.filter(p => !p.dead);
  }
}
