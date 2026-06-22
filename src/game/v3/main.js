import { PhoenixV3Engine } from './core/engine.js?v=30m2a_n2_living_ecosystem_1';
import { installArsenalExtensions } from './core/engineArsenalExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installSettlementExtensions } from './core/engineSettlementExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installArmedWorldExtensions } from './core/engineArmedWorldExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installAIFeelExtensions } from './core/engineAIFeelExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installActorVisualExtensions } from './core/engineActorVisualExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installFortEncounterExtensions } from './core/engineFortEncounterExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installFeelExtensions } from './core/engineFeelExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installPlayerHandsExtensions } from './core/enginePlayerHandsExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installPlayerBodyExtensions } from './core/enginePlayerBodyExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installAtmosphereExtensions } from './core/engineAtmosphereExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installCharacterExtensions } from './core/engineCharacterExtensions.js?v=30m2a_n2_living_ecosystem_1';
import { installDayNightExtensions } from './core/engineDayNightExtensions.js?v=30m2a_n2_living_ecosystem_1';

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

const canvas = document.getElementById('game');
const engine = new PhoenixV3Engine(canvas);
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
}

engine.getLivingWorldDiagnostics = () => engine.livingWorld?.diagnostics?.() || null;
engine.forceCaravanAmbush = (caravanId = 'red_clay_caravan', faction = 'bandits') => {
  const lw = engine.livingWorld;
  const caravan = lw?.agents?.find(a => a.userData.id === caravanId)?.userData;
  if (!lw || !caravan) return { ok: false, reason: 'caravan_not_found', caravanId };
  lw.spawnCaravanAmbush(caravan, faction, 'ручной debug-тест засады');
  return { ok: true, caravanId, faction };
};

window.PHX_V3_ENGINE = engine;
window.__PHX_V3_READY = true;

const startBtn = document.getElementById('startBtn');
const newGameBtn = document.getElementById('newGameBtn');
const mapBtn = document.getElementById('mapBtn');
startBtn?.addEventListener('click', () => engine.requestGameStart());
newGameBtn?.addEventListener('click', () => engine.requestGameStart({ newGame: true }));
mapBtn?.addEventListener('click', () => engine.openMap());

console.log('Phoenix7 v3M2A + v3N2: character creation, settlements, day-night, living ecosystem and caravan ambush debug ready');
