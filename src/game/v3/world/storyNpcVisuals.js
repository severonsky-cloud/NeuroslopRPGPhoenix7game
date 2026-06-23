import * as THREE from '../vendor/three.module.js';
import { makeMat } from './props.js';

const MAT = {
  brass: makeMat(0xd2a64b, { metalness: 0.25, roughness: 0.45 }),
  paper: makeMat(0xd6bd82, { roughness: 0.92 }),
  ink: makeMat(0x17100b, { roughness: 0.9 }),
  leather: makeMat(0x2b170d, { roughness: 0.88 }),
  redClay: makeMat(0xb84a31, { emissive: 0x3a0e07, emissiveIntensity: 0.32, roughness: 0.82 }),
  fortCoat: makeMat(0x4c453c, { roughness: 0.74 }),
  gerdaBlue: makeMat(0x33425f, { roughness: 0.78 }),
  smugglerDark: makeMat(0x120d0b, { roughness: 0.94 }),
  guideGreen: makeMat(0x31452f, { roughness: 0.84 }),
  glass: makeMat(0x8fd8d0, { emissive: 0x2c7e78, emissiveIntensity: 0.5, transparent: true, opacity: 0.62, roughness: 0.3 }),
  blackGlass: makeMat(0x070511, { emissive: 0x1c0a4d, emissiveIntensity: 0.38, roughness: 0.55 }),
  ice: makeMat(0x9fc7d9, { emissive: 0x31566a, emissiveIntensity: 0.26, roughness: 0.36 }),
  tsarbor: makeMat(0x2d6b3b, { emissive: 0x0b2312, emissiveIntensity: 0.24, roughness: 0.82 }),
  iron: makeMat(0x69655f, { metalness: 0.25, roughness: 0.5 }),
  wood: makeMat(0x4a2f1b, { roughness: 0.88 }),
  sack: makeMat(0x9b7247, { roughness: 0.95 }),
};

function box(g, size, pos, mat, rot = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

function sphere(g, radius, pos, mat, scale = null, segments = 10) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.max(6, Math.floor(segments * 0.7))), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

function cyl(g, radius, depth, pos, mat, rot = null, segments = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, segments), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

function cone(g, radius, height, pos, mat, rot = null, segments = 8) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, segments), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

function torus(g, radius, tube, pos, mat, rot = null) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 24), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

function addCoat(g, mat, trim = MAT.brass) {
  box(g, [0.52, 0.78, 0.08], [0, 1.28, -0.29], mat);
  box(g, [0.055, 0.72, 0.09], [-0.28, 1.28, -0.24], trim);
  box(g, [0.055, 0.72, 0.09], [0.28, 1.28, -0.24], trim);
}

function addPaperwork(g) {
  box(g, [0.34, 0.23, 0.035], [-0.35, 1.14, 0.24], MAT.paper, [0.25, 0.15, 0.05]);
  box(g, [0.2, 0.02, 0.04], [-0.35, 1.19, 0.265], MAT.ink, [0.25, 0.15, 0.05]);
  box(g, [0.16, 0.02, 0.04], [-0.35, 1.12, 0.265], MAT.ink, [0.25, 0.15, 0.05]);
}

function addRina(g) {
  addCoat(g, MAT.fortCoat, MAT.brass);
  box(g, [0.48, 0.06, 0.48], [0, 1.98, 0], MAT.ink);
  cyl(g, 0.19, 0.16, [0, 2.08, 0], MAT.fortCoat, null, 10);
  addPaperwork(g);
  box(g, [0.11, 0.11, 0.045], [0.18, 1.54, -0.235], MAT.brass);
}

function addMerchant(g) {
  addCoat(g, MAT.leather, MAT.redClay);
  sphere(g, 0.17, [0.38, 1.18, 0.24], MAT.sack, [1.25, 0.8, 1.0], 8);
  sphere(g, 0.13, [0.28, 1.38, 0.23], MAT.redClay, [1.0, 0.7, 1.0], 8);
  box(g, [0.38, 0.22, 0.05], [-0.34, 1.2, 0.25], MAT.paper, [0.2, 0.2, 0.08]);
}

function addClayWorker(g) {
  sphere(g, 0.17, [0, 1.52, -0.25], MAT.redClay, [1.2, 1.0, 0.4], 8);
  box(g, [0.46, 0.11, 0.1], [0, 1.22, -0.24], MAT.redClay);
  cyl(g, 0.02, 0.9, [0.44, 1.0, 0.1], MAT.wood, [0.1, 0, -0.38], 6);
  box(g, [0.32, 0.13, 0.055], [0.58, 0.62, 0.1], MAT.iron, [0.1, 0, -0.38]);
}

function addOran(g) {
  addCoat(g, MAT.fortCoat, MAT.iron);
  box(g, [0.46, 0.18, 0.05], [-0.35, 1.2, 0.25], MAT.paper, [0.16, 0.16, 0.06]);
  cyl(g, 0.016, 0.36, [0.32, 1.3, 0.2], MAT.brass, [0.4, 0, -0.65], 6);
  box(g, [0.28, 0.055, 0.04], [0, 1.64, -0.24], MAT.brass);
}

function addGerda(g) {
  addCoat(g, MAT.gerdaBlue, MAT.brass);
  box(g, [0.5, 0.24, 0.08], [0, 1.57, -0.25], MAT.brass);
  box(g, [0.36, 0.2, 0.06], [-0.38, 1.18, 0.2], MAT.paper, [0.18, 0.12, 0.06]);
  torus(g, 0.11, 0.01, [0.26, 1.72, -0.22], MAT.brass, [Math.PI / 2, 0, 0]);
}

function addSava(g) {
  addCoat(g, MAT.guideGreen, MAT.leather);
  cyl(g, 0.022, 1.18, [0.44, 1.04, 0.08], MAT.wood, [0.06, 0, -0.14], 6);
  box(g, [0.32, 0.2, 0.05], [-0.34, 1.15, 0.23], MAT.paper, [0.2, 0.2, 0.08]);
  cone(g, 0.18, 0.35, [0, 2.08, 0], MAT.guideGreen, null, 8);
}

function addSmuggler(g) {
  addCoat(g, MAT.smugglerDark, MAT.leather);
  cone(g, 0.25, 0.38, [0, 2.02, 0], MAT.smugglerDark, null, 7);
  box(g, [0.4, 0.13, 0.09], [-0.14, 1.18, 0.32], MAT.sack, [0.1, 0, 0.08]);
  box(g, [0.055, 0.54, 0.045], [0.42, 0.92, 0.08], MAT.iron, [0, 0, -0.55]);
}

function addTsarborScout(g) {
  addCoat(g, MAT.tsarbor, MAT.green || MAT.tsarbor);
  cone(g, 0.16, 0.55, [0.38, 1.18, 0.16], MAT.tsarbor, [0.2, 0, -0.36], 7);
  sphere(g, 0.1, [0.44, 1.5, 0.16], MAT.tsarbor, [1, 0.7, 1], 8);
  cyl(g, 0.016, 0.86, [-0.42, 1.06, 0.1], MAT.wood, [0.08, 0, 0.2], 6);
}

function addGlassMonk(g) {
  addCoat(g, MAT.blackGlass, MAT.glass);
  sphere(g, 0.21, [0, 1.9, 0], MAT.glass, [0.85, 1.2, 0.85], 10);
  torus(g, 0.34, 0.012, [0, 1.68, 0], MAT.glass, [Math.PI / 2, 0, 0]);
  box(g, [0.2, 0.2, 0.2], [0.34, 1.2, 0.18], MAT.blackGlass, [0.2, 0.3, 0.1]);
}

function addIceRanger(g) {
  addCoat(g, MAT.ice, MAT.iron);
  cone(g, 0.22, 0.44, [0, 2.06, 0], MAT.ice, null, 8);
  box(g, [0.06, 1.05, 0.045], [0.45, 1.05, 0.08], MAT.iron, [0, 0, -0.36]);
  sphere(g, 0.12, [-0.32, 1.48, -0.24], MAT.ice, [1, 0.8, 1], 8);
}

function addWalkerCaravan(g) {
  addCoat(g, MAT.leather, MAT.brass);
  sphere(g, 0.18, [0.36, 1.18, 0.26], MAT.sack, [1.2, 0.85, 1], 8);
  box(g, [0.45, 0.24, 0.08], [-0.34, 1.18, 0.24], MAT.paper, [0.25, 0.16, 0.08]);
  cyl(g, 0.018, 1.08, [0.48, 1.0, 0.08], MAT.wood, [0.08, 0, -0.16], 6);
}

function upgradeOne(npc) {
  if (!npc?.userData) return false;
  if (npc.getObjectByName('v3n3StoryNpcVisualUpgrade')) return false;
  const u = npc.userData;
  const g = new THREE.Group();
  g.name = 'v3n3StoryNpcVisualUpgrade';

  if (u.id === 'rina') addRina(g);
  else if (u.id === 'merchant') addMerchant(g);
  else if (u.id === 'dockPeasant') addClayWorker(g);
  else if (u.id === 'oran') addOran(g);
  else if (u.id === 'gerda') addGerda(g);
  else if (u.id === 'sava') addSava(g);
  else if (u.id === 'smuggler') addSmuggler(g);
  else if (u.id === 'tsarborScout') addTsarborScout(g);
  else if (u.id === 'glassMonk') addGlassMonk(g);
  else if (u.id === 'iceRanger') addIceRanger(g);
  else if (u.id === 'caravan') addWalkerCaravan(g);
  else addCoat(g, MAT.leather, MAT.brass);

  if (!g.children.length) return false;
  npc.add(g);
  u.visualTier = 'v3N3_story_npc_model';
  return true;
}

export function upgradeStoryNpcVisuals(npcs = []) {
  let upgraded = 0;
  for (const npc of npcs) {
    if (upgradeOne(npc)) upgraded++;
  }
  return { version: 'v3N3', upgraded, total: npcs.length };
}
