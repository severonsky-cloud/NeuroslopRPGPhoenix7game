import assert from 'node:assert/strict';
import { ARSENAL, AMMO_TYPES, WEAPON_ARCHETYPES } from '../src/game/v3/combat/arsenal.js';
import { FirearmStateSystem } from '../src/game/v3/combat/firearmState.js';
import {
  WW2_AMMO_TYPES,
  WW2_ARSENAL,
  WW2_DEFAULT_AMMO,
  WW2_ITEM_DEFS,
  WW2_TEST_LOADOUT_ITEMS,
} from '../src/game/v3/combat/ww2ArsenalData.js';

const requiredAmmo = ['pistol9', 'pistol45', 'pistol762', 'rifle3006', 'rifle792', 'rifle303', 'rifle762r', 'rifle77', 'kurz792', 'atrifle', 'rocketAT', 'thrown'];
for (const type of requiredAmmo) {
  assert.ok(AMMO_TYPES[type], `AMMO_TYPES missing ${type}`);
  assert.ok(WW2_AMMO_TYPES[type], `WW2_AMMO_TYPES missing ${type}`);
}

for (const [weaponId, weapon] of Object.entries(WW2_ARSENAL)) {
  assert.equal(ARSENAL[weaponId], weapon, `ARSENAL did not expose ${weaponId}`);
  assert.ok(WEAPON_ARCHETYPES[weapon.archetype], `${weaponId} uses missing archetype ${weapon.archetype}`);
  assert.ok(AMMO_TYPES[weapon.ammoType], `${weaponId} uses missing ammo ${weapon.ammoType}`);
  assert.equal(weapon.clipSize > 0, true, `${weaponId} invalid clipSize`);
  assert.equal(weapon.damage > 0, true, `${weaponId} invalid damage`);
  assert.equal(weapon.range > 0, true, `${weaponId} invalid range`);
  assert.equal(weapon.muzzleVelocity > 0, true, `${weaponId} invalid muzzleVelocity`);
  assert.ok(WW2_ITEM_DEFS[weaponId], `${weaponId} missing item def`);
}

assert.ok(ARSENAL.m1, 'legacy M1 alias still exists');
assert.equal(ARSENAL.m1.ammoType, 'rifle', 'legacy M1 should keep old generic rifle ammo for existing backgrounds');

const player = {
  inventoryState: {
    ammo: {
      revolver: 50,
      rifle: 50,
      lmg: 50,
      scatter: 50,
      phaseCell: 3,
      ...WW2_DEFAULT_AMMO,
    },
  },
  characterRuntime: { reloadDuration: 1 },
};
const firearms = new FirearmStateSystem(player, null);

let firedCount = 0;
for (const weaponId of Object.keys(WW2_ARSENAL)) {
  const weapon = ARSENAL[weaponId];
  const state = firearms.state(weaponId);
  assert.equal(state.loaded, weapon.clipSize, `${weaponId} should spawn loaded`);
  const fired = firearms.tryFire(weaponId, 0, 1);
  assert.equal(fired.ok, true, `${weaponId} should fire without random jams in smoke test`);
  assert.equal(firearms.state(weaponId).loaded, weapon.clipSize - 1, `${weaponId} should spend one round`);
  firearms.state(weaponId).loaded = 0;
  const reload = firearms.startReload(weaponId);
  assert.equal(reload.ok, true, `${weaponId} should start reload with reserve ammo`);
  firearms.update(999);
  assert.equal(firearms.state(weaponId).loaded > 0, true, `${weaponId} should finish reload`);
  firedCount += 1;
}

assert.equal(WW2_TEST_LOADOUT_ITEMS.length, Object.keys(WW2_ITEM_DEFS).length, 'test loadout should cover every WW2 item');

console.log(`v3P2 WW2 arsenal smoke OK: ${firedCount} weapons, ${requiredAmmo.length} new ammo types.`);
