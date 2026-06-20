import * as THREE from '../vendor/three.module.js';
import { SETTLEMENTS } from '../data/settlementsData.js';
import { heightAt } from '../world/terrain.js';
import { worldClock } from '../world/dayNight.js';

const FORT = { x: 142, z: 176, name: 'Форт Заря' };

function ensureGoalHud() {
  let el = document.getElementById('demoGoalHud');
  if (!el) {
    el = document.createElement('div');
    el.id = 'demoGoalHud';
    el.style.cssText =
      'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:12;pointer-events:none;' +
      'font:800 14px system-ui;color:#f3dca8;text-shadow:0 2px 6px #000;' +
      'background:rgba(9,7,5,.5);border:1px solid rgba(216,166,77,.4);border-radius:3px;padding:5px 12px;white-space:nowrap;';
    document.body.appendChild(el);
  }
  return el;
}

export function installDemoHooksExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__demoHooksInstalled) return;
  PhoenixV3Engine.__demoHooksInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithDemoHooks() {
    const result = originalBuildScene.call(this);
    const lights = [];
    // Warm hearth light at each settlement, lit only at night and only when the
    // player is near, so villages read as inhabited after dark without a heavy
    // permanent light count. Skipped on Low (no realtime accent lights).
    if (this.quality.realtimeAccentLights) {
      for (const s of SETTLEMENTS) {
        const light = new THREE.PointLight(0xff8a3c, 0, 24, 2);
        light.name = `demo-hearth-${s.id}`;
        light.position.set(s.x, heightAt(s.x, s.z) + 2.4, s.z);
        light.visible = false;
        this.scene.add(light);
        lights.push({ light, x: s.x, z: s.z, base: 1.4 });
      }
    }
    this.demoHooks = { goalEl: ensureGoalHud(), lights, goalText: '' };
    this.log.unshift('v3N3: цель к Форту, трекер находок, награда за исследование и ночные огни поселений.');
    return result;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithDemoHooks(dt) {
    originalUpdate.call(this, dt);
    if (this.mode === 'boot' || !this.demoHooks) return;
    const p = this.rig.position;

    // Night hearth glow: enable the nearest few settlement lights only.
    const night = worldClock.nightFactor;
    for (const entry of this.demoHooks.lights) {
      const near = Math.hypot(p.x - entry.x, p.z - entry.z) < 70;
      const on = night > 0.12 && near;
      entry.light.visible = on;
      if (on) entry.light.intensity = entry.base * night;
    }

    // Goal + discovery tracker.
    const fortDist = Math.round(Math.hypot(p.x - FORT.x, p.z - FORT.z));
    const found = this.poiSystem?.discoveries?.().length ?? 0;
    const total = this.poiSystem?.diagnostics?.().total ?? 0;
    const goal = fortDist <= 18
      ? `✦ ${FORT.name} достигнут`
      : `🎯 ${FORT.name} · ${fortDist} м`;
    const text = `${goal}   ·   Находки ${found}/${total}`;
    if (this.demoHooks.goalText !== text) {
      this.demoHooks.goalEl.textContent = text;
      this.demoHooks.goalText = text;
    }
  };

  PhoenixV3Engine.prototype.getDemoHooksDiagnostics = function getDemoHooksDiagnostics() {
    if (!this.demoHooks) return null;
    const p = this.rig.position;
    return {
      fortDistance: Math.round(Math.hypot(p.x - FORT.x, p.z - FORT.z)),
      discoveries: this.poiSystem?.discoveries?.().length ?? 0,
      hearthLights: this.demoHooks.lights.length,
      activeHearths: this.demoHooks.lights.filter((l) => l.light.visible).length,
      credits: this.player?.credits,
    };
  };
}
