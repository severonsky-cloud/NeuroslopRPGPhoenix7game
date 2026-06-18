import * as THREE from '../vendor/three.module.js';
import { clampToWorld, heightAt } from '../world/terrain.js';
import { PlayerBodySystem, resolvePlayerBodyRace } from '../visuals/playerBody.js';

function removeLegacyPlayerVisual(engine) {
  const legacyRoot = engine.playerVisuals?.root || engine.playerVisual;
  legacyRoot?.removeFromParent?.();
  engine.playerVisuals = null;
  engine.playerVisual = null;
}

function firstPersonCameraPosition(engine, immediate = false) {
  const profile = engine.playerBody?.profile || resolvePlayerBodyRace(engine.player);
  const target = new THREE.Vector3(0, profile.eyeHeight, 0);
  if (immediate) engine.camera.position.copy(target);
  else engine.camera.position.lerp(target, 0.34);
  if (immediate) engine.camera.rotation.x = engine.pitch;
}

function thirdPersonCameraPosition(engine, immediate = false) {
  const profile = engine.playerBody?.profile || resolvePlayerBodyRace(engine.player);
  const target = new THREE.Vector3(0, profile.eyeHeight + 0.72, 4.6);
  if (immediate) engine.camera.position.copy(target);
  else engine.camera.position.lerp(target, 0.24);
  engine.camera.rotation.x = -0.16 + engine.pitch * 0.55;
}

function applyRaceMovement(engine, startX, startZ) {
  const profile = engine.playerBody?.profile;
  const multiplier = profile?.moveSpeedMultiplier || 1;
  if (multiplier === 1 || engine.paused || engine.mode === 'boot') return;
  const dx = engine.rig.position.x - startX;
  const dz = engine.rig.position.z - startZ;
  if (Math.abs(dx) + Math.abs(dz) < 0.000001) return;
  const next = clampToWorld(startX + dx * multiplier, startZ + dz * multiplier);
  engine.rig.position.x = next.x;
  engine.rig.position.z = next.z;
  engine.rig.position.y = THREE.MathUtils.lerp(
    engine.rig.position.y,
    heightAt(next.x, next.z),
    0.32,
  );
}

export function installPlayerBodyExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__playerBodyExtensionInstalled) return;
  PhoenixV3Engine.__playerBodyExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithV3L3PlayerBody() {
    const result = originalBuildScene.call(this);
    removeLegacyPlayerVisual(this);
    this.playerBody = new PlayerBodySystem(this);
    this.playerBody.build();
    this.playerBodyDebugThirdPerson = false;
    firstPersonCameraPosition(this, true);
    this.log.unshift('v3.0L3: procedural player body, visible legs, contact shadow and equipment anchors.');
    return result;
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWithPlayerBody(code, event) {
    if (code === 'F8') {
      event?.preventDefault?.();
      this.togglePlayerBodyDebug();
      return;
    }
    return originalOnAction.call(this, code, event);
  };

  PhoenixV3Engine.prototype.togglePlayerBodyDebug = function togglePlayerBodyDebug(force) {
    const enabled = typeof force === 'boolean' ? force : !this.playerBodyDebugThirdPerson;
    this.playerBodyDebugThirdPerson = enabled;
    this.playerBody?.setThirdPerson(enabled);
    if (this.hands) this.hands.visible = !enabled;
    if (enabled) thirdPersonCameraPosition(this, true);
    else firstPersonCameraPosition(this, true);
    this.hud?.setObjective?.(
      enabled
        ? 'Debug third-person body: ON · F8 чтобы вернуться'
        : 'First-person body: ноги и тень · F8 debug view',
    );
    return enabled;
  };

  PhoenixV3Engine.prototype.setPlayerBodyRace = function setPlayerBodyRace(raceId) {
    const profile = resolvePlayerBodyRace(raceId);
    this.player.race = profile.id;
    this.playerBody?.setRace(profile.id);
    if (this.playerBodyDebugThirdPerson) thirdPersonCameraPosition(this, true);
    else firstPersonCameraPosition(this, true);
    this.hud?.setObjective?.(
      `Body profile: ${profile.label} · рост ${Math.round(profile.heightScale * 100)}% · скорость ${Math.round(profile.moveSpeedMultiplier * 100)}%`,
    );
    return profile;
  };

  PhoenixV3Engine.prototype.getPlayerBodyDiagnostics = function getPlayerBodyDiagnostics() {
    const body = this.playerBody?.diagnostics?.() || {};
    const ground = heightAt(this.rig.position.x, this.rig.position.z);
    return {
      ...body,
      terrainContactGap: this.rig.position.y - ground,
      camera: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
        pitch: this.camera.rotation.x,
      },
      firstPersonWeaponAttached: this.hands?.parent === this.camera,
      legacyPlayerVisualRemoved: !this.playerVisuals && !this.playerVisual,
    };
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithV3L3PlayerBody(dt) {
    const startX = this.rig.position.x;
    const startZ = this.rig.position.z;
    originalUpdate.call(this, dt);
    if (this.mode === 'boot') return;
    applyRaceMovement(this, startX, startZ);
    this.playerBody?.update(dt);
    if (this.hands) this.hands.visible = !this.playerBodyDebugThirdPerson;
    if (this.playerBodyDebugThirdPerson) thirdPersonCameraPosition(this);
    else firstPersonCameraPosition(this);
  };
}
