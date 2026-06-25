let nextId = 1;

export const VEHICLE_DEFAULTS = {
  puma: {
    hpMax: 280,
    armor: 75,
    mobility: 0.85,
    softTarget: false,
    lootCount: 3,
    parts: {
      hull: { hp: 160, maxHp: 160, armor: 55, critical: true },
      turret: { hp: 90, maxHp: 90, armor: 35 },
      wheels: { hp: 65, maxHp: 65, armor: 18, mobilityKill: true },
      engine: { hp: 75, maxHp: 75, armor: 28, mobilityKill: true },
      fuel: { hp: 45, maxHp: 45, armor: 12, fireRisk: true },
      ammo: { hp: 55, maxHp: 55, armor: 14, catastrophicRisk: true },
    },
  },
  technical: {
    hpMax: 170,
    armor: 18,
    mobility: 1.0,
    softTarget: true,
    lootCount: 2,
    parts: {
      hull: { hp: 95, maxHp: 95, armor: 12, critical: true },
      turret: { hp: 45, maxHp: 45, armor: 10 },
      wheels: { hp: 55, maxHp: 55, armor: 6, mobilityKill: true },
      engine: { hp: 45, maxHp: 45, armor: 8, mobilityKill: true },
      fuel: { hp: 35, maxHp: 35, armor: 4, fireRisk: true },
      ammo: { hp: 25, maxHp: 25, armor: 4, catastrophicRisk: true },
    },
  },
  fuelTruck: {
    hpMax: 190,
    armor: 10,
    mobility: 0.75,
    softTarget: true,
    lootCount: 2,
    parts: {
      hull: { hp: 80, maxHp: 80, armor: 8, critical: true },
      wheels: { hp: 55, maxHp: 55, armor: 5, mobilityKill: true },
      engine: { hp: 55, maxHp: 55, armor: 7, mobilityKill: true },
      fuel: { hp: 85, maxHp: 85, armor: 3, fireRisk: true, catastrophicRisk: true },
      ammo: { hp: 10, maxHp: 10, armor: 2 },
    },
  },
};

function cloneParts(parts) {
  return JSON.parse(JSON.stringify(parts || {}));
}

function actorAlive(actor) {
  return actor && !['destroyed', 'wreck'].includes(actor.state);
}

function syncModelUserData(actor) {
  const root = actor?.root || actor?.model;
  if (!root) return;

  root.userData = root.userData || {};
  root.userData.combatActor = actor;
  root.userData.isVehicleCombatActor = true;
  root.userData.vehicleCombatActorId = actor.id;
  root.userData.vehicleType = actor.type;
  root.userData.hp = actor.hp;
  root.userData.hpMax = actor.hpMax;
  root.userData.armor = actor.armor;
  root.userData.state = actor.state;
  root.userData.alive = actorAlive(actor);
  root.userData.source = 'VehicleCombatActor';
  root.userData.lastHitPart = actor.lastHitPart;
  root.userData.lastDamageReason = actor.lastDamageReason;

  root.traverse?.((child) => {
    child.userData = child.userData || {};
    child.userData.combatActor = actor;
    child.userData.vehicleCombatActorId = actor.id;
    child.userData.source = 'VehicleCombatActor';
    child.userData.isVehicleCombatActorPart = true;
  });
}

export function createVehicleCombatActor(type = 'puma', options = {}) {
  const def = VEHICLE_DEFAULTS[type] || VEHICLE_DEFAULTS.puma;
  const hpMax = options.hpMax ?? def.hpMax;

  const actor = {
    id: options.id || `vca_${nextId++}`,
    type,
    model: options.model || null,
    root: options.root || options.model || null,
    hp: options.hp ?? hpMax,
    hpMax,
    armor: options.armor ?? def.armor,
    baseMobility: options.mobility ?? def.mobility,
    mobility: options.mobility ?? def.mobility,
    softTarget: options.softTarget ?? def.softTarget ?? false,
    faction: options.faction || 'hostile',
    state: options.state || 'active',
    parts: cloneParts(def.parts),
    lastHitPart: null,
    lastDamageReason: null,
    lastDamage: 0,
    lastEvent: null,
    questTags: options.questTags || [],
    lootCount: options.lootCount ?? def.lootCount ?? 3,
    createdAt: Date.now(),
    destroyedAt: null,
    wreck: null,
  };

  syncModelUserData(actor);
  return actor;
}

export function updateVehicleCombatActor(actor, dt = 0, context = {}) {
  if (!actor || actor.state === 'wreck' || actor.state === 'destroyed') {
    syncModelUserData(actor);
    return null;
  }

  if (actor.state === 'burning') {
    actor.hp = Math.max(0, actor.hp - 8 * dt);
    if (actor.hp <= 0) return destroyVehicleCombatActor(actor, 'burned_out');
  }

  let mobility = actor.baseMobility ?? 1;
  if (actor.parts.wheels?.hp <= 0) mobility *= 0.15;
  if (actor.parts.engine?.hp <= 0) mobility *= 0.1;
  actor.mobility = Math.max(0.0, mobility);

  if (actor.mobility < 0.3 && actor.state === 'active') {
    actor.state = 'immobilized';
    actor.lastEvent = { type: 'vehicleImmobilized', actor, reason: 'mobility_parts_destroyed' };
    syncModelUserData(actor);
    return actor.lastEvent;
  }

  syncModelUserData(actor);
  return null;
}

export function damageVehicleCombatActor(actor, hit = {}, weaponProfile = {}) {
  if (!actor || ['destroyed', 'wreck'].includes(actor.state)) {
    return { type: 'vehicleArmorBlocked', blocked: true, reason: 'already_dead', actor };
  }

  const part = hit.part || 'hull';
  const partData = actor.parts[part] || actor.parts.hull;
  if (!partData) return { type: 'vehicleArmorBlocked', blocked: true, reason: 'no_part', actor };

  const rawDamage = hit.damage ?? weaponProfile.damage ?? 10;
  const penetration = hit.penetration ?? weaponProfile.penetration ?? 0;
  const reason = hit.reason || weaponProfile.reason || 'shot';
  const totalArmor = Math.max(0, (actor.armor || 0) + (partData.armor || 0));

  let effectiveDamage = rawDamage;
  let blockedByArmor = false;
  if (penetration < totalArmor * 0.7) {
    effectiveDamage *= actor.softTarget ? 0.35 : 0.12;
    blockedByArmor = true;
  } else {
    const armorReduction = Math.max(0.25, 1 - Math.max(0, totalArmor - penetration) / 140);
    effectiveDamage *= armorReduction;
  }

  effectiveDamage = Math.max(0, effectiveDamage);
  partData.hp = Math.max(0, partData.hp - effectiveDamage);
  actor.hp = Math.max(0, actor.hp - effectiveDamage * 0.65);
  actor.lastHitPart = part;
  actor.lastDamageReason = reason;
  actor.lastDamage = effectiveDamage;

  let result = {
    type: blockedByArmor ? 'vehicleArmorBlocked' : 'vehicleDamaged',
    actor,
    hit,
    damage: effectiveDamage,
    blocked: blockedByArmor,
    part,
    partHp: partData.hp,
  };

  if (partData.hp <= 0) {
    if (partData.mobilityKill && actor.state === 'active') {
      actor.state = 'immobilized';
      result.type = 'vehicleImmobilized';
    }
    if (partData.fireRisk && actor.state !== 'burning') {
      actor.state = 'burning';
      result.type = 'vehicleBurning';
    }
    if (partData.catastrophicRisk && effectiveDamage > 20) return destroyVehicleCombatActor(actor, `${reason}_catastrophic_${part}`);
    if (partData.critical && actor.hp <= actor.hpMax * 0.22) return destroyVehicleCombatActor(actor, `${reason}_critical_${part}`);
  }

  if (actor.hp <= 0) return destroyVehicleCombatActor(actor, reason);

  actor.lastEvent = result;
  syncModelUserData(actor);
  return result;
}

export function destroyVehicleCombatActor(actor, reason = 'destroyed') {
  if (!actor) return null;
  actor.state = 'destroyed';
  actor.hp = 0;
  actor.destroyedAt = Date.now();
  actor.lastDamageReason = reason;
  actor.wreck = spawnVehicleWreck(actor);
  const event = { type: 'vehicleDestroyed', actor, reason, wreck: actor.wreck, loot: spawnVehicleLoot(actor, actor.lootCount) };
  actor.lastEvent = event;
  syncModelUserData(actor);
  return event;
}

export function spawnVehicleWreck(actor) {
  if (!actor || !actor.root) return null;
  const root = actor.root;
  root.userData = root.userData || {};
  root.userData.isVehicleWreck = true;
  root.userData.keepWreck = true;
  root.userData.alive = false;
  root.userData.state = 'destroyed';
  root.traverse?.((child) => {
    child.visible = true;
    child.userData = child.userData || {};
    child.userData.isVehicleWreck = true;
    child.userData.alive = false;
  });
  return { id: `wreck_${actor.id}`, model: root, position: root.position?.clone?.() || { x: 0, y: 0, z: 0 }, type: 'vehicle_wreck', originalActorId: actor.id };
}

export function spawnVehicleLoot(actor, count = 3) {
  if (!actor || !actor.root) return [];
  const pos = actor.root.position || { x: 0, y: 0, z: 0 };
  const crates = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.PI / 6;
    const dist = 6 + i * 1.4;
    crates.push({
      id: `crate_${actor.id}_${i}`,
      position: { x: pos.x + Math.cos(angle) * dist, y: pos.y + 0.5, z: pos.z + Math.sin(angle) * dist },
      type: 'quest_crate',
      questTag: 'act1_green_crates',
      interactable: true,
      source: 'VehicleCombatActor',
    });
  }
  return crates;
}

export function getVehicleCombatDebugInfo(actor) {
  if (!actor) return 'No vehicle actor';
  return [
    `ID: ${actor.id}`,
    `Type: ${actor.type}`,
    `HP: ${Math.floor(actor.hp)}/${actor.hpMax}`,
    `Armor: ${actor.armor}`,
    `State: ${actor.state}`,
    `LastHit: ${actor.lastHitPart || '-'}`,
    `Reason: ${actor.lastDamageReason || '-'}`,
    `Damage: ${actor.lastDamage ? actor.lastDamage.toFixed(1) : '-'}`,
    `Mobility: ${(actor.mobility * 100).toFixed(0)}%`,
    'Source: VehicleCombatActor',
  ].join('\n');
}

export const getDebugInfo = getVehicleCombatDebugInfo;
