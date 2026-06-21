import assert from 'node:assert/strict';
import * as THREE from '../src/game/v3/vendor/three.module.js';
import { ArmedWorldSystem } from '../src/game/v3/combat/armedWorld.js';
import { WorldState, WORLD_STATE_KEY, WORLD_STATE_VERSION } from '../src/game/v3/state/worldState.js';
import { applyEffects, condOk, pickResponse } from '../src/game/v3/dialogue/dialogueEngine.js';
import { DIALOGUE } from '../src/game/v3/dialogue/dialogueData.js';
import { questJournalEntries } from '../src/game/v3/data/questData.js';
import { TAX_POSITIONS, TAX_REWARDS, TAX_STAGES } from '../src/game/v3/data/taxQuestData.js';
import { ITEM_DEFS, makeCharacterInventoryState } from '../src/game/v3/items/inventory.js';
import { TaxCombatSystem } from '../src/game/v3/quests/taxCombatSystem.js';
import { isTaxEvidenceActive } from '../src/game/v3/quests/taxEvidenceSystem.js';
import {
  isCleanRebelOutcome,
  isInterruptedRebelStage,
  isRebelContactStage,
  rebelAwarenessMultiplier,
  REBEL_COMBAT_DURATION,
} from '../src/game/v3/quests/taxRebelSystem.js';

class MemoryStorage {
  constructor(entries = {}) {
    this.data = new Map(Object.entries(entries));
  }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}

for (const [legacyStage, nextStage] of Object.entries({ 1: 10, 2: 21, 3: 22, 4: 29 })) {
  const storage = new MemoryStorage({
    [WORLD_STATE_KEY]: JSON.stringify({
      version: 1,
      flags: { witnessed_extortion: true },
      quests: { tax_and_clay: { stage: Number(legacyStage) } },
      seen: {},
    }),
  });
  const state = new WorldState(storage);
  assert.equal(state.data.version, WORLD_STATE_VERSION);
  assert.equal(state.questStage('tax_and_clay'), nextStage);
}

const storage = new MemoryStorage();
const state = new WorldState(storage);
state.patchQuest('tax_and_clay', {
  stage: TAX_STAGES.INVESTIGATING,
  route: 'investigation',
  status: 'active',
  vars: { photoBlocked: true },
});
assert.deepEqual(state.questState('tax_and_clay').vars, { photoBlocked: true });
state.patchQuest('tax_and_clay', { vars: { ledgerBlocked: false } });
assert.deepEqual(state.questState('tax_and_clay').vars, { photoBlocked: true, ledgerBlocked: false });

state.addQuestItem('evidenceCamera');
assert.equal(state.hasQuestItem('evidenceCamera'), true);
state.removeQuestItem('evidenceCamera');
assert.equal(state.hasQuestItem('evidenceCamera'), false);

const player = {
  credits: 14,
  inventoryState: makeCharacterInventoryState('archive'),
};
const baseAmmo = { ...player.inventoryState.ammo };
const engine = {
  player,
  inventory: {
    removeItem(id) {
      const index = player.inventoryState.items.indexOf(id);
      if (index >= 0) player.inventoryState.items.splice(index, 1);
    },
  },
  log: [],
};

for (const [outcome, reward] of Object.entries(TAX_REWARDS)) {
  assert.equal(state.grantRewardOnce(`tax:${outcome}`, reward), true);
  assert.equal(state.grantRewardOnce(`tax:${outcome}`, reward), false);
}
const hydrated = state.applyPersistentRewards(engine);
assert.equal(hydrated.credits, 1340);
assert.equal(player.credits, 1354);
assert.equal(hydrated.ammo.revolver, 12);
assert.equal(hydrated.ammo.scatter, 6);
assert.equal(player.inventoryState.ammo.revolver, baseAmmo.revolver + 12);
assert.equal(player.inventoryState.ammo.scatter, baseAmmo.scatter + 6);
for (const itemId of [
  'imperialWitnessSeal',
  'resonanceEvidenceShard',
  'signedNyenTestimony',
  'dumontBadge',
  'richelieuServiceCarbine',
  'rebelCourierNagant',
  'rebelSawedOff',
]) {
  assert.ok(ITEM_DEFS[itemId], `Неизвестная награда ${itemId}`);
  assert.ok(player.inventoryState.items.includes(itemId), `Награда не гидратирована: ${itemId}`);
}
state.applyPersistentRewards(engine);
assert.equal(player.credits, 1354, 'Повторная гидратация продублировала кредиты');
assert.equal(player.inventoryState.ammo.revolver, baseAmmo.revolver + 12, 'Повторная гидратация продублировала патроны Нагана');
assert.equal(player.inventoryState.ammo.scatter, baseAmmo.scatter + 6, 'Повторная гидратация продублировала патроны Обреза');

const ctx = {
  race: 'human',
  background: 'clerk',
  gender: 'female',
  ws: state,
  skill: () => 8,
  hasItem: (id) => player.inventoryState.items.includes(id),
  rng: () => 0,
};
assert.equal(condOk({ any: [{ race: 'red' }, { background: 'clerk' }] }, ctx), true);
assert.equal(condOk({ all: [{ race: 'human' }, { background: 'clerk' }] }, ctx), true);
assert.equal(condOk({ any: [{ race: 'red' }, { background: 'guide' }] }, ctx), false);

assert.equal(isTaxEvidenceActive({ stage: TAX_STAGES.INVESTIGATING, route: 'investigation', status: 'active' }), true);
assert.equal(isTaxEvidenceActive({ stage: TAX_STAGES.EVIDENCE_READY, route: 'investigation', status: 'active' }), false);
assert.equal(REBEL_COMBAT_DURATION, 45);
assert.equal(TAX_REWARDS.rebels_clean.items[0], 'rebelCourierNagant');
assert.equal(TAX_REWARDS.rebels_bloody.items[0], 'rebelSawedOff');
assert.equal(isInterruptedRebelStage(TAX_STAGES.REBELS_CLEAN), true);
assert.equal(isInterruptedRebelStage(TAX_STAGES.REBELS_COMBAT), true);
assert.equal(isInterruptedRebelStage(TAX_STAGES.REBELS_EXTRACTION), true);
assert.equal(isInterruptedRebelStage(TAX_STAGES.REBELS_APPROACH), true);
assert.equal(isInterruptedRebelStage(TAX_STAGES.REBELS_INFILTRATION), true);
assert.equal(isInterruptedRebelStage(TAX_STAGES.REBELS_CAMP), false);
assert.equal(isRebelContactStage(TAX_STAGES.REBELS_CODE), true);
assert.equal(isRebelContactStage(TAX_STAGES.REBELS_CONTACT), true);
assert.equal(isRebelContactStage(TAX_STAGES.REBELS_CAMP), true);
assert.equal(isRebelContactStage(TAX_STAGES.REBELS_APPROACH), false);
assert.equal(isCleanRebelOutcome('clean'), true);
assert.equal(isCleanRebelOutcome('rebels_clean'), true);
assert.equal(isCleanRebelOutcome('rebels_bloody'), false);
assert.ok(
  rebelAwarenessMultiplier({ race: 'juniorReptiloid', background: 'guide' }, { survival: { level: 5 }, dodge: { level: 5 } })
  < rebelAwarenessMultiplier({ race: 'human', background: 'lunar' }, {}),
  'Скрытный профиль должен медленнее накапливать awareness',
);

const unarmedCreature = new THREE.Group();
unarmedCreature.userData = { type: 'monster', archetype: 'lurker' };
const armedQuestActor = new THREE.Group();
armedQuestActor.userData = { type: 'monster', archetype: 'brute', faction: 'empire' };
const armedSystem = new ArmedWorldSystem({ livingWorld: { agents: [] }, monsters: [] }, null);
armedSystem.configureActor(unarmedCreature);
armedSystem.configureActor(armedQuestActor, 'imperial_rifle');
assert.equal(unarmedCreature.userData.armed, undefined, 'Невооружённые существа не должны получать случайную тяпку');
assert.equal(armedQuestActor.userData.weaponProfileId, 'imperial_rifle');

const interruptedStorage = new MemoryStorage();
const interruptedState = new WorldState(interruptedStorage);
interruptedState.patchQuest('tax_and_clay', {
  stage: TAX_STAGES.STANDOFF_COMBAT,
  route: 'standoff',
  status: 'combat',
  vars: { checkpointReady: true },
});
const interruptedEngine = {
  worldState: interruptedState,
  rig: { position: new THREE.Vector3(99, 0, 99) },
  player: {
    hp: 0,
    hpMax: 90,
    st: 0,
    stMax: 75,
    ph: 0,
    phMax: 45,
    inventoryState: { items: [], ammo: {} },
    firearmState: {},
  },
  livingWorld: { agents: [] },
  scene: new THREE.Scene(),
  monsters: [],
  labels: [],
  log: [],
};
new TaxCombatSystem(interruptedEngine);
assert.equal(interruptedState.questStage('tax_and_clay'), TAX_STAGES.OFFERED);
assert.equal(interruptedState.questState('tax_and_clay').status, 'active');
assert.equal(interruptedEngine.rig.position.x, TAX_POSITIONS.checkpoint.x);
assert.equal(interruptedEngine.rig.position.z, TAX_POSITIONS.checkpoint.z);
assert.equal(interruptedEngine.player.hp, interruptedEngine.player.hpMax);
assert.equal(interruptedEngine.player.st, interruptedEngine.player.stMax);
assert.equal(interruptedEngine.player.ph, interruptedEngine.player.phMax);

const rebelCombatStorage = new MemoryStorage();
const rebelCombatState = new WorldState(rebelCombatStorage);
rebelCombatState.patchQuest('tax_and_clay', {
  stage: TAX_STAGES.REBELS_COMBAT,
  route: 'rebels',
  status: 'combat',
  vars: { rebelCheckpointReady: true },
});
const rebelCombatEngine = {
  ...interruptedEngine,
  worldState: rebelCombatState,
  rig: { position: new THREE.Vector3(TAX_POSITIONS.rebelCheckpoint.x, 0, TAX_POSITIONS.rebelCheckpoint.z) },
  player: {
    ...interruptedEngine.player,
    hp: interruptedEngine.player.hpMax,
    st: interruptedEngine.player.stMax,
    ph: interruptedEngine.player.phMax,
  },
  scene: new THREE.Scene(),
  monsters: [],
  labels: [],
  log: [],
};
new TaxCombatSystem(rebelCombatEngine);
assert.equal(
  rebelCombatState.questStage('tax_and_clay'),
  TAX_STAGES.REBELS_COMBAT,
  'Старая система обороны не должна перехватывать боевой checkpoint маршрута повстанцев',
);
assert.equal(rebelCombatState.questState('tax_and_clay').route, 'rebels');

state.patchQuest('tax_and_clay', { stage: TAX_STAGES.ARREST_CHOICE, route: 'investigation', status: 'active' });
const arrestGreeting = pickResponse(DIALOGUE['marcel-dumont'].greeting, ctx);
const visibleArrestChoices = arrestGreeting.choices.filter((choice) => !choice.when || condOk(choice.when, ctx));
assert.ok(visibleArrestChoices.some((choice) => choice.label.includes('Имперский закон')));
assert.ok(visibleArrestChoices.some((choice) => choice.label.includes('Ньен Ло')));

state.setFlag('witnessed_extortion');
state.patchQuest('tax_and_clay', { stage: TAX_STAGES.OFFERED, route: null, status: 'active', outcome: null });
const nyenOffer = pickResponse(DIALOGUE['nyen-lo'].greeting, ctx);
assert.ok(nyenOffer.choices.some((choice) => choice.label.includes('имперских ушей')));
const rebelOffer = nyenOffer.choices.find((choice) => choice.label.includes('имперских ушей'));
applyEffects(rebelOffer.effects, ctx, engine, 'test:nyen-rebels');
assert.equal(state.questStage('tax_and_clay'), TAX_STAGES.REBELS_CODE);
assert.equal(state.questState('tax_and_clay').route, 'rebels');

const rebelContact = pickResponse(DIALOGUE.rebel_cell.greeting, ctx);
assert.ok(rebelContact.choices.some((choice) => choice.label.includes('закрытым небом')));
const codeChoice = rebelContact.choices.find((choice) => choice.label.includes('закрытым небом'));
applyEffects(codeChoice.effects, ctx, engine, 'test:rebel-code');
assert.equal(state.questStage('tax_and_clay'), TAX_STAGES.REBELS_CONTACT);

const effectState = new WorldState(new MemoryStorage());
const effectPlayer = { credits: 5, inventoryState: makeCharacterInventoryState('lunar') };
const effectEngine = {
  player: effectPlayer,
  inventory: { removeItem: () => false },
  log: [],
};
const effectCtx = { ...ctx, ws: effectState, hasItem: () => false };
applyEffects([
  { type: 'questPatch', id: 'tax_and_clay', patch: { stage: 40, route: 'investigation', status: 'active' } },
  { type: 'questItem', id: 'evidenceCamera', amount: 1 },
  { type: 'reward', key: 'test:reward', reward: { credits: 20, items: ['dumontBadge'] } },
], effectCtx, effectEngine, 'test');
assert.equal(effectState.questStage('tax_and_clay'), 40);
assert.equal(effectState.hasQuestItem('evidenceCamera'), true);
assert.equal(effectPlayer.credits, 25);
assert.ok(effectPlayer.inventoryState.items.includes('dumontBadge'));

for (const [stage, done] of [
  [TAX_STAGES.OFFERED, false],
  [TAX_STAGES.ASSASSINATION_DONE, true],
  [TAX_STAGES.STANDOFF_DONE, true],
  [TAX_STAGES.ARREST_DONE, true],
  [TAX_STAGES.REBELS_CODE, false],
  [TAX_STAGES.REBELS_CONTACT, false],
  [TAX_STAGES.REBELS_CAMP, false],
  [TAX_STAGES.REBELS_APPROACH, false],
  [TAX_STAGES.REBELS_INFILTRATION, false],
  [TAX_STAGES.REBELS_CLEAN, false],
  [TAX_STAGES.REBELS_COMBAT, false],
  [TAX_STAGES.REBELS_EXTRACTION, false],
  [TAX_STAGES.REBELS_DONE, true],
]) {
  const route = stage >= 60 ? 'rebels'
    : stage >= 40 ? 'investigation'
      : stage >= 30 ? 'standoff'
        : stage >= 20 ? 'assassination'
          : null;
  effectState.patchQuest('tax_and_clay', {
    stage,
    route,
    status: done ? 'complete' : 'active',
    outcome: stage === TAX_STAGES.REBELS_DONE ? 'rebels_clean' : null,
  });
  const entry = questJournalEntries(effectState)[0];
  assert.equal(entry.done, done);
  assert.ok(entry.current);
  if (route === 'rebels') {
    assert.equal(entry.route, 'rebels');
    assert.ok(entry.log.every((text) => !text.includes('ведомост')), 'В журнал повстанцев попали записи расследования');
  }
}

console.log(JSON.stringify({
  ok: true,
  worldStateVersion: WORLD_STATE_VERSION,
  migratedStages: 4,
  outcomes: Object.keys(TAX_REWARDS).length,
  persistentCredits: hydrated.credits,
  arrestChoices: visibleArrestChoices.length,
  rebelStages: 9,
  rebelCombatSeconds: REBEL_COMBAT_DURATION,
}));
