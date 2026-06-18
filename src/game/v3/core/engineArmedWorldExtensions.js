import { CombatAudio } from '../audio/combatAudio.js';
import { ArmedWorldSystem } from '../combat/armedWorld.js';

export function installArmedWorldExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__armedWorldExtensionInstalled) return;
  PhoenixV3Engine.__armedWorldExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithArmedWorld() {
    originalBuildScene.call(this);
    this.combatAudio = new CombatAudio();
    this.armedWorld = new ArmedWorldSystem(this, this.combatAudio);
    this.armedWorld.build();
    this.log.unshift('v3.0G: вооружённые NPC, патрули, фракционные стычки и procedural combat audio.');
  };

  const originalStart = PhoenixV3Engine.prototype.start;
  PhoenixV3Engine.prototype.start = function startWithAudio() {
    originalStart.call(this);
    this.combatAudio?.ensure?.();
    this.hud.setObjective('v3.0G ready · armed patrols · enemies attack · sounds enabled after click');
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateArmedWorld(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot' && !this.paused) {
      this.armedWorld?.update(dt);
      const bottom = document.getElementById('bottom');
      if (bottom && !bottom.textContent.includes('R reload')) {
        bottom.textContent = 'NPC armed combat · Империя / Жужжер / рыцари / маги / элементали вооружены · J журнал';
      }
    }
  };

  const originalOpenJournal = PhoenixV3Engine.prototype.openJournal;
  PhoenixV3Engine.prototype.openJournal = function openJournalWithCombat() {
    const combat = this.armedWorld?.combatLog || [];
    if (combat.length) this.log.unshift(...combat.slice(0, 4));
    originalOpenJournal.call(this);
  };
}
