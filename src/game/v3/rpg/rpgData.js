export const ATTRIBUTES = {
  strength: { name: 'Сила', desc: 'Урон в ближнем бою, переносимый вес, устойчивость.' },
  agility: { name: 'Ловкость', desc: 'Скорость движения, уклонение, точность быстрых ударов.' },
  endurance: { name: 'Выносливость', desc: 'Запас здоровья, стойкость, регенерация выносливости.' },
  intellect: { name: 'Интеллект', desc: 'Фазовый резерв, обучение, понимание артефактов.' },
  willpower: { name: 'Воля', desc: 'Сила фазовой магии, сопротивление эффектам.' },
  perception: { name: 'Восприятие', desc: 'Стрельба, заметность врагов, дальность обнаружения.' },
};

export const SKILLS = {
  blade: { name: 'Клинки', attribute: 'strength', desc: 'Мечи, шпаги, рубящие и колющие удары.' },
  blunt: { name: 'Рукопашный бой', attribute: 'strength', desc: 'Кулаки, рукопашные атаки, фазовый контакт.' },
  firearms: { name: 'Огнестрел', attribute: 'perception', desc: 'Точность и контроль огнестрельного оружия.' },
  armor: { name: 'Броня', attribute: 'endurance', desc: 'Ношение брони и снижение входящего урона.' },
  athletics: { name: 'Атлетика', attribute: 'agility', desc: 'Бег, рывки, движение по пересечённой местности.' },
  dodge: { name: 'Уклонение', attribute: 'agility', desc: 'Шаги в сторону, уход из сектора атаки.' },
  phase: { name: 'Фазовая магия', attribute: 'willpower', desc: 'Фазовые удары, щиты, сдвиги и пассивные ветки.' },
  survival: { name: 'Выживание', attribute: 'endurance', desc: 'Путешествия, лагерь, ориентирование вне дорог.' },
  speech: { name: 'Речь', attribute: 'intellect', desc: 'Разговоры, слухи, торговые и фракционные проверки.' },
};

export const LEVEL_RULES = {
  xpBase: 100,
  xpGrowth: 1.35,
  attributePointsPerLevel: 2,
  phasePerkPointsPerLevel: 1,
  skillUseXp: {
    blade: 1.15,
    blunt: 1.0,
    firearms: 1.1,
    armor: 0.8,
    athletics: 0.35,
    dodge: 0.8,
    phase: 1.25,
    survival: 0.55,
    speech: 0.65,
  },
};

export const PHASE_TREES = {
  attack: {
    name: 'Фазовая атака',
    perks: {
      phasePunch: { name: 'Фазовый удар', cost: 1, desc: 'Базовый контактный фазовый удар.' },
      coneWave: { name: 'Конус сдвига', cost: 2, desc: 'Расширяет сектор фазовой атаки.' },
      rupture: { name: 'Разрыв контура', cost: 3, desc: 'Увеличивает урон по стеклянным и фазовым существам.' },
    },
  },
  defense: {
    name: 'Фазовая защита',
    perks: {
      phaseGuard: { name: 'Фазовый заслон', cost: 1, desc: 'Снижает входящий урон при блоке.' },
      echoSkin: { name: 'Эхо-кожа', cost: 2, desc: 'Пассивная защита от фазового урона.' },
      splitSecond: { name: 'Расщеплённая секунда', cost: 3, desc: 'Короткий шанс избежать смертельного удара.' },
    },
  },
  travel: {
    name: 'Фазовое путешествие',
    perks: {
      shortBlink: { name: 'Короткий сдвиг', cost: 1, desc: 'Рывок в сторону движения.' },
      roadSense: { name: 'Чувство дороги', cost: 2, desc: 'Лучше обнаруживает опасные события на маршрутах.' },
      deadSavannaAnchor: { name: 'Якорь Саванны', cost: 4, desc: 'Особый перк для позднего перехода к Мёртвой Саванне.' },
    },
  },
};

export function makeRpgState() {
  const skills = {};
  for (const key of Object.keys(SKILLS)) skills[key] = { level: 5, xp: 0 };
  return {
    level: 1,
    xp: 0,
    nextXp: LEVEL_RULES.xpBase,
    attributePoints: 0,
    phasePerkPoints: 0,
    attributes: {
      strength: 5,
      agility: 5,
      endurance: 5,
      intellect: 5,
      willpower: 5,
      perception: 5,
    },
    skills,
    phasePerks: {},
    unlockedSpells: ['phasePunch'],
    equippedSpell: 'phasePunch',
    abilityHotbar: ['shortBlink', 'phaseGuard', null, null],
  };
}
