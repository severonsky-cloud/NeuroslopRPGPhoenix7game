import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { createVehicle } from '../vehicles/ashgraveVehicleLabCore.js';
import { createVehicleCombatActor, spawnVehicleLoot, getVehicleCombatDebugInfo } from '../vehicles/vehicleCombatActor.js';
import { VehicleCombatSystem, getWeaponVehicleProfile } from '../vehicles/vehicleCombatSystem.js';

function makeQuestCrate(engine, crateInfo, index = 0) {
  const group = new THREE.Group();
  group.name = crateInfo.id || `vehicle_loot_crate_${Date.now()}_${index}`;

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.65, 0.78),
    new THREE.MeshStandardMaterial({ color: 0x31522b, roughness: 0.85, metalness: 0.08 }),
  );
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.12, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x4c7b36, roughness: 0.8, metalness: 0.05 }),
  );
  lid.position.y = 0.38;
  group.add(box, lid);

  const p = crateInfo.position || { x: 0, y: 0, z: 0 };
  const y = Number.isFinite(p.y) ? p.y : heightAt(p.x, p.z) + 0.38;
  group.position.set(p.x, y, p.z);
  group.userData = {
    id: crateInfo.id || group.name,
    source: 'VehicleCombatActor',
    act1LootCrate: true,
    questTag: crateInfo.questTag || 'act1_green_crates',
    interactable: true,
    collected: false,
    alive: true,
  };
  group.traverse?.((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
    child.userData = child.userData || {};
    child.userData.parentCrate = group;
    child.userData.act1LootCrate = true;
  });
  engine.scene?.add(group);
  return group;
}

function spawnVehicleActorLootForAct1(engine, actor) {
  const s = engine.act1Slice;
  if (!s || actor.__act1LootSpawned) return [];

  const loot = spawnVehicleLoot(actor, actor.lootCount || 3);
  const crates = loot.map((crate, i) => makeQuestCrate(engine, crate, i));
  actor.__act1LootSpawned = true;
  s.crates = crates;
  s.cratesCollected = 0;
  s.cratesNeeded = crates.length || 3;
  s.stage = Math.max(s.stage || 0, 3);
  s.vehicleWreckLeft = true;
  s.vehicleDestroyedBy = actor.lastDamageReason || 'VehicleCombatActor';
  engine.hud?.setObjective?.('Бронецель уничтожена. Забери зелёные ящики рядом с wreck.');
  engine.log?.unshift?.('VehicleCombatActor: бронецель уничтожена, ящики выброшены рядом с wreck.');
  return crates;
}

function syncActorToLegacyAct1Vehicle(engine, actor) {
  if (!engine.act1Slice || !actor?.root) return;
  const root = actor.root;
  root.userData = root.userData || {};
  root.userData.act1Vehicle = true;
  root.userData.labVehicle = true;
  root.userData.source = 'VehicleCombatActor';
  root.userData.hp = actor.hp;
  root.userData.hpMax = actor.hpMax;
  root.userData.armor = actor.armor;
  root.userData.state = actor.state;
  root.userData.alive = !['destroyed', 'wreck'].includes(actor.state);
  root.userData.combatActor = actor;
  root.userData.lastHitPart = actor.lastHitPart;
  root.userData.lastDamageReason = actor.lastDamageReason;
  engine.act1Slice.vehicle = root;
  engine.act1Slice.vehicleCombatActor = actor;
}

function createAct1VehicleCombatActor(engine, type = 'puma', options = {}) {
  const position = options.position || new THREE.Vector3(0, heightAt(0, -72), -72);
  const root = createVehicle(type, {
    x: position.x,
    y: position.y,
    z: position.z,
    yaw: options.yaw ?? Math.PI * 0.5,
  });

  if (!root.parent) engine.scene?.add(root);
  const actor = createVehicleCombatActor(type, {
    id: options.id || 'act1_vehicle_puma',
    model: root,
    root,
    faction: options.faction || 'hostile',
    questTags: options.questTags || ['act1', 'act1_puma', 'roadblock'],
    hpMax: options.hpMax ?? 280,
  });
  actor.root = root;
  actor.model = root;
  VehicleCombatSystem.register(actor);
  syncActorToLegacyAct1Vehicle(engine, actor);
  return actor;
}

function bindVehicleCombatEvents(engine) {
  if (engine.__vehicleCombatEventsBound) return;
  engine.__vehicleCombatEventsBound = true;

  VehicleCombatSystem.on('vehicleHit', ({ actor, result }) => {
    if (!actor) return;
    syncActorToLegacyAct1Vehicle(engine, actor);
    const blocked = result?.blocked || result?.type === 'vehicleArmorBlocked';
    engine.hud?.hitMarker?.(blocked ? 'PING' : `-${Math.ceil(result?.damage || 0)}`);
    engine.hud?.setObjective?.(blocked
      ? `Броня держит: ${actor.type} · HP ${Math.ceil(actor.hp)}/${actor.hpMax}`
      : `Попадание: ${actor.type} · ${result?.part || actor.lastHitPart || 'hull'} · HP ${Math.ceil(actor.hp)}/${actor.hpMax}`);
  });

  VehicleCombatSystem.on('vehicleArmorBlocked', ({ actor }) => {
    if (!actor) return;
    syncActorToLegacyAct1Vehicle(engine, actor);
    engine.hud?.hitMarker?.('PING');
    engine.hud?.setObjective?.(`Броня держит. Нужны PTRD/Boys или Bazooka/Panzerfaust. HP ${Math.ceil(actor.hp)}/${actor.hpMax}`);
  });

  VehicleCombatSystem.on('vehicleImmobilized', ({ actor }) => {
    if (!actor) return;
    syncActorToLegacyAct1Vehicle(engine, actor);
    engine.hud?.setObjective?.(`Техника обездвижена: ${actor.type}. Добей бронецель.`);
  });

  VehicleCombatSystem.on('vehicleBurning', ({ actor }) => {
    if (!actor) return;
    syncActorToLegacyAct1Vehicle(engine, actor);
    engine.hud?.setObjective?.(`Техника горит: ${actor.type}. Держись на расстоянии.`);
  });

  VehicleCombatSystem.on('vehicleDestroyed', ({ actor }) => {
    if (!actor) return;
    syncActorToLegacyAct1Vehicle(engine, actor);
    if (actor.questTags?.includes('act1') || actor.questTags?.includes('act1_puma') || actor.id === 'act1_vehicle_puma') {
      spawnVehicleActorLootForAct1(engine, actor);
    }
  });
}

function patchAct1SpawnVehicle(PhoenixV3Engine) {
  if (PhoenixV3Engine.__vehicleCombatAct1SpawnPatched) return;
  PhoenixV3Engine.__vehicleCombatAct1SpawnPatched = true;
  const originalSpawn = PhoenixV3Engine.prototype.act1SpawnVehicleEncounter;
  PhoenixV3Engine.prototype.act1SpawnVehicleEncounter = function act1SpawnVehicleCombatEncounter(...args) {
    const s = this.act1Slice;
    if (!s) return originalSpawn?.call(this, ...args);
    if (s.vehicleCombatActor && !['destroyed', 'wreck'].includes(s.vehicleCombatActor.state)) return s.vehicleCombatActor;
    const p = s.vehiclePoint || { x: 0, z: -72 };
    const position = new THREE.Vector3(p.x ?? 0, heightAt(p.x ?? 0, p.z ?? -72), p.z ?? -72);
    const actor = createAct1VehicleCombatActor(this, 'puma', { id: 'act1_vehicle_puma', position, yaw: Math.PI * 0.5 });
    s.spawnedVehicle = true;
    s.vehicleDestroyedBy = null;
    this.hud?.setObjective?.('Бронецель: Puma VehicleCombatActor. Small arms дают ping, Bazooka/PTRD пробивают.');
    return actor;
  };
}

function patchDebugDiagnostics(engine) {
  engine.getVehicleCombatDiagnostics = () => VehicleCombatSystem.diagnostics();
  engine.damageAct1VehicleDebug = (weaponId = 'bazooka') => {
    const actor = engine.act1Slice?.vehicleCombatActor;
    if (!actor) return { ok: false, reason: 'no_act1_vehicle_actor' };
    const profile = getWeaponVehicleProfile(weaponId);
    const result = VehicleCombatSystem.applyWeaponShot({ weaponId, camera: engine.camera, scene: engine.scene, player: engine.player, source: 'debug', weaponProfile: profile });
    return { ok: true, result, actor: getVehicleCombatDebugInfo(actor) };
  };
}

export function installVehicleCombatExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__vehicleCombatInstalled) return;
  PhoenixV3Engine.__vehicleCombatInstalled = true;
  patchAct1SpawnVehicle(PhoenixV3Engine);

  const originalBoot = PhoenixV3Engine.prototype.boot;
  PhoenixV3Engine.prototype.boot = function bootVehicleCombat(...args) {
    const result = originalBoot.call(this, ...args);
    this.vehicleCombatSystem = VehicleCombatSystem;
    VehicleCombatSystem.configure({ scene: this.scene });
    bindVehicleCombatEvents(this);
    patchDebugDiagnostics(this);
    console.log('[VehicleCombat] installed on PhoenixV3Engine');
    return result;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateVehicleCombat(dt) {
    originalUpdate.call(this, dt);
    VehicleCombatSystem.configure({ scene: this.scene });
    VehicleCombatSystem.update(dt, { engine: this });
    const actor = this.act1Slice?.vehicleCombatActor;
    if (actor) {
      syncActorToLegacyAct1Vehicle(this, actor);
      if (this.act1Slice?.stage === 3 && !['destroyed', 'wreck'].includes(actor.state)) {
        this.hud?.showPrompt?.(`VehicleCombatActor ${actor.type}: ${Math.ceil(actor.hp)}/${actor.hpMax} · ${actor.state} · last ${actor.lastHitPart || '-'}`);
      }
    }
  };

  const originalAttack = PhoenixV3Engine.prototype.attack;
  PhoenixV3Engine.prototype.attack = function attackVehicleCombat(...args) {
    const weaponId = this.player?.weapon;
    const result = originalAttack.call(this, ...args);
    if (this.act1Slice?.stage === 3 || VehicleCombatSystem.actors.size > 0) {
      VehicleCombatSystem.applyWeaponShot({ weaponId, camera: this.camera, scene: this.scene, player: this.player, source: 'player' });
    }
    return result;
  };

  const originalAltWeaponAttack = PhoenixV3Engine.prototype.altWeaponAttack;
  PhoenixV3Engine.prototype.altWeaponAttack = function altWeaponAttackVehicleCombat(...args) {
    const weaponId = this.player?.weapon;
    const result = originalAltWeaponAttack.call(this, ...args);
    if (this.act1Slice?.stage === 3 || VehicleCombatSystem.actors.size > 0) {
      VehicleCombatSystem.applyWeaponShot({ weaponId, camera: this.camera, scene: this.scene, player: this.player, source: 'player_alt' });
    }
    return result;
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionVehicleCombat(code, event) {
    if (code === 'KeyQ' && this.act1Slice?.stage === 3 && this.act1Slice?.vehicleCombatActor) {
      VehicleCombatSystem.applyWeaponShot({ weaponId: 'debug', camera: this.camera, scene: this.scene, player: this.player, source: 'debug_q', weaponProfile: getWeaponVehicleProfile('debug') });
      event?.preventDefault?.();
      return;
    }
    return originalOnAction.call(this, code, event);
  };
}
