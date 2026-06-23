import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { labelSprite, makeMat } from '../world/props.js';
import { createMonster } from '../entities/monster.js';

function bindClose(engine) {
  document.getElementById('closeMapBtn')?.addEventListener('click', () => engine.closePausePanel());
}

function near2D(a, b, radius) {
  return Math.hypot(a.x - b.x, a.z - b.z) <= radius;
}

function makeMarker(scene, pos, color = 0xd7a94c, name = 'route_marker') {
  const group = new THREE.Group();
  group.name = name;
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.45, metalness: 0.1 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.22, 12), mat);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.0, 8), mat);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.08), mat);
  base.position.y = 0.11;
  pole.position.y = 1.1;
  sign.position.y = 2.0;
  group.add(base, pole, sign);
  group.position.set(pos.x, heightAt(pos.x, pos.z) + 0.03, pos.z);
  scene.add(group);
  return group;
}

function makeLootCrate(scene, pos, index = 0) {
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.52, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x3e7b43, emissive: 0x163f1b, emissiveIntensity: 0.3, roughness: 0.82, metalness: 0.08 }),
  );
  crate.name = `act1_route_loot_crate_${index}`;
  crate.position.set(pos.x + (Math.random() - 0.5) * 2.5, heightAt(pos.x, pos.z) + 0.35, pos.z + (Math.random() - 0.5) * 2.5);
  crate.castShadow = true;
  crate.receiveShadow = true;
  crate.userData.act1LootCrate = true;
  crate.userData.collected = false;
  scene.add(crate);
  return crate;
}

function makeCampTable(scene, pos) {
  const group = new THREE.Group();
  group.name = 'act1_route_camp_table';
  const wood = makeMat(0x654224, { roughness: 0.92, metalness: 0.02 });
  const cloth = makeMat(0x543729, { roughness: 0.88 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 1.2), wood);
  top.position.y = 0.78;
  const map = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.035, 0.82), cloth);
  map.position.y = 0.91;
  group.add(top, map);
  for (const x of [-1.05, 1.05]) for (const z of [-0.42, 0.42]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.12), wood);
    leg.position.set(x, 0.38, z);
    group.add(leg);
  }
  group.position.set(pos.x, heightAt(pos.x, pos.z), pos.z);
  scene.add(group);
  return group;
}

function routePoint(base, dx, dz) {
  return new THREE.Vector3(base.x + dx, heightAt(base.x + dx, base.z + dz), base.z + dz);
}

function alive(list) {
  return list.filter((obj) => obj?.userData?.alive !== false && (obj.userData.hp ?? 1) > 0);
}

function stageTitle(stage) {
  return [
    'Забери заказ у старосты маршрута',
    'Иди по дороге к засаде',
    'Разбей засаду на дороге',
    'Уничтожь бронецель и забери ящики',
    'Вернись к старосте маршрута',
    'Маршрут пройден',
  ][stage] || 'Маршрут первого акта';
}

function stageText(state) {
  if (!state?.active) return 'F2 — начать готовый срез первого акта.';
  if (state.stage === 0) return 'Подойди к столу старосты и нажми E, чтобы взять заказ на дорожный проход.';
  if (state.stage === 1) return 'Иди к дорожному маркеру. По пути проверь оружие, инвентарь I и журнал J.';
  if (state.stage === 2) return `Засада: осталось ${alive(state.raiders).length} врагов.`;
  if (state.stage === 3) return `Бронецель: ${state.vehicle?.userData?.alive === false ? 'уничтожена' : 'жива'} · ящики ${state.cratesCollected}/${state.cratesNeeded}.`;
  if (state.stage === 4) return `Вернись к столу старосты. Ящики: ${state.cratesCollected}/${state.cratesNeeded}.`;
  return 'Готово: первый проход можно закрывать или переиграть через F2.';
}

export function installAct1SliceExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__act1SliceInstalled) return;
  PhoenixV3Engine.__act1SliceInstalled = true;

  PhoenixV3Engine.prototype.act1SliceEnsure = function act1SliceEnsure() {
    if (!this.act1Slice) {
      this.act1Slice = {
        active: false,
        stage: 0,
        markers: [],
        labels: [],
        raiders: [],
        crates: [],
        vehicle: null,
        cratesCollected: 0,
        cratesNeeded: 3,
        completed: false,
        spawnedRaiders: false,
        spawnedVehicle: false,
        lastHintT: 0,
      };
    }
    return this.act1Slice;
  };

  PhoenixV3Engine.prototype.act1SliceClear = function act1SliceClear() {
    const s = this.act1SliceEnsure();
    for (const obj of [...s.markers, ...s.labels, ...s.crates]) this.scene.remove(obj);
    for (const obj of s.raiders) {
      obj.userData.alive = false;
      this.scene.remove(obj);
      this.monsters = this.monsters.filter((m) => m !== obj);
    }
    if (s.vehicle) {
      s.vehicle.userData.alive = false;
      this.scene.remove(s.vehicle);
      this.monsters = this.monsters.filter((m) => m !== s.vehicle);
    }
    this.act1Slice = null;
  };

  PhoenixV3Engine.prototype.act1SliceStart = function act1SliceStart({ teleport = true } = {}) {
    this.act1SliceClear();
    const s = this.act1SliceEnsure();
    const base = this.rig.position.clone();
    if (teleport) {
      base.set(8, heightAt(8, 8), 8);
      this.rig.position.copy(base);
      this.yaw = Math.PI;
    }
    s.active = true;
    s.stage = 0;
    s.completed = false;
    s.camp = routePoint(base, 0, -7);
    s.road = routePoint(base, 0, -34);
    s.ambush = routePoint(base, 8, -56);
    s.vehiclePoint = routePoint(base, -3, -86);
    s.returnPoint = s.camp.clone();
    const points = [
      ['Староста маршрута', s.camp, 0xd7a94c],
      ['Дорожный знак', s.road, 0xbca17a],
      ['Засада', s.ambush, 0xb34c36],
      ['Бронецель', s.vehiclePoint, 0x78a6b8],
    ];
    for (const [name, pos, color] of points) {
      s.markers.push(makeMarker(this.scene, pos, color, `act1_${name}`));
      const label = labelSprite(this.scene, name, pos.x, pos.z, 3.1, 0.48);
      s.labels.push(label);
      this.labels.push(label);
    }
    s.markers.push(makeCampTable(this.scene, s.camp));
    this.log.unshift('Act 1 Slice: маршрут открыт — староста, дорога, засада, бронецель, возврат с лутом.');
    this.hud.setObjective('Act 1 Slice открыт: иди к столу старосты и нажми E.');
  };

  PhoenixV3Engine.prototype.act1SpawnRaiders = function act1SpawnRaiders() {
    const s = this.act1SliceEnsure();
    if (s.spawnedRaiders) return;
    s.spawnedRaiders = true;
    const pack = [
      { id: 'act1_bandit_rifle_1', name: 'Дорожный стрелок', archetype: 'brute', faction: 'bandits', hp: 72, damage: 8, speed: 2.2, autoHostile: true, x: s.ambush.x - 4, z: s.ambush.z + 2 },
      { id: 'act1_bandit_smg_1', name: 'Бандит с ПП', archetype: 'brute', faction: 'bandits', hp: 66, damage: 7, speed: 2.5, autoHostile: true, x: s.ambush.x + 2, z: s.ambush.z - 3 },
      { id: 'act1_bandit_shotgun_1', name: 'Окопный грабитель', archetype: 'brute', faction: 'bandits', hp: 82, damage: 10, speed: 1.9, autoHostile: true, x: s.ambush.x + 6, z: s.ambush.z + 3 },
    ];
    for (const data of pack) {
      const obj = createMonster(this.scene, data);
      s.raiders.push(obj);
      this.monsters.push(obj);
      const label = labelSprite(this.scene, data.name, data.x, data.z, 2.7, 0.4);
      s.labels.push(label);
      this.labels.push(label);
    }
    this.armedWorld?.build?.();
    this.hud.setObjective('Засада! Разбей бандитов и проверь лут/патроны.');
  };

  PhoenixV3Engine.prototype.act1SpawnVehicleEncounter = function act1SpawnVehicleEncounter() {
    const s = this.act1SliceEnsure();
    if (s.spawnedVehicle) return;
    s.spawnedVehicle = true;
    const data = {
      id: 'act1_puma_roadblock', name: 'Бронемашина у дороги', archetype: 'armoredVehicle', faction: 'bandits',
      hp: 260, damage: 14, speed: 0.55, autoHostile: true, vehicle: true, vehicleArmor: 12, explosiveDeath: true,
      x: s.vehiclePoint.x, z: s.vehiclePoint.z,
    };
    const obj = createMonster(this.scene, data);
    obj.userData.ww2BigVehicle = true;
    obj.userData.act1Vehicle = true;
    s.vehicle = obj;
    this.monsters.push(obj);
    const label = labelSprite(this.scene, 'Act 1: бронецель', data.x, data.z, 4.8, 0.52);
    s.labels.push(label);
    this.labels.push(label);
    this.armedWorld?.build?.();
    this.hud.setObjective('Бронецель впереди. Используй Bazooka/Panzerfaust/PTRD/Boys AT, затем собери ящики.');
  };

  PhoenixV3Engine.prototype.act1SpawnCrates = function act1SpawnCrates() {
    const s = this.act1SliceEnsure();
    if (s.crates.length) return;
    const p = s.vehicle?.position || s.vehiclePoint;
    for (let i = 0; i < s.cratesNeeded; i += 1) s.crates.push(makeLootCrate(this.scene, p, i));
    this.hud.setObjective('Бронецель уничтожена. Подбери зелёные ящики клавишей E.');
  };

  PhoenixV3Engine.prototype.act1TryInteract = function act1TryInteract() {
    const s = this.act1SliceEnsure();
    if (!s.active) return false;
    const pos = this.rig.position;
    if (s.stage === 0 && near2D(pos, s.camp, 5.4)) {
      s.stage = 1;
      this.inventory.addAmmo('rocketAT', 2);
      this.inventory.addAmmo('rifle145', 5);
      this.hud.setObjective('Заказ взят: проверь I, затем иди к дорожному знаку. Выдали rocketAT ×2 и ПТ-патроны.');
      this.log.unshift('Староста маршрута: расчисти дорогу, забери ящики с бронецели и вернись.');
      return true;
    }
    if (s.stage === 3) {
      const crate = s.crates.find((c) => !c.userData.collected && near2D(pos, c.position, 3.0));
      if (crate) {
        crate.userData.collected = true;
        crate.visible = false;
        s.cratesCollected += 1;
        this.player.credits += 20;
        this.inventory.addAmmo('rifle792', 6);
        this.inventory.addAmmo('pistol9', 8);
        this.hud.setObjective(`Ящик взят: ${s.cratesCollected}/${s.cratesNeeded}. +20 кредитов, патроны.`);
        if (s.cratesCollected >= s.cratesNeeded) s.stage = 4;
        return true;
      }
    }
    if (s.stage === 4 && near2D(pos, s.camp, 5.4)) {
      s.stage = 5;
      s.completed = true;
      this.player.credits += 180;
      this.inventory.addAmmo('rocketAT', 1);
      this.inventory.addAmmo('scatter', 8);
      this.rpg?.useSkill?.('speech', 2.2);
      this.log.unshift('Act 1 Slice завершён: дорога очищена, бронецель уничтожена, ящики сданы.');
      this.hud.setObjective('Маршрут пройден. Награда: 180 кредитов, ракета, дробь, опыт речи. Можно переиграть F2.');
      return true;
    }
    return false;
  };

  PhoenixV3Engine.prototype.act1SliceUpdate = function act1SliceUpdate(dt) {
    const s = this.act1SliceEnsure();
    if (!s.active || this.mode === 'boot') return;
    const pos = this.rig.position;
    if (s.stage === 1 && near2D(pos, s.road, 7.0)) {
      s.stage = 2;
      this.act1SpawnRaiders();
    }
    if (s.stage === 2 && s.spawnedRaiders && alive(s.raiders).length === 0) {
      s.stage = 3;
      this.act1SpawnVehicleEncounter();
    }
    if (s.stage === 3 && s.vehicle && (s.vehicle.userData.alive === false || (s.vehicle.userData.hp || 0) <= 0)) this.act1SpawnCrates();
    if (performance.now() - (s.lastHintT || 0) > 4500) {
      s.lastHintT = performance.now();
      this.hud.setObjective(stageText(s));
    }
    for (const marker of s.markers) {
      if (marker.name?.includes('route_camp_table')) continue;
      marker.rotation.y += dt * 0.45;
    }
  };

  PhoenixV3Engine.prototype.act1SliceJournalHtml = function act1SliceJournalHtml() {
    const s = this.act1SliceEnsure();
    return `<h2>Act 1: дорожный срез</h2>
      <p><b>${stageTitle(s.stage)}</b></p>
      <p>${stageText(s)}</p>
      <div class="line"><b>Цикл:</b> поселение → дорога → бой → бронецель → лут → возврат.</div>
      <div class="line"><b>Ящики:</b> ${s.cratesCollected}/${s.cratesNeeded}</div>
      <div class="line"><b>F2</b> — начать/перезапустить срез. <b>F3</b> — телепорт к текущей цели для теста.</div>`;
  };

  PhoenixV3Engine.prototype.act1TeleportObjective = function act1TeleportObjective() {
    const s = this.act1SliceEnsure();
    if (!s.active) { this.act1SliceStart(); return; }
    const target = s.stage <= 0 ? s.camp : s.stage === 1 ? s.road : s.stage === 2 ? s.ambush : s.stage === 3 ? s.vehiclePoint : s.camp;
    this.rig.position.set(target.x + 2, heightAt(target.x + 2, target.z + 2), target.z + 2);
    this.hud.setObjective('Телепорт к текущей цели среза.');
  };

  const originalStart = PhoenixV3Engine.prototype.start;
  PhoenixV3Engine.prototype.start = function startAct1SliceReady() {
    originalStart.call(this);
    if (new URLSearchParams(window.location.search).has('act1')) this.act1SliceStart({ teleport: true });
    else this.hud.setObjective('F2 — готовый Act 1 срез: поселение → дорога → бой → техника → лут → возврат.');
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionAct1Slice(code, event) {
    if (code === 'F2') { event?.preventDefault?.(); this.act1SliceStart({ teleport: true }); return; }
    if (code === 'F3') { event?.preventDefault?.(); this.act1TeleportObjective(); return; }
    if (code === 'KeyE' && this.act1TryInteract?.()) return;
    return originalOnAction.call(this, code, event);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateAct1Slice(dt) {
    originalUpdate.call(this, dt);
    if (!this.paused) this.act1SliceUpdate(dt);
  };

  const originalOpenJournal = PhoenixV3Engine.prototype.openJournal;
  PhoenixV3Engine.prototype.openJournal = function openJournalAct1Slice() {
    if (this.act1Slice?.active) {
      this.paused = true;
      this.hud.openPanel(`${this.act1SliceJournalHtml()}<p><button id="closeMapBtn">Закрыть</button></p>`);
      bindClose(this);
      return;
    }
    return originalOpenJournal.call(this);
  };
}
