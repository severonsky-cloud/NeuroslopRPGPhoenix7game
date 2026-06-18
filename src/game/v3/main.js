import { PhoenixV3Engine } from './core/engine.js?v=30g_armed_npc_1';
import { installArsenalExtensions } from './core/engineArsenalExtensions.js?v=30g_armed_npc_1';
import { installArmedWorldExtensions } from './core/engineArmedWorldExtensions.js?v=30g_armed_npc_1';

installArsenalExtensions(PhoenixV3Engine);
installArmedWorldExtensions(PhoenixV3Engine);

const canvas = document.getElementById('game');
const engine = new PhoenixV3Engine(canvas);
engine.boot();

window.PHX_V3_ENGINE = engine;
window.__PHX_V3_READY = true;

const startBtn = document.getElementById('startBtn');
const mapBtn = document.getElementById('mapBtn');
startBtn?.addEventListener('click', () => engine.start());
mapBtn?.addEventListener('click', () => engine.openMap());

console.log('Phoenix7 v3.0G armed NPC combat prototype ready');
