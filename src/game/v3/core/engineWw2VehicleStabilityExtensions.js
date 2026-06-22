import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';

function isVehicle(obj) {
  const u = obj?.userData || {};
  return Boolean(u.vehicle || u.ww2BigVehicle || u.vehicleArmor || String(u.archetype || '').includes('Vehicle'));
}

function cleanupHumanRig(obj) {
  const rig = obj.getObjectByName?.('actor_visual_rig');
  if (!rig) return;
  obj.remove(rig);
  rig.traverse?.((node) => {
    node.geometry?.dispose?.();
    if (Array.isArray(node.material)) node.material.forEach((mat) => mat?.dispose?.());
    else node.material?.dispose?.();
  });
  obj.userData.visualRig = null;
}

function ensureVisible(obj) {
  obj.traverse?.((node) => {
    if (node.isMesh && node.name !== 'npc_weapon') {
      node.visible = true;
      node.userData.keepVisible = true;
    }
  });
}

function yawOnlyTowards(obj, x, z) {
  const dx = x - obj.position.x;
  const dz = z - obj.position.z;
  if (Math.hypot(dx, dz) < 0.01) return;
  obj.rotation.set(0, Math.atan2(dx, dz), 0);
}

function stabilize(obj, engine, dt) {
  cleanupHumanRig(obj);
  ensureVisible(obj);
  const u = obj.userData || {};
  obj.position.y = heightAt(obj.position.x, obj.position.z);
  if (Number.isFinite(u.x) && Number.isFinite(u.z)) obj.position.set(u.x, heightAt(u.x, u.z), u.z);

  if (u.ww2BigVehicle || u.ww2LiveTarget) {
    yawOnlyTowards(obj, engine.rig.position.x, engine.rig.position.z);
  } else if (u.target === 'player' || u.autoHostile) {
    yawOnlyTowards(obj, engine.rig.position.x, engine.rig.position.z);
  } else {
    obj.rotation.x = 0;
    obj.rotation.z = 0;
  }

  obj.userData.vehicleWheelSpin = (obj.userData.vehicleWheelSpin || 0) + dt * Math.min(4, Math.max(0.5, obj.userData.speed || 0.6));
  obj.traverse?.((node) => {
    const name = String(node.name || '').toLowerCase();
    if (name.includes('wheel')) node.rotation.x = obj.userData.vehicleWheelSpin;
  });
}

export function installWw2VehicleStabilityExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__ww2VehicleStabilityInstalled) return;
  PhoenixV3Engine.__ww2VehicleStabilityInstalled = true;

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithStableVehicles(dt) {
    originalUpdate.call(this, dt);
    if (this.mode === 'boot') return;
    for (const obj of this.monsters || []) {
      if (isVehicle(obj)) stabilize(obj, this, dt);
    }
  };
}
