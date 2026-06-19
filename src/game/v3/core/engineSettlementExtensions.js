import { WORLD_BOUNDS, LOCATIONS, BIOMES, ROADS } from '../data/worldData.js';
import { SETTLEMENTS } from '../data/settlementsData.js';
import { SettlementWorldSystem } from '../world/settlements.js';
import { journalHtml, mapHtml, settlementDetailsHtml } from '../ui/map.js';

function bindSettlementMap(engine) {
  const details = document.getElementById('settlementMapDetails');
  document.querySelectorAll('[data-settlement-map]').forEach((node) => {
    const show = () => {
      const settlement = SETTLEMENTS.find((entry) => entry.id === node.dataset.settlementMap);
      if (details && settlement) details.innerHTML = settlementDetailsHtml(settlement);
    };
    node.addEventListener('click', show);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        show();
      }
    });
  });
  document.getElementById('closeMapBtn')?.addEventListener('click', () => engine.closePausePanel());
}

export function installSettlementExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__settlementExtensionInstalled) return;
  PhoenixV3Engine.__settlementExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithSettlements() {
    originalBuildScene.call(this);
    this.settlementWorld = new SettlementWorldSystem(this);
    this.settlementWorld.build();
    this.settlementDebugIndex = 0;
    this.log.unshift('v3M1: восемь поселений, длинный официальный тракт и дорожная жизнь между Портом и Фортом.');
    this.log.unshift('v3M1.1: полировка силуэтов поселений, заземление реквизита и читаемость карты.');
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWithSettlementDebug(code, event) {
    if (code === 'F2') {
      event?.preventDefault?.();
      this.teleportSettlementNext();
      return;
    }
    originalOnAction.call(this, code, event);
  };

  PhoenixV3Engine.prototype.teleportSettlementNext = function teleportSettlementNext() {
    if (!this.settlementWorld) return null;
    const settlement = this.settlementWorld.teleport(this.settlementDebugIndex || 0);
    this.settlementDebugIndex = ((this.settlementDebugIndex || 0) + 1) % SETTLEMENTS.length;
    return settlement;
  };

  PhoenixV3Engine.prototype.getSettlementDiagnostics = function getSettlementDiagnostics() {
    return this.settlementWorld?.diagnostics() || null;
  };

  PhoenixV3Engine.prototype.openMap = function openSettlementMap() {
    this.paused = true;
    this.hud.openPanel(mapHtml({
      locations: LOCATIONS,
      biomes: BIOMES,
      roads: ROADS,
      settlements: SETTLEMENTS,
      bounds: WORLD_BOUNDS,
      player: { x: this.rig.position.x, z: this.rig.position.z },
    }));
    bindSettlementMap(this);
  };

  PhoenixV3Engine.prototype.openJournal = function openSettlementJournal() {
    this.paused = true;
    const lifeEvents = this.livingWorld?.eventLog || [];
    this.hud.openPanel(journalHtml([...lifeEvents, ...this.log], SETTLEMENTS));
    document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithSettlements(dt) {
    this.settlementWorld?.updateZhuzherPolicy();
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot') this.settlementWorld?.update(dt);
  };
}
