import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { makeMat, Materials } from '../world/props.js';

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(r1, r2, h, mat, x = 0, y = 0, z = 0, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, segments), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addWheels(g, length, width, count, dark) {
  for (let i = 0; i < count; i += 1) {
    const side = i % 2 ? 1 : -1;
    const axle = Math.floor(i / 2);
    const x = -length * 0.38 + axle * (length * 0.25);
    const wheel = cylinder(0.38, 0.38, 0.26, dark, x, 0.48, side * (width * 0.54), 16);
    wheel.rotation.z = Math.PI / 2;
    const hub = cylinder(0.18, 0.18, 0.29, makeMat(0x777064, { roughness: 0.62, metalness: 0.25 }), x, 0.48, side * (width * 0.555), 12);
    hub.rotation.z = Math.PI / 2;
    g.add(wheel, hub);
  }
}

function makeVehicleModel(kind, color) {
  const g = new THREE.Group();
  g.name = `visible_${kind}`;
  const hull = makeMat(color ?? 0x4f4638, { roughness: 0.82, metalness: 0.16 });
  const dark = makeMat(0x15120f, { roughness: 0.88, metalness: 0.18 });
  const metal = makeMat(0x777064, { roughness: 0.65, metalness: 0.32 });
  const accent = makeMat(0xb78b4a, { roughness: 0.55, metalness: 0.08 });
  const glass = makeMat(0x87b3bb, { roughness: 0.35, metalness: 0.05, emissive: 0x12313a, emissiveIntensity: 0.15 });

  if (kind === 'walkerVehicle') {
    const body = box(3.8, 1.55, 2.45, hull, 0, 2.25, 0);
    const turret = box(1.65, 0.75, 1.45, metal, 0.15, 3.32, -0.04);
    const gun = cylinder(0.09, 0.075, 2.75, metal, 0.15, 3.32, -1.95, 10);
    gun.rotation.x = Math.PI / 2;
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34), new THREE.MeshStandardMaterial({ color: 0x9ff4ec, emissive: 0x46d4c8, emissiveIntensity: 0.7, transparent: true, opacity: 0.8 }));
    core.position.set(0, 2.35, -1.28);
    g.add(body, turret, gun, core);
    for (let i = 0; i < 4; i += 1) {
      const leg = cylinder(0.12, 0.16, 1.95, dark, i < 2 ? -1.28 : 1.28, 1.1, i % 2 ? -0.82 : 0.82, 8);
      leg.rotation.x = i % 2 ? 0.28 : -0.28;
      const foot = box(0.78, 0.18, 0.52, dark, i < 2 ? -1.28 : 1.28, 0.24, i % 2 ? -1.03 : 1.03);
      g.add(leg, foot);
    }
    g.userData.vehicleVisualHeight = 3.8;
    return g;
  }

  const soft = kind === 'softVehicle';
  const armored = kind === 'armoredVehicle';
  const light = kind === 'lightVehicle';
  const length = armored ? 5.9 : soft ? 6.35 : 4.45;
  const width = armored ? 2.35 : soft ? 2.15 : 1.85;
  const bodyHeight = armored ? 1.28 : soft ? 1.28 : 0.98;

  const body = box(length, bodyHeight, width, hull, 0, 1.05, 0);
  const nose = box(length * 0.32, bodyHeight * 0.52, width * 0.82, dark, length * 0.34, 1.28, 0);
  const cabin = box(armored ? 1.55 : 1.25, armored ? 1.02 : 0.92, width * 0.82, armored ? metal : hull, armored ? -0.62 : -1.05, 2.05, 0);
  const window = box(armored ? 0.78 : 0.62, 0.34, width * 0.84, glass, armored ? -0.25 : -0.82, 2.2, -0.01);
  g.add(body, nose, cabin, window);

  if (armored) {
    const trackL = box(length * 0.9, 0.42, 0.28, dark, 0, 0.56, -width * 0.62);
    const trackR = box(length * 0.9, 0.42, 0.28, dark, 0, 0.56, width * 0.62);
    g.add(trackL, trackR);
    addWheels(g, length, width, 8, dark);
  } else {
    addWheels(g, length, width, 6, dark);
  }

  if (armored || light) {
    const turretBase = cylinder(light ? 0.38 : 0.55, light ? 0.46 : 0.66, 0.28, metal, light ? 0.7 : 0.82, light ? 2.05 : 2.65, 0, 12);
    const turret = box(light ? 0.86 : 1.16, light ? 0.34 : 0.46, light ? 0.7 : 0.92, metal, light ? 0.7 : 0.82, light ? 2.22 : 2.88, -0.02);
    const gun = cylinder(light ? 0.045 : 0.075, light ? 0.045 : 0.085, light ? 1.55 : 2.25, metal, light ? 0.7 : 0.82, light ? 2.22 : 2.88, light ? -1.1 : -1.62, 10);
    gun.rotation.x = Math.PI / 2;
    g.add(turretBase, turret, gun);
  }

  if (soft) {
    const tank1 = cylinder(0.42, 0.42, 2.35, accent, 0.62, 2.18, -0.52, 16);
    tank1.rotation.z = Math.PI / 2;
    const tank2 = cylinder(0.42, 0.42, 2.35, accent, 0.62, 2.18, 0.52, 16);
    tank2.rotation.z = Math.PI / 2;
    const hose = cylinder(0.035, 0.035, 1.85, dark, -0.15, 2.72, 0, 8);
    hose.rotation.z = Math.PI / 2;
    g.add(tank1, tank2, hose);
  }

  const flagPole = cylinder(0.025, 0.025, 1.1, dark, -length * 0.46, 2.35, width * 0.45, 6);
  const marker = box(0.45, 0.28, 0.035, accent, -length * 0.46, 2.85, width * 0.45);
  g.add(flagPole, marker);
  g.userData.vehicleVisualHeight = armored ? 3.25 : soft ? 3.0 : 2.65;
  return g;
}

function makeMonsterModel(kind, color) {
  if (kind === 'lightVehicle' || kind === 'armoredVehicle' || kind === 'softVehicle' || kind === 'walkerVehicle') return makeVehicleModel(kind, color);

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
    const detectionRange = player?.characterRuntime?.nullVeil ? 5 : (m.vehicle ? 34 : 16);
    if (d < detectionRange && d > (m.vehicle ? 8.0 : 1.6)) {
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
