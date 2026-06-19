import { PoiWorldSystem } from '../world/poiSystem.js';

export function installPoiExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__poiExtensionInstalled) return;
  PhoenixV3Engine.__poiExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithPoi() {
    const result = originalBuildScene.call(this);
    this.poiSystem = new PoiWorldSystem(this);
    this.poiSystem.build();
    this.log.unshift('v3N2: точки интереса между поселениями — находки в журнале и на карте.');
    return result;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithPoi(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot' && !this.paused) this.poiSystem?.update(dt, this.rig);
  };

  PhoenixV3Engine.prototype.getPoiDiagnostics = function getPoiDiagnostics() {
    return this.poiSystem?.diagnostics() || null;
  };
}
