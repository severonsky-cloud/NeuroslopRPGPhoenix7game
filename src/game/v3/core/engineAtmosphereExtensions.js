import { biomeAt, heightAt } from '../world/terrain.js';
import { VisualAtmosphereSystem } from '../visuals/visualAtmosphere.js';

function captureAtmosphereState(engine) {
  return {
    fogColor: engine.scene.fog?.color.clone(),
    fogDensity: engine.scene.fog?.density,
    background: engine.scene.background?.clone?.(),
    hemiColor: engine.atmosphere?.hemi?.color.clone(),
    hemiGround: engine.atmosphere?.hemi?.groundColor.clone(),
  };
}

function restoreAtmosphereState(engine, snapshot) {
  if (!snapshot) return;
  if (snapshot.fogColor && engine.scene.fog) engine.scene.fog.color.copy(snapshot.fogColor);
  if (Number.isFinite(snapshot.fogDensity) && engine.scene.fog) engine.scene.fog.density = snapshot.fogDensity;
  if (snapshot.background && engine.scene.background?.copy) engine.scene.background.copy(snapshot.background);
  if (snapshot.hemiColor && engine.atmosphere?.hemi) engine.atmosphere.hemi.color.copy(snapshot.hemiColor);
  if (snapshot.hemiGround && engine.atmosphere?.hemi) engine.atmosphere.hemi.groundColor.copy(snapshot.hemiGround);
}

export function installAtmosphereExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__visualAtmosphereExtensionInstalled) return;
  PhoenixV3Engine.__visualAtmosphereExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithV3L4Atmosphere() {
    const result = originalBuildScene.call(this);
    this.visualAtmosphere = new VisualAtmosphereSystem(this);
    this.visualAtmosphere.build();
    this.log.unshift('v3.0L4: cinematic sky, coastal haze, grounded road edges and roadside dressing.');
    return result;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithV3L4Atmosphere(dt) {
    const nextBiome = biomeAt(this.rig.position.x, this.rig.position.z);
    const changingBiome = this.mode !== 'boot' && nextBiome !== this.currentBiomeId;
    const beforeTransition = changingBiome ? captureAtmosphereState(this) : null;
    originalUpdate.call(this, dt);
    if (this.mode === 'boot') return;
    if (beforeTransition) restoreAtmosphereState(this, beforeTransition);
    this.visualAtmosphere?.update(dt);
    this.visualAtmosphere?.recordFrame(dt * 1000);
  };

  PhoenixV3Engine.prototype.getVisualAtmosphereDiagnostics = function getVisualAtmosphereDiagnostics() {
    const diagnostics = this.visualAtmosphere?.diagnostics?.() || {};
    const roads = [];
    this.scene.traverse((node) => {
      if (!node.isMesh || ![
        'terrain_hugging_road_segment',
        'road_embedded_edges',
        'road-grounded-dirt-shoulders',
      ].includes(node.name)) return;
      const position = node.geometry?.attributes?.position;
      if (!position) return;
      let maxGap = -Infinity;
      let minGap = Infinity;
      const world = node.matrixWorld;
      const sampleStep = Math.max(1, Math.floor(position.count / 80));
      for (let index = 0; index < position.count; index += sampleStep) {
        const point = {
          x: position.getX(index),
          y: position.getY(index),
          z: position.getZ(index),
        };
        const worldX = world.elements[0] * point.x + world.elements[4] * point.y + world.elements[8] * point.z + world.elements[12];
        const worldY = world.elements[1] * point.x + world.elements[5] * point.y + world.elements[9] * point.z + world.elements[13];
        const worldZ = world.elements[2] * point.x + world.elements[6] * point.y + world.elements[10] * point.z + world.elements[14];
        const gap = worldY - heightAt(worldX, worldZ);
        maxGap = Math.max(maxGap, gap);
        minGap = Math.min(minGap, gap);
      }
      roads.push({ name: node.name, minGap, maxGap });
    });
    return {
      ...diagnostics,
      roadMeshes: roads.length,
      roadGapRange: roads.length
        ? {
          min: Math.min(...roads.map((road) => road.minGap)),
          max: Math.max(...roads.map((road) => road.maxGap)),
        }
        : null,
    };
  };

}
