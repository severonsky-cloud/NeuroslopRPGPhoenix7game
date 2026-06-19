import { FortZaryaEncounter } from '../encounters/fortZaryaEncounter.js';

export function installFortEncounterExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__fortEncounterExtensionInstalled) return;
  PhoenixV3Engine.__fortEncounterExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithFortEncounter() {
    originalBuildScene.call(this);
    this.fortEncounter = new FortZaryaEncounter(this);
    this.fortEncounter.build();
    this.log.unshift('v3.0J1: Fort Zarya random encounter loop, AI vehicles, timed occupation and NPC evacuation.');
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithFortEncounter(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot' && !this.paused) {
      this.fortEncounter?.update(dt);
      const bottom = document.getElementById('bottom');
      if (bottom && this.fortEncounter) {
        const fortStatus = this.fortEncounter.statusText();
        const weapon = this.player?.weapon;
        const firearmStatus = this.firearms?.statusText?.(weapon);
        bottom.textContent = firearmStatus
          ? `R reload/clear jam · B alt · V aim · ${firearmStatus} · ${fortStatus}`
          : fortStatus;
      }
    }
  };

  const originalOpenJournal = PhoenixV3Engine.prototype.openJournal;
  PhoenixV3Engine.prototype.openJournal = function openJournalWithFortEncounter() {
    if (this.fortEncounter) this.log.unshift(this.fortEncounter.statusText());
    originalOpenJournal.call(this);
  };
}
