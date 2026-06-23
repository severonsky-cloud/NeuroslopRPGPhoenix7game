import * as THREE from '../vendor/three.module.js';

export const VEHICLE_TYPES = {
  technical: { label: 'Техничанка', faction: 'Жужжер', hp: 150, armor: 5, mobility: 1.0, speed: 5.2, turnRate: 1.7, role: 'light' },
  panzer4: { label: 'Panzer IV', faction: 'Жужжер', hp: 350, armor: 20, mobility: 0.6, speed: 3.2, turnRate: 0.95, role: 'tank' },
  puma: { label: 'Puma', faction: 'Жужжер', hp: 180, armor: 12, mobility: 0.9, speed: 5.0, turnRate: 1.35, role: 'scout' },
  flakpanzer: { label: 'Wirbelwind', faction: 'Жужжер', hp: 250, armor: 10, mobility: 0.62, speed: 3.4, turnRate: 1.1, role: 'aa' },
  sherman: { label: 'M4 Sherman', faction: 'Империя', hp: 300, armor: 15, mobility: 0.68, speed: 3.6, turnRate: 1.0, role: 'tank' },
  jeep: { label: 'Willys Jeep', faction: 'Империя', hp: 80, armor: 2, mobility: 1.2, speed: 6.0, turnRate: 1.9, role: 'light' },
  achilles: { label: 'Achilles', faction: 'Империя', hp: 200, armor: 8, mobility: 0.55, speed: 3.0, turnRate: 0.9, role: 'tankDestroyer' },
  m16aa: { label: 'M16 AA', faction: 'Империя', hp: 120, armor: 3, mobility: 0.78, speed: 4.4, turnRate: 1.2, role: 'aa' },
  fuelTruck: { label: 'Fuel Truck', faction: 'Нейтрал', hp: 130, armor: 3, mobility: 0.72, speed: 3.2, turnRate: 0.85, role: 'soft', secondaryBlast: true },
  glassWalker: { label: 'Glass Walker', faction: 'Стеклянные', hp: 240, armor: 10, mobility: 0.55, speed: 2.4, turnRate: 1.2, role: 'walker' },
};

export const VEHICLE_TEST_WEAPONS = {
  mgBullet: { id: 'mgBullet', label: 'MG burst', class: 'smallArms', damage: 14, penetration: 2, splashRadius: 0, speed: 0, killMethod: 'none' },
  atRifle: { id: 'atRifle', label: 'PT rifle', class: 'antiVehicleKinetic', damage: 70, penetration: 9, splashRadius: 0, speed: 150, killMethod: 'kinetic' },
  bazookaRocket: { id: 'bazookaRocket', label: 'Bazooka', class: 'antiVehicleRocket', damage: 150, penetration: 16, splashRadius: 4.4, speed: 35, killMethod: 'explosive' },
  panzerfaustRocket: { id: 'panzerfaustRocket', label: 'Panzerfaust', class: 'antiVehicleRocket', damage: 175, penetration: 18, splashRadius: 5.2, speed: 25, killMethod: 'explosive' },
};

function makeMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.75, metalness: opts.metalness ?? 0.25, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0 });
}

const MATERIALS = {
  axisDark: makeMat(0x2a2a2a, { roughness: 0.52, metalness: 0.72 }),
  axisGreen: makeMat(0x3a4a2a, { roughness: 0.78, metalness: 0.36 }),
  alliesGreen: makeMat(0x4a5a3a, { roughness: 0.76, metalness: 0.32 }),
  rust: makeMat(0x7b4a3a, { roughness: 0.86, metalness: 0.36 }),
  wood: makeMat(0x6a4a2b, { roughness: 0.92, metalness: 0.05 }),
  detail: makeMat(0x111111, { roughness: 0.46, metalness: 0.82 }),
  tire: makeMat(0x121212, { roughness: 0.94, metalness: 0.05 }),
  fuel: makeMat(0x9b1010, { roughness: 0.58, metalness: 0.55 }),
  burnt: makeMat(0x171717, { roughness: 1, metalness: 0.08 }),
  loot: makeMat(0x44ff44, { roughness: 0.25, metalness: 0.08, emissive: 0x44ff44, emissiveIntensity: 1.8 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x88ddff, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.8, emissive: 0x446688, emissiveIntensity: 1.6 }),
  hitbox: new THREE.MeshBasicMaterial({ color: 0xff3333, wireframe: true, transparent: true, opacity: 0.42 }),
};

const S = 1.5;
const raycaster = new THREE.Raycaster();

function matForFaction(type) {
  if (['sherman', 'jeep', 'achilles', 'm16aa'].includes(type)) return MATERIALS.alliesGreen;
  if (['puma', 'flakpanzer'].includes(type)) return MATERIALS.axisGreen;
  if (type === 'fuelTruck' || type === 'technical') return MATERIALS.rust;
  return MATERIALS.axisDark;
}

function box(parent, name, mat, size, pos, rot = [0, 0, 0]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  m.name = name;
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function cyl(parent, name, mat, rt, rb, h, pos, rot = [0, 0, 0], segments = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), mat);
  m.name = name;
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function wheel(parent, data, pos, radius = 0.5 * S, tire = true) {
  const w = cyl(parent, 'wheel', tire ? MATERIALS.tire : MATERIALS.detail, radius, radius, 0.4 * S, pos, [0, 0, Math.PI / 2], 16);
  data.parts.wheels.push(w);
  data.wheelLayout.push({ mesh: w, pos: new THREE.Vector3(...pos), attached: true });
  addHitbox(parent, data, 'wheels', [radius * 1.25, radius * 1.25, radius * 1.25], pos, true, w);
  return w;
}

function addHitbox(parent, data, part, size, pos, weak = false, visualTarget = null) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), MATERIALS.hitbox.clone());
  m.name = `hitbox_${part}`;
  m.material.color.setHex(weak ? 0x35ff63 : 0xff3333);
  m.position.set(...pos);
  m.visible = false;
  m.userData = { isHitbox: true, hitPart: part, isWeakSpot: weak, visualTarget };
  parent.add(m);
  data.hitboxes.push(m);
  return m;
}

function addTankWheels(chassis, data, sideX = 1.35 * S, count = 7, spacing = 0.78 * S, zOffset = 0) {
  for (let i = 0; i < count; i += 1) {
    const z = (i - (count - 1) / 2) * spacing + zOffset;
    wheel(chassis, data, [-sideX, 0.5 * S, z], 0.38 * S, false);
    wheel(chassis, data, [sideX, 0.5 * S, z], 0.38 * S, false);
  }
  box(chassis, 'left_track_guard', MATERIALS.detail, [0.12 * S, 0.9 * S, count * spacing + 0.6], [-sideX - 0.28 * S, 0.8 * S, zOffset]);
  box(chassis, 'right_track_guard', MATERIALS.detail, [0.12 * S, 0.9 * S, count * spacing + 0.6], [sideX + 0.28 * S, 0.8 * S, zOffset]);
}

function addTurret(data, chassis, type, matHull, pos = [0, 2.4 * S, -0.5 * S], longGun = 4.6 * S) {
  const turret = new THREE.Group();
  turret.name = `${type}_turret`;
  turret.position.set(...pos);
  chassis.add(turret);
  data.parts.turret = turret;
  if (type === 'achilles') {
    box(turret, 'open_top_back_plate', matHull, [1.8 * S, 1.0 * S, 0.2 * S], [0, 0.5 * S, -1.0 * S]);
    box(turret, 'open_top_left_plate', matHull, [0.2 * S, 1.0 * S, 2.0 * S], [-0.9 * S, 0.5 * S, 0]);
    box(turret, 'open_top_right_plate', matHull, [0.2 * S, 1.0 * S, 2.0 * S], [0.9 * S, 0.5 * S, 0]);
  } else if (type === 'flakpanzer') {
    cyl(turret, 'aa_open_turret_drum', matHull, 1.15 * S, 1.15 * S, 1.0 * S, [0, 0, 0], [0, 0, 0], 18);
  } else {
    box(turret, 'turret_body', matHull, [1.6 * S, 0.75 * S, 1.75 * S], [0, 0.28 * S, 0]);
    if (type === 'sherman') box(turret, 'turret_bustle', matHull, [1.25 * S, 0.7 * S, 0.95 * S], [0, 0.22 * S, 1.05 * S]);
  }

  if (['flakpanzer', 'm16aa'].includes(type)) {
    const coords = [[-0.45, 0.55, -1.12], [0.45, 0.55, -1.12], [-0.45, 0.55, -0.72], [0.45, 0.55, -0.72]];
    coords.forEach((p, index) => cyl(turret, `aa_barrel_${index}`, MATERIALS.detail, 0.035 * S, 0.035 * S, 2.55 * S, [p[0] * S, p[1] * S, p[2] * S], [Math.PI / 2, 0, 0], 8));
  } else {
    cyl(turret, 'main_gun', MATERIALS.detail, 0.065 * S, 0.095 * S, longGun, [0, 0.28 * S, -longGun / 2 - 0.65 * S], [Math.PI / 2, 0, 0], 14);
    box(turret, 'mantlet', MATERIALS.detail, [0.55 * S, 0.45 * S, 0.35 * S], [0, 0.28 * S, -0.85 * S]);
  }
  addHitbox(chassis, data, 'turretRing', [1.9 * S, 1.1 * S, 2.0 * S], pos, true, turret);
  return turret;
}

function makeVehicleData(root, chassis, type) {
  const def = VEHICLE_TYPES[type] || VEHICLE_TYPES.technical;
  return {
    type: 'vehicle', vehicleType: type, label: def.label, faction: def.faction,
    chassis, hp: def.hp, hpMax: def.hp, armor: def.armor, mobility: def.mobility,
    baseMobility: def.mobility, state: 'idle', targetPos: new THREE.Vector3((Math.random() - 0.5) * 44, 0, (Math.random() - 0.5) * 44),
    parts: { wheels: [], legs: [], turret: null, hull: null, skirts: [] }, hitboxes: [], wheelLayout: [],
    tiltTarget: new THREE.Vector3(), currentTilt: new THREE.Vector3(), detachedParts: [],
    isTippingOver: false, tipAxis: new THREE.Vector3(1, 0, 0), tipAngle: 0, cookTimer: -1, killMethod: 'none', lootPending: 0,
    labVehicle: true, speed: def.speed, turnRate: def.turnRate, role: def.role, secondaryBlast: Boolean(def.secondaryBlast),
  };
}

export function createVehicle(type, options = {}) {
  const root = new THREE.Group();
  root.name = `ashgrave_vehicle_${type}`;
  const chassis = new THREE.Group();
  chassis.name = 'vehicle_chassis';
  root.add(chassis);
  const data = makeVehicleData(root, chassis, type);
  root.userData = data;
  const matHull = matForFaction(type);

  if (type === 'technical') buildTechnical(chassis, data);
  else if (type === 'panzer4') buildPanzer4(chassis, data);
  else if (type === 'puma') buildPuma(chassis, data);
  else if (type === 'flakpanzer') buildFlakpanzer(chassis, data);
  else if (type === 'sherman') buildSherman(chassis, data);
  else if (type === 'jeep') buildJeep(chassis, data);
  else if (type === 'achilles') buildAchilles(chassis, data);
  else if (type === 'm16aa') buildM16(chassis, data);
  else if (type === 'fuelTruck') buildFuelTruck(chassis, data);
  else if (type === 'glassWalker') buildGlassWalker(chassis, data);
  else buildTechnical(chassis, data);

  root.position.set(options.x ?? 0, options.y ?? 0, options.z ?? 0);
  root.rotation.y = options.yaw ?? 0;
  root.traverse((child) => { if (child.isMesh) child.frustumCulled = false; });
  return root;
}

function buildTechnical(chassis, data) {
  const hull = box(chassis, 'technical_frame', MATERIALS.rust, [2 * S, 0.4 * S, 4.5 * S], [0, 0.7 * S, 0]); data.parts.hull = hull;
  box(chassis, 'cab', MATERIALS.rust, [1.8 * S, 1.2 * S, 1.5 * S], [0, 1.5 * S, -1.2 * S]);
  box(chassis, 'wooden_bed', MATERIALS.wood, [2 * S, 0.2 * S, 2 * S], [0, 1.1 * S, 1 * S]);
  box(chassis, 'canvas_frame', MATERIALS.wood, [2 * S, 0.8 * S, 0.2 * S], [0, 1.8 * S, 0.2 * S], [-0.3, 0, 0]);
  const turret = new THREE.Group(); turret.position.set(0, 1.6 * S, 1.5 * S); chassis.add(turret); data.parts.turret = turret;
  box(turret, 'mg_shield', MATERIALS.detail, [0.8 * S, 0.6 * S, 0.1 * S], [0, 0.3 * S, 0]);
  cyl(turret, 'mg_barrel', MATERIALS.detail, 0.04 * S, 0.04 * S, 1.5 * S, [0, 0.3 * S, 0.7 * S], [Math.PI / 2, 0, 0], 8);
  box(chassis, 'engine_grille', MATERIALS.detail, [1 * S, 0.8 * S, 0.2 * S], [0, 1.2 * S, -1.95 * S]);
  [[-1.1, 0.5, -1.5], [1.1, 0.5, -1.5], [-1.1, 0.5, 1.5], [1.1, 0.5, 1.5]].forEach((p) => wheel(chassis, data, p.map(v => v * S), 0.5 * S));
  addHitbox(chassis, data, 'hull', [2.2 * S, 1.5 * S, 4.7 * S], [0, 1.2 * S, 0], false, hull);
}

function buildPanzer4(chassis, data) {
  const hull = box(chassis, 'panzer4_hull', MATERIALS.axisDark, [3 * S, 1.0 * S, 5.8 * S], [0, 1.3 * S, 0]); data.parts.hull = hull;
  box(chassis, 'front_glacis', MATERIALS.axisDark, [3 * S, 1.2 * S, 1.5 * S], [0, 1.5 * S, -3.5 * S], [-0.4, 0, 0]);
  box(chassis, 'engine_deck', MATERIALS.detail, [2.8 * S, 0.1 * S, 2 * S], [0, 2.0 * S, 2.5 * S]);
  addTurret(data, chassis, 'panzer4', MATERIALS.axisDark, [0, 2.4 * S, -0.5 * S], 5 * S);
  addTankWheels(chassis, data, 1.4 * S, 7, 0.8 * S);
  box(chassis, 'left_schurzen', MATERIALS.axisDark, [0.1 * S, 1.5 * S, 5 * S], [-1.8 * S, 1.2 * S, 0]);
  box(chassis, 'right_schurzen', MATERIALS.axisDark, [0.1 * S, 1.5 * S, 5 * S], [1.8 * S, 1.2 * S, 0]);
  addHitbox(chassis, data, 'hull', [3.2 * S, 1.5 * S, 6.2 * S], [0, 1.5 * S, 0], false, hull);
  addHitbox(chassis, data, 'rearEngine', [2.5 * S, 1.5 * S, 1.5 * S], [0, 1.8 * S, 2.5 * S], true, hull);
}

function buildPuma(chassis, data) {
  const hull = box(chassis, 'puma_hull', MATERIALS.axisGreen, [1.8 * S, 1.0 * S, 5 * S], [0, 1.1 * S, 0]); data.parts.hull = hull;
  box(chassis, 'sloped_front', MATERIALS.axisGreen, [1.8 * S, 0.8 * S, 1.5 * S], [0, 1.3 * S, -3 * S], [-0.3, 0, 0]);
  addTurret(data, chassis, 'puma', MATERIALS.axisGreen, [0, 1.9 * S, -0.5 * S], 5.5 * S);
  [[-1, .4, -2.2], [1, .4, -2.0], [-1, .4, -0.5], [1, .4, -0.3], [-1, .4, 1.0], [1, .4, 1.2], [-1, .4, 2.3], [1, .4, 2.5]].forEach((p) => wheel(chassis, data, p.map(v => v * S), 0.45 * S));
  addHitbox(chassis, data, 'hull', [2 * S, 1.5 * S, 5.2 * S], [0, 1.1 * S, 0], false, hull);
}

function buildFlakpanzer(chassis, data) {
  const hull = box(chassis, 'flakpanzer_hull', MATERIALS.axisDark, [3 * S, 1.0 * S, 5.8 * S], [0, 1.3 * S, 0]); data.parts.hull = hull;
  addTankWheels(chassis, data, 1.4 * S, 7, 0.8 * S);
  addTurret(data, chassis, 'flakpanzer', MATERIALS.axisGreen, [0, 2.2 * S, -0.5 * S], 2.5 * S);
  addHitbox(chassis, data, 'hull', [3.2 * S, 1.5 * S, 6.2 * S], [0, 1.5 * S, 0], false, hull);
}

function buildSherman(chassis, data) {
  const hull = box(chassis, 'sherman_hull', MATERIALS.alliesGreen, [2.5 * S, 1.2 * S, 5.2 * S], [0, 1.3 * S, 0]); data.parts.hull = hull;
  box(chassis, 'front_plate', MATERIALS.alliesGreen, [2.5 * S, 1.0 * S, 1.2 * S], [0, 1.5 * S, -3 * S], [-0.4, 0, 0]);
  addTurret(data, chassis, 'sherman', MATERIALS.alliesGreen, [0, 2.4 * S, -0.5 * S], 4.5 * S);
  addTankWheels(chassis, data, 1.3 * S, 7, 0.75 * S);
  box(chassis, 'left_skirt', MATERIALS.alliesGreen, [0.1 * S, 1.0 * S, 4.5 * S], [-1.5 * S, 1.2 * S, 0.2 * S]);
  box(chassis, 'right_skirt', MATERIALS.alliesGreen, [0.1 * S, 1.0 * S, 4.5 * S], [1.5 * S, 1.2 * S, 0.2 * S]);
  addHitbox(chassis, data, 'hull', [2.7 * S, 1.5 * S, 5.4 * S], [0, 1.5 * S, 0], false, hull);
}

function buildJeep(chassis, data) {
  const hull = box(chassis, 'jeep_hull', MATERIALS.alliesGreen, [1.4 * S, 0.3 * S, 2.8 * S], [0, 0.6 * S, 0]); data.parts.hull = hull;
  box(chassis, 'jeep_cab', MATERIALS.alliesGreen, [1.2 * S, 0.8 * S, 1.2 * S], [0, 1.2 * S, -0.6 * S]);
  box(chassis, 'windshield_frame', MATERIALS.alliesGreen, [1.3 * S, 0.1 * S, 1.0 * S], [0, 1.6 * S, -0.2 * S], [-0.2, 0, 0]);
  const turret = new THREE.Group(); turret.position.set(0, 1.2 * S, 0.5 * S); chassis.add(turret); data.parts.turret = turret;
  cyl(turret, 'jeep_mg', MATERIALS.detail, 0.03 * S, 0.03 * S, 1.2 * S, [0, 0, 0.6 * S], [Math.PI / 2, 0, 0], 8);
  [[-0.8, 0.3, -0.9], [0.8, 0.3, -0.9], [-0.8, 0.3, 0.9], [0.8, 0.3, 0.9]].forEach((p) => wheel(chassis, data, p.map(v => v * S), 0.35 * S));
  addHitbox(chassis, data, 'hull', [1.6 * S, 1.2 * S, 3 * S], [0, 0.8 * S, 0], false, hull);
}

function buildAchilles(chassis, data) {
  const hull = box(chassis, 'achilles_hull', MATERIALS.alliesGreen, [2.5 * S, 0.8 * S, 6 * S], [0, 1.0 * S, 0]); data.parts.hull = hull;
  box(chassis, 'sloped_front', MATERIALS.alliesGreen, [2.5 * S, 1.0 * S, 1.5 * S], [0, 1.2 * S, -3.2 * S], [-0.4, 0, 0]);
  addTurret(data, chassis, 'achilles', MATERIALS.alliesGreen, [0, 1.8 * S, -0.5 * S], 7 * S);
  addTankWheels(chassis, data, 1.4 * S, 7, 0.8 * S);
  addHitbox(chassis, data, 'hull', [2.7 * S, 1.2 * S, 6.2 * S], [0, 1.2 * S, 0], false, hull);
}

function buildM16(chassis, data) {
  const cab = box(chassis, 'm16_cab', MATERIALS.alliesGreen, [2.0 * S, 2.0 * S, 2.0 * S], [0, 1.5 * S, -2.5 * S]); data.parts.hull = cab;
  box(chassis, 'bed', MATERIALS.alliesGreen, [2.0 * S, 0.2 * S, 3 * S], [0, 1.0 * S, 0.5 * S]);
  const turret = new THREE.Group(); turret.position.set(0, 1.5 * S, 0.5 * S); chassis.add(turret); data.parts.turret = turret;
  box(chassis, 'gun_shield', MATERIALS.alliesGreen, [1.5 * S, 0.8 * S, 1.5 * S], [0, 1.5 * S, 0.5 * S]);
  [[-0.4, 0.8, -0.2], [0.4, 0.8, -0.2], [-0.4, 0.8, 0.2], [0.4, 0.8, 0.2]].forEach((p, i) => cyl(turret, `quad50_${i}`, MATERIALS.detail, 0.05 * S, 0.05 * S, 2.5 * S, [p[0] * S, p[1] * S, p[2] * S - 1.2 * S], [Math.PI / 2, 0, 0], 10));
  [[-1.0, 0.5, -2.2], [1.0, 0.5, -2.2], [-1.0, 0.5, 0.5], [1.0, 0.5, 0.5], [-1.0, 0.5, 1.8], [1.0, 0.5, 1.8]].forEach((p) => wheel(chassis, data, p.map(v => v * S), 0.5 * S));
  addHitbox(chassis, data, 'hull', [2.2 * S, 2.2 * S, 2.2 * S], [0, 1.5 * S, -2.5 * S], false, cab);
  addHitbox(chassis, data, 'turretRing', [1.2 * S, 1.5 * S, 1.2 * S], [0, 1.5 * S, 0.5 * S], true, turret);
}

function buildFuelTruck(chassis, data) {
  const cab = box(chassis, 'fuel_cab', MATERIALS.rust, [2.2 * S, 2.2 * S, 2.2 * S], [0, 1.8 * S, -2.8 * S]); data.parts.hull = cab;
  const tank = cyl(chassis, 'fuel_tank', MATERIALS.fuel, 1.3 * S, 1.3 * S, 4.2 * S, [0, 2.1 * S, 0.5 * S], [0, 0, Math.PI / 2], 18);
  box(chassis, 'rear_ladder', MATERIALS.detail, [0.1 * S, 1.4 * S, 0.12 * S], [0.95 * S, 2.1 * S, 2.65 * S]);
  [[-1.1, .6, -2.5], [1.1, .6, -2.5], [-1.1, .6, .5], [1.1, .6, .5], [-1.1, .6, 1.8], [1.1, .6, 1.8]].forEach((p) => wheel(chassis, data, p.map(v => v * S), 0.6 * S));
  addHitbox(chassis, data, 'hull', [2.4 * S, 2.2 * S, 2.4 * S], [0, 1.8 * S, -2.8 * S], false, cab);
  addHitbox(chassis, data, 'fuelTank', [2.9 * S, 2.9 * S, 4.6 * S], [0, 2.1 * S, 0.5 * S], true, tank);
}

function buildGlassWalker(chassis, data) {
  const body = box(chassis, 'walker_body', MATERIALS.axisDark, [2.2 * S, 2.2 * S, 3.2 * S], [0, 4 * S, 0]); data.parts.hull = body;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.8 * S, 16, 16), MATERIALS.glass); core.name = 'glass_core'; core.position.set(0, 4 * S, 0); core.castShadow = true; chassis.add(core);
  const turret = new THREE.Group(); turret.position.set(0, 4.5 * S, 0); chassis.add(turret); data.parts.turret = turret;
  cyl(turret, 'walker_cannon', MATERIALS.detail, 0.15 * S, 0.2 * S, 4 * S, [0, 0, -2.5 * S], [Math.PI / 2, 0, 0], 14);
  [[-1.2, 0, -1.2], [1.2, 0, -1.2], [-1.2, 0, 1.2], [1.2, 0, 1.2]].forEach((p, i) => {
    const leg = new THREE.Group(); leg.name = `walker_leg_${i}`; leg.position.set(p[0] * S, 2.5 * S, p[2] * S); chassis.add(leg);
    box(leg, 'upper_leg', MATERIALS.axisDark, [0.5 * S, 2.2 * S, 0.5 * S], [0, 1.1 * S, 0]);
    box(leg, 'lower_leg', MATERIALS.axisDark, [0.4 * S, 2.2 * S, 0.4 * S], [0, -1.1 * S, 0]);
    cyl(leg, 'foot', MATERIALS.detail, 0.38 * S, 0.42 * S, 0.35 * S, [0, -2.3 * S, 0], [Math.PI / 2, 0, 0], 10);
    data.parts.legs.push({ group: leg, phase: i * Math.PI / 2, attached: true, side: p[0] < 0 ? 'left' : 'right' });
    addHitbox(chassis, data, 'legJoint', [0.8 * S, 4.5 * S, 0.8 * S], [p[0] * S, 2.5 * S, p[2] * S], true, leg);
  });
  addHitbox(chassis, data, 'glassCore', [1.6 * S, 1.6 * S, 1.6 * S], [0, 4 * S, 0], true, core);
}

function detachPart(vehicle, part, force = 8) {
  if (!part || !part.parent || part.parent === vehicle.parent) return;
  const scene = vehicle.parent;
  if (!scene) { part.visible = false; return; }
  const wp = new THREE.Vector3(); part.getWorldPosition(wp);
  const wq = new THREE.Quaternion(); part.getWorldQuaternion(wq);
  part.parent.remove(part);
  scene.add(part);
  part.position.copy(wp); part.quaternion.copy(wq);
  const dir = wp.clone().sub(vehicle.position).normalize(); dir.y += 0.8;
  part.userData.detachedVehiclePart = true;
  vehicle.userData.detachedParts.push({ mesh: part, vel: dir.multiplyScalar(force), ang: new THREE.Vector3((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 7), life: 6 });
}

function updateDetachedParts(data, dt) {
  for (const e of data.detachedParts) {
    e.life -= dt; e.vel.y -= 13 * dt;
    e.mesh.position.addScaledVector(e.vel, dt);
    e.mesh.rotation.x += e.ang.x * dt; e.mesh.rotation.y += e.ang.y * dt; e.mesh.rotation.z += e.ang.z * dt;
    if (e.mesh.position.y < 0.12) { e.mesh.position.y = 0.12; e.vel.y = Math.abs(e.vel.y) * 0.18; e.vel.x *= 0.82; e.vel.z *= 0.82; }
  }
  data.detachedParts = data.detachedParts.filter((e) => e.life > 0);
}

export function updateVehicle(vehicle, dt, context = {}) {
  const data = vehicle.userData; if (!data?.labVehicle) return;
  updateDetachedParts(data, dt);
  if (data.state === 'destroyed') return;
  const now = context.time ?? performance.now();
  if (data.cookTimer > 0) {
    data.cookTimer -= dt; data.state = 'cooking_off';
    data.chassis.rotation.z = Math.sin(now * 0.025) * 0.04;
    if (data.cookTimer <= 0) { destroyVehicle(vehicle, 'cook-off'); return; }
    return;
  }
  if (data.isTippingOver) {
    data.tipAngle = Math.min(Math.PI / 2, data.tipAngle + dt * 1.7);
    data.chassis.rotateOnWorldAxis(data.tipAxis, dt * 1.7);
    if (data.tipAngle >= Math.PI / 2) { data.state = 'tipped_over'; data.isTippingOver = false; }
    return;
  }

  data.tiltTarget.set(0, 0, 0);
  let damagedMobility = false;
  for (const wl of data.wheelLayout) {
    if (!wl.mesh.parent) { damagedMobility = true; data.tiltTarget.z -= wl.pos.x * 0.12; data.tiltTarget.x += wl.pos.z * 0.04; }
  }
  if (damagedMobility) { data.mobility = Math.min(data.mobility, data.baseMobility * 0.28); data.state = 'immobilized_tilted'; }
  if (data.parts.legs?.length) {
    const attached = data.parts.legs.filter((l) => l.group.parent === data.chassis);
    const left = attached.filter((l) => l.side === 'left').length;
    const right = attached.filter((l) => l.side === 'right').length;
    if (attached.length === 0 || left === 0 || right === 0) { data.isTippingOver = true; data.tipAxis.set(left === 0 ? 0 : 0, 0, left === 0 ? -1 : 1); }
    else if (attached.length < data.parts.legs.length) data.mobility = attached.length / data.parts.legs.length;
  }

  data.currentTilt.lerp(data.tiltTarget, dt * 4.2);
  data.chassis.rotation.x = data.currentTilt.x;
  data.chassis.rotation.z = data.currentTilt.z;

  const target = context.targetPosition || data.targetPos;
  const dir = new THREE.Vector3().subVectors(target, vehicle.position); dir.y = 0;
  if (dir.length() > 2 && data.mobility > 0.05) {
    data.state = 'moving';
    const desiredYaw = Math.atan2(dir.x, dir.z);
    let delta = desiredYaw - vehicle.rotation.y;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    vehicle.rotation.y += THREE.MathUtils.clamp(delta, -data.turnRate * dt, data.turnRate * dt);
    const speed = data.speed * data.mobility;
    const forward = new THREE.Vector3(Math.sin(vehicle.rotation.y), 0, Math.cos(vehicle.rotation.y));
    vehicle.position.addScaledVector(forward, speed * dt);
    for (const w of data.parts.wheels || []) if (w.parent) w.rotation.x += (speed * dt) / 0.5;
    for (const l of data.parts.legs || []) if (l.group.parent) {
      const s = Math.sin(now * 0.006 * data.mobility + l.phase) * 0.5;
      l.group.children[0].rotation.x = s; l.group.children[1].rotation.x = -s * 1.35;
    }
  } else if (data.state !== 'immobilized_tilted') {
    data.state = 'idle';
    if (!context.targetPosition) data.targetPos.set((Math.random() - 0.5) * 44, 0, (Math.random() - 0.5) * 44);
  }

  if (data.parts.turret && context.lookAt) {
    const tp = context.lookAt.clone().sub(vehicle.position);
    const targetYaw = Math.atan2(tp.x, tp.z) - vehicle.rotation.y;
    data.parts.turret.rotation.y += (targetYaw - data.parts.turret.rotation.y) * Math.min(1, dt * 2.8);
  }
}

export function setVehicleDebugVisible(vehicle, visible) {
  for (const hb of vehicle.userData?.hitboxes || []) hb.visible = visible;
}

export function getVehicleHit(vehicle, start, end) {
  const data = vehicle.userData;
  if (!data || data.state === 'destroyed') return { hit: false };
  const dir = new THREE.Vector3().subVectors(end, start);
  const distance = dir.length();
  if (distance <= 0.0001) return { hit: false };
  raycaster.set(start, dir.normalize()); raycaster.far = distance;
  const hits = raycaster.intersectObjects(data.hitboxes, false);
  if (!hits.length) return { hit: false };
  const hit = hits[0];
  const ud = hit.object.userData;
  const normal = hit.face?.normal?.clone() || new THREE.Vector3(0, 1, 0);
  normal.transformDirection(hit.object.matrixWorld);
  return { hit: true, vehicle, part: ud.hitPart, point: hit.point.clone(), normal, armor: data.armor, visualTarget: ud.visualTarget, isWeakSpot: Boolean(ud.isWeakSpot), isMobilityHit: ['wheels', 'legJoint'].includes(ud.hitPart) };
}

export function applyVehicleDamage(vehicle, hitInfo, weaponProfile) {
  const data = vehicle.userData;
  if (!hitInfo?.hit || !data || data.state === 'destroyed') return { ok: false, kind: 'no_hit' };
  const pen = weaponProfile.penetration ?? weaponProfile.pen ?? 0;
  const damageBase = weaponProfile.damage ?? weaponProfile.dmg ?? 0;
  const penetrates = pen >= data.armor || hitInfo.isWeakSpot;
  if (!penetrates) return { ok: true, kind: 'armorBlocked', blocked: true, part: hitInfo.part, damage: 0 };
  const weakMul = hitInfo.isWeakSpot ? 2.3 : 1.0;
  const directMul = hitInfo.part === 'fuelTank' || hitInfo.part === 'glassCore' ? 1.35 : 1.0;
  const damage = Math.round(damageBase * weakMul * directMul);
  data.hp = Math.max(0, data.hp - damage);
  data.killMethod = weaponProfile.killMethod || weaponProfile.class || 'direct';

  if (hitInfo.isMobilityHit && hitInfo.visualTarget) detachPart(vehicle, hitInfo.visualTarget, weaponProfile.class === 'antiVehicleRocket' ? 10 : 7);
  if (weaponProfile.id === 'atRifle' && data.cookTimer <= 0 && ['panzer4', 'sherman', 'achilles', 'flakpanzer'].includes(data.vehicleType)) {
    data.cookTimer = 10; return { ok: true, kind: 'cookOffStarted', part: hitInfo.part, damage, hp: data.hp };
  }
  if (data.hp <= 0) { const event = destroyVehicle(vehicle, 'direct'); return { ok: true, kind: 'destroyed', part: hitInfo.part, damage, hp: 0, event }; }
  return { ok: true, kind: 'damaged', part: hitInfo.part, damage, hp: data.hp };
}

export function applySplashDamage(vehicles, point, radius, weaponProfile = {}) {
  const results = [];
  if (!radius) return results;
  for (const v of vehicles) {
    const data = v.userData;
    if (!data || data.state === 'destroyed') continue;
    const d = v.position.distanceTo(point);
    if (d > radius) continue;
    let damage = (weaponProfile.splashRadius ? weaponProfile.damage * 0.45 : weaponProfile.damage || 20) * (1 - d / radius);
    if (['panzer4', 'sherman'].includes(data.vehicleType)) damage *= 0.22;
    if (data.role === 'soft' || data.vehicleType === 'fuelTruck') damage *= 1.35;
    damage = Math.round(Math.max(0, damage));
    data.hp = Math.max(0, data.hp - damage);
    data.killMethod = 'explosive';
    if (damage > 25 && data.parts.wheels) for (const w of data.parts.wheels) if (w.parent && Math.random() < 0.24) detachPart(v, w, 5);
    const destroyed = data.hp <= 0 ? destroyVehicle(v, 'splash') : null;
    results.push({ vehicle: v, damage, destroyed });
  }
  return results;
}

export function destroyVehicle(vehicle, reason = 'damage') {
  const data = vehicle.userData;
  if (!data || data.state === 'destroyed') return { reason, already: true };
  data.state = 'destroyed'; data.hp = 0;
  if (data.parts.hull?.material) data.parts.hull.material = MATERIALS.burnt.clone();
  for (const w of data.parts.wheels || []) if (w.parent) detachPart(vehicle, w, 6);
  if (data.parts.turret?.parent === data.chassis) detachPart(vehicle, data.parts.turret, reason === 'cook-off' ? 22 : 10);
  for (const l of data.parts.legs || []) if (l.group.parent === data.chassis) detachPart(vehicle, l.group, 8);
  data.lootPending = reason === 'direct' || data.killMethod === 'kinetic' ? 4 + Math.floor(Math.random() * 4) : (Math.random() < 0.5 ? 1 : 0);
  return { reason, secondaryBlast: data.secondaryBlast && reason !== 'cook-off', loot: data.lootPending };
}

export function createLootCrates(count = 1) {
  const crates = [];
  for (let i = 0; i < count; i += 1) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), MATERIALS.loot.clone());
    c.name = 'vehicle_loot_crate'; c.castShadow = true; crates.push(c);
  }
  return crates;
}
