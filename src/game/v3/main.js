import { PhoenixV3Engine } from './core/engine.js?v=30m2a_n3_integrated_1';
import { installArsenalExtensions } from './core/engineArsenalExtensions.js?v=30m2a_n3_integrated_1';
import { installSettlementExtensions } from './core/engineSettlementExtensions.js?v=30m2a_n3_integrated_1';
import { installArmedWorldExtensions } from './core/engineArmedWorldExtensions.js?v=30m2a_n3_integrated_1';
import { installAIFeelExtensions } from './core/engineAIFeelExtensions.js?v=30m2a_n3_integrated_1';
import { installActorVisualExtensions } from './core/engineActorVisualExtensions.js?v=30m2a_n3_integrated_1';
import { installFortEncounterExtensions } from './core/engineFortEncounterExtensions.js?v=30m2a_n3_integrated_1';
import { installFeelExtensions } from './core/engineFeelExtensions.js?v=30m2a_n3_integrated_1';
import { installPlayerHandsExtensions } from './core/enginePlayerHandsExtensions.js?v=30m2a_n3_integrated_1';
import { installPlayerBodyExtensions } from './core/enginePlayerBodyExtensions.js?v=30m2a_n3_integrated_1';
import { installAtmosphereExtensions } from './core/engineAtmosphereExtensions.js?v=30m2a_n3_integrated_1';
import { installCharacterExtensions } from './core/engineCharacterExtensions.js?v=30m2a_n3_integrated_1';
import { installDayNightExtensions } from './core/engineDayNightExtensions.js?v=30m2a_n3_integrated_1';
import { PHOENIX_BUILD_INFO } from './buildInfo.js?v=30m2a_n3_integrated_1';
import { upgradeLivingWorldVisuals } from './world/lifeVisuals.js?v=30m2a_n3_integrated_1';
import { upgradeStoryNpcVisuals } from './world/storyNpcVisuals.js?v=30m2a_n3_integrated_1';

import { installWw2ArsenalExtensions } from './core/engineWw2ArsenalExtensions.js?v=v3p2_act1_integrated_1';
import { installWw2VehicleExtensions } from './core/engineWw2VehicleExtensions.js?v=v3p2_act1_integrated_1';
import { installWw2VehicleStabilityExtensions } from './core/engineWw2VehicleStabilityExtensions.js?v=v3p2_act1_integrated_1';
import { installBallisticEventExtensions } from './core/engineBallisticEventExtensions.js?v=v3p2_act1_integrated_1';
import { installWeaponWorldExtensions } from './core/engineWeaponWorldExtensions.js?v=v3p2_act1_integrated_1';
import { installWeaponSocialTuningExtensions } from './core/engineWeaponSocialTuningExtensions.js?v=v3p2_act1_integrated_1';
import { installWeaponModelPolishExtensions } from './core/engineWeaponModelPolishExtensions.js?v=v3p2_act1_integrated_1';
import { installWeaponProgressionExtensions } from './core/engineWeaponProgressionExtensions.js?v=v3p2_act1_integrated_1';
import { installMorrowindInventoryExtensions } from './core/engineMorrowindInventoryExtensions.js?v=v3p2_act1_integrated_1';
import { installAct1SliceExtensions } from './core/engineAct1SliceExtensions.js?v=v3p2_act1_integrated_1';
import { installAct1TraderExtensions } from './core/engineAct1TraderExtensions.js?v=v3p2_act1_integrated_1';
import { installAshgraveInterfaceExtensions } from './core/engineAshgraveInterfaceExtensions.js?v=v3p2_act1_integrated_1';
import { installAct1IntegratedExtensions } from './core/engineAct1IntegratedExtensions.js?v=v3p2_act1_integrated_1';

installArsenalExtensions(PhoenixV3Engine);
installSettlementExtensions(PhoenixV3Engine);
installArmedWorldExtensions(PhoenixV3Engine);
installAIFeelExtensions(PhoenixV3Engine);
installActorVisualExtensions(PhoenixV3Engine);
installFortEncounterExtensions(PhoenixV3Engine);
installFeelExtensions(PhoenixV3Engine);
installPlayerHandsExtensions(PhoenixV3Engine);
installPlayerBodyExtensions(PhoenixV3Engine);
installAtmosphereExtensions(PhoenixV3Engine);
installCharacterExtensions(PhoenixV3Engine);
installDayNightExtensions(PhoenixV3Engine);

installWw2ArsenalExtensions(PhoenixV3Engine);
installWw2VehicleExtensions(PhoenixV3Engine);
installWw2VehicleStabilityExtensions(PhoenixV3Engine);
installBallisticEventExtensions(PhoenixV3Engine);
installWeaponWorldExtensions(PhoenixV3Engine);
installWeaponSocialTuningExtensions(PhoenixV3Engine);
installWeaponModelPolishExtensions(PhoenixV3Engine);
installWeaponProgressionExtensions(PhoenixV3Engine);
installMorrowindInventoryExtensions(PhoenixV3Engine);
installAct1SliceExtensions(PhoenixV3Engine);
installAct1TraderExtensions(PhoenixV3Engine);
installAshgraveInterfaceExtensions(PhoenixV3Engine);
installAct1IntegratedExtensions(PhoenixV3Engine);

const canvas = document.getElementById('game');
const engine = new PhoenixV3Engine(canvas);
engine.buildInfo = PHOENIX_BUILD_INFO;
engine.boot();

// v3N2 hardening: make LivingWorldSystem use direct engine references instead of
// relying only on global lookup. This keeps caravan ambush rewards, spawned
// hostiles and HUD messages stable even if debug commands run very early.
if (engine.livingWorld) {
  engine.livingWorld.systems = {
    player: engine.player,
    rpg: engine.rpg,
    monsters: engine.monsters,
    hud: engine.hud,
  };
  upgradeLivingWorldVisuals(engine.livingWorld);
}
engine.storyNpcVisualUpgrade = upgradeStoryNpcVisuals(engine.npcs);

function nearestCaravan() {
  const lw = engine.livingWorld;
  if (!lw?.agents?.length) return null;
  let best = null;
  let bestD = Infinity;
  for (const agent of lw.agents) {
    const u = agent.userData;
    if (u.role !== 'caravan') continue;
    const d = Math.hypot(u.x - engine.rig.position.x, u.z - engine.rig.position.z);
    if (d < bestD) { best = u; bestD = d; }
  }
  return best ? { caravan: best, distance: bestD } : null;
}

engine.getBuildInfo = () => engine.buildInfo;
engine.getLivingWorldDiagnostics = () => engine.livingWorld?.diagnostics?.() || null;
engine.rebuildLifeVisuals = () => upgradeLivingWorldVisuals(engine.livingWorld);
engine.rebuildStoryNpcVisuals = () => {
  engine.storyNpcVisualUpgrade = upgradeStoryNpcVisuals(engine.npcs);
  return engine.storyNpcVisualUpgrade;
};
engine.forceCaravanAmbush = (caravanId = 'red_clay_caravan', faction = 'bandits') => {
  const lw = engine.livingWorld;
  const caravan = lw?.agents?.find(a => a.userData.id === caravanId)?.userData;
  if (!lw || !caravan) return { ok: false, reason: 'caravan_not_found', caravanId };
  lw.spawnCaravanAmbush(caravan, faction, 'СЂСѓС‡РЅРѕР№ debug-С‚РµСЃС‚ Р·Р°СЃР°РґС‹');
  return { ok: true, caravanId, faction };
};
engine.forceNearestCaravanAmbush = (faction = 'bandits') => {
  const lw = engine.livingWorld;
  const nearest = nearestCaravan();
  if (!lw || !nearest?.caravan) return { ok: false, reason: 'no_caravans' };
  lw.spawnCaravanAmbush(nearest.caravan, faction, 'СЂСѓС‡РЅРѕР№ debug-С‚РµСЃС‚ Р±Р»РёР¶Р°Р№С€РµР№ Р·Р°СЃР°РґС‹');
  return { ok: true, caravanId: nearest.caravan.id, caravanName: nearest.caravan.name, faction, distance: Math.round(nearest.distance) };
};
engine.listCaravans = () => (engine.livingWorld?.agents || [])
  .map(a => a.userData)
  .filter(u => u.role === 'caravan')
  .map(u => ({ id: u.id, name: u.name, x: Math.round(u.x), z: Math.round(u.z), state: u.state, tradeState: u.tradeState, cargo: u.cargo }));
engine.listLifeVisuals = () => (engine.livingWorld?.agents || [])
  .map(a => a.userData)
  .map(u => ({ id: u.id, name: u.name, faction: u.faction, role: u.role, visualTier: u.visualTier || 'base' }));
engine.listStoryNpcVisuals = () => (engine.npcs || [])
  .map(n => n.userData)
  .map(u => ({ id: u.id, name: u.name, faction: u.faction, role: u.role, visualTier: u.visualTier || 'base' }));

window.PHX_V3_ENGINE = engine;
window.PHX_V3_BUILD = PHOENIX_BUILD_INFO;
window.__PHX_V3_READY = true;

const startBtn = document.getElementById('startBtn');
const newGameBtn = document.getElementById('newGameBtn');
const mapBtn = document.getElementById('mapBtn');
startBtn?.addEventListener('click', () => engine.requestGameStart());
newGameBtn?.addEventListener('click', () => engine.requestGameStart({ newGame: true }));
mapBtn?.addEventListener('click', () => engine.openMap());

console.log(`${PHOENIX_BUILD_INFO.title} ready`, PHOENIX_BUILD_INFO);

