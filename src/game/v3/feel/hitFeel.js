import * as THREE from '../vendor/three.module.js';

function makeDiv(id, css) {
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement('div');
    node.id = id;
    document.body.appendChild(node);
  }
  if (css) node.style.cssText = css;
  return node;
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

export class HitFeelSystem {
  constructor(engine) {
    this.engine = engine;
    this.floats = [];
    this.pulses = [];
    this.hitPauseT = 0;
    this.buildDom();
  }

  buildDom() {
    this.layer = makeDiv('phxFloatDamageLayer', 'position:fixed;inset:0;z-index:41;pointer-events:none;overflow:hidden;');
    this.center = makeDiv('phxCenterHitPulse', 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:42;pointer-events:none;color:#fff;text-align:center;font:900 28px system-ui;text-shadow:0 0 12px #000;opacity:0;');
    this.edge = makeDiv('phxPlayerHitEdge', 'position:fixed;inset:0;z-index:39;pointer-events:none;background:radial-gradient(circle at 50% 50%, transparent 45%, rgba(255,110,70,.22) 100%);opacity:0;');
  }

  hitActor(obj, opts = {}) {
    if (!obj || !obj.userData) return;
    const damage = Math.max(1, Math.round(opts.damage || 1));
    const kind = opts.kind || 'medium';
    const phase = opts.phase || false;
    const strong = kind === 'heavy' || damage >= 24 || phase;
    const color = phase ? '#b99cff' : strong ? '#ffd28a' : '#ffffff';

    obj.userData.hitFeelT = strong ? 0.18 : 0.11;
    obj.userData.hitFeelKind = kind;
    obj.userData.staggerT = Math.max(obj.userData.staggerT || 0, strong ? 0.42 : 0.22);

    const away = obj.position.clone().sub(this.engine.rig.position).setY(0);
    if (away.lengthSq() < 0.01) away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    away.normalize();
    obj.position.addScaledVector(away, strong ? 0.42 : 0.18);
    obj.rotation.z = (Math.random() - 0.5) * (strong ? 0.42 : 0.22);
    setTimeout(() => { if (obj?.rotation) obj.rotation.z = 0; }, strong ? 180 : 110);

    this.flashMaterials(obj, phase ? 0x8a78ff : 0xffe6a8, strong ? 0x7a3c10 : 0x332211);
    this.floatText(obj.position.clone().add(new THREE.Vector3(0, 1.65, 0)), `-${damage}`, color, strong ? 1.25 : 1.0);
    this.centerPulse(strong ? 'HIT' : '×', color, strong ? 0.22 : 0.14);
    if (strong) this.hitPauseT = Math.max(this.hitPauseT, 0.035);
    this.engine.combatAudio?.hit?.(strong ? 'armor' : 'body');
  }

  playerHit(opts = {}) {
    const damage = Math.max(1, Math.round(opts.damage || 1));
    this.edge.style.opacity = String(Math.min(0.8, 0.22 + damage / 80));
    this.centerPulse(`-${damage}`, '#ff8a5f', 0.26);
    this.engine.combatAudio?.hit?.('body');
  }

  centerPulse(text, color, life) {
    this.center.textContent = text;
    this.center.style.color = color;
    this.center.style.opacity = '1';
    this.center.style.transform = 'translate(-50%,-50%) scale(1.18)';
    this.pulses.push({ node: this.center, life, max: life });
  }

  floatText(worldPos, text, color, scale = 1) {
    const node = document.createElement('div');
    node.textContent = text;
    node.style.cssText = `position:fixed;left:0;top:0;transform:translate(-50%,-50%) scale(${scale});color:${color};font:900 18px system-ui;text-shadow:0 0 8px #000,0 2px 8px #000;opacity:1;`;
    this.layer.appendChild(node);
    this.floats.push({ node, worldPos, life: 0.75, max: 0.75, lift: 0 });
  }

  flashMaterials(obj, color, emissive) {
    obj.traverse?.(m => {
      if (!m.isMesh || !m.material) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        if (!mat) continue;
        if (!m.userData._hitOldColor && mat.color) m.userData._hitOldColor = mat.color.clone();
        if (!m.userData._hitOldEmissive && mat.emissive) m.userData._hitOldEmissive = mat.emissive.clone();
        if (mat.color) mat.color.set(color);
        if (mat.emissive) mat.emissive.set(emissive);
      }
    });
  }

  restoreMaterials(obj) {
    obj.traverse?.(m => {
      if (!m.isMesh || !m.material) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        if (!mat) continue;
        if (m.userData._hitOldColor && mat.color) mat.color.copy(m.userData._hitOldColor);
        if (m.userData._hitOldEmissive && mat.emissive) mat.emissive.copy(m.userData._hitOldEmissive);
      }
    });
  }

  updateActorFlashes(dt) {
    const actors = [...(this.engine.monsters || []), ...(this.engine.livingWorld?.agents || [])];
    for (const obj of actors) {
      if (!obj.userData?.hitFeelT) continue;
      obj.userData.hitFeelT -= dt;
      const shake = Math.sin(performance.now() * 0.05) * 0.018;
      obj.position.x += shake;
      if (obj.userData.hitFeelT <= 0) {
        obj.userData.hitFeelT = 0;
        this.restoreMaterials(obj);
      }
    }
  }

  updateFloats(dt) {
    for (const f of this.floats) {
      f.life -= dt;
      f.lift += dt * 1.1;
      const pos = f.worldPos.clone();
      pos.y += f.lift;
      const screen = pos.project(this.engine.camera);
      const x = (screen.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screen.y * 0.5 + 0.5) * window.innerHeight;
      f.node.style.left = `${x}px`;
      f.node.style.top = `${y}px`;
      f.node.style.opacity = String(clamp01(f.life / f.max));
      if (f.life <= 0) { f.node.remove(); f.dead = true; }
    }
    this.floats = this.floats.filter(f => !f.dead);
  }

  updatePulses(dt) {
    for (const p of this.pulses) {
      p.life -= dt;
      const k = clamp01(p.life / p.max);
      p.node.style.opacity = String(k);
      p.node.style.transform = `translate(-50%,-50%) scale(${1 + (1 - k) * 0.34})`;
      if (p.life <= 0) p.dead = true;
    }
    this.pulses = this.pulses.filter(p => !p.dead);
    const edgeOpacity = Number(this.edge.style.opacity || 0);
    this.edge.style.opacity = String(Math.max(0, edgeOpacity - dt * 2.8));
  }

  update(dt) {
    this.updateActorFlashes(dt);
    this.updateFloats(dt);
    this.updatePulses(dt);
  }
}
