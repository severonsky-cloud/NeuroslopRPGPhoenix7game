import * as THREE from '../vendor/three.module.js';

function installDebugStyle() {
  if (document.getElementById('ashgraveEntityDebugStyle')) return;
  const style = document.createElement('style');
  style.id = 'ashgraveEntityDebugStyle';
  style.textContent = `
    #entityDebugLayer{position:fixed;inset:0;z-index:58;pointer-events:none;font:800 11px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#e8ffd4;text-shadow:0 1px 4px #000;}
    .entityDebugLabel{position:absolute;transform:translate(-50%,-100%);padding:4px 6px;background:rgba(4,8,5,.72);border:1px solid rgba(120,255,150,.42);border-radius:6px;white-space:pre;box-shadow:0 10px 26px rgba(0,0,0,.35);}
    .entityDebugLabel.dead{color:#ffd0c0;border-color:rgba(255,90,70,.45);background:rgba(20,5,4,.76)}
  `;
  document.head.appendChild(style);
}

function ensureLayer() {
  installDebugStyle();
  let layer = document.getElementById('entityDebugLayer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'entityDebugLayer';
    document.body.appendChild(layer);
  }
  return layer;
}

function isRouteObject(obj) {
  const data = obj?.userData || {};
  const id = String(data.id || obj?.name || '');
  return data.source === 'act1Route' || data.act1Vehicle || data.act1RoadEvent || data.act1LootCrate || id.startsWith('act1_') || String(obj?.name || '').startsWith('act1_');
}

function removeNode(scene, obj) {
  if (!obj) return;
  scene.remove(obj);
  obj.parent?.remove?.(obj);
  obj.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((mat) => mat?.dispose?.());
    else child.material?.dispose?.();
  });
}

function collectDebugEntities(engine) {
  const out = [];
  const seen = new Set();
  const add = (obj, source = 'world') => {
    if (!obj || seen.has(obj)) return;
    seen.add(obj);
    if (!obj.position && !obj.getWorldPosition) return;
    out.push({ obj, source });
  };
  for (const m of engine.monsters || []) add(m, m.userData?.source || 'monster');
  const s = engine.act1Slice;
  if (s) {
    for (const r of s.raiders || []) add(r, 'act1Route');
    for (const c of s.crates || []) add(c, 'act1Crate');
    if (s.vehicle) add(s.vehicle, s.vehicle.userData?.labVehicle ? 'GLM vehicle' : 'act1Vehicle');
  }
  for (const v of engine.act1LabVehicles || []) add(v, 'GLM vehicle');
  return out;
}

function screenPoint(engine, obj) {
  const p = new THREE.Vector3();
  obj.getWorldPosition ? obj.getWorldPosition(p) : p.copy(obj.position);
  const height = obj.userData?.labVehicle ? 4.5 : obj.userData?.act1LootCrate ? 1.3 : 2.6;
  p.y += height;
  p.project(engine.camera);
  if (p.z < -1 || p.z > 1 || Math.abs(p.x) > 1.25 || Math.abs(p.y) > 1.25) return null;
  return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight };
}

function updateDebugLabels(engine) {
  const layer = ensureLayer();
  if (!engine.entityDebug?.enabled) { layer.style.display = 'none'; return; }
  layer.style.display = 'block';
  const entities = collectDebugEntities(engine);
  layer.innerHTML = '';
  for (const { obj, source } of entities.slice(0, 80)) {
    const pt = screenPoint(engine, obj);
    if (!pt) continue;
    const data = obj.userData || {};
    const hp = data.hp ?? (data.labVehicle ? data.hp : '—');
    const hpMax = data.hpMax ?? '—';
    const alive = data.alive === false || data.state === 'destroyed' || Number(hp) <= 0 ? 'dead' : 'alive';
    const label = document.createElement('div');
    label.className = `entityDebugLabel ${alive === 'dead' ? 'dead' : ''}`;
    label.style.left = `${pt.x}px`;
    label.style.top = `${pt.y}px`;
    label.textContent = `${data.id || obj.name || 'entity'}\nhp ${hp}/${hpMax} · ${alive}\nfac ${data.faction || data.vehicleType || '—'} · ${source}`;
    layer.appendChild(label);
  }
}

function cleanupInvalidRouteEntities(engine) {
  const s = engine.act1Slice;
  if (s?.raiders) {
    s.raiders = s.raiders.filter((obj) => {
      const alive = obj?.userData?.alive !== false && (obj?.userData?.hp ?? 1) > 0 && obj.parent;
      if (!alive) {
        if (obj) obj.userData.alive = false;
        removeNode(engine.scene, obj);
        return false;
      }
      obj.userData.source = obj.userData.source || 'act1Route';
      return true;
    });
  }
  engine.monsters = (engine.monsters || []).filter((obj) => {
    if (!obj) return false;
    const route = isRouteObject(obj);
    const dead = obj.userData?.alive === false || ((obj.userData?.hp ?? 1) <= 0 && route);
    const orphan = route && !obj.parent;
    if (dead || orphan) {
      removeNode(engine.scene, obj);
      return false;
    }
    return true;
  });
}

export function installEntityDebugExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__entityDebugInstalled) return;
  PhoenixV3Engine.__entityDebugInstalled = true;

  PhoenixV3Engine.prototype.toggleEntityDebug = function toggleEntityDebug() {
    this.entityDebug = this.entityDebug || { enabled: false, lastCleanupT: 0 };
    this.entityDebug.enabled = !this.entityDebug.enabled;
    ensureLayer().style.display = this.entityDebug.enabled ? 'block' : 'none';
    this.hud?.setObjective?.(this.entityDebug.enabled ? 'F8 debug: enemy labels on · id/hp/faction/source visible.' : 'F8 debug: enemy labels off.');
  };

  const originalClear = PhoenixV3Engine.prototype.act1SliceClear;
  PhoenixV3Engine.prototype.act1SliceClear = function act1SliceClearEntityDebug(...args) {
    const stale = [];
    for (const obj of this.monsters || []) if (isRouteObject(obj)) stale.push(obj);
    this.scene?.traverse?.((obj) => { if (isRouteObject(obj)) stale.push(obj); });
    for (const obj of new Set(stale)) removeNode(this.scene, obj);
    this.monsters = (this.monsters || []).filter((obj) => !isRouteObject(obj));
    return originalClear.call(this, ...args);
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionEntityDebug(code, event) {
    if (code === 'F8') { event?.preventDefault?.(); this.toggleEntityDebug(); return; }
    return originalOnAction.call(this, code, event);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateEntityDebug(dt) {
    originalUpdate.call(this, dt);
    this.entityDebug = this.entityDebug || { enabled: false, lastCleanupT: 0 };
    const now = performance.now();
    if (now - this.entityDebug.lastCleanupT > 650) {
      this.entityDebug.lastCleanupT = now;
      cleanupInvalidRouteEntities(this);
    }
    updateDebugLabels(this);
  };
}
