import * as THREE from '../vendor/three.module.js';

const damp = (current, target, speed, dt) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-Math.max(0, speed) * Math.max(0, dt)));

function material(color, roughness = 0.7, metalness = 0.05, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
  });
}

const MATERIALS = {
  skin: material(0xa86f50, 0.82),
  glove: material(0x24211d, 0.88),
  gloveLight: material(0x39342d, 0.82),
  sleeve: material(0x394238, 0.94),
  cuff: material(0x171b18, 0.72, 0.22),
  phase: material(0x8eeeff, 0.3, 0.08, 0x35cfff, 2.4),
};

function raceKey(character = {}) {
  return character?.characterProfile?.race || character?.race || 'human';
}

const RACE_ANIMATION_PROFILES = {
  human: { armScale: 1, reach: 1, reloadReach: 1, gripWidth: 1, recoil: 1, speed: 1, y: 0, z: 0, reloadTwist: 1 },
  deimur: { armScale: 1.06, reach: 1.14, reloadReach: 1.18, gripWidth: 0.92, recoil: 0.86, speed: 1.08, y: 0.004, z: -0.018, reloadTwist: 1.12 },
  red: { armScale: 1.03, reach: 1.05, reloadReach: 1.06, gripWidth: 1.03, recoil: 0.9, speed: 1.02, y: 0.008, z: -0.006, reloadTwist: 1.05 },
  blue: { armScale: 1.04, reach: 1.02, reloadReach: 1, gripWidth: 1.08, recoil: 0.82, speed: 0.94, y: 0.004, z: 0.004, reloadTwist: 0.94 },
  black: { armScale: 1, reach: 1.12, reloadReach: 1.15, gripWidth: 0.94, recoil: 0.78, speed: 1.12, y: 0.002, z: -0.026, reloadTwist: 1.18, phaseSway: 1 },
  seniorReptiloid: { armScale: 1.14, reach: 1.12, reloadReach: 0.94, gripWidth: 1.18, recoil: 0.84, speed: 0.86, y: -0.006, z: 0.018, reloadTwist: 0.82, clawOffset: 1 },
  juniorReptiloid: { armScale: 0.9, reach: 0.86, reloadReach: 1.16, gripWidth: 0.86, recoil: 1.12, speed: 1.18, y: 0.014, z: -0.035, reloadTwist: 1.26, clawOffset: 1 },
  tsarbor: { armScale: 1.12, reach: 0.94, reloadReach: 0.86, gripWidth: 1.24, recoil: 0.72, speed: 0.78, y: -0.01, z: 0.026, reloadTwist: 0.76, heavyWood: 1 },
};

function raceAnimProfile(race = 'human') {
  return RACE_ANIMATION_PROFILES[race] || RACE_ANIMATION_PROFILES.human;
}

function handMaterials(character = {}) {
  const profile = character?.characterProfile || character || {};
  const race = raceKey(profile);
  const colors = {
    human: { skin: 0xa86f50, glove: 0x24211d, sleeve: profile.primaryColor || 0x394238, accent: profile.accentColor || 0x171b18 },
    deimur: { skin: 0x918681, glove: 0x34303a, sleeve: profile.primaryColor || 0x514d55, accent: profile.accentColor || 0x78dfff },
    red: { skin: 0xb94b32, glove: 0x59241c, sleeve: profile.primaryColor || 0x6f3025, accent: profile.accentColor || 0xff6b28 },
    blue: { skin: 0x6f9fc2, glove: 0x2a4c68, sleeve: profile.primaryColor || 0x385a7d, accent: profile.accentColor || 0x8feaff },
    black: { skin: 0x241c2d, glove: 0x100d16, sleeve: profile.primaryColor || 0x17131f, accent: profile.accentColor || 0x794dff },
    seniorReptiloid: { skin: 0x637d50, glove: 0x33412b, sleeve: profile.primaryColor || 0x394235, accent: profile.accentColor || 0xd47a3f },
    juniorReptiloid: { skin: 0x78945d, glove: 0x3d4e32, sleeve: profile.primaryColor || 0x43503c, accent: profile.accentColor || 0xd5bd65 },
    tsarbor: { skin: 0x70583a, glove: 0x473522, sleeve: profile.primaryColor || 0x304a34, accent: profile.accentColor || 0x4f8a48 },
  }[race] || {};
  const emissiveRace = ['deimur', 'red', 'blue', 'black'].includes(race);
  return {
    ...MATERIALS,
    skin: material(colors.skin || 0xa86f50, race.includes('Reptiloid') ? 0.68 : 0.82),
    glove: material(colors.glove || 0x24211d, 0.86),
    gloveLight: material(colors.skin || colors.glove || 0x39342d, 0.8),
    sleeve: material(new THREE.Color(colors.sleeve || 0x394238).getHex(), 0.94),
    cuff: material(new THREE.Color(colors.accent || 0x171b18).getHex(), 0.62, 0.12, emissiveRace ? new THREE.Color(colors.accent).getHex() : 0x000000, emissiveRace ? 0.48 : 0),
    racialAccent: material(new THREE.Color(colors.accent || 0xd8a64d).getHex(), 0.42, 0.08, emissiveRace ? new THREE.Color(colors.accent).getHex() : 0x000000, emissiveRace ? 0.8 : 0),
  };
}

const MELEE_KINDS = ['blade', 'sword', 'rapier', 'axe', 'dagger'];

function mesh(parent, geometry, mat, name, position, rotation = [0, 0, 0]) {
  const node = new THREE.Mesh(geometry, mat);
  node.name = name;
  node.position.set(...position);
  node.rotation.set(...rotation);
  node.castShadow = false;
  node.receiveShadow = false;
  parent.add(node);
  return node;
}

function box(parent, size, mat, name, position, rotation) {
  return mesh(parent, new THREE.BoxGeometry(...size), mat, name, position, rotation);
}

function capsule(parent, radius, length, mat, name, position, rotation) {
  return mesh(
    parent,
    new THREE.CapsuleGeometry(radius, length, 5, 7),
    mat,
    name,
    position,
    rotation,
  );
}

function rememberBase(node) {
  node.userData.basePosition = node.position.clone();
  node.userData.baseRotation = node.rotation.clone();
}

function addFinger(hand, side, index, curled, phase, mats, race = 'human') {
  const profile = raceAnimProfile(race);
  const spread = (index - 1.5) * 0.034 * profile.gripWidth;
  const fingerMat = phase ? mats.skin : mats.gloveLight;
  const length = (index === 0 || index === 3 ? 0.085 : 0.1) * (profile.clawOffset ? 0.92 : 1);
  const x = side * spread;
  const y = phase ? -0.005 : -0.017 - Math.abs(index - 1.5) * 0.003;
  const z = -0.12 - (index === 0 || index === 3 ? 0.008 : 0);
  const finger = capsule(
    hand,
    0.018,
    length,
    fingerMat,
    `${side < 0 ? 'left' : 'right'}-finger-${index + 1}`,
    [x, y, z],
    [curled ? 1.05 : Math.PI / 2, 0, 0],
  );
  finger.scale.z = 0.86;
}

function createArm(side, kind, character = {}) {
  const phase = kind === 'phase';
  const melee = MELEE_KINDS.includes(kind);
  const fist = kind === 'fists';
  const arm = new THREE.Group();
  arm.name = side < 0 ? 'left-first-person-arm' : 'right-first-person-arm';
  const race = raceKey(character);
  const mats = handMaterials(character);
  const profile = raceAnimProfile(race);

  const armScale = profile.armScale;
  box(arm, [0.15 * armScale, 0.14 * armScale, 0.42 * profile.reach], mats.sleeve, `${arm.name}-sleeve`, [0, 0.012, 0.08]);
  box(arm, [0.168 * armScale, 0.16 * armScale, 0.105], mats.cuff, `${arm.name}-cuff`, [0, 0, -0.17 * profile.reach]);

  const showRacialSkin = race !== 'human' || phase;
  const handMat = showRacialSkin ? mats.skin : mats.glove;
  const palm = box(
    arm,
    [0.155 * (0.92 + profile.gripWidth * 0.08), 0.092 * armScale, 0.19 * profile.reach],
    handMat,
    `${arm.name}-palm`,
    [0, -0.004, -0.30 * profile.reach],
    [0.06, 0, 0],
  );
  palm.scale.x = side < 0 ? 0.96 : 1;

  const curled = fist || melee || (!phase && kind === 'firearm');
  const fingers = new THREE.Group();
  fingers.name = `${arm.name}-fingers`;
  fingers.position.set(0, -0.004, -0.31 * profile.reach);
  arm.add(fingers);
  for (let index = 0; index < 4; index += 1) {
    addFinger(fingers, side, index, curled, phase, mats, race);
  }

  capsule(
    arm,
    0.025 * armScale,
    0.085 * profile.reach,
    handMat,
    `${arm.name}-thumb`,
    [side * 0.09 * profile.gripWidth, -0.026, -0.28 * profile.reach],
    [0.45, 0, side * 0.72],
  );

  if (phase) {
    const sigil = mesh(
      arm,
      new THREE.TorusGeometry(0.052, 0.008, 6, 14),
      mats.phase,
      `${arm.name}-phase-sigil`,
      [0, 0.052, -0.315],
      [Math.PI / 2, 0, 0],
    );
    sigil.userData.phaseSigil = true;
  }

  if (['seniorReptiloid', 'juniorReptiloid'].includes(race)) {
    for (let index = 0; index < 3; index += 1) {
      capsule(
        arm,
        0.012,
        race === 'juniorReptiloid' ? 0.075 : 0.06,
        mats.racialAccent,
        `${arm.name}-claw-${index}`,
        [(index - 1) * 0.045 * profile.gripWidth, -0.035, -0.43 * profile.reach],
        [Math.PI / 2, 0, 0],
      );
    }
  }
  if (race === 'red') {
    box(arm, [0.012, 0.018, 0.24], mats.racialAccent, `${arm.name}-ember-crack`, [side * 0.035, 0.052, -0.25], [0, 0, side * 0.18]);
  }
  if (race === 'blue') {
    for (const offset of [-0.055, 0.055]) {
      mesh(arm, new THREE.ConeGeometry(0.022, 0.12, 6), mats.racialAccent, `${arm.name}-ice-spur-${offset}`, [offset * profile.gripWidth, 0.075, -0.18], [0, 0, offset * 3]);
    }
  }
  if (race === 'black') {
    mesh(arm, new THREE.TorusGeometry(0.09, 0.008, 6, 14), mats.racialAccent, `${arm.name}-null-ring`, [0, 0.06, -0.31], [Math.PI / 2, 0, 0]);
  }
  if (race === 'deimur') {
    mesh(arm, new THREE.OctahedronGeometry(0.035, 0), mats.racialAccent, `${arm.name}-resonance-node`, [side * 0.04, 0.075, -0.2]);
  }
  if (race === 'tsarbor') {
    for (let index = 0; index < 3; index += 1) {
      box(arm, [0.13, 0.018, 0.045], mats.racialAccent, `${arm.name}-bark-ridge-${index}`, [0, 0.075, -0.2 - index * 0.075], [0, side * 0.08, 0]);
    }
  }

  arm.userData.race = race;
  arm.userData.raceProfile = profile;
  rememberBase(arm);
  return arm;
}

function basePose(kind, aimMode) {
  if (kind === 'phase') {
    return {
      name: 'phase',
      left: { p: [-0.23, -0.31, -0.30], r: [-0.2, 0.18, 0.13] },
      right: { p: [0.23, -0.31, -0.30], r: [-0.2, -0.18, -0.13] },
    };
  }
  if (kind === 'fists') {
    return {
      name: 'melee',
      left: { p: [-0.22, -0.28, -0.22], r: [-0.56, 0.15, 0.08] },
      right: { p: [0.22, -0.29, -0.18], r: [-0.5, -0.15, -0.08] },
    };
  }
  if (MELEE_KINDS.includes(kind)) {
    return {
      name: 'melee',
      left: { p: [-0.27, -0.33, -0.20], r: [-0.42, 0.16, 0.13] },
      right: { p: [0.25, -0.30, -0.12], r: [-0.6, -0.08, -0.22] },
    };
  }
  if (aimMode) {
    return {
      name: 'aim',
      left: { p: [-0.12, -0.265, -0.34], r: [-0.62, 0.08, 0.04] },
      right: { p: [0.12, -0.265, -0.18], r: [-0.62, -0.08, -0.04] },
    };
  }
  return {
    name: 'firearm',
    left: { p: [-0.19, -0.335, -0.27], r: [-0.48, 0.12, 0.08] },
    right: { p: [0.22, -0.325, -0.13], r: [-0.55, -0.08, -0.13] },
  };
}

function weaponFamily(weaponId = '') {
  if (['m1911a1', 'lugerP08', 'tt33', 'colt'].includes(weaponId)) return 'pistolMag';
  if (['webleyMkVI'].includes(weaponId)) return 'revolver';
  if (['k98k', 'mosin9130', 'leeEnfieldNo4'].includes(weaponId)) return 'boltRifle';
  if (['m1GarandWw2', 'garand', 'm1'].includes(weaponId)) return 'semiRifle';
  if (['mp40', 'ppsh41', 'thompsonM1928'].includes(weaponId)) return 'smg';
  if (['winchester1897', 'shotgun'].includes(weaponId)) return 'shotgunPump';
  if (['browningAuto5'].includes(weaponId)) return 'shotgunAuto';
  if (['doubleBarrelSawedOff'].includes(weaponId)) return 'shotgunBreak';
  if (['mg42'].includes(weaponId)) return 'lmgBelt';
  if (['dp28'].includes(weaponId)) return 'lmgPan';
  if (['brenMk1Ww2', 'brenMk', 'bren'].includes(weaponId)) return 'lmgTop';
  if (['bazookaM1', 'bazooka', 'panzerfaust30', 'panzerfaust'].includes(weaponId)) return 'launcher';
  if (['ptrd41', 'ptrd', 'boysAT', 'boysAt', 'lahtiL39', 'solothurn'].includes(weaponId)) return 'atRifle';
  if (['mk2GrenadeProto', 'grenadeMk2', 'molotovProto', 'molotov'].includes(weaponId)) return 'thrown';
  return 'generic';
}

function pose(left, right) { return { left, right }; }
function sideAdjust(value, profile, side) {
  return [
    value[0] * profile.gripWidth + side * (profile.gripWidth - 1) * 0.025,
    value[1] + profile.y,
    value[2] * profile.reach + profile.z,
  ];
}
function rotAdjust(value, profile) {
  return [value[0], value[1] * profile.reloadTwist, value[2] * profile.reloadTwist];
}
function applyRaceToPose(input, race, weaponId = '', kind = 'firearm') {
  const profile = raceAnimProfile(race);
  const family = weaponFamily(weaponId);
  const supportBonus = ['lmgBelt', 'lmgPan', 'lmgTop', 'launcher', 'atRifle'].includes(family) ? 0.04 * (profile.gripWidth - 1) : 0;
  const leftP = sideAdjust(input.left.p, profile, -1);
  const rightP = sideAdjust(input.right.p, profile, 1);
  leftP[0] -= supportBonus;
  rightP[0] += supportBonus * 0.35;
  if (profile.phaseSway && kind === 'firearm') {
    leftP[2] -= 0.018;
    rightP[2] -= 0.012;
  }
  return {
    name: input.name,
    left: { p: leftP, r: rotAdjust(input.left.r, profile) },
    right: { p: rightP, r: rotAdjust(input.right.r, profile) },
  };
}

function reloadPose(weaponId, progress, stage, race = 'human') {
  const profile = raceAnimProfile(race);
  const reach = Math.sin(Math.min(1, progress) * Math.PI) * profile.reloadReach;
  const settle = Math.sin(Math.min(1, progress) * Math.PI * 2) * 0.04;
  const family = weaponFamily(weaponId);
  const loadPulse = stage === 'load' || stage === 'insert' ? Math.sin(progress * Math.PI * 6) : 0;
  let out;

  if (family === 'pistolMag') {
    out = pose(
      { p: [0.13 * reach, 0.10 * reach + settle, -0.12 * reach], r: [-0.2 * reach, 0.42 * reach, -0.3 * reach] },
      { p: [0.02, 0.05 * reach, 0.03], r: [0.12 * reach, 0, 0.38 * reach] },
    );
  } else if (family === 'revolver') {
    out = pose(
      { p: [0.10 * reach, 0.08 * reach, -0.08 * reach], r: [-0.15 * reach, 0.35 * reach, -0.22 * reach] },
      { p: [0.02, 0.035 * reach, 0.035], r: [0.18 * reach, -0.18 * reach, 0.45 * reach] },
    );
  } else if (family === 'lmgTop' || family === 'lmgPan') {
    out = pose(
      { p: [0.22 * reach, 0.32 * reach, -0.13 * reach], r: [-0.72 * reach, -0.22 * reach, -0.5 * reach] },
      { p: [0, 0.03 * reach, 0.03], r: [0.08 * reach, 0, 0.18 * reach] },
    );
  } else if (family === 'lmgBelt') {
    out = pose(
      { p: [0.25 * reach, 0.26 * reach + settle, -0.05 * reach], r: [-0.62 * reach, -0.34 * reach, -0.68 * reach] },
      { p: [0.02, 0.05 * reach, 0.03], r: [0.16 * reach, 0.08 * reach, 0.2 * reach] },
    );
  } else if (family === 'shotgunPump' || family === 'shotgunAuto') {
    out = pose(
      { p: [0.10 * reach, 0.06 * reach + loadPulse * 0.025, -0.15 * reach], r: [-0.35 * reach, 0.32 * reach, -0.12 * reach] },
      { p: [0, 0.02 * reach, 0.035], r: [0.06 * reach, 0, 0.12 * reach] },
    );
  } else if (family === 'shotgunBreak') {
    out = pose(
      { p: [0.12 * reach, -0.02 * reach, -0.06 * reach], r: [0.38 * reach, 0.24 * reach, -0.25 * reach] },
      { p: [0.01, 0.035 * reach, 0.04], r: [0.28 * reach, 0, 0.18 * reach] },
    );
  } else if (family === 'semiRifle' || family === 'boltRifle') {
    out = pose(
      { p: [0.16 * reach, 0.20 * reach, -0.18 * reach], r: [-0.5 * reach, -0.22 * reach, -0.34 * reach] },
      { p: [0.02, 0.04 * reach, 0.035], r: [0.12 * reach, 0, 0.18 * reach] },
    );
  } else if (family === 'smg') {
    out = pose(
      { p: [0.16 * reach, 0.17 * reach + settle, -0.11 * reach], r: [-0.46 * reach, -0.12 * reach, -0.26 * reach] },
      { p: [0.01, 0.035 * reach, 0.025], r: [0.1 * reach, 0, 0.14 * reach] },
    );
  } else if (family === 'launcher') {
    out = pose(
      { p: [0.24 * reach, 0.18 * reach, -0.28 * reach], r: [-0.28 * reach, -0.28 * reach, -0.62 * reach] },
      { p: [0.02, 0.03 * reach, 0.025], r: [0.12 * reach, 0.08 * reach, 0.16 * reach] },
    );
  } else if (family === 'atRifle') {
    out = pose(
      { p: [0.25 * reach, 0.24 * reach, -0.24 * reach], r: [-0.58 * reach, -0.28 * reach, -0.42 * reach] },
      { p: [0.02, 0.05 * reach, 0.04], r: [0.18 * reach, 0.04 * reach, 0.22 * reach] },
    );
  } else if (family === 'thrown') {
    out = pose(
      { p: [0.10 * reach, 0.08 * reach, -0.04 * reach], r: [-0.2 * reach, 0.4 * reach, -0.2 * reach] },
      { p: [0.04 * reach, 0.10 * reach, -0.08 * reach], r: [-0.42 * reach, -0.22 * reach, 0.36 * reach] },
    );
  } else {
    out = pose(
      { p: [0.14 * reach, 0.15 * reach + settle, -0.15 * reach], r: [-0.42 * reach, -0.15 * reach, -0.28 * reach] },
      { p: [0.01, 0.035 * reach, 0.025], r: [0.1 * reach, 0, 0.14 * reach] },
    );
  }
  return applyRaceToPose({ name: 'reload', ...out }, race, weaponId);
}

function actionPose(action, side, race = 'human') {
  if (!action?.amount) return { p: [0, 0, 0], r: [0, 0, 0] };
  const profile = raceAnimProfile(race);
  const amount = action.amount;
  if (action.kind === 'melee' || action.kind === 'alternate') {
    const direction = side < 0 ? -1 : 1;
    return {
      p: [direction * 0.035 * amount * profile.gripWidth, 0.045 * amount, -0.16 * amount * profile.reach],
      r: [-0.72 * amount, direction * 0.3 * amount * profile.reloadTwist, direction * -0.25 * amount * profile.reloadTwist],
    };
  }
  if (action.kind === 'primary') {
    return {
      p: [0, 0.015 * amount * profile.recoil, 0.055 * amount * profile.recoil],
      r: [0.12 * amount * profile.recoil, 0, side * 0.035 * amount * profile.recoil],
    };
  }
  return { p: [0, 0, 0], r: [0, 0, 0] };
}

function combine(...values) {
  return values.reduce(
    (result, value) => result.map((component, index) => component + (value?.[index] || 0)),
    [0, 0, 0],
  );
}

function moveArm(arm, target, dt, speedMul = 1) {
  arm.position.x = damp(arm.position.x, target.p[0], 17 * speedMul, dt);
  arm.position.y = damp(arm.position.y, target.p[1], 17 * speedMul, dt);
  arm.position.z = damp(arm.position.z, target.p[2], 17 * speedMul, dt);
  arm.rotation.x = damp(arm.rotation.x, target.r[0], 18 * speedMul, dt);
  arm.rotation.y = damp(arm.rotation.y, target.r[1], 18 * speedMul, dt);
  arm.rotation.z = damp(arm.rotation.z, target.r[2], 18 * speedMul, dt);
}

export function createPlayerHands(kind = 'firearm', aimMode = false, character = {}) {
  const root = new THREE.Group();
  root.name = 'v3l1-first-person-hands';
  const race = raceKey(character);
  const leftArm = createArm(-1, kind, character);
  const rightArm = createArm(1, kind, character);
  root.add(leftArm, rightArm);
  root.userData.kind = kind;
  root.userData.race = race;
  root.userData.raceProfile = raceAnimProfile(race);
  root.userData.aimMode = Boolean(aimMode);
  root.userData.leftArm = leftArm;
  root.userData.rightArm = rightArm;
  root.userData.poseHook = aimMode ? 'aim' : kind === 'firearm' ? 'idle' : kind;
  root.userData.reloadState = { active: false, progress: 0, stage: '', weaponId: '' };
  return root;
}

export function setPlayerHandsPose(handsRoot, poseName, options = {}) {
  if (!handsRoot?.userData) return;
  handsRoot.userData.poseHook = poseName;
  if ('aimMode' in options) handsRoot.userData.aimMode = Boolean(options.aimMode);
  if (options.reloadState) handsRoot.userData.reloadState = { ...options.reloadState };
}

export function updatePlayerHands(handsRoot, context = {}) {
  const leftArm = handsRoot?.userData?.leftArm;
  const rightArm = handsRoot?.userData?.rightArm;
  if (!leftArm || !rightArm) return;

  const dt = Math.min(0.05, Math.max(0.001, context.dt || 1 / 60));
  const kind = context.kind || handsRoot.userData.kind || 'firearm';
  const aimMode = context.aimMode ?? handsRoot.userData.aimMode ?? false;
  const reload = context.reloadState || handsRoot.userData.reloadState;
  const race = handsRoot.userData.race || 'human';
  const profile = handsRoot.userData.raceProfile || raceAnimProfile(race);
  const pose = applyRaceToPose(basePose(kind, aimMode), race, reload?.weaponId, kind);
  const reloadOffsets = reload?.active
    ? reloadPose(reload.weaponId, reload.progress || 0, reload.stage || '', race)
    : { left: { p: [0, 0, 0], r: [0, 0, 0] }, right: { p: [0, 0, 0], r: [0, 0, 0] } };

  const motion = context.motion || 0;
  const time = context.time || 0;
  const idleScale = aimMode ? 0.28 : 1;
  const racialSway = profile.phaseSway ? 1.25 : profile.heavyWood ? 0.65 : 1;
  const idle = [
    Math.sin(time * 1.15) * 0.004 * idleScale * racialSway,
    Math.sin(time * 1.7 + 0.7) * 0.006 * idleScale * racialSway + Math.sin(time * 7.5) * 0.006 * motion,
    Math.cos(time * 1.3) * 0.004 * idleScale * racialSway,
  ];
  const leftAction = actionPose(context.action, -1, race);
  const rightAction = actionPose(context.action, 1, race);

  moveArm(
    leftArm,
    {
      p: combine(pose.left.p, idle, reloadOffsets.left.p, leftAction.p),
      r: combine(pose.left.r, [idle[1] * -0.5, idle[0], idle[0]], reloadOffsets.left.r, leftAction.r),
    },
    dt,
    profile.speed,
  );
  moveArm(
    rightArm,
    {
      p: combine(pose.right.p, [-idle[0], idle[1], idle[2]], reloadOffsets.right.p, rightAction.p),
      r: combine(pose.right.r, [idle[1] * -0.5, -idle[0], -idle[0]], reloadOffsets.right.r, rightAction.r),
    },
    dt,
    profile.speed,
  );

  handsRoot.userData.poseHook = reload?.active ? `reload-${race}-${weaponFamily(reload.weaponId)}` : aimMode ? `aim-${race}` : `${pose.name}-${race}`;
}
