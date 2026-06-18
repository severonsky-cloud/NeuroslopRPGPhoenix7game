import { makeRpgState, LEVEL_RULES, SKILLS, ATTRIBUTES, PHASE_TREES } from './rpgData.js';

export class RpgSystem {
  constructor(player) {
    this.player = player;
    if (!player.rpg) player.rpg = makeRpgState();
  }

  useSkill(skillKey, amount = 1) {
    const rpg = this.player.rpg;
    const skill = rpg.skills[skillKey];
    if (!skill) return null;
    const mul = LEVEL_RULES.skillUseXp[skillKey] ?? 1;
    skill.xp += amount * mul;
    const need = this.skillNeed(skill.level);
    let leveled = false;
    while (skill.xp >= need) {
      skill.xp -= need;
      skill.level += 1;
      leveled = true;
      this.addXp(8 + Math.floor(skill.level * 0.65));
    }
    return { skillKey, level: skill.level, leveled };
  }

  skillNeed(level) {
    return 18 + level * 5;
  }

  addXp(amount) {
    const rpg = this.player.rpg;
    rpg.xp += amount;
    let leveled = false;
    while (rpg.xp >= rpg.nextXp) {
      rpg.xp -= rpg.nextXp;
      rpg.level += 1;
      rpg.attributePoints += LEVEL_RULES.attributePointsPerLevel;
      rpg.phasePerkPoints += LEVEL_RULES.phasePerkPointsPerLevel;
      rpg.nextXp = Math.floor(LEVEL_RULES.xpBase * Math.pow(LEVEL_RULES.xpGrowth, rpg.level - 1));
      leveled = true;
    }
    return leveled;
  }

  trainSkill(skillKey, levels = 1, source = 'teacher') {
    const skill = this.player.rpg.skills[skillKey];
    if (!skill) return false;
    skill.level += levels;
    this.addXp(12 * levels);
    return { skillKey, levels, source };
  }

  rewardPhasePerkPoint(reason = 'quest') {
    this.player.rpg.phasePerkPoints += 1;
    return { reason, points: this.player.rpg.phasePerkPoints };
  }

  spendAttributePoint(attributeKey) {
    const rpg = this.player.rpg;
    if (!rpg.attributes[attributeKey] || rpg.attributePoints <= 0) return false;
    rpg.attributes[attributeKey] += 1;
    rpg.attributePoints -= 1;
    this.recalculateDerivedStats();
    return true;
  }

  buyPhasePerk(treeKey, perkKey) {
    const tree = PHASE_TREES[treeKey];
    const perk = tree?.perks?.[perkKey];
    if (!perk) return false;
    const rpg = this.player.rpg;
    if (rpg.phasePerks[perkKey]) return false;
    if (rpg.phasePerkPoints < perk.cost) return false;
    rpg.phasePerkPoints -= perk.cost;
    rpg.phasePerks[perkKey] = true;
    if (!rpg.unlockedSpells.includes(perkKey)) rpg.unlockedSpells.push(perkKey);
    this.recalculateDerivedStats();
    return true;
  }

  equipSpell(spellKey) {
    if (!this.player.rpg.unlockedSpells.includes(spellKey)) return false;
    this.player.rpg.equippedSpell = spellKey;
    return true;
  }

  setAbilitySlot(index, abilityKey) {
    if (index < 0 || index > 3) return false;
    if (abilityKey && !this.player.rpg.unlockedSpells.includes(abilityKey)) return false;
    this.player.rpg.abilityHotbar[index] = abilityKey;
    return true;
  }

  recalculateDerivedStats() {
    const a = this.player.rpg.attributes;
    this.player.hpMax = 90 + a.endurance * 5;
    this.player.stMax = 85 + a.agility * 3 + a.endurance * 3;
    this.player.phMax = 60 + a.willpower * 4 + a.intellect * 3;
    this.player.hp = Math.min(this.player.hp, this.player.hpMax);
    this.player.st = Math.min(this.player.st, this.player.stMax);
    this.player.ph = Math.min(this.player.ph, this.player.phMax);
  }

  summaryHtml() {
    const r = this.player.rpg;
    const attr = Object.entries(r.attributes)
      .map(([k, v]) => `<div class="line"><b>${ATTRIBUTES[k]?.name || k}</b>: ${v}</div>`)
      .join('');
    const skills = Object.entries(r.skills)
      .map(([k, v]) => `<div class="line"><b>${SKILLS[k]?.name || k}</b>: ${v.level} <small>xp ${v.xp.toFixed(1)}</small></div>`)
      .join('');
    const perks = Object.keys(r.phasePerks).length ? Object.keys(r.phasePerks).join(', ') : 'нет';
    return `<h2>Персонаж / RPG</h2>
      <p><b>Уровень:</b> ${r.level} · XP ${Math.floor(r.xp)}/${r.nextXp}</p>
      <p><b>Очки атрибутов:</b> ${r.attributePoints} · <b>Фазовые перки:</b> ${r.phasePerkPoints}</p>
      <h3>Параметры</h3>${attr}
      <h3>Навыки</h3>${skills}
      <h3>Фазовые перки</h3><p>${perks}</p>
      <p><button id="closeMapBtn">Закрыть</button></p>`;
  }
}
