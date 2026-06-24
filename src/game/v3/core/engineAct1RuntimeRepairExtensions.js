import * as THREE from '../vendor/three.module.js';
import { ARSENAL } from '../combat/arsenal.js';

function installRepairStyle() {
  if (document.getElementById('act1RuntimeRepairStyle')) return;
  const style = document.createElement('style');
  style.id = 'act1RuntimeRepairStyle';
  style.textContent = `
    .mw-doll{background:radial-gradient(ellipse at center,rgba(120,88,50,.55),rgba(0,0,0,.30) 62%)!important;}
    .mw-body-silhouette{opacity:.92!important;inset:46px 78px 54px!important;}
    .mw-body-silhouette::before{content:"";position:absolute;left:50%;top:18px;transform:translateX(-50%);width:118px;height:430px;border-radius:58px 58px 36px 36px;background:linear-gradient(180deg,rgba(210,158,80,.18),rgba(53,38,26,.40));border:1px solid rgba(255,216,151,.26);box-shadow:inset 0 0 28px rgba(0,0,0,.52),0 0 30px rgba(0,0,0,.28);}
    .mw-head{background:radial-gradient(circle at 40% 35%,#6a4a32,#2e221b)!important;box-shadow:0 0 0 2px rgba(0,0,0,.35),0 8px 22px rgba(0,0,0,.5)}
    .mw-torso{background:linear-gradient(180deg,#473221,#211913)!important;width:118px!important;height:205px!important;}
    .mw-arm,.mw-leg{background:linear-gradient(180deg,#3a2a20,#19130f)!important;}
    .mw-slot{backdrop-filter:blur(2px);box-shadow:0 8px 22px rgba(0,0,0,.34)}
    .world-journal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:8px}.world-journal-card{border:1px solid rgba(216,166,77,.25);background:rgba(0,0,0,.2);padding:8px;border-radius:8px}.world-journal-card b{color:#ffd997}.world-journal-card small{display:block;color:#bca17a;margin-top:4px;line-height:1.35}
  `;
  document.head.appendChild(style);
}

function getWorldPos(obj) {
  const p = new THREE.Vector3();
  if (obj?.getWorldPosition) obj.getWorldPosition(p);
  else if (obj?.position) p.copy(obj.position);
  return p;
}

function aimScore(engine, obj) {
  const p = getWorldPos(obj);
  p.y += obj.userData?.labVehicle ? 1.6 : 1.0;
  const start = new THREE.Vector3();
  const dir = new THREE.Vector3();
  engine.camera.getWorldPosition(start);
  engine.camera.getWorldDirection(dir).normalize();
  const to = p.clone().sub(start);
  const distance = to.length();
  if (distance <= 0.01) return { ok: false, distance, angle: 999 };
  const angle = dir.angleTo(to.normalize());
  const maxAngle = obj.userData?.labVehicle ? 0.22 : 0.14;
  return { ok: distance < 165 && angle < maxAngle, distance, angle };
}

function activeAct1Vehicle(engine) {
  const vehicle = engine.act1Slice?.vehicle;
  if (!vehicle?.userData?.act1Vehicle) return null;
  const d = vehicle.userData;
  if (d.alive === false || d.state === 'destroyed' || (d.hp ?? 0) <= 0) return null;
  return vehicle;
}

function damageProfile(engine, weaponId) {
  const w = ARSENAL[weaponId] || {};
  const id = String(weaponId || '').toLowerCase();
  if (id.includes('bazooka') || id.includes('panzerfaust') || id.includes('rocket')) return { damage: 95, tag: 'AT ROCKET', skill: 'launchers' };
  if (id.includes('ptrd') || id.includes('boys') || id.includes('145')) return { damage: 42, tag: 'AT RIFLE', skill: 'firearms' };
  if (id.includes('mg') || id.includes('bren') || id.includes('bar')) return { damage: 10, tag: 'MG CHIP', skill: 'firearms' };
  if (w.ammoType === 'rocketAT') return { damage: 95, tag: 'AT ROCKET', skill: 'launchers' };
  if (w.ammoType === 'rifle145') return { damage: 42, tag: 'AT RIFLE', skill: 'firearms' };
  return { damage: Math.max(2, Math.round((w.damage || 8) * 0.22)), tag: 'ARMOR CHIP', skill: 'firearms' };
}

function markAct1VehicleDestroyed(engine, vehicle, reason = 'fallback damage') {
  const s = engine.act1Slice;
  vehicle.userData.hp = 0;
  vehicle.userData.alive = false;
  vehicle.userData.state = 'destroyed';
  vehicle.userData.source = 'act1Route';
  vehicle.userData.destroyReason = reason;
  vehicle.traverse?.((child) => {
    child.userData = child.userData || {};
    child.userData.alive = false;
  });
  if (s?.vehicle === vehicle) {
    s.vehicleWreckLeft = true;
    s.vehicleDestroyedBy = reason;
    s.spawnedVehicle = true;
    s.stage = Math.max(s.stage || 0, 3);
    engine.act1SpawnCrates?.();
  }
  engine.hud?.hitMarker?.('DESTROYED');
  engine.hud?.setObjective?.('Бронецель уничтожена fallback-слоем. Wreck оставлен, забери зелёные ящики.');
  engine.log?.unshift?.('Runtime repair: GLM vehicle accepted damage and opened crate stage.');
}

function fallbackDamageAct1Vehicle(engine, weaponId, reason = 'shot') {
  const vehicle = activeAct1Vehicle(engine);
  if (!vehicle) return false;
  const score = aimScore(engine, vehicle);
  if (!score.ok) return false;
  const profile = damageProfile(engine, weaponId);
  const d = vehicle.userData;
  d.hpMax = d.hpMax || d.hp || 180;
  d.hp = Math.max(0, (d.hp ?? d.hpMax) - profile.damage);
  d.lastFallbackHitT = performance.now();
  engine.hud?.hitMarker?.(`-${profile.damage}`);
  engine.hud?.setObjective?.(`GLM Puma принимает урон: ${profile.tag} · HP ${Math.ceil(d.hp)}/${d.hpMax}.`);
  engine.rpg?.useSkill?.(profile.skill, 0.8);
  if (d.hp <= 0) markAct1VehicleDestroyed(engine, vehicle, reason);
  return true;
}

function cleanupBadEnemies(engine) {
  const s = engine.act1Slice;
  const all = new Set([...(engine.monsters || []), ...(s?.raiders || [])]);
  for (const obj of all) {
    if (!obj?.userData) continue;
    const d = obj.userData;
    const routeOwned = d.source === 'act1Route' || d.id?.startsWith?.('act1_') || obj.name?.startsWith?.('act1_');
    if ((d.hp ?? 1) <= 0 || d.alive === false) {
      d.alive = false;
      if (routeOwned && !d.keepWreck && !d.act1Vehicle && !d.labVehicle) {
        obj.visible = false;
        obj.parent?.remove?.(obj);
      }
    } else {
      obj.visible = true;
      obj.traverse?.((child) => { child.visible = true; child.frustumCulled = false; });
      obj.frustumCulled = false;
    }
  }
  engine.monsters = (engine.monsters || []).filter((obj) => obj?.userData?.act1Vehicle || (obj?.userData?.hp ?? 1) > 0);
  if (s?.raiders) s.raiders = s.raiders.filter((obj) => (obj?.userData?.hp ?? 1) > 0 && obj?.userData?.alive !== false && obj.parent);
  if (s?.stage === 2 && s.spawnedRaiders && s.raiders.length === 0) {
    s.stage = 3;
    engine.act1SpawnVehicleEncounter?.();
    engine.hud?.setObjective?.('Дорожная встреча очищена repair-слоем. Дальше бронецель.');
  }
}

function stabilizeFacing(engine) {
  engine.__act1RepairPrev = engine.__act1RepairPrev || new WeakMap();
  for (const obj of engine.monsters || []) {
    if (!obj?.position || obj.userData?.act1Vehicle || obj.userData?.labVehicle) continue;
    const prev = engine.__act1RepairPrev.get(obj);
    if (prev) {
      const dx = obj.position.x - prev.x;
      const dz = obj.position.z - prev.z;
      if (Math.hypot(dx, dz) > 0.015) obj.rotation.y = Math.atan2(dx, dz);
    }
    engine.__act1RepairPrev.set(obj, { x: obj.position.x, z: obj.position.z });
  }
}

function worldJournalHtml(engine) {
  const s = engine.act1Slice || {};
  const lw = engine.livingWorld;
  const caravans = (lw?.agents || []).map(a => a.userData).filter(u => u.role === 'caravan').slice(0, 5);
  const recent = [...(lw?.eventLog || []), ...(engine.log || [])].slice(0, 8);
  const caravanHtml = caravans.length
    ? caravans.map(c => `<div class="world-journal-card"><b>${c.name || c.id}</b><small>${c.state || 'moving'} · ${c.tradeState || 'trade'} · x ${Math.round(c.x || 0)} z ${Math.round(c.z || 0)}</small></div>`).join('')
    : '<div class="world-journal-card"><b>Караваны не найдены</b><small>LivingWorld пока не отдал активных караванов.</small></div>';
  const eventHtml = recent.length
    ? recent.map(e => `<div class="line">${String(e).replace(/[<>&]/g, (ch) => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[ch]))}</div>`).join('')
    : '<div class="line">Пока нет свежих событий.</div>';
  return `<h2>Журнал мира Ashgrave</h2>
    <p>Это не только квестовый список, а сводка того, что происходит вокруг: караваны, лагерь, route-state, последние события.</p>
    <div class="world-journal-grid">
      <div class="world-journal-card"><b>Act 1 route</b><small>stage ${s.stage ?? '—'} · crates ${s.cratesCollected ?? 0}/${s.cratesNeeded ?? 3} · vehicle ${s.vehicle?.userData?.alive === false ? 'destroyed' : s.vehicle ? 'active' : 'not spawned'}</small></div>
      <div class="world-journal-card"><b>Лагерь</b><small>${s.completed ? 'дорога открыта, товар старосты расширен' : 'ждёт закрытия маршрута'}</small></div>
      <div class="world-journal-card"><b>Debug</b><small>F8 labels · F2 clean restart · F3 objective teleport</small></div>
    </div>
    <h3>Караваны и живой мир</h3><div class="world-journal-grid">${caravanHtml}</div>
    <h3>Последние события</h3>${eventHtml}`;
}

export function installAct1RuntimeRepairExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__act1RuntimeRepairInstalled) return;
  PhoenixV3Engine.__act1RuntimeRepairInstalled = true;

  const originalBoot = PhoenixV3Engine.prototype.boot;
  PhoenixV3Engine.prototype.boot = function bootAct1RuntimeRepair(...args) {
    const result = originalBoot.call(this, ...args);
    installRepairStyle();
    return result;
  };

  const originalAttack = PhoenixV3Engine.prototype.attack;
  PhoenixV3Engine.prototype.attack = function attackAct1RuntimeRepair(...args) {
    const weaponId = this.player?.weapon;
    const result = originalAttack.call(this, ...args);
    if (this.act1Slice?.stage === 3) fallbackDamageAct1Vehicle(this, weaponId, 'primary shot');
    return result;
  };

  const originalAlt = PhoenixV3Engine.prototype.altWeaponAttack;
  PhoenixV3Engine.prototype.altWeaponAttack = function altWeaponAttackAct1RuntimeRepair(...args) {
    const result = originalAlt.call(this, ...args);
    if (this.act1Slice?.stage === 3) fallbackDamageAct1Vehicle(this, this.player?.weapon, 'alt attack');
    return result;
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionAct1RuntimeRepair(code, event) {
    if (code === 'KeyQ' && this.act1Slice?.stage === 3 && fallbackDamageAct1Vehicle(this, this.player?.weapon, 'Q heat impulse')) {
      event?.preventDefault?.();
      return;
    }
    return originalOnAction.call(this, code, event);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateAct1RuntimeRepair(dt) {
    originalUpdate.call(this, dt);
    cleanupBadEnemies(this);
    stabilizeFacing(this);
    const vehicle = this.act1Slice?.vehicle;
    if (this.act1Slice?.stage === 3 && vehicle?.userData?.act1Vehicle) {
      const d = vehicle.userData;
      d.hpMax = d.hpMax || d.hp || 180;
      if (d.alive !== false && (d.hp ?? 1) > 0) this.hud?.showPrompt?.(`Бронецель HP ${Math.ceil(d.hp ?? d.hpMax)}/${d.hpMax} · стреляй Bazooka/PTRD или Q`);
      if (d.alive === false || (d.hp ?? 0) <= 0 || d.state === 'destroyed') markAct1VehicleDestroyed(this, vehicle, d.destroyReason || 'state sync');
    }
  };

  const originalJournal = PhoenixV3Engine.prototype.act1SliceJournalHtml;
  PhoenixV3Engine.prototype.act1SliceJournalHtml = function act1SliceJournalHtmlRuntimeRepair() {
    const base = originalJournal ? originalJournal.call(this) : '';
    return `${base}<hr>${worldJournalHtml(this)}`;
  };
}
