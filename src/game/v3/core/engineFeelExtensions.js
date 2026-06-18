import { GunFeelSystem } from '../feel/gunFeel.js';
import { ReloadFeelSystem } from '../feel/reloadFeel.js';
import { MusicDirector } from '../audio/musicDirector.js';
import { WEAPONS } from '../combat/weapons.js';

export function installFeelExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__feelExtensionInstalled) return;
  PhoenixV3Engine.__feelExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithFeel() {
    originalBuildScene.call(this);
    this.gunFeel = new GunFeelSystem(this);
    this.reloadFeel = new ReloadFeelSystem(this);
    this.musicDirector = new MusicDirector();
    this.log.unshift('v3.0K2: gun feel plus visible reload stages, jam warning, weapon reload animation and music director.');

    if (this.ballistics && !this.ballistics.__feelWrapped) {
      this.ballistics.__feelWrapped = true;
      const rawFire = this.ballistics.fire.bind(this.ballistics);
      this.ballistics.fire = (args) => {
        const result = rawFire(args);
        this.gunFeel?.shot?.(args.weaponId, result);
        const hit = result?.results?.find(r => r.hit);
        if (hit?.target) this.gunFeel?.flashTarget?.(hit.target);
        return result;
      };
    }

    if (this.firearms && !this.firearms.__feelWrapped) {
      this.firearms.__feelWrapped = true;
      const rawTryFire = this.firearms.tryFire.bind(this.firearms);
      this.firearms.tryFire = (weaponId, jamMul, wearMul) => {
        const result = rawTryFire(weaponId, jamMul, wearMul);
        if (!result.ok && (result.reason === 'jammed' || result.reason === 'jammed_now')) {
          this.gunFeel?.jam?.();
          this.reloadFeel?.jammed?.();
        }
        return result;
      };
      const rawStartReload = this.firearms.startReload.bind(this.firearms);
      this.firearms.startReload = (weaponId) => {
        const result = rawStartReload(weaponId);
        if (result.ok) {
          this.gunFeel?.reloadStart?.(weaponId);
          this.reloadFeel?.start?.(weaponId, result);
        }
        return result;
      };
    }
  };

  const originalStart = PhoenixV3Engine.prototype.start;
  PhoenixV3Engine.prototype.start = function startWithMusic() {
    originalStart.call(this);
    this.musicDirector?.start?.();
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithFeel(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot') {
      this.gunFeel?.update?.(dt);
      this.reloadFeel?.update?.(dt);
      const enemiesNear = [...(this.monsters || []), ...(this.livingWorld?.agents || [])]
        .filter(o => o?.userData?.alive !== false && o.position?.distanceTo?.(this.rig.position) < 32).length;
      this.musicDirector?.setCombatIntensity?.(Math.min(1, enemiesNear / 6));
    }
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWithFeel(code, event) {
    const before = this.player?.weapon;
    const result = originalOnAction.call(this, code, event);
    if (code === 'KeyV' || before !== this.player?.weapon) this.gunFeel?.bumpCrosshair?.(0.45);
    if (code === 'MouseLeft' || code === 'Space') {
      const w = WEAPONS[this.player.weapon];
      if (w?.kind !== 'gun') this.gunFeel?.bumpCrosshair?.(0.35);
    }
    return result;
  };
}
