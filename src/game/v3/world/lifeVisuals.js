import * as THREE from '../vendor/three.module.js';
import { makeMat } from './props.js';

const MAT = {
  iron: makeMat(0x777067, { metalness: 0.35, roughness: 0.42 }),
  darkIron: makeMat(0x252321, { metalness: 0.28, roughness: 0.5 }),
  brass: makeMat(0xd1a84d, { metalness: 0.35, roughness: 0.36 }),
  leather: makeMat(0x2a170d, { roughness: 0.86 }),
  clothDark: makeMat(0x17110c, { roughness: 0.92 }),
  clothRed: makeMat(0x7f2419, { roughness: 0.88 }),
  clayGlow: makeMat(0xc34d31, { emissive: 0x4a1108, emissiveIntensity: 0.42, roughness: 0.8 }),
  zhuzherShell: makeMat(0x5f642c, { roughness: 0.72, metalness: 0.05 }),
  soundGold: makeMat(0xd8b56e, { emissive: 0x4b3510, emissiveIntensity: 0.28, roughness: 0.5 }),
  errorViolet: makeMat(0x8a78ff, { emissive: 0x321bff, emissiveIntensity: 0.62, roughness: 0.35 }),
  phaseViolet: makeMat(0x8a78ff, { emissive: 0x4d16ff, emissiveIntensity: 0.95, transparent: true, opacity: 0.82 }),
  mapPaper: makeMat(0xd3b879, { roughness: 0.9 }),
  wood: makeMat(0x4a2f1b, { roughness: 0.88 }),
  sack: makeMat(0x9b7247, { roughness: 0.95 }),
  glass: makeMat(0x8fd8d0, { emissive: 0x2c7e78, emissiveIntensity: 0.42, transparent: true, opacity: 0.64 }),
  blackGlass: makeMat(0x070511, { emissive: 0x1c0a4d, emissiveIntensity: 0.35, roughness: 0.55 }),
  green: makeMat(0x2d6b3b, { emissive: 0x0b2312, emissiveIntensity: 0.22, roughness: 0.78 }),
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

function addBanner(g, colorMat, symbol = 'bar') {
  cyl(g, 0.018, 1.45, [-0.52, 1.25, 0.16], MAT.wood, [0.12, 0, 0.05], 6);
  box(g, [0.38, 0.28, 0.035], [-0.34, 1.72, 0.16], colorMat);
  if (symbol === 'cross') {
    box(g, [0.23, 0.035, 0.045], [-0.34, 1.72, 0.185], MAT.brass);
    box(g, [0.035, 0.2, 0.045], [-0.34, 1.72, 0.19], MAT.brass);
  }
  if (symbol === 'glitch') {
    box(g, [0.26, 0.035, 0.045], [-0.34, 1.78, 0.185], MAT.errorViolet, [0, 0, 0.35]);
    box(g, [0.18, 0.035, 0.045], [-0.34, 1.65, 0.185], MAT.errorViolet, [0, 0, -0.28]);
  }
}

function addRifle(g, mat = MAT.darkIron) {
  box(g, [0.055, 1.0, 0.055], [0.46, 1.14, 0.1], mat, [0, 0, -0.42]);
  box(g, [0.085, 0.26, 0.06], [0.34, 0.72, 0.1], MAT.wood, [0, 0, -0.42]);
  box(g, [0.035, 0.24, 0.035], [0.64, 1.54, 0.1], mat, [0, 0, -0.42]);
}

function addSwordAndShield(g, accentMat = MAT.brass) {
  box(g, [0.045, 1.12, 0.045], [0.48, 1.05, 0.05], MAT.iron, [0, 0, -0.36]);
  box(g, [0.19, 0.055, 0.055], [0.36, 0.72, 0.05], MAT.brass, [0, 0, -0.36]);
  const shield = box(g, [0.42, 0.58, 0.08], [-0.42, 1.14, 0.02], MAT.darkIron, [0.05, 0.1, 0]);
  shield.scale.x = 0.8;
  box(g, [0.3, 0.055, 0.09], [-0.42, 1.14, 0.075], accentMat);
  box(g, [0.055, 0.36, 0.09], [-0.42, 1.14, 0.08], accentMat);
}

function addCaravanCargo(g, u) {
  box(g, [0.86, 0.22, 0.42], [0, 1.15, 1.12], MAT.wood);
  sphere(g, 0.18, [-0.34, 1.38, 1.05], MAT.sack, [1.2, 0.75, 1.0], 8);
  sphere(g, 0.18, [0.18, 1.39, 1.22], MAT.sack, [1.0, 0.72, 1.2], 8);
  if (u.faction === 'redPeasants') {
    sphere(g, 0.12, [0.42, 1.42, 1.0], MAT.clayGlow, [1, 0.72, 1], 8);
    addBanner(g, MAT.clothRed, 'bar');
  } else if (u.faction === 'blueElementals') {
    torus(g, 0.22, 0.014, [0.38, 1.42, 1.04], MAT.phaseViolet, [Math.PI / 2, 0, 0]);
    sphere(g, 0.1, [0.38, 1.42, 1.04], MAT.glass, null, 8);
  } else if (u.faction === 'blackElementals') {
    box(g, [0.32, 0.24, 0.32], [0.34, 1.38, 1.05], MAT.blackGlass, [0.2, 0.1, 0.1]);
  } else {
    addBanner(g, MAT.mapPaper, 'bar');
  }
}

function addEmpire(g, u) {
  box(g, [0.52, 0.06, 0.52], [0, 1.96, 0], MAT.darkIron);
  cyl(g, 0.21, 0.18, [0, 2.06, 0], MAT.iron, null, 10);
  box(g, [0.62, 0.06, 0.12], [0, 1.98, -0.16], MAT.brass);
  box(g, [0.08, 0.72, 0.08], [-0.32, 1.2, 0.03], MAT.leather, [0, 0, 0.12]);
  box(g, [0.08, 0.72, 0.08], [0.32, 1.2, 0.03], MAT.leather, [0, 0, -0.12]);
  addRifle(g, MAT.darkIron);
  if (u.role === 'guard') addBanner(g, MAT.brass, 'cross');
}

function addRedPeasant(g, u) {
  sphere(g, 0.16, [0, 1.52, -0.26], MAT.clayGlow, [0.9, 1.35, 0.35], 8);
  box(g, [0.52, 0.08, 0.1], [0, 1.36, -0.21], MAT.clayGlow);
  cone(g, 0.12, 0.36, [-0.32, 1.78, 0.05], MAT.clayGlow, [0.25, 0.1, 0.55], 6);
  cone(g, 0.1, 0.32, [0.32, 1.74, 0.05], MAT.clayGlow, [0.25, 0.1, -0.55], 6);
  if (u.role === 'worker') {
    box(g, [0.06, 0.82, 0.06], [0.45, 1.02, 0.1], MAT.wood, [0, 0, -0.35]);
    box(g, [0.28, 0.12, 0.06], [0.58, 0.66, 0.1], MAT.darkIron, [0, 0, -0.35]);
  }
}

function addBandit(g) {
  box(g, [0.52, 0.36, 0.08], [0, 1.45, -0.28], MAT.clothDark);
  cone(g, 0.27, 0.36, [0, 2.03, 0], MAT.clothDark, null, 6);
  box(g, [0.035, 0.52, 0.04], [0.43, 0.92, 0.08], MAT.iron, [0, 0, -0.55]);
  box(g, [0.18, 0.08, 0.05], [0.29, 0.68, 0.08], MAT.leather, [0, 0, -0.55]);
  box(g, [0.4, 0.14, 0.08], [-0.12, 1.18, 0.31], MAT.sack, [0.12, 0, 0.08]);
}

function addZhuzher(g) {
  sphere(g, 0.34, [0, 1.2, -0.08], MAT.zhuzherShell, [1.15, 1.35, 0.75], 10);
  sphere(g, 0.23, [0, 1.86, 0.03], MAT.zhuzherShell, [1.0, 0.82, 1.08], 10);
  cyl(g, 0.018, 0.72, [-0.12, 2.22, 0.03], MAT.zhuzherShell, [0.65, 0.12, 0.25], 6);
  cyl(g, 0.018, 0.72, [0.12, 2.22, 0.03], MAT.zhuzherShell, [0.65, -0.12, -0.25], 6);
  box(g, [0.08, 0.26, 0.06], [-0.12, 1.68, -0.18], MAT.darkIron, [0.2, 0.1, 0.35]);
  box(g, [0.08, 0.26, 0.06], [0.12, 1.68, -0.18], MAT.darkIron, [0.2, -0.1, -0.35]);
  for (let i = 0; i < 4; i++) {
    const side = i < 2 ? -1 : 1;
    const z = i % 2 ? 0.18 : -0.12;
    cyl(g, 0.018, 0.62, [side * 0.36, 0.98, z], MAT.zhuzherShell, [0.9, 0, side * 0.6], 6);
  }
  addRifle(g, MAT.iron);
}

function addKnight(g, u) {
  const accent = u.faction === 'soundOrder' ? MAT.soundGold : u.faction === 'errorOrder' ? MAT.errorViolet : MAT.brass;
  box(g, [0.54, 0.42, 0.18], [0, 1.34, -0.08], MAT.iron);
  sphere(g, 0.26, [0, 1.95, 0], MAT.darkIron, [1, 0.78, 1], 10);
  box(g, [0.58, 0.08, 0.14], [0, 1.52, -0.19], accent);
  sphere(g, 0.16, [-0.42, 1.42, 0], MAT.iron, [1.2, 0.75, 1.0], 8);
  sphere(g, 0.16, [0.42, 1.42, 0], MAT.iron, [1.2, 0.75, 1.0], 8);
  addSwordAndShield(g, accent);
  if (u.faction === 'soundOrder') {
    cyl(g, 0.012, 0.48, [0.0, 2.24, 0.05], MAT.soundGold, [0.1, 0, 0], 6);
    sphere(g, 0.07, [-0.08, 2.43, 0.05], MAT.soundGold, null, 8);
    sphere(g, 0.07, [0.08, 2.43, 0.05], MAT.soundGold, null, 8);
  }
  if (u.faction === 'errorOrder') {
    box(g, [0.22, 0.035, 0.05], [-0.05, 2.22, 0.05], MAT.errorViolet, [0.2, 0.1, 0.75]);
    box(g, [0.18, 0.035, 0.05], [0.1, 2.34, 0.05], MAT.errorViolet, [0.1, 0.2, -0.55]);
  }
}

function addPhaseMage(g) {
  box(g, [0.48, 0.56, 0.08], [0, 1.38, -0.27], MAT.errorViolet);
  cyl(g, 0.018, 1.32, [0.46, 1.2, 0.12], MAT.wood, [0.05, 0, -0.12], 6);
  sphere(g, 0.12, [0.51, 1.88, 0.12], MAT.phaseViolet, null, 10);
  torus(g, 0.34, 0.012, [0, 1.52, 0], MAT.phaseViolet, [Math.PI / 2, 0, 0]);
  torus(g, 0.46, 0.01, [0, 1.52, 0], MAT.phaseViolet, [1.2, 0.4, 0.1]);
}

function addTraveler(g) {
  box(g, [0.42, 0.5, 0.06], [0, 1.34, -0.27], MAT.mapPaper, [0.05, 0, 0]);
  box(g, [0.34, 0.22, 0.04], [-0.34, 1.18, 0.24], MAT.mapPaper, [0.3, 0.2, 0.15]);
  cyl(g, 0.018, 1.1, [0.44, 1.04, 0.08], MAT.wood, [0.06, 0, -0.12], 6);
  torus(g, 0.12, 0.008, [-0.34, 1.22, 0.275], MAT.brass, [Math.PI / 2, 0, 0]);
}

function addTsarbor(g) {
  box(g, [0.5, 0.48, 0.08], [0, 1.34, -0.28], MAT.green);
  cone(g, 0.18, 0.65, [0.36, 1.2, 0.17], MAT.green, [0.2, 0, -0.32], 7);
  cyl(g, 0.022, 0.9, [-0.44, 1.08, 0.1], MAT.wood, [0.08, 0, 0.2], 6);
  sphere(g, 0.11, [-0.5, 1.55, 0.1], MAT.green, [1, 0.7, 1], 8);
}

function addBlackElemental(g) {
  sphere(g, 0.28, [0, 1.24, -0.06], MAT.blackGlass, [0.82, 1.55, 0.82], 10);
  torus(g, 0.33, 0.012, [0, 1.76, 0.02], MAT.errorViolet, [Math.PI / 2, 0, 0]);
  box(g, [0.36, 0.22, 0.36], [0.35, 1.22, 0.18], MAT.blackGlass, [0.2, 0.4, 0.1]);
}

function upgradeOne(agent) {
  if (!agent || !agent.userData) return false;
  if (agent.getObjectByName('v3n3LifeVisualUpgrade')) return false;
  const u = agent.userData;
  const g = new THREE.Group();
  g.name = 'v3n3LifeVisualUpgrade';

  if (u.role === 'caravan') addCaravanCargo(g, u);
  if (u.faction === 'empire') addEmpire(g, u);
  if (u.faction === 'redPeasants' || u.faction === 'peasants' || u.faction === 'rebels') addRedPeasant(g, u);
  if (u.faction === 'bandits') addBandit(g, u);
  if (u.faction === 'zhuzher') addZhuzher(g, u);
  if (u.role === 'knight' || u.role === 'orderKnight') addKnight(g, u);
  if (u.faction === 'phaseGuild') addPhaseMage(g);
  if (u.faction === 'travelers' && u.role !== 'caravan') addTraveler(g);
  if (u.faction === 'tsarbor') addTsarbor(g);
  if (u.faction === 'blackElementals') addBlackElemental(g);
  if (u.faction === 'blueElementals' && u.role !== 'caravan') {
    torus(g, 0.32, 0.012, [0, 1.5, 0], MAT.glass, [Math.PI / 2, 0, 0]);
    sphere(g, 0.13, [0, 1.56, -0.22], MAT.glass, null, 8);
  }

  if (!g.children.length) return false;
  agent.add(g);
  u.visualTier = 'v3N3_procedural_life_model';
  return true;
}

export function upgradeLivingWorldVisuals(livingWorld) {
  if (!livingWorld?.agents?.length) return { upgraded: 0, total: 0 };
  let upgraded = 0;
  for (const agent of livingWorld.agents) {
    if (upgradeOne(agent)) upgraded++;
  }
  livingWorld.visualUpgrade = { version: 'v3N3', upgraded, total: livingWorld.agents.length };
  livingWorld.logEvent?.(`v3N3: процедурные модели NPC улучшены (${upgraded}/${livingWorld.agents.length}).`);
  return livingWorld.visualUpgrade;
}
