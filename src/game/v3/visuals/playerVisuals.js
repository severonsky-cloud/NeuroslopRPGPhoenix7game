import * as THREE from '../vendor/three.module.js';
import { makeMat } from '../world/props.js';

function mesh(geometry, material, name) {
  const node = new THREE.Mesh(geometry, material);
  node.name = name;
  node.castShadow = true;
  node.receiveShadow = true;
  return node;
}

function box(w, h, d, material, name) {
  return mesh(new THREE.BoxGeometry(w, h, d), material, name);
}

function capsule(radius, length, material, name) {
  return mesh(new THREE.CapsuleGeometry(radius, length, 5, 8), material, name);
}

function shadowOnly(color) {
  const material = makeMat(color, { roughness: 0.96 });
  material.colorWrite = false;
  material.depthWrite = false;
  return material;
}

function makeLeg(side, cloth, leather) {
  const leg = new THREE.Group();
  leg.name = side < 0 ? 'player_left_leg' : 'player_right_leg';
  leg.position.set(side * 0.145, 0.86, -0.28);

  const thigh = capsule(0.105, 0.36, cloth, `${leg.name}_thigh`);
  thigh.position.y = -0.20;
  leg.add(thigh);

  const shin = capsule(0.085, 0.34, cloth, `${leg.name}_shin`);
  shin.position.set(0, -0.52, -0.10);
  leg.add(shin);

  const boot = box(0.19, 0.18, 0.34, leather, `${leg.name}_boot`);
  boot.position.set(0, -0.77, -0.28);
  leg.add(boot);
  return leg;
}

function makeArm(side, coat, leather) {
  const arm = new THREE.Group();
  arm.name = side < 0 ? 'player_left_world_arm' : 'player_right_world_arm';
  arm.position.set(side * 0.34, 1.32, 0.055);
  arm.rotation.z = side * 0.08;

  const sleeve = capsule(0.075, 0.48, coat, `${arm.name}_sleeve`);
  sleeve.position.y = -0.29;
  arm.add(sleeve);

  const glove = capsule(0.065, 0.10, leather, `${arm.name}_glove`);
  glove.position.y = -0.63;
  arm.add(glove);
  return arm;
}

export class PlayerVisualSystem {
  constructor(engine) {
    this.engine = engine;
    this.time = 0;
    this.root = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftArm = null;
    this.rightArm = null;
    this.torso = null;
  }

  build() {
    if (this.root) return this.root;

    const coat = shadowOnly(0x44382b);
    const coatDark = shadowOnly(0x2d261f);
    const trousers = makeMat(0x292824, { roughness: 0.96 });
    const leather = makeMat(0x24170f, { roughness: 0.84 });
    const shadowLeather = shadowOnly(0x24170f);
    const shadowBrass = shadowOnly(0x8b6a32);

    const root = new THREE.Group();
    root.name = 'player_world_model_v3l1';
    root.position.z = 0.055;

    const pelvis = box(0.46, 0.28, 0.30, coatDark, 'player_pelvis');
    pelvis.position.y = 0.81;
    root.add(pelvis);

    const torso = box(0.58, 0.72, 0.34, coat, 'player_torso');
    torso.position.set(0, 1.21, 0.055);
    root.add(torso);
    this.torso = torso;

    const coatTail = box(0.54, 0.36, 0.055, coatDark, 'player_coat_tail');
    coatTail.position.set(0, 0.83, 0.19);
    coatTail.rotation.x = -0.08;
    root.add(coatTail);

    const belt = box(0.62, 0.09, 0.36, shadowLeather, 'player_belt');
    belt.position.set(0, 0.91, 0.04);
    root.add(belt);

    const buckle = box(0.10, 0.08, 0.03, shadowBrass, 'player_belt_buckle');
    buckle.position.set(0, 0.91, -0.155);
    root.add(buckle);

    const chestStrap = box(0.075, 0.78, 0.035, shadowLeather, 'player_chest_strap');
    chestStrap.position.set(0.10, 1.22, -0.175);
    chestStrap.rotation.z = -0.38;
    root.add(chestStrap);

    this.leftLeg = makeLeg(-1, trousers, leather);
    this.rightLeg = makeLeg(1, trousers, leather);
    this.leftArm = makeArm(-1, coat, shadowLeather);
    this.rightArm = makeArm(1, coat, shadowLeather);
    root.add(this.leftLeg, this.rightLeg, this.leftArm, this.rightArm);

    this.engine.rig.add(root);
    this.root = root;
    this.engine.playerVisual = root;
    return root;
  }

  update(dt) {
    if (!this.root) return;
    this.time += dt;

    const motion = this.engine.player?.motion || {};
    const vx = motion.vx || 0;
    const vz = motion.vz || 0;
    const speed = Math.hypot(vx, vz);
    const move = Math.min(1, speed / 6.2);
    const sprint = speed > 7.2 ? 1 : 0;
    const phase = motion.bob || this.time * 2.5;
    const stride = Math.sin(phase) * (0.48 + sprint * 0.20) * move;

    this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, stride, 13, dt);
    this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, -stride, 13, dt);
    this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, -stride * 0.42, 11, dt);
    this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, stride * 0.42, 11, dt);

    const localSide = Math.cos(this.engine.yaw) * vx - Math.sin(this.engine.yaw) * vz;
    const leanX = THREE.MathUtils.clamp(-localSide / 45, -0.12, 0.12);
    const leanForward = -move * (0.035 + sprint * 0.045);
    this.root.rotation.z = THREE.MathUtils.damp(this.root.rotation.z, leanX, 8, dt);
    this.root.rotation.x = THREE.MathUtils.damp(this.root.rotation.x, leanForward, 8, dt);
    this.root.position.y = Math.sin(phase * 2) * 0.018 * move;

    this.torso.rotation.y = Math.sin(phase) * 0.035 * move;
  }
}
