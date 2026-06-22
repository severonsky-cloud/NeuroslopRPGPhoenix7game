import { PhoenixV3Engine } from './core/engine.js?v=v3p2_rocket_ballistics_1';
import { installArsenalExtensions } from './core/engineArsenalExtensions.js?v=v3p2_rocket_ballistics_1';
import { installSettlementExtensions } from './core/engineSettlementExtensions.js?v=30m2a_n1_daynight_integration_1';
import { installArmedWorldExtensions } from './core/engineArmedWorldExtensions.js?v=v3p2_rocket_ballistics_1';
import { installAIFeelExtensions } from './core/engineAIFeelExtensions.js?v=30m2a_n1_daynight_integration_1';
import { installActorVisualExtensions } from './core/engineActorVisualExtensions.js?v=v3p2_rocket_ballistics_1';
import { installFortEncounterExtensions } from './core/engineFortEncounterExtensions.js?v=30m2a_n1_daynight_integration_1';
import { installFeelExtensions } from './core/engineFeelExtensions.js?v=v3p2_rocket_ballistics_1';
import { installPlayerHandsExtensions } from './core/enginePlayerHandsExtensions.js?v=30m2a_n1_daynight_integration_1';
import { installPlayerBodyExtensions } from './core/enginePlayerBodyExtensions.js?v=30m2a_n1_daynight_integration_1';
import { installAtmosphereExtensions } from './core/engineAtmosphereExtensions.js?v=30m2a_n1_daynight_integration_1';
import { installCharacterExtensions } from './core/engineCharacterExtensions.js?v=30m2a_n1_daynight_integration_1';
import { installDayNightExtensions } from './core/engineDayNightExtensions.js?v=30m2a_n1_daynight_integration_1';
import { installWw2ArsenalExtensions } from './core/engineWw2ArsenalExtensions.js?v=v3p2_rocket_ballistics_1';
import { installWw2VehicleExtensions } from './core/engineWw2VehicleExtensions.js?v=v3p2_rocket_ballistics_1';
import { installWw2VehicleStabilityExtensions } from './core/engineWw2VehicleStabilityExtensions.js?v=v3p2_rocket_ballistics_1';
import { installBallisticEventExtensions } from './core/engineBallisticEventExtensions.js?v=v3p2_rocket_ballistics_1';

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

const canvas = document.getElementById('game');
const engine = new PhoenixV3Engine(canvas);
engine.boot();

window.PHX_V3_ENGINE = engine;
window.__PHX_V3_READY = true;

const startBtn = document.getElementById('startBtn');
const newGameBtn = document.getElementById('newGameBtn');
const mapBtn = document.getElementById('mapBtn');
startBtn?.addEventListener('click', () => engine.requestGameStart());
newGameBtn?.addEventListener('click', () => engine.requestGameStart({ newGame: true }));
mapBtn?.addEventListener('click', () => engine.openMap());

console.log('Phoenix7 v3M2A + v3N1 + v3P2 WW2 live arsenal ready');
