import { setWeaponViewModelReloadState } from '../items/weaponModels.js';

const RELOAD_PROFILES = {
  colt: {
    label: 'REVOLVER RELOAD',
    total: 1.5,
    stages: [
      ['open cylinder', 0.22],
      ['eject brass', 0.44],
      ['insert rounds', 0.76],
      ['snap shut', 1.0],
    ],
    hand: 'revolver',
  },
  m1: {
    label: 'RIFLE CLIP',
    total: 1.65,
    stages: [
      ['pull bolt', 0.18],
      ['seat clip', 0.58],
      ['chamber round', 0.82],
      ['ready', 1.0],
    ],
    hand: 'rifle',
  },
  bren: {
    label: 'TOP MAGAZINE',
    total: 2.4,
    stages: [
      ['drop shoulder', 0.14],
      ['remove magazine', 0.42],
      ['lock new magazine', 0.72],
      ['rack bolt', 0.92],
      ['ready', 1.0],
    ],
    hand: 'lmg',
  },
  trenchShotgun: {
    label: 'SHELL BY SHELL',
    total: 1.9,
    stages: [
      ['open action', 0.2],
      ['load shells', 0.68],
      ['close action', 0.9],
      ['ready', 1.0],
    ],
    hand: 'shotgun',
  },
  caravanCarbine: {
    label: 'CARBINE RELOAD',
    total: 1.65,
    stages: [
      ['open bolt', 0.2],
      ['feed clip', 0.6],
      ['close bolt', 0.86],
      ['ready', 1.0],
    ],
    hand: 'rifle',
  },
};

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

export class ReloadFeelSystem {
  constructor(engine) {
    this.engine = engine;
    this.active = false;
    this.weaponId = null;
    this.total = 1;
    this.elapsed = 0;
    this.lastStage = '';
    this.pulse = 0;
    this.jamT = 0;
    this.buildDom();
  }

  buildDom() {
    this.overlay = makeDiv('phxReloadOverlay', 'position:fixed;left:50%;top:64%;transform:translate(-50%,-50%);z-index:42;pointer-events:none;min-width:360px;text-align:center;color:#f3dca8;text-shadow:0 3px 12px #000;opacity:0;transition:opacity .08s linear;');
    this.title = makeDiv('phxReloadTitle', 'font:900 22px system-ui;letter-spacing:.12em;color:#ffd28a;');
    this.stage = makeDiv('phxReloadStage', 'font:700 13px system-ui;letter-spacing:.08em;margin-top:4px;opacity:.86;text-transform:uppercase;');
    this.bar = makeDiv('phxReloadBigBar', 'height:10px;background:rgba(0,0,0,.65);border:1px solid rgba(216,166,77,.55);margin-top:10px;overflow:hidden;box-shadow:0 0 18px rgba(216,166,77,.18);');
    this.fill = makeDiv('phxReloadBigFill', 'height:100%;width:0%;background:linear-gradient(90deg,#8b5b25,#ffd28a);');
    this.bar.appendChild(this.fill);
    this.overlay.append(this.title, this.stage, this.bar);

    this.jam = makeDiv('phxJamWarning', 'position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:43;pointer-events:none;color:#ff8a5f;text-align:center;font:900 30px system-ui;letter-spacing:.12em;text-shadow:0 0 18px #000;opacity:0;');
  }

  profile(weaponId) { return RELOAD_PROFILES[weaponId] || RELOAD_PROFILES.caravanCarbine; }

  start(weaponId, info = {}) {
    const p = this.profile(weaponId);
    this.weaponId = weaponId;
    this.total = info.duration || (info.clearing ? 0.85 : p.total);
    this.elapsed = 0;
    this.active = true;
    this.lastStage = '';
    this.pulse = 0.22;
    this.title.textContent = info.clearing ? 'CLEARING JAM' : p.label;
    this.overlay.style.opacity = '1';
    this.engine.combatAudio?.reload?.(p.hand);
  }

  jammed() {
    this.jamT = 0.85;
    this.jam.innerHTML = 'JAMMED<br><span style="font-size:16px;letter-spacing:.08em;color:#ffd8c6">PRESS R</span>';
    this.jam.style.opacity = '1';
  }

  currentStage(progress) {
    const p = this.profile(this.weaponId);
    for (const [name, at] of p.stages) if (progress <= at) return name;
    return 'ready';
  }

  stageSound(name) {
    if (name === this.lastStage) return;
    this.lastStage = name;
    if (name.includes('bolt') || name.includes('chamber') || name.includes('rack')) this.engine.combatAudio?.reload?.('rifle');
    if (name.includes('insert') || name.includes('load') || name.includes('seat')) this.engine.combatAudio?.reload?.('mag');
    if (name.includes('snap') || name.includes('close') || name.includes('ready')) this.engine.combatAudio?.reload?.('click');
  }

  animateHands(progress) {
    setWeaponViewModelReloadState(this.engine.hands, {
      active: true,
      progress,
      stage: this.currentStage(progress),
      weaponId: this.weaponId,
    });
  }

  update(dt) {
    const weaponId = this.engine.player.weapon;
    const state = this.engine.firearms?.state?.(weaponId);
    if (state?.jammed) this.jammed();
    this.jamT = Math.max(0, this.jamT - dt);
    this.jam.style.opacity = String(Math.min(1, this.jamT * 2.2));

    if (!this.active) return;
    this.elapsed += dt;
    const progress = clamp01(this.elapsed / this.total);
    const stage = this.currentStage(progress);
    this.stage.textContent = stage;
    this.fill.style.width = `${Math.round(progress * 100)}%`;
    this.stageSound(stage);
    this.animateHands(progress);

    if (progress >= 1 || !state || state.reloadT <= 0) {
      this.active = false;
      this.overlay.style.opacity = '0';
      setWeaponViewModelReloadState(this.engine.hands, {
        active: false,
        progress: 1,
        stage: 'ready',
        weaponId: this.weaponId,
      });
    }
  }
}
