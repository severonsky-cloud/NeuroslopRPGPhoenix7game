import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

const SAVE_KEY = 'phoenix7_25_world_v2';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = (id) => document.getElementById(id);
const distXZ = (a, b) => Math.hypot((a.x ?? a.position?.x ?? 0) - (b.x ?? b.position?.x ?? 0), (a.z ?? a.position?.z ?? 0) - (b.z ?? b.position?.z ?? 0));

window.__PHX_RUNTIME_READY = false;

const WEAPONS = {
  fists: { name: 'Кулаки', kind: 'melee', damage: 9, range: 1.35, stamina: 7, phase: 0, ammo: null },
  phase: { name: 'Фазовый удар рукой', kind: 'phase', damage: 25, range: 2.25, stamina: 11, phase: 18, ammo: null },
  bastard: { name: 'Бастард', kind: 'sword', damage: 32, range: 2.55, stamina: 18, phase: 0, ammo: null },
  rapier: { name: 'Шпага', kind: 'sword', damage: 19, range: 3.0, stamina: 10, phase: 0, ammo: null },
  colt: { name: 'Кольт 1917', kind: 'gun', damage: 28, range: 28, stamina: 4, phase: 0, ammo: 'colt' },
  m1: { name: 'M1 Гаранд', kind: 'gun', damage: 38, range: 42, stamina: 7, phase: 0, ammo: 'm1' },
  bren: { name: 'Брен', kind: 'gun', damage: 18, range: 34, stamina: 13, phase: 0, ammo: 'bren', burst: 3 },
};

const RACES = {
  human: { hp: 105, st: 105, ph: 90, hand: 0xc09673 },
  deimur: { hp: 92, st: 96, ph: 125, hand: 0x8c807a },
  red: { hp: 122, st: 88, ph: 100, hand: 0xb44d33 },
  blue: { hp: 94, st: 112, ph: 130, hand: 0x4d78b8 },
  black: { hp: 96, st: 102, ph: 145, hand: 0x343044 },
};

const state = {
  started: false,
  mode: 'menu',
  yaw: Math.PI * 0.5,
  pitch: 0,
  keys: new Set(),
  near: null,
  attackT: 0,
  toastT: 0,
  projectiles: [],
  colliders: [],
  objects: [],
  npcs: [],
  enemies: [],
  doors: [],
  labels: [],
  mapPoints: [],
  cameraRig: null,
  hands: null,
  last: performance.now(),
  player: null,
};

const ui = {
  start: $('start'),
  chargen: $('chargen'),
  hud: $('hud'),
  prompt: $('prompt'),
  toast: $('toast'),
  panel: $('panel'),
  panelText: $('panelText'),
  hp: $('hpBar'),
  st: $('stBar'),
  ph: $('phBar'),
  hpTxt: $('hpTxt'),
  stTxt: $('stTxt'),
  phTxt: $('phTxt'),
  weapon: $('weapon'),
  ammo: $('ammo'),
  questTitle: $('questTitle'),
  questBody: $('questBody'),
  questProgress: $('questProgress'),
  nav: $('nav'),
  debug: $('debug'),
};

function makePlayer(opts = {}) {
  const raceKey = opts.race || 'human';
  const r = RACES[raceKey] || RACES.human;
  return {
    name: opts.name || 'Безымянная ошибка',
    race: raceKey,
    bg: opts.bg || 'lunar',
    pos: { x: -47, y: 1.7, z: 8 },
    hp: r.hp,
    hpMax: r.hp,
    st: r.st,
    stMax: r.st,
    ph: r.ph,
    phMax: r.ph,
    hand: r.hand,
    weapon: 'fists',
    ammo: { colt: 9, m1: 12, bren: 18 },
    credits: 18,
    inv: ['мокрые бумаги', 'тюремный жетон', 'бастард', 'шпага', 'Кольт 1917', 'M1 Гаранд', 'Брен'],
    log: ['Ты стоишь на влажной красной глине Порта Рейчел. Слева океан, впереди дорога к Форту Заря.'],
    done: { rina: false, road: false, oran: false, market: false, factions: false, contraband: false, gerda: false, sava: false },
    flags: { green: false, blue: false, rewarded: false, debugIndex: 0 },
  };
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9a5630);
scene.fog = new THREE.FogExp2(0xb06c3f, 0.0105);

const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 900);
const renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const rig = new THREE.Object3D();
rig.position.set(-47, 0, 8);
scene.add(rig);
camera.position.set(0, 1.72, 0);
rig.add(camera);
state.cameraRig = rig;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.86,
    metalness: options.metalness ?? 0.02,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: !!options.opacity,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
  });
}

const M = {
  clay: material(0x8c3f23),
  wetClay: material(0x673522),
  beach: material(0xa76537),
  savanna: material(0x7a5732),
  road: material(0x5d4328),
  wood: material(0x3f2718),
  dark: material(0x120c08),
  roof: material(0x20140d),
  water: new THREE.MeshStandardMaterial({ color: 0x12384d, roughness: 0.25, metalness: 0.08, transparent: true, opacity: 0.86 }),
  sign: material(0xd8b56e, { emissive: 0x241405, emissiveIntensity: 0.18 }),
};

function addMesh(geo, mat, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCollider(x, z, w, d, tag = 'wall') {
  state.colliders.push({ x, z, w, d, tag });
}

function collides(x, z, r = 0.45) {
  return state.colliders.some((c) => Math.abs(x - c.x) < c.w / 2 + r && Math.abs(z - c.z) < c.d / 2 + r);
}

function box(x, z, w, d, h, mat, tag = '', solid = true) {
  const mesh = addMesh(new THREE.BoxGeometry(w, h, d), mat, x, h / 2, z);
  if (solid) addCollider(x, z, w, d, tag);
  return mesh;
}

function label(text, x, y, z, scale = 1) {
  const cnv = document.createElement('canvas');
  cnv.width = 640;
  cnv.height = 140;
  const c = cnv.getContext('2d');
  c.fillStyle = 'rgba(8,7,5,.75)';
  c.fillRect(0, 0, cnv.width, cnv.height);
  c.strokeStyle = 'rgba(216,181,110,.9)';
  c.lineWidth = 5;
  c.strokeRect(5, 5, cnv.width - 10, cnv.height - 10);
  c.fillStyle = '#f4dca4';
  c.font = '700 34px system-ui';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, cnv.width / 2, cnv.height / 2);
  const tex = new THREE.CanvasTexture(cnv);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.position.set(x, y, z);
  sp.scale.set(6.2 * scale, 1.35 * scale, 1);
  sp.renderOrder = 10;
  scene.add(sp);
  state.labels.push(sp);
  return sp;
}

function mapPoint(name, x, z, type = 'place') {
  state.mapPoints.push({ name, x, z, type });
}

function road(points, width = 4.2) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const m = addMesh(new THREE.BoxGeometry(width, 0.06, len), M.road, (a.x + b.x) / 2, 0.035, (a.z + b.z) / 2);
    m.rotation.y = Math.atan2(dx, dz);
    m.castShadow = false;
  }
}

function doorMarker(name, x, z, rot = 0) {
  const m = addMesh(new THREE.BoxGeometry(2.1, 2.25, 0.09), material(0x050403, { emissive: 0xe0a247, emissiveIntensity: 0.22 }), x, 1.12, z);
  m.rotation.y = rot;
  m.castShadow = false;
  state.doors.push({ name, x, z });
  label('ВХОД', x, 2.65, z, 0.45);
}

function building({ name, sign, x, z, w, d, h = 3.5, color = 0x6d5535, door = 'south' }) {
  const wall = material(color);
  const floor = material(0x302319);
  box(x, z, w, d, 0.08, floor, '', false);
  const t = 0.32;
  const gap = 2.3;
  box(x - w / 2 + t / 2, z, t, d, h, wall, name);
  box(x + w / 2 - t / 2, z, t, d, h, wall, name);
  if (door === 'south') {
    box(x, z - d / 2 + t / 2, w, t, h, wall, name);
    box(x - (w + gap) / 4, z + d / 2 - t / 2, (w - gap) / 2, t, h, wall, name);
    box(x + (w + gap) / 4, z + d / 2 - t / 2, (w - gap) / 2, t, h, wall, name);
    doorMarker(name, x, z + d / 2 + 0.08, 0);
  } else {
    box(x, z + d / 2 - t / 2, w, t, h, wall, name);
    box(x - (w + gap) / 4, z - d / 2 + t / 2, (w - gap) / 2, t, h, wall, name);
    box(x + (w + gap) / 4, z - d / 2 + t / 2, (w - gap) / 2, t, h, wall, name);
    doorMarker(name, x, z - d / 2 - 0.08, Math.PI);
  }
  const roof = addMesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, h * 0.36, 4), M.roof, x, h + 0.68, z);
  roof.rotation.y = Math.PI / 4;
  label(sign || name, x, h + 1.55, z, 0.75);
}

function npc(id, name, x, z, color, text) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 1.15, 4, 8), material(color));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), material(0xd3ad78));
  body.position.y = 1.05;
  head.position.y = 1.88;
  g.add(body, head);
  g.position.set(x, 0, z);
  g.userData = { type: 'npc', id, name, x, z, text };
  scene.add(g);
  label(name, x, 2.65, z, 0.55);
  state.npcs.push(g);
  return g;
}

function enemy(id, name, x, z, hp, color, table) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), material(color));
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.52), material(0x21140e));
  body.position.y = 0.82;
  head.position.y = 1.35;
  g.add(body, head);
  g.position.set(x, 0, z);
  g.userData = { type: 'enemy', id, name, x, z, hp, hpMax: hp, alive: true, looted: false, table };
  scene.add(g);
  label(name, x, 2.2, z, 0.47);
  state.enemies.push(g);
  return g;
}

function propMast(x, z, h = 6) {
  box(x, z, 0.14, 0.14, h, M.dark, '', false);
  const sail = addMesh(new THREE.PlaneGeometry(1.25, 3), material(0x17100a, { side: THREE.DoubleSide }), x + 0.7, h * 0.55, z);
  sail.rotation.y = -0.35;
}

function propPalm(x, z, h = 4) {
  box(x, z, 0.18, 0.18, h, material(0x4c2f1b), '', false);
  for (let i = 0; i < 6; i++) {
    const leaf = addMesh(new THREE.PlaneGeometry(0.6, 2.0), material(0x284220, { side: THREE.DoubleSide }), x, h + 0.2, z);
    leaf.rotation.y = i * Math.PI / 3;
    leaf.rotation.x = 1.0;
  }
}

function buildLandscape() {
  const clay = addMesh(new THREE.PlaneGeometry(170, 130, 8, 8), M.clay, 0, -0.03, 12);
  clay.rotation.x = -Math.PI / 2;
  const ocean = addMesh(new THREE.PlaneGeometry(105, 125, 16, 16), M.water, -72, 0.015, 0);
  ocean.rotation.x = -Math.PI / 2;
  const beach = addMesh(new THREE.PlaneGeometry(16, 120), M.beach, -38, -0.02, 0);
  beach.rotation.x = -Math.PI / 2;
  const sav = addMesh(new THREE.PlaneGeometry(92, 80, 8, 8), M.savanna, 52, -0.015, 32);
  sav.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 36; i++) propMast(-58 + i * 1.7, -20 - (i % 5) * 0.8, 4.5 + Math.random() * 3.5);
  for (let i = 0; i < 36; i++) propPalm(-34 + Math.random() * 24, -18 + Math.random() * 50, 3 + Math.random() * 2.5);
  for (let i = 0; i < 160; i++) {
    const x = -30 + Math.random() * 105;
    const z = -26 + Math.random() * 75;
    const s = 0.1 + Math.random() * 0.55;
    addMesh(new THREE.DodecahedronGeometry(s, 0), material(0x4b3522), x, s * 0.5, z).castShadow = false;
  }
  for (let i = 0; i < 40; i++) {
    const x = 33 + Math.random() * 55;
    const z = 2 + Math.random() * 46;
    box(x, z, 0.18, 0.18, 1.1 + Math.random() * 2, material(0x21140b), '', false);
  }
  for (let i = 0; i < 9; i++) {
    box(9 + i * 2.3, 31 + Math.sin(i) * 0.8, 1.0, 1.0, 3.5 + (i % 3), material(0x24212a), '', false);
  }
}

function buildWorld() {
  state.colliders = [];
  state.labels = [];
  state.npcs = [];
  state.enemies = [];
  state.doors = [];
  state.mapPoints = [];
  state.projectiles = [];
  while (scene.children.length) scene.remove(scene.children[0]);
  scene.add(rig);

  scene.add(new THREE.HemisphereLight(0xffd8a0, 0x24332c, 1.18));
  const sun = new THREE.DirectionalLight(0xffb36e, 1.85);
  sun.position.set(-34, 62, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  scene.add(sun);
  const orangeSun = new THREE.PointLight(0xff7d38, 1.25, 90);
  orangeSun.position.set(-56, 8, -36);
  scene.add(orangeSun);

  buildLandscape();

  road([{ x: -47, z: 8 }, { x: -34, z: 7 }, { x: -24, z: 8 }, { x: -12, z: 7 }, { x: -2, z: 6 }, { x: 10, z: 2 }, { x: 20, z: 8 }, { x: 33, z: 22 }], 4.5);
  road([{ x: -24, z: 8 }, { x: -22, z: 21 }], 3.7);
  road([{ x: -12, z: 7 }, { x: -8, z: -16 }], 3.4);
  road([{ x: 10, z: 2 }, { x: 25, z: -7 }], 3.6);
  road([{ x: 20, z: 8 }, { x: 44, z: 34 }], 3.6);

  building({ name: 'Таможня', sign: 'CUSTOMS / РИНА', x: -32, z: 4, w: 9, d: 6.5, color: 0x6b5534, door: 'south' });
  building({ name: 'Грязный рынок', sign: 'MARKET', x: -18, z: 15, w: 10, d: 6, color: 0x5e4630, door: 'south' });
  building({ name: 'Дорожный навес', sign: 'SHELTER', x: -22, z: 22, w: 8, d: 5, color: 0x584429, door: 'south' });
  building({ name: 'Канцелярия Орана', sign: 'REGISTRY / ОРАН', x: 12, z: -2, w: 8, d: 6, color: 0x76603e, door: 'north' });
  building({ name: 'Дом Герды', sign: 'GERDA', x: 20, z: 8, w: 7.5, d: 6, color: 0x49382b, door: 'north' });
  building({ name: 'Красный Узел', sign: 'RED NODE', x: 25, z: -8, w: 7, d: 5, color: 0x6d3528, door: 'south' });
  building({ name: 'Лагерь проводников', sign: 'GUIDES', x: 33, z: 23, w: 7.5, d: 5.5, color: 0x4d3c55, door: 'south' });

  box(-4, 4, 1.1, 1.1, 6.2, material(0x2f3e38), 'Старый маяк');
  label('СТАРЫЙ МАЯК', -4, 7.2, 4, 0.7);
  label('PORT RACHEL / ОКЕАН', -47, 5.2, -13, 0.8);
  label('FORT ZARYA', 13, 6.8, 31, 0.78);
  label('КРАЙ МЁРТВОЙ САВАННЫ', 51, 4.2, 35, 0.72);

  mapPoint('Океан', -60, -5, 'biome');
  mapPoint('Порт Рейчел', -38, 6, 'town');
  mapPoint('Таможня', -32, 4, 'building');
  mapPoint('Грязный рынок', -18, 15, 'building');
  mapPoint('Дорожный навес', -22, 22, 'building');
  mapPoint('Форт Заря', 13, 31, 'fort');
  mapPoint('Дом Герды', 20, 8, 'building');
  mapPoint('Красный Узел', 25, -8, 'building');
  mapPoint('Край Мёртвой Саванны', 51, 35, 'biome');

  npc('rina', 'Рина', -32, 7.25, 0x8ca3bf, 'Ты в Порту Рейчел. Проверь Дорожный навес, потом иди к Орану в Форт Заря.');
  npc('merchant', 'Торговец красной глиной', -18, 17.9, 0xa45545, 'Рынок живёт красной глиной и слухами. Возьми слухи о Красном Узле.');
  npc('wanderer', 'Бродячий рыцарь', -4, 7.8, 0x858078, 'Дорога в саванну начинается не с выстрела, а с долгого пути.');
  npc('oran', 'Оран Тив', 12, -4.95, 0xd8b56e, 'Регистрация временная. Но теперь ты не пустое место в пустом деле.');
  npc('gerda', 'Герда Гайгерманика', 20, 5.15, 0x795c43, 'Собери четыре подготовки: дорога, рынок, фракции, контрабанда. Потом я подпишу путь к Саве.');
  npc('smuggler', 'Контрабандист', 25, -5.0, 0x9a4939, 'Канальная бирка? Забирай. Только не спрашивай, из какого корабля она снята.');
  npc('guide', 'Сава', 33, 25.85, 0x9b7bd8, 'Когда Герда даст добро, я поведу тебя к краю Мёртвой Саванны.');

  enemy('road', 'Дорожный мутант', -12, 8, 48, 0xb84634, 'road');
  enemy('sand', 'Песчаная падаль', 6, 12, 42, 0x9b6b3a, 'sand');
  enemy('red', 'Красная падаль', 31, -3, 45, 0xb55d35, 'red');
  enemy('phase', 'Фазовое эхо', 38, 18, 55, 0x8a78ff, 'phase');

  buildHands();
}

function buildHands() {
  if (state.hands) camera.remove(state.hands);
  const g = new THREE.Group();
  const skin = material(state.player?.hand || 0xc09673);
  const w = WEAPONS[state.player?.weapon || 'fists'];
  const arm = new THREE.CapsuleGeometry(0.12, 0.55, 6, 10);
  const fist = new THREE.SphereGeometry(0.17, 12, 10);
  const left = new THREE.Group();
  const right = new THREE.Group();
  const la = new THREE.Mesh(arm, skin);
  const ra = new THREE.Mesh(arm, skin);
  const lf = new THREE.Mesh(fist, skin);
  const rf = new THREE.Mesh(fist, skin);
  la.rotation.x = 1.05;
  ra.rotation.x = 1.05;
  lf.position.set(0, -0.02, -0.55);
  rf.position.set(0, -0.02, -0.55);
  left.add(la, lf);
  right.add(ra, rf);
  left.position.set(-0.36, -0.34, -0.72);
  right.position.set(0.36, -0.34, -0.72);
  left.rotation.set(-0.15, 0.2, -0.18);
  right.rotation.set(-0.15, -0.2, 0.18);
  g.add(left, right);
  if (w.kind === 'phase') {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 12), new THREE.MeshStandardMaterial({ color: 0x8a78ff, emissive: 0x5845ff, emissiveIntensity: 1.4, transparent: true, opacity: 0.82 }));
    orb.position.set(0, -0.18, -0.88);
    g.add(orb);
    const l = new THREE.PointLight(0x8a78ff, 1.4, 3);
    l.position.set(0, -0.18, -0.88);
    g.add(l);
  } else if (w.kind === 'sword') {
    const bladeLen = w.name === 'Бастард' ? 1.2 : 0.92;
    const bladeWidth = w.name === 'Бастард' ? 0.08 : 0.045;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(bladeWidth, bladeWidth, bladeLen), material(0xc8c0a8, { roughness: 0.35, metalness: 0.25 }));
    blade.position.set(0.45, -0.25, -1.18);
    blade.rotation.x = 0.13;
    g.add(blade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(w.name === 'Бастард' ? 0.65 : 0.42, 0.08, 0.08), material(0x6b5534));
    guard.position.set(0.42, -0.28, -0.75);
    g.add(guard);
  } else if (w.kind === 'gun') {
    const long = w.name.includes('M1') ? 1.05 : w.name === 'Брен' ? 0.88 : 0.48;
    const body = new THREE.Mesh(new THREE.BoxGeometry(long, 0.16, 0.22), material(0x2e2b24, { roughness: 0.55, metalness: 0.14 }));
    body.position.set(0.44, -0.24, -0.86);
    body.rotation.y = -0.08;
    g.add(body);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.12), material(0x5b3b22));
    grip.position.set(0.28, -0.42, -0.65);
    g.add(grip);
  }
  state.hands = g;
  camera.add(g);
}

function setWeapon(id) {
  state.player.weapon = id;
  buildHands();
  const w = WEAPONS[id];
  ui.weapon.textContent = `Оружие: ${w.name} · урон ${w.damage} · дальность ${w.range}`;
  updateAmmo();
}

function updateAmmo() {
  const p = state.player;
  ui.ammo.textContent = `Боезапас: Кольт ${p.ammo.colt} · M1 ${p.ammo.m1} · Брен ${p.ammo.bren}`;
}

function startGame(fresh = true) {
  if (fresh) {
    const name = $('charName')?.value?.trim() || 'Безымянная ошибка';
    const race = $('race')?.value || 'human';
    const bg = $('bg')?.value || 'lunar';
    state.player = makePlayer({ name, race, bg });
    localStorage.removeItem(SAVE_KEY);
  }
  rig.position.set(state.player.pos.x, 0, state.player.pos.z);
  state.yaw = Math.PI * 0.5;
  state.pitch = 0;
  rig.rotation.y = state.yaw;
  camera.rotation.x = state.pitch;
  ui.start.classList.add('hidden');
  ui.chargen.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  state.mode = 'play';
  setWeapon(state.player.weapon);
  toast('2.5 карта обновлена: океан, Порт Рейчел, Форт Заря, край Мёртвой Саванны.');
  saveGame();
}

function saveGame() {
  if (!state.player) return;
  state.player.pos.x = rig.position.x;
  state.player.pos.z = rig.position.z;
  localStorage.setItem(SAVE_KEY, JSON.stringify({ player: state.player, enemies: state.enemies.map(e => e.userData) }));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return toast('Сейв не найден');
  try {
    const data = JSON.parse(raw);
    state.player = data.player || makePlayer();
    if (data.enemies) data.enemies.forEach((saved, i) => { if (state.enemies[i]) Object.assign(state.enemies[i].userData, saved); });
    startGame(false);
  } catch {
    toast('Сейв повреждён');
  }
}

function toast(text) {
  ui.toast.textContent = text;
  ui.toast.classList.remove('hidden');
  state.toastT = 3;
}

function log(text) {
  state.player.log.unshift(new Date().toLocaleTimeString() + ' — ' + text);
  if (state.player.log.length > 90) state.player.log.pop();
}

function currentTarget() {
  const p = state.player;
  if (!p.done.rina) return { name: 'Рина / Таможня', x: -32, z: 7.25 };
  if (!p.done.road) return { name: 'Дорожный навес', x: -22, z: 22 };
  if (!p.done.oran) return { name: 'Оран / Канцелярия', x: 12, z: -4.95 };
  if (!p.done.gerda) return { name: 'Герда / Дом Герды', x: 20, z: 5.15 };
  if (!p.done.sava) return { name: 'Сава / Проводники', x: 33, z: 25.85 };
  return { name: 'Край Мёртвой Саванны', x: 51, z: 35 };
}

function move(dt) {
  const p = state.player;
  let mx = 0, mz = 0;
  if (state.keys.has('KeyW')) mz -= 1;
  if (state.keys.has('KeyS')) mz += 1;
  if (state.keys.has('KeyA')) mx -= 1;
  if (state.keys.has('KeyD')) mx += 1;
  if (!mx && !mz) return;
  const speed = state.keys.has('ShiftLeft') || state.keys.has('ShiftRight') ? 7.5 : 4.5;
  const v = new THREE.Vector3(mx, 0, mz).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
  const nx = rig.position.x + v.x * speed * dt;
  const nz = rig.position.z + v.z * speed * dt;
  if (!collides(nx, rig.position.z)) rig.position.x = nx;
  if (!collides(rig.position.x, nz)) rig.position.z = nz;
  if (speed > 5) p.st = Math.max(0, p.st - dt * 12);
}

function updateEnemies(dt) {
  for (const obj of state.enemies) {
    const e = obj.userData;
    if (!e.alive) continue;
    const d = distXZ({ x: rig.position.x, z: rig.position.z }, e);
    if (d < 12 && d > 1.4) {
      const dx = (rig.position.x - e.x) / d;
      const dz = (rig.position.z - e.z) / d;
      const nx = e.x + dx * dt * 1.1;
      const nz = e.z + dz * dt * 1.1;
      if (!collides(nx, nz, 0.55)) {
        e.x = nx;
        e.z = nz;
        obj.position.set(e.x, 0, e.z);
      }
    }
    if (d < 1.45 && Math.random() < dt * 0.7) {
      state.player.hp = Math.max(0, state.player.hp - (state.keys.has('KeyR') ? 0.5 : 4));
      if (state.player.hp <= 0) {
        state.player.hp = Math.floor(state.player.hpMax * 0.55);
        rig.position.set(-47, 0, 8);
        toast('Ты очнулся у берега Порта Рейчел.');
      }
    }
  }
}

function updateProjectiles(dt) {
  for (const pr of state.projectiles) {
    pr.mesh.position.addScaledVector(pr.velocity, dt);
    pr.life -= dt;
    for (const obj of state.enemies) {
      const e = obj.userData;
      if (e.alive && obj.position.distanceTo(pr.mesh.position) < 0.85) {
        damageEnemy(obj, pr.damage, pr.name);
        pr.life = 0;
      }
    }
    if (pr.life <= 0) {
      scene.remove(pr.mesh);
      pr.dead = true;
    }
  }
  state.projectiles = state.projectiles.filter(p => !p.dead);
}

function angleToTarget(o) {
  const a = Math.atan2(o.z - rig.position.z, o.x - rig.position.x) - state.yaw;
  return Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
}

function attack() {
  const w = WEAPONS[state.player.weapon];
  if (state.player.st < w.stamina) return toast('Нет выносливости');
  if (state.player.ph < w.phase) return toast('Нет фазового заряда');
  if (w.ammo && state.player.ammo[w.ammo] <= 0) return toast('Нет боезапаса: ' + w.name);
  state.player.st -= w.stamina;
  state.player.ph -= w.phase;
  if (w.ammo) state.player.ammo[w.ammo]--;
  state.attackT = 1;
  if (w.kind === 'gun') return shoot(w);
  const target = state.enemies.filter(o => o.userData.alive).sort((a, b) => angleToTarget(a.userData) - angleToTarget(b.userData))[0];
  if (!target || angleToTarget(target.userData) > 0.56 || distXZ({ x: rig.position.x, z: rig.position.z }, target.userData) > w.range) return toast(w.name + ' не достаёт');
  damageEnemy(target, w.damage + Math.floor(Math.random() * 8), w.name);
}

function shoot(w) {
  const count = w.burst || 1;
  for (let i = 0; i < count; i++) {
    if (i > 0 && w.ammo) {
      if (state.player.ammo[w.ammo] <= 0) break;
      state.player.ammo[w.ammo]--;
    }
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xff8a24, emissiveIntensity: 0.7 }));
    mesh.position.copy(camera.getWorldPosition(new THREE.Vector3()));
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
    dir.x += (Math.random() - 0.5) * 0.018;
    dir.z += (Math.random() - 0.5) * 0.018;
    dir.normalize();
    scene.add(mesh);
    state.projectiles.push({ mesh, velocity: dir.multiplyScalar(30), life: 1.8, damage: w.damage, name: w.name });
  }
  updateAmmo();
  toast(w.name + ': выстрел');
}

function damageEnemy(obj, amount, source) {
  const e = obj.userData;
  e.hp -= amount;
  toast(`${e.name}: -${amount} (${source})`);
  if (e.hp <= 0) {
    e.alive = false;
    obj.scale.y = 0.28;
    obj.position.y = 0.05;
    log('Победа: ' + e.name + '. Можно обыскать.');
  }
}

function lootEnemy(obj) {
  const e = obj.userData;
  if (e.looted) return toast('Уже обыскано');
  const tables = {
    road: [['colt', 1, 5, .55], ['m1', 1, 4, .35], ['credits', 1, 6, .8], ['сломанный жетон дороги', 1, 1, .25]],
    sand: [['colt', 1, 3, .35], ['bren', 3, 10, .28], ['credits', 1, 4, .65]],
    red: [['m1', 2, 8, .55], ['bren', 2, 12, .45], ['канальная бирка', 1, 1, .4]],
    phase: [['colt', 1, 2, .25], ['m1', 1, 6, .3], ['фазовый осадок', 1, 2, .75]],
  };
  const out = [];
  for (const row of tables[e.table] || []) {
    if (Math.random() <= row[3]) {
      const n = row[1] + Math.floor(Math.random() * (row[2] - row[1] + 1));
      if (row[0] === 'credits') state.player.credits += n;
      else if (state.player.ammo[row[0]] !== undefined) state.player.ammo[row[0]] += n;
      else state.player.inv.push(row[0]);
      out.push(row[0] + ' ×' + n);
    }
  }
  if (!out.length) {
    state.player.credits++;
    out.push('credits ×1');
  }
  e.looted = true;
  obj.visible = false;
  toast('Лут: ' + out.join(', '));
  log('Лут с ' + e.name + ': ' + out.join(', '));
  updateAmmo();
  saveGame();
}

function discover() {
  const p = state.player;
  if (!p.done.road && distXZ({ x: rig.position.x, z: rig.position.z }, { x: -22, z: 22 }) < 2.6) {
    p.done.road = true;
    toast('Дорожный навес проверен');
    log('Дорожный навес проверен.');
  }
  if (!p.flags.green && distXZ({ x: rig.position.x, z: rig.position.z }, { x: 1, z: -19 }) < 3.0) {
    p.flags.green = true;
    toast('Зелёный след получен');
  }
  if (!p.flags.blue && distXZ({ x: rig.position.x, z: rig.position.z }, { x: 2, z: 20 }) < 3.0) {
    p.flags.blue = true;
    toast('Синий след получен');
  }
  if (p.flags.green && p.flags.blue && !p.done.factions) {
    p.done.factions = true;
    log('Фракционная подготовка выполнена.');
  }
  if (!p.done.contraband && distXZ({ x: rig.position.x, z: rig.position.z }, { x: 25, z: -5.0 }) < 3.0) {
    p.done.contraband = true;
    toast('Красный Узел найден');
  }
}

function findNear() {
  state.near = null;
  let best = 999;
  const here = { x: rig.position.x, z: rig.position.z };
  for (const n of state.npcs) {
    const d = distXZ(here, n.userData);
    if (d < best && d < 2.25) { best = d; state.near = n; }
  }
  for (const e of state.enemies) {
    const d = distXZ(here, e.userData);
    if (d < best && d < 2.35 && ((!e.userData.alive && !e.userData.looted) || e.userData.alive)) { best = d; state.near = e; }
  }
  if (state.near) {
    const d = state.near.userData;
    ui.prompt.textContent = d.type === 'enemy' && !d.alive ? 'E — обыскать: ' + d.name : (d.type === 'npc' ? 'E — говорить: ' : 'ЛКМ/Space — атака: ') + d.name;
    ui.prompt.classList.remove('hidden');
  } else {
    const door = state.doors.find(d => Math.hypot(d.x - rig.position.x, d.z - rig.position.z) < 1.6);
    if (door) {
      ui.prompt.textContent = 'Вход: ' + door.name;
      ui.prompt.classList.remove('hidden');
    } else ui.prompt.classList.add('hidden');
  }
}

function interact() {
  if (!state.near) return;
  const d = state.near.userData;
  if (d.type === 'enemy') {
    if (d.alive) return attack();
    return lootEnemy(state.near);
  }
  openDialogue(d);
}

function openDialogue(n) {
  state.mode = 'panel';
  ui.panel.classList.remove('hidden');
  let html = `<h2>${n.name}</h2><p>${n.text}</p><div class="choices">`;
  if (n.id === 'rina') html += '<button data-a="rina">Взять направление к Дорожному навесу</button>';
  if (n.id === 'oran') html += '<button data-a="oran">Получить регистрацию</button>';
  if (n.id === 'gerda') html += '<button data-a="tasks">Доска Герды</button><button data-a="reward">Сдать готовое</button>';
  if (n.id === 'merchant') html += '<button data-a="market">Купить слухи о Красном Узле</button>';
  if (n.id === 'smuggler') html += '<button data-a="contraband">Забрать канальную бирку</button>';
  if (n.id === 'guide') html += '<button data-a="sava">Спросить про Мёртвую Саванну</button>';
  html += '<button data-a="close">Закончить</button></div>';
  ui.panelText.innerHTML = html;
  ui.panelText.querySelectorAll('button').forEach(b => b.onclick = () => action(b.dataset.a));
}

function action(a) {
  const p = state.player;
  if (a === 'close') return closePanel();
  if (a === 'rina') { p.done.rina = true; toast('Рина указала на Дорожный навес.'); log('Рина отправила проверить Дорожный навес.'); }
  if (a === 'oran') { p.done.oran = true; p.done.registered = true; p.credits += 10; toast('Оран выдал временную регистрацию.'); log('Оран зарегистрировал пустое дело.'); }
  if (a === 'tasks') return showTasks();
  if (a === 'reward') {
    const c = countDone();
    if (c >= 4 && !p.flags.rewarded) { p.flags.rewarded = true; p.done.gerda = true; p.credits += 50; p.xp += 70; toast('Герда: первый акт собран.'); }
    else toast('Герде нужно 4/4 подготовки. Сейчас ' + c + '/4.');
  }
  if (a === 'market') { p.done.market = true; toast('Рынок: слухи получены.'); log('Торговец рассказал о Красном Узле.'); }
  if (a === 'contraband') { p.done.contraband = true; p.inv.push('канальная бирка'); toast('Канальная бирка получена.'); }
  if (a === 'sava') { if (p.done.gerda) { p.done.sava = true; toast('Сава готовит путь к Мёртвой Саванне.'); } else toast('Сава ждёт подписи Герды.'); }
  saveGame();
}

function countDone() {
  return ['road', 'market', 'factions', 'contraband'].filter(k => state.player.done[k]).length;
}

function showTasks() {
  state.mode = 'panel';
  ui.panel.classList.remove('hidden');
  ui.panelText.innerHTML = '<h2>Доска Герды</h2>' +
    task('Дорога и навес', state.player.done.road) +
    task('Рынок', state.player.done.market) +
    task('Фракции', state.player.done.factions) +
    task('Контрабанда', state.player.done.contraband) +
    '<div class="choices"><button data-a="close">Закрыть</button></div>';
  ui.panelText.querySelectorAll('button').forEach(b => b.onclick = () => action(b.dataset.a));
}

function task(name, done) {
  return `<div class="log"><b class="${done ? 'done' : 'warn'}">${done ? '✓' : '○'} ${name}</b></div>`;
}

function closePanel() {
  ui.panel.classList.add('hidden');
  state.mode = 'play';
}

function openBook() {
  state.mode = 'panel';
  ui.panel.classList.remove('hidden');
  ui.panelText.innerHTML = '<h2>Журнал</h2><p><span class="tag">' + state.player.name + '</span><span class="tag">' + WEAPONS[state.player.weapon].name + '</span><span class="tag">кр. ' + state.player.credits + '</span></p>' + state.player.log.map(x => '<div class="log">' + x + '</div>').join('');
}

function openInv() {
  state.mode = 'panel';
  ui.panel.classList.remove('hidden');
  ui.panelText.innerHTML = '<h2>Инвентарь</h2>' + state.player.inv.map(x => '<div class="log">' + x + '</div>').join('') + '<h3>Боезапас</h3><p>Кольт ' + state.player.ammo.colt + ' · M1 ' + state.player.ammo.m1 + ' · Брен ' + state.player.ammo.bren + '</p>';
}

function openMap() {
  state.mode = 'panel';
  ui.panel.classList.remove('hidden');
  const t = currentTarget();
  ui.panelText.innerHTML = '<h2>Карта Феникса 7: Порт Рейчел</h2><p>Океанский берег → Порт Рейчел → Форт Заря → край Мёртвой Саванны.</p>' +
    '<p><b>Текущая цель:</b> ' + t.name + '</p>' +
    state.mapPoints.map(p => '<div class="log"><b>' + p.name + '</b> — ' + p.type + '</div>').join('') +
    '<div class="choices"><button data-a="close">Закрыть</button></div>';
  ui.panelText.querySelectorAll('button').forEach(b => b.onclick = () => action(b.dataset.a));
}

function debugTravel() {
  const pts = [[-47, 8, 'Берег'], [-32, 7.25, 'Рина'], [-22, 22, 'Навес'], [12, -4.95, 'Оран'], [20, 5.15, 'Герда'], [25, -5.0, 'Красный Узел'], [33, 25.85, 'Сава'], [51, 35, 'Край саванны']];
  const i = state.player.flags.debugIndex || 0;
  const p = pts[i % pts.length];
  rig.position.set(p[0], 0, p[1]);
  state.player.flags.debugIndex = i + 1;
  toast('Перенос: ' + p[2]);
}

function updateHUD(dt) {
  const p = state.player;
  if (state.toastT > 0) {
    state.toastT -= dt;
    if (state.toastT <= 0) ui.toast.classList.add('hidden');
  }
  ui.hp.style.width = (100 * p.hp / p.hpMax) + '%';
  ui.st.style.width = (100 * p.st / p.stMax) + '%';
  ui.ph.style.width = (100 * p.ph / p.phMax) + '%';
  ui.hpTxt.textContent = Math.round(p.hp);
  ui.stTxt.textContent = Math.round(p.st);
  ui.phTxt.textContent = Math.round(p.ph);
  ui.questTitle.textContent = 'Phoenix7 2.5 world';
  ui.questBody.textContent = 'Океанский Порт Рейчел → Форт Заря → край Мёртвой Саванны. Нажми M для карты.';
  ui.questProgress.textContent = 'Подготовки: ' + countDone() + '/4 · ' + WEAPONS[p.weapon].name;
  const t = currentTarget();
  ui.nav.textContent = 'Цель: ' + t.name + ' · ' + Math.hypot(t.x - rig.position.x, t.z - rig.position.z).toFixed(1) + ' м';
  ui.debug.textContent = 'x ' + rig.position.x.toFixed(1) + ' z ' + rig.position.z.toFixed(1) + ' weapon ' + p.weapon;
}

function update(dt) {
  if (state.mode !== 'play') return;
  state.player.st = Math.min(state.player.stMax, state.player.st + dt * 8);
  state.player.ph = Math.min(state.player.phMax, state.player.ph + dt * 8);
  move(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  discover();
  findNear();
  updateHUD(dt);
  state.attackT = Math.max(0, state.attackT - dt * 5);
  if (state.hands) state.hands.rotation.x = -state.attackT * 0.22 + (state.keys.has('KeyR') ? 0.14 : 0);
}

function render() {
  renderer.render(scene, camera);
  for (const s of state.labels) s.quaternion.copy(camera.quaternion);
}

function loop(now) {
  const dt = Math.min(0.05, (now - state.last) / 1000 || 0.016);
  state.last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();
buildWorld();
requestAnimationFrame(loop);

window.addEventListener('keydown', (e) => {
  state.keys.add(e.code);
  const weaponKeys = { Digit1: 'fists', Digit2: 'phase', Digit3: 'bastard', Digit4: 'rapier', Digit5: 'colt', Digit6: 'm1', Digit7: 'bren' };
  if (weaponKeys[e.code] && state.player) setWeapon(weaponKeys[e.code]);
  if (e.code === 'KeyE' && state.mode === 'play') interact();
  if (e.code === 'Space' && state.mode === 'play') attack();
  if (e.code === 'KeyJ' && state.mode === 'play') openBook();
  if (e.code === 'KeyI' && state.mode === 'play') openInv();
  if (e.code === 'KeyM' && state.mode === 'play') openMap();
  if (e.code === 'KeyQ' && state.mode === 'play') showTasks();
  if (e.code === 'F1' && state.mode === 'play') { e.preventDefault(); debugTravel(); }
  if (e.code === 'Escape') {
    if (state.mode === 'panel') closePanel();
    else if (document.pointerLockElement) document.exitPointerLock();
  }
});

window.addEventListener('keyup', (e) => state.keys.delete(e.code));
window.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement || state.mode !== 'play') return;
  state.yaw -= e.movementX * 0.0022;
  state.pitch = clamp(state.pitch - e.movementY * 0.002, -1.15, 1.15);
  rig.rotation.y = state.yaw;
  camera.rotation.x = state.pitch;
});
renderer.domElement.addEventListener('click', () => {
  if (state.mode !== 'play') return;
  if (document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock?.();
  else attack();
});

$('newBtn').onclick = () => ui.chargen.classList.remove('hidden');
$('quickBtn').onclick = () => { state.player = makePlayer({}); startGame(false); };
$('loadBtn').onclick = loadGame;
$('beginBtn').onclick = () => startGame(true);
$('backBtn').onclick = () => ui.chargen.classList.add('hidden');
$('closePanel').onclick = closePanel;

window.__PHX_RUNTIME_READY = true;
console.log('Phoenix7 2.5 coastal world runtime ready. Launch: /game.html');
