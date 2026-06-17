import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

const BUILD = 'Phoenix7 2.0B Production Core / Port Rachel Road';
const SAVE = 'phoenix7_v2_save';
const $ = (id) => document.getElementById(id);
const ui = {
  start: $('startScreen'), char: $('charScreen'), hud: $('hud'), qT: $('questTitle'), qX: $('questText'), qD: $('questDistance'),
  prompt: $('prompt'), toast: $('toast'), book: $('bookWindow'), bookC: $('bookContent'), map: $('mapWindow'), mapC: $('mapCanvas'),
  dlg: $('dialogueWindow'), dlgN: $('dialogueName'), dlgT: $('dialogueText'), dlgC: $('dialogueChoices')
};
const canvas = $('gameCanvas');

const RACES = {
  human: { title: 'Человек Империи', hp: 112, st: 105 },
  red: { title: 'Красный элементал', hp: 126, st: 95 },
  blue: { title: 'Синий элементал', hp: 104, st: 112 },
  phase: { title: 'Задетый фазой', hp: 96, st: 120 }
};

const WORLD = {
  start: { x: -232, z: 42, yaw: Math.PI / 2 },
  questStart: { x: -232, z: 42 },
  locations: [
    { id: 'port', name: 'Порт Рейчел', x: -232, z: 42, type: 'settlement', note: 'мокрый причал, пустые документы и запах старого топлива' },
    { id: 'customs', name: 'Таможня Порта Рейчел', x: -214, z: 28, type: 'building', note: 'стол, печати и чужая ошибка в реестре' },
    { id: 'blue-road', name: 'Дорога Синего Шельфа', x: -133, z: 30, type: 'road', note: 'главная дорога к Форту Заря' },
    { id: 'road-shelter', name: 'Дорожный навес', x: -185, z: -18, type: 'camp', note: 'мокрые ящики, верёвки и место для каравана' },
    { id: 'old-beacon', name: 'Старый маяк', x: -62, z: 18, type: 'relic', note: 'маяк прошлого цикла с зелёным слабым светом' },
    { id: 'fork', name: 'Развилка монастырей', x: -18, z: 0, type: 'road', note: 'северный путь к Форту, боковые тропы к орденам' },
    { id: 'green-shrine', name: 'Придорожный знак Системных Ошибок', x: -47, z: -48, type: 'faction', note: 'зелёный знак, потрескавшийся терминал и системный шёпот' },
    { id: 'blue-shrine', name: 'Камертон Синего Ордена', x: -5, z: 55, type: 'faction', note: 'синий резонатор гудит на ветру' },
    { id: 'fort-gate', name: 'Ворота Форта Заря', x: 38, z: 9, type: 'settlement', note: 'южные ворота имперского поста' },
    { id: 'fort-office', name: 'Канцелярия Форта Заря', x: 76, z: -5, type: 'building', note: 'Оран Тив превращает людей в записи' },
    { id: 'gerda-house', name: 'Дом Герды', x: 100, z: -23, type: 'building', note: 'временный узел будущего акта 2.0C' },
    { id: 'market', name: 'Грязный рынок Форта Заря', x: 87, z: 24, type: 'market', note: 'лавки, слухи и мокрая красная глина' }
  ],
  roads: [
    { a: [-232, 42], b: [-185, 37], w: 11 }, { a: [-185, 37], b: [-133, 30], w: 10 }, { a: [-133, 30], b: [-62, 18], w: 10 },
    { a: [-62, 18], b: [-18, 0], w: 9 }, { a: [-18, 0], b: [38, 9], w: 10 }, { a: [38, 9], b: [76, -5], w: 9 },
    { a: [-18, 0], b: [-47, -48], w: 6 }, { a: [-62, 18], b: [-5, 55], w: 6 }, { a: [38, 9], b: [87, 24], w: 7 }
  ],
  npcs: [
    { id: 'dock', name: 'Портовый рабочий Лейб', x: -240, z: 51, color: 0xb48a52, role: 'worker', text: 'Транспорт ушёл. Если твоего имени нет в бумагах — иди в Форт Заря. Там любят пустые дела.', choices: [['Где Форт Заря?', 'По дороге на северо-восток. Держись фонарей и старого маяка.']] },
    { id: 'clerk', name: 'Таможенный клерк Рина', x: -215, z: 28, color: 0x8ca3bf, role: 'clerk', text: 'В карточке есть номер, но нет причины прибытия. Кто-то оставил тебя между полями формы.', choices: [['Что делать?', 'Оран Тив в Форту Заря ставит печати на такие ошибки. Потом тебя заметит Герда.']] },
    { id: 'guard-road', name: 'Солдат у дороги', x: -99, z: 26, color: 0x71826f, role: 'guard', text: 'Дорога открыта. У маяка иногда слышат синий звон. Не стой рядом ночью.', choices: [['Кто тут ходит?', 'Караванщики, рыцари, имперские бегуны и то, что лучше не называть до ужина.']] },
    { id: 'wanderer', name: 'Бродячий рыцарь Марк-Без-Щита', x: -52, z: 12, color: 0x7c7872, role: 'knight', text: 'Я не из зелёных и не из синих. Мне хватает дороги. Если услышишь песню из камня — не отвечай.', choices: [['Ты поможешь?', 'Пока только советом. В 2.0C у меня появится дорожная сцена.']] },
    { id: 'green-initiate', name: 'Послушник системной ошибки', x: -48, z: -46, color: 0x5c8f61, role: 'green', text: 'Система не сломана. Она пытается проснуться.', choices: [['Что за система?', 'Та, которая помнит все неправильные старты. Здесь мы больше не начинаем с Гравийного рубежа.']] },
    { id: 'blue-initiate', name: 'Слушатель Синего Ордена', x: -6, z: 54, color: 0x557fb8, role: 'blue', text: 'Если город кажется пустым, слушай камертон. Иногда карта сначала звучит, а потом появляется.', choices: [['Что звучит?', 'Дороги. Вода. Бумага. Будущая тема главного меню.']] },
    { id: 'oran', name: 'Писарь Оран Тив', x: 76, z: -5, color: 0xd8b56e, role: 'scribe', text: 'Фамилия отсутствует, причина этапирования отсутствует, подпись есть. Прекрасно. Пустое дело.', choices: [['Получить регистрацию', 'Печать поставлена. Теперь ты существуешь достаточно, чтобы тебя отправили к Герде.', 'register']] },
    { id: 'gerda', name: 'Герда Гайгерманика', x: 100, z: -23, color: 0x795c43, role: 'gerda', text: 'Пустые дела редко бывают пустыми. В 2.0C здесь начнётся мой настоящий актовый узел.', choices: [['Я понял', 'Хорошо. Для начала выживи на дороге и научись пользоваться Книгой дорог.']] },
    { id: 'merchant', name: 'Торговец красной глиной', x: 87, z: 24, color: 0xa45545, role: 'merchant', text: 'Красная глина, верёвка, лампы, слухи. Денег у тебя мало, но слухи иногда дешевле.', choices: [['Что слышно?', 'В Dead Savannah пока рано. Сначала Форт, Герда и нормальная дорога.']] }
  ],
  encounters: [
    { id: 'caravan', name: 'Малый караван', path: [[-245, 47], [-190, 36], [-134, 30], [-62, 18], [34, 10]], color: 0xc49a58 },
    { id: 'patrol-blue', name: 'Синяя дорожная пара', path: [[-5, 55], [-62, 18], [-132, 30], [-188, 37]], color: 0x557fb8 },
    { id: 'patrol-green', name: 'Зелёный послушник', path: [[-47, -48], [-18, 0], [-62, 18], [-133, 30]], color: 0x5c8f61 }
  ]
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14120d);
scene.fog = new THREE.FogExp2(0x211b13, 0.0065);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 700);
const yawPivot = new THREE.Object3D();
const pitchPivot = new THREE.Object3D();
yawPivot.add(pitchPivot); pitchPivot.add(camera); camera.position.set(0, 1.72, 0); scene.add(yawPivot);

const state = {
  mode: 'menu', player: null, keys: new Set(), yaw: WORLD.start.yaw, pitch: 0, nearest: null, blockers: [],
  labels: [], npcObjects: [], moving: [], particles: [], last: 0, lastAmbient: 0, wind: 0
};
const sfx = makeAudio();

setupLights();
buildWorld();
bindUI();
startMenu();
requestAnimationFrame(loop);

function setupLights() {
  scene.add(new THREE.HemisphereLight(0xe6cf9f, 0x2b2d2d, 1.2));
  const sun = new THREE.DirectionalLight(0xffc77a, 1.8);
  sun.position.set(-45, 70, 30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);
  const blue = new THREE.DirectionalLight(0x8aa2c8, 0.55); blue.position.set(60, 24, -60); scene.add(blue);
}
function material(color, opts = {}) { return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.92, metalness: opts.metalness ?? 0.02, transparent: !!opts.opacity, opacity: opts.opacity ?? 1, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0 }); }
function mesh(geo, mat, x, y, z, parent = scene) { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
function buildWorld() {
  const ground = mesh(new THREE.PlaneGeometry(580, 410, 36, 28), material(0x3f382a), 0, 0, 0); ground.rotation.x = -Math.PI / 2;
  const water = mesh(new THREE.PlaneGeometry(290, 190, 4, 4), material(0x1f3440, { roughness: .56, metalness: .12, opacity: .78 }), -292, .035, 88); water.rotation.x = -Math.PI / 2;
  WORLD.roads.forEach(r => road(r.a[0], r.a[1], r.b[0], r.b[1], r.w));
  buildPort(); buildFort(); buildShrines(); scatterProps();
  WORLD.locations.forEach(p => marker(p.x, p.z, p.name, p.type === 'settlement' || p.type === 'building' ? 0xd8b56e : 0x88a6c9));
  WORLD.npcs.forEach(addNpc); WORLD.encounters.forEach(addMovingEncounter);
}
function road(ax, az, bx, bz, w) { const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz); const o = mesh(new THREE.BoxGeometry(len, .08, w), material(0x695a42), (ax + bx) / 2, .045, (az + bz) / 2); o.rotation.y = Math.atan2(dz, dx); for (let i = 0; i < len / 16; i++) { const t = i / (len / 16), x = ax + dx * t + (Math.random() - .5) * w, z = az + dz * t + (Math.random() - .5) * w; rock(x, z, .35 + Math.random() * .7); } }
function buildPort() { pier(-244, 58, 42, 10); house(-214, 28, 13, 10, 8, 0x57452e, 'Таможня'); house(-198, 8, 11, 8, 8, 0x4b3d2c, 'Склад'); house(-226, 10, 7, 10, 7, 0x5c4731, 'Ночлежка'); tower(-258, 28, 5, 15, 0x3a3024, 'Портовый фонарь'); for (let i = 0; i < 24; i++) crate(-242 + Math.random() * 54, 16 + Math.random() * 48); }
function buildFort() { wall(26, 21, 82, 4); wall(31, -35, 86, 4); wall(-15, -7, 4, 58); wall(121, -7, 4, 62); house(40, 8, 18, 12, 11, 0x5a4a35, 'Ворота'); house(76, -5, 17, 11, 10, 0x6a5538, 'Канцелярия'); house(100, -23, 13, 10, 8, 0x49382b, 'Дом Герды'); house(86, 25, 18, 12, 8, 0x5e4630, 'Грязный рынок'); tower(-15, 21, 5, 14, 0x3b3025, 'Южная башня'); tower(121, -35, 5, 14, 0x3b3025, 'Северная башня'); }
function buildShrines() { beacon(-62, 18); shrine(-47, -48, 0x5c8f61, 'Знак Системных Ошибок'); shrine(-5, 55, 0x557fb8, 'Камертон Синего Ордена'); }
function pier(x, z, l, w) { mesh(new THREE.BoxGeometry(l, .5, w), material(0x4a3323), x, .25, z); for (let i = -3; i <= 3; i++) mesh(new THREE.CylinderGeometry(.32, .42, 2.8, 8), material(0x2e2118), x + i * 6.4, 1.2, z + w * .55); label('Причал Порта Рейчел', x, 3.2, z + 1); }
function house(x, z, w, d, h, c, name) { mesh(new THREE.BoxGeometry(w, h, d), material(c), x, h / 2, z); const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * .75, h * .36, 4), material(0x2b2219), x, h + h * .18, z); roof.rotation.y = Math.PI / 4; state.blockers.push({ x, z, w: w + 2, d: d + 2 }); label(name, x, h + 2.15, z); }
function wall(x, z, w, d) { mesh(new THREE.BoxGeometry(w, 7, d), material(0x3a3024), x, 3.5, z); state.blockers.push({ x, z, w: w + 1, d: d + 1 }); }
function tower(x, z, r, h, c, name) { mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 8), material(c), x, h / 2, z); label(name, x, h + 2.2, z); state.blockers.push({ x, z, w: r * 2 + 1, d: r * 2 + 1 }); }
function beacon(x, z) { mesh(new THREE.CylinderGeometry(.55, .9, 9, 8), material(0x2f3e38), x, 4.5, z); mesh(new THREE.IcosahedronGeometry(2.2, 0), material(0x76b38d, { emissive: 0x122318, emissiveIntensity: 1.1, roughness: .35 }), x, 10, z); label('Старый маяк', x, 13, z); }
function shrine(x, z, color, name) { mesh(new THREE.CylinderGeometry(1.6, 2.2, 1, 8), material(0x2b2a22), x, .5, z); mesh(new THREE.OctahedronGeometry(2.2, 0), material(color, { emissive: color, emissiveIntensity: .35, roughness: .5 }), x, 3.2, z); const l = new THREE.PointLight(color, 1.3, 26); l.position.set(x, 4, z); scene.add(l); label(name, x, 6.2, z); }
function marker(x, z, name, color) { const r = new THREE.Mesh(new THREE.TorusGeometry(2.3, .08, 8, 36), new THREE.MeshBasicMaterial({ color })); r.position.set(x, .13, z); r.rotation.x = Math.PI / 2; scene.add(r); label(name, x, 2.25, z); }
function rock(x, z, s) { const o = mesh(new THREE.DodecahedronGeometry(s, 0), material(0x38352f), x, s * .42, z); o.rotation.set(Math.random(), Math.random(), Math.random()); }
function crate(x, z) { const o = mesh(new THREE.BoxGeometry(2.1, 1.6, 2.1), material(0x5d432c), x, .8, z); o.rotation.y = Math.random() * Math.PI; }
function lamp(x, z) { mesh(new THREE.CylinderGeometry(.12, .16, 3.1, 6), material(0x211914), x, 1.55, z); mesh(new THREE.SphereGeometry(.42, 8, 8), material(0xffc45f, { emissive: 0xff8a24, emissiveIntensity: 1.15 }), x, 3.2, z); const l = new THREE.PointLight(0xffb45f, 1.25, 18); l.position.set(x, 3.2, z); scene.add(l); }
function scatterProps() { for (let i = 0; i < 92; i++) rock(-260 + Math.random() * 430, -95 + Math.random() * 180, .45 + Math.random() * 1.8); for (let i = 0; i < 20; i++) lamp(-230 + i * 17, 36 + Math.sin(i * .7) * 8); for (let i = 0; i < 38; i++) crate(-235 + Math.random() * 370, -45 + Math.random() * 110); }
function addNpc(n) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(.72, .92, 2.35, 10), material(n.color)); body.position.y = 1.18; const head = new THREE.Mesh(new THREE.SphereGeometry(.54, 12, 10), material(0xc9a982)); head.position.y = 2.62; const coat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.9, .38), material(n.color === 0x557fb8 ? 0x233a62 : n.color === 0x5c8f61 ? 0x244322 : 0x2d2925)); coat.position.set(0, 1.3, -.45); const q = new THREE.Mesh(new THREE.OctahedronGeometry(.34, 0), material(0xffdd7a, { emissive: 0x332000, emissiveIntensity: .85 })); q.position.y = 3.65; g.add(body, head, coat, q); g.position.set(n.x, 0, n.z); g.userData.npc = n; scene.add(g); label(n.name, n.x, 4.25, n.z); state.npcObjects.push(g); }
function addMovingEncounter(e) { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.4), material(e.color)); m.position.set(i * 3.2, .9, 0); g.add(m); } scene.add(g); state.moving.push({ def: e, group: g, t: Math.random(), dir: 1 }); label(e.name, e.path[0][0], 3.6, e.path[0][1]); }
function label(text, x, y, z) { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d'); g.fillStyle = 'rgba(10,8,5,.72)'; g.fillRect(0, 0, 512, 96); g.strokeStyle = 'rgba(216,181,110,.55)'; g.strokeRect(3, 3, 506, 90); g.fillStyle = '#f0dfbd'; g.font = '700 28px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 48); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false })); sp.position.set(x, y, z); sp.scale.set(10, 1.85, 1); sp.renderOrder = 10; scene.add(sp); state.labels.push(sp); return sp; }
function makePlayer(opts = {}) { const r = RACES[opts.race || 'human'] || RACES.human; return { name: opts.name || 'Безымянный ссыльный', race: opts.race || 'human', bg: opts.bg || 'lunar-prisoner', pos: { ...WORLD.start, pitch: 0 }, stats: { hp: r.hp, st: r.st, level: 1, xp: 0, credits: 12 }, flags: { registered: false, metGerda: false }, quest: { id: 'port-empty-case', step: 'road', done: false }, book: { events: [entry('world', 'Ты проснулся на мокром причале Порта Рейчел. В бумагах — пустое место.'), entry('quest', 'Квест начат: Порт Рейчел: пустое дело.')], places: ['port'], factions: { empire: 'Империя Земли держит Феникс 7 через форты, печати и долги.', green: 'Зелёные рыцари служат Богине Системных Ошибок.', blue: 'Синие рыцари служат Богине Звука.' } } }; }
function entry(type, text) { return { t: Date.now(), type, text }; }
function startGame(p = makePlayer()) { state.player = p; state.yaw = p.pos.yaw ?? WORLD.start.yaw; state.pitch = p.pos.pitch ?? 0; yawPivot.position.set(p.pos.x, 0, p.pos.z); yawPivot.rotation.y = state.yaw; pitchPivot.rotation.x = state.pitch; ui.start.classList.add('hidden'); ui.char.classList.add('hidden'); ui.hud.classList.remove('hidden'); state.mode = 'play'; sfx.drone(); log('system', `Билд запущен: ${BUILD}`); toast('Ты проснулся в Порту Рейчел. Дорога к Форту Заря отмечена фонарями.'); updateQuest(); save(); }
function startMenu() { ui.start.classList.remove('hidden'); ui.char.classList.add('hidden'); ui.hud.classList.add('hidden'); sfx.stop(); }
function currentQuest() { if (!state.player) return null; if (state.player.quest.done) return { title: 'Регистрация получена', text: 'Ты получил регистрацию. Следующая цель — поговорить с Гердой.', target: npc('gerda') }; if (state.player.quest.step === 'oran') return { title: 'Порт Рейчел: пустое дело', text: 'Найди писаря Орана Тива в канцелярии Форта Заря.', target: npc('oran') }; return { title: 'Порт Рейчел: пустое дело', text: 'Иди по дороге Синего Шельфа к Форту Заря.', target: loc('fort-gate') }; }
function npc(id) { return WORLD.npcs.find(n => n.id === id); }
function loc(id) { return WORLD.locations.find(n => n.id === id); }
function updateQuest() { const q = currentQuest(); if (!q) return; ui.qT.textContent = q.title; ui.qX.textContent = q.text; ui.qD.textContent = q.target ? `Цель: ${q.target.name} · ${Math.round(distanceTo(q.target.x, q.target.z))} м` : ''; }
function distanceTo(x, z) { return Math.hypot(yawPivot.position.x - x, yawPivot.position.z - z); }
function loop(t) { const dt = Math.min(.05, (t - state.last) / 1000 || .016); state.last = t; state.wind += dt; if (state.mode === 'play') tick(dt); animateWorld(dt); renderer.render(scene, camera); requestAnimationFrame(loop); }
function tick(dt) { movePlayer(dt); discoverLocations(); questProgress(); promptNpc(); updateQuest(); ambientLog(); }
function movePlayer(dt) { const move = new THREE.Vector3(); if (state.keys.has('KeyW')) move.z--; if (state.keys.has('KeyS')) move.z++; if (state.keys.has('KeyA')) move.x--; if (state.keys.has('KeyD')) move.x++; if (!move.lengthSq()) return; move.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw); const old = yawPivot.position.clone(); const speed = state.keys.has('ShiftLeft') || state.keys.has('ShiftRight') ? 13 : 7; yawPivot.position.x += move.x * speed * dt; yawPivot.position.z += move.z * speed * dt; if (isBlocked(yawPivot.position.x, yawPivot.position.z)) yawPivot.position.copy(old); }
function isBlocked(x, z) { return state.blockers.some(b => Math.abs(x - b.x) < b.w / 2 + .7 && Math.abs(z - b.z) < b.d / 2 + .7); }
function discoverLocations() { for (const p of WORLD.locations) { if (state.player.book.places.includes(p.id)) continue; if (distanceTo(p.x, p.z) < 16) { state.player.book.places.push(p.id); log('place', `Открыто место: ${p.name}. ${p.note}`); sfx.quest(); toast(`Открыто место: ${p.name}`); } } }
function questProgress() { if (!state.player || state.player.quest.done) return; if (state.player.quest.step === 'road' && distanceTo(loc('fort-gate').x, loc('fort-gate').z) < 20) { state.player.quest.step = 'oran'; log('quest', 'Ты дошёл до ворот Форта Заря. Теперь найди писаря Орана Тива.'); sfx.quest(); toast('Форт Заря найден. Найди канцелярию.'); } }
function promptNpc() { state.nearest = null; let best = 99; for (const o of state.npcObjects) { const n = o.userData.npc; const d = distanceTo(n.x, n.z); if (d < best && d < 4.4) { best = d; state.nearest = n; } o.lookAt(camera.position.clone().add(yawPivot.position)); } if (state.nearest) { ui.prompt.textContent = `E — говорить: ${state.nearest.name}`; ui.prompt.classList.remove('hidden'); } else ui.prompt.classList.add('hidden'); }
function animateWorld(dt) { for (const m of state.moving) { m.t += dt * .035 * m.dir; if (m.t > 1) { m.t = 1; m.dir = -1; } if (m.t < 0) { m.t = 0; m.dir = 1; } const p = samplePath(m.def.path, m.t); m.group.position.set(p.x, .05, p.z); m.group.rotation.y = p.rot; } scene.fog.density = 0.006 + Math.sin(state.wind * .18) * .0015; }
function samplePath(path, t) { const seg = Math.min(path.length - 2, Math.floor(t * (path.length - 1))); const lt = t * (path.length - 1) - seg; const a = path[seg], b = path[seg + 1]; const x = a[0] + (b[0] - a[0]) * lt, z = a[1] + (b[1] - a[1]) * lt; return { x, z, rot: Math.atan2(b[0] - a[0], b[1] - a[1]) }; }
function ambientLog() { if (performance.now() - state.lastAmbient < 22000) return; state.lastAmbient = performance.now(); const options = ['Ветер с моря принёс запах мокрого дерева.', 'Где-то на дороге скрипит малый караван.', 'Старый маяк на секунду стал ярче.', 'Камертон Синего Ордена едва слышно дрогнул.']; log('world', options[Math.floor(Math.random() * options.length)]); }
function openDialogue(n) { state.mode = 'dialogue'; ui.dlgN.textContent = n.name; ui.dlgT.innerHTML = `<p>${n.text}</p>`; ui.dlgC.innerHTML = ''; for (const choice of n.choices) { const b = document.createElement('button'); b.textContent = choice[0]; b.onclick = () => { sfx.ui(); ui.dlgT.innerHTML += `<p><b>${state.player.name}:</b> ${choice[0]}</p><p><b>${n.name}:</b> ${choice[1]}</p>`; if (choice[2] === 'register') registerPlayer(); b.disabled = true; }; ui.dlgC.appendChild(b); } const end = document.createElement('button'); end.textContent = 'Закончить разговор'; end.onclick = () => closeWindow(ui.dlg); ui.dlgC.appendChild(end); ui.dlg.classList.remove('hidden'); log('npc', `Разговор: ${n.name}.`); }
function registerPlayer() { if (state.player.flags.registered) return; state.player.flags.registered = true; state.player.quest.done = true; state.player.stats.credits += 12; state.player.stats.xp += 20; log('quest', 'Квест завершён: Порт Рейчел: пустое дело. Получена временная регистрация ссыльного.'); sfx.done(); toast('Регистрация получена. Герда теперь следующая цель.'); save(); }
function log(type, text) { if (!state.player) return; state.player.book.events.unshift(entry(type, text)); if (state.player.book.events.length > 160) state.player.book.events.pop(); }
function openBook(tab = 'events') { if (!state.player) return; sfx.book(); state.mode = 'window'; ui.book.classList.remove('hidden'); renderBook(tab); }
function renderBook(tab) { document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab)); const p = state.player; if (tab === 'events') ui.bookC.innerHTML = p.book.events.map(e => `<div class="logEntry"><small>${new Date(e.t).toLocaleTimeString()} · ${e.type}</small><br>${e.text}</div>`).join(''); if (tab === 'quests') { const q = currentQuest(); ui.bookC.innerHTML = `<h3>Порт Рейчел: пустое дело</h3><p>${q.text}</p><p>${p.quest.done ? 'Статус: завершён.' : 'Статус: активно.'}</p><h3>Следующее производство</h3><p>2.0C: Герда, дорожная сцена, первые GLB-префабы.</p>`; } if (tab === 'places') ui.bookC.innerHTML = p.book.places.map(id => { const place = loc(id); return `<div class="logEntry"><span class="poiName">${place?.name || id}</span><br>${place?.note || ''}</div>`; }).join(''); if (tab === 'factions') ui.bookC.innerHTML = Object.entries(p.book.factions).map(([k, v]) => `<div class="logEntry"><span class="poiName">${k}</span><br>${v}</div>`).join(''); }
function openMap() { if (!state.player) return; sfx.page(); state.mode = 'window'; ui.map.classList.remove('hidden'); drawMap(); }
function drawMap() { const ctx = ui.mapC.getContext('2d'); ctx.clearRect(0, 0, 620, 420); ctx.fillStyle = '#15130f'; ctx.fillRect(0, 0, 620, 420); ctx.strokeStyle = 'rgba(216,181,110,.20)'; for (let x = 0; x < 620; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 420); ctx.stroke(); } for (let y = 0; y < 420; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(620, y); ctx.stroke(); } const tm = (x, z) => [310 + x * 1.22, 210 + z * 1.22]; ctx.strokeStyle = '#786342'; ctx.lineWidth = 9; ctx.lineCap = 'round'; for (const r of WORLD.roads) { const a = tm(r.a[0], r.a[1]), b = tm(r.b[0], r.b[1]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } for (const p of WORLD.locations) { const [mx, my] = tm(p.x, p.z); ctx.fillStyle = state.player.book.places.includes(p.id) ? '#d8b56e' : '#59616a'; ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e9dcc4'; ctx.font = '12px system-ui'; ctx.fillText(p.name, mx + 9, my + 4); } const [px, py] = tm(yawPivot.position.x, yawPivot.position.z); ctx.fillStyle = '#92d3ff'; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillText('Ты', px + 10, py - 8); }
function closeWindow(w) { w.classList.add('hidden'); if (ui.book.classList.contains('hidden') && ui.map.classList.contains('hidden') && ui.dlg.classList.contains('hidden')) state.mode = 'play'; }
function toast(text) { ui.toast.textContent = text; ui.toast.classList.remove('hidden'); clearTimeout(ui.toast._t); ui.toast._t = setTimeout(() => ui.toast.classList.add('hidden'), 3600); }
function save() { if (!state.player) return; state.player.pos.x = yawPivot.position.x; state.player.pos.z = yawPivot.position.z; state.player.pos.yaw = state.yaw; state.player.pos.pitch = state.pitch; localStorage.setItem(SAVE, JSON.stringify({ build: BUILD, player: state.player, savedAt: Date.now() })); }
function load() { try { const data = JSON.parse(localStorage.getItem(SAVE) || '{}'); if (!data.player) { toast('Сейв 2.0 не найден.'); return; } startGame(data.player); } catch { toast('Сейв повреждён.'); } }
function makeAudio() { let ctx, master, dr; const ensure = () => { if (ctx) return ctx; const A = window.AudioContext || window.webkitAudioContext; ctx = new A(); master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination); return ctx; }; const tone = (f, d = .1, type = 'sine', v = .1, wait = 0) => { const c = ensure(), o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, c.currentTime + wait); g.gain.linearRampToValueAtTime(v, c.currentTime + wait + .01); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + wait + d); o.connect(g); g.connect(master); o.start(c.currentTime + wait); o.stop(c.currentTime + wait + d + .03); }; return { unlock() { const c = ensure(); if (c.state === 'suspended') c.resume(); }, ui() { tone(420, .07, 'triangle', .12); tone(210, .09, 'sine', .05, .015); }, start() { tone(90, .55, 'sawtooth', .06); tone(180, .8, 'sine', .09, .06); }, book() { tone(160, .16, 'triangle', .11); }, page() { tone(510, .06, 'triangle', .05); }, quest() { tone(520, .12, 'triangle', .12); tone(260, .14, 'sine', .08, .1); }, done() { tone(220, .2, 'sine', .09); tone(330, .26, 'triangle', .09, .12); tone(440, .36, 'triangle', .08, .28); }, drone() { const c = ensure(); if (dr) return; const g = c.createGain(); g.gain.value = .023; g.connect(master); const o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(); o1.frequency.value = 55; o2.frequency.value = 82.5; o3.frequency.value = 110; o1.type = 'sine'; o2.type = 'triangle'; o3.type = 'sine'; o1.connect(g); o2.connect(g); o3.connect(g); o1.start(); o2.start(); o3.start(); dr = { o1, o2, o3, g }; }, stop() { if (!dr) return; dr.o1.stop(); dr.o2.stop(); dr.o3.stop(); dr.g.disconnect(); dr = null; } }; }
function bindUI() { $('newGameBtn').onclick = () => { sfx.ui(); ui.char.classList.remove('hidden'); }; $('quickStartBtn').onclick = () => { sfx.unlock(); sfx.start(); localStorage.removeItem(SAVE); startGame(makePlayer()); }; $('continueBtn').onclick = () => { sfx.ui(); load(); }; $('closeCharBtn').onclick = () => { sfx.ui(); ui.char.classList.add('hidden'); }; $('startCreatedBtn').onclick = () => { sfx.unlock(); sfx.start(); localStorage.removeItem(SAVE); startGame(makePlayer({ name: $('charName').value.trim() || 'Безымянный ссыльный', race: $('raceSelect').value, bg: $('backgroundSelect').value })); }; canvas.onclick = () => { sfx.unlock(); if (state.mode === 'play') canvas.requestPointerLock?.(); }; document.onmousemove = e => { if (document.pointerLockElement !== canvas || state.mode !== 'play') return; state.yaw -= e.movementX * .0022; state.pitch = Math.max(-1.25, Math.min(1.25, state.pitch - e.movementY * .002)); yawPivot.rotation.y = state.yaw; pitchPivot.rotation.x = state.pitch; }; document.onkeydown = e => { state.keys.add(e.code); if (e.code === 'KeyE' && state.mode === 'play' && state.nearest) { sfx.ui(); openDialogue(state.nearest); } if (e.code === 'KeyJ') { e.preventDefault(); ui.book.classList.contains('hidden') ? openBook() : closeWindow(ui.book); } if (e.code === 'KeyM') { e.preventDefault(); ui.map.classList.contains('hidden') ? openMap() : closeWindow(ui.map); } if (e.code === 'Escape') { [ui.book, ui.map, ui.dlg].forEach(w => !w.classList.contains('hidden') && closeWindow(w)); } }; document.onkeyup = e => state.keys.delete(e.code); document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { sfx.ui(); closeWindow($(b.dataset.close)); }); document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { sfx.page(); renderBook(b.dataset.tab); }); addEventListener('beforeunload', save); setInterval(save, 12000); addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }); }
console.log(BUILD);
