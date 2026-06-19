import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { makeMat, Materials } from '../world/props.js';

function makeMonsterModel(kind, color) {
  const g = new THREE.Group();
  const main = kind === 'black' ? Materials.black : makeMat(color ?? 0xb84634);
  const bone = makeMat(0xd3b07a);
  const dark = makeMat(0x120b08);

  if (kind === 'brute') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.3, 0.85), main); body.position.y = 1.0;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42), dark); head.position.y = 1.85;
    const h1 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 8), bone); h1.position.set(-0.25, 2.15, 0); h1.rotation.z = 0.45;
    const h2 = h1.clone(); h2.position.x = 0.25; h2.rotation.z = -0.45;
    g.add(body, head, h1, h2);
  } else if (kind === 'lurker') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.7, 5, 8), main); body.rotation.z = Math.PI / 2; body.position.y = 0.65;
    g.add(body);
    for (let i = 0; i < 6; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.9, 6), dark);
      leg.position.set((i - 2.5) * 0.22, 0.45, (i % 2 ? 0.42 : -0.42));
      leg.rotation.x = i % 2 ? 0.9 : -0.9;
      g.add(leg);
    }
  } else if (kind === 'ghoul') {
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.5, 7), main); spine.position.y = 1.0; spine.rotation.z = 0.18;
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.34, 0.42), bone); skull.position.y = 1.85;
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.36), dark); jaw.position.y = 1.62;
    g.add(spine, skull, jaw);
  } else if (kind === 'glass' || kind === 'phase') {
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.8, 5), Materials.glass); body.position.y = 1.05;
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32), new THREE.MeshStandardMaterial({ color: 0x9ff4ec, emissive: 0x46d4c8, emissiveIntensity: 0.9, transparent: true, opacity: 0.72 })); core.position.y = 1.25;
    const l = new THREE.PointLight(0x70f4e8, 0.9, 8); l.position.y = 1.4;
    g.add(body, core, l);
  } else if (kind === 'ice') {
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.7, 6), Materials.ice); body.position.y = 0.95;
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 5), Materials.ice); crest.position.y = 1.95;
    g.add(body, crest);
  } else if (kind === 'black') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.35, 6, 10), Materials.black); body.position.y = 1.1;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 8, 24), new THREE.MeshStandardMaterial({ color: 0x6d36ff, emissive: 0x4d16ff, emissiveIntensity: 1.2 })); halo.position.y = 2.0; halo.rotation.x = Math.PI / 2;
    const l = new THREE.PointLight(0x5a22ff, 1.4, 10); l.position.y = 1.4;
    g.add(body, halo, l);
  } else {
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72), main); body.position.y = 0.82;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.52), dark); head.position.y = 1.35;
    g.add(body, head);
  }
  return g;
}

export function createMonster(scene, data) {
  const obj = makeMonsterModel(data.archetype, data.color);
  obj.position.set(data.x, heightAt(data.x, data.z), data.z);
  obj.userData = {
    type: 'monster',
    alive: true,
    looted: false,
    ...data,
    hpMax: data.hp,
  };
  scene.add(obj);
  return obj;
}

export function updateMonsters(monsters, playerRig, dt, player = null) {
  for (const obj of monsters) {
    const m = obj.userData;
    if (!m.alive) continue;
    if (m.conditionalHostile && !m.provoked && !m.autoHostile) continue;
    const d = Math.hypot(playerRig.position.x - m.x, playerRig.position.z - m.z);
    const detectionRange = player?.characterRuntime?.nullVeil ? 5 : 16;
    if (d < detectionRange && d > 1.6) {
      const dx = (playerRig.position.x - m.x) / d;
      const dz = (playerRig.position.z - m.z) / d;
      const slow = m.slowT > 0 ? 0.38 : 1;
      const fear = m.fearT > 0 ? -0.72 : 1;
      m.x += dx * dt * (m.speed ?? 1.15) * slow * fear;
      m.z += dz * dt * (m.speed ?? 1.15) * slow * fear;
      obj.position.set(m.x, heightAt(m.x, m.z), m.z);
      obj.lookAt(playerRig.position.x, playerRig.position.y + 1, playerRig.position.z);
    }
  }
}
