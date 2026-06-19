import * as THREE from '../vendor/three.module.js';
import {
  PORT_FORT_SETTLEMENT_ROAD,
  SETTLEMENTS,
  SETTLEMENT_AGENTS,
  SETTLEMENT_CARAVANS,
  SETTLEMENT_ROADSIDE_SCENES,
  ZHUZHER_ROAD_PATROL,
  normalizePlayerCulture,
  settlementRoadLength,
} from '../data/settlementsData.js';
import { createMonster } from '../entities/monster.js';
import { heightAt } from './terrain.js';
import { labelSprite, makeMat } from './props.js';

const MATERIALS = {
  clay: makeMat(0x7d3f27, { roughness: 0.96 }),
  clayDark: makeMat(0x4a281d, { roughness: 0.98 }),
  wood: makeMat(0x4b2d1b, { roughness: 0.92 }),
  woodDark: makeMat(0x25160f, { roughness: 0.96 }),
  canvas: makeMat(0x8b6a43, { roughness: 0.98, side: THREE.DoubleSide }),
  imperialCanvas: makeMat(0x68634c, { roughness: 0.94, side: THREE.DoubleSide }),
  metal: makeMat(0x333432, { roughness: 0.62, metalness: 0.2 }),
  rust: makeMat(0x713922, { roughness: 0.9, metalness: 0.08 }),
  water: makeMat(0x335c61, { roughness: 0.35, metalness: 0.08, opacity: 0.72, side: THREE.DoubleSide }),
  phase: makeMat(0x7568d8, { roughness: 0.28, metalness: 0.12, emissive: 0x3020a0, emissiveIntensity: 0.7 }),
  redCrop: makeMat(0x8f2f24, { roughness: 0.88, emissive: 0x2a0804, emissiveIntensity: 0.12 }),
  saltCrop: makeMat(0xb7a06c, { roughness: 0.86 }),
  black: makeMat(0x151214, { roughness: 0.82 }),
  net: makeMat(0x23302c, { roughness: 0.95, opacity: 0.55, side: THREE.DoubleSide }),
  cable: makeMat(0x161310, { roughness: 0.9, metalness: 0.1 }),
};

function mesh(geometry, material, name) {
  const node = new THREE.Mesh(geometry, material);
  node.name = name;
  node.castShadow = true;
  node.receiveShadow = true;
  return node;
}

function addLocal(group, node, settlement, lx, lz, yOffset = 0, rotationY = 0) {
  const worldX = settlement.x + lx;
  const worldZ = settlement.z + lz;
  node.position.set(lx, heightAt(worldX, worldZ) - heightAt(settlement.x, settlement.z) + yOffset, lz);
  node.rotation.y = rotationY;
  group.add(node);
  return node;
}

function box(group, settlement, name, size, position, material, rotationY = 0) {
  const node = mesh(new THREE.BoxGeometry(...size), material, name);
  return addLocal(group, node, settlement, position[0], position[2], position[1], rotationY);
}

function cylinder(group, settlement, name, radius, height, position, material, rotation = [0, 0, 0]) {
  const node = mesh(new THREE.CylinderGeometry(radius, radius, height, 8), material, name);
  addLocal(group, node, settlement, position[0], position[2], position[1]);
  node.rotation.set(...rotation);
  return node;
}

function cone(group, settlement, name, radius, height, position, material, rotationY = 0) {
  const node = mesh(new THREE.ConeGeometry(radius, height, 5), material, name);
  return addLocal(group, node, settlement, position[0], position[2], position[1], rotationY);
}

function tent(group, settlement, lx, lz, scale = 1, military = false) {
  const root = new THREE.Group();
  root.name = military ? 'settlement-military-tent' : 'settlement-road-tent';
  const cloth = military ? MATERIALS.imperialCanvas : MATERIALS.canvas;
  const left = mesh(new THREE.PlaneGeometry(4.2 * scale, 2.5 * scale), cloth, 'tent-left-cloth');
  left.rotation.set(0, 0, Math.PI * 0.22);
  left.position.set(-0.82 * scale, 1.0 * scale, 0);
  const right = left.clone();
  right.name = 'tent-right-cloth';
  right.rotation.z = -Math.PI * 0.22;
  right.position.x = 0.82 * scale;
  const ridge = mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.3 * scale, 6), MATERIALS.woodDark, 'tent-ridge');
  ridge.rotation.x = Math.PI / 2;
  ridge.position.set(0, 1.9 * scale, 0);
  root.add(left, right, ridge);
  addLocal(group, root, settlement, lx, lz, 0);
  return root;
}

function stiltHouse(group, settlement, lx, lz, scale = 1) {
  const root = new THREE.Group();
  root.name = 'ben-hao-stilt-house';
  for (const x of [-1.5, 1.5]) {
    for (const z of [-1.1, 1.1]) {
      const post = mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.2 * scale, 6), MATERIALS.woodDark, 'stilt-post');
      post.position.set(x * scale, 1.1 * scale, z * scale);
      root.add(post);
    }
  }
  const floor = mesh(new THREE.BoxGeometry(3.8 * scale, 0.18, 2.8 * scale), MATERIALS.wood, 'stilt-floor');
  floor.position.y = 2.0 * scale;
  const walls = mesh(new THREE.BoxGeometry(3.2 * scale, 1.5 * scale, 2.2 * scale), MATERIALS.clayDark, 'stilt-house-walls');
  walls.position.y = 2.78 * scale;
  const roof = mesh(new THREE.ConeGeometry(2.6 * scale, 1.15 * scale, 4), MATERIALS.canvas, 'stilt-house-roof');
  roof.position.y = 3.85 * scale;
  roof.rotation.y = Math.PI / 4;
  root.add(floor, walls, roof);
  addLocal(group, root, settlement, lx, lz, 0, 0.15);
  return root;
}

function watchTower(group, settlement, lx, lz) {
  const root = new THREE.Group();
  root.name = 'richelieu-watch-tower';
  for (const x of [-0.9, 0.9]) {
    for (const z of [-0.9, 0.9]) {
      const post = mesh(new THREE.CylinderGeometry(0.11, 0.15, 6.2, 6), MATERIALS.woodDark, 'tower-post');
      post.position.set(x, 3.1, z);
      root.add(post);
    }
  }
  const deck = mesh(new THREE.BoxGeometry(2.4, 0.24, 2.4), MATERIALS.wood, 'tower-deck');
  deck.position.y = 5.25;
  const cabin = mesh(new THREE.BoxGeometry(1.8, 1.3, 1.8), MATERIALS.imperialCanvas, 'tower-cabin');
  cabin.position.y = 5.95;
  const roof = mesh(new THREE.ConeGeometry(1.7, 0.85, 4), MATERIALS.metal, 'tower-roof');
  roof.position.y = 7.0;
  roof.rotation.y = Math.PI / 4;
  root.add(deck, cabin, roof);
  addLocal(group, root, settlement, lx, lz, 0);
  return root;
}

function scaffold(group, settlement, lx, lz, width = 5.4) {
  const root = new THREE.Group();
  root.name = 'lang-do-scaffold';
  for (const x of [-width / 2, 0, width / 2]) {
    const post = mesh(new THREE.CylinderGeometry(0.055, 0.07, 4.2, 6), MATERIALS.woodDark, 'scaffold-post');
    post.position.set(x, 2.1, 0);
    root.add(post);
  }
  for (const y of [1.1, 2.3, 3.5]) {
    const rail = mesh(new THREE.BoxGeometry(width + 0.5, 0.09, 0.12), MATERIALS.wood, 'scaffold-rail');
    rail.position.y = y;
    root.add(rail);
  }
  addLocal(group, root, settlement, lx, lz, 0, -0.2);
  return root;
}

function campfire(group, settlement, lx, lz, lit = true) {
  const root = new THREE.Group();
  root.name = lit ? 'settlement-campfire' : 'settlement-cold-fire';
  for (let index = 0; index < 6; index += 1) {
    const stone = mesh(new THREE.DodecahedronGeometry(0.15, 0), MATERIALS.clayDark, 'fire-stone');
    stone.position.set(Math.cos(index * Math.PI / 3) * 0.46, 0.13, Math.sin(index * Math.PI / 3) * 0.46);
    root.add(stone);
  }
  if (lit) {
    const flame = mesh(new THREE.ConeGeometry(0.24, 0.72, 6), makeMat(0xff8b35, { emissive: 0xff501d, emissiveIntensity: 1.4 }), 'fire-flame');
    flame.position.y = 0.43;
    root.add(flame);
  }
  addLocal(group, root, settlement, lx, lz, 0);
  return root;
}

function addInstance(pool, kind, x, z, scale = [1, 1, 1], rotationY = 0) {
  pool[kind].push({ x, z, scale, rotationY });
}

function settlementPalette(settlement) {
  if (settlement.faction === 'empire') return MATERIALS.imperialCanvas;
  if (settlement.faction === 'phaseGuild') return MATERIALS.phase;
  return MATERIALS.canvas;
}

function createSettlementVisual(settlement, pools, quality) {
  const root = new THREE.Group();
  root.name = `settlement-${settlement.id}`;
  root.position.set(settlement.x, heightAt(settlement.x, settlement.z), settlement.z);
  root.userData.settlementId = settlement.id;
  const landmark = new THREE.Group();
  landmark.name = `${settlement.id}-landmark`;
  const detail = new THREE.Group();
  detail.name = `${settlement.id}-details`;
  root.add(landmark, detail);

  if (settlement.id === 'ben-hao') {
    stiltHouse(landmark, settlement, -5, 1, 0.9);
    stiltHouse(landmark, settlement, 4, 3, 0.82);
    box(detail, settlement, 'ben-hao-boat', [3.4, 0.35, 1.0], [1, 0.24, -4.5], MATERIALS.wood, -0.28);
    box(detail, settlement, 'ben-hao-net-rack', [4.8, 0.08, 0.12], [-1, 2.0, 6], MATERIALS.wood);
    for (const nx of [-2.4, 0.6]) {
      const net = mesh(new THREE.PlaneGeometry(2.0, 1.7), MATERIALS.net, 'ben-hao-drying-net');
      addLocal(detail, net, settlement, nx, 6, 1.1);
    }
    box(detail, settlement, 'ben-hao-water-patch', [10, 0.025, 5], [-1, 0.02, -7], MATERIALS.water);
    for (let i = 0; i < 6; i += 1) addInstance(pools, 'barrels', settlement.x - 4 + i * 1.5, settlement.z + 6, [0.75, 0.75, 0.75]);
  } else if (settlement.id === 'richelieu-post') {
    watchTower(landmark, settlement, 5, -1);
    box(landmark, settlement, 'richelieu-office', [6.6, 3.1, 4.4], [-4, 1.55, 2], MATERIALS.imperialCanvas);
    box(detail, settlement, 'richelieu-barrier', [11, 0.16, 0.18], [0, 1.25, -4], MATERIALS.wood, 0.05);
    box(detail, settlement, 'richelieu-counterweight', [0.45, 2.4, 0.45], [-5.2, 1.2, -4], MATERIALS.metal);
    for (let i = 0; i < 8; i += 1) addInstance(pools, 'crates', settlement.x - 6 + (i % 4) * 1.4, settlement.z + 6 + Math.floor(i / 4) * 1.2, [0.8, 0.8, 0.8], i * 0.2);
  } else if (settlement.id === 'lang-do') {
    scaffold(landmark, settlement, -3, 0);
    tent(landmark, settlement, 5, 2, 0.9);
    for (const [sx, sy] of [[-4.6, 1.18], [-3.0, 1.18], [-1.4, 1.18], [-3.0, 2.38]]) {
      box(detail, settlement, 'lang-do-drying-slab', [0.9, 0.5, 0.06], [sx, sy, 0.12], MATERIALS.clay, -0.2);
    }
    for (let i = 0; i < 16; i += 1) addInstance(pools, 'clayBlocks', settlement.x - 8 + (i % 8) * 2.0, settlement.z + 6 + Math.floor(i / 8) * 1.4, [0.9, 0.55, 0.65]);
    for (let i = 0; i < 5; i += 1) addInstance(pools, 'barrels', settlement.x + 6, settlement.z - 4 + i * 1.3, [0.72, 0.72, 0.72]);
  } else if (settlement.id === 'tau-verona') {
    box(landmark, settlement, 'tau-verona-warehouse', [8.5, 3.5, 5.2], [-5, 1.75, 2], MATERIALS.clayDark);
    const roof = cone(landmark, settlement, 'tau-verona-roof', 5.8, 1.6, [-5, 4.3, 2], settlementPalette(settlement), Math.PI / 4);
    roof.scale.z = 0.72;
    box(detail, settlement, 'tau-awning-blue', [5.5, 0.12, 3.4], [4, 2.6, -1], makeMat(0x4d668c, { side: THREE.DoubleSide }), 0.18);
    box(detail, settlement, 'tau-awning-black', [4.8, 0.12, 3.0], [3, 2.35, 5], MATERIALS.black, -0.22);
    // Trade tables under the awnings make the caravanserai read as a market.
    box(detail, settlement, 'tau-trade-table', [1.9, 0.12, 0.95], [4, 0.92, -1], MATERIALS.wood);
    box(detail, settlement, 'tau-trade-trestle', [1.6, 0.78, 0.12], [4, 0.45, -1], MATERIALS.woodDark);
    box(detail, settlement, 'tau-trade-table', [1.7, 0.12, 0.9], [3, 0.86, 5], MATERIALS.wood);
    box(detail, settlement, 'tau-trade-trestle', [1.5, 0.72, 0.12], [3, 0.42, 5], MATERIALS.woodDark);
    // One parked caravan cart, off to the side away from the official road.
    box(detail, settlement, 'tau-verona-cart-bed', [3.0, 0.4, 1.5], [8, 0.62, -5], MATERIALS.wood);
    cylinder(detail, settlement, 'tau-verona-cart-wheel', 0.42, 0.14, [6.9, 0.42, -4.3], MATERIALS.woodDark, [0, 0, Math.PI / 2]);
    cylinder(detail, settlement, 'tau-verona-cart-wheel', 0.42, 0.14, [9.1, 0.42, -4.3], MATERIALS.woodDark, [0, 0, Math.PI / 2]);
    campfire(detail, settlement, 0, 7, true);
    for (let i = 0; i < 12; i += 1) addInstance(pools, 'crates', settlement.x - 8 + (i % 6) * 2.2, settlement.z - 6 + Math.floor(i / 6) * 1.4, [0.85, 0.85, 0.85], i * 0.17);
  } else if (settlement.id === 'nam-hoa') {
    stiltHouse(landmark, settlement, -5, -1, 0.82);
    stiltHouse(landmark, settlement, 5, 1, 0.76);
    for (let i = 0; i < 48; i += 1) {
      const row = Math.floor(i / 12);
      const col = i % 12;
      addInstance(pools, i % 3 === 0 ? 'saltCrops' : 'redCrops', settlement.x - 11 + col * 1.8, settlement.z + 6 + row * 1.8, [0.75, 0.8 + (i % 4) * 0.08, 0.75], i * 0.19);
    }
    for (let i = 0; i < 12; i += 1) addInstance(pools, 'fencePosts', settlement.x - 12 + i * 2.2, settlement.z + 13, [0.8, 0.8, 0.8]);
  } else if (settlement.id === 'tesla-6') {
    cylinder(landmark, settlement, 'tesla-broken-mast', 0.25, 13, [0, 6.5, 0], MATERIALS.rust, [0.05, 0, -0.16]);
    for (let i = 0; i < 4; i += 1) {
      const brace = cylinder(landmark, settlement, `tesla-brace-${i}`, 0.075, 8.5, [Math.cos(i * Math.PI / 2) * 2, 3.7, Math.sin(i * Math.PI / 2) * 2], MATERIALS.metal, [0, 0, i % 2 ? 0.42 : -0.42]);
      brace.lookAt(0, 8.5, 0);
    }
    tent(detail, settlement, -5, 3, 0.78);
    campfire(detail, settlement, -1, 5, false);
    // Snapped cables sagging from near the broken mast top down to the ground.
    const mastTop = new THREE.Vector3(0.9, 11.8, -0.6);
    for (let i = 0; i < 3; i += 1) {
      const ang = i * 2.1 + 0.5;
      const ax = Math.cos(ang) * 6.5;
      const az = Math.sin(ang) * 6.5;
      const ay = heightAt(settlement.x + ax, settlement.z + az) - heightAt(settlement.x, settlement.z) + 0.1;
      const ground = new THREE.Vector3(ax, ay, az);
      const dir = new THREE.Vector3().subVectors(ground, mastTop);
      const len = dir.length();
      const cable = mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 5), MATERIALS.cable, `tesla-cable-${i}`);
      cable.position.copy(mastTop).add(ground).multiplyScalar(0.5);
      cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      cable.castShadow = false;
      detail.add(cable);
    }
    for (let i = 0; i < 10; i += 1) addInstance(pools, 'rustPanels', settlement.x - 8 + (i % 5) * 3.0, settlement.z - 6 + Math.floor(i / 5) * 2.0, [1.3, 0.5, 0.7], i * 0.31);
  } else if (settlement.id === 'chi-cassini') {
    tent(landmark, settlement, -4, 2, 0.86);
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2;
      cylinder(landmark, settlement, `chi-measuring-pole-${i}`, 0.055, 5 + (i % 3), [Math.cos(angle) * 6, 2.5 + (i % 3) * 0.5, Math.sin(angle) * 6], MATERIALS.phase);
      addInstance(pools, 'flags', settlement.x + Math.cos(angle) * 6, settlement.z + Math.sin(angle) * 6, [0.8, 0.8, 0.8], angle);
    }
    const ring = mesh(new THREE.TorusGeometry(2.2, 0.08, 8, 24), MATERIALS.phase, 'chi-phase-observation-ring');
    addLocal(landmark, ring, settlement, 3, -2, 2.5);
    ring.rotation.x = Math.PI / 2;
    if (quality.realtimeAccentLights) {
      const light = new THREE.PointLight(0x6f5cff, 0.45, 16);
      light.position.set(3, 3.0, -2);
      landmark.add(light);
    }
  } else if (settlement.id === 'arcole-bivouac') {
    tent(landmark, settlement, -4, 1, 0.95, true);
    tent(landmark, settlement, 4, 3, 0.8, true);
    box(detail, settlement, 'arcole-firing-position', [9, 0.8, 1.2], [0, 0.4, -5], MATERIALS.clayDark, 0.2);
    for (let i = 0; i < 14; i += 1) addInstance(pools, 'crates', settlement.x - 9 + (i % 7) * 2.3, settlement.z + 7 + Math.floor(i / 7) * 1.5, [0.82, 0.82, 0.82], i * 0.11);
    for (let i = 0; i < 4; i += 1) addInstance(pools, 'barrels', settlement.x + 6 + (i % 2) * 1.2, settlement.z + 2 + Math.floor(i / 2) * 1.3, [0.78, 0.78, 0.78]);
    for (let i = 0; i < 7; i += 1) addInstance(pools, 'flags', settlement.x - 7 + i * 2.3, settlement.z - 7, [0.95, 0.95, 0.95], 0.2);
  }

  return { root, landmark, detail, settlement };
}

function createInstancedPool(scene, entries, geometry, material, name, density = 1) {
  const keep = entries.filter((_, index) => index === 0 || ((index * 37) % 100) / 100 < density);
  const instanced = new THREE.InstancedMesh(geometry, material, keep.length);
  instanced.name = name;
  instanced.castShadow = false;
  instanced.receiveShadow = true;
  // These primitives are centred on their own origin, so the correct ground
  // offset is half of the *actual* geometry height scaled by the y-scale.
  // A fixed 0.5 assumed unit-tall geometry and left taller props (fence posts,
  // crops) sunk into the terrain and flatter props (rust panels) floating.
  const baseHalfHeight = (geometry.parameters?.height ?? 1) * 0.5;
  const dummy = new THREE.Object3D();
  keep.forEach((entry, index) => {
    const scaleY = entry.scale?.[1] ?? 1;
    dummy.position.set(entry.x, heightAt(entry.x, entry.z) + baseHalfHeight * scaleY, entry.z);
    dummy.scale.set(...(entry.scale || [1, 1, 1]));
    dummy.rotation.set(0, entry.rotationY || 0, 0);
    dummy.updateMatrix();
    instanced.setMatrixAt(index, dummy.matrix);
  });
  scene.add(instanced);
  return instanced;
}

function createRoadsideVisual(scene, data) {
  const settlement = { x: data.x, z: data.z };
  const group = new THREE.Group();
  group.name = `settlement-roadside-${data.id}`;
  group.position.set(data.x, heightAt(data.x, data.z), data.z);
  group.rotation.y = data.heading || 0;
  if (data.type === 'brokenCart') {
    box(group, settlement, 'broken-cart-bed', [3.4, 0.42, 1.7], [0, 0.45, 0], MATERIALS.wood);
    for (const x of [-1.3, 1.3]) cylinder(group, settlement, 'broken-cart-wheel', 0.48, 0.14, [x, 0.48, 0.92], MATERIALS.woodDark, [0, 0, Math.PI / 2]);
    box(group, settlement, 'confiscated-clay', [1.1, 0.7, 0.9], [-0.5, 0.9, 0], MATERIALS.clay);
  } else if (data.type === 'coldCamp') {
    campfire(group, settlement, 0, 0, false);
    tent(group, settlement, 3, 1, 0.55);
  } else if (data.type === 'cables') {
    for (let i = 0; i < 6; i += 1) cylinder(group, settlement, 'old-cable', 0.055, 4.2, [i * 0.55 - 1.5, 0.16, Math.sin(i) * 0.6], MATERIALS.black, [Math.PI / 2, 0, i * 0.2]);
  } else if (data.type === 'rustScrap') {
    for (let i = 0; i < 7; i += 1) box(group, settlement, 'rusty-spaceport-panel', [1.5 + (i % 3), 0.22, 0.7], [i * 0.8 - 2.5, 0.2 + (i % 2) * 0.2, Math.sin(i) * 1.2], MATERIALS.rust, i * 0.4);
  } else if (data.type === 'flags') {
    for (let i = 0; i < 6; i += 1) {
      cylinder(group, settlement, 'road-marker-pole', 0.035, 2.8, [i * 1.8 - 4.5, 1.4, 0], MATERIALS.woodDark);
      box(group, settlement, 'road-marker-cloth', [0.8, 0.55, 0.035], [i * 1.8 - 4.15, 2.2, 0], MATERIALS.canvas);
    }
  }
  scene.add(group);
  return group;
}

export class SettlementWorldSystem {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.scene;
    this.quality = engine.quality;
    this.settlementVisuals = [];
    this.roadsideGroups = [];
    this.instanceMeshes = [];
    this.instanceCounts = {};
    this.settlementAgents = [];
    this.patrol = [];
    this.labels = [];
    this.warningShown = false;
    this.built = false;
  }

  build() {
    if (this.built) return;
    this.built = true;
    const pools = {
      crates: [],
      barrels: [],
      fencePosts: [],
      flags: [],
      redCrops: [],
      saltCrops: [],
      clayBlocks: [],
      rustPanels: [],
    };

    for (const settlement of SETTLEMENTS) {
      const visual = createSettlementVisual(settlement, pools, this.quality);
      this.scene.add(visual.root);
      this.settlementVisuals.push(visual);
      const label = labelSprite(this.scene, settlement.mapLabel, settlement.x, settlement.z, 7.5, 0.55);
      label.userData.settlementId = settlement.id;
      this.engine.labels.push(label);
      this.labels.push(label);
    }

    const density = this.quality.settlementRoadsideDensity ?? 0.8;
    const definitions = {
      crates: [new THREE.BoxGeometry(1, 1, 1), MATERIALS.wood, 'settlement-instanced-crates'],
      barrels: [new THREE.CylinderGeometry(0.42, 0.42, 1, 10), MATERIALS.woodDark, 'settlement-instanced-barrels'],
      fencePosts: [new THREE.CylinderGeometry(0.07, 0.09, 1.8, 6), MATERIALS.woodDark, 'settlement-instanced-fence-posts'],
      flags: [new THREE.BoxGeometry(0.8, 0.55, 0.04), MATERIALS.canvas, 'settlement-instanced-flags'],
      redCrops: [new THREE.ConeGeometry(0.14, 1.2, 5), MATERIALS.redCrop, 'settlement-instanced-red-crops'],
      saltCrops: [new THREE.ConeGeometry(0.16, 0.85, 6), MATERIALS.saltCrop, 'settlement-instanced-salt-crops'],
      clayBlocks: [new THREE.BoxGeometry(1.5, 0.7, 0.8), MATERIALS.clay, 'settlement-instanced-clay-blocks'],
      rustPanels: [new THREE.BoxGeometry(1.6, 0.22, 0.8), MATERIALS.rust, 'settlement-instanced-rust-panels'],
    };
    for (const [kind, entries] of Object.entries(pools)) {
      const [geometry, material, name] = definitions[kind];
      const instance = createInstancedPool(this.scene, entries, geometry, material, name, density);
      this.instanceMeshes.push(instance);
      this.instanceCounts[kind] = instance.count;
    }

    const roadsideLimit = Math.max(2, Math.ceil(SETTLEMENT_ROADSIDE_SCENES.length * density));
    this.roadsideGroups = SETTLEMENT_ROADSIDE_SCENES.slice(0, roadsideLimit).map((data) => createRoadsideVisual(this.scene, data));

    const residentDistance = this.quality.settlementResidentDistance || 68;
    this.settlementAgents = this.engine.livingWorld.addAgents(
      SETTLEMENT_AGENTS.map((agent) => ({ ...agent, residentDistance })),
    );
    this.configureCaravans();
    this.buildZhuzherPatrol();
  }

  configureCaravans() {
    const salt = this.engine.livingWorld.agents.find((obj) => obj.userData.id === 'salt_caravan');
    if (salt) {
      salt.userData.route = SETTLEMENT_CARAVANS[0].route.map((point) => ({ ...point }));
      salt.userData.routeIndex = 1;
    }
    const rural = SETTLEMENT_CARAVANS[1];
    this.settlementAgents.push(this.engine.livingWorld.addAgent({ ...rural }));
  }

  buildZhuzherPatrol() {
    for (const data of ZHUZHER_ROAD_PATROL) {
      const obj = createMonster(this.scene, data);
      obj.userData.autoHostile = false;
      obj.userData.provoked = false;
      obj.userData.warningIssued = false;
      this.engine.monsters.push(obj);
      this.patrol.push(obj);
      const label = labelSprite(this.scene, data.name, data.x, data.z, 2.8, 0.42);
      this.engine.labels.push(label);
      this.labels.push(label);
    }
  }

  update(dt) {
    const player = this.engine.rig.position;
    const landmarkDistance = this.quality.settlementLandmarkDistance || 175;
    const detailDistance = this.quality.settlementDetailDistance || 82;
    for (const visual of this.settlementVisuals) {
      const distance = Math.hypot(player.x - visual.settlement.x, player.z - visual.settlement.z);
      visual.landmark.visible = distance < landmarkDistance;
      visual.detail.visible = distance < detailDistance;
    }
    for (const group of this.roadsideGroups) {
      const distance = Math.hypot(player.x - group.position.x, player.z - group.position.z);
      group.visible = distance < detailDistance;
    }
    this.updateZhuzherPolicy();
  }

  updateZhuzherPolicy() {
    const culture = normalizePlayerCulture(this.engine.player);
    const immediateHostility = ['human', 'red'].includes(culture.race);
    const player = this.engine.rig.position;
    for (const obj of this.patrol) {
      const u = obj.userData;
      if (u.alive === false) continue;
      u.autoHostile = immediateHostility;
      const distance = Math.hypot(player.x - obj.position.x, player.z - obj.position.z);
      if (!immediateHostility && culture.race !== 'zhuzher' && !u.provoked && distance < 17 && !u.warningIssued) {
        u.warningIssued = true;
        this.engine.hud?.setObjective?.('Жужжерский дозор предупреждает вибрацией крыльев: не приближайся к внутреннему периметру.');
        this.engine.log.unshift('Жужжерский дозор обозначил внутренний периметр у старого тракта.');
      }
      if (!immediateHostility && culture.race !== 'zhuzher' && !u.provoked && distance < 8) {
        u.provoked = true;
        this.engine.hud?.setObjective?.('Внутренний периметр нарушен. Жужжерский дозор открыл огонь.');
      }
    }
  }

  teleport(index) {
    const settlement = SETTLEMENTS[index % SETTLEMENTS.length];
    this.engine.rig.position.set(settlement.x, heightAt(settlement.x, settlement.z), settlement.z);
    this.engine.hud.setObjective(`F2 settlement: ${settlement.name} · риск ${settlement.riskLevel}/5`);
    return settlement;
  }

  diagnostics() {
    const activeLabels = this.labels.filter((label) => label.visible).length;
    const visibleLandmarks = this.settlementVisuals.filter((visual) => visual.landmark.visible).length;
    const visibleDetails = this.settlementVisuals.filter((visual) => visual.detail.visible).length;
    return {
      settlements: SETTLEMENTS.length,
      roadLength: settlementRoadLength(),
      settlementAgents: this.settlementAgents.length,
      caravans: SETTLEMENT_CARAVANS.length,
      zhuzherPatrol: this.patrol.map((obj) => ({
        id: obj.userData.id,
        alive: obj.userData.alive,
        autoHostile: obj.userData.autoHostile,
        provoked: obj.userData.provoked,
      })),
      instanceCounts: { ...this.instanceCounts },
      roadsideScenes: this.roadsideGroups.length,
      activeLabels,
      visibleLandmarks,
      visibleDetails,
      quality: this.quality.name,
      drawCalls: this.engine.renderer.info.render.calls,
      triangles: this.engine.renderer.info.render.triangles,
    };
  }
}
