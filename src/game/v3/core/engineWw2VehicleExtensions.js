import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { labelSprite, makeMat } from '../world/props.js';

function ww2LiveMode() {
  const params = new URLSearchParams(globalThis.location?.search || '');
  const path = globalThis.location?.pathname || '';
  return params.has('ww2') || path.includes('ww2') || path.includes('v3p2_ww2_live');
}

function disposeNode(scene, node) {
  if (!node) return;
  scene.remove(node);
  node.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((mat) => mat?.dispose?.());
    else child.material?.dispose?.();
  });
}

function box(w, h, d, mat, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(r1, r2, h, mat, x, y, z, segments = 14) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, segments), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function wheel(g, x, z, dark, r = 0.42) {
  const tire = cyl(r, r, 0.32, dark, x, 0.55, z, 16);
  tire.rotation.z = Math.PI / 2;
  const hub = cyl(r * 0.43, r * 0.43, 0.35, makeMat(0x80786b, { roughness: 0.56, metalness: 0.28 }), x, 0.55, z * 1.01, 12);
  hub.rotation.z = Math.PI / 2;
  g.add(tire, hub);
}

function addLabelPlate(g, name, width, height, z, accent) {
  const plate = box(width, 0.18, 0.06, accent, 0, height, z);
  const postA = cyl(0.025, 0.025, 0.8, accent, -width * 0.38, height - 0.42, z, 6);
  const postB = cyl(0.025, 0.025, 0.8, accent, width * 0.38, height - 0.42, z, 6);
  g.add(plate, postA, postB);
  g.userData.visualName = name;
}

function makeArmoredCar() {
  const g = new THREE.Group();
  const hull = makeMat(0x4b4f2c, { roughness: 0.82, metalness: 0.16 });
  const dark = makeMat(0x11100c, { roughness: 0.9, metalness: 0.2 });
  const metal = makeMat(0x777064, { roughness: 0.62, metalness: 0.34 });
  const glass = makeMat(0x8fb8b8, { roughness: 0.34, emissive: 0x0d2b2f, emissiveIntensity: 0.18 });
  const accent = makeMat(0xd0a75f, { roughness: 0.52, metalness: 0.1 });
  g.add(
    box(6.4, 1.35, 2.55, hull, 0, 1.12, 0),
    box(2.0, 0.68, 2.08, dark, 1.65, 1.45, 0),
    box(1.55, 1.0, 1.86, metal, -0.7, 2.16, 0),
    box(0.78, 0.34, 1.92, glass, -0.36, 2.34, 0),
  );
  [-2.35, -1.05, 0.35, 1.75].forEach((x) => { wheel(g, x, -1.5, dark); wheel(g, x, 1.5, dark); });
  const turretBase = cyl(0.66, 0.78, 0.32, metal, 0.78, 2.72, 0, 14);
  const turret = box(1.28, 0.52, 1.02, metal, 0.78, 3.02, 0);
  const cannon = cyl(0.08, 0.09, 2.55, metal, 0.78, 3.02, -1.88, 12);
  cannon.rotation.x = Math.PI / 2;
  g.add(turretBase, turret, cannon);
  addLabelPlate(g, 'броневик', 1.25, 3.55, 1.32, accent);
  g.userData.vehicleKind = 'armored-car';
  return g;
}

function makeFuelTruck() {
  const g = new THREE.Group();
  const hull = makeMat(0x6c3c2c, { roughness: 0.8, metalness: 0.13 });
  const dark = makeMat(0x15120f, { roughness: 0.88, metalness: 0.18 });
  const metal = makeMat(0x706b62, { roughness: 0.6, metalness: 0.26 });
  const fuel = makeMat(0xb78b4a, { roughness: 0.52, metalness: 0.12 });
  const glass = makeMat(0x87b3bb, { roughness: 0.35, emissive: 0x12313a, emissiveIntensity: 0.14 });
  g.add(
    box(6.8, 1.15, 2.22, hull, 0, 1.03, 0),
    box(1.45, 1.04, 1.82, hull, -2.0, 2.04, 0),
    box(0.65, 0.34, 1.9, glass, -1.72, 2.22, 0),
  );
  [-2.6, -1.0, 0.75, 2.35].forEach((x) => { wheel(g, x, -1.32, dark, 0.4); wheel(g, x, 1.32, dark, 0.4); });
  const tank1 = cyl(0.56, 0.56, 3.2, fuel, 0.78, 2.14, -0.48, 18);
  tank1.rotation.z = Math.PI / 2;
  const tank2 = cyl(0.56, 0.56, 3.2, fuel, 0.78, 2.14, 0.48, 18);
  tank2.rotation.z = Math.PI / 2;
  const pipe = cyl(0.04, 0.04, 2.05, metal, -0.2, 2.88, 0, 8);
  pipe.rotation.z = Math.PI / 2;
  g.add(tank1, tank2, pipe);
  addLabelPlate(g, 'топливный грузовик', 1.55, 3.2, 1.25, fuel);
  g.userData.vehicleKind = 'fuel-truck';
  return g;
}

function makeBuggy() {
  const g = new THREE.Group();
  const hull = makeMat(0x5a4630, { roughness: 0.84, metalness: 0.1 });
  const dark = makeMat(0x120f0b, { roughness: 0.9, metalness: 0.2 });
  const metal = makeMat(0x807466, { roughness: 0.64, metalness: 0.3 });
  const accent = makeMat(0xd0a75f, { roughness: 0.52 });
  g.add(
    box(4.65, 0.86, 1.95, hull, 0, 0.96, 0),
    box(1.1, 0.72, 1.4, hull, -0.9, 1.58, 0),
    box(1.35, 0.46, 1.55, dark, 1.35, 1.18, 0),
  );
  [-1.65, -0.2, 1.35].forEach((x) => { wheel(g, x, -1.14, dark, 0.34); wheel(g, x, 1.14, dark, 0.34); });
  const mount = cyl(0.44, 0.52, 0.26, metal, 0.68, 2.05, 0, 12);
  const gun = cyl(0.045, 0.05, 1.8, metal, 0.68, 2.05, -1.28, 10);
  gun.rotation.x = Math.PI / 2;
  g.add(mount, gun);
  addLabelPlate(g, 'тачанка', 1.0, 2.65, 1.1, accent);
  g.userData.vehicleKind = 'buggy';
  return g;
}

function makeWalker() {
  const g = new THREE.Group();
  const hull = makeMat(0x25343a, { roughness: 0.62, metalness: 0.18, emissive: 0x061014, emissiveIntensity: 0.1 });
  const dark = makeMat(0x111417, { roughness: 0.78, metalness: 0.25 });
  const metal = makeMat(0x5e7d82, { roughness: 0.45, metalness: 0.28 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x9ff4ec, emissive: 0x46d4c8, emissiveIntensity: 0.85, transparent: true, opacity: 0.82 });
  g.add(box(4.1, 1.65, 2.65, hull, 0, 2.4, 0), box(1.85, 0.8, 1.55, metal, 0.1, 3.55, -0.02));
  const gun = cyl(0.09, 0.08, 3.05, metal, 0.1, 3.55, -2.18, 10);
  gun.rotation.x = Math.PI / 2;
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42), glow);
  core.position.set(0, 2.38, -1.42);
  g.add(gun, core);
  for (let i = 0; i < 4; i += 1) {
    const x = i < 2 ? -1.45 : 1.45;
    const z = i % 2 ? -1.05 : 1.05;
    const leg = cyl(0.15, 0.18, 2.25, dark, x, 1.16, z, 8);
    leg.rotation.x = i % 2 ? 0.3 : -0.3;
    const foot = box(0.9, 0.22, 0.62, dark, x, 0.25, z * 1.14);
    g.add(leg, foot);
  }
  addLabelPlate(g, 'боевой ходок', 1.45, 4.2, 1.35, makeMat(0x5ec7c4, { emissive: 0x1d4d4a, emissiveIntensity: 0.3 }));
  g.userData.vehicleKind = 'glass-walker';
  return g;
}

const VEHICLE_TARGETS = Object.freeze([
  { name: 'БОЛЬШАЯ ТАЧАНКА', hp: 150, armor: 6, vehicleArmor: 6, distance: 18, side: -7.5, build: makeBuggy },
  { name: 'БОЛЬШОЙ БРОНЕВИК', hp: 280, armor: 13, vehicleArmor: 13, distance: 26, side: 0, build: makeArmoredCar },
  { name: 'БОЛЬШОЙ ТОПЛИВНЫЙ ГРУЗОВИК', hp: 130, armor: 3, vehicleArmor: 3, distance: 34, side: 7.5, build: makeFuelTruck, explosiveDeath: true },
  { name: 'БОЛЬШОЙ СТЕКЛЯННЫЙ ХОДОК', hp: 240, armor: 10, vehicleArmor: 10, distance: 42, side: -1.5, build: makeWalker },
]);

function makeVehicleTargetObject(target) {
  const root = target.build();
  root.name = `ww2_big_vehicle_${target.name.replace(/\s+/g, '_')}`;
  root.userData = {
    ...root.userData,
    type: 'monster',
    alive: true,
    looted: true,
    conditionalHostile: true,
    autoHostile: false,
    ww2LiveTarget: true,
    ww2BigVehicle: true,
    name: target.name,
    hp: target.hp,
    hpMax: target.hp,
    armor: target.armor,
    archetype: target.build === makeWalker ? 'walkerVehicle' : target.build === makeFuelTruck ? 'softVehicle' : target.build === makeBuggy ? 'lightVehicle' : 'armoredVehicle',
    vehicle: true,
    vehicleArmor: target.vehicleArmor,
    explosiveDeath: Boolean(target.explosiveDeath),
    speed: 0,
    slowT: 0,
    fearT: 0,
  };
  return root;
}

export function installWw2VehicleExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__ww2VehicleExtensionInstalled) return;
  PhoenixV3Engine.__ww2VehicleExtensionInstalled = true;

  PhoenixV3Engine.prototype.spawnWw2BigVehicleTargets = function spawnWw2BigVehicleTargets() {
    if (!this.scene || !this.rig) return;
    for (const node of this.ww2BigVehicleNodes || []) disposeNode(this.scene, node);
    this.ww2BigVehicleNodes = [];
    this.monsters = (this.monsters || []).filter((monster) => !monster.userData?.ww2BigVehicle);
    this.labels = (this.labels || []).filter((label) => !label.userData?.ww2BigVehicle);

    const origin = this.rig.position.clone();
    const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw || 0).normalize();
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize();

    VEHICLE_TARGETS.forEach((target) => {
      const pos = origin.clone().addScaledVector(dir, target.distance).addScaledVector(right, target.side);
      const obj = makeVehicleTargetObject(target);
      obj.position.set(pos.x, heightAt(pos.x, pos.z), pos.z);
      obj.userData.x = pos.x;
      obj.userData.z = pos.z;
      obj.lookAt(origin.x, origin.y + 1.4, origin.z);
      this.scene.add(obj);
      this.monsters.push(obj);
      this.ww2BigVehicleNodes.push(obj);

      const label = labelSprite(this.scene, `${target.name} · VEHICLE · HP ${target.hp} · ARMOR ${target.armor}`, pos.x, pos.z, 4.6, 0.86);
      label.userData.ww2BigVehicle = true;
      label.userData.ww2LiveTarget = true;
      this.labels.push(label);
      this.ww2BigVehicleNodes.push(label);
    });

    this.hud.setObjective('WW2: большие модели техники выставлены прямо перед тобой. Пули дают искры, ПТ-ружья/гранаты/ракетницы наносят урон.');
  };

  const originalSpawnTargets = PhoenixV3Engine.prototype.spawnWw2LiveTargets;
  PhoenixV3Engine.prototype.spawnWw2LiveTargets = function spawnWw2LiveTargetsWithBigVehicles() {
    originalSpawnTargets?.call(this);
    this.spawnWw2BigVehicleTargets();
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWithBigVehicleDebug(code, event) {
    if (ww2LiveMode() && this.mode !== 'boot' && code === 'KeyY') {
      event?.preventDefault?.();
      this.spawnWw2BigVehicleTargets();
      return;
    }
    return originalOnAction.call(this, code, event);
  };
}
