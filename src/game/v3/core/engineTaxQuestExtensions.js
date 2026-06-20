import { TaxQuestSystem } from '../quests/taxQuestSystem.js';

export function installTaxQuestExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__taxQuestInstalled) return;
  PhoenixV3Engine.__taxQuestInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithTaxQuest() {
    const result = originalBuildScene.call(this);
    this.taxQuestSystem = new TaxQuestSystem(this);
    this.log.unshift('v3M2B.1: расследование, арест, казнь и оборона в квесте «Налог и глина».');
    return result;
  };

  const originalInteract = PhoenixV3Engine.prototype.interact;
  PhoenixV3Engine.prototype.interact = function interactWithTaxQuest() {
    if (!this.paused && this.taxQuestSystem?.interact?.()) return;
    return originalInteract.call(this);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithTaxQuest(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot' && !this.paused) this.taxQuestSystem?.update(dt);
  };

  PhoenixV3Engine.prototype.getTaxQuestDiagnostics = function getTaxQuestDiagnostics() {
    return this.taxQuestSystem?.diagnostics?.() || null;
  };

  PhoenixV3Engine.prototype.resetTaxQuestDebug = function resetTaxQuestDebug() {
    this.worldState.reset();
    this.taxQuestSystem?.resetRuntime?.();
    return this.getTaxQuestDiagnostics();
  };

  PhoenixV3Engine.prototype.setTaxQuestDebugStage = function setTaxQuestDebugStage(stage, route = null) {
    return this.taxQuestSystem?.setDebugStage?.(Number(stage) || 0, route) || null;
  };
}
