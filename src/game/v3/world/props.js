import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { heightAt } from './terrain.js';

export function makeMat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.86,
    metalness: options.metalness ?? 0.02,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.opacity !== undefined,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
  });
}

export const Materials = {
  road: makeMat(0x5b4025),
  wood: makeMat(0x3f2718),
  dark: makeMat(0x120c08),
  clayWall: makeMat(0x6b5534),
  roof: makeMat(0x21140d),
  brass: makeMat(0x9b7b3a, { roughness: 0.45, metalness: 0.15 }),
  metal: makeMat(0x2c2b28, { roughness: 0.5, metalness: 0.22 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x8fd8d2, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.45, emissive: 0x245c5a, emissiveIntensity: 0.45 }),
  black: makeMat(0x070509, { emissive: 0x170026, emissiveIntensity: 0.45 }),
  ice: makeMat(0x9fc7d9, { roughness: 0.32, metalness: 0.08 }),
  foliage: makeMat(0x244c32),
};

export function placeBox(scene, x, z, w, d, h, mat = Materials.clayWall, solid = true, colliders = []) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, heightAt(x, z) + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (solid) colliders.push({ x, z, w, d });
  return mesh;
}

export function placeRoadSegment(scene, a, b, width = 5.0) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const y = Math.max(heightAt(a.x, a.z), heightAt(b.x, b.z)) + 0.075;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.065, len), Materials.road);
  mesh.position.set((a.x + b.x) / 2, y, (a.z + b.z) / 2);
  mesh.rotation.y = Math.atan2(dx, dz);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export function placeRoad(scene, points, width = 5.0) {
  for (let i = 0; i < points.length - 1; i++) placeRoadSegment(scene, points[i], points[i + 1], width);
}

export function createInstancedRocks(scene, seedPoints) {
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = makeMat(0x4b3522);
  const mesh = new THREE.InstancedMesh(geo, mat, seedPoints.length);
  const dummy = new THREE.Object3D();
  seedPoints.forEach((p, i) => {
    const s = p.s ?? 0.35;
    dummy.position.set(p.x, heightAt(p.x, p.z) + s * 0.5, p.z);
    dummy.scale.setScalar(s);
    dummy.rotation.set(p.rx ?? 0, p.ry ?? 0, p.rz ?? 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export function createInstancedTsarborTrees(scene, points) {
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.32, 1, 6);
  const trunkMat = makeMat(0x462919);
  const crownGeo = new THREE.ConeGeometry(1.3, 1, 7);
  const crownMat = makeMat(0x244c32, { emissive: 0x0c2215, emissiveIntensity: 0.18 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, points.length);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, points.length);
  const dummy = new THREE.Object3D();
  points.forEach((p, i) => {
    const h = p.h ?? 8;
    dummy.position.set(p.x, heightAt(p.x, p.z) + h / 2, p.z);
    dummy.scale.set(1, h, 1);
    dummy.rotation.set(0, p.ry ?? 0, 0);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p.x, heightAt(p.x, p.z) + h + 1.7, p.z);
    dummy.scale.set(1, 4.3, 1);
    dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
  });
  scene.add(trunks, crowns);
  return { trunks, crowns };
}

export function createInstancedGlassTrees(scene, points) {
  const geo = new THREE.ConeGeometry(0.7, 1, 5);
  const mesh = new THREE.InstancedMesh(geo, Materials.glass, points.length);
  const dummy = new THREE.Object3D();
  points.forEach((p, i) => {
    const h = p.h ?? 7;
    dummy.position.set(p.x, heightAt(p.x, p.z) + h / 2, p.z);
    dummy.scale.set(1, h, 1);
    dummy.rotation.set(0, p.ry ?? 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  scene.add(mesh);
  return mesh;
}

export function labelSprite(scene, text, x, z, yOffset = 3, scale = 1) {
  const cnv = document.createElement('canvas');
  cnv.width = 900;
  cnv.height = 160;
  const c = cnv.getContext('2d');
  c.fillStyle = 'rgba(8,7,5,.76)';
  c.fillRect(0, 0, cnv.width, cnv.height);
  c.strokeStyle = 'rgba(216,181,110,.9)';
  c.lineWidth = 5;
  c.strokeRect(5, 5, cnv.width - 10, cnv.height - 10);
  c.fillStyle = '#f4dca4';
  c.font = '700 36px system-ui';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, cnv.width / 2, cnv.height / 2);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cnv), transparent: true, depthTest: false }));
  sprite.position.set(x, heightAt(x, z) + yOffset, z);
  sprite.scale.set(8.2 * scale, 1.55 * scale, 1);
  sprite.renderOrder = 10;
  scene.add(sprite);
  return sprite;
}
