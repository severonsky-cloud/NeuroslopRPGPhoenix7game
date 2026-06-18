import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { PLAYER_START } from '../data/worldData.js';
import { heightAt, clampToWorld } from '../world/terrain.js';

export function createPlayer() {
  return {
    name: 'Безымянная ошибка',
    hp: 105, hpMax: 105,
    st: 105, stMax: 105,
    ph: 90, phMax: 90,
    weapon: 'fists',
    ammo: { colt: 12, m1: 18, bren: 24 },
    credits: 18,
    inventory: ['мокрые бумаги', 'тюремный жетон', 'бастард', 'шпага', 'Кольт 1917', 'M1 Гаранд', 'Брен'],
    quest: { rina: false, road: false, oran: false, market: false, factions: false, contraband: false, gerda: false, sava: false },
    flags: { debugIndex: 0 },
    motion: { vx: 0, vz: 0, bob: 0 },
  };
}

export function createPlayerRig(scene) {
  const rig = new THREE.Object3D();
  rig.position.set(PLAYER_START.x, heightAt(PLAYER_START.x, PLAYER_START.z), PLAYER_START.z);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 2200);
  camera.position.set(0, 1.72, 0);
  rig.add(camera);
  scene.add(rig);
  return { rig, camera };
}

export function movePlayer({ rig, input, yaw, dt, player = null, speedWalk = 6.2, speedRun = 10.6 }) {
  const axis = input.axis();
  const motion = player?.motion || { vx: 0, vz: 0, bob: 0 };
  const hasInput = !!(axis.x || axis.z);
  const speed = input.sprinting() ? speedRun : speedWalk;
  const target = new THREE.Vector3(axis.x, 0, axis.z);
  if (target.lengthSq() > 0) target.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiplyScalar(speed);

  const accel = input.sprinting() ? 13.0 : 10.5;
  const drag = hasInput ? accel : 16.0;
  motion.vx = THREE.MathUtils.damp(motion.vx, target.x, drag, dt);
  motion.vz = THREE.MathUtils.damp(motion.vz, target.z, drag, dt);

  const next = clampToWorld(rig.position.x + motion.vx * dt, rig.position.z + motion.vz * dt);
  rig.position.x = next.x;
  rig.position.z = next.z;
  rig.position.y = THREE.MathUtils.lerp(rig.position.y, heightAt(next.x, next.z), 0.32);
  motion.bob += dt * Math.hypot(motion.vx, motion.vz) * 1.35;

  if (player) player.motion = motion;
  return input.sprinting() && hasInput;
}
