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

export function movePlayer({ rig, input, yaw, dt, speedWalk = 5.0, speedRun = 8.2 }) {
  const axis = input.axis();
  if (!axis.x && !axis.z) return false;
  const speed = input.sprinting() ? speedRun : speedWalk;
  const v = new THREE.Vector3(axis.x, 0, axis.z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const next = clampToWorld(rig.position.x + v.x * speed * dt, rig.position.z + v.z * speed * dt);
  rig.position.x = next.x;
  rig.position.z = next.z;
  rig.position.y = THREE.MathUtils.lerp(rig.position.y, heightAt(next.x, next.z), 0.25);
  return input.sprinting();
}
