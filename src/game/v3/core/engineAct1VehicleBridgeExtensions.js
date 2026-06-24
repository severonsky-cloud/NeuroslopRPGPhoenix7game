import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { labelSprite } from '../world/props.js';
import { ARSENAL } from '../combat/arsenal.js';
import { createVehicle, updateVehicle, getVehicleHit, applyVehicleDamage, setVehicleDebugVisible } from '../vehicles/ashgraveVehicleLabCore.js';

function removeNode(scene, node) {
  if (!node) return;
  scene.remove(node);
  node.parent?.remove?.(node);
  node.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((mat) => mat?.dispose?.());
    else child.material?.dispose?.();
  });
}

function shotRay(engine, range = 180) {
  const start = new THREE.Vector3();
  const dir = new THREE.Vector3();
  engine.camera.getWorldPosition(start);
  engine.camera.getWorldDirection(dir);
  return { start, end: start.clone().addScaledVector(dir.normalize(), range) };
}

function profileForWeapon(weaponId, weapon = {}) {
  const id = String(weaponId || '').toLowerCase();
  if (id.includes('panzerfaust')) return { id: 'panzerfaustRocket', class: 'antiVehicleRocket', killMethod: 'explosive', damage: 175, penetration: 18, splashRadius: 5.2 };
  if (id.includes('bazooka')) return { id: 'bazookaRocket', class: 'antiVehicleRocket', killMethod: 'explosive', damage: 150, penetration: 16, splashRadius: 4.4 };
  if (id.includes('ptrd') || id.includes('boys')) return { id: 'atRifle', class: 'antiVehicleKinetic', killMethod: 'kinetic', damage: 70, penetration: 9, splashRadius: 0 };
  if (id.includes('mg') || id.includes('bren') || id.includes('bar')) return { id: 'mgBullet', class: 'smallArms', killMethod: 'none', damage: Math.max(12, Math.round((weapon.damage || 14) * 0.75)), penetration: 2, splashRadius: 0 };
  if (id.includes('rifle') || id.includes('garand') || id.includes('k98') || id.includes('mosin') || id.includes('springfield')) return { id: 'rifleRound', class: 'smallArms', killMethod: 'none', damage: Math.max(10, Math.round((weapon.damage || 18) * 0.5)), penetration: 3, splashRadius: 0 };
  return { id: 'smallArms', class: 'smallArms', killMethod: 'none', damage: Math.max(4, Math.round((weapon.damage || 8) * 0.35)), penetration: 1, splashRadius: 0 };
}

function vehicleAlive(vehicle) {
  const d = vehicle?.userData;
  return Boolean(vehicle && d && d.state !== 'destroyed' && d.alive !== false && (d.hp ?? 1) > 0);
}

function markDestroyed(engine, vehicle, result) {
  const data = vehicle.userData;
  data.alive = false;
  data.hp = 0;
  data.source = 'act1Route';
  const s = engine.act1Slice;
  if (s?.vehicle === vehicle) {
    s.vehicleDestroyedBy = result?.kind || 'damage';
    s.vehicleWreckLeft = true;
  }
  engine.log.unshift(`Act 1 vehicle destroyed: ${data.label || data.name || data.vehicleType}. Wreck left on road, loot crates enabled.`);
}

function tryDamageAct1Vehicle(engine, weaponId) {
  const s = engine.act1Slice;
  const vehicle = s?.stage === 3 ? s.vehicle : null;
  if (!vehicleAlive(vehicle) || !vehicle.userData?.labVehicle) return false;
  const weapon = ARSENAL[weaponId] || {};
  const profile = profileForWeapon(weaponId, weapon);
  const { start, end } = shotRay(engine, weapon.range || 180);
  const hit = getVehicleHit(vehicle, start, end);
  if (!hit.hit) return false;
  const result = applyVehicleDamage(vehicle, hit, profile);
  vehicle.userData.alive = vehicle.userData.state !== 'destroyed' && (vehicle.userData.hp ?? 0) > 0;
  const label = vehicle.userData.label || vehicle.userData.name || 'vehicle';
  if (result.kind === 'armorBlocked') {
    engine.hud?.hitMarker?.('ARMOR');
    engine.hud?.setObjective?.(`${label}: броня держит · part ${result.part}. Нужны ракеты, ПТ-ружьё или слабое место.`);
    engine.rpg?.useSkill?.('launchers', 0.25);
  } else if (result.kind === 'destroyed') {
    markDestroyed(engine, vehicle, result);
    engine.hud?.hitMarker?.('DESTROYED');
    engine.hud?.setObjective?.(`${label}: уничтожена. Wreck оставлен, теперь забери зелёные ящики.`);
    engine.rpg?.useSkill?.('launchers', 3.5);
  } else if (result.kind === 'cookOffStarted') {
    engine.hud?.hitMarker?.(`-${result.damage}`);
    engine.hud?.setObjective?.(`${label}: cook-off начался · HP ${result.hp}. Держись подальше.`);
    engine.rpg?.useSkill?.('firearms', 1.0);
  } else if (result.ok) {
    engine.hud?.hitMarker?.(`-${result.damage}`);
    engine.hud?.setObjective?.(`${label}: ${result.part} damaged · HP ${result.hp}/${vehicle.userData.hpMax}.`);
    engine.rpg?.useSkill?.(profile.class === 'antiVehicleRocket' ? 'launchers' : 'firearms', 1.2);
  }
  setVehicleDebugVisible(vehicle, Boolean(engine.entityDebug?.enabled));
  return true;
}

function spawnBridgeVehicle(engine) {
  const s = engine.act1SliceEnsure();
  if (s.spawnedVehicle) return;
  s.spawnedVehicle = true;
  const vehicle = createVehicle('puma', {
    x: s.vehiclePoint.x,
    y: heightAt(s.vehiclePoint.x, s.vehiclePoint.z),
    z: s.vehiclePoint.z,
    yaw: Math.PI * 0.5,
  });
  vehicle.name = 'act1_glm_puma_roadblock';
  vehicle.userData.name = 'Бронемашина Puma у дороги';
  vehicle.userData.id = 'act1_glm_puma_roadblock';
  vehicle.userData.alive = true;
  vehicle.userData.act1Vehicle = true;
  vehicle.userData.source = 'act1Route';
  vehicle.userData.autoHostile = true;
  vehicle.userData.vehicle = true;
  vehicle.userData.ww2BigVehicle = true;
  vehicle.userData.hpMax = vehicle.userData.hpMax || vehicle.userData.hp || 180;
  engine.scene.add(vehicle);
  s.vehicle = vehicle;
  engine.act1LabVehicles = engine.act1LabVehicles || [];
  engine.act1LabVehicles.push(vehicle);
  const label = labelSprite(engine.scene, 'Act 1: GLM Puma · hitboxes', s.vehiclePoint.x, s.vehiclePoint.z, 5.2, 0.56);
  label.userData.act1Vehicle = true;
  label.userData.source = 'act1Route';
  s.labels.push(label);
  engine.labels.push(label);
  engine.log.unshift('Act 1: бронецель заменена на GLM modular Puma with hitboxes/parts/wreck. Ракеты и ПТ-ружья теперь важны.');
}

export function installAct1VehicleBridgeExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__act1VehicleBridgeInstalled) return;
  PhoenixV3Engine.__act1VehicleBridgeInstalled = true;

  PhoenixV3Engine.prototype.act1DamageVehicleFromShot = function act1DamageVehicleFromShot(weaponId) {
    return tryDamageAct1Vehicle(this, weaponId);
  };

  PhoenixV3Engine.prototype.act1SpawnVehicleEncounter = function act1SpawnVehicleEncounterBridge() {
    spawnBridgeVehicle(this);
  };

  const originalClear = PhoenixV3Engine.prototype.act1SliceClear;
  PhoenixV3Engine.prototype.act1SliceClear = function act1SliceClearVehicleBridge(...args) {
    for (const vehicle of this.act1LabVehicles || []) removeNode(this.scene, vehicle);
    this.act1LabVehicles = [];
    return originalClear.call(this, ...args);
  };

  const originalAttack = PhoenixV3Engine.prototype.attack;
  PhoenixV3Engine.prototype.attack = function attackVehicleBridge(...args) {
    const weaponId = this.player?.weapon;
    const weapon = ARSENAL[weaponId];
    const canTry = weapon?.kind === 'gun' && this.act1Slice?.stage === 3 && vehicleAlive(this.act1Slice?.vehicle) && this.cooldown <= 0 && !this.paused && this.mode !== 'boot';
    const result = originalAttack.call(this, ...args);
    if (canTry && this.cooldown > 0) tryDamageAct1Vehicle(this, weaponId);
    return result;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateVehicleBridge(dt) {
    originalUpdate.call(this, dt);
    const vehicle = this.act1Slice?.vehicle;
    if (vehicle?.userData?.labVehicle) {
      setVehicleDebugVisible(vehicle, Boolean(this.entityDebug?.enabled));
      updateVehicle(vehicle, dt, { targetPosition: vehicle.position.clone(), lookAt: this.rig.position, time: performance.now() });
      if (vehicle.userData.state === 'destroyed' || (vehicle.userData.hp ?? 0) <= 0) {
        if (vehicle.userData.alive !== false) markDestroyed(this, vehicle, { kind: 'destroyed' });
        vehicle.userData.alive = false;
      }
    }
  };
}
