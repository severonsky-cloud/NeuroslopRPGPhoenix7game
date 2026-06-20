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
assert.equal(hydrated.credits, 1220);
assert.equal(player.credits, 1234);
for (const itemId of ['imperialWitnessSeal', 'resonanceEvidenceShard', 'signedNyenTestimony', 'dumontBadge', 'richelieuServiceCarbine']) {
  assert.ok(ITEM_DEFS[itemId], `Неизвестная награда ${itemId}`);
  assert.ok(player.inventoryState.items.includes(itemId), `Награда не гидратирована: ${itemId}`);
}
state.applyPersistentRewards(engine);
assert.equal(player.credits, 1234, 'Повторная гидратация продублировала кредиты');

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

state.patchQuest('tax_and_clay', { stage: TAX_STAGES.ARREST_CHOICE, route: 'investigation', status: 'active' });
const arrestGreeting = pickResponse(DIALOGUE['marcel-dumont'].greeting, ctx);
const visibleArrestChoices = arrestGreeting.choices.filter((choice) => !choice.when || condOk(choice.when, ctx));
assert.ok(visibleArrestChoices.some((choice) => choice.label.includes('Имперский закон')));
assert.ok(visibleArrestChoices.some((choice) => choice.label.includes('Ньен Ло')));

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
]) {
  effectState.patchQuest('tax_and_clay', {
    stage,
    route: stage >= 40 ? 'investigation' : stage >= 30 ? 'standoff' : stage >= 20 ? 'assassination' : null,
    status: done ? 'complete' : 'active',
  });
  const entry = questJournalEntries(effectState)[0];
  assert.equal(entry.done, done);
  assert.ok(entry.current);
}

console.log(JSON.stringify({
  ok: true,
  worldStateVersion: WORLD_STATE_VERSION,
  migratedStages: 4,
  outcomes: Object.keys(TAX_REWARDS).length,
  persistentCredits: hydrated.credits,
  arrestChoices: visibleArrestChoices.length,
}));
