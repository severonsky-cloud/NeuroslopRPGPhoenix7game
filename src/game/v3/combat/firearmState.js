import { ARSENAL, AMMO_TYPES } from './arsenal.js';

export function makeFirearmState() {
  return {
    weapons: {
      colt: { loaded: 6, chambered: true, condition: 0.72, jammed: false, reloadT: 0 },
      m1: { loaded: 8, chambered: true, condition: 0.68, jammed: false, reloadT: 0 },
      bren: { loaded: 18, chambered: true, condition: 0.58, jammed: false, reloadT: 0 },
      trenchShotgun: { loaded: 5, chambered: true, condition: 0.64, jammed: false, reloadT: 0 },
      caravanCarbine: { loaded: 5, chambered: true, condition: 0.76, jammed: false, reloadT: 0 },
    },
  };
}

export class FirearmStateSystem {
  constructor(player, inventory) {
    this.player = player;
    this.inventory = inventory;
    if (!player.firearmState) player.firearmState = makeFirearmState();
  }

  state(weaponId) {
    if (!this.player.firearmState.weapons[weaponId]) {
      const w = ARSENAL[weaponId];
      this.player.firearmState.weapons[weaponId] = { loaded: w?.clipSize || 1, chambered: true, condition: 0.66, jammed: false, reloadT: 0 };
    }
    return this.player.firearmState.weapons[weaponId];
  }

  canFire(weaponId) {
    const w = ARSENAL[weaponId];
    if (!w?.ammoType) return { ok: false, reason: 'not_firearm' };
    const s = this.state(weaponId);
    if (s.reloadT > 0) return { ok: false, reason: 'reloading' };
    if (s.jammed) return { ok: false, reason: 'jammed' };
    if (s.loaded <= 0) return { ok: false, reason: 'empty' };
    return { ok: true };
  }

  tryFire(weaponId, jamMul = 1, conditionWearMul = 1) {
    const w = ARSENAL[weaponId];
    const s = this.state(weaponId);
    const can = this.canFire(weaponId);
    if (!can.ok) return can;
    s.loaded -= 1;
    const baseJam = w.archetype === 'lmg' ? 0.052 : w.archetype === 'shotgun' ? 0.035 : w.archetype === 'revolver' ? 0.028 : 0.032;
    const conditionPenalty = (1 - s.condition) * 0.12;
    const jamChance = (baseJam + conditionPenalty) * jamMul;
    s.condition = Math.max(0.12, s.condition - (0.0035 * conditionWearMul));
    if (Math.random() < jamChance) {
      s.jammed = true;
      return { ok: false, reason: 'jammed_now', jamChance };
    }
    return { ok: true, loaded: s.loaded, condition: s.condition };
  }

  startReload(weaponId) {
    const w = ARSENAL[weaponId];
    if (!w?.ammoType) return { ok: false, reason: 'not_firearm' };
    const s = this.state(weaponId);
    if (s.jammed) {
      s.jammed = false;
      s.reloadT = 0.85;
      return { ok: true, clearing: true };
    }
    if (s.loaded >= w.clipSize) return { ok: false, reason: 'full' };
    if ((this.player.inventoryState.ammo[w.ammoType] || 0) <= 0) return { ok: false, reason: 'no_ammo' };
    s.reloadT = w.archetype === 'revolver' ? 1.5 : w.archetype === 'lmg' ? 2.4 : w.archetype === 'shotgun' ? 1.9 : 1.65;
    return { ok: true, reloading: true };
  }

  update(dt) {
    for (const [weaponId, s] of Object.entries(this.player.firearmState.weapons)) {
      if (s.reloadT > 0) {
        s.reloadT -= dt;
        if (s.reloadT <= 0) this.finishReload(weaponId);
      }
    }
  }

  finishReload(weaponId) {
    const w = ARSENAL[weaponId];
    const s = this.state(weaponId);
    if (!w?.ammoType) return;
    if (s.jammed) { s.jammed = false; return; }
    const need = Math.max(0, w.clipSize - s.loaded);
    const have = this.player.inventoryState.ammo[w.ammoType] || 0;
    const take = Math.min(need, have);
    this.player.inventoryState.ammo[w.ammoType] -= take;
    s.loaded += take;
    s.chambered = s.loaded > 0;
  }

  repair(weaponId, amount = 0.08) {
    const s = this.state(weaponId);
    s.condition = Math.min(1, s.condition + amount);
  }

  statusText(weaponId) {
    const w = ARSENAL[weaponId];
    if (!w?.ammoType) return '';
    const s = this.state(weaponId);
    const ammo = this.player.inventoryState.ammo[w.ammoType] || 0;
    const condition = Math.round(s.condition * 100);
    const ammoName = AMMO_TYPES[w.ammoType]?.name || w.ammoType;
    if (s.jammed) return `JAM · ${s.loaded}/${w.clipSize} · ${ammoName} ${ammo} · cond ${condition}%`;
    if (s.reloadT > 0) return `reload ${s.reloadT.toFixed(1)} · ${s.loaded}/${w.clipSize} · cond ${condition}%`;
    return `${s.loaded}/${w.clipSize} · reserve ${ammo} · cond ${condition}%`;
  }
}
