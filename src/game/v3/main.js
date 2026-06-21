import { PhoenixV3Engine } from './core/engine.js?v=30m2b1_tax_clay_expansion_1';
import { installArsenalExtensions } from './core/engineArsenalExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installSettlementExtensions } from './core/engineSettlementExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installArmedWorldExtensions } from './core/engineArmedWorldExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installAIFeelExtensions } from './core/engineAIFeelExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installActorVisualExtensions } from './core/engineActorVisualExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installFortEncounterExtensions } from './core/engineFortEncounterExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installFeelExtensions } from './core/engineFeelExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installPlayerHandsExtensions } from './core/enginePlayerHandsExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installPlayerBodyExtensions } from './core/enginePlayerBodyExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installAtmosphereExtensions } from './core/engineAtmosphereExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installCharacterExtensions } from './core/engineCharacterExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installDayNightExtensions } from './core/engineDayNightExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installPoiExtensions } from './core/enginePoiExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installDemoHooksExtensions } from './core/engineDemoHooksExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installDialogueExtensions } from './core/engineDialogueExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installTaxQuestExtensions } from './core/engineTaxQuestExtensions.js?v=30m2b1_tax_clay_expansion_1';
import { installLivingExtortionExtensions } from './core/engineLivingExtortionExtensions.js?v=30m2c_living_extortion_1';

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
installPoiExtensions(PhoenixV3Engine);
installDemoHooksExtensions(PhoenixV3Engine);
installDialogueExtensions(PhoenixV3Engine);
installTaxQuestExtensions(PhoenixV3Engine);
installLivingExtortionExtensions(PhoenixV3Engine);

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

console.log('Phoenix7 v3M2B.1 integration build: Tax and Clay investigation, arrest and violent branches');
