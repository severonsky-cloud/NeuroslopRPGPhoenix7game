import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { makeMat, labelSprite } from '../world/props.js';

const FORT_CENTER = new THREE.Vector3(142, 0, 176);
const FORT_WALL = new THREE.Vector3(126, 0, 158);
const ZHUZHER_START = new THREE.Vector3(218, 0, 226);
const SAFE_SETTLEMENT = new THREE.Vector3(54, 0, 112);

function place(obj, x, z) { obj.position.set(x, heightAt(x, z), z); return obj; }
function mat(color, opts = {}) { return makeMat(color, opts); }
function box(w, h, d, color, opts = {}) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts)); }
function cyl(r, h, color, axis = 'x', opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), mat(color, opts));
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  return m;
}

function makeVehicle(kind) {
  const g = new THREE.Group();
  const isSherman = kind === 'sherman';
  const color = isSherman ? 0x5f6846 : 0x5c5a3c;
  const accent = isSherman ? 0x2f3324 : 0x302e20;
  const hull = box(isSherman ? 3.9 : 3.1, isSherman ? 0.86 : 0.72, isSherman ? 2.1 : 1.65, color, { roughness: 0.7, metalness: 0.08 });
  hull.position.y = 0.82;
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(isSherman ? 0.75 : 0.52, isSherman ? 0.88 : 0.62, isSherman ? 0.62 : 0.45, 10), mat(color, { roughness: 0.68, metalness: 0.1 }));
  turret.name = 'turret';
  turret.position.y = isSherman ? 1.42 : 1.24;
  turret.rotation.y = Math.PI / 2;
  const barrel = cyl(isSherman ? 0.08 : 0.055, isSherman ? 2.3 : 1.75, accent, 'z');
  barrel.name = 'barrel';
  barrel.position.set(0, turret.position.y, isSherman ? -1.55 : -1.25);
  g.add(hull, turret, barrel);
  for (let i = 0; i < 6; i++) {
    const x = -1.55 + i * 0.62;
    const w1 = cyl(0.26, 0.22, accent, 'x'); w1.position.set(x, 0.38, -1.12); g.add(w1);
    const w2 = cyl(0.26, 0.22, accent, 'x'); w2.position.set(x, 0.38, 1.12); g.add(w2);
  }
  g.userData = {
    type: 'vehicle', kind,
    name: isSherman ? 'Имперский Шерман' : 'Пума Жужжер',
    hp: isSherman ? 190 : 135, hpMax: isSherman ? 190 : 135,
    alive: true, reloadT: isSherman ? 2.4 : 1.8, fireCooldown: isSherman ? 1.0 : 0.6, x: 0, z: 0,
  };
  return g;
}

function makeSoldier(faction, i) {
  const g = new THREE.Group();
  const color = faction === 'empire' ? 0xb8aa86 : 0x6b6f35;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.9, 4, 8), mat(color));
  body.position.y = 1.02;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat(0xd0a878));
  head.position.y = 1.62;
  const kit = box(0.34, 0.42, 0.14, faction === 'empire' ? 0x323125 : 0x5d1e13);
  kit.position.set(0, 1.05, 0.26);
  const weapon = box(faction === 'empire' ? 0.86 : 0.56, 0.06, 0.06, 0x1c1b18, { metalness: 0.12 });
  weapon.position.set(0.42, 1.12, 0.08);
  weapon.rotation.y = -0.5;
  g.add(body, head, kit, weapon);
  g.userData = {
    type: 'fortEncounterSoldier',
    name: faction === 'empire' ? `Защитник Форта ${i + 1}` : `Жужжер-штурмовик ${i + 1}`,
    faction,
    role: faction === 'empire' ? 'fort_defender' : 'fort_raider',
    hp: faction === 'empire' ? 45 : 38, hpMax: faction === 'empire' ? 45 : 38,
    alive: true, x: 0, z: 0, windupT: 0, combatCooldown: Math.random(),
  };
  return g;
}

function moveToward(obj, target, dt, speed) {
  if (!obj?.userData?.alive) return;
  const dx = target.x - obj.position.x;
  const dz = target.z - obj.position.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.3) return;
  obj.position.x += dx / d * dt * speed;
  obj.position.z += dz / d * dt * speed;
  obj.position.y = heightAt(obj.position.x, obj.position.z);
  obj.userData.x = obj.position.x;
  obj.userData.z = obj.position.z;
  obj.lookAt(target.x, heightAt(target.x, target.z) + 1, target.z);
}

function makeLine(scene, a, b, color = 0xffd28a, life = 0.18) {
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.88 }));
  line.userData.life = life;
  scene.add(line);
  return line;
}

function explosion(scene, pos, color = 0xffb35a) {
  const group = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 8, 6), mat(color, { emissive: color, emissiveIntensity: 1.0 }));
    p.position.copy(pos);
    p.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 3.5, (Math.random() - 0.5) * 5);
    p.userData.life = 0.45 + Math.random() * 0.4;
    group.add(p);
  }
  group.userData.life = 0.8;
  scene.add(group);
  return group;
}

export class FortZaryaEncounter {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.scene;
    this.state = 'dormant';
    this.timer = 0;
    this.rollT = 10 + Math.random() * 16;
    this.occupationTimer = 0;
    this.lines = [];
    this.fx = [];
    this.labels = [];
    this.wallIntegrity = 100;
    this.keyNpcState = 'normal';
    this.built = false;
    this.started = false;
    this.empire = [];
    this.zhuzher = [];
    this.sherman = null;
    this.puma = null;
    this.forceStart = typeof location !== 'undefined' && new URLSearchParams(location.search).get('fort') === '1';
  }

  build() {
    if (this.built) return;
    this.built = true;
    this.engine.log.unshift('Форт Заря: случайное событие обороны доступно рядом с фортом.');
  }

  startEncounter(reason = 'random') {
    if (this.started) return;
    this.started = true;
    this.state = 'approach';
    this.timer = 0;
    this.wallIntegrity = 100;
    this.sherman = place(makeVehicle('sherman'), 128, 174);
    this.puma = place(makeVehicle('puma'), 218, 226);
    this.scene.add(this.sherman, this.puma);
    this.labels = [
      labelSprite(this.scene, 'Шерман Империи', 128, 174, 2.8, 0.48),
      labelSprite(this.scene, 'Пума Жужжер', 218, 226, 2.5, 0.48),
    ];
    this.empire = [];
    this.zhuzher = [];
    for (let i = 0; i < 8; i++) {
      const e = makeSoldier('empire', i);
      place(e, 116 + (i % 4) * 6, 160 + Math.floor(i / 4) * 11);
      this.scene.add(e); this.empire.push(e);
      const z = makeSoldier('zhuzher', i);
      place(z, 206 + (i % 4) * 5, 226 + Math.floor(i / 4) * 8);
      this.scene.add(z); this.zhuzher.push(z);
    }
    this.engine.livingWorld?.agents?.push(...this.empire, ...this.zhuzher);
    this.engine.hud?.setObjective?.(reason === 'forced' ? 'Форт Заря: событие запущено вручную.' : 'Форт Заря: случайное событие началось.');
    this.engine.log.unshift('Форт Заря: началось случайное событие обороны.');
  }

  aliveCount(arr) { return arr.filter(o => o.userData.alive !== false && (o.userData.hp ?? 1) > 0).length; }
  halfBroken(arr) { return this.aliveCount(arr) <= Math.floor(arr.length / 2); }

  update(dt) {
    if (!this.built) this.build();
    this.timer += dt;
    this.updateFx(dt);
    if (this.state === 'finished') return;
    if (this.state === 'dormant') { this.updateDormant(dt); return; }
    if (this.state === 'approach') this.updateApproach(dt);
    if (this.state === 'assault') this.updateAssault(dt);
    if (this.state === 'retreat') this.updateRetreat(dt);
    if (this.state === 'occupied') this.updateOccupation(dt);
    this.checkOutcome();
  }

  updateDormant(dt) {
    if (this.forceStart && this.timer > 3) { this.startEncounter('forced'); return; }
    const player = this.engine.rig.position;
    const nearFort = player.distanceTo(FORT_CENTER) < 135;
    if (!nearFort) return;
    this.rollT -= dt;
    if (this.rollT <= 0) {
      if (Math.random() < 0.28) this.startEncounter('random');
      else this.rollT = 12 + Math.random() * 22;
    }
  }

  updateApproach(dt) {
    moveToward(this.puma, FORT_WALL, dt, 3.0);
    for (const z of this.zhuzher) moveToward(z, new THREE.Vector3(126 + Math.random() * 30, 0, 160 + Math.random() * 30), dt, 1.45);
    if (this.puma.position.distanceTo(FORT_WALL) < 18) {
      this.state = 'assault';
      this.engine.hud.setObjective('Форт Заря: бронемашина вышла к стенам. Начался штурм.');
    }
    this.vehicleDuel(dt);
  }

  updateAssault(dt) {
    for (const z of this.zhuzher) moveToward(z, FORT_CENTER, dt, z.userData.alive ? 1.15 : 0);
    for (const e of this.empire) {
      const nearest = this.nearestAlive(e, this.zhuzher);
      if (nearest) moveToward(e, nearest.position, dt, 0.75);
    }
    if (this.puma.userData.alive) {
      this.wallIntegrity = Math.max(0, this.wallIntegrity - dt * 3.2);
      if (Math.random() < dt * 0.75) this.fireVehicle(this.puma, new THREE.Vector3(124, heightAt(124, 158) + 1.6, 158), 0xffa54d, 0);
    }
    this.vehicleDuel(dt);
    this.squadFire(dt);
    if (this.wallIntegrity <= 0 && this.state === 'assault') this.engine.hud.setObjective('Форт Заря: внешняя линия сломана, штурм идёт к центру.');
  }

  updateRetreat(dt) {
    for (const z of this.zhuzher) moveToward(z, ZHUZHER_START, dt, 2.2);
    if (this.puma?.userData.alive) moveToward(this.puma, ZHUZHER_START, dt, 2.4);
    if (this.timer > 8) {
      this.state = 'finished';
      this.engine.hud.setObjective('Форт Заря: штурмующие отступили.');
      this.restoreKeyNpcs();
    }
  }

  updateOccupation(dt) {
    this.occupationTimer -= dt;
    for (const z of this.zhuzher) moveToward(z, FORT_CENTER, dt, 0.55);
    if (this.occupationTimer <= 0) {
      this.state = 'retreat';
      this.timer = 0;
      this.engine.hud.setObjective('Форт Заря: центр разграблен, штурмующие отходят.');
    }
  }

  vehicleDuel(dt) {
    if (!this.sherman || !this.puma) return;
    this.sherman.userData.reloadT -= dt;
    this.puma.userData.reloadT -= dt;
    if (this.sherman.userData.alive && this.puma.userData.alive && this.sherman.userData.reloadT <= 0) {
      this.sherman.userData.reloadT = 3.2;
      const hit = Math.random() < 0.58;
      this.fireVehicle(this.sherman, this.puma.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0xffd28a, hit ? 48 : 0);
    }
    if (this.puma.userData.alive && this.sherman.userData.alive && this.puma.userData.reloadT <= 0 && this.puma.position.distanceTo(this.sherman.position) < 75) {
      this.puma.userData.reloadT = 2.5;
      const hit = Math.random() < 0.38;
      this.fireVehicle(this.puma, this.sherman.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0xffa54d, hit ? 28 : 0);
    }
  }

  fireVehicle(fromObj, targetPos, color, damage) {
    const from = fromObj.position.clone().add(new THREE.Vector3(0, 1.55, 0));
    this.lines.push(makeLine(this.scene, from, targetPos, color, 0.16));
    this.engine.combatAudio?.fire?.(fromObj.userData.kind === 'sherman' ? 'lmg' : 'rifle');
    if (damage > 0) {
      const target = fromObj === this.sherman ? this.puma : this.sherman;
      target.userData.hp -= damage;
      this.fx.push(explosion(this.scene, targetPos, color));
      if (target.userData.hp <= 0 && target.userData.alive) {
        target.userData.alive = false;
        target.rotation.z = 0.25;
        this.fx.push(explosion(this.scene, target.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0xff8a30));
        this.engine.hud.setObjective(`${target.userData.name} выведена из боя.`);
      }
    }
  }

  squadFire(dt) {
    if (Math.random() > dt * 2.0) return;
    const empireAlive = this.empire.filter(e => e.userData.alive);
    const zhAlive = this.zhuzher.filter(z => z.userData.alive);
    if (!empireAlive.length || !zhAlive.length) return;
    const attacker = Math.random() < 0.55 ? empireAlive[Math.floor(Math.random() * empireAlive.length)] : zhAlive[Math.floor(Math.random() * zhAlive.length)];
    const targets = attacker.userData.faction === 'empire' ? zhAlive : empireAlive;
    const target = targets[Math.floor(Math.random() * targets.length)];
    this.lines.push(makeLine(this.scene, attacker.position.clone().add(new THREE.Vector3(0, 1.2, 0)), target.position.clone().add(new THREE.Vector3(0, 1.1, 0)), attacker.userData.faction === 'empire' ? 0xffd28a : 0xffa54d, 0.10));
    this.engine.combatAudio?.fire?.(attacker.userData.faction === 'empire' ? 'rifle' : 'smg');
    if (Math.random() < 0.34) {
      target.userData.hp -= 16;
      target.userData.staggerT = 0.25;
      if (target.userData.hp <= 0) { target.userData.alive = false; target.scale.y = 0.28; }
    }
  }

  nearestAlive(obj, arr) {
    let best = null, bestD = Infinity;
    for (const a of arr) {
      if (!a.userData.alive) continue;
      const d = obj.position.distanceTo(a.position);
      if (d < bestD) { best = a; bestD = d; }
    }
    return best;
  }

  checkOutcome() {
    if (this.state === 'dormant' || this.state === 'retreat' || this.state === 'occupied' || this.state === 'finished') return;
    if (!this.puma?.userData.alive || this.halfBroken(this.zhuzher)) {
      this.state = 'retreat';
      this.timer = 0;
      this.engine.hud.setObjective('Форт Заря: штурмующие потеряли темп и отходят.');
      return;
    }
    if (!this.sherman?.userData.alive || this.halfBroken(this.empire)) {
      this.state = 'occupied';
      this.occupationTimer = 300;
      this.hideKeyNpcs();
      this.engine.hud.setObjective('Форт Заря: центр занят на 5 минут. Ключевые NPC уходят в укрытие.');
    }
  }

  hideKeyNpcs() {
    if (this.keyNpcState !== 'normal') return;
    this.keyNpcState = 'hidden';
    const keyNames = ['Герда', 'Оран', 'Сава'];
    for (const npc of this.engine.npcs || []) {
      if (keyNames.some(n => npc.userData.name?.includes(n))) {
        npc.userData.hiddenByFortEvent = true;
        npc.visible = false;
        npc.userData.safeX = SAFE_SETTLEMENT.x;
        npc.userData.safeZ = SAFE_SETTLEMENT.z;
      }
    }
    for (const agent of this.engine.livingWorld?.agents || []) {
      if (keyNames.some(n => agent.userData.name?.includes(n))) { agent.userData.hiddenByFortEvent = true; agent.visible = false; }
    }
    this.engine.log.unshift('Ключевые NPC Форта Заря ушли в укрытия и ближайшие безопасные поселения.');
  }

  restoreKeyNpcs() {
    if (this.keyNpcState !== 'hidden') return;
    this.keyNpcState = 'recovery';
    for (const npc of this.engine.npcs || []) {
      if (npc.userData.hiddenByFortEvent) {
        npc.visible = true;
        npc.userData.hiddenByFortEvent = false;
        npc.position.set(npc.userData.safeX || 142, heightAt(npc.userData.safeX || 142, npc.userData.safeZ || 176), npc.userData.safeZ || 176);
      }
    }
    this.engine.log.unshift('Форт Заря в восстановлении. NPC возвращаются после ухода штурмующих.');
  }

  updateFx(dt) {
    for (const line of this.lines) {
      line.userData.life -= dt;
      line.material.opacity = Math.max(0, line.userData.life / 0.18);
      if (line.userData.life <= 0) { this.scene.remove(line); line.dead = true; }
    }
    this.lines = this.lines.filter(l => !l.dead);
    for (const group of this.fx) {
      group.userData.life -= dt;
      for (const p of group.children) { p.position.addScaledVector(p.userData.vel, dt); p.scale.multiplyScalar(0.98); }
      if (group.userData.life <= 0) { this.scene.remove(group); group.dead = true; }
    }
    this.fx = this.fx.filter(f => !f.dead);
  }

  statusText() {
    if (this.state === 'dormant') return `Fort random event dormant · near Fort Zarya · roll ${Math.max(0, Math.ceil(this.rollT))}s`;
    if (!this.sherman || !this.puma) return `Fort event ${this.state}`;
    return `Fort ${this.state} · wall ${Math.round(this.wallIntegrity)} · Sherman ${Math.max(0, Math.round(this.sherman.userData.hp))}/${this.sherman.userData.hpMax} · Puma ${Math.max(0, Math.round(this.puma.userData.hp))}/${this.puma.userData.hpMax} · Empire ${this.aliveCount(this.empire)}/${this.empire.length} · Zhuzher ${this.aliveCount(this.zhuzher)}/${this.zhuzher.length}`;
  }
}
