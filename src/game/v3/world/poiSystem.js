import * as THREE from '../vendor/three.module.js';
import { heightAt } from './terrain.js';
import { makeMat } from './props.js';
import { POINTS_OF_INTEREST, POI_DISCOVER_RADIUS } from './poiData.js';

const MATERIALS = {
  stone: makeMat(0x6f6a60, { roughness: 0.96 }),
  stoneDark: makeMat(0x3f3a33, { roughness: 0.98 }),
  wood: makeMat(0x4b2d1b, { roughness: 0.92 }),
  woodDark: makeMat(0x241509, { roughness: 0.96 }),
  rust: makeMat(0x6e3a23, { roughness: 0.9, metalness: 0.08 }),
  bone: makeMat(0xcdb488, { roughness: 0.86 }),
  water: makeMat(0x335c61, { roughness: 0.35, metalness: 0.08, opacity: 0.72, side: THREE.DoubleSide }),
  phase: makeMat(0x7568d8, { roughness: 0.28, metalness: 0.12, emissive: 0x3a25c0, emissiveIntensity: 0.85 }),
  seal: makeMat(0xc9a24a, { roughness: 0.5, metalness: 0.2, emissive: 0x4a2f08, emissiveIntensity: 0.3 }),
  redMark: makeMat(0x9a3322, { roughness: 0.8, emissive: 0x2a0804, emissiveIntensity: 0.25 }),
  sapling: makeMat(0x2d6b3b, { roughness: 0.8, emissive: 0x0b2312, emissiveIntensity: 0.35 }),
};

function mesh(geometry, material, name) {
  const node = new THREE.Mesh(geometry, material);
  node.name = name;
  node.castShadow = true;
  node.receiveShadow = true;
  return node;
}

function buildWreck(group) {
  for (let i = 0; i < 5; i += 1) {
    const post = mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6 + (i % 2) * 0.6, 6), MATERIALS.woodDark, 'pier-post');
    post.position.set(-3 + i * 1.4, 0.6 + (i % 2) * 0.2, Math.sin(i) * 0.6);
    post.rotation.z = (i % 2 ? 1 : -1) * 0.18;
    group.add(post);
  }
  const plank = mesh(new THREE.BoxGeometry(6.2, 0.16, 1.4), MATERIALS.wood, 'pier-plank');
  plank.position.set(-0.2, 1.0, 0);
  plank.rotation.z = -0.06;
  group.add(plank);
  const water = mesh(new THREE.BoxGeometry(9, 0.02, 5), MATERIALS.water, 'pier-water');
  water.position.set(0, 0.05, 1.5);
  group.add(water);
}

function buildStandingStone(group) {
  const slab = mesh(new THREE.BoxGeometry(1.1, 3.6, 0.5), MATERIALS.stone, 'boundary-slab');
  slab.position.y = 1.8;
  slab.rotation.z = 0.07;
  group.add(slab);
  const seal = mesh(new THREE.BoxGeometry(0.55, 0.55, 0.08), MATERIALS.seal, 'imperial-seal');
  seal.position.set(0, 2.5, 0.27);
  group.add(seal);
  const mark = mesh(new THREE.BoxGeometry(0.4, 0.12, 0.08), MATERIALS.redMark, 'community-mark');
  mark.position.set(0, 1.4, 0.27);
  group.add(mark);
  const base = mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 8), MATERIALS.stoneDark, 'stone-base');
  base.position.y = 0.2;
  group.add(base);
}

function buildShrine(group, quality, green) {
  const base = mesh(new THREE.CylinderGeometry(1.0, 1.25, 0.5, 8), MATERIALS.stoneDark, 'shrine-base');
  base.position.y = 0.25;
  group.add(base);
  const pillar = mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.7, 6), MATERIALS.stone, 'shrine-pillar');
  pillar.position.y = 1.1;
  group.add(pillar);
  if (green) {
    const sapling = mesh(new THREE.ConeGeometry(0.5, 1.4, 6), MATERIALS.sapling, 'shrine-sapling');
    sapling.position.y = 2.4;
    group.add(sapling);
  } else {
    const crystal = mesh(new THREE.IcosahedronGeometry(0.4, 0), MATERIALS.phase, 'shrine-crystal');
    crystal.position.y = 2.35;
    group.add(crystal);
  }
  const ring = mesh(new THREE.TorusGeometry(0.95, 0.06, 8, 20), green ? MATERIALS.seal : MATERIALS.phase, 'shrine-ring');
  ring.position.y = 0.55;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  if (quality?.realtimeAccentLights) {
    const light = new THREE.PointLight(green ? 0x6fae5a : 0x6f5cff, 0.5, 13);
    light.position.set(0, 2.2, 0);
    group.add(light);
  }
}

function buildGraves(group) {
  for (let i = 0; i < 4; i += 1) {
    const mound = mesh(new THREE.SphereGeometry(0.7, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), MATERIALS.stoneDark, 'grave-mound');
    mound.scale.set(1, 0.45, 1.3);
    mound.position.set(-2.4 + i * 1.6, 0.02, (i % 2) * 1.2 - 0.6);
    group.add(mound);
    const marker = mesh(new THREE.BoxGeometry(0.16, 0.7, 0.5), MATERIALS.wood, 'grave-marker');
    marker.position.set(-2.4 + i * 1.6, 0.35, (i % 2) * 1.2 - 1.1);
    marker.rotation.z = (i % 2 ? 1 : -1) * 0.12;
    group.add(marker);
  }
}

function buildBones(group) {
  const spine = mesh(new THREE.CylinderGeometry(0.22, 0.32, 3.4, 7), MATERIALS.bone, 'mutant-spine');
  spine.position.set(0, 0.4, 0);
  spine.rotation.z = Math.PI / 2 - 0.1;
  group.add(spine);
  for (let i = 0; i < 5; i += 1) {
    const rib = mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 10, Math.PI), MATERIALS.bone, 'mutant-rib');
    rib.position.set(-1.4 + i * 0.7, 0.45, 0);
    rib.rotation.y = Math.PI / 2;
    group.add(rib);
  }
  const skull = mesh(new THREE.DodecahedronGeometry(0.55, 0), MATERIALS.bone, 'mutant-skull');
  skull.position.set(1.9, 0.6, 0);
  group.add(skull);
  for (const side of [-1, 1]) {
    const horn = mesh(new THREE.ConeGeometry(0.1, 0.7, 6), MATERIALS.bone, 'mutant-horn');
    horn.position.set(2.0, 1.0, side * 0.25);
    horn.rotation.z = -0.5;
    group.add(horn);
  }
}

function buildRuin(group) {
  const mast = mesh(new THREE.CylinderGeometry(0.28, 0.36, 7.5, 7), MATERIALS.rust, 'fallen-mast');
  mast.position.set(0, 0.55, 0);
  mast.rotation.z = Math.PI / 2 - 0.18;
  group.add(mast);
  const brace = mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.2, 6), MATERIALS.stoneDark, 'fallen-brace');
  brace.position.set(1.2, 0.7, 0.6);
  brace.rotation.set(0.4, 0, 0.9);
  group.add(brace);
  for (let i = 0; i < 4; i += 1) {
    const rubble = mesh(new THREE.DodecahedronGeometry(0.4 + (i % 2) * 0.2, 0), MATERIALS.stone, 'fallen-rubble');
    rubble.position.set(-3 + i * 1.7, 0.25, Math.cos(i) * 1.2);
    rubble.rotation.set(i, i * 0.7, i * 1.3);
    group.add(rubble);
  }
}

function createPoiVisual(data, quality) {
  const group = new THREE.Group();
  group.name = `poi-${data.id}`;
  group.position.set(data.x, heightAt(data.x, data.z), data.z);
  group.rotation.y = (data.x * 0.7 + data.z * 1.3) % Math.PI;
  if (data.type === 'wreck') buildWreck(group);
  else if (data.type === 'standingStone') buildStandingStone(group);
  else if (data.type === 'shrine') buildShrine(group, quality, data.id === 'tsarbor-altar');
  else if (data.type === 'graves') buildGraves(group);
  else if (data.type === 'bones') buildBones(group);
  else if (data.type === 'ruin') buildRuin(group);
  return group;
}

export class PoiWorldSystem {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.scene;
    this.quality = engine.quality;
    this.entries = [];
    this.discoveredList = [];
    this.built = false;
  }

  build() {
    if (this.built) return;
    this.built = true;
    for (const data of POINTS_OF_INTEREST) {
      const group = createPoiVisual(data, this.quality);
      this.scene.add(group);
      this.entries.push({ data, group, discovered: false });
    }
  }

  update(dt, playerRig) {
    const cull = this.quality.settlementLandmarkDistance || 175;
    const px = playerRig.position.x;
    const pz = playerRig.position.z;
    for (const entry of this.entries) {
      const distance = Math.hypot(px - entry.data.x, pz - entry.data.z);
      entry.group.visible = distance < cull;
      if (!entry.discovered && distance < POI_DISCOVER_RADIUS) this.discover(entry);
    }
  }

  discover(entry) {
    entry.discovered = true;
    this.discoveredList.push(entry.data);
    // Small exploration reward so finding a site feels worthwhile.
    const reward = 10;
    if (this.engine.player) this.engine.player.credits = (this.engine.player.credits || 0) + reward;
    this.engine.hud?.setObjective?.(`Открыто: ${entry.data.name}  ·  +${reward} кр`);
    this.engine.log?.unshift?.(`Находка: ${entry.data.name} (+${reward} кр). ${entry.data.lore}`);
    const events = this.engine.livingWorld?.eventLog;
    if (events) {
      events.unshift(`Открыта точка интереса: ${entry.data.name}.`);
      if (events.length > 12) events.pop();
    }
  }

  // Discovered points only — undiscovered stay hidden on the map (fog-of-war-lite).
  mapMarkers() {
    return this.discoveredList.map((d) => ({ id: d.id, name: d.name, x: d.x, z: d.z, type: d.type }));
  }

  discoveries() {
    return this.discoveredList.map((d) => ({ name: d.name, type: d.type, x: d.x, z: d.z, lore: d.lore }));
  }

  diagnostics() {
    return {
      total: this.entries.length,
      discovered: this.discoveredList.length,
      discoveredIds: this.discoveredList.map((d) => d.id),
      visible: this.entries.filter((e) => e.group.visible).length,
    };
  }
}
