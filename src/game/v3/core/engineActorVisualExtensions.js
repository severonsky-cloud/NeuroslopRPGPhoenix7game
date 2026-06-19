import { ActorVisualSystem } from '../visuals/actorVisuals.js';
import { PlayerVisualSystem } from '../visuals/playerVisuals.js';

export function installActorVisualExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__actorVisualExtensionInstalled) return;
  PhoenixV3Engine.__actorVisualExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithActorVisuals() {
    originalBuildScene.call(this);
    this.actorVisuals = new ActorVisualSystem(this);
    this.actorVisuals.build();
    this.playerVisuals = new PlayerVisualSystem(this);
    this.playerVisuals.build();
    this.log.unshift('v3.0L1: player world body, grounded movement silhouette and upgraded first-person presence.');
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithActorVisuals(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot') {
      this.actorVisuals?.update(dt);
      this.playerVisuals?.update(dt);
    }
  };
}
