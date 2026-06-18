import { WEAPONS } from '../combat/weapons.js';

export class Hud {
  constructor() {
    this.objective = document.getElementById('objective');
    this.hpFill = document.getElementById('hpFill');
    this.stFill = document.getElementById('stFill');
    this.phFill = document.getElementById('phFill');
    this.prompt = document.getElementById('prompt');
    this.panel = document.getElementById('panel');
  }

  setObjective(text) {
    this.objective.textContent = text;
  }

  updateBars(player) {
    this.hpFill.style.width = `${100 * player.hp / player.hpMax}%`;
    this.stFill.style.width = `${100 * player.st / player.stMax}%`;
    this.phFill.style.width = `${100 * player.ph / player.phMax}%`;
  }

  update(player, biomeName, targetText) {
    const w = WEAPONS[player.weapon];
    this.setObjective(`v3 · ${biomeName} · ${w.name} · ${targetText}`);
    this.updateBars(player);
  }

  showPrompt(text) {
    this.prompt.textContent = text;
    this.prompt.style.display = 'block';
  }

  hidePrompt() {
    this.prompt.style.display = 'none';
  }

  openPanel(html) {
    this.panel.innerHTML = html;
    this.panel.style.display = 'block';
  }

  closePanel() {
    this.panel.style.display = 'none';
  }

  hitMarker(text) {
    let h = document.getElementById('hitMarker');
    if (!h) {
      h = document.createElement('div');
      h.id = 'hitMarker';
      h.style.cssText = 'position:fixed;left:50%;top:47%;transform:translate(-50%,-50%);z-index:40;color:#ffd28a;font:900 18px system-ui;text-shadow:0 0 14px #000;pointer-events:none;transition:opacity .12s';
      document.body.appendChild(h);
    }
    h.textContent = text;
    h.style.opacity = '1';
    clearTimeout(h._t);
    h._t = setTimeout(() => h.style.opacity = '0', 180);
  }
}
