import { ActorVisualSystem } from '../visuals/actorVisuals.js';

export function installActorVisualExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__actorVisualExtensionInstalled) return;
  PhoenixV3Engine.__actorVisualExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithActorVisuals() {
    originalBuildScene.call(this);
    this.actorVisuals = new ActorVisualSystem(this);
    this.actorVisuals.build();
    this.log.unshift('v3.0I: faction actor models and animation feel pass.');
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithActorVisuals(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot') this.actorVisuals?.update(dt);
  };
}
