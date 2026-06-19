import * as THREE from '../vendor/three.module.js';
import { ARSENAL } from '../combat/arsenal.js';

const FEEL = {
  colt: { kick: 0.055, side: 0.018, weaponBack: 0.10, flash: 0.12, shake: 0.018, cross: 1.2 },
  m1: { kick: 0.075, side: 0.010, weaponBack: 0.16, flash: 0.16, shake: 0.024, cross: 1.4 },
  bren: { kick: 0.038, side: 0.034, weaponBack: 0.13, flash: 0.14, shake: 0.030, cross: 1.8 },
  trenchShotgun: { kick: 0.115, side: 0.022, weaponBack: 0.24, flash: 0.22, shake: 0.042, cross: 2.0 },
  caravanCarbine: { kick: 0.056, side: 0.012, weaponBack: 0.13, flash: 0.13, shake: 0.020, cross: 1.3 },
};

function el(id, css) {
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement('div');
    node.id = id;
    document.body.appendChild(node);
  }
  if (css) node.style.cssText = css;
  return node;
}

function lerp(a, b, t) { return a + (b - a) * t; }

export class GunFeelSystem {
  constructor(engine) {
    this.engine = engine;
    this.recoilX = 0;
    this.recoilY = 0;
    this.weaponBack = 0;
    this.weaponRot = 0;
    this.shakeT = 0;
    this.flashT = 0;
    this.hitT = 0;
    this.reloadPulse = 0;
    this.lastWeapon = null;
    this.initDom();
  }

  initDom() {
    this.hitMarker = el('phxHitMarker', 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;pointer-events:none;color:#fff;font:900 32px system-ui;text-shadow:0 0 10px #000;opacity:0;');
    this.ammoHud = el('phxAmmoHud', 'position:fixed;right:18px;bottom:18px;z-index:13;pointer-events:none;min-width:260px;background:rgba(9,7,5,.68);border:1px solid rgba(216,166,77,.45);padding:10px 12px;color:#f3dca8;font:700 14px system-ui;text-shadow:0 2px 8px #000;');
    this.reloadBar = el('phxReloadBar', 'height:7px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.12);margin-top:7px;overflow:hidden;');
    this.reloadFill = el('phxReloadFill', 'height:100%;width:0%;background:#d8a64d;');
    this.reloadBar.appendChild(this.reloadFill);
    this.screenFlash = el('phxScreenFlash', 'position:fixed;inset:0;z-index:12;pointer-events:none;background:radial-gradient(circle at 50% 50%, rgba(255,210,138,.15), transparent 48%);opacity:0;');
    this.muzzle = new THREE.Group();
    this.muzzle.name = 'gun_feel_muzzle_flash';
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0.0, depthTest: false });
    this.flashMesh = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 8), flashMat);
    this.flashMesh.rotation.x = -Math.PI / 2;
    this.flashMesh.position.set(0, 0, -0.16);
    this.light = new THREE.PointLight(0xffc06a, 0, 4.0);
    this.light.position.set(0, 0, -0.04);
    this.muzzle.add(this.flashMesh, this.light);
    this.engine.camera.add(this.muzzle);
  }

  attachMuzzle() {
    const anchor = this.engine.hands?.userData?.muzzleAnchor;
    if (!anchor) {
      if (this.muzzle.parent !== this.engine.camera) {
        this.engine.camera.attach(this.muzzle);
      }
      this.flashMesh.visible = false;
      this.light.visible = false;
      return;
    }
    if (this.muzzle.parent !== anchor) {
      anchor.attach(this.muzzle);
      this.muzzle.position.set(0, 0, 0);
      this.muzzle.rotation.set(0, 0, 0);
    }
    this.flashMesh.visible = true;
    this.light.visible = true;
  }

  shot(weaponId, result) {
    const f = FEEL[weaponId] || FEEL.caravanCarbine;
    const control = this.engine.player.characterRuntime?.firearmSpread || 1;
    this.recoilX += f.kick * control * (0.82 + Math.random() * 0.36);
    this.recoilY += (Math.random() - 0.5) * f.side * control;
    this.weaponBack = Math.max(this.weaponBack, f.weaponBack);
    this.weaponRot += (Math.random() - 0.5) * 0.18;
    this.shakeT = Math.max(this.shakeT, 0.13);
    this.flashT = Math.max(this.flashT, f.flash);
    this.screenFlash.style.opacity = String(Math.min(0.45, f.flash * 1.5));
    this.bumpCrosshair(f.cross);
    if (result?.results?.some(r => r.hit)) this.hit(true);
    this.engine.combatAudio?.fire?.(weaponId === 'bren' ? 'lmg' : weaponId === 'colt' ? 'revolver' : 'rifle');
  }

  jam() {
    this.bumpCrosshair(0.7);
    this.screenFlash.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,80,50,.18), transparent 46%)';
    this.screenFlash.style.opacity = '0.38';
    this.hitMarker.textContent = 'JAM';
    this.hitMarker.style.color = '#ff8a5f';
    this.hitMarker.style.opacity = '1';
    this.hitT = 0.35;
    this.engine.combatAudio?.jam?.();
  }

  reloadStart() { this.reloadPulse = 0.35; this.engine.combatAudio?.reload?.('rifle'); }

  hit(strong = false) {
    this.hitMarker.textContent = strong ? '✦' : '×';
    this.hitMarker.style.color = strong ? '#ffd28a' : '#ffffff';
    this.hitMarker.style.opacity = '1';
    this.hitT = strong ? 0.24 : 0.16;
    this.engine.combatAudio?.hit?.('body');
  }

  bumpCrosshair(power) {
    const c = document.getElementById('crosshair');
    if (!c) return;
    c.style.transform = `translate(-50%,-50%) scale(${1 + power * 0.22})`;
    c.style.opacity = '1';
    setTimeout(() => { c.style.transform = 'translate(-50%,-50%) scale(1)'; }, 70);
  }

  flashTarget(obj) {
    if (!obj || obj.userData.__flashT) return;
    obj.userData.__flashT = 0.12;
    obj.traverse?.(m => {
      if (!m.isMesh || !m.material) return;
      if (!m.userData._oldColor && m.material.color) m.userData._oldColor = m.material.color.clone();
      if (m.material.color) m.material.color.set(0xffe6a8);
      if (m.material.emissive) m.material.emissive.set(0x8a4a10);
    });
  }

  updateTargetFlashes(dt) {
    const actors = [...(this.engine.monsters || []), ...(this.engine.livingWorld?.agents || [])];
    for (const obj of actors) {
      if (!obj.userData.__flashT) continue;
      obj.userData.__flashT -= dt;
      if (obj.userData.__flashT <= 0) {
        obj.userData.__flashT = 0;
        obj.traverse?.(m => {
          if (!m.isMesh || !m.material) return;
          if (m.userData._oldColor && m.material.color) m.material.color.copy(m.userData._oldColor);
          if (m.material.emissive) m.material.emissive.set(0x000000);
        });
      }
    }
  }

  weaponStatus() {
    const weaponId = this.engine.player.weapon;
    const w = ARSENAL[weaponId];
    const fs = this.engine.firearms?.state?.(weaponId);
    if (!w?.ammoType || !fs) return `<b>${w?.name || weaponId}</b>`;
    const reserve = this.engine.player.inventoryState?.ammo?.[w.ammoType] || 0;
    const cond = Math.round((fs.condition || 0) * 100);
    const reload = fs.reloadT > 0;
    const jam = fs.jammed;
    return `<b>${w.name}</b><br><span style="font-size:24px;color:${jam ? '#ff8a5f' : '#ffd28a'}">${jam ? 'JAM' : `${fs.loaded}/${w.clipSize}`}</span> <span style="opacity:.75">reserve ${reserve}</span><br><span style="opacity:.8">condition ${cond}% ${reload ? ' · RELOADING' : ''}</span>`;
  }

  update(dt) {
    const cam = this.engine.camera;
    cam.rotation.x = this.engine.pitch - this.recoilX;
    cam.rotation.y = this.recoilY;
    this.recoilX = lerp(this.recoilX, 0, Math.min(1, dt * 9));
    this.recoilY = lerp(this.recoilY, 0, Math.min(1, dt * 8));

    if (this.engine.hands) {
      const recoilRoot = this.engine.hands.userData?.recoilRoot || this.engine.hands;
      recoilRoot.position.z = this.weaponBack;
      recoilRoot.rotation.z = this.weaponRot;
      this.weaponBack = lerp(this.weaponBack, 0, Math.min(1, dt * 12));
      this.weaponRot = lerp(this.weaponRot, 0, Math.min(1, dt * 10));
    }

    this.attachMuzzle();
    this.flashT = Math.max(0, this.flashT - dt);
    const flashAlpha = Math.min(1, this.flashT * 9);
    if (this.flashMesh) this.flashMesh.material.opacity = flashAlpha;
    if (this.light) this.light.intensity = flashAlpha * 2.7;
    const curFlash = Number(this.screenFlash.style.opacity || 0);
    this.screenFlash.style.opacity = String(Math.max(0, curFlash - dt * 4));
    if (curFlash <= 0.02) this.screenFlash.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,210,138,.15), transparent 48%)';

    this.hitT = Math.max(0, this.hitT - dt);
    this.hitMarker.style.opacity = String(Math.min(1, this.hitT * 5));

    this.ammoHud.innerHTML = this.weaponStatus();
    const weaponId = this.engine.player.weapon;
    const fs = this.engine.firearms?.state?.(weaponId);
    const total = fs?.reloadT ? Math.max(0.001, fs.reloadT) : 0;
    if (fs?.reloadT > 0) {
      const pulse = 0.5 + Math.sin(performance.now() * 0.012) * 0.5;
      this.reloadFill.style.width = `${Math.round((1 - Math.min(1, fs.reloadT / 2.5)) * 100)}%`;
      this.reloadFill.style.opacity = String(0.65 + pulse * 0.35);
    } else {
      this.reloadFill.style.width = '0%';
    }
    if (!this.ammoHud.contains(this.reloadBar)) this.ammoHud.appendChild(this.reloadBar);
    this.updateTargetFlashes(dt);
  }
}
