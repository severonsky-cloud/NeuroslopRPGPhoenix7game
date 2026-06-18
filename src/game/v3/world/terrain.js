import * as THREE from '../vendor/three.module.js';
import { WORLD_BOUNDS } from '../data/worldData.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ridge = (x, z, sx, sz, amp) => Math.sin(x * sx + Math.cos(z * sz) * 1.7) * amp;

export function heightAt(x, z) {
  const inland = smoothstep(-150, 70, x);
  const beachDrop = -1.5 * (1 - smoothstep(-175, -105, x));
  const clayRoll = ridge(x, z, 0.023, 0.018, 1.7) + ridge(x + 50, z - 35, 0.052, 0.038, 0.72);
  const mangroveLow = -2.35 * Math.exp(-(((x + 66) ** 2) / 2100 + ((z - 136) ** 2) / 1900));
  const redRoadRise = 1.4 * Math.exp(-(((x - 30) ** 2) / 3300 + ((z - 92) ** 2) / 2600));
  const fortRise = 5.4 * Math.exp(-(((x - 142) ** 2) / 2400 + ((z - 176) ** 2) / 1800));
  const batteryRidge = 2.4 * Math.exp(-(((x - 82) ** 2) / 1200 + ((z - 78) ** 2) / 700));
  const tsarborRidge = 3.3 * Math.exp(-(((x - 174) ** 2) / 3100 + ((z - 248) ** 2) / 2400));
  const savannaRise = 2.8 * Math.exp(-(((x - 250) ** 2) / 5200 + ((z - 250) ** 2) / 4200)) + 1.2 * smoothstep(120, 260, x);
  const glassPlateau = 4.3 * Math.exp(-(((x - 288) ** 2) / 1900 + ((z - 112) ** 2) / 1400));
  const iceShelf = 2.9 * Math.exp(-(((x - 205) ** 2) / 3200 + ((z + 145) ** 2) / 1900));
  const coastCliff = 1.7 * Math.exp(-(((x + 112) ** 2) / 340 + ((z - 18) ** 2) / 7200));
  return beachDrop + inland * clayRoll + mangroveLow + redRoadRise + fortRise + batteryRidge + tsarborRidge + savannaRise + glassPlateau + iceShelf + coastCliff;
}

export function biomeAt(x, z) {
  if (x < -160) return 'ocean';
  if (x < -108) return 'beach';
  if (x < -20 && z > 70) return 'mangrove';
  if (x > 118 && x < 175 && z > 135 && z < 220) return 'fort';
  if (x > 205 && z > 205) return 'savanna';
  if (x > 130 && z > 220) return 'tsarbor';
  if (x > 230 && z > 45 && z < 160) return 'glass';
  if (x > 120 && z < -70) return 'ice';
  if (x > 30 && z < 10) return 'rednode';
  if (x > 45 && z > 55 && z < 130) return 'redroad';
  if (x > 58 && z > 40 && z < 110) return 'battery';
  if (x < -36 && z < 70) return 'port';
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
    rednode: 0x713224,
    redroad: 0x5b4025,
    port: 0x93401f,
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
  mesh.name = 'v3_terrain_far_fort';
  return mesh;
}

export function clampToWorld(x, z) {
  return {
    x: clamp(x, WORLD_BOUNDS.minX + 2, WORLD_BOUNDS.maxX - 2),
    z: clamp(z, WORLD_BOUNDS.minZ + 2, WORLD_BOUNDS.maxZ - 2),
  };
}
