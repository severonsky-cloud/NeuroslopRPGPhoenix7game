import { AIFeelSystem } from '../combat/aiFeel.js';
import { WEAPONS } from '../combat/weapons.js';

export function installAIFeelExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__aiFeelExtensionInstalled) return;
  PhoenixV3Engine.__aiFeelExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithAIFeel() {
    originalBuildScene.call(this);
    this.aiFeel = new AIFeelSystem(this);
    this.aiFeel.build();
    this.log.unshift('v3.0H: AI feel, patrol alert, retreat/block/dodge and loot caches.');
  };

  const originalAttack = PhoenixV3Engine.prototype.attack;
  PhoenixV3Engine.prototype.attack = function attackWithAIFeel() {
    const weapon = WEAPONS[this.player.weapon];
    const wasGun = weapon?.kind === 'gun';
    const wasPhase = weapon?.kind === 'phase';
    originalAttack.call(this);
    if (this.mode !== 'boot' && !this.paused && (wasGun || wasPhase)) {
      this.aiFeel?.notifyNoise?.(this.rig.position, wasGun ? 58 : 34, wasGun ? 'shot' : 'phase');
    }
  };

  const originalInteract = PhoenixV3Engine.prototype.interact;
  PhoenixV3Engine.prototype.interact = function interactWithLoot() {
    if (this.paused) return originalInteract.call(this);
    const cache = this.aiFeel?.nearLoot?.(this.rig.position);
    if (cache) {
      const loot = this.aiFeel.openLoot(cache);
      this.paused = true;
      this.hud.openPanel(`<h2>Трофеи</h2><p>${cache.userData.ownerName}</p><p>${loot.length ? loot.join('<br>') : 'Ничего полезного.'}</p><p><button id="closeMapBtn">Закрыть</button></p>`);
      document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
      return;
    }
    return originalInteract.call(this);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithAIFeel(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot' && !this.paused) {
      this.aiFeel?.update(dt);
      const cache = this.aiFeel?.nearLoot?.(this.rig.position);
      if (cache) this.hud.showPrompt(`E — открыть трофеи: ${cache.userData.ownerName}`);
    }
  };
}
