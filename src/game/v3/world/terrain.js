import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { WORLD_BOUNDS } from '../data/worldData.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ridge = (x, z, sx, sz, amp) => Math.sin(x * sx + Math.cos(z * sz) * 1.7) * amp;

export function heightAt(x, z) {
  const inland = smoothstep(-140, 60, x);
  const beachDrop = -1.45 * (1 - smoothstep(-160, -100, x));
  const clayRoll = ridge(x, z, 0.025, 0.020, 1.7) + ridge(x + 50, z - 35, 0.058, 0.042, 0.72);
  const mangroveLow = -2.35 * Math.exp(-(((x + 54) ** 2) / 1800 + ((z - 128) ** 2) / 1700));
  const fortRise = 4.5 * Math.exp(-(((x - 40) ** 2) / 2100 + ((z - 56) ** 2) / 1350));
  const batteryRidge = 2.8 * Math.exp(-(((x - 82) ** 2) / 1000 + ((z - 6) ** 2) / 480));
  const savannaRise = 2.2 * smoothstep(45, 180, x) + 1.7 * smoothstep(70, 205, z);
  const tsarborRidge = 3.2 * Math.exp(-(((x - 168) ** 2) / 2800 + ((z - 190) ** 2) / 2100));
  const glassPlateau = 4.2 * Math.exp(-(((x - 226) ** 2) / 1700 + ((z - 72) ** 2) / 1300));
  const iceShelf = 2.9 * Math.exp(-(((x - 190) ** 2) / 2800 + ((z + 118) ** 2) / 1700));
  const coastCliff = 1.5 * Math.exp(-(((x + 96) ** 2) / 280 + ((z - 12) ** 2) / 6500));
  return beachDrop + inland * clayRoll + fortRise + batteryRidge + savannaRise + tsarborRidge + glassPlateau + iceShelf + mangroveLow + coastCliff;
}

export function biomeAt(x, z) {
  if (x < -150) return 'ocean';
  if (x < -100) return 'beach';
  if (x < -20 && z > 70) return 'mangrove';
  if (x > 122 && z > 132) return 'tsarbor';
  if (x > 170 && z > 12 && z < 112) return 'glass';
  if (x > 124 && z < -58) return 'ice';
  if (x > 65 && z > 60) return 'savanna';
  if (x > 38 && z < 22) return 'battery';
  if (x > 0 && z > 18 && z < 76) return 'fort';
  return 'clay';
}

export function biomeColor(id) {
  const table = {
    ocean: 0x12384d,
    beach: 0xb46b3d,
    mangrove: 0x344d2c,
    tsarbor: 0x234936,
    glass: 0x5fa6a4,
    ice: 0x9fc7d9,
    savanna: 0x7a5732,
    battery: 0x5c4630,
    fort: 0x70492b,
    clay: 0x93401f,
  };
  return table[id] ?? table.clay;
}

export function terrainColorAt(x, z) {
  return new THREE.Color(biomeColor(biomeAt(x, z)));
}

export function createTerrainMesh({ segmentsX = 170, segmentsZ = 140 } = {}) {
  const w = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
  const d = WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ;
  const geo = new THREE.PlaneGeometry(w, d, segmentsX, segmentsZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate((WORLD_BOUNDS.maxX + WORLD_BOUNDS.minX) / 2, 0, (WORLD_BOUNDS.maxZ + WORLD_BOUNDS.minZ) / 2);

  const pos = geo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, heightAt(x, z));
    const c = terrainColorAt(x, z);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0.02 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'v3_terrain';
  return mesh;
}

export function clampToWorld(x, z) {
  return {
    x: clamp(x, WORLD_BOUNDS.minX + 2, WORLD_BOUNDS.maxX - 2),
    z: clamp(z, WORLD_BOUNDS.minZ + 2, WORLD_BOUNDS.maxZ - 2),
  };
}
