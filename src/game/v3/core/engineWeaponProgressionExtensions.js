import { ARSENAL } from '../combat/arsenal.js';
import { ArmedWorldSystem } from '../combat/armedWorld.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const WEAPON_CLASS_IDS = {
  pistols: ['m1911a1', 'lugerP08', 'tt33', 'webleyMkVI', 'colt'],
  smgs: ['mp40', 'ppsh41', 'thompsonM1928'],
  rifles: ['k98k', 'mosin9130', 'leeEnfieldNo4', 'm1GarandWw2', 'garand', 'm1'],
  shotguns: ['winchester1897', 'browningAuto5', 'doubleBarrelSawedOff', 'shotgun'],
  machineGuns: ['mg42', 'dp28', 'brenMk1Ww2', 'brenMk', 'bren'],
  launchers: ['bazookaM1', 'bazooka', 'panzerfaust30', 'panzerfaust'],
  antiVehicleRifles: ['ptrd41', 'ptrd', 'boysAT', 'boysAt', 'lahtiL39', 'solothurn'],
  throwables: ['mk2GrenadeProto', 'grenadeMk2', 'molotovProto', 'molotov'],
};

function weaponClass(weaponId = '') {
  const w = ARSENAL[weaponId] || {};
  for (const [classKey, ids] of Object.entries(WEAPON_CLASS_IDS)) {
    if (ids.includes(weaponId)) return classKey;
  }
  if (w.archetype === 'atLauncher') return 'launchers';
  if (w.archetype === 'atRifle') return 'antiVehicleRifles';
  if (w.archetype === 'lmgBelt' || w.archetype === 'lmgMag') return 'machineGuns';
  if (w.pellets) return 'shotguns';
  if (w.archetype === 'thrownExplosive' || w.archetype === 'thrownFire') return 'throwables';
  if (w.automatic) return 'smgs';
  if ((w.range || 0) >= 45) return 'rifles';
  if (w.ammoType) return 'pistols';
  return 'melee';
}

const CLASS_LABELS = {
  pistols: 'Пистолеты',
  smgs: 'Пистолеты-пулемёты',
  rifles: 'Винтовки',
  shotguns: 'Дробовики',
  machineGuns: 'Пулемёты',
  launchers: 'Гранатомёты',
  antiVehicleRifles: 'ПТ-ружья',
  throwables: 'Бросковое оружие',
  melee: 'Ближний бой',
};

function masteryNeed(level) {
  return Math.round(24 + level * 8 + Math.pow(level, 1.32) * 2.5);
}

function ensureBucket(map, key, label, startLevel = 1) {
  if (!map[key]) map[key] = { key, label, level: startLevel, xp: 0, shots: 0, hits: 0, kills: 0, directHits: 0, splashHits: 0, armorBlocks: 0 };
  return map[key];
}

function ensureProgression(player) {
  if (!player.rpg) player.rpg = {};
  if (!player.rpg.weaponProgression || player.rpg.weaponProgression.version < 2) {
    const old = player.rpg.weaponProgression || {};
    player.rpg.weaponProgression = {
      version: 2,
      classes: old.classes || old.families || {},
    };
  }
  if (!player.rpg.weaponProgression.classes) player.rpg.weaponProgression.classes = {};
  return player.rpg.weaponProgression;
}

function gain(bucket, amount) {
  if (!bucket || amount <= 0) return false;
  bucket.xp += amount;
  let leveled = false;
  while (bucket.xp >= masteryNeed(bucket.level)) {
    bucket.xp -= masteryNeed(bucket.level);
    bucket.level += 1;
    leveled = true;
  }
  return leveled;
}

function summarizeShotResult(result) {
  const summary = { hit: false, kill: false, vehicleHit: false, armorBlocked: false, directHits: 0, splashHits: 0, damage: 0 };
  for (const r of result?.results || []) {
    if (!r?.hit) continue;
    summary.hit = true;
    summary.directHits += 1;
    summary.damage += r.damage || 0;
    if (r.vehicleHit) summary.vehicleHit = true;
    if (r.armorBlocked) summary.armorBlocked = true;
    if (r.target?.userData?.alive === false) summary.kill = true;
  }
  for (const s of result?.explosion?.splash || []) {
    if ((s.damage || 0) > 0) {
      summary.hit = true;
      summary.splashHits += 1;
      summary.damage += s.damage || 0;
      if (s.target?.userData?.vehicle) summary.vehicleHit = true;
      if (s.target?.userData?.alive === false) summary.kill = true;
    }
    if (s.armorBlocked) summary.armorBlocked = true;
  }
  if (result?.pendingProjectile || result?.rocket) summary.hit = summary.hit || false;
  return summary;
}

function classBucketFor(player, weaponId) {
  const progression = ensureProgression(player);
  const classKey = weaponClass(weaponId);
  return ensureBucket(progression.classes, classKey, CLASS_LABELS[classKey] || classKey);
}

function recordPlayerWeaponUse(engine, weaponId, result) {
  const weapon = ARSENAL[weaponId];
  if (!weapon) return null;
  const bucket = classBucketFor(engine.player, weaponId);
  const s = summarizeShotResult(result);

  bucket.shots += 1;
  if (s.hit) bucket.hits += 1;
  if (s.kill) bucket.kills += 1;
  if (s.directHits) bucket.directHits += s.directHits;
  if (s.splashHits) bucket.splashHits += s.splashHits;
  if (s.armorBlocked) bucket.armorBlocks += 1;

  let xp = 0.75;
  if (weapon.archetype === 'atLauncher') xp += 0.75;
  if (weapon.archetype === 'atRifle') xp += 0.5;
  if (weapon.automatic) xp += 0.2;
  if (s.hit) xp += 1.1 + Math.min(1.9, s.damage / 85);
  if (s.vehicleHit) xp += 1.1;
  if (s.armorBlocked) xp += 0.25;
  if (s.splashHits) xp += Math.min(1.35, s.splashHits * 0.38);
  if (s.kill) xp += 2.4;

  const leveled = gain(bucket, xp);
  if (s.hit) engine.rpg?.useSkill?.('firearms', 0.25 + Math.min(0.8, s.damage / 130));
  else engine.rpg?.useSkill?.('firearms', 0.08);

  if (leveled) engine.hud?.setObjective?.(`${bucket.label}: мастерство ${bucket.level}`);
  return { classBucket: bucket, shot: s, xp };
}

function applyMasteryToShotArgs(engine, args) {
  const bucket = classBucketFor(engine.player, args.weaponId);
  const accuracy = clamp(1 - (bucket.level - 1) * 0.016, 0.66, 1.04);
  const damage = 1 + (bucket.level - 1) * 0.008;
  return {
    ...args,
    skillLevel: (args.skillLevel || 0) + bucket.level * 2.1,
    spreadMul: (args.spreadMul || 1) * accuracy,
    damageScale: (args.damageScale || 1) * damage,
  };
}

function weaponProgressionHtml(player) {
  const progression = ensureProgression(player);
  const classRows = Object.values(progression.classes)
    .sort((a, b) => (b.level - a.level) || (b.xp - a.xp))
    .map((m) => `<div class="line"><b>${m.label}</b>: ${m.level} <small>xp ${m.xp.toFixed(1)}/${masteryNeed(m.level)} · shots ${m.shots} · hits ${m.hits} · kills ${m.kills}</small></div>`)
    .join('') || '<p>Ещё нет опыта по оружейным классам.</p>';
  return `<h3>Оружейные классы</h3>${classRows}<p><small>Опыт идёт в класс оружия, а не в конкретный образец. Например MP40 и PPSh качают «Пистолеты-пулемёты», Bazooka и Panzerfaust качают «Гранатомёты».</small></p>`;
}

function ensureNpcWeaponSkill(obj, profile) {
  const u = obj?.userData || {};
  if (!u.weaponRpg) {
    const factionBase = u.vehicle ? 7 : u.faction === 'empire' ? 6 : u.faction === 'zhuzher' ? 6 : u.faction === 'bandits' ? 5 : 3;
    const profileBonus = profile?.vehicleGun ? 2 : profile?.kind === 'firearm' ? 1 : 0;
    u.weaponRpg = { level: factionBase + profileBonus + Math.floor(Math.random() * 3), xp: 0, shots: 0, hits: 0 };
  }
  return u.weaponRpg;
}

function gainNpcWeaponSkill(obj, profile, hit) {
  const skill = ensureNpcWeaponSkill(obj, profile);
  skill.shots += 1;
  if (hit) skill.hits += 1;
  skill.xp += hit ? 1.5 : 0.55;
  const need = 18 + skill.level * 6;
  if (skill.xp >= need) {
    skill.xp -= need;
    skill.level += 1;
    return true;
  }
  return false;
}

export function installWeaponProgressionExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__weaponProgressionInstalled) return;
  PhoenixV3Engine.__weaponProgressionInstalled = true;

  const originalBoot = PhoenixV3Engine.prototype.boot;
  PhoenixV3Engine.prototype.boot = function bootWithWeaponProgression() {
    ensureProgression(this.player);
    return originalBoot.call(this);
  };

  const originalAttack = PhoenixV3Engine.prototype.attack;
  PhoenixV3Engine.prototype.attack = function attackWithWeaponProgression() {
    if (!this.ballistics?.fire) return originalAttack.call(this);
    const originalFire = this.ballistics.fire.bind(this.ballistics);
    this.ballistics.fire = (args) => {
      const tuned = applyMasteryToShotArgs(this, args);
      const result = originalFire(tuned);
      recordPlayerWeaponUse(this, args.weaponId, result);
      return result;
    };
    try {
      return originalAttack.call(this);
    } finally {
      this.ballistics.fire = originalFire;
    }
  };

  const originalOpenCharacter = PhoenixV3Engine.prototype.openCharacter;
  PhoenixV3Engine.prototype.openCharacter = function openCharacterWithWeaponProgression() {
    this.paused = true;
    const base = this.rpg.summaryHtml().replace('<p><button id="closeMapBtn">Закрыть</button></p>', '');
    this.hud.openPanel(`${base}${weaponProgressionHtml(this.player)}<p><button id="closeMapBtn">Закрыть</button></p>`);
    document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
  };

  if (!ArmedWorldSystem.__weaponProgressionPatched) {
    ArmedWorldSystem.__weaponProgressionPatched = true;
    const originalBuild = ArmedWorldSystem.prototype.build;
    ArmedWorldSystem.prototype.build = function buildWithEnemyWeaponSkill() {
      const result = originalBuild.call(this);
      const all = [...(this.engine.livingWorld?.agents || []), ...(this.engine.monsters || [])];
      for (const obj of all) if (obj.userData?.weaponProfile) ensureNpcWeaponSkill(obj, obj.userData.weaponProfile);
      return result;
    };

    const originalFire = ArmedWorldSystem.prototype.fire;
    ArmedWorldSystem.prototype.fire = function fireWithEnemyWeaponProgression(obj, target, profile) {
      const skill = ensureNpcWeaponSkill(obj, profile);
      const before = target === 'player' ? this.engine.player.hp : target?.userData?.hp;
      const tunedProfile = {
        ...profile,
        damage: Math.round((profile.damage || 1) * (1 + (skill.level - 1) * 0.018)),
      };
      originalFire.call(this, obj, target, tunedProfile);
      const after = target === 'player' ? this.engine.player.hp : target?.userData?.hp;
      const hit = Number.isFinite(before) && Number.isFinite(after) && after < before;
      if (!hit && skill.level >= 9 && Math.random() < Math.min(0.18, skill.level * 0.01)) {
        this.dealDamage(target, Math.max(1, Math.round((profile.damage || 1) * 0.32)), `${profile.name} · опытный выстрел`);
        gainNpcWeaponSkill(obj, profile, true);
      } else {
        gainNpcWeaponSkill(obj, profile, hit);
      }
    };
  }
}
