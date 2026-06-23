import * as THREE from '../vendor/three.module.js';
import {
  VEHICLE_TYPES,
  VEHICLE_TEST_WEAPONS,
  createVehicle,
  updateVehicle,
  getVehicleHit,
  applyVehicleDamage,
  applySplashDamage,
  setVehicleDebugVisible,
  createLootCrates,
} from './ashgraveVehicleLabCore.js';

const $ = (id) => document.getElementById(id);

function makeBasicMaterial(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
}

function lookDirection(camera) {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
}

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(10,8,6,0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(225,176,75,0.85)';
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.fillStyle = '#f5dfbb';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(text, 22, 52);
  ctx.fillStyle = '#bda17c';
  ctx.font = '22px monospace';
  ctx.fillText('HP / armor / state', 22, 88);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(4.8, 1.2, 1);
  sprite.userData.canvas = canvas;
  sprite.userData.ctx = ctx;
  sprite.userData.texture = tex;
  return sprite;
}

function updateLabel(sprite, vehicle) {
  const data = vehicle.userData;
  const ctx = sprite.userData.ctx;
  const canvas = sprite.userData.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(10,8,6,0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = data.state === 'destroyed' ? 'rgba(255,70,45,0.9)' : 'rgba(225,176,75,0.85)';
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.fillStyle = '#f5dfbb';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(data.label, 22, 46);
  ctx.fillStyle = data.hp <= 0 ? '#ff6644' : '#bda17c';
  ctx.font = '22px monospace';
  ctx.fillText(`HP ${Math.round(data.hp)}/${data.hpMax} · ARM ${data.armor} · ${data.state}`, 22, 86);
  sprite.userData.texture.needsUpdate = true;
  sprite.position.set(vehicle.position.x, vehicle.position.y + 6.4, vehicle.position.z);
}

class SimpleOrbit {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.target = new THREE.Vector3(0, 2, 0);
    this.distance = 26;
    this.yaw = 0.0;
    this.pitch = 0.42;
    this.dragging = false;
    this.last = { x: 0, y: 0 };
    dom.addEventListener('pointerdown', (e) => { this.dragging = true; this.last.x = e.clientX; this.last.y = e.clientY; dom.setPointerCapture?.(e.pointerId); });
    dom.addEventListener('pointerup', () => { this.dragging = false; });
    dom.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.last.x;
      const dy = e.clientY - this.last.y;
      this.last.x = e.clientX;
      this.last.y = e.clientY;
      this.yaw -= dx * 0.006;
      this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.004, -0.05, 1.25);
    });
    dom.addEventListener('wheel', (e) => { this.distance = THREE.MathUtils.clamp(this.distance + e.deltaY * 0.02, 8, 72); e.preventDefault(); }, { passive: false });
  }

  update() {
    const cp = Math.cos(this.pitch);
    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * cp * this.distance,
      this.target.y + Math.sin(this.pitch) * this.distance,
      this.target.z + Math.cos(this.yaw) * cp * this.distance,
    );
    this.camera.lookAt(this.target);
  }
}

export class VehicleLabApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x4a4a43);
    this.scene.fog = new THREE.Fog(0x4a4a43, 65, 160);
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 220);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(1.7, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.controls = new SimpleOrbit(this.camera, this.renderer.domElement);
    this.clock = new THREE.Clock();
    this.vehicles = [];
    this.projectiles = [];
    this.effects = [];
    this.labels = [];
    this.totalLoot = 0;
    this.stats = { pen: 0, cook: 0, block: 0, destroyed: 0 };
    this.showColliders = false;
    this.showLabels = true;
    this.initScene();
    this.bindUi();
    this.resize = () => this.onResize();
    window.addEventListener('resize', this.resize);
  }

  initScene() {
    const dir = new THREE.DirectionalLight(0xffe6c8, 3.0);
    dir.position.set(26, 42, 12);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    this.scene.add(dir, new THREE.AmbientLight(0x9aa4ad, 1.25));
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220, 1, 1), new THREE.MeshStandardMaterial({ color: 0x676552, roughness: 1 }));
    ground.name = 'vehicle_lab_ground';
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(120, 24, 0x222222, 0x555544);
    this.scene.add(grid);
  }

  bindUi() {
    document.querySelectorAll('[data-spawn]').forEach((btn) => btn.addEventListener('click', () => this.spawn(btn.dataset.spawn)));
    document.querySelectorAll('[data-weapon]').forEach((btn) => btn.addEventListener('click', () => this.testWeapon(btn.dataset.weapon)));
    $('spawnAllBtn')?.addEventListener('click', () => this.spawnAll());
    $('clearBtn')?.addEventListener('click', () => this.clear());
    $('collidersBtn')?.addEventListener('click', () => this.toggleColliders());
    $('labelsBtn')?.addEventListener('click', () => this.toggleLabels());
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  onKey(e) {
    const map = { '1': 'technical', '2': 'panzer4', '3': 'fuelTruck', '4': 'glassWalker', '5': 'puma', '6': 'flakpanzer', '7': 'sherman', '8': 'jeep', '9': 'achilles', '0': 'm16aa' };
    if (map[e.key]) this.spawn(map[e.key]);
    else if (e.key === 'r' || e.key === 'R') this.testWeapon('bazookaRocket');
    else if (e.key === 'p' || e.key === 'P') this.testWeapon('panzerfaustRocket');
    else if (e.key === 't' || e.key === 'T') this.testWeapon('atRifle');
    else if (e.key === 'y' || e.key === 'Y') this.testWeapon('mgBullet');
    else if (e.key === 'b' || e.key === 'B') this.toggleColliders();
    else if (e.key === 'l' || e.key === 'L') this.toggleLabels();
    else if (e.key === 'c' || e.key === 'C') this.clear();
  }

  spawn(type) {
    const vehicle = createVehicle(type);
    const i = this.vehicles.length;
    const ring = 13 + Math.floor(i / 10) * 10;
    const a = i * 0.72;
    vehicle.position.set(Math.sin(a) * ring, 0, Math.cos(a) * ring);
    vehicle.rotation.y = a + Math.PI;
    this.scene.add(vehicle);
    this.vehicles.push(vehicle);
    setVehicleDebugVisible(vehicle, this.showColliders);
    const label = makeLabel(vehicle.userData.label);
    label.visible = this.showLabels;
    this.scene.add(label);
    this.labels.push({ sprite: label, vehicle });
    this.setHud(`spawned ${vehicle.userData.label}`);
    return vehicle;
  }

  spawnAll() {
    for (const key of Object.keys(VEHICLE_TYPES)) this.spawn(key);
  }

  clear() {
    for (const v of this.vehicles) this.scene.remove(v);
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    for (const e of this.effects) this.scene.remove(e.mesh);
    for (const l of this.labels) this.scene.remove(l.sprite);
    this.vehicles = [];
    this.projectiles = [];
    this.effects = [];
    this.labels = [];
    this.stats = { pen: 0, cook: 0, block: 0, destroyed: 0 };
    this.totalLoot = 0;
    this.updateStats();
    this.setHud('lab cleared');
  }

  toggleColliders() {
    this.showColliders = !this.showColliders;
    for (const v of this.vehicles) setVehicleDebugVisible(v, this.showColliders);
    this.setHud(`collision volumes: ${this.showColliders ? 'ON' : 'OFF'}`);
  }

  toggleLabels() {
    this.showLabels = !this.showLabels;
    for (const l of this.labels) l.sprite.visible = this.showLabels;
  }

  testWeapon(id) {
    const profile = VEHICLE_TEST_WEAPONS[id];
    if (!profile) return;
    const start = this.camera.position.clone();
    const dir = lookDirection(this.camera);
    const end = start.clone().addScaledVector(dir, 120);
    if (profile.speed > 0) {
      const geo = id.includes('Rocket') ? new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8) : new THREE.CylinderGeometry(0.045, 0.045, 1.4, 6);
      const mesh = new THREE.Mesh(geo, makeBasicMaterial(id.includes('Rocket') ? 0xff4b1f : 0xfff199));
      mesh.position.copy(start);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      this.scene.add(mesh);
      this.projectiles.push({ mesh, profile, start: start.clone(), end, dist: 0, dir, last: start.clone(), isTracer: !id.includes('Rocket') });
    } else {
      for (let i = 0; i < 7; i += 1) {
        const spread = new THREE.Vector3((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.9);
        this.resolveSegment(start.clone().add(spread), end.clone().add(spread), profile);
      }
    }
  }

  resolveSegment(start, end, profile) {
    for (const v of this.vehicles) {
      const hit = getVehicleHit(v, start, end);
      if (!hit.hit) continue;
      const result = applyVehicleDamage(v, hit, profile);
      if (result.kind === 'armorBlocked') this.stats.block += 1;
      else if (result.kind === 'cookOffStarted') this.stats.cook += 1;
      else if (result.ok) this.stats.pen += 1;
      if (result.kind === 'destroyed') this.onDestroyed(v, result.event);
      if (profile.splashRadius > 0) this.applySplash(hit.point, profile);
      this.hitEffect(hit.point, result.kind === 'armorBlocked' ? 0xffff33 : 0xff6633, result.kind === 'armorBlocked' ? 0.35 : 1.0);
      this.updateStats();
      this.setHud(`${profile.label}: ${hit.vehicle.userData.label} · ${hit.part} · ${result.kind}`);
      return true;
    }
    return false;
  }

  applySplash(point, profile) {
    const results = applySplashDamage(this.vehicles, point, profile.splashRadius, profile);
    for (const r of results) if (r.destroyed) this.onDestroyed(r.vehicle, r.destroyed);
    this.hitEffect(point, 0xff9933, Math.max(1.1, profile.splashRadius * 0.25));
  }

  onDestroyed(vehicle, event) {
    this.stats.destroyed += 1;
    if (event?.secondaryBlast) {
      setTimeout(() => this.applySplash(vehicle.position.clone(), { damage: 120, splashRadius: 8, label: 'secondary blast' }), 160);
    }
    if (event?.loot) {
      const crates = createLootCrates(event.loot);
      const center = vehicle.position.clone();
      for (const c of crates) {
        c.position.copy(center).add(new THREE.Vector3((Math.random() - 0.5) * 3, 1.8 + Math.random() * 1.5, (Math.random() - 0.5) * 3));
        this.scene.add(c);
        this.effects.push({ mesh: c, vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.2, (Math.random() - 0.5) * 1.5), life: 14, loot: true });
      }
      this.totalLoot += event.loot;
    }
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const p = this.projectiles[i];
      p.last.copy(p.mesh.position);
      const step = p.profile.speed * dt;
      p.mesh.position.addScaledVector(p.dir, step);
      p.dist += step;
      if (p.isTracer) this.hitEffect(p.mesh.position, 0xfff4aa, 0.08, 0.12);
      const hit = this.resolveSegment(p.last, p.mesh.position, p.profile);
      if (hit || p.dist > p.start.distanceTo(p.end)) {
        if (!hit && p.profile.splashRadius > 0) this.applySplash(p.mesh.position.clone(), p.profile);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  hitEffect(pos, color = 0xffaa33, size = 1, life = 0.45) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), makeBasicMaterial(color, 0.82));
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.effects.push({ mesh, vel: new THREE.Vector3(0, 1.8, 0), life });
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      const e = this.effects[i];
      e.life -= dt;
      if (e.vel) {
        e.vel.y -= 3.2 * dt;
        e.mesh.position.addScaledVector(e.vel, dt);
        if (e.mesh.position.y < 0.12) { e.mesh.position.y = 0.12; e.vel.multiplyScalar(0.6); }
      }
      if (!e.loot) e.mesh.scale.multiplyScalar(1 + dt * 1.8);
      if (e.mesh.material?.opacity !== undefined && !e.loot) e.mesh.material.opacity = Math.max(0, e.life / 0.45);
      if (e.life <= 0) {
        this.scene.remove(e.mesh);
        this.effects.splice(i, 1);
      }
    }
  }

  updateLabels() {
    for (const pair of this.labels) {
      if (pair.sprite.visible) {
        updateLabel(pair.sprite, pair.vehicle);
        pair.sprite.quaternion.copy(this.camera.quaternion);
      }
    }
  }

  updateStats() {
    if ($('hPen')) $('hPen').textContent = this.stats.pen;
    if ($('hCook')) $('hCook').textContent = this.stats.cook;
    if ($('hBlock')) $('hBlock').textContent = this.stats.block;
    if ($('hDestroyed')) $('hDestroyed').textContent = this.stats.destroyed;
    if ($('hLoot')) $('hLoot').textContent = this.totalLoot;
  }

  setHud(text) {
    if ($('hEvent')) $('hEvent').textContent = text;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(dt) {
    const time = performance.now();
    const lookAt = this.camera.position;
    for (const v of this.vehicles) updateVehicle(v, dt, { time, lookAt });
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.updateLabels();
    this.controls.update();
    this.updateStats();
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      this.update(Math.min(0.06, this.clock.getDelta()));
    };
    loop();
  }
}

export function bootVehicleLab() {
  const app = new VehicleLabApp(document.getElementById('vehicleLabCanvas'));
  window.lab = app;
  app.start();
  return app;
}
