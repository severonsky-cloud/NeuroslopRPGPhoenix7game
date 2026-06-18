import * as THREE from '../vendor/three.module.js';
import { makeMat } from '../world/props.js';

export const PLAYER_BODY_RACE_PROFILES = Object.freeze({
  human: {
    id: 'human',
    label: 'Человек',
    heightScale: 1,
    widthScale: 1,
    eyeHeight: 1.72,
    moveSpeedMultiplier: 1,
    gaitMultiplier: 1,
    reptilian: false,
    coat: 0x44382b,
    coatDark: 0x2b261f,
    trousers: 0x292824,
    leather: 0x24170f,
    skin: 0xb9825d,
  },
  reptiloid: {
    id: 'reptiloid',
    label: 'Рептилоид',
    heightScale: 0.98,
    widthScale: 1.04,
    eyeHeight: 1.68,
    moveSpeedMultiplier: 1.08,
    gaitMultiplier: 1.1,
    reptilian: true,
    coat: 0x394235,
    coatDark: 0x202b22,
    trousers: 0x28302a,
    leather: 0x1d2119,
    skin: 0x668153,
  },
  juniorReptiloid: {
    id: 'juniorReptiloid',
    label: 'Младший рептилоид',
    heightScale: 0.88,
    widthScale: 0.92,
    eyeHeight: 1.52,
    moveSpeedMultiplier: 1.16,
    gaitMultiplier: 1.22,
    reptilian: true,
    junior: true,
    coat: 0x43503c,
    coatDark: 0x263127,
    trousers: 0x2b342d,
    leather: 0x202219,
    skin: 0x78945d,
  },
  zhuzher: {
    id: 'zhuzher',
    label: 'Жужер',
    heightScale: 0.94,
    widthScale: 1.08,
    eyeHeight: 1.61,
    moveSpeedMultiplier: 1.05,
    gaitMultiplier: 1.08,
    reptilian: false,
    coat: 0x55562f,
    coatDark: 0x32351f,
    trousers: 0x343326,
    leather: 0x211c14,
    skin: 0x85834e,
  },
  tsarbor: {
    id: 'tsarbor',
    label: 'Царборец',
    heightScale: 1.08,
    widthScale: 1.03,
    eyeHeight: 1.84,
    moveSpeedMultiplier: 0.94,
    gaitMultiplier: 0.92,
    reptilian: false,
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
  reptiloid: 'reptiloid',
  reptilian: 'reptiloid',
  рептилоид: 'reptiloid',
  juniorreptiloid: 'juniorReptiloid',
  junior_reptiloid: 'juniorReptiloid',
  minorreptiloid: 'juniorReptiloid',
  младшийрептилоид: 'juniorReptiloid',
  zhuzher: 'zhuzher',
  жужер: 'zhuzher',
  tsarbor: 'tsarbor',
  царборец: 'tsarbor',
});

function normalizedRaceKey(value) {
  return String(value || 'human').trim().toLowerCase().replace(/[\s-]+/g, '');
}

export function resolvePlayerBodyRace(playerOrRace) {
  const raw = typeof playerOrRace === 'string'
    ? playerOrRace
    : playerOrRace?.race || playerOrRace?.species || playerOrRace?.bodyRace || 'human';
  const profileId = RACE_ALIASES[normalizedRaceKey(raw)] || 'human';
  return PLAYER_BODY_RACE_PROFILES[profileId];
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
  return {
    coat: makeMat(profile.coat, { roughness: 0.94 }),
    coatDark: makeMat(profile.coatDark, { roughness: 0.96 }),
    trousers: makeMat(profile.trousers, { roughness: 0.96 }),
    leather: makeMat(profile.leather, { roughness: 0.84 }),
    skin: makeMat(profile.skin, { roughness: profile.reptilian ? 0.74 : 0.88 }),
    brass: makeMat(0x8e6c32, { roughness: 0.44, metalness: 0.2 }),
    strap: makeMat(0x20170f, { roughness: 0.9 }),
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
  if (profile.reptilian) {
    const skull = mesh(new THREE.IcosahedronGeometry(0.22, 1), materials.skin, 'reptiloid-head');
    skull.scale.set(0.92, 1.05, 1.06);
    headRoot.add(skull);
    headRoot.add(box([0.18, 0.105, 0.18], materials.skin, 'reptiloid-snout', [0, -0.03, -0.2], [-0.08, 0, 0]));
    for (let index = -1; index <= 1; index += 1) {
      headRoot.add(cone(0.035, 0.12, materials.skin, `reptiloid-crest-${index + 2}`, [index * 0.07, 0.2, 0.035], [0.08, 0, index * 0.08]));
    }
  } else {
    headRoot.add(mesh(new THREE.IcosahedronGeometry(0.22, 2), materials.skin, 'player-body-head'));
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

    this.torso = box([0.58, 0.7, 0.35], materials.coat, 'player-body-torso', [0, 1.27, 0.045]);
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
    this.setThirdPerson(false);
    this.engine.playerBodyModel = bodyRoot;
    this.engine.playerEquipmentAnchors = this.anchors;
    return container;
  }

  setRace(raceId) {
    const nextProfile = resolvePlayerBodyRace(raceId);
    if (nextProfile.id === this.profile.id && this.container) return this.profile;
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

  getAnchor(name) {
    return this.anchors[name] || null;
  }

  update(dt) {
    if (!this.bodyRoot) return;
    this.time += dt;
    const motion = this.engine.player?.motion || {};
    const rawSpeed = Math.hypot(motion.vx || 0, motion.vz || 0);
    const effectiveSpeed = rawSpeed * this.profile.moveSpeedMultiplier;
    const move = Math.min(1, effectiveSpeed / 6.2);
    const sprint = effectiveSpeed > 7.2 ? 1 : 0;
    const phase = (motion.bob || this.time * 2.5) * this.profile.gaitMultiplier;
    const stride = Math.sin(phase) * (0.48 + sprint * 0.2) * move;

    this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, stride, 13, dt);
    this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, -stride, 13, dt);
    this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, -stride * 0.42, 11, dt);
    this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, stride * 0.42, 11, dt);

    const localSide = Math.cos(this.engine.yaw) * (motion.vx || 0) - Math.sin(this.engine.yaw) * (motion.vz || 0);
    const leanSide = THREE.MathUtils.clamp(-localSide / 45, -0.12, 0.12);
    const leanForward = -move * (0.035 + sprint * 0.045);
    this.bodyRoot.rotation.z = THREE.MathUtils.damp(this.bodyRoot.rotation.z, leanSide, 8, dt);
    this.bodyRoot.rotation.x = THREE.MathUtils.damp(this.bodyRoot.rotation.x, leanForward, 8, dt);
    this.bodyRoot.position.y = Math.sin(phase * 2) * 0.017 * move;
    this.torso.rotation.y = Math.sin(phase) * 0.035 * move;

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
      moveSpeedMultiplier: this.profile.moveSpeedMultiplier,
      debugThirdPerson: this.debugThirdPerson,
      upperBodyVisible: Boolean(this.upperBody?.visible),
      lowerBodyVisible: Boolean(this.lowerBody?.visible),
      shadowVisible: Boolean(this.shadow?.visible),
      anchors: Object.fromEntries(Object.entries(this.anchors).map(([key, value]) => [key, value.name])),
      modelName: this.bodyRoot?.name || null,
    };
  }
}
