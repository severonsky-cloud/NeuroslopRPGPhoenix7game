// «Намёки на механики»: у ключевых мест мира один раз всплывает атмосферный слух,
// который намекает на ещё не построенные системы (контрабанда, синдикат, репутация,
// выбор фракции, фазовые эхо, чёрный ящик). Это насыщает мир ощущением глубины,
// не строя сами системы. Самодостаточно, не трогает квест-системы Codex.
// Текст — авторский, переписывай свободно.
const HINTS = [
  { id: 'port_contraband', x: -88, z: 22, r: 26, text: 'Слух Порта Рейчел: по ночам сюда приходят грузы без печати. Скоро это станет чьим-то делом.' },
  { id: 'rednode_syndicate', x: 44, z: -34, r: 26, text: 'Красный Узел знает, кому сбыть лишнее. Синдикаты начинаются с одного должника.' },
  { id: 'fort_reputation', x: 130, z: 166, r: 24, text: 'В Форте Заря ведут учёт каждому пришлому. Здесь репутация — это валюта, и она уже копится.' },
  { id: 'langdo_allegiance', x: -35, z: 120, r: 22, text: 'Артель шепчется: красные общины однажды выберут — идти под Империю или строить свою дорогу.' },
  { id: 'tesla_phase_echo', x: 98, z: 146, r: 24, text: 'Руины Тесла-6 полны фазовых эхо. Тем, кто умеет слышать, они однажды ответят.' },
  { id: 'port_blackbox', x: -100, z: 30, r: 26, text: 'Говорят, в одном из ящиков спит то, чего не должно быть. Лучше такие ящики не открывать.' },
  { id: 'chi_phase_loop', x: 118, z: 78, r: 22, text: 'Чи-Кассини мерит петлю тракта. Фаза здесь складывает путь — и однажды кто-то по ней пройдёт.' },
];

function rumorEl() {
  let el = document.getElementById('phxRumorLine');
  if (!el) {
    el = document.createElement('div');
    el.id = 'phxRumorLine';
    el.style.cssText =
      'position:fixed;left:50%;bottom:172px;transform:translateX(-50%);z-index:12;max-width:660px;text-align:center;' +
      'pointer-events:none;font:italic 600 15px Georgia,serif;color:#cdbce6;text-shadow:0 2px 8px #000;' +
      'background:rgba(14,10,20,.5);border-left:2px solid #6f5cff;padding:7px 16px;border-radius:4px;opacity:0;transition:opacity .35s';
    document.body.appendChild(el);
  }
  return el;
}

export function installMechanicHintsExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__mechanicHintsInstalled) return;
  PhoenixV3Engine.__mechanicHintsInstalled = true;

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithMechanicHints(dt) {
    originalUpdate.call(this, dt);
    if (this.mode === 'boot' || this.paused || !this.worldState) return;

    // Fade the current rumor out.
    if (this._hintFade > 0) {
      this._hintFade -= dt;
      rumorEl().style.opacity = String(Math.max(0, Math.min(1, this._hintFade / 5)));
    }

    this._hintThrottle = (this._hintThrottle || 0) - dt;
    if (this._hintThrottle > 0) return;

    const p = this.rig.position;
    for (const hint of HINTS) {
      const seenKey = `hint_${hint.id}`;
      if (this.worldState.getFlag(seenKey)) continue;
      if (Math.hypot(p.x - hint.x, p.z - hint.z) > hint.r) continue;
      this.worldState.setFlag(seenKey);
      const el = rumorEl();
      el.textContent = `◇ ${hint.text}`;
      el.style.opacity = '1';
      this._hintFade = 6;
      this._hintThrottle = 8;
      this.log?.unshift?.(`Слух: ${hint.text}`);
      break;
    }
  };

  PhoenixV3Engine.prototype.getMechanicHintsDiagnostics = function getMechanicHintsDiagnostics() {
    if (!this.worldState) return null;
    return {
      total: HINTS.length,
      seen: HINTS.filter((h) => this.worldState.getFlag(`hint_${h.id}`)).map((h) => h.id),
    };
  };
}
