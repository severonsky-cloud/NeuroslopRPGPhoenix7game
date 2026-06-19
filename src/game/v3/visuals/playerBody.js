import * as THREE from '../vendor/three.module.js';
import { makeMat } from '../world/props.js';

export const PLAYER_BODY_RACE_PROFILES = Object.freeze({
  human: {
    id: 'human',
    label: 'Человек',
    heightScale: 1,
    widthScale: 1,
    eyeHeight: 1.72,
    animationSpeedMultiplier: 1,
    gaitMultiplier: 1,
    morphology: 'human',
    coat: 0x44382b,
    coatDark: 0x2b261f,
    trousers: 0x292824,
    leather: 0x24170f,
    skin: 0xb9825d,
  },
  deimur: {
    id: 'deimur',
    label: 'Деймур',
    heightScale: 1.07,
    widthScale: 0.94,
    eyeHeight: 1.82,
    animationSpeedMultiplier: 0.96,
    gaitMultiplier: 0.96,
    morphology: 'deimur',
    coat: 0x514d55,
    coatDark: 0x25242c,
    trousers: 0x302e35,
    leather: 0x201d25,
    skin: 0x918681,
    emissive: 0x78dfff,
  },
  red: {
    id: 'red',
    label: 'Красный элементаль',
    heightScale: 1.02,
    widthScale: 1.08,
    eyeHeight: 1.75,
    animationSpeedMultiplier: 1.02,
    gaitMultiplier: 1.02,
    morphology: 'red',
    coat: 0x6f3025,
    coatDark: 0x351a16,
    trousers: 0x49241e,
    leather: 0x2a1814,
    skin: 0xb94b32,
    emissive: 0xff6b28,
  },
  blue: {
    id: 'blue',
    label: 'Синий элементаль',
    heightScale: 1.01,
    widthScale: 0.96,
    eyeHeight: 1.74,
    animationSpeedMultiplier: 1.12,
    gaitMultiplier: 1.14,
    morphology: 'blue',
    coat: 0x385a7d,
    coatDark: 0x1f354d,
    trousers: 0x2d4762,
    leather: 0x182738,
    skin: 0x6f9fc2,
    emissive: 0x8feaff,
  },
  black: {
    id: 'black',
    label: 'Чёрный элементаль',
    heightScale: 1.03,
    widthScale: 0.98,
    eyeHeight: 1.77,
    animationSpeedMultiplier: 0.98,
    gaitMultiplier: 0.94,
    morphology: 'black',
    coat: 0x17131f,
    coatDark: 0x09070e,
    trousers: 0x17151d,
    leather: 0x0c0911,
    skin: 0x241c2d,
    emissive: 0x794dff,
  },
  seniorReptiloid: {
    id: 'seniorReptiloid',
    label: 'Старший рептилоид',
    heightScale: 1.01,
    widthScale: 1.08,
    eyeHeight: 1.73,
    animationSpeedMultiplier: 0.92,
    gaitMultiplier: 0.94,
    morphology: 'seniorReptiloid',
    reptilian: true,
    coat: 0x394235,
    coatDark: 0x202b22,
    trousers: 0x28302a,
    leather: 0x1d2119,
    skin: 0x637d50,
    accent: 0xd47a3f,
  },
  juniorReptiloid: {
    id: 'juniorReptiloid',
    label: 'Младший рептилоид',
    heightScale: 0.9,
    widthScale: 0.92,
    eyeHeight: 1.55,
    animationSpeedMultiplier: 1.16,
    gaitMultiplier: 1.22,
    reptilian: true,
    junior: true,
    morphology: 'juniorReptiloid',
    coat: 0x43503c,
    coatDark: 0x263127,
    trousers: 0x2b342d,
    leather: 0x202219,
    skin: 0x78945d,
  },
  tsarbor: {
    id: 'tsarbor',
    label: 'Царбор',
    heightScale: 1.09,
    widthScale: 1.12,
    eyeHeight: 1.87,
    animationSpeedMultiplier: 0.94,
    gaitMultiplier: 0.92,
    morphology: 'tsarbor',
    coat: 0x304a34,
    coatDark: 0x1d3022,
    trousers: 0x26362a,
    leather: 0x2a2117,
    skin: 0x70583a,
  },
});

const RACE_ALIASES = Object.freeze({
  human: 'human',
  humans: 'human',
  человек: 'human',
  deimur: 'deimur',
  red: 'red',
  redelemental: 'red',
  blue: 'blue',
  blueelemental: 'blue',
  black: 'black',
  blackelemental: 'black',
  reptiloid: 'seniorReptiloid',
  reptilian: 'seniorReptiloid',
  рептилоид: 'seniorReptiloid',
  seniorreptiloid: 'seniorReptiloid',
  старшийрептилоид: 'seniorReptiloid',
  juniorreptiloid: 'juniorReptiloid',
  junior_reptiloid: 'juniorReptiloid',
  minorreptiloid: 'juniorReptiloid',
  младшийрептилоид: 'juniorReptiloid',
  tsarbor: 'tsarbor',
  царборец: 'tsarbor',
  царбор: 'tsarbor',
});

function normalizedRaceKey(value) {
  return String(value || 'human').trim().toLowerCase().replace(/[\s-]+/g, '');
}

export function resolvePlayerBodyRace(playerOrRace) {
  const raw = typeof playerOrRace === 'string'
    ? playerOrRace
    : playerOrRace?.race || playerOrRace?.species || playerOrRace?.bodyRace || 'human';
  const profileId = RACE_ALIASES[normalizedRaceKey(raw)] || 'human';
  const base = PLAYER_BODY_RACE_PROFILES[profileId];
  const character = typeof playerOrRace === 'object'
    ? playerOrRace?.characterProfile || playerOrRace
    : null;
  if (!character) return base;
  const heightOffset = THREE.MathUtils.clamp(Number(character.heightOffset) || 0, -0.05, 0.05);
  const heightMultiplier = 1 + heightOffset;
  const primaryColor = character.primaryColor ? new THREE.Color(character.primaryColor).getHex() : base.coat;
  const accentColor = character.accentColor ? new THREE.Color(character.accentColor).getHex() : (base.accent || base.coatDark);
  return {
    ...base,
    heightScale: base.heightScale * heightMultiplier,
    eyeHeight: base.eyeHeight * heightMultiplier,
    coat: primaryColor,
    coatDark: new THREE.Color(primaryColor).multiplyScalar(0.55).getHex(),
    accent: accentColor,
    gender: character.gender || 'male',
    heightOffset,
    signature: `${profileId}:${character.gender || 'male'}:${character.primaryColor || ''}:${character.accentColor || ''}:${heightOffset}`,
  };
}

function mesh(geometry, material, name, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const node = new THREE.Mesh(geometry, material);
  node.name = name;
  node.position.set(...position);
  node.rotation.set(...rotation);
  node.castShadow = true;
  node.receiveShadow = true;
  return node;
}

function box(size, material, name, position, rotation) {
  return mesh(new THREE.BoxGeometry(...size), material, name, position, rotation);
}

function capsule(radius, length, material, name, position, rotation = [0, 0, 0]) {
  return mesh(new THREE.CapsuleGeometry(radius, length, 5, 8), material, name, position, rotation);
}

function cylinder(radius, length, material, name, position, axis = 'y') {
  const rotation = axis === 'z' ? [Math.PI / 2, 0, 0] : axis === 'x' ? [0, 0, Math.PI / 2] : [0, 0, 0];
  return mesh(new THREE.CylinderGeometry(radius, radius, length, 8), material, name, position, rotation);
}

function cone(radius, length, material, name, position, rotation = [0, 0, 0]) {
  return mesh(new THREE.ConeGeometry(radius, length, 7), material, name, position, rotation);
}

function buildMaterials(profile) {
  const accent = profile.accent || profile.emissive || 0x8e6c32;
  return {
    coat: makeMat(profile.coat, { roughness: 0.94 }),
    coatDark: makeMat(profile.coatDark, { roughness: 0.96 }),
    trousers: makeMat(profile.trousers, { roughness: 0.96 }),
    leather: makeMat(profile.leather, { roughness: 0.84 }),
    skin: makeMat(profile.skin, { roughness: profile.reptilian ? 0.74 : 0.88 }),
    brass: makeMat(0x8e6c32, { roughness: 0.44, metalness: 0.2 }),
    strap: makeMat(0x20170f, { roughness: 0.9 }),
    accent: makeMat(accent, {
      roughness: 0.42,
      metalness: profile.morphology === 'black' ? 0.22 : 0.05,
      emissive: profile.emissive || 0x000000,
      emissiveIntensity: profile.emissive ? 0.78 : 0,
    }),
    bark: makeMat(0x4b3323, { roughness: 1 }),
  };
}

function createSoftShadowMaterial() {
  if (typeof document === 'undefined') {
    return new THREE.MeshBasicMaterial({
      color: 0x100c09,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(10,7,5,0.72)');
  gradient.addColorStop(0.5, 'rgba(10,7,5,0.34)');
  gradient.addColorStop(1, 'rgba(10,7,5,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    toneMapped: false,
  });
}

function createContactShadow(profile) {
  const shadow = mesh(
    new THREE.CircleGeometry(0.72 * profile.widthScale, 28),
    createSoftShadowMaterial(),
    'player-contact-shadow',
    [0, 0.035, 0.05],
    [-Math.PI / 2, 0, 0],
  );
  shadow.castShadow = false;
  shadow.receiveShadow = false;
  shadow.renderOrder = 2;
  shadow.userData.contactShadow = true;
  return shadow;
}

function addReptileClaws(boot, side, materials) {
  for (let index = -1; index <= 1; index += 1) {
    const claw = cone(
      0.025,
      0.12,
      materials.skin,
      `${side}-boot-claw-${index + 2}`,
      [index * 0.045, -0.035, -0.22],
      [Math.PI / 2, 0, 0],
    );
    boot.add(claw);
  }
}

function createLeg(side, profile, materials) {
  const sideName = side < 0 ? 'left' : 'right';
  const leg = new THREE.Group();
  leg.name = `player-body-${sideName}-leg`;
  leg.position.set(side * 0.155, 0.88, -0.14);

  leg.add(capsule(0.105, 0.34, materials.trousers, `${sideName}-thigh`, [0, -0.2, 0]));
  leg.add(capsule(0.088, 0.34, materials.trousers, `${sideName}-shin`, [0, -0.54, -0.065], [-0.05, 0, 0]));
  const boot = new THREE.Group();
  boot.name = `${sideName}-boot-root`;
  boot.position.set(0, -0.79, -0.15);
  boot.add(box([0.19, 0.18, 0.36], materials.leather, `${sideName}-boot`, [0, 0, -0.07], [-0.04, 0, 0]));
  if (profile.reptilian) addReptileClaws(boot, sideName, materials);
  leg.add(boot);
  return leg;
}

function createArm(side, materials) {
  const sideName = side < 0 ? 'left' : 'right';
  const arm = new THREE.Group();
  arm.name = `player-body-${sideName}-arm`;
  arm.position.set(side * 0.39, 1.42, 0.02);
  arm.rotation.z = side * -0.08;
  arm.add(capsule(0.085, 0.48, materials.coat, `${sideName}-coat-sleeve`, [0, -0.28, 0]));
  arm.add(capsule(0.067, 0.12, materials.leather, `${sideName}-world-glove`, [0, -0.63, -0.015]));
  return arm;
}

function createHead(profile, materials) {
  const headRoot = new THREE.Group();
  headRoot.name = 'player-body-head-root';
  headRoot.position.set(0, 1.76, 0);
  if (profile.morphology === 'seniorReptiloid') {
    const skull = mesh(new THREE.IcosahedronGeometry(0.22, 1), materials.skin, 'reptiloid-head');
    skull.scale.set(0.92, 1.05, 1.06);
    headRoot.add(skull);
    headRoot.add(box([0.18, 0.105, 0.18], materials.skin, 'reptiloid-snout', [0, -0.03, -0.2], [-0.08, 0, 0]));
    for (let index = 0; index < 9; index += 1) {
      const angle = -1.15 + index * 0.285;
      headRoot.add(cone(
        0.045,
        0.19,
        index % 2 ? materials.accent : materials.skin,
        `senior-reptiloid-frill-${index}`,
        [Math.sin(angle) * 0.25, 0.04 + Math.cos(angle) * 0.2, 0.045],
        [0, 0, -angle],
      ));
    }
  } else if (profile.morphology === 'juniorReptiloid') {
    const skull = mesh(new THREE.IcosahedronGeometry(0.205, 1), materials.skin, 'gecko-head');
    skull.scale.set(1.08, 0.92, 1.02);
    headRoot.add(skull);
    headRoot.add(box([0.2, 0.08, 0.15], materials.skin, 'gecko-snout', [0, -0.04, -0.18]));
    for (const side of [-1, 1]) {
      headRoot.add(mesh(new THREE.SphereGeometry(0.066, 10, 7), materials.accent, `gecko-eye-${side}`, [side * 0.14, 0.075, -0.145]));
    }
  } else if (profile.morphology === 'deimur') {
    const skull = mesh(new THREE.IcosahedronGeometry(0.215, 2), materials.skin, 'deimur-head');
    skull.scale.set(0.86, 1.08, 0.92);
    headRoot.add(skull);
    headRoot.add(cone(0.09, 0.42, materials.accent, 'deimur-resonance-crown', [0, 0.36, 0.02]));
    for (const side of [-1, 1]) {
      headRoot.add(mesh(new THREE.SphereGeometry(0.035, 9, 6), materials.accent, `deimur-eye-${side}`, [side * 0.075, 0.035, -0.202]));
    }
  } else if (profile.morphology === 'blue') {
    headRoot.add(mesh(new THREE.IcosahedronGeometry(0.22, 2), materials.skin, 'blue-elemental-head'));
    for (let index = -2; index <= 2; index += 1) {
      headRoot.add(cone(0.04, 0.2 + Math.abs(index) * 0.025, materials.accent, `ice-head-shard-${index + 2}`, [index * 0.065, 0.21 - Math.abs(index) * 0.018, 0.02], [0, 0, index * -0.12]));
    }
  } else if (profile.morphology === 'black') {
    headRoot.add(mesh(new THREE.IcosahedronGeometry(0.22, 2), materials.skin, 'black-elemental-head'));
    const halo = mesh(new THREE.TorusGeometry(0.31, 0.018, 7, 20), materials.accent, 'black-antimatter-halo', [0, 0.07, 0.02], [Math.PI / 2, 0, 0]);
    headRoot.add(halo);
    for (const side of [-1, 1]) {
      headRoot.add(mesh(new THREE.SphereGeometry(0.03, 9, 6), materials.accent, `black-eye-${side}`, [side * 0.074, 0.025, -0.202]));
    }
  } else if (profile.morphology === 'red') {
    headRoot.add(mesh(new THREE.IcosahedronGeometry(0.22, 2), materials.skin, 'red-elemental-head'));
    for (const side of [-1, 1]) {
      headRoot.add(mesh(new THREE.SphereGeometry(0.031, 9, 6), materials.accent, `red-ember-eye-${side}`, [side * 0.074, 0.025, -0.202]));
    }
    headRoot.add(box([0.015, 0.23, 0.012], materials.accent, 'red-face-crack', [0.01, -0.03, -0.213], [0, 0, 0.22]));
  } else if (profile.morphology === 'tsarbor') {
    const skull = mesh(new THREE.IcosahedronGeometry(0.225, 1), materials.bark, 'tsarbor-bark-head');
    skull.scale.set(1.04, 1.08, 0.96);
    headRoot.add(skull);
    for (let index = -2; index <= 2; index += 1) {
      headRoot.add(cone(0.05, 0.28 + (2 - Math.abs(index)) * 0.06, index % 2 ? materials.accent : materials.bark, `tsarbor-crown-${index + 2}`, [index * 0.08, 0.25, 0], [0, 0, index * -0.16]));
    }
  } else {
    headRoot.add(mesh(new THREE.IcosahedronGeometry(0.22, 2), materials.skin, 'player-body-head'));
    const eyeMaterial = makeMat(0x17130f, { roughness: 0.72 });
    for (const side of [-1, 1]) {
      headRoot.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), eyeMaterial, `human-eye-${side}`, [side * 0.075, 0.035, -0.205]));
    }
    headRoot.add(cone(0.026, 0.09, materials.skin, 'human-nose', [0, 0.005, -0.235], [Math.PI / 2, 0, 0]));
    const hair = mesh(
      new THREE.SphereGeometry(0.225, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.52),
      materials.coatDark,
      'human-hair',
      [0, 0.035, 0],
    );
    headRoot.add(hair);
    if (profile.gender === 'female') {
      headRoot.add(capsule(0.035, 0.28, materials.coatDark, 'human-hair-tail', [0.16, -0.08, 0.12], [0.15, 0, -0.2]));
    }
  }
  return headRoot;
}

function createEquipmentAnchor(name, position, rotation = [0, 0, 0]) {
  const anchor = new THREE.Object3D();
  anchor.name = name;
  anchor.position.set(...position);
  anchor.rotation.set(...rotation);
  anchor.userData.equipmentAnchor = true;
  return anchor;
}

function disposeTree(root) {
  root?.traverse?.((node) => {
    node.geometry?.dispose?.();
    if (Array.isArray(node.material)) node.material.forEach((material) => material?.dispose?.());
    else node.material?.dispose?.();
  });
}

export class PlayerBodySystem {
  constructor(engine) {
    this.engine = engine;
    this.profile = resolvePlayerBodyRace(engine.player);
    this.container = null;
    this.bodyRoot = null;
    this.lowerBody = null;
    this.upperBody = null;
    this.shadow = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftArm = null;
    this.rightArm = null;
    this.torso = null;
    this.head = null;
    this.debugThirdPerson = false;
    this.time = 0;
    this.poseMode = 'idle';
    this.anchors = {};
  }

  build() {
    if (this.container) return this.container;
    const profile = this.profile;
    const materials = buildMaterials(profile);
    const container = new THREE.Group();
    container.name = 'player-body-container-v3l3';
    const bodyRoot = new THREE.Group();
    bodyRoot.name = 'player-body-model-v3l3';
    bodyRoot.scale.set(profile.widthScale, profile.heightScale, profile.widthScale);
    bodyRoot.position.z = 0.04;
    const lowerBody = new THREE.Group();
    lowerBody.name = 'player-body-first-person-lower';
    const upperBody = new THREE.Group();
    upperBody.name = 'player-body-debug-upper';

    this.leftLeg = createLeg(-1, profile, materials);
    this.rightLeg = createLeg(1, profile, materials);
    lowerBody.add(this.leftLeg, this.rightLeg);

    const pelvis = box([0.46, 0.28, 0.31], materials.coatDark, 'player-body-pelvis', [0, 0.84, 0.035]);
    upperBody.add(pelvis);

    const torsoWidth = profile.gender === 'female' ? 0.54 : 0.58;
    this.torso = box([torsoWidth, 0.7, 0.35], materials.coat, 'player-body-torso', [0, 1.27, 0.045]);
    upperBody.add(this.torso);
    upperBody.add(box([0.71, 0.16, 0.39], materials.coatDark, 'player-body-shoulder-silhouette', [0, 1.54, 0.045]));
    upperBody.add(box([0.56, 0.36, 0.08], materials.coatDark, 'player-body-coat-tail', [0, 0.87, 0.19], [-0.08, 0, 0]));
    upperBody.add(box([0.63, 0.09, 0.37], materials.leather, 'player-body-belt', [0, 0.96, 0.035]));
    upperBody.add(box([0.1, 0.08, 0.035], materials.brass, 'player-body-belt-buckle', [0, 0.96, -0.165]));

    const leftStrap = box([0.065, 0.78, 0.035], materials.strap, 'player-body-left-gear-strap', [-0.13, 1.29, -0.18], [0, 0, 0.27]);
    const rightStrap = box([0.065, 0.78, 0.035], materials.strap, 'player-body-right-gear-strap', [0.13, 1.29, -0.18], [0, 0, -0.27]);
    upperBody.add(leftStrap, rightStrap);
    upperBody.add(box([0.39, 0.54, 0.18], materials.coatDark, 'player-body-backpack', [0, 1.25, 0.28], [0.03, 0, 0]));
    upperBody.add(box([0.42, 0.08, 0.2], materials.leather, 'player-body-backpack-roll', [0, 1.56, 0.29]));

    this.leftArm = createArm(-1, materials);
    this.rightArm = createArm(1, materials);
    this.head = createHead(profile, materials);
    upperBody.add(this.leftArm, this.rightArm, this.head);

    if (profile.reptilian) {
      const tail = cone(0.13, profile.junior ? 0.62 : 0.78, materials.skin, 'player-body-reptiloid-tail', [0, 0.83, 0.42], [Math.PI * 0.67, 0, 0]);
      upperBody.add(tail);
    }
    if (profile.morphology === 'red') {
      upperBody.add(box([0.018, 0.52, 0.012], materials.accent, 'red-torso-crack-left', [-0.11, 1.28, -0.182], [0, 0, -0.25]));
      upperBody.add(box([0.018, 0.39, 0.012], materials.accent, 'red-torso-crack-right', [0.15, 1.23, -0.182], [0, 0, 0.32]));
    }
    if (profile.morphology === 'blue') {
      for (const side of [-1, 1]) {
        upperBody.add(cone(0.05, 0.28, materials.accent, `blue-shoulder-ice-${side}`, [side * 0.36, 1.58, 0.02], [0, 0, side * -0.42]));
      }
    }
    if (profile.morphology === 'black') {
      for (let index = 0; index < 4; index += 1) {
        const mote = mesh(new THREE.IcosahedronGeometry(0.035, 1), materials.accent, `black-whisper-mote-${index}`, [Math.cos(index * Math.PI / 2) * 0.42, 1.25 + index * 0.1, Math.sin(index * Math.PI / 2) * 0.3]);
        mote.userData.orbitIndex = index;
        upperBody.add(mote);
      }
    }
    if (profile.morphology === 'tsarbor') {
      upperBody.add(box([0.7, 0.76, 0.08], materials.bark, 'tsarbor-back-bark', [0, 1.24, 0.23]));
      for (const side of [-1, 1]) {
        upperBody.add(cone(0.08, 0.36, materials.accent, `tsarbor-shoulder-branch-${side}`, [side * 0.37, 1.61, 0.05], [0, 0, side * -0.35]));
      }
    }

    this.anchors = {
      backWeapon: createEquipmentAnchor('player-anchor-back-weapon', [0, 1.31, 0.36], [0.1, 0, 0.2]),
      beltWeapon: createEquipmentAnchor('player-anchor-belt-weapon', [0.34, 0.96, 0.04], [0, 0, -0.12]),
      utility: createEquipmentAnchor('player-anchor-utility', [-0.34, 1.02, 0.08], [0, 0, 0.08]),
    };
    bodyRoot.add(lowerBody, upperBody, ...Object.values(this.anchors));
    this.shadow = createContactShadow(profile);
    container.add(this.shadow, bodyRoot);
    this.engine.rig.add(container);

    this.container = container;
    this.bodyRoot = bodyRoot;
    this.lowerBody = lowerBody;
    this.upperBody = upperBody;
    this.bodyRoot.traverse((node) => {
      node.userData.bodyBasePosition = node.position.clone();
      node.userData.bodyBaseRotation = node.rotation.clone();
    });
    this.setThirdPerson(false);
    this.engine.playerBodyModel = bodyRoot;
    this.engine.playerEquipmentAnchors = this.anchors;
    return container;
  }

  setRace(raceOrProfile) {
    const nextProfile = resolvePlayerBodyRace(raceOrProfile);
    const currentSignature = this.profile.signature || this.profile.id;
    const nextSignature = nextProfile.signature || nextProfile.id;
    if (nextSignature === currentSignature && this.container) return this.profile;
    const wasThirdPerson = this.debugThirdPerson;
    if (this.container) {
      this.container.removeFromParent();
      disposeTree(this.container);
    }
    this.container = null;
    this.bodyRoot = null;
    this.profile = nextProfile;
    this.build();
    this.setThirdPerson(wasThirdPerson);
    return this.profile;
  }

  setThirdPerson(enabled) {
    this.debugThirdPerson = Boolean(enabled);
    if (this.upperBody) this.upperBody.visible = this.debugThirdPerson;
  }

  setPoseMode(mode = 'idle') {
    this.poseMode = ['idle', 'walk', 'attack', 'racial'].includes(mode) ? mode : 'idle';
  }

  getAnchor(name) {
    return this.anchors[name] || null;
  }

  update(dt) {
    if (!this.bodyRoot) return;
    this.time += dt;
    const motion = this.engine.player?.motion || {};
    const previewWalk = this.poseMode === 'walk' ? 4.8 : 0;
    const rawSpeed = Math.max(previewWalk, Math.hypot(motion.vx || 0, motion.vz || 0));
    const effectiveSpeed = rawSpeed * this.profile.animationSpeedMultiplier;
    const move = Math.min(1, effectiveSpeed / 6.2);
    const sprint = effectiveSpeed > 7.2 ? 1 : 0;
    const phase = (motion.bob || this.time * 2.5) * this.profile.gaitMultiplier;
    const stride = Math.sin(phase) * (0.48 + sprint * 0.2) * move;
    const actionPulse = this.poseMode === 'attack' || this.poseMode === 'racial'
      ? Math.sin(this.time * (this.poseMode === 'racial' ? 3.8 : 5.4)) * 0.5 + 0.5
      : 0;

    this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, stride, 13, dt);
    this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, -stride, 13, dt);
    this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, -stride * 0.42 - actionPulse * 0.75, 11, dt);
    this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, stride * 0.42 - actionPulse * 1.05, 11, dt);
    const leftArmBaseZ = this.leftArm.userData.bodyBaseRotation?.z || 0;
    const rightArmBaseZ = this.rightArm.userData.bodyBaseRotation?.z || 0;
    this.leftArm.rotation.z = THREE.MathUtils.damp(this.leftArm.rotation.z, leftArmBaseZ + actionPulse * -0.28, 10, dt);
    this.rightArm.rotation.z = THREE.MathUtils.damp(this.rightArm.rotation.z, rightArmBaseZ + actionPulse * 0.36, 10, dt);

    const localSide = Math.cos(this.engine.yaw) * (motion.vx || 0) - Math.sin(this.engine.yaw) * (motion.vz || 0);
    const leanSide = THREE.MathUtils.clamp(-localSide / 45, -0.12, 0.12);
    const leanForward = -move * (0.035 + sprint * 0.045);
    this.bodyRoot.rotation.z = THREE.MathUtils.damp(this.bodyRoot.rotation.z, leanSide, 8, dt);
    this.bodyRoot.rotation.x = THREE.MathUtils.damp(this.bodyRoot.rotation.x, leanForward, 8, dt);
    this.bodyRoot.position.y = Math.sin(phase * 2) * 0.017 * move;
    this.torso.rotation.y = THREE.MathUtils.damp(this.torso.rotation.y, Math.sin(phase) * 0.035 * move + actionPulse * 0.12, 9, dt);

    for (const node of this.upperBody.children) {
      if (node.userData.orbitIndex === undefined) continue;
      const index = node.userData.orbitIndex;
      const angle = this.time * 0.7 + index * Math.PI / 2;
      node.position.x = Math.cos(angle) * 0.42;
      node.position.y = 1.3 + Math.sin(angle * 1.7) * 0.16;
      node.position.z = Math.sin(angle) * 0.3;
      node.rotation.y = angle;
    }

    if (this.shadow) {
      const pulse = Math.abs(Math.sin(phase)) * move;
      this.shadow.scale.x = THREE.MathUtils.damp(this.shadow.scale.x, 1 + pulse * 0.08, 8, dt);
      this.shadow.scale.y = THREE.MathUtils.damp(this.shadow.scale.y, 1 - pulse * 0.04, 8, dt);
      this.shadow.material.opacity = THREE.MathUtils.damp(this.shadow.material.opacity, 0.58 - move * 0.08, 7, dt);
    }
  }

  diagnostics() {
    return {
      race: this.profile.id,
      raceLabel: this.profile.label,
      heightScale: this.profile.heightScale,
      eyeHeight: this.profile.eyeHeight,
      animationSpeedMultiplier: this.profile.animationSpeedMultiplier,
      morphology: this.profile.morphology,
      gender: this.profile.gender || 'male',
      heightOffset: this.profile.heightOffset || 0,
      poseMode: this.poseMode,
      debugThirdPerson: this.debugThirdPerson,
      upperBodyVisible: Boolean(this.upperBody?.visible),
      lowerBodyVisible: Boolean(this.lowerBody?.visible),
      shadowVisible: Boolean(this.shadow?.visible),
      anchors: Object.fromEntries(Object.entries(this.anchors).map(([key, value]) => [key, value.name])),
      modelName: this.bodyRoot?.name || null,
    };
  }
}
