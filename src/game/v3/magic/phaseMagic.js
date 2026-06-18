import { PHASE_TREES } from '../rpg/rpgData.js';

export const PHASE_SPELLS = {
  phasePunch: { name: 'Фазовый удар', cost: 18, kind: 'attack', damageMul: 1.0, desc: 'Контактный удар с фазовым сдвигом.' },
  coneWave: { name: 'Конус сдвига', cost: 28, kind: 'attack', damageMul: 0.75, aoe: true, desc: 'Короткая волна в секторе перед игроком.' },
  rupture: { name: 'Разрыв контура', cost: 38, kind: 'attack', damageMul: 1.55, desc: 'Сильный удар по фазовым и стеклянным целям.' },
  phaseGuard: { name: 'Фазовый заслон', cost: 12, kind: 'defense', duration: 4, desc: 'Временная фазовая защита.' },
  shortBlink: { name: 'Короткий сдвиг', cost: 22, kind: 'travel', desc: 'Короткий рывок в сторону движения.' },
  roadSense: { name: 'Чувство дороги', cost: 15, kind: 'utility', desc: 'Подсвечивает опасные маршруты и события.' },
};

export class PhaseMagicSystem {
  constructor(player, rpgSystem) {
    this.player = player;
    this.rpg = rpgSystem;
    this.activeEffects = [];
  }

  equippedSpell() {
    return this.player.rpg.equippedSpell || 'phasePunch';
  }

  castEquipped() {
    return this.cast(this.equippedSpell());
  }

  cast(spellKey) {
    const spell = PHASE_SPELLS[spellKey];
    if (!spell) return { ok: false, reason: 'unknown' };
    if (!this.player.rpg.unlockedSpells.includes(spellKey)) return { ok: false, reason: 'locked' };
    if (this.player.ph < spell.cost) return { ok: false, reason: 'no_phase' };
    this.player.ph -= spell.cost;
    this.rpg.useSkill('phase', 2);
    if (spell.kind === 'defense') this.activeEffects.push({ key: spellKey, time: spell.duration });
    return { ok: true, spell };
  }

  update(dt) {
    for (const e of this.activeEffects) e.time -= dt;
    this.activeEffects = this.activeEffects.filter(e => e.time > 0);
  }

  hasEffect(key) {
    return this.activeEffects.some(e => e.key === key);
  }

  reduceDamage(amount) {
    if (this.hasEffect('phaseGuard')) return Math.ceil(amount * 0.55);
    if (this.player.rpg.phasePerks.echoSkin) return Math.ceil(amount * 0.82);
    return amount;
  }

  html() {
    const r = this.player.rpg;
    const spells = r.unlockedSpells.map(s => `<div class="line"><b>${PHASE_SPELLS[s]?.name || s}</b> — ${PHASE_SPELLS[s]?.desc || ''}</div>`).join('');
    const trees = Object.entries(PHASE_TREES).map(([key, tree]) => {
      const perks = Object.entries(tree.perks).map(([perkKey, perk]) => {
        const owned = r.phasePerks[perkKey] ? '✓' : '○';
        return `<div class="line">${owned} <b>${perk.name}</b> · cost ${perk.cost}<br><small>${perk.desc}</small></div>`;
      }).join('');
      return `<h3>${tree.name}</h3>${perks}`;
    }).join('');
    return `<h2>Фазовая магия</h2>
      <p><b>Выбрано в руку:</b> ${PHASE_SPELLS[this.equippedSpell()]?.name || this.equippedSpell()}</p>
      <p><b>Очки фазовых перков:</b> ${r.phasePerkPoints}</p>
      <h3>Доступные заклинания</h3>${spells}
      <h3>Ветки развития</h3>${trees}
      <p><small>2 — выбрать фазовую руку. Z/X/C/F — способности панели.</small></p>
      <p><button id="closeMapBtn">Закрыть</button></p>`;
  }
}
