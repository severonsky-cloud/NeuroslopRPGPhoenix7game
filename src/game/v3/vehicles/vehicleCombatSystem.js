import * as THREE from '../vendor/three.module.js';
import { damageVehicleCombatActor, updateVehicleCombatActor, getVehicleCombatDebugInfo } from './vehicleCombatActor.js';

class EventBus {
  constructor() { this.listeners = new Map(); }
  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(cb);
    return () => this.off(event, cb);
  }
  off(event, cb) { this.listeners.get(event)?.delete(cb); }
  emit(event, data) {
    for (const cb of this.listeners.get(event) || []) {
      try { cb(data); }
      catch (err) { console.warn('[VehicleCombatSystem] listener failed', event, err); }
    }
  }
}

const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

export const WEAPON_PROFILES = {
  m1911: { damage: 8, penetration: 5, preferredPart: 'hull', category: 'small_arms' },
  pistol: { damage: 8, penetration: 5, preferredPart: 'hull', category: 'small_arms' },
  smg: { damage: 7, penetration: 8, preferredPart: 'hull', category: 'small_arms' },
  rifle: { damage: 24, penetration: 25, preferredPart: 'hull', category: 'small_arms' },
  mg: { damage: 18, penetration: 22, preferredPart: 'wheels', category: 'machine_gun' },
  bar: { damage: 16, penetration: 20, preferredPart: 'wheels', category: 'machine_gun' },
  bren: { damage: 16, penetration: 20, preferredPart: 'wheels', category: 'machine_gun' },
  mg42: { damage: 22, penetration: 26, preferredPart: 'wheels', category: 'machine_gun' },
  ptrd: { damage: 95, penetration: 120, preferredPart: 'engine', category: 'anti_tank_rifle' },
  boys: { damage: 88, penetration: 110, preferredPart: 'wheels', category: 'anti_tank_rifle' },
  bazooka: { damage: 185, penetration: 210, preferredPart: 'hull', category: 'rocket_at' },
  panzerfaust: { damage: 175, penetration: 200, preferredPart: 'hull', category: 'rocket_at' },
  rocketAT: { damage: 185, penetration: 210, preferredPart: 'hull', category: 'rocket_at' },
  debug: { damage: 999, penetration: 999, preferredPart: 'hull', category: 'debug' },
};

function normalizeWeaponId(weaponId = '') {
  const id = String(weaponId || '').toLowerCase();
  if (id.includes('bazooka')) return 'bazooka';
  if (id.includes('panzerfaust')) return 'panzerfaust';
  if (id.includes('ptrd')) return 'ptrd';
  if (id.includes('boys')) return 'boys';
  if (id.includes('mg42')) return 'mg42';
  if (id.includes('bren')) return 'bren';
  if (id.includes('bar')) return 'bar';
  if (id.includes('m1911') || id.includes('1911')) return 'm1911';
  if (id.includes('thompson') || id.includes('mp40') || id.includes('ppsh')) return 'smg';
  if (id.includes('garand') || id.includes('k98') || id.includes('rifle') || id.includes('mosin')) return 'rifle';
  return id || 'rifle';
}

export function getWeaponVehicleProfile(weaponId, override = {}) {
  const normalized = normalizeWeaponId(weaponId);
  const profile = WEAPON_PROFILES[normalized] || WEAPON_PROFILES[weaponId] || WEAPON_PROFILES.rifle;
  return { id: weaponId, normalizedId: normalized, ...profile, ...override };
}

function actorFromObject(object) {
  let o = object;
  while (o) {
    if (o.userData?.combatActor) return o.userData.combatActor;
    if (o.userData?.isVehicleCombatActor && o.userData?.combatActor) return o.userData.combatActor;
    o = o.parent;
  }
  return null;
}

function guessPartFromHit(hit, actor, weaponProfile) {
  const objectName = String(hit.object?.name || hit.object?.userData?.hitPart || hit.object?.userData?.part || '').toLowerCase();
  if (objectName.includes('wheel')) return 'wheels';
  if (objectName.includes('turret') || objectName.includes('ring')) return 'turret';
  if (objectName.includes('engine') || objectName.includes('rear')) return 'engine';
  if (objectName.includes('fuel')) return 'fuel';
  if (objectName.includes('ammo')) return 'ammo';
  if (objectName.includes('hull') || objectName.includes('body') || objectName.includes('frame')) return 'hull';

  const root = actor?.root || actor?.model;
  if (root && hit.point) {
    const local = root.worldToLocal(hit.point.clone());
    if (local.y > 2.1) return 'turret';
    if (Math.abs(local.x) > 1.8 && local.y < 1.3) return 'wheels';
    if (local.z > 1.9) return 'engine';
  }
  return weaponProfile?.preferredPart || 'hull';
}

function fallbackSphereHit(camera, actor, maxDistance = 180) {
  const root = actor.root || actor.model;
  if (!root) return null;
  const start = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const center = new THREE.Vector3();
  camera.getWorldPosition(start);
  camera.getWorldDirection(dir).normalize();
  root.getWorldPosition(center);
  center.y += 1.3;
  const toCenter = center.clone().sub(start);
  const distance = toCenter.length();
  if (distance > maxDistance) return null;
  const angle = dir.angleTo(toCenter.clone().normalize());
  const radiusAngle = Math.atan2(3.8, distance);
  if (angle <= Math.max(0.08, radiusAngle)) return { actor, object: root, point: center, distance, fallbackSphere: true };
  return null;
}

export const VehicleCombatSystem = {
  actors: new Map(),
  eventBus: new EventBus(),
  scene: null,

  configure({ scene } = {}) { if (scene) this.scene = scene; return this; },

  register(actor) {
    if (!actor?.id) return null;
    this.actors.set(actor.id, actor);
    const root = actor.root || actor.model;
    if (root) {
      root.userData = root.userData || {};
      root.userData.combatActor = actor;
      root.userData.isVehicleCombatActor = true;
      root.userData.vehicleCombatActorId = actor.id;
      root.traverse?.((child) => {
        child.userData = child.userData || {};
        child.userData.combatActor = actor;
        child.userData.vehicleCombatActorId = actor.id;
        child.userData.isVehicleCombatActorPart = true;
      });
    }
    this.eventBus.emit('vehicleRegistered', { type: 'vehicleRegistered', actor });
    return actor;
  },

  unregister(actorOrId) {
    const id = typeof actorOrId === 'string' ? actorOrId : actorOrId?.id;
    if (!id) return false;
    const actor = this.actors.get(id);
    this.actors.delete(id);
    this.eventBus.emit('vehicleUnregistered', { type: 'vehicleUnregistered', actor, id });
    return true;
  },

  getActorById(id) { return this.actors.get(id); },

  update(dt, context = {}) {
    const events = [];
    for (const actor of this.actors.values()) {
      const event = updateVehicleCombatActor(actor, dt, context);
      if (event?.type) {
        events.push(event);
        this.eventBus.emit(event.type, event);
      }
    }
    return events;
  },

  raycastFromCamera(camera, scene = this.scene, maxDistance = 180) {
    if (!camera) return null;
    const roots = [];
    for (const actor of this.actors.values()) {
      if (actor.state === 'wreck' || actor.state === 'destroyed') continue;
      const root = actor.root || actor.model;
      if (root?.visible !== false) roots.push(root);
    }
    if (!roots.length) return null;

    raycaster.setFromCamera(screenCenter, camera);
    raycaster.far = maxDistance;
    const hits = raycaster.intersectObjects(roots, true).filter((hit) => hit.object?.visible !== false);
    for (const hit of hits) {
      const actor = actorFromObject(hit.object);
      if (actor && actor.state !== 'destroyed' && actor.state !== 'wreck') {
        return { actor, object: hit.object, point: hit.point, distance: hit.distance, rawHit: hit, fallbackSphere: false };
      }
    }
    for (const actor of this.actors.values()) {
      if (actor.state === 'wreck' || actor.state === 'destroyed') continue;
      const fallback = fallbackSphereHit(camera, actor, maxDistance);
      if (fallback) return fallback;
    }
    return null;
  },

  applyWeaponShot({ weaponId, camera, scene = this.scene, player = null, source = 'player', weaponProfile = null, maxDistance = 180 } = {}) {
    const profile = weaponProfile || getWeaponVehicleProfile(weaponId);
    const target = this.raycastFromCamera(camera, scene, maxDistance);
    if (!target?.actor) {
      const miss = { type: 'vehicleMiss', weaponId, profile, source };
      this.eventBus.emit('vehicleMiss', miss);
      return miss;
    }
    const part = guessPartFromHit(target.rawHit || target, target.actor, profile);
    const hitData = {
      actor: target.actor,
      part,
      damage: profile.damage,
      penetration: profile.penetration,
      reason: `${source}_${profile.category || 'shot'}`,
      point: target.point,
      distance: target.distance,
      weaponId,
      fallbackSphere: Boolean(target.fallbackSphere),
    };
    const result = damageVehicleCombatActor(target.actor, hitData, profile);
    if (result?.type) {
      this.eventBus.emit('vehicleHit', { type: 'vehicleHit', actor: target.actor, hit: hitData, result, profile });
      this.eventBus.emit(result.type, result);
    }
    return result;
  },

  applyExplosion({ position, radius = 8, damage = 100, penetration = 120, source = 'explosion' } = {}) {
    if (!position) return [];
    const results = [];
    for (const actor of this.actors.values()) {
      if (actor.state === 'wreck' || actor.state === 'destroyed') continue;
      const root = actor.root || actor.model;
      if (!root?.position) continue;
      const dist = root.position.distanceTo(position);
      if (dist > radius) continue;
      const falloff = Math.max(0.15, 1 - dist / radius);
      const hitData = { actor, part: dist < radius * 0.35 ? 'hull' : 'wheels', damage: damage * falloff, penetration: penetration * falloff, reason: source, point: position, distance: dist };
      const result = damageVehicleCombatActor(actor, hitData, { damage: hitData.damage, penetration: hitData.penetration, category: 'explosion' });
      if (result?.type) {
        this.eventBus.emit('vehicleHit', { type: 'vehicleHit', actor, hit: hitData, result });
        this.eventBus.emit(result.type, result);
      }
      results.push(result);
    }
    return results;
  },

  diagnostics() {
    return {
      activeActors: this.actors.size,
      states: [...this.actors.values()].map((actor) => ({ id: actor.id, type: actor.type, hp: Math.round(actor.hp), hpMax: actor.hpMax, armor: actor.armor, state: actor.state, lastHitPart: actor.lastHitPart, lastDamageReason: actor.lastDamageReason, debug: getVehicleCombatDebugInfo(actor) })),
    };
  },

  on(event, cb) { return this.eventBus.on(event, cb); },
  off(event, cb) { return this.eventBus.off(event, cb); },
  emit(event, data) { return this.eventBus.emit(event, data); },
};
