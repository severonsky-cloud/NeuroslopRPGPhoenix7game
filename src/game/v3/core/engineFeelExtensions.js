import { GunFeelSystem } from '../feel/gunFeel.js';
import { ReloadFeelSystem } from '../feel/reloadFeel.js';
import { HitFeelSystem } from '../feel/hitFeel.js';
import { MusicDirector } from '../audio/musicDirector.js';
import { WEAPONS } from '../combat/weapons.js';
import { triggerWeaponViewModelAction } from '../items/weaponModels.js';

export function installFeelExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__feelExtensionInstalled) return;
  PhoenixV3Engine.__feelExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithFeel() {
    originalBuildScene.call(this);
    this.gunFeel = new GunFeelSystem(this);
    this.reloadFeel = new ReloadFeelSystem(this);
    this.hitFeel = new HitFeelSystem(this);
    this.musicDirector = new MusicDirector();
    this.log.unshift('v3.0K3: visible hit reactions, target flash, stagger feedback, floating damage and player hit edge flash.');

    if (this.ballistics && !this.ballistics.__feelWrapped) {
      this.ballistics.__feelWrapped = true;
      const rawFire = this.ballistics.fire.bind(this.ballistics);
      this.ballistics.fire = (args) => {
        const result = rawFire(args);
        this.gunFeel?.shot?.(args.weaponId, result);
        const hit = result?.results?.find(r => r.hit);
        if (hit?.target) {
          this.gunFeel?.flashTarget?.(hit.target);
          this.hitFeel?.hitActor?.(hit.target, {
            damage: hit.damage,
            kind: hit.damage >= 24 ? 'heavy' : 'medium',
            phase: args.weaponId === 'phase',
          });
        }
        return result;
      };
    }

    if (this.armedWorld && !this.armedWorld.__hitFeelWrapped) {
      this.armedWorld.__hitFeelWrapped = true;
      const rawDealDamage = this.armedWorld.dealDamage.bind(this.armedWorld);
      this.armedWorld.dealDamage = (target, dmg, kind) => {
        rawDealDamage(target, dmg, kind);
        if (target === 'player') {
          this.hitFeel?.playerHit?.({ damage: dmg, kind });
        } else if (target?.userData) {
          this.hitFeel?.hitActor?.(target, { damage: dmg, kind: dmg >= 20 ? 'heavy' : 'medium' });
        }
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
      this.hitFeel?.update?.(dt);
      const enemiesNear = [...(this.monsters || []), ...(this.livingWorld?.agents || [])]
        .filter(o => o?.userData?.alive !== false && o.position?.distanceTo?.(this.rig.position) < 32).length;
      this.musicDirector?.setCombatIntensity?.(Math.min(1, enemiesNear / 6));
    }
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWithFeel(code, event) {
    const before = this.player?.weapon;
    const cooldownBefore = this.cooldown;
    const result = originalOnAction.call(this, code, event);
    if (code === 'KeyV' || before !== this.player?.weapon) this.gunFeel?.bumpCrosshair?.(0.45);
    if (code === 'MouseLeft' || code === 'Space') {
      const w = WEAPONS[this.player.weapon];
      if (w?.kind !== 'gun') this.gunFeel?.bumpCrosshair?.(0.35);
      if (this.cooldown > cooldownBefore) triggerWeaponViewModelAction(this.hands, 'primary');
    }
    if (code === 'KeyB' && this.cooldown > cooldownBefore) triggerWeaponViewModelAction(this.hands, 'alternate');
    return result;
  };
}
