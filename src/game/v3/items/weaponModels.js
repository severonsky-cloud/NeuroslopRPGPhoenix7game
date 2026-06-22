import * as THREE from '../vendor/three.module.js';
import { ARSENAL, WEAPON_ARCHETYPES, AMMO_TYPES } from '../combat/arsenal.js';
import { makeMat } from '../world/props.js';
import {
  createPlayerHands,
  setPlayerHandsPose,
  updatePlayerHands,
} from '../visuals/playerHands.js';

function materials() {
  return {
    dark: makeMat(0x0b0c0b, { roughness: 0.68 }),
    wood: makeMat(0x5f3a20, { roughness: 0.84 }),
    woodLight: makeMat(0x84552d, { roughness: 0.78 }),
    steel: makeMat(0xc7c5b8, { roughness: 0.32, metalness: 0.48 }),
    gunmetal: makeMat(0x272b2b, { roughness: 0.45, metalness: 0.4 }),
    blueSteel: makeMat(0x384248, { roughness: 0.38, metalness: 0.48 }),
    brass: makeMat(0xa8843d, { roughness: 0.4, metalness: 0.28 }),
    glass: makeMat(0x78d7df, { roughness: 0.22, metalness: 0.12, emissive: 0x17454c }),
  };
}

function addMesh(root, geometry, mat, name, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const node = new THREE.Mesh(geometry, mat);
  node.name = name;
  node.position.set(...position);
  node.rotation.set(...rotation);
  node.castShadow = false;
  node.receiveShadow = false;
  node.frustumCulled = false;
  node.renderOrder = 24;
  root.add(node);
  return node;
}

function box(root, size, mat, name, position, rotation) {
  return addMesh(root, new THREE.BoxGeometry(...size), mat, name, position, rotation);
}

function cylinder(root, radius, length, mat, name, position, axis = 'z', segments = 10) {
  const rotation = axis === 'z' ? [Math.PI / 2, 0, 0] : axis === 'x' ? [0, 0, Math.PI / 2] : [0, 0, 0];
  return addMesh(
    root,
    new THREE.CylinderGeometry(radius, radius, length, segments),
    mat,
    name,
    position,
    rotation,
  );
}

function remember(node) {
  if (!node) return node;
  node.userData.basePosition = node.position.clone();
  node.userData.baseRotation = node.rotation.clone();
  return node;
}

function addSight(root, x, y, z, mats, rear = false) {
  box(root, [rear ? 0.12 : 0.026, rear ? 0.024 : 0.075, 0.026], mats.dark, rear ? 'rear-sight' : 'front-sight', [x, y, z]);
}

function muzzleAnchor(root, x, y, z) {
  const anchor = new THREE.Object3D();
  anchor.name = 'viewmodel-muzzle-anchor';
  anchor.position.set(x, y, z);
  root.add(anchor);
  return anchor;
}

function addBayonet(root, x, y, z, mats, length = 0.38) {
  box(root, [0.034, 0.025, length], mats.steel, 'viewmodel-bayonet-blade', [x, y, z - length * 0.5], [0, 0, Math.PI / 4]);
  box(root, [0.13, 0.025, 0.035], mats.brass, 'viewmodel-bayonet-guard', [x, y, z + 0.01]);
}

function buildRevolver(root, aimMode, mats) {
  const x = aimMode ? 0 : 0.19;
  const y = aimMode ? -0.27 : -0.34;
  const z = -0.72;
  box(root, [0.15, 0.15, 0.27], mats.gunmetal, 'colt-frame', [x, y, z]);
  const cylinderNode = remember(cylinder(root, 0.105, 0.14, mats.blueSteel, 'colt-cylinder', [x, y, z - 0.05], 'x', 12));
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    cylinder(
      root,
      0.017,
      0.145,
      mats.dark,
      `colt-cylinder-chamber-${index + 1}`,
      [x, y + Math.cos(angle) * 0.065, z - 0.05 + Math.sin(angle) * 0.065],
      'x',
      7,
    );
  }
  cylinder(root, 0.028, 0.30, mats.gunmetal, 'colt-short-barrel', [x, y + 0.025, z - 0.31]);
  cylinder(root, 0.037, 0.055, mats.dark, 'colt-muzzle-ring', [x, y + 0.025, z - 0.485]);
  const grip = box(root, [0.12, 0.27, 0.12], mats.wood, 'colt-wood-grip', [x, y - 0.19, z + 0.1], [-0.18, 0, 0]);
  grip.scale.x = 0.9;
  box(root, [0.08, 0.055, 0.09], mats.dark, 'colt-hammer', [x, y + 0.08, z + 0.16], [-0.25, 0, 0]);
  addMesh(root, new THREE.TorusGeometry(0.055, 0.012, 6, 10, Math.PI), mats.brass, 'colt-trigger-guard', [x, y - 0.105, z + 0.015], [0, Math.PI / 2, 0]);
  addSight(root, x, y + 0.1, z - 0.405, mats);
  return {
    muzzleAnchor: muzzleAnchor(root, x, y + 0.025, z - 0.52),
    parts: { cylinder: cylinderNode },
  };
}

function buildM1(root, aimMode, mats, weapon) {
  const x = aimMode ? 0 : 0.15;
  const y = aimMode ? -0.29 : -0.35;
  const receiverZ = -0.72;
  box(root, [0.15, 0.17, 0.44], mats.gunmetal, 'm1-receiver', [x, y, receiverZ]);
  box(root, [0.18, 0.18, 0.5], mats.wood, 'm1-stock', [x, y - 0.03, receiverZ + 0.42], [-0.03, 0, 0]);
  box(root, [0.17, 0.15, 0.55], mats.woodLight, 'm1-long-handguard', [x, y + 0.005, receiverZ - 0.46]);
  cylinder(root, 0.025, 0.82, mats.gunmetal, 'm1-long-barrel', [x, y + 0.02, receiverZ - 0.96]);
  const bolt = remember(box(root, [0.10, 0.052, 0.20], mats.blueSteel, 'm1-bolt', [x + 0.055, y + 0.085, receiverZ - 0.02]));
  const boltHandle = remember(cylinder(root, 0.018, 0.11, mats.gunmetal, 'm1-bolt-handle', [x + 0.115, y + 0.06, receiverZ + 0.02], 'x', 8));
  box(root, [0.11, 0.045, 0.11], mats.dark, 'm1-rear-aperture', [x, y + 0.11, receiverZ + 0.08]);
  addSight(root, x, y + 0.1, receiverZ - 1.28, mats);
  if (weapon.bayonet) addBayonet(root, x, y - 0.015, receiverZ - 1.39, mats, 0.46);
  return {
    muzzleAnchor: muzzleAnchor(root, x, y + 0.02, receiverZ - 1.39),
    parts: { bolt, boltHandle },
  };
}

function buildBren(root, aimMode, mats, weapon = {}) {
  const id = weapon.id || 'bren';
  const mg42 = id === 'mg42';
  const dp28 = id === 'dp28';
  const x = aimMode ? (mg42 ? 0.01 : 0.02) : (mg42 ? 0.24 : 0.22);
  const y = aimMode ? -0.305 : (mg42 ? -0.43 : -0.42);
  const receiverZ = -0.72;
  const parts = {};

  box(root, mg42 ? [0.17, 0.17, 0.58] : [0.16, 0.185, 0.5], mats.gunmetal, `${id}-receiver`, [x, y, receiverZ]);
  box(root, [0.15, 0.15, mg42 ? 0.38 : 0.4], mats.wood, `${id}-stock`, [x, y - 0.035, receiverZ + 0.44], [-0.04, 0, 0]);
  box(root, [0.07, 0.17, 0.08], mats.dark, `${id}-pistol-grip`, [x, y - 0.135, receiverZ + 0.14], [0.32, 0, 0]);

  if (mg42) {
    cylinder(root, 0.033, 0.96, mats.blueSteel, 'mg42-inner-barrel', [x, y + 0.022, receiverZ - 0.88], 'z', 14);
    cylinder(root, 0.058, 0.72, mats.dark, 'mg42-perforated-jacket', [x, y + 0.022, receiverZ - 0.66], 'z', 16);
    for (let i = 0; i < 6; i += 1) {
      const zz = receiverZ - 0.38 - i * 0.085;
      box(root, [0.014, 0.045, 0.035], mats.blueSteel, `mg42-jacket-slot-l-${i}`, [x - 0.059, y + 0.022, zz]);
      box(root, [0.014, 0.045, 0.035], mats.blueSteel, `mg42-jacket-slot-r-${i}`, [x + 0.059, y + 0.022, zz]);
    }
    parts.feedCover = remember(box(root, [0.16, 0.035, 0.32], mats.blueSteel, 'mg42-feed-cover', [x, y + 0.115, receiverZ - 0.06], [-0.04, 0, 0]));
    parts.magazine = remember(box(root, [0.16, 0.22, 0.24], mats.dark, 'mg42-belt-box', [x + 0.18, y - 0.045, receiverZ - 0.1], [0, 0, -0.08]));
    for (let i = 0; i < 6; i += 1) {
      box(root, [0.035, 0.018, 0.055], mats.brass, `mg42-visible-belt-${i}`, [x + 0.075 + i * 0.035, y + 0.045, receiverZ - 0.12]);
    }
    parts.chargingHandle = remember(cylinder(root, 0.017, 0.13, mats.gunmetal, 'mg42-charging-handle', [x + 0.125, y + 0.015, receiverZ + 0.08], 'x', 8));
    addSight(root, x, y + 0.115, receiverZ - 0.98, mats);
    return {
      muzzleAnchor: muzzleAnchor(root, x, y + 0.022, receiverZ - 1.36),
      parts,
    };
  }

  if (dp28) {
    box(root, [0.14, 0.13, 0.34], mats.woodLight, 'dp28-foregrip', [x, y - 0.035, receiverZ - 0.34]);
    cylinder(root, 0.027, 0.82, mats.blueSteel, 'dp28-barrel', [x, y + 0.025, receiverZ - 0.88], 'z', 12);
    parts.magazine = remember(cylinder(root, 0.19, 0.055, mats.gunmetal, 'dp28-pan-magazine', [x, y + 0.185, receiverZ - 0.04], 'y', 24));
    box(root, [0.32, 0.018, 0.055], mats.dark, 'dp28-pan-cross-rib', [x, y + 0.218, receiverZ - 0.04]);
    box(root, [0.055, 0.018, 0.32], mats.dark, 'dp28-pan-long-rib', [x, y + 0.22, receiverZ - 0.04]);
    parts.bolt = remember(box(root, [0.09, 0.045, 0.16], mats.blueSteel, 'dp28-bolt', [x + 0.058, y + 0.075, receiverZ + 0.02]));
    addSight(root, x, y + 0.118, receiverZ - 0.98, mats);
    return {
      muzzleAnchor: muzzleAnchor(root, x, y + 0.025, receiverZ - 1.28),
      parts,
    };
  }

  box(root, [0.14, 0.13, 0.34], mats.woodLight, `${id}-foregrip`, [x, y - 0.03, receiverZ - 0.34]);
  cylinder(root, 0.027, 0.58, mats.blueSteel, `${id}-heavy-barrel`, [x, y + 0.025, receiverZ - 0.74], 'z', 12);
  cylinder(root, 0.045, 0.26, mats.dark, `${id}-barrel-jacket`, [x, y + 0.025, receiverZ - 0.56], 'z', 12);
  const magazineSize = aimMode ? [0.13, 0.24, 0.11] : [0.15, 0.3, 0.12];
  parts.magazine = remember(box(root, magazineSize, mats.gunmetal, `${id}-top-magazine`, [x - 0.04, y + 0.25, receiverZ - 0.05], [0.14, 0, aimMode ? -0.14 : 0.06]));
  box(root, [0.04, 0.04, 0.24], mats.dark, `${id}-carry-handle`, [x + 0.11, y + 0.13, receiverZ - 0.1], [0, 0, -0.32]);
  box(root, [0.02, 0.3, 0.02], mats.gunmetal, `${id}-bipod-left`, [x - 0.08, y - 0.15, receiverZ - 0.82], [0.2, 0, -0.24]);
  box(root, [0.02, 0.3, 0.02], mats.gunmetal, `${id}-bipod-right`, [x + 0.08, y - 0.15, receiverZ - 0.82], [0.2, 0, 0.24]);
  addSight(root, x, y + 0.125, receiverZ - 0.86, mats);
  return {
    muzzleAnchor: muzzleAnchor(root, x, y + 0.025, receiverZ - 1.02),
    parts,
  };
}

function buildShotgun(root, aimMode, mats, weapon) {
  const x = aimMode ? 0 : 0.17;
  const y = aimMode ? -0.29 : -0.35;
  const receiverZ = -0.74;
  box(root, [0.19, 0.2, 0.46], mats.gunmetal, 'trench-shotgun-heavy-receiver', [x, y, receiverZ]);
  box(root, [0.2, 0.19, 0.42], mats.wood, 'trench-shotgun-stock', [x, y - 0.04, receiverZ + 0.42], [-0.045, 0, 0]);
  cylinder(root, 0.047, 0.75, mats.blueSteel, 'trench-shotgun-barrel', [x, y + 0.045, receiverZ - 0.72], 'z', 12);
  cylinder(root, 0.035, 0.7, mats.gunmetal, 'trench-shotgun-magazine-tube', [x, y - 0.055, receiverZ - 0.69], 'z', 12);
  const pump = remember(box(root, [0.19, 0.13, 0.3], mats.woodLight, 'trench-shotgun-pump', [x, y - 0.04, receiverZ - 0.47]));
  for (let index = -2; index <= 2; index += 1) {
    box(root, [0.205, 0.008, 0.018], mats.dark, `trench-shotgun-pump-rib-${index + 3}`, [x, y - 0.105, receiverZ - 0.47 + index * 0.045]);
  }
  addSight(root, x, y + 0.135, receiverZ - 1.03, mats);
  if (weapon.bayonet) addBayonet(root, x, y - 0.005, receiverZ - 1.14, mats, 0.34);
  return {
    muzzleAnchor: muzzleAnchor(root, x, y + 0.045, receiverZ - 1.15),
    parts: { pump },
  };
}

function buildCarbine(root, aimMode, mats) {
  const x = aimMode ? 0 : 0.18;
  const y = aimMode ? -0.29 : -0.35;
  const receiverZ = -0.73;
  box(root, [0.15, 0.17, 0.38], mats.gunmetal, 'caravan-carbine-receiver', [x, y, receiverZ]);
  box(root, [0.17, 0.17, 0.34], mats.wood, 'caravan-carbine-compact-stock', [x, y - 0.035, receiverZ + 0.33], [-0.04, 0, 0]);
  box(root, [0.15, 0.13, 0.34], mats.woodLight, 'caravan-carbine-short-forestock', [x, y - 0.005, receiverZ - 0.32]);
  cylinder(root, 0.023, 0.57, mats.gunmetal, 'caravan-carbine-short-barrel', [x, y + 0.025, receiverZ - 0.68]);
  const bolt = remember(box(root, [0.09, 0.045, 0.16], mats.blueSteel, 'caravan-carbine-bolt', [x + 0.052, y + 0.075, receiverZ - 0.01]));
  const boltHandle = remember(cylinder(root, 0.016, 0.1, mats.gunmetal, 'caravan-carbine-bolt-handle', [x + 0.11, y + 0.05, receiverZ + 0.03], 'x', 8));
  const magazine = remember(box(root, [0.1, 0.17, 0.13], mats.gunmetal, 'caravan-carbine-magazine', [x, y - 0.15, receiverZ - 0.08], [0.08, 0, 0]));
  addSight(root, x, y + 0.105, receiverZ - 0.91, mats);
  return {
    muzzleAnchor: muzzleAnchor(root, x, y + 0.025, receiverZ - 0.99),
    parts: { bolt, boltHandle, magazine },
  };
}

// --- v3P2: procedural WW2 first-person silhouettes ---

function buildPistol(root, aimMode, mats, weapon) {
  const id = weapon.id || '';
  const luger = id === 'lugerP08';
  const tt = id === 'tt33';
  const revolver = id === 'webleyMkVI';
  const x = aimMode ? 0 : 0.165;
  const y = aimMode ? -0.265 : -0.335;
  const z = -0.66;

  if (revolver) {
    box(root, [0.14, 0.145, 0.25], mats.gunmetal, 'webley-frame', [x, y, z]);
    const cyl = remember(cylinder(root, 0.102, 0.13, mats.blueSteel, 'webley-cylinder', [x, y + 0.005, z - 0.035], 'x', 12));
    cylinder(root, 0.03, 0.26, mats.gunmetal, 'webley-barrel', [x, y + 0.035, z - 0.29], 'z', 12);
    box(root, [0.09, 0.22, 0.11], mats.wood, 'webley-grip', [x, y - 0.175, z + 0.095], [-0.18, 0, 0]);
    box(root, [0.06, 0.045, 0.075], mats.dark, 'webley-hammer', [x, y + 0.095, z + 0.135], [-0.3, 0, 0]);
    box(root, [0.13, 0.025, 0.045], mats.brass, 'webley-break-latch', [x, y + 0.095, z - 0.095]);
    addMesh(root, new THREE.TorusGeometry(0.052, 0.011, 6, 10, Math.PI), mats.brass, 'webley-trigger-guard', [x, y - 0.095, z + 0.01], [0, Math.PI / 2, 0]);
    addSight(root, x, y + 0.105, z - 0.385, mats);
    return { muzzleAnchor: muzzleAnchor(root, x, y + 0.035, z - 0.44), parts: { cylinder: cyl } };
  }

  const longSlide = tt || luger;
  const slideLength = luger ? 0.34 : longSlide ? 0.33 : 0.31;
  const slideHeight = luger ? 0.095 : 0.125;
  const slideY = luger ? y + 0.035 : y + 0.028;

  const slide = remember(box(root, [luger ? 0.105 : 0.125, slideHeight, slideLength], mats.gunmetal, `${id}-slide`, [x, slideY, z - 0.035]));
  cylinder(root, luger ? 0.019 : 0.022, luger ? 0.21 : 0.18, mats.dark, `${id}-barrel`, [x, slideY + 0.002, z - 0.255], 'z', 10);
  box(root, [0.12, 0.10, 0.13], mats.dark, `${id}-frame`, [x, y - 0.055, z + 0.045]);

  const gripAngle = luger ? -0.42 : tt ? -0.18 : -0.25;
  box(root, [luger ? 0.092 : 0.102, luger ? 0.25 : 0.235, 0.105], mats.dark, `${id}-grip`, [x, y - 0.17, z + 0.08], [gripAngle, 0, 0]);
  box(root, [0.08, 0.16, 0.018], mats.wood, `${id}-grip-panel-l`, [x - 0.052, y - 0.17, z + 0.075], [gripAngle, 0, 0]);
  box(root, [0.08, 0.16, 0.018], mats.wood, `${id}-grip-panel-r`, [x + 0.052, y - 0.17, z + 0.075], [gripAngle, 0, 0]);

  const magazine = remember(box(root, [0.076, 0.19, 0.07], mats.blueSteel, `${id}-magazine`, [x, y - 0.22, z + 0.075], [gripAngle, 0, 0]));
  if (luger) {
    box(root, [0.075, 0.028, 0.105], mats.blueSteel, 'luger-toggle-front-link', [x, y + 0.112, z - 0.015], [0.18, 0, 0]);
    box(root, [0.075, 0.028, 0.105], mats.blueSteel, 'luger-toggle-rear-link', [x, y + 0.115, z + 0.075], [-0.16, 0, 0]);
    cylinder(root, 0.034, 0.082, mats.dark, 'luger-toggle-knuckle', [x, y + 0.12, z + 0.125], 'x', 10);
  } else {
    box(root, [0.055, 0.04, 0.07], mats.dark, `${id}-hammer`, [x, y + 0.085, z + 0.13], [-0.22, 0, 0]);
    for (let i = 0; i < 4; i += 1) {
      box(root, [0.132, 0.018, 0.012], mats.dark, `${id}-slide-serration-${i}`, [x, y + 0.075, z + 0.055 + i * 0.018], [0.22, 0, 0]);
    }
  }
  addMesh(root, new THREE.TorusGeometry(0.052, 0.011, 6, 10, Math.PI), mats.brass, `${id}-trigger-guard`, [x, y - 0.092, z], [0, Math.PI / 2, 0]);
  addSight(root, x, slideY + 0.065, z - 0.19, mats);
  addSight(root, x, slideY + 0.06, z + 0.09, mats, true);
  return {
    muzzleAnchor: muzzleAnchor(root, x, slideY + 0.002, z - 0.35),
    parts: { slide, magazine },
  };
}

function buildSMG(root, aimMode, mats, weapon) {
  const id = weapon.id || '';
  const ppsh = id === 'ppsh41';
  const thompson = id === 'thompsonM1928';
  const x = aimMode ? 0 : (thompson ? 0.19 : 0.18);
  const y = aimMode ? -0.295 : -0.37;
  const z = -0.72;
  const parts = {};

  if (ppsh) {
    box(root, [0.15, 0.14, 0.46], mats.wood, 'ppsh-wood-stock-receiver', [x, y - 0.025, z + 0.12], [-0.025, 0, 0]);
    box(root, [0.13, 0.12, 0.36], mats.gunmetal, 'ppsh-receiver', [x, y + 0.035, z - 0.08]);
    cylinder(root, 0.045, 0.58, mats.blueSteel, 'ppsh-vented-shroud', [x, y + 0.04, z - 0.56], 'z', 14);
    for (let i = 0; i < 6; i += 1) {
      box(root, [0.012, 0.034, 0.035], mats.dark, `ppsh-shroud-slot-l-${i}`, [x - 0.044, y + 0.04, z - 0.33 - i * 0.065]);
      box(root, [0.012, 0.034, 0.035], mats.dark, `ppsh-shroud-slot-r-${i}`, [x + 0.044, y + 0.04, z - 0.33 - i * 0.065]);
    }
    cylinder(root, 0.023, 0.72, mats.gunmetal, 'ppsh-barrel', [x, y + 0.04, z - 0.64], 'z', 12);
    parts.magazine = remember(cylinder(root, 0.155, 0.075, mats.gunmetal, 'ppsh-drum-magazine', [x, y - 0.145, z - 0.14], 'x', 24));
    box(root, [0.035, 0.15, 0.08], mats.dark, 'ppsh-stick-grip-shadow', [x, y - 0.17, z + 0.05], [0.28, 0, 0]);
    addSight(root, x, y + 0.13, z - 0.74, mats);
    return { muzzleAnchor: muzzleAnchor(root, x, y + 0.04, z - 1.0), parts };
  }

  if (thompson) {
    box(root, [0.17, 0.17, 0.48], mats.gunmetal, 'thompson-square-receiver', [x, y, z - 0.02]);
    box(root, [0.18, 0.17, 0.42], mats.wood, 'thompson-stock', [x, y - 0.035, z + 0.43], [-0.05, 0, 0]);
    cylinder(root, 0.027, 0.52, mats.blueSteel, 'thompson-barrel', [x, y + 0.02, z - 0.56], 'z', 12);
    cylinder(root, 0.044, 0.24, mats.dark, 'thompson-finned-cooling-section', [x, y + 0.02, z - 0.35], 'z', 12);
    for (let i = 0; i < 4; i += 1) {
      cylinder(root, 0.049, 0.012, mats.blueSteel, `thompson-barrel-fin-${i}`, [x, y + 0.02, z - 0.26 - i * 0.042], 'z', 12);
    }
    box(root, [0.07, 0.2, 0.075], mats.wood, 'thompson-pistol-grip', [x, y - 0.145, z + 0.1], [0.32, 0, 0]);
    box(root, [0.065, 0.25, 0.085], mats.woodLight, 'thompson-vertical-foregrip', [x, y - 0.14, z - 0.29], [0.18, 0, 0]);
    parts.magazine = remember(box(root, [0.09, 0.28, 0.11], mats.gunmetal, 'thompson-stick-magazine', [x, y - 0.205, z - 0.08], [0.04, 0, 0]));
    parts.bolt = remember(box(root, [0.105, 0.038, 0.12], mats.blueSteel, 'thompson-bolt', [x + 0.07, y + 0.075, z + 0.04]));
    addSight(root, x, y + 0.115, z - 0.62, mats);
    return { muzzleAnchor: muzzleAnchor(root, x, y + 0.02, z - 0.86), parts };
  }

  cylinder(root, 0.062, 0.5, mats.gunmetal, 'mp40-tube-receiver', [x, y + 0.025, z - 0.05], 'z', 14);
  box(root, [0.11, 0.08, 0.22], mats.dark, 'mp40-lower-frame', [x, y - 0.04, z + 0.02]);
  cylinder(root, 0.023, 0.46, mats.blueSteel, 'mp40-barrel', [x, y + 0.025, z - 0.55], 'z', 12);
  cylinder(root, 0.034, 0.07, mats.dark, 'mp40-front-nut', [x, y + 0.025, z - 0.81], 'z', 12);
  box(root, [0.064, 0.19, 0.075], mats.dark, 'mp40-grip', [x, y - 0.145, z + 0.12], [0.28, 0, 0]);
  parts.magazine = remember(box(root, [0.075, 0.34, 0.095], mats.gunmetal, 'mp40-stick-magazine', [x, y - 0.245, z - 0.1], [0.04, 0, 0]));
  parts.bolt = remember(cylinder(root, 0.017, 0.11, mats.blueSteel, 'mp40-charging-knob', [x + 0.082, y + 0.045, z + 0.02], 'x', 8));
  cylinder(root, 0.009, 0.55, mats.dark, 'mp40-wire-stock-left', [x - 0.066, y - 0.025, z + 0.38], 'z', 6);
  cylinder(root, 0.009, 0.55, mats.dark, 'mp40-wire-stock-right', [x + 0.066, y - 0.025, z + 0.38], 'z', 6);
  box(root, [0.16, 0.022, 0.055], mats.dark, 'mp40-folded-buttplate', [x, y - 0.025, z + 0.66]);
  addSight(root, x, y + 0.118, z - 0.68, mats);
  return { muzzleAnchor: muzzleAnchor(root, x, y + 0.025, z - 0.86), parts };
}

function buildRocketTube(root, aimMode, mats, weapon) {
  const id = weapon.id || '';
  const panzer = id === 'panzerfaust30' || id === 'panzerfaust';
  const x = aimMode ? 0.015 : 0.205;
  const y = aimMode ? -0.255 : -0.35;
  const z = -0.72;
  const parts = {};

  if (panzer) {
    cylinder(root, 0.052, 1.05, mats.gunmetal, 'panzerfaust-launch-tube', [x, y, z - 0.32], 'z', 14);
    cylinder(root, 0.068, 0.12, mats.dark, 'panzerfaust-rear-ring', [x, y, z + 0.24], 'z', 14);
    parts.rocket = remember(addMesh(root, new THREE.SphereGeometry(0.135, 14, 10), mats.blueSteel, 'panzerfaust-warhead-bulb', [x, y, z - 0.94]));
    cylinder(root, 0.072, 0.2, mats.blueSteel, 'panzerfaust-warhead-neck', [x, y, z - 0.8], 'z', 12);
    box(root, [0.12, 0.07, 0.16], mats.brass, 'panzerfaust-folding-sight', [x, y + 0.14, z - 0.18], [-0.35, 0, 0]);
    box(root, [0.065, 0.12, 0.075], mats.dark, 'panzerfaust-trigger-block', [x, y - 0.11, z - 0.02], [0.15, 0, 0]);
    return { muzzleAnchor: muzzleAnchor(root, x, y, z - 1.08), parts };
  }

  cylinder(root, 0.074, 1.48, mats.gunmetal, 'bazooka-open-tube', [x, y, z - 0.42], 'z', 16);
  cylinder(root, 0.088, 0.1, mats.dark, 'bazooka-front-ring', [x, y, z - 1.14], 'z', 16);
  cylinder(root, 0.088, 0.1, mats.dark, 'bazooka-rear-ring', [x, y, z + 0.3], 'z', 16);
  box(root, [0.18, 0.055, 0.18], mats.wood, 'bazooka-shoulder-pad', [x, y - 0.07, z + 0.28], [-0.04, 0, 0]);
  box(root, [0.06, 0.16, 0.08], mats.dark, 'bazooka-grip', [x, y - 0.14, z - 0.02], [0.3, 0, 0]);
  box(root, [0.025, 0.16, 0.18], mats.brass, 'bazooka-ladder-sight', [x + 0.09, y + 0.135, z - 0.22], [-0.3, 0, 0]);
  parts.rocket = remember(cylinder(root, 0.046, 0.18, mats.blueSteel, 'bazooka-loaded-rocket-tail', [x, y, z - 1.02], 'z', 12));
  return { muzzleAnchor: muzzleAnchor(root, x, y, z - 1.22), parts };
}

function buildATRifle(root, aimMode, mats, weapon) {
  const id = weapon.id || '';
  const boys = id === 'boysAT' || id === 'boysAt';
  const lahti = id === 'lahtiL39';
  const solothurn = id === 'solothurn';
  const heavy20 = lahti || solothurn;
  const x = aimMode ? 0.018 : 0.235;
  const y = aimMode ? -0.325 : -0.455;
  const z = -0.68;
  const receiverZ = z;
  const parts = {};

  box(root, heavy20 ? [0.21, 0.22, 0.72] : [0.17, 0.18, 0.6], mats.gunmetal, `${id}-at-receiver`, [x, y, receiverZ]);
  box(root, [0.18, 0.18, heavy20 ? 0.48 : 0.42], mats.wood, `${id}-at-stock`, [x, y - 0.035, receiverZ + 0.52], [-0.04, 0, 0]);
  box(root, [0.08, 0.18, 0.08], mats.dark, `${id}-at-pistol-grip`, [x, y - 0.145, receiverZ + 0.17], [0.3, 0, 0]);

  const barrelRadius = heavy20 ? 0.043 : 0.034;
  const barrelLength = heavy20 ? 1.48 : 1.34;
  const barrelCenter = receiverZ - (heavy20 ? 0.98 : 0.9);
  cylinder(root, barrelRadius, barrelLength, mats.blueSteel, `${id}-at-long-barrel`, [x, y + 0.032, barrelCenter], 'z', 14);
  cylinder(root, heavy20 ? 0.078 : 0.066, heavy20 ? 0.22 : 0.18, mats.dark, `${id}-at-muzzle-brake`, [x, y + 0.032, receiverZ - (heavy20 ? 1.78 : 1.61)], 'z', 14);
  box(root, [heavy20 ? 0.24 : 0.19, 0.035, 0.045], mats.dark, `${id}-muzzle-brake-cross`, [x, y + 0.032, receiverZ - (heavy20 ? 1.86 : 1.68)]);

  parts.bolt = remember(box(root, [0.12, 0.052, 0.2], mats.blueSteel, `${id}-at-bolt`, [x + 0.07, y + 0.08, receiverZ + 0.02]));
  parts.boltHandle = remember(cylinder(root, 0.018, 0.15, mats.gunmetal, `${id}-at-bolt-handle`, [x + 0.15, y + 0.055, receiverZ + 0.07], 'x', 8));

  if (boys) {
    parts.magazine = remember(box(root, [0.14, 0.27, 0.14], mats.gunmetal, 'boys-top-magazine', [x - 0.025, y + 0.235, receiverZ - 0.11], [0.08, 0, -0.1]));
  } else if (heavy20) {
    parts.magazine = remember(box(root, [0.18, 0.32, 0.16], mats.gunmetal, `${id}-large-side-magazine`, [x + 0.17, y - 0.02, receiverZ - 0.12], [0, 0, -0.08]));
  } else if ((weapon.clipSize || 1) > 1) {
    parts.magazine = remember(box(root, [0.12, 0.22, 0.12], mats.gunmetal, `${id}-at-mag`, [x, y - 0.18, receiverZ - 0.1], [0.1, 0, 0]));
  } else {
    box(root, [0.11, 0.045, 0.16], mats.brass, 'ptrd-single-round-tray', [x, y + 0.105, receiverZ - 0.12]);
  }

  box(root, [0.025, 0.42, 0.025], mats.gunmetal, `${id}-bipod-left`, [x - 0.1, y - 0.2, receiverZ - 1.18], [0.2, 0, -0.3]);
  box(root, [0.025, 0.42, 0.025], mats.gunmetal, `${id}-bipod-right`, [x + 0.1, y - 0.2, receiverZ - 1.18], [0.2, 0, 0.3]);
  addSight(root, x, y + 0.14, receiverZ - 0.84, mats);
  addSight(root, x, y + 0.145, receiverZ + 0.08, mats, true);
  return {
    muzzleAnchor: muzzleAnchor(root, x, y + 0.032, receiverZ - (heavy20 ? 1.9 : 1.73)),
    parts,
  };
}

function buildThrown(root, aimMode, mats, weapon) {
  const id = weapon.id || '';
  const molotov = id === 'molotovProto' || id === 'molotov';
  const x = aimMode ? 0.055 : 0.165;
  const y = aimMode ? -0.30 : -0.365;
  const z = -0.50;
  const parts = {};

  if (molotov) {
    const bottle = remember(addMesh(root, new THREE.CylinderGeometry(0.045, 0.064, 0.26, 12), mats.blueSteel, 'molotov-bottle-body', [x, y, z], [0, 0, -0.1]));
    cylinder(root, 0.026, 0.18, mats.dark, 'molotov-neck', [x, y + 0.19, z], 'y', 10);
    box(root, [0.025, 0.13, 0.025], mats.woodLight, 'molotov-rag-wick', [x + 0.01, y + 0.31, z], [0.18, 0, 0.14]);
    addMesh(root, new THREE.ConeGeometry(0.035, 0.09, 8), mats.brass, 'molotov-small-flame', [x + 0.012, y + 0.39, z], [0, 0, 0]);
    parts.bottle = bottle;
    return { muzzleAnchor: muzzleAnchor(root, x, y + 0.05, z - 0.12), parts };
  }

  const body = remember(addMesh(root, new THREE.SphereGeometry(0.083, 12, 10), mats.dark, 'mk2-pineapple-body', [x, y, z]));
  for (let i = -1; i <= 1; i += 1) box(root, [0.14, 0.012, 0.018], mats.gunmetal, `mk2-horizontal-rib-${i + 2}`, [x, y + i * 0.04, z]);
  for (let i = -1; i <= 1; i += 1) box(root, [0.018, 0.13, 0.012], mats.gunmetal, `mk2-vertical-rib-${i + 2}`, [x + i * 0.04, y, z]);
  box(root, [0.052, 0.04, 0.052], mats.gunmetal, 'mk2-fuse-top', [x, y + 0.095, z]);
  parts.spoon = remember(box(root, [0.024, 0.13, 0.018], mats.brass, 'mk2-safety-spoon', [x + 0.075, y + 0.035, z], [0.0, 0.0, -0.28]));
  parts.body = body;
  return { muzzleAnchor: muzzleAnchor(root, x, y, z - 0.14), parts };
}

function buildFirearm(root, weapon, aimMode, mats) {
  const id = weapon.id;
  if (id === 'colt') return buildRevolver(root, aimMode, mats);
  if (id === 'm1') return buildM1(root, aimMode, mats, weapon);
  if (id === 'bren') return buildBren(root, aimMode, mats, weapon);
  if (id === 'trenchShotgun') return buildShotgun(root, aimMode, mats, weapon);
  if (id === 'caravanCarbine') return buildCarbine(root, aimMode, mats);

  if (['m1911a1', 'm1911', 'lugerP08', 'tt33', 'webleyMkVI'].includes(id)) return buildPistol(root, aimMode, mats, weapon);
  if (['k98k', 'mosin9130', 'leeEnfieldNo4', 'm1GarandWw2', 'garand'].includes(id)) return buildM1(root, aimMode, mats, weapon);
  if (['mp40', 'ppsh41', 'thompsonM1928'].includes(id)) return buildSMG(root, aimMode, mats, weapon);
  if (['winchester1897', 'win1897', 'browningAuto5', 'autoA5', 'doubleBarrelSawedOff'].includes(id)) return buildShotgun(root, aimMode, mats, weapon);
  if (['brenMk1Ww2', 'brenMk', 'mg42', 'dp28'].includes(id)) return buildBren(root, aimMode, mats, weapon);
  if (['bazookaM1', 'bazooka', 'panzerfaust30', 'panzerfaust'].includes(id)) return buildRocketTube(root, aimMode, mats, weapon);
  if (['ptrd41', 'ptrd', 'boysAT', 'boysAt', 'lahtiL39', 'solothurn'].includes(id)) return buildATRifle(root, aimMode, mats, weapon);
  if (['mk2GrenadeProto', 'grenadeMk2', 'molotovProto', 'molotov'].includes(id)) return buildThrown(root, aimMode, mats, weapon);
  return buildCarbine(root, aimMode, mats);
}

function buildBlade(root, weapon, mats) {
  const model = WEAPON_ARCHETYPES[weapon.archetype]?.model;
  const x = 0.25;
  const y = -0.29;
  const gripZ = -0.62;

  if (model === 'axe') {
    cylinder(root, 0.035, 0.78, mats.wood, 'boarding-axe-long-handle', [x, y, -0.88]);
    box(root, [0.36, 0.17, 0.075], mats.steel, 'boarding-axe-head', [x - 0.08, y + 0.01, -1.28], [0, 0.12, 0]);
    box(root, [0.13, 0.11, 0.08], mats.dark, 'boarding-axe-poll', [x + 0.19, y + 0.01, -1.28]);
    return {};
  }

  if (model === 'dagger') {
    cylinder(root, 0.035, 0.23, mats.dark, 'glass-dagger-grip', [x, y, gripZ]);
    box(root, [0.28, 0.035, 0.055], mats.brass, 'glass-dagger-guard', [x, y, gripZ - 0.14]);
    const blade = box(root, [0.075, 0.035, 0.44], mats.glass, 'glass-dagger-short-blade', [x, y, gripZ - 0.38], [0, 0, Math.PI / 4]);
    blade.scale.x = 0.8;
    return {};
  }

  const saber = model === 'rapier';
  cylinder(root, 0.037, 0.28, mats.wood, saber ? 'saber-grip' : 'sword-grip', [x, y, gripZ]);
  if (saber) {
    addMesh(root, new THREE.TorusGeometry(0.13, 0.018, 7, 16, Math.PI * 1.65), mats.brass, 'saber-knuckle-guard', [x, y, gripZ - 0.13], [Math.PI / 2, 0, -0.35]);
  }
  box(root, [saber ? 0.34 : 0.5, 0.045, 0.065], mats.brass, saber ? 'saber-guard' : 'sword-crossguard', [x, y, gripZ - 0.17]);
  const length = saber ? 0.95 : 1.08;
  const width = saber ? 0.035 : 0.078;
  box(root, [width, saber ? 0.028 : 0.045, length], mats.steel, saber ? 'saber-long-blade' : 'sword-broad-blade', [x, y, gripZ - 0.22 - length * 0.5], [0, 0, saber ? Math.PI / 4 : 0]);
  return {};
}

function buildPhaseGesture(root) {
  const orbMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9f7ff,
    emissive: 0x31aaff,
    emissiveIntensity: 2.6,
    transparent: true,
    opacity: 0.82,
    roughness: 0.22,
  });
  const orb = addMesh(root, new THREE.IcosahedronGeometry(0.09, 2), orbMaterial, 'phase-hand-orb', [0, -0.23, -0.91]);
  const ring = addMesh(root, new THREE.TorusGeometry(0.16, 0.014, 8, 24), orbMaterial, 'phase-hand-ring', [0, -0.23, -0.91], [Math.PI / 2, 0, 0]);
  const light = new THREE.PointLight(0x53cfff, 1.35, 2.8);
  light.name = 'phase-hand-light';
  light.position.copy(orb.position);
  root.add(light);
  return { orb, ring };
}

function actionAmount(data, dt) {
  if (data.actionElapsed >= data.actionDuration) return 0;
  data.actionElapsed += dt;
  const progress = Math.min(1, data.actionElapsed / Math.max(0.001, data.actionDuration));
  return Math.sin(progress * Math.PI);
}

function resetPart(node) {
  if (!node?.userData?.basePosition) return;
  node.position.copy(node.userData.basePosition);
  node.rotation.copy(node.userData.baseRotation);
}

function updateReloadParts(data) {
  const reload = data.reloadState;
  const parts = data.weaponParts || {};
  Object.values(parts).forEach(resetPart);
  if (!reload?.active) return;

  const id = data.weaponId;
  const progress = Math.max(0, Math.min(1, reload.progress || 0));
  const reach = Math.sin(progress * Math.PI);
  const magDrop = Math.sin(Math.min(1, progress * 1.35) * Math.PI);

  if ((id === 'colt' || id === 'webleyMkVI') && parts.cylinder) {
    parts.cylinder.rotation.x += progress * Math.PI * 4;
    parts.cylinder.position.x -= reach * 0.085;
  } else if (['m1911a1', 'm1911', 'lugerP08', 'tt33'].includes(id)) {
    if (parts.slide) parts.slide.position.z += reach * 0.075;
    if (parts.magazine) parts.magazine.position.y -= magDrop * 0.12;
  } else if (['m1', 'k98k', 'mosin9130', 'leeEnfieldNo4', 'm1GarandWw2', 'garand'].includes(id)) {
    if (parts.bolt) parts.bolt.position.z += reach * 0.12;
    if (parts.boltHandle) parts.boltHandle.position.z += reach * 0.12;
  } else if (['mp40', 'ppsh41', 'thompsonM1928', 'caravanCarbine'].includes(id)) {
    if (parts.bolt) parts.bolt.position.z += reach * 0.08;
    if (parts.magazine) {
      parts.magazine.position.y -= magDrop * (id === 'ppsh41' ? 0.1 : 0.13);
      parts.magazine.rotation.z += reach * 0.08;
    }
  } else if (['bren', 'brenMk1Ww2', 'brenMk', 'mg42', 'dp28'].includes(id)) {
    if (parts.magazine) {
      parts.magazine.position.y += reach * (id === 'mg42' ? 0.08 : 0.2);
      parts.magazine.rotation.z += reach * (id === 'dp28' ? 0.18 : 0.28);
    }
    if (parts.feedCover) parts.feedCover.rotation.x -= reach * 0.45;
    if (parts.chargingHandle) parts.chargingHandle.position.z += reach * 0.11;
    if (parts.bolt) parts.bolt.position.z += reach * 0.08;
  } else if (['trenchShotgun', 'winchester1897', 'win1897', 'browningAuto5', 'autoA5'].includes(id) && parts.pump) {
    parts.pump.position.z += Math.sin(progress * Math.PI * 4) * 0.14 * reach;
  } else if (id === 'doubleBarrelSawedOff') {
    if (parts.pump) parts.pump.rotation.x += reach * 0.42;
  } else if (['bazookaM1', 'bazooka', 'panzerfaust30', 'panzerfaust'].includes(id)) {
    if (parts.rocket) parts.rocket.position.z -= reach * 0.18;
  } else if (['ptrd41', 'ptrd', 'boysAT', 'boysAt', 'lahtiL39', 'solothurn'].includes(id)) {
    if (parts.bolt) parts.bolt.position.z += reach * 0.14;
    if (parts.boltHandle) parts.boltHandle.position.z += reach * 0.14;
    if (parts.magazine) parts.magazine.position.y -= reach * 0.1;
  } else if (['mk2GrenadeProto', 'grenadeMk2'].includes(id)) {
    if (parts.spoon) {
      parts.spoon.rotation.z -= reach * 0.55;
      parts.spoon.position.x += reach * 0.035;
    }
  } else if (['molotovProto', 'molotov'].includes(id) && parts.bottle) {
    parts.bottle.rotation.z += reach * 0.55;
  }
}

export function createWeaponViewModel(weaponId, aimMode = false, character = {}) {
  const root = new THREE.Group();
  root.name = 'first-person-viewmodel-v3l1';
  const recoilRoot = new THREE.Group();
  recoilRoot.name = 'viewmodel-recoil-root';
  const poseRoot = new THREE.Group();
  poseRoot.name = 'viewmodel-pose-root';
  const weaponRoot = new THREE.Group();
  weaponRoot.name = 'viewmodel-weapon-root';
  const weapon = ARSENAL[weaponId] || ARSENAL.fists;
  const cls = WEAPON_ARCHETYPES[weapon.archetype]?.class;
  const kind = cls === 'firearm' ? 'firearm' : cls === 'phase' ? 'phase' : weapon.id === 'fists' ? 'fists' : WEAPON_ARCHETYPES[weapon.archetype]?.model || 'blade';
  const mats = materials();
  const handsRoot = createPlayerHands(kind, aimMode, character);

  root.add(recoilRoot);
  recoilRoot.add(poseRoot);
  poseRoot.add(handsRoot, weaponRoot);

  let result = {};
  let phase = {};
  if (cls === 'firearm') result = buildFirearm(weaponRoot, weapon, aimMode, mats);
  else if (cls === 'phase') phase = buildPhaseGesture(weaponRoot);
  else if (weapon.id !== 'fists') result = buildBlade(weaponRoot, weapon, mats);

  root.userData.weaponId = weapon.id;
  root.userData.characterRace = character?.characterProfile?.race || character?.race || 'human';
  root.userData.kind = kind;
  root.userData.weaponClass = cls;
  root.userData.aimMode = Boolean(aimMode);
  root.userData.recoilRoot = recoilRoot;
  root.userData.poseRoot = poseRoot;
  root.userData.weaponRoot = weaponRoot;
  root.userData.handsRoot = handsRoot;
  root.userData.leftArm = handsRoot.userData.leftArm;
  root.userData.rightArm = handsRoot.userData.rightArm;
  root.userData.phaseOrb = phase.orb || null;
  root.userData.phaseRing = phase.ring || null;
  root.userData.muzzleAnchor = result.muzzleAnchor || null;
  root.userData.weaponParts = result.parts || {};
  root.userData.time = 0;
  root.userData.actionElapsed = 1;
  root.userData.actionDuration = 0.3;
  root.userData.actionKind = 'primary';
  root.userData.reloadState = { active: false, progress: 0, stage: '', weaponId: weapon.id };
  root.userData.v3l1HandsWeapons = true;
  return root;
}

export function triggerWeaponViewModelAction(viewModel, actionKind = 'primary', options = {}) {
  const data = viewModel?.userData;
  if (!data?.poseRoot) return;
  data.actionElapsed = 0;
  data.actionKind = actionKind;
  data.actionDuration = options.duration
    || (actionKind === 'reload' ? 0.5 : actionKind === 'alternate' ? 0.42 : data.weaponClass === 'firearm' ? 0.18 : 0.31);
  setPlayerHandsPose(
    data.handsRoot,
    actionKind === 'reload' ? 'reload' : data.weaponClass === 'firearm' ? 'aim' : 'melee',
    { aimMode: data.aimMode },
  );
}

export function setWeaponViewModelReloadState(viewModel, reloadState = {}) {
  const data = viewModel?.userData;
  if (!data?.handsRoot) return;
  data.reloadState = {
    active: Boolean(reloadState.active),
    progress: Math.max(0, Math.min(1, reloadState.progress || 0)),
    stage: reloadState.stage || '',
    weaponId: reloadState.weaponId || data.weaponId,
  };
  const restingPose = data.aimMode
    ? 'aim'
    : data.weaponClass === 'firearm'
      ? 'idle'
      : data.weaponClass === 'phase'
        ? 'phase'
        : 'melee';
  setPlayerHandsPose(data.handsRoot, data.reloadState.active ? 'reload' : restingPose, {
    aimMode: data.aimMode,
    reloadState: data.reloadState,
  });
}

export function setWeaponViewModelAimPose(viewModel, aimMode) {
  const data = viewModel?.userData;
  if (!data?.handsRoot) return;
  data.aimMode = Boolean(aimMode);
  setPlayerHandsPose(data.handsRoot, data.aimMode ? 'aim' : 'idle', { aimMode: data.aimMode });
}

export function updateWeaponViewModel(viewModel, { dt = 1 / 60, motion, aimMode = false, paused = false } = {}) {
  const data = viewModel?.userData;
  if (!data?.poseRoot) return;
  const step = Math.min(0.05, Math.max(0.001, dt));
  data.time += step;
  data.aimMode = Boolean(aimMode);

  const speed = Math.hypot(motion?.vx || 0, motion?.vz || 0);
  const move = paused ? 0 : Math.min(1, speed / 6.2);
  const bob = motion?.bob || data.time * 2;
  const action = actionAmount(data, step);
  const breathing = Math.sin(data.time * 1.75) * (aimMode ? 0.0016 : 0.0045);
  const walkY = Math.abs(Math.sin(bob)) * (aimMode ? 0.002 : 0.012) * move;
  const walkX = Math.sin(bob * 0.5) * (aimMode ? 0.0015 : 0.009) * move;

  let poseZ = 0;
  let poseRotY = 0;
  let poseRotZ = -walkX * 0.85;
  let weaponZ = 0;
  if (['fists', 'sword', 'rapier', 'axe', 'dagger'].includes(data.kind) && action > 0) {
    const alternate = data.actionKind === 'alternate';
    poseRotY = -action * (alternate ? 0.76 : 0.5);
    poseRotZ += action * (alternate ? 0.48 : 0.29);
    poseZ = -action * (data.kind === 'fists' ? 0.2 : 0.11);
  } else if (data.weaponClass === 'firearm' && action > 0 && data.actionKind !== 'reload') {
    weaponZ = action * 0.035;
  }
  data.poseRoot.position.x = THREE.MathUtils.damp(data.poseRoot.position.x, walkX, 14, step);
  data.poseRoot.position.y = THREE.MathUtils.damp(data.poseRoot.position.y, breathing - walkY, 14, step);
  data.poseRoot.position.z = THREE.MathUtils.damp(data.poseRoot.position.z, poseZ, 14, step);
  data.poseRoot.rotation.x = THREE.MathUtils.damp(data.poseRoot.rotation.x, 0, 13, step);
  data.poseRoot.rotation.y = THREE.MathUtils.damp(data.poseRoot.rotation.y, poseRotY, 13, step);
  data.poseRoot.rotation.z = THREE.MathUtils.damp(data.poseRoot.rotation.z, poseRotZ, 13, step);
  data.weaponRoot.position.z = THREE.MathUtils.damp(data.weaponRoot.position.z, weaponZ, data.weaponClass === 'firearm' ? 22 : 18, step);

  if (data.weaponClass === 'phase') {
    const pulse = 1 + Math.sin(data.time * 5.2) * 0.08 + action * 0.42;
    data.phaseOrb?.scale.setScalar(pulse);
    data.phaseOrb?.rotation.set(data.time * 0.6, data.time * 0.9, data.time * 0.4);
    if (data.phaseRing) {
      data.phaseRing.scale.setScalar(1 + Math.sin(data.time * 3.8) * 0.07);
      data.phaseRing.rotation.z = data.time * 0.8;
    }
  }

  updateReloadParts(data);
  updatePlayerHands(data.handsRoot, {
    dt: step,
    time: data.time,
    motion: move,
    aimMode: data.aimMode,
    kind: data.kind,
    reloadState: data.reloadState,
    action: {
      kind: data.weaponClass === 'firearm' ? data.actionKind : 'melee',
      amount: data.actionKind === 'reload' ? 0 : action,
    },
  });
}

export function itemIconHtml(itemOrWeaponId) {
  const weapon = ARSENAL[itemOrWeaponId];
  if (weapon) return `<span class="itemIcon">${weapon.icon || '?'}</span>`;
  const ammo = AMMO_TYPES[itemOrWeaponId];
  if (ammo) return `<span class="itemIcon">${ammo.icon}</span>`;
  return '<span class="itemIcon">?</span>';
}
