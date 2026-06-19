import assert from 'node:assert/strict';
import * as THREE from '../src/game/v3/vendor/three.module.js';
import { BACKGROUNDS, RACES } from '../src/game/v3/data/characterData.js';
import {
  CHARACTER_PROFILE_KEY,
  LEGACY_CHARACTER_BACKUP_KEY,
  migrateLegacyCharacterProfile,
  normalizeCharacterProfile,
} from '../src/game/v3/character/characterProfile.js';
import { makeCharacterInventoryState, ITEM_DEFS } from '../src/game/v3/items/inventory.js';
import { PlayerBodySystem } from '../src/game/v3/visuals/playerBody.js';
import {
  createWeaponViewModel,
  setWeaponViewModelReloadState,
  triggerWeaponViewModelAction,
  updateWeaponViewModel,
} from '../src/game/v3/items/weaponModels.js';
import {
  PORT_FORT_SETTLEMENT_ROAD,
  SETTLEMENTS,
  SETTLEMENT_AGENTS,
  resolveSettlementDialogue,
  settlementRoadLength,
} from '../src/game/v3/data/settlementsData.js';

class MemoryStorage {
  constructor(entries = {}) {
    this.data = new Map(Object.entries(entries));
  }

  getItem(key) {
    return this.data.get(key) ?? null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  removeItem(key) {
    this.data.delete(key);
  }
}

const combinations = [];
for (const [raceId, race] of Object.entries(RACES)) {
  for (const gender of race.allowedGenders) combinations.push({ raceId, gender });
}
assert.equal(combinations.length, 15, 'Должно быть 15 допустимых сочетаний race/gender');

const requiredRaceParts = {
  human: 'human-eye-1',
  deimur: 'deimur-resonance-crown',
  red: 'red-torso-crack-left',
  blue: 'blue-shoulder-ice-1',
  black: 'black-antimatter-halo',
  seniorReptiloid: 'senior-reptiloid-frill-0',
  juniorReptiloid: 'gecko-eye-1',
  tsarbor: 'tsarbor-back-bark',
};

for (const { raceId, gender } of combinations) {
  const profile = normalizeCharacterProfile({
    name: 'Smoke Test',
    race: raceId,
    gender,
    background: 'lunar',
    heightOffset: 0.05,
  });
  const rig = new THREE.Group();
  const engine = {
    rig,
    yaw: 0,
    player: {
      race: raceId,
      gender,
      characterProfile: profile,
      motion: { vx: 5, vz: 1, bob: 0 },
    },
  };
  const body = new PlayerBodySystem(engine);
  body.build();
  body.setThirdPerson(true);
  assert.equal(body.profile.id, raceId);
  assert.equal(body.profile.gender, gender);
  assert.ok(body.container.getObjectByName(requiredRaceParts[raceId]), `Не найдена расовая деталь ${raceId}`);
  for (let index = 0; index < 300; index += 1) {
    engine.player.motion.bob += 0.1;
    body.update(1 / 60);
  }
  assert.ok(Number.isFinite(body.bodyRoot.rotation.x), `Нестабильная body animation: ${raceId}`);

  for (const weaponId of ['colt', 'm1', 'bren', 'trenchShotgun', 'caravanCarbine', 'rapier', 'boardingAxe', 'glassDagger', 'phase']) {
    const viewModel = createWeaponViewModel(weaponId, false, engine.player);
    assert.equal(viewModel.userData.characterRace, raceId);
    assert.ok(viewModel.userData.leftArm && viewModel.userData.rightArm);
  }
}

assert.equal(Object.keys(BACKGROUNDS).length, 8, 'Должно быть восемь предысторий');
for (const background of Object.values(BACKGROUNDS)) {
  const inventory = makeCharacterInventoryState(background.id);
  assert.ok(inventory.items.includes('fists'));
  assert.ok(inventory.items.includes('phaseHand'));
  for (const itemId of background.items) {
    assert.ok(ITEM_DEFS[itemId], `Неизвестный предмет ${itemId}`);
    assert.ok(inventory.items.includes(itemId), `Предмет ${itemId} не выдан ${background.id}`);
  }
  assert.ok(background.dialogueHooks.length >= 2, `Не хватает dialogue hooks: ${background.id}`);
}

const legacyRaces = {
  human: 'human',
  deimur: 'deimur',
  reptile: 'juniorReptiloid',
  carbor: 'tsarbor',
  red: 'red',
  blue: 'blue',
  black: 'black',
};
const legacyBackgrounds = {
  prisoner: 'lunar',
  zhuzh: 'guide',
  deserter: 'deserter',
  guide: 'guide',
  clerk: 'clerk',
  duelist: 'duelist',
  resonant: 'resonant',
};
let migrationCases = 0;
for (const [legacyRace, race] of Object.entries(legacyRaces)) {
  for (const [legacyBackground, background] of Object.entries(legacyBackgrounds)) {
    const storage = new MemoryStorage({
      phx2l_character: JSON.stringify({
        name: 'Legacy',
        race: legacyRace,
        bg: legacyBackground,
      }),
    });
    const result = migrateLegacyCharacterProfile(storage);
    assert.equal(result.profile.race, race);
    assert.equal(result.profile.background, background);
    assert.equal(result.profile.gender, 'male');
    assert.ok(storage.getItem(CHARACTER_PROFILE_KEY));
    assert.ok(storage.getItem(LEGACY_CHARACTER_BACKUP_KEY));
    assert.equal(storage.getItem('phx2l_character'), null);
    migrationCases += 1;
  }
}

const redMale = normalizeCharacterProfile({ race: 'red', gender: 'male', background: 'lunar' });
assert.ok(redMale.biographyFlags.includes('red_male_wife_permission'));
assert.equal(normalizeCharacterProfile({ race: 'deimur', gender: 'female' }).gender, 'male');

const guard = SETTLEMENT_AGENTS.find((agent) => agent.id === 'marcel-dumont');
const elder = SETTLEMENT_AGENTS.find((agent) => agent.id === 'lien-tho');
assert.notEqual(
  resolveSettlementDialogue(guard, { race: 'human', background: 'clerk', gender: 'male' }),
  resolveSettlementDialogue(guard, { race: 'human', background: 'clerk', gender: 'female' }),
);
assert.notEqual(
  resolveSettlementDialogue(elder, { race: 'red', background: 'lunar', gender: 'male' }),
  resolveSettlementDialogue(elder, { race: 'red', background: 'lunar', gender: 'female' }),
);

for (const weaponId of ['colt', 'm1', 'bren', 'trenchShotgun', 'caravanCarbine', 'rapier', 'boardingAxe', 'glassDagger', 'phase']) {
  const profile = normalizeCharacterProfile({ race: 'black', gender: 'female', background: 'lunar' });
  const viewModel = createWeaponViewModel(weaponId, false, { race: 'black', characterProfile: profile });
  for (let cycle = 0; cycle < 12; cycle += 1) {
    triggerWeaponViewModelAction(viewModel, cycle % 2 ? 'alternate' : 'primary');
    for (let frame = 0; frame < 30; frame += 1) {
      updateWeaponViewModel(viewModel, {
        dt: 1 / 60,
        motion: { vx: 3, vz: 1, bob: frame * 0.2 },
      });
    }
    setWeaponViewModelReloadState(viewModel, {
      active: true,
      progress: 0.5,
      stage: 'load',
      weaponId,
    });
    updateWeaponViewModel(viewModel, { dt: 1 / 60, motion: { vx: 0, vz: 0, bob: 0 } });
    setWeaponViewModelReloadState(viewModel, {
      active: false,
      progress: 1,
      stage: 'ready',
      weaponId,
    });
    for (let frame = 0; frame < 60; frame += 1) {
      updateWeaponViewModel(viewModel, { dt: 1 / 60, motion: { vx: 0, vz: 0, bob: 0 } });
    }
  }
  assert.ok(Math.abs(viewModel.userData.poseRoot.rotation.y) < 0.001, `Накопился поворот ${weaponId}`);
  assert.ok(Math.abs(viewModel.userData.poseRoot.position.z) < 0.001, `Накопилось смещение ${weaponId}`);
  for (const part of Object.values(viewModel.userData.weaponParts)) {
    if (part.userData.basePosition) assert.ok(part.position.distanceTo(part.userData.basePosition) < 1e-6);
  }
}

const aimedBren = createWeaponViewModel('bren', true, { race: 'human' });
const brenMagazine = aimedBren.getObjectByName('bren-top-magazine');
const brenSight = aimedBren.getObjectByName('front-sight');
assert.ok(Math.abs(brenMagazine.position.x - brenSight.position.x) >= 0.15, 'Магазин Bren перекрывает прицел');

assert.equal(SETTLEMENTS.length, 8);
const roadLength = settlementRoadLength();
assert.ok(roadLength >= 475 && roadLength <= 490);
assert.deepEqual(PORT_FORT_SETTLEMENT_ROAD.at(-1), { x: 142, z: 176 });

console.log(JSON.stringify({
  ok: true,
  raceGenderCombinations: combinations.length,
  backgrounds: Object.keys(BACKGROUNDS).length,
  migrationCases,
  settlements: SETTLEMENTS.length,
  roadLength,
  viewModels: 9,
}));
