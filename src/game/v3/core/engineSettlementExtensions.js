import { WORLD_BOUNDS, LOCATIONS, BIOMES, ROADS } from '../data/worldData.js';
import { SETTLEMENTS } from '../data/settlementsData.js';
import { SettlementWorldSystem } from '../world/settlements.js';
import { journalHtml, mapHtml, settlementDetailsHtml } from '../ui/map.js';

function bindSettlementMap(engine) {
  const details = document.getElementById('settlementMapDetails');
  const map = document.getElementById('phoenixWorldMap');
  const svg = document.getElementById('phoenixWorldMapSvg');
  const zoomValue = document.getElementById('mapZoomValue');
  const baseWidth = Number(svg?.dataset.mapWidth || 760);
  const baseHeight = Number(svg?.dataset.mapHeight || 610);
  const state = {
    zoom: 1,
    centerX: baseWidth / 2,
    centerY: baseHeight / 2,
    dragging: false,
    pointerX: 0,
    pointerY: 0,
  };

  const clampCenter = () => {
    const halfWidth = baseWidth / state.zoom / 2;
    const halfHeight = baseHeight / state.zoom / 2;
    state.centerX = Math.max(halfWidth, Math.min(baseWidth - halfWidth, state.centerX));
    state.centerY = Math.max(halfHeight, Math.min(baseHeight - halfHeight, state.centerY));
  };

  const renderMapView = () => {
    if (!svg || !map) return;
    clampCenter();
    const viewWidth = baseWidth / state.zoom;
    const viewHeight = baseHeight / state.zoom;
    svg.setAttribute('viewBox', `${state.centerX - viewWidth / 2} ${state.centerY - viewHeight / 2} ${viewWidth} ${viewHeight}`);
    map.classList.toggle('map-show-settlements', state.zoom >= 1.6);
    map.classList.toggle('map-show-locations', state.zoom >= 2.5);
    svg.querySelectorAll('[data-map-text-x]').forEach((text) => {
      const x = Number(text.dataset.mapTextX);
      const y = Number(text.dataset.mapTextY);
      const inverse = 1 / state.zoom;
      text.setAttribute('transform', `translate(${x} ${y}) scale(${inverse}) translate(${-x} ${-y})`);
    });
    if (zoomValue) zoomValue.textContent = `${state.zoom.toFixed(1)}×`;
  };

  const setZoom = (nextZoom, clientX = null, clientY = null) => {
    if (!svg) return;
    const oldZoom = state.zoom;
    const clampedZoom = Math.max(1, Math.min(4, nextZoom));
    if (Math.abs(clampedZoom - oldZoom) < 0.001) return;
    if (clientX !== null && clientY !== null) {
      const rect = svg.getBoundingClientRect();
      const oldWidth = baseWidth / oldZoom;
      const oldHeight = baseHeight / oldZoom;
      const pointerX = state.centerX - oldWidth / 2 + ((clientX - rect.left) / rect.width) * oldWidth;
      const pointerY = state.centerY - oldHeight / 2 + ((clientY - rect.top) / rect.height) * oldHeight;
      const rx = (clientX - rect.left) / rect.width;
      const ry = (clientY - rect.top) / rect.height;
      const newWidth = baseWidth / clampedZoom;
      const newHeight = baseHeight / clampedZoom;
      state.centerX = pointerX + (0.5 - rx) * newWidth;
      state.centerY = pointerY + (0.5 - ry) * newHeight;
    }
    state.zoom = clampedZoom;
    renderMapView();
  };

  const resetMap = () => {
    state.zoom = 1;
    state.centerX = baseWidth / 2;
    state.centerY = baseHeight / 2;
    renderMapView();
  };

  document.querySelectorAll('[data-settlement-map]').forEach((node) => {
    const show = () => {
      const settlement = SETTLEMENTS.find((entry) => entry.id === node.dataset.settlementMap);
      if (details && settlement) details.innerHTML = settlementDetailsHtml(settlement);
      document.querySelectorAll('.settlement-node').forEach((entry) => {
        entry.classList.toggle('map-selected', entry.dataset.settlementMap === node.dataset.settlementMap);
      });
    };
    node.addEventListener('click', show);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        show();
      }
    });
  });
  svg?.addEventListener('wheel', (event) => {
    event.preventDefault();
    setZoom(state.zoom * (event.deltaY < 0 ? 1.22 : 1 / 1.22), event.clientX, event.clientY);
  }, { passive: false });
  svg?.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    state.dragging = true;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    svg.setPointerCapture?.(event.pointerId);
    svg.classList.add('map-dragging');
  });
  svg?.addEventListener('pointermove', (event) => {
    if (!state.dragging) return;
    const rect = svg.getBoundingClientRect();
    const viewWidth = baseWidth / state.zoom;
    const viewHeight = baseHeight / state.zoom;
    state.centerX -= (event.clientX - state.pointerX) / rect.width * viewWidth;
    state.centerY -= (event.clientY - state.pointerY) / rect.height * viewHeight;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    renderMapView();
  });
  const stopDragging = (event) => {
    state.dragging = false;
    svg?.releasePointerCapture?.(event.pointerId);
    svg?.classList.remove('map-dragging');
  };
  svg?.addEventListener('pointerup', stopDragging);
  svg?.addEventListener('pointercancel', stopDragging);
  document.getElementById('mapZoomIn')?.addEventListener('click', () => setZoom(state.zoom + 0.4));
  document.getElementById('mapZoomOut')?.addEventListener('click', () => setZoom(state.zoom - 0.4));
  document.getElementById('mapZoomReset')?.addEventListener('click', resetMap);
  renderMapView();
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
