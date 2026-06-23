import * as THREE from '../vendor/three.module.js';
import { ARSENAL } from '../combat/arsenal.js';
import { makeMat } from '../world/props.js';

function clamp01(value) { return Math.max(0, Math.min(1, value)); }
function smooth01(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function mats() {
  return {
    dark: makeMat(0x0b0c0b, { roughness: 0.76, metalness: 0.1 }),
    steel: makeMat(0x898a84, { roughness: 0.42, metalness: 0.46 }),
    blue: makeMat(0x303a40, { roughness: 0.38, metalness: 0.52 }),
    brass: makeMat(0xc29a50, { roughness: 0.42, metalness: 0.28 }),
    wood: makeMat(0x68411f, { roughness: 0.86 }),
    redWood: makeMat(0x7b3e22, { roughness: 0.86 }),
    bakelite: makeMat(0x3a1b13, { roughness: 0.8 }),
    rubber: makeMat(0x141414, { roughness: 0.9, metalness: 0.04 }),
  };
}

function box(parent, name, size, material, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  mesh.frustumCulled = false;
  mesh.renderOrder = 31;
  mesh.userData.basePosition = mesh.position.clone();
  mesh.userData.baseRotation = mesh.rotation.clone();
  parent.add(mesh);
  return mesh;
}

function cyl(parent, name, radius, length, material, pos = [0, 0, 0], axis = 'z', segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
  mesh.name = name;
  mesh.position.set(...pos);
  mesh.rotation.set(axis === 'z' ? Math.PI / 2 : 0, 0, axis === 'x' ? Math.PI / 2 : 0);
  mesh.frustumCulled = false;
  mesh.renderOrder = 31;
  mesh.userData.basePosition = mesh.position.clone();
  mesh.userData.baseRotation = mesh.rotation.clone();
  parent.add(mesh);
  return mesh;
}

function cone(parent, name, radius, length, material, pos = [0, 0, 0], axis = 'z', segments = 12) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, length, segments), material);
  mesh.name = name;
  mesh.position.set(...pos);
  mesh.rotation.set(axis === 'z' ? -Math.PI / 2 : 0, 0, axis === 'x' ? Math.PI / 2 : 0);
  mesh.frustumCulled = false;
  mesh.renderOrder = 31;
  mesh.userData.basePosition = mesh.position.clone();
  mesh.userData.baseRotation = mesh.rotation.clone();
  parent.add(mesh);
  return mesh;
}

function resetPart(part) {
  if (!part) return;
  const bp = part.userData.basePosition;
  const br = part.userData.baseRotation;
  if (bp) part.position.copy(bp);
  if (br) part.rotation.copy(br);
  part.visible = true;
}

function addBipod(group, x, y, z, m, spread = 0.17, height = 0.28) {
  const left = cyl(group, 'polish-bipod-left', 0.012, height, m.steel, [x - spread, y - height * 0.5, z], 'y', 8);
  const right = cyl(group, 'polish-bipod-right', 0.012, height, m.steel, [x + spread, y - height * 0.5, z], 'y', 8);
  left.rotation.z = 0.28;
  right.rotation.z = -0.28;
  return [left, right];
}

function addSlingLoops(group, x, y, zA, zB, m) {
  box(group, 'polish-sling-loop-front', [0.11, 0.012, 0.018], m.brass, [x, y, zA]);
  box(group, 'polish-sling-loop-rear', [0.11, 0.012, 0.018], m.brass, [x, y, zB]);
}

function decorateRifle(group, id, aimMode, m, parts) {
  const x = aimMode ? 0 : 0.15;
  const y = aimMode ? -0.29 : -0.35;
  const z = -0.72;
  const mosin = id === 'mosin9130';
  const lee = id === 'leeEnfieldNo4';
  const garand = id === 'm1GarandWw2' || id === 'garand';
  const k98 = id === 'k98k';
  box(group, `polish-${id}-stock-comb`, [0.16, 0.08, garand ? 0.7 : 0.62], m.wood, [x, y - 0.11, z + 0.35], [-0.035, 0, 0]);
  box(group, `polish-${id}-handguard`, [0.155, 0.08, lee ? 0.76 : 0.64], lee ? m.redWood : m.wood, [x, y + 0.055, z - 0.55]);
  cyl(group, `polish-${id}-thin-front-barrel`, mosin ? 0.02 : 0.024, mosin ? 1.12 : 0.95, m.blue, [x, y + 0.07, z - 1.08], 'z', 12);
  parts.bolt = parts.bolt || box(group, `polish-${id}-bolt`, [0.1, 0.045, 0.2], m.steel, [x + 0.055, y + 0.105, z - 0.02]);
  parts.boltHandle = parts.boltHandle || cyl(group, `polish-${id}-bolt-handle`, 0.016, 0.13, m.steel, [x + 0.13, y + 0.07, z + 0.02], 'x', 8);
  if (k98 || mosin || lee) {
    box(group, `polish-${id}-internal-mag-floorplate`, [0.12, 0.035, 0.23], m.dark, [x, y - 0.12, z - 0.02]);
    box(group, `polish-${id}-stripper-clip`, [0.13, 0.025, 0.045], m.brass, [x, y + 0.145, z + 0.02]);
  }
  if (garand) {
    parts.clip = box(group, 'polish-garand-enbloc-clip', [0.12, 0.026, 0.095], m.brass, [x, y + 0.135, z - 0.02]);
  }
  addSlingLoops(group, x - 0.11, y - 0.03, z - 1.03, z + 0.42, m);
  if (k98 || mosin || garand) box(group, `polish-${id}-bayonet-lug`, [0.09, 0.035, 0.055], m.steel, [x, y - 0.02, z - 1.36]);
}

function decorateShotgun(group, id, aimMode, m, parts) {
  const x = aimMode ? 0 : 0.18;
  const y = aimMode ? -0.29 : -0.38;
  const z = -0.72;
  const doubleBarrel = id === 'doubleBarrelSawedOff';
  const auto5 = id === 'browningAuto5';
  if (doubleBarrel) {
    cyl(group, 'polish-double-barrel-left', 0.035, 0.72, m.blue, [x - 0.045, y + 0.04, z - 0.56], 'z', 12);
    cyl(group, 'polish-double-barrel-right', 0.035, 0.72, m.blue, [x + 0.045, y + 0.04, z - 0.56], 'z', 12);
    parts.hinge = box(group, 'polish-double-hinge', [0.18, 0.09, 0.08], m.brass, [x, y - 0.02, z - 0.14]);
    parts.barrelBreak = group;
    return;
  }
  if (auto5) {
    box(group, 'polish-auto5-humpback-receiver', [0.2, 0.22, 0.32], m.blue, [x, y + 0.055, z - 0.05]);
    parts.bolt = box(group, 'polish-auto5-moving-bolt', [0.12, 0.045, 0.18], m.steel, [x + 0.055, y + 0.15, z + 0.02]);
  }
  parts.pump = box(group, 'polish-shotgun-pump-slide', [0.22, 0.13, 0.34], m.wood, [x, y - 0.05, z - 0.42]);
  cyl(group, 'polish-shotgun-tube-mag', 0.026, 0.72, m.dark, [x, y - 0.035, z - 0.66], 'z', 12);
  box(group, 'polish-shotgun-bead-sight', [0.028, 0.04, 0.025], m.brass, [x, y + 0.105, z - 1.08]);
}

function decorateSmg(group, id, aimMode, m, parts) {
  const x = aimMode ? 0 : 0.18;
  const y = aimMode ? -0.29 : -0.37;
  const z = -0.72;
  if (id === 'mp40') {
    box(group, 'polish-mp40-folding-stock-left', [0.018, 0.018, 0.52], m.steel, [x - 0.12, y - 0.05, z + 0.28], [0.2, 0, 0]);
    box(group, 'polish-mp40-folding-stock-right', [0.018, 0.018, 0.52], m.steel, [x + 0.12, y - 0.05, z + 0.28], [0.2, 0, 0]);
    parts.bolt = box(group, 'polish-mp40-open-bolt', [0.08, 0.04, 0.16], m.steel, [x + 0.07, y + 0.09, z - 0.03]);
  }
  if (id === 'ppsh41') {
    parts.magazine = parts.magazine || cyl(group, 'polish-ppsh-drum-live', 0.22, 0.12, m.blue, [x, y - 0.1, z - 0.02], 'z', 24);
    cyl(group, 'polish-ppsh-vented-shroud', 0.052, 0.55, m.dark, [x, y + 0.02, z - 0.52], 'z', 16);
    for (let i = 0; i < 5; i += 1) box(group, `polish-ppsh-shroud-slot-${i}`, [0.016, 0.055, 0.035], m.steel, [x + (i % 2 ? -0.055 : 0.055), y + 0.02, z - 0.34 - i * 0.075]);
  }
  if (id === 'thompsonM1928') {
    parts.foregrip = box(group, 'polish-thompson-vertical-foregrip-live', [0.08, 0.26, 0.09], m.wood, [x, y - 0.16, z - 0.32], [0.16, 0, 0]);
    box(group, 'polish-thompson-cutts-compensator', [0.1, 0.07, 0.12], m.steel, [x, y + 0.02, z - 0.98]);
    parts.bolt = box(group, 'polish-thompson-bolt-handle', [0.065, 0.035, 0.12], m.steel, [x + 0.11, y + 0.09, z - 0.04]);
  }
  parts.magazine = parts.magazine || box(group, `polish-${id}-live-mag`, [0.14, 0.34, 0.095], m.blue, [x - 0.02, y - 0.15, z - 0.05]);
}

function decorateLmg(group, id, aimMode, m, parts) {
  const x = aimMode ? 0.02 : 0.24;
  const y = aimMode ? -0.31 : -0.42;
  const z = -0.72;
  if (id === 'mg42') {
    parts.feedCover = parts.feedCover || box(group, 'polish-mg42-hinged-feed-cover-live', [0.18, 0.045, 0.34], m.steel, [x, y + 0.13, z - 0.06]);
    parts.bolt = parts.bolt || box(group, 'polish-mg42-bolt-live', [0.1, 0.05, 0.2], m.blue, [x + 0.065, y + 0.05, z + 0.02]);
    for (let i = 0; i < 10; i += 1) {
      const link = box(group, `polish-mg42-belt-link-live-${i}`, [0.034, 0.02, 0.06], i % 2 ? m.brass : m.steel, [x + 0.09 + i * 0.034, y + 0.05 + Math.sin(i) * 0.006, z - 0.14]);
      parts[`belt${i}`] = link;
    }
    addBipod(group, x, y - 0.02, z - 0.98, m, 0.22, 0.42);
  } else if (id === 'dp28') {
    parts.magazine = parts.magazine || cyl(group, 'polish-dp-pan-live', 0.24, 0.065, m.blue, [x, y + 0.21, z - 0.04], 'y', 28);
    for (let i = 0; i < 8; i += 1) {
      const rib = box(group, `polish-dp-pan-rib-${i}`, [0.018, 0.014, 0.22], m.dark, [x, y + 0.25, z - 0.04]);
      rib.rotation.y = i * Math.PI / 4;
    }
    addBipod(group, x, y - 0.02, z - 0.88, m, 0.18, 0.36);
  } else {
    parts.magazine = parts.magazine || box(group, 'polish-bren-top-mag-live', [0.15, 0.36, 0.13], m.blue, [x - 0.04, y + 0.31, z - 0.02]);
    box(group, 'polish-bren-carry-handle-live', [0.04, 0.21, 0.04], m.dark, [x + 0.12, y + 0.2, z - 0.04], [0.4, 0, 0]);
    addBipod(group, x, y - 0.02, z - 0.82, m, 0.18, 0.34);
  }
}

function decorateLauncher(group, id, aimMode, m, parts) {
  const x = aimMode ? 0 : 0.22;
  const y = aimMode ? -0.31 : -0.41;
  const z = -0.72;
  if (id === 'panzerfaust30') {
    parts.rocket = cone(group, 'polish-panzerfaust-warhead-live', 0.2, 0.36, m.bakelite, [x, y + 0.02, z - 0.92], 'z', 16);
    cyl(group, 'polish-panzerfaust-stick-live', 0.055, 1.05, m.steel, [x, y, z - 0.44], 'z', 16);
    parts.sight = box(group, 'polish-panzerfaust-flip-sight-live', [0.04, 0.18, 0.035], m.brass, [x + 0.08, y + 0.18, z - 0.35], [-0.2, 0, 0]);
  } else {
    cyl(group, 'polish-bazooka-main-tube-live', 0.095, 1.32, m.steel, [x, y, z - 0.46], 'z', 18);
    cyl(group, 'polish-bazooka-rear-ring-live', 0.12, 0.07, m.dark, [x, y, z + 0.18], 'z', 18);
    parts.rocket = cone(group, 'polish-bazooka-loaded-rocket-nose-live', 0.09, 0.2, m.bakelite, [x, y, z - 1.18], 'z', 14);
    parts.sight = box(group, 'polish-bazooka-folding-sight-live', [0.035, 0.16, 0.035], m.brass, [x + 0.1, y + 0.16, z - 0.3], [-0.25, 0, 0]);
  }
  parts.backblast = cone(group, 'polish-launcher-backblast-shadow-live', 0.16, 0.26, m.rubber, [x, y, z + 0.28], 'z', 12);
}

function decorateAtRifle(group, id, aimMode, m, parts) {
  const x = aimMode ? 0 : 0.22;
  const y = aimMode ? -0.31 : -0.42;
  const z = -0.72;
  cyl(group, `polish-${id}-oversized-barrel-live`, id === 'ptrd41' ? 0.048 : 0.043, 1.55, m.steel, [x, y + 0.035, z - 0.88], 'z', 14);
  parts.bolt = parts.bolt || box(group, `polish-${id}-huge-bolt-live`, [0.14, 0.055, 0.22], m.blue, [x + 0.075, y + 0.1, z + 0.02]);
  parts.boltHandle = parts.boltHandle || cyl(group, `polish-${id}-bolt-handle-live`, 0.02, 0.18, m.steel, [x + 0.17, y + 0.06, z + 0.04], 'x', 8);
  box(group, `polish-${id}-muzzle-brake-live`, [0.16, 0.07, 0.09], m.steel, [x, y + 0.035, z - 1.62]);
  addBipod(group, x, y - 0.02, z - 1.08, m, 0.25, 0.46);
  if (id === 'boysAT' || id === 'boysAt') parts.magazine = parts.magazine || box(group, 'polish-boys-top-mag-live', [0.16, 0.22, 0.12], m.blue, [x - 0.04, y + 0.22, z - 0.05]);
}

function decoratePistol(group, id, aimMode, m, parts) {
  const x = aimMode ? 0 : 0.18;
  const y = aimMode ? -0.27 : -0.34;
  const z = -0.72;
  if (id === 'webleyMkVI') {
    parts.cylinder = parts.cylinder || cyl(group, 'polish-webley-cylinder-live', 0.12, 0.14, m.blue, [x, y, z - 0.05], 'x', 14);
    parts.breakLatch = box(group, 'polish-webley-break-latch-live', [0.08, 0.03, 0.06], m.brass, [x, y + 0.12, z + 0.05]);
  } else {
    parts.slide = parts.slide || box(group, `polish-${id}-slide-live`, [0.14, 0.08, 0.36], m.blue, [x, y + 0.065, z - 0.12]);
    parts.magazine = parts.magazine || box(group, `polish-${id}-mag-live`, [0.1, 0.22, 0.08], m.dark, [x, y - 0.19, z + 0.05], [-0.12, 0, 0]);
    if (id === 'lugerP08') parts.toggle = box(group, 'polish-luger-toggle-live', [0.12, 0.035, 0.11], m.steel, [x, y + 0.13, z + 0.02], [0.2, 0, 0]);
    if (id === 'tt33') box(group, 'polish-tt33-thin-frame-line-live', [0.13, 0.018, 0.34], m.brass, [x, y + 0.1, z - 0.12]);
  }
}

function decorateWeaponViewModel(viewModel) {
  const data = viewModel?.userData;
  const weaponRoot = data?.weaponRoot;
  if (!weaponRoot || data.polishEnhanced) return;
  const id = data.weaponId;
  const weapon = ARSENAL[id] || {};
  const m = mats();
  const group = new THREE.Group();
  group.name = 'viewmodel-polish-live-parts';
  weaponRoot.add(group);
  const parts = data.weaponParts || {};
  data.polishParts = parts;
  data.polishCasings = [];

  if (['m1911a1', 'lugerP08', 'tt33', 'webleyMkVI'].includes(id)) decoratePistol(group, id, data.aimMode, m, parts);
  else if (['k98k', 'mosin9130', 'leeEnfieldNo4', 'm1GarandWw2', 'garand'].includes(id)) decorateRifle(group, id, data.aimMode, m, parts);
  else if (['winchester1897', 'browningAuto5', 'doubleBarrelSawedOff'].includes(id)) decorateShotgun(group, id, data.aimMode, m, parts);
  else if (['mp40', 'ppsh41', 'thompsonM1928'].includes(id)) decorateSmg(group, id, data.aimMode, m, parts);
  else if (['mg42', 'dp28', 'brenMk1Ww2', 'brenMk'].includes(id)) decorateLmg(group, id, data.aimMode, m, parts);
  else if (['bazookaM1', 'bazooka', 'panzerfaust30', 'panzerfaust'].includes(id)) decorateLauncher(group, id, data.aimMode, m, parts);
  else if (['ptrd41', 'ptrd', 'boysAT', 'boysAt', 'lahtiL39', 'solothurn'].includes(id)) decorateAtRifle(group, id, data.aimMode, m, parts);

  if (weapon.ww2) {
    const tag = box(group, `polish-${id}-ww2-id-plate`, [0.12, 0.014, 0.035], m.brass, [data.aimMode ? -0.08 : -0.14, data.aimMode ? -0.22 : -0.3, -0.22]);
    tag.userData.staticPart = true;
  }
  data.weaponParts = parts;
  data.polishEnhanced = true;
}

function actionAmount(data) {
  if (!data || data.actionKind === 'reload') return 0;
  const elapsed = data.actionElapsed ?? 1;
  const duration = Math.max(0.05, data.actionDuration || 0.18);
  const t = clamp01(elapsed / duration);
  return Math.sin((1 - t) * Math.PI * 0.5);
}

function reloadAmount(data) {
  const reload = data?.reloadState;
  if (!reload?.active) return 0;
  return clamp01(reload.progress || 0);
}

function pumpCurve(progress) {
  if (progress <= 0) return 0;
  if (progress < 0.45) return smooth01(progress / 0.45);
  return 1 - smooth01((progress - 0.45) / 0.55);
}

function spawnCasing(viewModel, data) {
  if (!viewModel || !data) return;
  const id = data.weaponId;
  if (['bazookaM1', 'panzerfaust30', 'mk2GrenadeProto', 'molotovProto', 'webleyMkVI', 'doubleBarrelSawedOff'].includes(id)) return;
  const m = mats();
  const casing = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.018, 0.07), m.brass);
  casing.name = 'viewmodel-ejected-casing';
  casing.position.set(0.18, -0.18, -0.68);
  casing.rotation.set(Math.random() * 0.4, Math.random() * 0.9, Math.random() * 0.6);
  casing.userData.life = 0.42;
  casing.userData.vel = new THREE.Vector3(0.6 + Math.random() * 0.35, 0.18 + Math.random() * 0.12, 0.3 + Math.random() * 0.25);
  viewModel.add(casing);
  data.polishCasings.push(casing);
}

function animateCasings(viewModel, data, dt) {
  const arr = data.polishCasings || [];
  for (const casing of arr) {
    casing.userData.life -= dt;
    casing.position.addScaledVector(casing.userData.vel, dt);
    casing.userData.vel.y -= 1.8 * dt;
    casing.rotation.x += dt * 12;
    casing.rotation.z += dt * 9;
    if (casing.userData.life <= 0) {
      viewModel.remove(casing);
      casing.geometry?.dispose?.();
      casing.material?.dispose?.();
      casing.dead = true;
    }
  }
  data.polishCasings = arr.filter((c) => !c.dead);
}

function animateWeaponPolish(viewModel, dt) {
  const data = viewModel?.userData;
  if (!data?.polishEnhanced) return;
  const parts = data.polishParts || data.weaponParts || {};
  Object.values(parts).forEach((part) => { if (part?.isObject3D) resetPart(part); });
  const id = data.weaponId;
  const shot = actionAmount(data);
  const reload = reloadAmount(data);
  const cycle = Math.sin(data.time * 36) * shot;

  if (data.actionKind !== 'reload' && (data.actionElapsed ?? 1) < 0.035 && !data.polishShotLock) {
    spawnCasing(viewModel, data);
    data.polishShotLock = true;
  }
  if ((data.actionElapsed ?? 1) > 0.08) data.polishShotLock = false;

  if (parts.slide) parts.slide.position.z += shot * 0.16 + pumpCurve(reload) * 0.08;
  if (parts.toggle) parts.toggle.rotation.x -= shot * 0.85;
  if (parts.cylinder) parts.cylinder.rotation.x += shot * 1.05 + reload * 1.8;
  if (parts.breakLatch) parts.breakLatch.rotation.x -= reload * 0.6;
  if (parts.bolt) parts.bolt.position.z += shot * 0.16 + pumpCurve(reload) * 0.18;
  if (parts.boltHandle) {
    parts.boltHandle.position.z += shot * 0.15 + pumpCurve(reload) * 0.18;
    parts.boltHandle.rotation.z += pumpCurve(reload) * 0.65;
  }
  if (parts.pump) parts.pump.position.z += pumpCurve(reload || shot) * 0.24;
  if (parts.magazine) {
    const magDrop = reload > 0.18 && reload < 0.68 ? Math.sin((reload - 0.18) / 0.5 * Math.PI) : 0;
    parts.magazine.position.y -= magDrop * 0.2;
    parts.magazine.rotation.x += magDrop * 0.28;
    if (id === 'ppsh41' || id === 'dp28') parts.magazine.rotation.y += shot * 0.35 + reload * 0.9;
  }
  if (parts.feedCover) {
    const lift = reload > 0.05 && reload < 0.62 ? Math.sin((reload - 0.05) / 0.57 * Math.PI) : 0;
    parts.feedCover.rotation.x -= lift * 0.9;
    parts.feedCover.position.y += lift * 0.035;
  }
  for (let i = 0; i < 12; i += 1) {
    const link = parts[`belt${i}`];
    if (link) {
      link.position.x += shot * (0.02 + i * 0.002);
      link.position.y += Math.sin(data.time * 50 + i) * 0.006 * Math.max(shot, 0.08);
    }
  }
  if (parts.rocket) {
    const hideRocket = id === 'bazookaM1' || id === 'panzerfaust30';
    parts.rocket.position.z -= shot * 0.32;
    parts.rocket.visible = !(hideRocket && shot > 0.12 && reload < 0.2);
    if (reload > 0.35) parts.rocket.visible = true;
  }
  if (parts.sight) parts.sight.rotation.x += Math.sin(data.time * 4.5) * 0.015;
  if (parts.backblast) parts.backblast.scale.setScalar(1 + shot * 0.6);
  if (parts.hinge && id === 'doubleBarrelSawedOff') parts.hinge.rotation.x += pumpCurve(reload) * 0.75;
  if (parts.foregrip) parts.foregrip.rotation.x += cycle * 0.05;

  animateCasings(viewModel, data, dt);
}

export function installWeaponModelPolishExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__weaponModelPolishInstalled) return;
  PhoenixV3Engine.__weaponModelPolishInstalled = true;

  const originalBuildViewModel = PhoenixV3Engine.prototype.buildViewModel;
  PhoenixV3Engine.prototype.buildViewModel = function buildViewModelWithWeaponPolish() {
    const result = originalBuildViewModel.call(this);
    decorateWeaponViewModel(this.hands);
    return result;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWeaponModelPolish(dt) {
    originalUpdate.call(this, dt);
    if (this.hands) {
      decorateWeaponViewModel(this.hands);
      animateWeaponPolish(this.hands, Math.min(0.05, Math.max(0.001, dt || 1 / 60)));
    }
  };
}
