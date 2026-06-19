import * as THREE from '../vendor/three.module.js';
import { makeMat } from '../world/props.js';

function mat(color, opts = {}) { return makeMat(color, opts); }
function box(w, h, d, color, opts = {}) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts)); }
function cyl(r, h, color, axis = 'y', opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat(color, opts));
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  return m;
}
function sphere(r, color, opts = {}) { return new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat(color, opts)); }
function cone(r, h, color, opts = {}) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mat(color, opts)); }

const COLORS = {
  empire: 0xb8aa86,
  rebels: 0xa4472d,
  peasants: 0x9a6b42,
  knights: 0xb9b3a8,
  errorOrder: 0x8a78ff,
  soundOrder: 0xd8b56e,
  bandits: 0x2a170f,
  zhuzher: 0x6b6f35,
  tsarbor: 0x2d6b3b,
  blueElementals: 0x4d78b8,
  blackElementals: 0x0a0612,
  phaseGuild: 0x8a78ff,
  travelers: 0xc9a66c,
  redPeasants: 0xb64a32,
};

function addHumanRig(obj, color, role = 'civilian', occupation = '') {
  const rig = new THREE.Group();
  rig.name = 'actor_visual_rig';

  const torso = box(0.5, 0.9, 0.32, color);
  torso.name = 'torso'; torso.position.y = 1.08; rig.add(torso);
  const redElemental = role === 'redElemental';
  const head = sphere(0.22, redElemental ? 0xb9472f : 0xd2aa7a, redElemental ? { emissive: 0x4a120b, emissiveIntensity: 0.2 } : {});
  head.name = 'head'; head.position.y = 1.72; rig.add(head);
  const leftArm = cyl(0.055, 0.78, color, 'y'); leftArm.name = 'leftArm'; leftArm.position.set(-0.34, 1.15, 0); rig.add(leftArm);
  const rightArm = cyl(0.055, 0.78, color, 'y'); rightArm.name = 'rightArm'; rightArm.position.set(0.34, 1.15, 0); rig.add(rightArm);
  const leftLeg = cyl(0.07, 0.82, 0x2a211a, 'y'); leftLeg.name = 'leftLeg'; leftLeg.position.set(-0.14, 0.44, 0); rig.add(leftLeg);
  const rightLeg = cyl(0.07, 0.82, 0x2a211a, 'y'); rightLeg.name = 'rightLeg'; rightLeg.position.set(0.14, 0.44, 0); rig.add(rightLeg);

  if (role === 'empire' || role === 'guard') {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x4d4b42, { metalness: 0.1 }));
    helmet.name = 'helmet'; helmet.position.y = 1.87; rig.add(helmet);
    const pack = box(0.36, 0.55, 0.16, 0x2b261c); pack.position.set(0, 1.08, 0.27); rig.add(pack);
  }
  if (role === 'knight' || role === 'order') {
    const helm = cone(0.25, 0.34, 0xb9b3a8, { metalness: 0.18, roughness: 0.35 }); helm.position.y = 1.96; rig.add(helm);
    const shield = box(0.08, 0.62, 0.45, role === 'order' ? 0x42307a : 0x5b4f44, { metalness: 0.12 }); shield.position.set(-0.48, 1.07, 0.05); rig.add(shield);
    const cape = box(0.56, 0.82, 0.05, role === 'order' ? 0x27184a : 0x33251f); cape.position.set(0, 1.03, 0.24); rig.add(cape);
  }
  if (role === 'mage') {
    const hood = cone(0.28, 0.42, 0x39266f, { emissive: 0x1c0f3d, emissiveIntensity: 0.3 }); hood.position.y = 1.95; rig.add(hood);
    const sash = box(0.58, 0.08, 0.36, 0x8a78ff, { emissive: 0x3a2dc0, emissiveIntensity: 0.25 }); sash.position.set(0, 1.24, 0.01); sash.rotation.z = 0.22; rig.add(sash);
  }
  if (role === 'tsarbor') {
    const barkMask = cone(0.26, 0.38, 0x5b3b22, { emissive: 0x0b2312, emissiveIntensity: 0.2 }); barkMask.position.y = 1.94; rig.add(barkMask);
    const leaves = cone(0.42, 0.55, 0x17361f, { emissive: 0x062410, emissiveIntensity: 0.25 }); leaves.position.y = 2.22; rig.add(leaves);
  }
  if (role === 'zhuzher') {
    const mask = sphere(0.24, 0x6b6f35); mask.position.y = 1.75; rig.add(mask);
    const scarf = box(0.52, 0.14, 0.36, 0x5d1e13); scarf.position.y = 1.42; rig.add(scarf);
  }
  if (role === 'bandit') {
    const hood = cone(0.27, 0.36, 0x1b100a); hood.position.y = 1.92; rig.add(hood);
  }
  if (redElemental) {
    const eyeMaterial = mat(0xff9a4a, { emissive: 0xff4a18, emissiveIntensity: 1.25 });
    for (const x of [-0.075, 0.075]) {
      const eye = sphere(0.026, 0xff9a4a, { emissive: 0xff4a18, emissiveIntensity: 1.25 });
      eye.material = eyeMaterial;
      eye.position.set(x, 1.75, 0.205);
      rig.add(eye);
    }
    const workColor = ['fisher', 'boatman', 'fisherElder'].includes(occupation)
      ? 0x416565
      : ['interpreter', 'guide'].includes(occupation)
        ? 0xb08b59
        : ['farmer', 'farmerElder', 'agronomist'].includes(occupation)
          ? 0x756b31
          : 0x8f2f24;
    const emberSash = box(0.54, 0.045, 0.34, workColor, { emissive: 0x3b0905, emissiveIntensity: 0.35 });
    emberSash.position.set(0, 1.17, -0.02);
    emberSash.rotation.z = -0.18;
    rig.add(emberSash);
  }

  obj.add(rig);
  obj.userData.visualRig = rig;
  return rig;
}

function addElementalRig(obj, color, black = false) {
  const rig = new THREE.Group();
  rig.name = 'actor_visual_rig';
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), mat(color, { transparent: true, opacity: black ? 0.78 : 0.72, emissive: color, emissiveIntensity: black ? 0.38 : 0.22 }));
  body.name = 'torso'; body.position.y = 1.2; rig.add(body);
  const core = sphere(0.18, black ? 0x6a3cff : 0x9fc7ff, { emissive: black ? 0x5a22ff : 0x4d78ff, emissiveIntensity: 1.1 });
  core.name = 'head'; core.position.y = 1.78; rig.add(core);
  for (let i = 0; i < 5; i++) {
    const shard = cone(0.08, 0.7, color, { transparent: true, opacity: 0.65, emissive: color, emissiveIntensity: 0.25 });
    shard.name = `shard_${i}`;
    shard.position.set(Math.cos(i * 1.256) * 0.62, 1.2 + Math.sin(i) * 0.25, Math.sin(i * 1.256) * 0.62);
    shard.rotation.z = i * 0.5;
    rig.add(shard);
  }
  obj.add(rig);
  obj.userData.visualRig = rig;
  return rig;
}

function roleFor(u) {
  if (u.faction === 'empire') return u.role === 'guard' ? 'guard' : 'empire';
  if (u.faction === 'knights') return 'knight';
  if (u.faction === 'errorOrder' || u.faction === 'soundOrder') return 'order';
  if (u.faction === 'phaseGuild') return 'mage';
  if (u.faction === 'tsarbor') return 'tsarbor';
  if (u.faction === 'zhuzher') return 'zhuzher';
  if (u.faction === 'bandits') return 'bandit';
  if (u.faction === 'blueElementals') return 'blueElemental';
  if (u.faction === 'blackElementals') return 'blackElemental';
  if (u.faction === 'redPeasants') return 'redElemental';
  return 'civilian';
}

export class ActorVisualSystem {
  constructor(engine) {
    this.engine = engine;
    this.actors = [];
    this.prev = new WeakMap();
    this.time = 0;
  }

  collectActors() {
    const life = this.engine.livingWorld?.agents || [];
    const monsters = this.engine.monsters || [];
    return [...life, ...monsters];
  }

  build() {
    for (const obj of this.collectActors()) this.enhance(obj);
  }

  enhance(obj) {
    const u = obj.userData || {};
    if (u.actorVisualEnhanced) return;
    u.actorVisualEnhanced = true;

    // Hide primitive placeholder body a little, but leave weapon meshes and labels intact.
    for (const child of obj.children) {
      if (child.name === 'npc_weapon' || child.name === 'actor_visual_rig') continue;
      if (child.isMesh && !child.userData.keepVisible) child.visible = false;
    }

    const role = roleFor(u);
    const color = COLORS[u.faction] || (u.color || 0x9a6b42);
    if (role === 'blueElemental') addElementalRig(obj, 0x4d78b8, false);
    else if (role === 'blackElemental' || u.archetype === 'black') addElementalRig(obj, 0x111018, true);
    else if (u.archetype === 'glass' || u.archetype === 'phase') addElementalRig(obj, 0x6fc8c0, false);
    else addHumanRig(obj, color, role, u.role);

    this.prev.set(obj, obj.position.clone());
    this.actors.push(obj);
  }

  update(dt) {
    this.time += dt;
    for (const obj of this.collectActors()) {
      this.enhance(obj);
      if (obj.userData.settlementCulled || !obj.visible) continue;
      this.animateActor(obj, dt);
    }
  }

  animateActor(obj, dt) {
    const u = obj.userData || {};
    const rig = u.visualRig;
    if (!rig) return;
    const prev = this.prev.get(obj) || obj.position.clone();
    const speed = obj.position.distanceTo(prev) / Math.max(dt, 0.001);
    this.prev.set(obj, obj.position.clone());

    const torso = rig.getObjectByName('torso');
    const head = rig.getObjectByName('head');
    const leftArm = rig.getObjectByName('leftArm');
    const rightArm = rig.getObjectByName('rightArm');
    const leftLeg = rig.getObjectByName('leftLeg');
    const rightLeg = rig.getObjectByName('rightLeg');

    const walk = Math.min(1, speed / 2.8);
    const phase = this.time * (6.5 + walk * 5.0) + (u.x || obj.position.x) * 0.1;
    const bob = Math.sin(phase) * 0.055 * walk;
    rig.position.y = THREE.MathUtils.damp(rig.position.y, bob, 8, dt);

    if (leftLeg) leftLeg.rotation.x = Math.sin(phase) * 0.65 * walk;
    if (rightLeg) rightLeg.rotation.x = -Math.sin(phase) * 0.65 * walk;
    if (leftArm) leftArm.rotation.x = -Math.sin(phase) * 0.55 * walk;
    if (rightArm) rightArm.rotation.x = Math.sin(phase) * 0.55 * walk;
    if (head) head.rotation.y = Math.sin(this.time * 1.4 + obj.position.x) * 0.08;
    if (torso) torso.rotation.x = Math.sin(this.time * 1.7 + obj.position.z) * 0.025;

    // Combat poses are driven by armedWorld / aiFeel userData.
    if ((u.windupT || 0) > 0) {
      if (rightArm) rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, -1.25, 11, dt);
      if (leftArm) leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, -0.75, 11, dt);
      if (torso) torso.rotation.z = THREE.MathUtils.damp(torso.rotation.z, 0.18, 10, dt);
    } else if ((u.guardT || 0) > 0) {
      if (leftArm) leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, -1.05, 10, dt);
      if (rightArm) rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, -0.95, 10, dt);
      if (torso) torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, -0.12, 10, dt);
    } else if ((u.dodgeT || 0) > 0) {
      if (torso) torso.rotation.z = THREE.MathUtils.damp(torso.rotation.z, 0.32, 12, dt);
      rig.position.x = Math.sin(this.time * 28) * 0.08;
    } else if (u.aiState === 'retreat') {
      if (torso) torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, 0.18, 7, dt);
      if (head) head.rotation.y = Math.sin(this.time * 9) * 0.18;
    } else {
      if (torso) torso.rotation.z = THREE.MathUtils.damp(torso.rotation.z, 0, 7, dt);
      rig.position.x = THREE.MathUtils.damp(rig.position.x, 0, 6, dt);
    }

    // Elemental floating/orbiting shards.
    for (const child of rig.children) {
      if (child.name?.startsWith('shard_')) {
        const idx = Number(child.name.split('_')[1] || 0);
        child.rotation.y += dt * (0.8 + idx * 0.08);
        child.position.y += Math.sin(this.time * 2.2 + idx) * 0.004;
      }
    }

    const weapon = obj.getObjectByName('npc_weapon');
    if (weapon) {
      if ((u.windupT || 0) > 0) weapon.rotation.z = THREE.MathUtils.damp(weapon.rotation.z, -0.55, 13, dt);
      else weapon.rotation.z = THREE.MathUtils.damp(weapon.rotation.z, 0, 8, dt);
      if (u.weaponProfile?.kind === 'firearm' && (u.windupT || 0) > 0) weapon.position.z = Math.sin(this.time * 18) * 0.025;
    }
  }
}
