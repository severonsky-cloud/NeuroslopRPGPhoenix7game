import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { heightAt } from '../world/terrain.js';
import { makeMat } from '../world/props.js';

export function createNpc(scene, data) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 1.15, 4, 8), makeMat(data.color ?? 0x8ca3bf));
  body.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), makeMat(0xd3ad78));
  head.position.y = 1.88;
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.18), makeMat(0x24170f));
  pack.position.set(0, 1.12, 0.36);
  group.add(body, head, pack);
  group.position.set(data.x, heightAt(data.x, data.z), data.z);
  group.userData = {
    type: 'npc',
    ...data,
    routeIndex: 1,
    speed: data.speed ?? 1.2,
  };
  scene.add(group);
  return group;
}

export function updateNpcRoutes(npcs, dt) {
  for (const obj of npcs) {
    const u = obj.userData;
    if (!u.route || !u.route.length) continue;
    const target = u.route[u.routeIndex % u.route.length];
    const d = Math.hypot(target.x - u.x, target.z - u.z);
    if (d < 0.7) {
      u.routeIndex++;
      continue;
    }
    u.x += (target.x - u.x) / d * dt * u.speed;
    u.z += (target.z - u.z) / d * dt * u.speed;
    obj.position.set(u.x, heightAt(u.x, u.z), u.z);
    obj.lookAt(target.x, heightAt(target.x, target.z) + 1, target.z);
  }
}
