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

function buildBren(root, aimMode, mats) {
  // Hip pose sits lower and further right so the gun reads clearly without
  // covering the centre of the screen; aim pose centres it over the sights.
  const x = aimMode ? 0.02 : 0.22;
  const y = aimMode ? -0.30 : -0.42;
  const receiverZ = -0.72;
  // Compact receiver + clean wood furniture.
  box(root, [0.16, 0.185, 0.5], mats.gunmetal, 'bren-heavy-receiver', [x, y, receiverZ]);
  box(root, [0.155, 0.16, 0.4], mats.wood, 'bren-stock', [x, y - 0.03, receiverZ + 0.44], [-0.04, 0, 0]);
  box(root, [0.14, 0.13, 0.34], mats.woodLight, 'bren-foregrip', [x, y - 0.03, receiverZ - 0.34]);
  box(root, [0.07, 0.17, 0.08], mats.dark, 'bren-pistol-grip', [x, y - 0.135, receiverZ + 0.14], [0.32, 0, 0]);
  // Shorter visible barrel + ribbed jacket.
  cylinder(root, 0.027, 0.58, mats.blueSteel, 'bren-heavy-barrel', [x, y + 0.025, receiverZ - 0.74], 'z', 12);
  cylinder(root, 0.045, 0.26, mats.dark, 'bren-barrel-jacket', [x, y + 0.025, receiverZ - 0.56], 'z', 12);
  // Iconic top magazine — smaller, gently curved, nudged left so it never blocks the sight line.
  const magazineSize = aimMode ? [0.13, 0.24, 0.11] : [0.15, 0.3, 0.12];
  const magazine = remember(box(root, magazineSize, mats.gunmetal, 'bren-top-magazine', [x - 0.04, y + 0.25, receiverZ - 0.05], [0.14, 0, aimMode ? -0.14 : 0.06]));
  box(root, [0.04, 0.04, 0.24], mats.dark, 'bren-carry-handle', [x + 0.11, y + 0.13, receiverZ - 0.1], [0, 0, -0.32]);
  // Trim folded bipod tucked under the front, low profile.
  const bipodLeft = box(root, [0.02, 0.3, 0.02], mats.gunmetal, 'bren-bipod-left', [x - 0.08, y - 0.15, receiverZ - 0.82], [0.2, 0, -0.24]);
  const bipodRight = box(root, [0.02, 0.3, 0.02], mats.gunmetal, 'bren-bipod-right', [x + 0.08, y - 0.15, receiverZ - 0.82], [0.2, 0, 0.24]);
  bipodLeft.rotation.x = bipodRight.rotation.x = 0.2;
  addSight(root, x, y + 0.125, receiverZ - 0.86, mats);
  return {
    muzzleAnchor: muzzleAnchor(root, x, y + 0.025, receiverZ - 1.02),
    parts: { magazine },
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

function buildFirearm(root, weapon, aimMode, mats) {
  if (weapon.id === 'colt') return buildRevolver(root, aimMode, mats);
  if (weapon.id === 'm1') return buildM1(root, aimMode, mats, weapon);
  if (weapon.id === 'bren') return buildBren(root, aimMode, mats);
  if (weapon.id === 'trenchShotgun') return buildShotgun(root, aimMode, mats, weapon);
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

  const progress = Math.max(0, Math.min(1, reload.progress || 0));
  const reach = Math.sin(progress * Math.PI);
  if (data.weaponId === 'colt' && parts.cylinder) {
    parts.cylinder.rotation.x += progress * Math.PI * 4;
    parts.cylinder.position.x -= reach * 0.085;
  } else if (data.weaponId === 'm1') {
    if (parts.bolt) parts.bolt.position.z += reach * 0.12;
    if (parts.boltHandle) parts.boltHandle.position.z += reach * 0.12;
  } else if (data.weaponId === 'bren' && parts.magazine) {
    parts.magazine.position.y += reach * 0.2;
    parts.magazine.rotation.z += reach * 0.28;
  } else if (data.weaponId === 'trenchShotgun' && parts.pump) {
    parts.pump.position.z += Math.sin(progress * Math.PI * 4) * 0.14 * reach;
  } else if (data.weaponId === 'caravanCarbine') {
    if (parts.bolt) parts.bolt.position.z += reach * 0.1;
    if (parts.boltHandle) parts.boltHandle.position.z += reach * 0.1;
    if (parts.magazine) parts.magazine.position.y -= reach * 0.08;
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
