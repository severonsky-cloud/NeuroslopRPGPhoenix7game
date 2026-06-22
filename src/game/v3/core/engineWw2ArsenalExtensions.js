import * as THREE from '../vendor/three.module.js';
import { ARSENAL, AMMO_TYPES } from '../combat/arsenal.js';
import { WW2_ARSENAL, WW2_DEFAULT_AMMO, WW2_TEST_ENEMIES } from '../combat/ww2ArsenalData.js';
import { heightAt } from '../world/terrain.js';
import { labelSprite, makeMat } from '../world/props.js';

const QUICK_WEAPONS = Object.freeze({
  Digit1: 'm1911a1',
  Digit2: 'mp40',
  Digit3: 'ppsh41',
  Digit4: 'thompsonM1928',
  Digit5: 'k98k',
  Digit6: 'm1GarandWw2',
  Digit7: 'winchester1897',
  Digit8: 'mg42',
  Digit9: 'bazookaM1',
  Digit0: 'mk2GrenadeProto',
});

function ww2LiveMode() {
  const params = new URLSearchParams(globalThis.location?.search || '');
  const path = globalThis.location?.pathname || '';
  return params.has('ww2') || path.includes('ww2') || path.includes('v3p2_ww2_live');
}

function bindClose(engine) {
  document.getElementById('closeMapBtn')?.addEventListener('click', () => engine.closePausePanel());
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function removeNode(scene, node) {
  if (!node) return;
  scene.remove(node);
  node.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((mat) => mat?.dispose?.());
    else child.material?.dispose?.();
  });
}

function makeRangeDummy(name, hp, armor, color = 0x9b6b49) {
  const root = new THREE.Group();
  root.name = `ww2_live_target_${name.replace(/\s+/g, '_')}`;
  const clay = makeMat(color, { roughness: 0.9 });
  const dark = makeMat(0x15100b, { roughness: 0.84 });
  const brass = makeMat(0xd0a75f, { roughness: 0.55, metalness: 0.08 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.65), dark);
  base.position.y = 0.12;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.7, 6), dark);
  post.position.y = 0.92;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.74, 1.35, 0.34), clay);
  body.position.y = 1.34;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.34), clay);
  head.position.y = 2.22;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.08), brass);
  plate.position.y = 2.72;

  root.add(base, post, body, head, plate);
  root.userData = {
    type: 'monster',
    alive: true,
    looted: true,
    conditionalHostile: true,
    autoHostile: false,
    ww2LiveTarget: true,
    name,
    hp,
    hpMax: hp,
    armor,
    archetype: armor >= 8 ? 'brute' : 'ghoul',
    speed: 0,
    slowT: 0,
    fearT: 0,
  };
  return root;
}

function statusFor(engine, weaponId) {
  const weapon = ARSENAL[weaponId];
  if (!weapon?.ammoType) return '';
  const state = engine.firearms?.state?.(weaponId);
  const reserve = engine.player?.inventoryState?.ammo?.[weapon.ammoType] || 0;
  if (!state) return `${AMMO_TYPES[weapon.ammoType]?.name || weapon.ammoType}: ${reserve}`;
  const loaded = state.loaded ?? 0;
  return `${loaded}/${weapon.clipSize} · запас ${reserve}`;
}

export function installWw2ArsenalExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__ww2ArsenalExtensionInstalled) return;
  PhoenixV3Engine.__ww2ArsenalExtensionInstalled = true;

  PhoenixV3Engine.prototype.grantWw2LiveKit = function grantWw2LiveKit() {
    const added = this.inventory.grantWw2TestKit();
    for (const [type, amount] of Object.entries(WW2_DEFAULT_AMMO)) {
      this.player.inventoryState.ammo[type] = Math.max(this.player.inventoryState.ammo[type] || 0, amount);
    }
    this.player.inventoryState.ammo.revolver = Math.max(this.player.inventoryState.ammo.revolver || 0, 36);
    this.player.inventoryState.ammo.scatter = Math.max(this.player.inventoryState.ammo.scatter || 0, 28);
    this.player.credits = Math.max(this.player.credits || 0, 300);
    return added;
  };

  PhoenixV3Engine.prototype.equipWw2Weapon = function equipWw2Weapon(weaponId) {
    if (!WW2_ARSENAL[weaponId]) return false;
    this.grantWw2LiveKit();
    this.inventory.equip(weaponId, 'rightHand');
    this.player.inventoryState.equipment.activeHand = 'rightHand';
    this.player.weapon = weaponId;
    this.aimMode = false;
    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.buildViewModel();
    this.updateCrosshair();
    this.firearms?.state?.(weaponId);
    this.hud.setObjective(`WW2 live: ${ARSENAL[weaponId].name} · ${statusFor(this, weaponId)} · V прицел · R перезарядка`);
    return true;
  };

  PhoenixV3Engine.prototype.spawnWw2LiveTargets = function spawnWw2LiveTargets() {
    if (!this.scene || !this.rig) return;
    for (const node of this.ww2LiveNodes || []) removeNode(this.scene, node);
    this.ww2LiveNodes = [];
    this.monsters = (this.monsters || []).filter((monster) => !monster.userData?.ww2LiveTarget);
    this.labels = (this.labels || []).filter((label) => !label.userData?.ww2LiveTarget);

    const origin = this.rig.position.clone();
    const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw || 0).normalize();
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    const colors = [0x9b6b49, 0x6d5b3e, 0x4f5d54];

    WW2_TEST_ENEMIES.forEach((target, index) => {
      const side = [-3.2, 0.8, 4.6][index] || 0;
      const distance = target.distance || (18 + index * 18);
      const pos = origin.clone().addScaledVector(dir, distance).addScaledVector(right, side);
      const dummy = makeRangeDummy(`${target.name} · ${distance}m`, target.hp, target.armor, colors[index] || 0x8a6b4a);
      dummy.position.set(pos.x, heightAt(pos.x, pos.z), pos.z);
      dummy.userData.x = pos.x;
      dummy.userData.z = pos.z;
      dummy.lookAt(origin.x, origin.y + 1.2, origin.z);
      this.scene.add(dummy);
      this.monsters.push(dummy);
      this.ww2LiveNodes.push(dummy);

      const label = labelSprite(this.scene, `${target.name} · HP ${target.hp} · armor ${target.armor}`, pos.x, pos.z, 3.1, 0.62);
      label.userData.ww2LiveTarget = true;
      this.labels.push(label);
      this.ww2LiveNodes.push(label);
    });

    this.hud.setObjective('WW2 live: манекены выставлены перед игроком. Цифры 1–0 меняют оружие, T — сбросить цели.');
  };

  PhoenixV3Engine.prototype.openWw2ArsenalPanel = function openWw2ArsenalPanel() {
    this.paused = true;
    const quick = Object.entries(QUICK_WEAPONS)
      .map(([code, weaponId]) => `${code.replace('Digit', '')}: ${escapeHtml(ARSENAL[weaponId]?.name || weaponId)}`)
      .join(' · ');
    const rows = Object.values(WW2_ARSENAL).map((weapon) => {
      const ammo = AMMO_TYPES[weapon.ammoType]?.name || weapon.ammoType;
      return `<div class="line"><b>${weapon.icon || ''} ${escapeHtml(weapon.name)}</b> · ${escapeHtml(weapon.role || '')}<br><small>${escapeHtml(weapon.country || '—')} ${weapon.year || ''} · ${escapeHtml(ammo)} · mag ${weapon.clipSize} · dmg ${weapon.damage} · range ${weapon.range}</small><br><button data-ww2-equip="${weapon.id}">Взять в руки</button></div>`;
    }).join('');
    this.hud.openPanel(`<h2>WW2 live arsenal</h2>
      <p>Это уже не микробилд: оружие выдаётся в основной 3D игре, стреляет по живым объектам баллистикой, отображается в руках и попадает по манекенам.</p>
      <div class="line"><b>Быстрые клавиши:</b> ${quick}</div>
      <div class="line"><button id="ww2RestockBtn">Выдать весь WW2 набор + патроны</button> <button id="ww2TargetsBtn">Поставить манекены перед игроком</button></div>
      ${rows}
      <p><button id="closeMapBtn">Закрыть</button></p>`);
    document.querySelectorAll('[data-ww2-equip]').forEach((btn) => btn.addEventListener('click', () => {
      this.equipWw2Weapon(btn.dataset.ww2Equip);
      this.openWw2ArsenalPanel();
    }));
    document.getElementById('ww2RestockBtn')?.addEventListener('click', () => {
      const added = this.grantWw2LiveKit();
      this.hud.setObjective(`WW2 набор выдан. Новых предметов: ${added}.`);
      this.openWw2ArsenalPanel();
    });
    document.getElementById('ww2TargetsBtn')?.addEventListener('click', () => {
      this.closePausePanel();
      this.spawnWw2LiveTargets();
    });
    bindClose(this);
  };

  PhoenixV3Engine.prototype.activateWw2LiveMode = function activateWw2LiveMode() {
    if (!ww2LiveMode() || this.mode === 'boot') return;
    this.grantWw2LiveKit();
    if (!WW2_ARSENAL[this.player.weapon]) this.equipWw2Weapon('mp40');
    if (!this.ww2LiveNodes?.length) this.spawnWw2LiveTargets();
    this.hud.setObjective('WW2 live включён: 1–0 оружие · U меню арсенала · G патроны · T манекены · V прицел · R перезарядка.');
  };

  const originalStart = PhoenixV3Engine.prototype.start;
  PhoenixV3Engine.prototype.start = function startWithWw2LiveMode() {
    const result = originalStart.call(this);
    if (result === false) return result;
    this.activateWw2LiveMode();
    return result;
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWithWw2LiveMode(code, event) {
    if (ww2LiveMode() && this.mode !== 'boot') {
      if (QUICK_WEAPONS[code]) {
        event?.preventDefault?.();
        this.equipWw2Weapon(QUICK_WEAPONS[code]);
        return;
      }
      if (code === 'KeyU') { this.openWw2ArsenalPanel(); return; }
      if (code === 'KeyG') { this.grantWw2LiveKit(); this.hud.setObjective('WW2 патроны и набор пополнены.'); return; }
      if (code === 'KeyT') { this.spawnWw2LiveTargets(); return; }
    }
    return originalOnAction.call(this, code, event);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithWw2LiveMode(dt) {
    originalUpdate.call(this, dt);
    if (ww2LiveMode() && this.mode !== 'boot') {
      const bottom = document.getElementById('bottom');
      const weaponId = this.player?.weapon;
      const weapon = ARSENAL[weaponId];
      if (bottom) bottom.textContent = `WW2 LIVE · 1–0 оружие · U арсенал · G патроны · T цели · R reload · V aim · ${weapon?.name || weaponId} ${statusFor(this, weaponId)}`;
    }
  };
}
