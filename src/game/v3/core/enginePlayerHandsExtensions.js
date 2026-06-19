import {
  setWeaponViewModelAimPose,
  setWeaponViewModelReloadState,
  triggerWeaponViewModelAction,
} from '../items/weaponModels.js';

function reloadSnapshot(engine) {
  const feel = engine.reloadFeel;
  const sameWeapon = feel?.weaponId === engine.player?.weapon;
  if (!feel?.active || !sameWeapon) {
    return {
      active: false,
      progress: 0,
      stage: '',
      weaponId: engine.player?.weapon,
    };
  }
  const progress = Math.max(0, Math.min(1, feel.elapsed / Math.max(0.001, feel.total)));
  return {
    active: true,
    progress,
    stage: feel.currentStage?.(progress) || '',
    weaponId: feel.weaponId,
  };
}

export function installPlayerHandsExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__playerHandsExtensionInstalled) return;
  PhoenixV3Engine.__playerHandsExtensionInstalled = true;

  const originalBuildViewModel = PhoenixV3Engine.prototype.buildViewModel;
  PhoenixV3Engine.prototype.buildViewModel = function buildV3L1PlayerHandsViewModel() {
    const result = originalBuildViewModel.call(this);
    setWeaponViewModelAimPose(this.hands, this.aimMode);
    setWeaponViewModelReloadState(this.hands, reloadSnapshot(this));
    this.playerHandsViewModel = this.hands;
    return result;
  };

  const originalReloadWeapon = PhoenixV3Engine.prototype.reloadWeapon;
  PhoenixV3Engine.prototype.reloadWeapon = function reloadWithV3L1Hands() {
    const weaponId = this.player?.weapon;
    const stateBefore = this.firearms?.state?.(weaponId);
    const reloadBefore = stateBefore?.reloadT || 0;
    const result = originalReloadWeapon.call(this);
    const stateAfter = this.firearms?.state?.(weaponId);
    if ((stateAfter?.reloadT || 0) > reloadBefore) {
      triggerWeaponViewModelAction(this.hands, 'reload', { duration: stateAfter.reloadT });
      setWeaponViewModelReloadState(this.hands, reloadSnapshot(this));
    }
    return result;
  };

  const originalToggleAim = PhoenixV3Engine.prototype.toggleAim;
  PhoenixV3Engine.prototype.toggleAim = function toggleAimWithV3L1Hands() {
    const result = originalToggleAim.call(this);
    setWeaponViewModelAimPose(this.hands, this.aimMode);
    return result;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateV3L1PlayerHands(dt) {
    originalUpdate.call(this, dt);
    if (this.hands) setWeaponViewModelReloadState(this.hands, reloadSnapshot(this));
  };

  PhoenixV3Engine.prototype.getPlayerHandsDiagnostics = function getPlayerHandsDiagnostics() {
    const data = this.hands?.userData || {};
    return {
      weaponId: data.weaponId || null,
      kind: data.kind || null,
      aimMode: Boolean(data.aimMode),
      pose: data.handsRoot?.userData?.poseHook || null,
      reload: { ...(data.reloadState || {}) },
      leftArm: data.leftArm?.name || null,
      rightArm: data.rightArm?.name || null,
      weaponParts: Object.keys(data.weaponParts || {}),
      upgraded: Boolean(data.v3l1HandsWeapons),
    };
  };
}
