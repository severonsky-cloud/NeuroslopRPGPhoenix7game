import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { createTerrainMesh, heightAt, biomeAt } from '../world/terrain.js';
import { WorldChunks } from '../world/chunks.js';
import { LOCATIONS, BIOMES, NPCS, MONSTERS } from '../data/worldData.js';
import { createPlayer, createPlayerRig, movePlayer } from '../entities/player.js';
import { createNpc, updateNpcRoutes } from '../entities/npc.js';
import { createMonster, updateMonsters } from '../entities/monster.js';
import { InputSystem } from './input.js';
import { Hud } from '../ui/hud.js';
import { mapHtml, journalHtml } from '../ui/map.js';
import { WEAPONS, weaponByDigit } from '../combat/weapons.js';
import { findMeleeTarget, damageMonster, shootProjectile, updateProjectiles } from '../combat/combat.js';
import { Materials, makeMat, placeBox, labelSprite } from '../world/props.js';
import { getQualityPreset, setQualityPreset } from './quality.js';
import { createAtmosphere, applyBiomeAtmosphere } from '../world/atmosphere.js';
import { createBiomeLandmarks } from '../world/landmarks.js';
import { LivingWorldSystem } from '../world/life.js';

export class PhoenixV3Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.quality = getQualityPreset();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9b5a35);
    this.scene.fog = new THREE.FogExp2(0xb36b3f, this.quality.fogDensity);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const rigPack = createPlayerRig(this.scene);
    this.rig = rigPack.rig;
    this.camera = rigPack.camera;
    this.player = createPlayer();
    this.input = new InputSystem(canvas);
    this.hud = new Hud();

    this.mode = 'boot';
    this.yaw = Math.PI * 0.45;
    this.pitch = 0;
    this.last = performance.now();
    this.cooldown = 0;
    this.projectiles = [];
    this.npcs = [];
    this.monsters = [];
    this.labels = [];
    this.log = ['v3.0C: living world подключён. Форт Заря перенесён далеко от Порта Рейчел.'];
    this.debugIndex = 0;
    this.currentBiomeId = 'clay';

    this.input.onAction = (code, event) => this.onAction(code, event);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  boot() {
    this.buildScene();
    this.loop(performance.now());
  }

  buildScene() {
    this.atmosphere = createAtmosphere(this.scene, this.quality);
    if (this.quality.realtimeAccentLights) {
      const violet = new THREE.PointLight(0x5a22ff, 0.75, 115);
      violet.position.set(288, 20, 112);
      this.scene.add(violet);
    }
    this.scene.add(createTerrainMesh({ segmentsX: this.quality.terrainSegmentsX, segmentsZ: this.quality.terrainSegmentsZ }));
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(250, 340),
      new THREE.MeshStandardMaterial({ color: 0x12384d, roughness: 0.22, metalness: 0.12, transparent: true, opacity: 0.86 })
    );
    ocean.position.set(-235, -0.65, 15);
    ocean.rotation.x = -Math.PI / 2;
    this.scene.add(ocean);

    this.chunks = new WorldChunks(this.scene, this.quality);
    this.chunks.buildStaticWorld();
    this.buildLocations();
    this.labels.push(...createBiomeLandmarks(this.scene, this.quality));
    this.buildEntities();
    this.livingWorld = new LivingWorldSystem(this.scene, this.labels);
    this.livingWorld.build();
    this.buildViewModel();
    this.hud.setObjective(`v3.0C living world · quality ${this.quality.name} · Fort Zarya is far`);
  }

  buildLocations() {
    const colorById = {
      customs: 0x6b5534, salt: 0x4d3928, market: 0x5e4630, shelter: 0x584429,
      registry: 0x76603e, gerda: 0x49382b, rednode: 0x6d3528, guidecamp: 0x4d3c55,
      mangrovepump: 0x344028, tsarborcamp: 0x2f4c35, glassdemesne: 0x15121f, iceshelfpost: 0x496574,
      portVillage: 0x6b4f32, redroadcamp: 0x5a3924, fortBarracks: 0x33302d, fortGate: 0x2a2826, blueCaravanYard: 0x314c72,
    };
    for (const loc of LOCATIONS) {
      if (loc.type === 'biome' || loc.type === 'district' || loc.type === 'ruin') {
        this.labels.push(labelSprite(this.scene, loc.name, loc.x, loc.z, 3.3, 0.55));
        if (loc.type === 'ruin') this.makeBattery(loc.x, loc.z);
        continue;
      }
      this.makeBuilding(loc.name, loc.x, loc.z, colorById[loc.id] ?? 0x5e4630);
    }
  }

  makeBuilding(name, x, z, color) {
    placeBox(this.scene, x, z, 9, 6, 0.08, makeMat(0x302319), false);
    placeBox(this.scene, x - 4.35, z, 0.3, 6, 3.4, makeMat(color));
    placeBox(this.scene, x + 4.35, z, 0.3, 6, 3.4, makeMat(color));
    placeBox(this.scene, x, z - 2.85, 9, 0.3, 3.4, makeMat(color));
    placeBox(this.scene, x - 2.9, z + 2.85, 2.4, 0.3, 3.4, makeMat(color));
    placeBox(this.scene, x + 2.9, z + 2.85, 2.4, 0.3, 3.4, makeMat(color));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 1.4, 4), Materials.roof);
    roof.position.set(x, heightAt(x, z) + 4.05, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    this.scene.add(roof);
    this.labels.push(labelSprite(this.scene, name, x, z, 5.4, 0.55));
  }

  makeBattery(x, z) {
    placeBox(this.scene, x, z, 6, 3, 1.4, Materials.metal);
    placeBox(this.scene, x - 2.2, z + 1.1, 0.8, 1.2, 2.3, Materials.metal);
    placeBox(this.scene, x + 2.1, z + 1.0, 1.0, 1.0, 2.0, Materials.metal);
  }

  buildEntities() {
    this.npcs = NPCS.map(n => createNpc(this.scene, n));
    this.monsters = MONSTERS.map(m => createMonster(this.scene, m));
    for (const n of this.npcs) this.labels.push(labelSprite(this.scene, n.userData.name, n.userData.x, n.userData.z, 2.7, 0.45));
    for (const m of this.monsters) this.labels.push(labelSprite(this.scene, m.userData.name, m.userData.x, m.userData.z, 2.5, 0.4));
  }

  buildViewModel() {
    if (this.hands) this.camera.remove(this.hands);
    const root = new THREE.Group();
    const skin = makeMat(0xc09673);
    const armGeo = new THREE.CapsuleGeometry(0.055, 0.32, 5, 8);
    const fistGeo = new THREE.SphereGeometry(0.09, 10, 8);
    const left = new THREE.Group();
    const right = new THREE.Group();
    const la = new THREE.Mesh(armGeo, skin); la.rotation.x = 1.18;
    const ra = new THREE.Mesh(armGeo, skin); ra.rotation.x = 1.18;
    const lf = new THREE.Mesh(fistGeo, skin); lf.position.set(0, -0.01, -0.29);
    const rf = new THREE.Mesh(fistGeo, skin); rf.position.set(0, -0.01, -0.29);
    left.add(la, lf); right.add(ra, rf);
    left.position.set(-0.22, -0.49, -0.82);
    right.position.set(0.25, -0.49, -0.82);
    left.rotation.set(-0.2, 0.16, -0.12);
    right.rotation.set(-0.2, -0.16, 0.12);
    root.add(left, right);

    const w = WEAPONS[this.player.weapon];
    if (w.kind === 'gun') {
      const len = w.hold === 'rifle' ? 1.04 : w.hold === 'lmg' ? 0.86 : 0.38;
      const body = new THREE.Mesh(new THREE.BoxGeometry(len, w.hold === 'lmg' ? 0.16 : 0.12, 0.16), Materials.metal);
      body.position.set(0.32, -0.43, -0.75);
      body.rotation.y = -0.08;
      root.add(body);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len * 0.9, 8), Materials.metal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0.32 + len * 0.52, -0.42, -0.75);
      root.add(barrel);
    } else if (w.kind === 'blade') {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(w.hold === 'heavyBlade' ? 0.055 : 0.028, 0.045, w.hold === 'heavyBlade' ? 1.05 : 0.82),
        makeMat(0xc8c0a8, { roughness: 0.34, metalness: 0.28 })
      );
      blade.position.set(0.34, -0.42, -1.04);
      root.add(blade);
    } else if (w.kind === 'phase') {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 18, 12),
        new THREE.MeshStandardMaterial({ color: 0x8a78ff, emissive: 0x5845ff, emissiveIntensity: 1.7, transparent: true, opacity: 0.82 })
      );
      orb.position.set(0.02, -0.32, -0.9);
      root.add(orb);
    }
    this.hands = root;
    this.camera.add(root);
  }

  start() {
    document.getElementById('boot')?.classList.add('hidden');
    this.mode = 'play';
    this.hud.setObjective(`v3.0C ready · Port to Fort is a real journey · quality ${this.quality.name}`);
  }

  onAction(code, event) {
    const weapon = weaponByDigit(code);
    if (weapon) {
      this.player.weapon = weapon;
      this.buildViewModel();
    }
    if (code === 'MouseLeft' || code === 'Space') this.attack();
    if (code === 'KeyM') this.openMap();
    if (code === 'KeyJ') this.openJournal();
    if (code === 'Escape') this.hud.closePanel();
    if (code === 'F1') { event?.preventDefault?.(); this.teleportNext(); }
    if (code === 'KeyE') this.interact();
    if (code === 'F9') this.setQuality('low');
    if (code === 'F10') this.setQuality('medium');
    if (code === 'F11') this.setQuality('high');
  }

  setQuality(name) { setQualityPreset(name); this.hud.setObjective(`Quality set to ${name}. Перезагрузи страницу Ctrl+F5.`); }

  attack() {
    const w = WEAPONS[this.player.weapon];
    if (this.cooldown > 0) return;
    this.cooldown = w.cooldown;
    if (w.kind === 'gun') {
      this.projectiles.push(shootProjectile({ scene: this.scene, camera: this.camera, weapon: w, damage: w.damage }));
      return;
    }
    const target = findMeleeTarget({ weaponId: this.player.weapon, playerRig: this.rig, camera: this.camera, monsters: this.monsters });
    if (!target) { this.hud.setObjective(`${w.name}: не достаёт`); return; }
    const m = damageMonster(target, w.damage);
    this.hud.hitMarker(`-${w.damage}`);
    this.hud.setObjective(`${m.name}: удар ${w.name}`);
  }

  interact() {
    const lifeAgent = this.livingWorld?.findNear(this.rig);
    if (lifeAgent) {
      this.hud.openPanel(this.livingWorld.describe(lifeAgent));
      document.getElementById('closeMapBtn')?.addEventListener('click', () => this.hud.closePanel());
      return;
    }
    const nearNpc = this.npcs.find(n => Math.hypot(n.userData.x - this.rig.position.x, n.userData.z - this.rig.position.z) < 2.4);
    if (nearNpc) {
      const n = nearNpc.userData;
      this.hud.openPanel(`<h2>${n.name}</h2><p>${n.text}</p><p><b>Фракция:</b> ${n.faction}</p><p><button id="closeMapBtn">Закрыть</button></p>`);
      document.getElementById('closeMapBtn')?.addEventListener('click', () => this.hud.closePanel());
    }
  }

  openMap() {
    this.hud.openPanel(mapHtml({ locations: LOCATIONS, biomes: BIOMES, player: { x: this.rig.position.x, z: this.rig.position.z } }));
    document.getElementById('closeMapBtn')?.addEventListener('click', () => this.hud.closePanel());
  }

  openJournal() {
    const lifeEvents = this.livingWorld?.eventLog || [];
    this.hud.openPanel(journalHtml([...lifeEvents, ...this.log]));
    document.getElementById('closeMapBtn')?.addEventListener('click', () => this.hud.closePanel());
  }

  teleportNext() {
    const points = [
      { x: -142, z: 20, n: 'Берег Порта Рейчел' },
      { x: -88, z: 22, n: 'Рина / Порт' },
      { x: -20, z: 66, n: 'Дорожный навес' },
      { x: 62, z: 110, n: 'Красная дорога' },
      { x: 142, z: 176, n: 'Форт Заря далеко от порта' },
      { x: 250, z: 250, n: 'Мёртвая Саванна' },
      { x: 174, z: 248, n: 'Лес царборцев' },
      { x: 288, z: 112, n: 'Вотчина чёрных элементалей' },
      { x: 205, z: -145, n: 'Ледяной шельф' },
    ];
    const p = points[this.debugIndex++ % points.length];
    this.rig.position.set(p.x, heightAt(p.x, p.z), p.z);
    this.hud.setObjective(`F1 teleport: ${p.n}`);
  }

  updateLabelVisibility() {
    const max = this.quality.labelsDistance;
    for (const l of this.labels) {
      const d = Math.hypot(l.position.x - this.rig.position.x, l.position.z - this.rig.position.z);
      l.visible = d < max;
      if (l.visible) l.quaternion.copy(this.camera.quaternion);
    }
  }

  update(dt) {
    const mouse = this.input.consumeMouse();
    if (this.input.pointerLocked) {
      this.yaw -= mouse.dx * 0.0022;
      this.pitch = THREE.MathUtils.clamp(this.pitch - mouse.dy * 0.002, -1.15, 1.15);
      this.rig.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    }
    const sprint = movePlayer({ rig: this.rig, input: this.input, yaw: this.yaw, dt });
    if (sprint) this.player.st = Math.max(0, this.player.st - dt * 12);
    else this.player.st = Math.min(this.player.stMax, this.player.st + dt * 8);
    this.player.ph = Math.min(this.player.phMax, this.player.ph + dt * 8);
    this.cooldown = Math.max(0, this.cooldown - dt);
    updateNpcRoutes(this.npcs, dt);
    this.livingWorld?.update(dt, this.rig);
    updateMonsters(this.monsters, this.rig, dt);
    this.projectiles = updateProjectiles({ scene: this.scene, projectiles: this.projectiles, monsters: this.monsters, dt, onHit: (obj, dmg) => this.hud.hitMarker(`-${dmg}`) });

    const biomeId = biomeAt(this.rig.position.x, this.rig.position.z);
    if (biomeId !== this.currentBiomeId) { this.currentBiomeId = biomeId; applyBiomeAtmosphere(this.scene, this.atmosphere, biomeId, this.quality); }
    const biome = BIOMES.find(b => b.id === biomeId);
    this.hud.update(this.player, biome?.name ?? 'Неизвестная зона', `living agents ${this.livingWorld?.agents?.length || 0} · F9/F10/F11`);
    const lifeAgent = this.livingWorld?.findNear(this.rig);
    if (lifeAgent) this.hud.showPrompt(`E — говорить: ${lifeAgent.userData.name}`);
    else {
      const nearNpc = this.npcs.find(n => Math.hypot(n.userData.x - this.rig.position.x, n.userData.z - this.rig.position.z) < 2.4);
      if (nearNpc) this.hud.showPrompt(`E — говорить: ${nearNpc.userData.name}`);
      else this.hud.hidePrompt();
    }
    if (this.hands) this.hands.position.x = Math.sin(performance.now() * 0.006) * 0.012;
  }

  render() { this.updateLabelVisibility(); this.renderer.render(this.scene, this.camera); }
  loop(now) { const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016); this.last = now; this.update(dt); this.render(); requestAnimationFrame(t => this.loop(t)); }
  resize() { this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.quality.pixelRatio)); this.renderer.setSize(innerWidth, innerHeight); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); }
}
