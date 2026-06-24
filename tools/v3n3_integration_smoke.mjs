import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'v3l.html',
  'src/game/v3/main.js',
  'src/game/v3/buildInfo.js',
  'src/game/v3/data/lifeData.js',
  'src/game/v3/world/life.js',
  'src/game/v3/world/lifeVisuals.js',
  'src/game/v3/world/storyNpcVisuals.js',
  'RUN_CURRENT_BUILD_RU.md',
  'README.md',
];

const checks = [
  ['v3l.html', 'Phoenix7 v3N3'],
  ['v3l.html', '30m2a_n3_npc_visuals_2'],
  ['src/game/v3/main.js', 'PHOENIX_BUILD_INFO'],
  ['src/game/v3/main.js', 'upgradeLivingWorldVisuals'],
  ['src/game/v3/main.js', 'upgradeStoryNpcVisuals'],
  ['src/game/v3/main.js', 'getBuildInfo'],
  ['src/game/v3/main.js', 'listLifeVisuals'],
  ['src/game/v3/main.js', 'listStoryNpcVisuals'],
  ['src/game/v3/main.js', 'forceNearestCaravanAmbush'],
  ['src/game/v3/world/life.js', 'spawnCaravanAmbush'],
  ['src/game/v3/world/life.js', 'createMonster'],
  ['src/game/v3/world/life.js', 'rewardCaravanDefense'],
  ['src/game/v3/world/lifeVisuals.js', 'upgradeLivingWorldVisuals'],
  ['src/game/v3/world/lifeVisuals.js', 'v3N3_procedural_life_model'],
  ['src/game/v3/world/storyNpcVisuals.js', 'upgradeStoryNpcVisuals'],
  ['src/game/v3/world/storyNpcVisuals.js', 'v3N3_story_npc_model'],
  ['src/game/v3/buildInfo.js', 'phoenix7-v3n3-living-ecosystem-npc-visuals'],
  ['RUN_CURRENT_BUILD_RU.md', 'Phoenix7 v3N3'],
];

let failed = false;

function readRel(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

console.log('Phoenix7 v3N3 integration smoke test');
console.log('Root:', root);

for (const rel of requiredFiles) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(ok ? 'OK file   ' : 'MISS file ', rel);
  if (!ok) failed = true;
}

for (const [rel, needle] of checks) {
  if (!fs.existsSync(path.join(root, rel))) continue;
  const text = readRel(rel);
  const ok = text.includes(needle);
  console.log(ok ? 'OK marker ' : 'MISS mark ', `${rel} :: ${needle}`);
  if (!ok) failed = true;
}

if (failed) {
  console.error('\nFAIL: v3N3 integration smoke test found missing files or markers.');
  process.exit(1);
}

console.log('\nPASS: v3N3 integration files and markers are present.');
