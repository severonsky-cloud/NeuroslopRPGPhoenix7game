import * as THREE from '../vendor/three.module.js';
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
    polygonOffset: options.polygonOffset ?? false,
    polygonOffsetFactor: options.polygonOffsetFactor ?? 0,
    polygonOffsetUnits: options.polygonOffsetUnits ?? 0,
  });
}

export const Materials = {
  road: makeMat(0x68452a, { roughness: 0.98, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2, side: THREE.DoubleSide }),
  roadEdge: makeMat(0x472d1c, { roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, side: THREE.DoubleSide }),
  roadShoulder: makeMat(0x7b4a2d, { roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, side: THREE.DoubleSide }),
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

function roadSample(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function pushRoadQuad(vertices, uvs, indices, left0, right0, left1, right1) {
  const base = vertices.length / 3;
  vertices.push(left0.x, left0.y, left0.z, right0.x, right0.y, right0.z, left1.x, left1.y, left1.z, right1.x, right1.y, right1.z);
  uvs.push(0, 0, 1, 0, 0, 1, 1, 1);
  indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
}

export function placeRoadSegment(scene, a, b, width = 5.0) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.05) return null;

  const steps = Math.max(3, Math.ceil(len / 3.2));
  const half = width * 0.5;
  const edgeInset = Math.min(0.55, width * 0.14);
  const nx = -dz / len;
  const nz = dx / len;
  const vertices = [];
  const uvs = [];
  const indices = [];
  const edgeVertices = [];
  const edgeUvs = [];
  const edgeIndices = [];
  const shoulderVertices = [];
  const shoulderUvs = [];
  const shoulderIndices = [];

  let prevLeft = null, prevRight = null, prevEdgeL0 = null, prevEdgeL1 = null, prevEdgeR0 = null, prevEdgeR1 = null;
  let prevShoulderL0 = null, prevShoulderL1 = null, prevShoulderR0 = null, prevShoulderR1 = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = roadSample(a, b, t);
    const crown = Math.sin(t * Math.PI) * 0.006;
    const left = { x: p.x + nx * half, z: p.z + nz * half };
    const right = { x: p.x - nx * half, z: p.z - nz * half };
    left.y = heightAt(left.x, left.z) + 0.008 + crown;
    right.y = heightAt(right.x, right.z) + 0.008 + crown;

    const edgeL0 = { x: p.x + nx * half, z: p.z + nz * half };
    const edgeL1 = { x: p.x + nx * (half - edgeInset), z: p.z + nz * (half - edgeInset) };
    const edgeR0 = { x: p.x - nx * half, z: p.z - nz * half };
    const edgeR1 = { x: p.x - nx * (half - edgeInset), z: p.z - nz * (half - edgeInset) };
    for (const q of [edgeL0, edgeL1, edgeR0, edgeR1]) q.y = heightAt(q.x, q.z) + 0.014;

    const shoulderWidth = 0.78;
    const shoulderL0 = { x: p.x + nx * (half + shoulderWidth), z: p.z + nz * (half + shoulderWidth) };
    const shoulderL1 = { x: p.x + nx * half, z: p.z + nz * half };
    const shoulderR0 = { x: p.x - nx * half, z: p.z - nz * half };
    const shoulderR1 = { x: p.x - nx * (half + shoulderWidth), z: p.z - nz * (half + shoulderWidth) };
    for (const q of [shoulderL0, shoulderL1, shoulderR0, shoulderR1]) q.y = heightAt(q.x, q.z) + 0.006;

    if (prevLeft) {
      pushRoadQuad(vertices, uvs, indices, prevLeft, prevRight, left, right);
      pushRoadQuad(edgeVertices, edgeUvs, edgeIndices, prevEdgeL0, prevEdgeL1, edgeL0, edgeL1);
      pushRoadQuad(edgeVertices, edgeUvs, edgeIndices, prevEdgeR1, prevEdgeR0, edgeR1, edgeR0);
      pushRoadQuad(shoulderVertices, shoulderUvs, shoulderIndices, prevShoulderL0, prevShoulderL1, shoulderL0, shoulderL1);
      pushRoadQuad(shoulderVertices, shoulderUvs, shoulderIndices, prevShoulderR0, prevShoulderR1, shoulderR0, shoulderR1);
    }
    prevLeft = left; prevRight = right;
    prevEdgeL0 = edgeL0; prevEdgeL1 = edgeL1; prevEdgeR0 = edgeR0; prevEdgeR1 = edgeR1;
    prevShoulderL0 = shoulderL0; prevShoulderL1 = shoulderL1;
    prevShoulderR0 = shoulderR0; prevShoulderR1 = shoulderR1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, Materials.road);
  mesh.name = 'terrain_hugging_road_segment';
  mesh.receiveShadow = true;
  scene.add(mesh);

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));
  edgeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(edgeUvs, 2));
  edgeGeo.setIndex(edgeIndices);
  edgeGeo.computeVertexNormals();
  const edgeMesh = new THREE.Mesh(edgeGeo, Materials.roadEdge);
  edgeMesh.name = 'road_embedded_edges';
  edgeMesh.receiveShadow = true;
  scene.add(edgeMesh);

  const shoulderGeo = new THREE.BufferGeometry();
  shoulderGeo.setAttribute('position', new THREE.Float32BufferAttribute(shoulderVertices, 3));
  shoulderGeo.setAttribute('uv', new THREE.Float32BufferAttribute(shoulderUvs, 2));
  shoulderGeo.setIndex(shoulderIndices);
  shoulderGeo.computeVertexNormals();
  const shoulderMesh = new THREE.Mesh(shoulderGeo, Materials.roadShoulder);
  shoulderMesh.name = 'road-grounded-dirt-shoulders';
  shoulderMesh.receiveShadow = true;
  scene.add(shoulderMesh);
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
