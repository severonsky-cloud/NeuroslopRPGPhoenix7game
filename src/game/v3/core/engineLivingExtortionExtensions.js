// Living-world reactivity for «Налог и глина»: while the officer is still alive
// and the quest is unresolved, the КЭК clay caravan keeps getting shaken down at
// the post. When the caravan passes Дюмон and the player is near, you periodically
// witness the extortion again (subtitle + journal). It stops the moment you
// resolve the quest (Дюмон killed/arrested or a route committed). Self-contained.
const POST = { x: -69, z: 77 };
const CARAVAN_ID = 'red_rural_caravan';

const LINES = [
  'Дюмон снова берёт «пошлину» с воза глины. Так — каждый раз.',
  'Возчик молча отсчитывает кредиты. Дюмон не считает: он знает сумму.',
  'У поста опять торг не на равных — форма против глины.',
  'Караван КЭК платит и едет дальше. Дорога помнит каждую такую остановку.',
];

function ambientEl() {
  let el = document.getElementById('phxAmbientLine');
  if (!el) {
    el = document.createElement('div');
    el.id = 'phxAmbientLine';
    el.style.cssText =
      'position:fixed;left:50%;bottom:140px;transform:translateX(-50%);z-index:12;max-width:680px;text-align:center;' +
      'pointer-events:none;font:italic 600 16px Georgia,serif;color:#e9d6ad;text-shadow:0 2px 8px #000;' +
      'background:rgba(8,6,4,.4);padding:7px 16px;border-radius:4px;opacity:0;transition:opacity .3s';
    document.body.appendChild(el);
  }
  return el;
}

export function installLivingExtortionExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__livingExtortionInstalled) return;
  PhoenixV3Engine.__livingExtortionInstalled = true;

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithLivingExtortion(dt) {
    originalUpdate.call(this, dt);
    if (this.mode === 'boot' || this.paused || !this.worldState) return;
    const ws = this.worldState;

    // Fade out a shown line.
    if (this._extFade > 0) {
      this._extFade -= dt;
      const el = ambientEl();
      el.style.opacity = String(Math.max(0, Math.min(1, this._extFade / 4)));
    }

    // Only an ongoing nuisance: intro seen, officer still extorting, no route committed.
    if (!ws.getFlag('witnessed_extortion')) return;
    if (ws.getFlag('dumont_dead') || ws.getFlag('dumont_arrested')) return;
    if (ws.questStage('tax_and_clay') > 10) return;

    this._extThrottle = (this._extThrottle || 0) - dt;
    if (this._extThrottle > 0) return;

    const p = this.rig.position;
    if (Math.hypot(p.x - POST.x, p.z - POST.z) > 36) return;
    const caravan = this.livingWorld?.agents?.find((a) => a.userData.id === CARAVAN_ID);
    if (!caravan) return;
    if (Math.hypot(caravan.userData.x - POST.x, caravan.userData.z - POST.z) > 18) return;

    const line = LINES[Math.floor(Math.random() * LINES.length)];
    const el = ambientEl();
    el.textContent = line;
    el.style.opacity = '1';
    this._extFade = 5;
    this._extThrottle = 40;
    this.log?.unshift?.(`[у поста] ${line}`);
  };
}
