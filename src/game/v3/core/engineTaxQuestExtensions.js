import { TaxQuestSystem } from '../quests/taxQuestSystem.js';
import { TAX_POSITIONS } from '../data/taxQuestData.js';
import { heightAt } from '../world/terrain.js';

export function installTaxQuestExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__taxQuestInstalled) return;
  PhoenixV3Engine.__taxQuestInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithTaxQuest() {
    const result = originalBuildScene.call(this);
    this.taxQuestSystem = new TaxQuestSystem(this);
    this.taxQuestDebugPointIndex = 0;
    this.log.unshift('v3M2B.2: расследование, арест, казнь, оборона и ночное похищение в квесте «Налог и глина».');
    return result;
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWithTaxQuestDebug(code, event) {
    if (code === 'F3') {
      event?.preventDefault?.();
      this.teleportTaxQuestDebugNext();
      return;
    }
    return originalOnAction.call(this, code, event);
  };

  PhoenixV3Engine.prototype.teleportTaxQuestDebugNext = function teleportTaxQuestDebugNext() {
    const points = [
      { ...TAX_POSITIONS.rebelCamp, name: 'костёр повстанцев' },
      { ...TAX_POSITIONS.rebelCheckpoint, name: 'checkpoint ночной операции' },
      { ...TAX_POSITIONS.rebelSwitch, name: 'рубильник Поста Ришелье' },
      { ...TAX_POSITIONS.post, name: 'центр Поста Ришелье' },
    ];
    const point = points[this.taxQuestDebugPointIndex++ % points.length];
    this.rig.position.set(point.x, heightAt(point.x, point.z), point.z);
    this.hud.setObjective(`F3 tax debug: ${point.name}`);
    return point;
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
