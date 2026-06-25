import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { ARSENAL } from '../combat/arsenal.js';

const raycaster = new THREE.Raycaster();
const pointerCenter = new THREE.Vector2(0, 0);

function getVehicle(engine) {
  const vehicle = engine.act1Slice?.vehicle;
  return vehicle?.userData?.act1Vehicle ? vehicle : null;
}

function isDestroyed(vehicle) {
  const d = vehicle?.userData || {};
  return d.alive === false || d.state === 'destroyed' || (d.hp ?? 1) <= 0;
}

function weaponVehicleDamage(engine, weaponId) {
  const w = ARSENAL[weaponId] || {};
  const id = String(weaponId || '').toLowerCase();
  if (id.includes('bazooka') || id.includes('panzerfaust') || w.ammoType === 'rocketAT') return { amount: 120, tag: 'rocket hit' };
  if (id.includes('ptrd') || id.includes('boys') || w.ammoType === 'rifle145') return { amount: 55, tag: 'AT rifle hit' };
  if (id.includes('mg') || id.includes('bren') || id.includes('bar')) return { amount: 14, tag: 'machine-gun chip' };
  if (w.kind === 'gun') return { amount: Math.max(3, Math.round((w.damage || 8) * 0.28)), tag: 'small-arms chip' };
  return { amount: 18, tag: 'impact' };
}

function raycastVehicle(engine, vehicle) {
  if (!vehicle) return null;
  raycaster.setFromCamera(pointerCenter, engine.camera);
  raycaster.far = 190;
  const hits = raycaster.intersectObject(vehicle, true).filter((hit) => hit.object?.visible !== false);
  if (hits.length) return hits[0];

  // Fallback for giant/procedural bodies where child bounds are odd: use a big sphere around the vehicle.
  const start = new THREE.Vector3();
  const dir = new THREE.Vector3();
  engine.camera.getWorldPosition(start);
  engine.camera.getWorldDirection(dir).normalize();
  const center = new THREE.Vector3();
  vehicle.getWorldPosition(center);
  center.y += 1.45;
  const to = center.clone().sub(start);
  const distance = to.length();
  const angle = dir.angleTo(to.normalize());
  if (distance < 180 && angle < 0.34) return { point: center, distance, object: vehicle, fallbackSphere: true };
  return null;
}

function spreadCrates(engine) {
  const s = engine.act1Slice;
  const vehicle = getVehicle(engine);
  if (!s?.crates?.length || !vehicle) return;
  const base = vehicle.position.clone();
  const spots = [
    new THREE.Vector3(base.x - 4.8, 0, base.z + 3.2),
    new THREE.Vector3(base.x - 2.2, 0, base.z + 5.0),
    new THREE.Vector3(base.x + 2.8, 0, base.z + 4.6),
  ];
  s.crates.forEach((crate, i) => {
    if (!crate || crate.userData?.collected || crate.userData?.repairSpread) return;
    const p = spots[i % spots.length];
    crate.position.set(p.x, heightAt(p.x, p.z) + 0.38, p.z);
    crate.visible = true;
    crate.userData.repairSpread = true;
    crate.userData.source = 'act1Route';
    crate.userData.act1LootCrate = true;
  });
}

function forceVehicleDestroyed(engine, vehicle, reason = 'vehicle target repair') {
  if (!vehicle) return false;
  const d = vehicle.userData;
  d.hpMax = d.hpMax || 180;
  d.hp = 0;
  d.alive = false;
  d.state = 'destroyed';
  d.destroyReason = reason;
  d.keepWreck = true;
  vehicle.traverse?.((child) => {
    child.userData = child.userData || {};
    child.userData.alive = false;
    child.visible = true;
  });
  const s = engine.act1Slice;
  if (s?.vehicle === vehicle) {
    s.stage = Math.max(s.stage || 0, 3);
    s.vehicleWreckLeft = true;
    s.vehicleDestroyedBy = reason;
    engine.act1SpawnCrates?.();
    spreadCrates(engine);
  }
  engine.hud?.hitMarker?.('DESTROYED');
  engine.hud?.setObjective?.('Бронецель уничтожена. Ящики выброшены рядом с wreck — подойди и нажми E.');
  engine.log?.unshift?.('Vehicle target repair: Puma destroyed state synced, crates spread around wreck.');
  return true;
}

function damageVehicleByTarget(engine, reason = 'target repair shot', forcedWeaponId = null) {
  const vehicle = getVehicle(engine);
  if (!vehicle || engine.act1Slice?.stage !== 3) return false;
  if (isDestroyed(vehicle)) return forceVehicleDestroyed(engine, vehicle, 'dead-state sync');
  const hit = raycastVehicle(engine, vehicle);
  if (!hit) return false;
  const weaponId = forcedWeaponId || engine.player?.weapon;
  const profile = weaponVehicleDamage(engine, weaponId);
  const d = vehicle.userData;
  d.hpMax = d.hpMax || d.hp || 180;
  d.hp = Math.max(0, (d.hp ?? d.hpMax) - profile.amount);
  d.lastTargetRepairHitT = performance.now();
  engine.hud?.hitMarker?.(`-${profile.amount}`);
  engine.hud?.setObjective?.(`Попадание по Puma: ${profile.tag} · HP ${Math.ceil(d.hp)}/${d.hpMax}.`);
  engine.log?.unshift?.(`Vehicle target repair: ${profile.tag}, hp ${Math.ceil(d.hp)}/${d.hpMax}.`);
  if (d.hp <= 0) forceVehicleDestroyed(engine, vehicle, reason);
  return true;
}

function syncVehicleStage(engine) {
  const s = engine.act1Slice;
  const vehicle = getVehicle(engine);
  if (!s?.active || s.stage !== 3 || !vehicle) return;
  if (isDestroyed(vehicle)) {
    forceVehicleDestroyed(engine, vehicle, 'state sync');
    return;
  }
  const d = vehicle.userData;
  d.hpMax = d.hpMax || d.hp || 180;
  engine.hud?.showPrompt?.(`Puma HP ${Math.ceil(d.hp)}/${d.hpMax} · hitbox raycast активен · Q = аварийный удар`);
}

export function installAct1VehicleTargetRepairExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__act1VehicleTargetRepairInstalled) return;
  PhoenixV3Engine.__act1VehicleTargetRepairInstalled = true;

  const originalSpawnCrates = PhoenixV3Engine.prototype.act1SpawnCrates;
  PhoenixV3Engine.prototype.act1SpawnCrates = function act1SpawnCratesVehicleTargetRepair(...args) {
    const result = originalSpawnCrates?.call(this, ...args);
    spreadCrates(this);
    return result;
  };

  const originalAttack = PhoenixV3Engine.prototype.attack;
  PhoenixV3Engine.prototype.attack = function attackVehicleTargetRepair(...args) {
    const weaponId = this.player?.weapon;
    const result = originalAttack.call(this, ...args);
    if (this.act1Slice?.stage === 3) damageVehicleByTarget(this, 'primary target raycast', weaponId);
    return result;
  };

  const originalAlt = PhoenixV3Engine.prototype.altWeaponAttack;
  PhoenixV3Engine.prototype.altWeaponAttack = function altVehicleTargetRepair(...args) {
    const result = originalAlt.call(this, ...args);
    if (this.act1Slice?.stage === 3) damageVehicleByTarget(this, 'alt target raycast', this.player?.weapon);
    return result;
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionVehicleTargetRepair(code, event) {
    if (code === 'KeyQ' && this.act1Slice?.stage === 3) {
      const vehicle = getVehicle(this);
      if (isDestroyed(vehicle)) { forceVehicleDestroyed(this, vehicle, 'Q dead-state sync'); event?.preventDefault?.(); return; }
      if (damageVehicleByTarget(this, 'Q emergency hit', this.player?.weapon)) { event?.preventDefault?.(); return; }
    }
    return originalOnAction.call(this, code, event);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateVehicleTargetRepair(dt) {
    originalUpdate.call(this, dt);
    syncVehicleStage(this);
    spreadCrates(this);
  };
}
