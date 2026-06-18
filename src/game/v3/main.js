import { PhoenixV3Engine } from './core/engine.js?v=30k2_reload_feel_1';
import { installArsenalExtensions } from './core/engineArsenalExtensions.js?v=30k2_reload_feel_1';
import { installArmedWorldExtensions } from './core/engineArmedWorldExtensions.js?v=30k2_reload_feel_1';
import { installAIFeelExtensions } from './core/engineAIFeelExtensions.js?v=30k2_reload_feel_1';
import { installActorVisualExtensions } from './core/engineActorVisualExtensions.js?v=30k2_reload_feel_1';
import { installFortEncounterExtensions } from './core/engineFortEncounterExtensions.js?v=30k2_reload_feel_1';
import { installFeelExtensions } from './core/engineFeelExtensions.js?v=30k2_reload_feel_1';

installArsenalExtensions(PhoenixV3Engine);
installArmedWorldExtensions(PhoenixV3Engine);
installAIFeelExtensions(PhoenixV3Engine);
installActorVisualExtensions(PhoenixV3Engine);
installFortEncounterExtensions(PhoenixV3Engine);
installFeelExtensions(PhoenixV3Engine);

const canvas = document.getElementById('game');
const engine = new PhoenixV3Engine(canvas);
engine.boot();

window.PHX_V3_ENGINE = engine;
window.__PHX_V3_READY = true;

const startBtn = document.getElementById('startBtn');
const mapBtn = document.getElementById('mapBtn');
startBtn?.addEventListener('click', () => engine.start());
mapBtn?.addEventListener('click', () => engine.openMap());

console.log('Phoenix7 v3.0K2 reload feel runtime ready');
