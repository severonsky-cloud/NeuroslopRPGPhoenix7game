export const TAX_QUEST_ID = 'tax_and_clay';

export const TAX_STAGES = Object.freeze({
  UNSTARTED: 0,
  OFFERED: 10,
  ASSASSINATION_SCENE: 20,
  ASSASSINATION_ESCAPE: 21,
  ASSASSINATION_GERDA: 22,
  ASSASSINATION_DONE: 29,
  STANDOFF_READY: 30,
  STANDOFF_COMBAT: 31,
  STANDOFF_DONE: 39,
  INVESTIGATING: 40,
  EVIDENCE_READY: 42,
  GERDA_REVIEW: 43,
  ARREST_MARCH: 44,
  ARREST_CHOICE: 45,
  ARREST_SCENE: 46,
  ARREST_DONE: 49,
  REBELS_CODE: 60,
  REBELS_CONTACT: 61,
  REBELS_CAMP: 62,
  REBELS_APPROACH: 63,
  REBELS_INFILTRATION: 64,
  REBELS_CLEAN: 65,
  REBELS_COMBAT: 66,
  REBELS_EXTRACTION: 67,
  REBELS_DONE: 69,
});

export const TAX_POSITIONS = Object.freeze({
  post: { x: -69, z: 77 },
  photoCover: { x: -75.5, z: 74.5 },
  ledger: { x: -75.4, z: 81.8 },
  checkpoint: { x: -77, z: 72 },
  gerda: { x: 152, z: 182 },
  rebelCamp: { x: -8, z: 76 },
  rebelSwitch: { x: -75.8, z: 84.2 },
  rebelCheckpoint: { x: -79.2, z: 86.4 },
  rebelExtraction: { x: -92, z: 93 },
});

export const TAX_ROUTE_RANGES = Object.freeze({
  assassination: { min: 20, max: 29 },
  standoff: { min: 30, max: 39 },
  investigation: { min: 40, max: 49 },
  rebels: { min: 60, max: 69 },
});

export const TAX_SCENE_LINES = Object.freeze([
  { who: 'Возчик КЭК', text: 'Лейтенант, мы уже отдали десятину Форту в этом году. Пропусти воз.' },
  { who: 'Лейтенант Дюмон', text: 'Десятина — Форту. А это плата за защиту поста. Десять кредитов с воза.' },
  { who: 'Возчик КЭК', text: 'Это грабёж. Мы везём глину, чтобы выменять припасы для деревни.' },
  { who: 'Лейтенант Дюмон', text: 'Это закон. Мой закон на этом посту. Плати — или глина останется здесь.' },
  { who: 'Возчик КЭК', text: '…Вот. Подавись.' },
]);

export const TAX_WITNESS_LINES = Object.freeze({
  black: 'Антиматериальный шёпот просит не убивать Дюмона — и от этого желание восстановить справедливость становится только острее.',
  red: 'Своя кровь гнётся под имперским сапогом. Красная глина помнит каждую лишнюю монету.',
  deimur: 'Резонанс лжи звучит громче слов: пошлина не оставляет следа в законной ведомости.',
  seniorReptiloid: 'Плащ на затылке сам раскрывается: офицер нарушает порядок, которым прикрывается.',
  juniorReptiloid: 'Ты уже насчитал три пути к столу с бумагами и четыре — прочь от поста.',
  tsarbor: 'Кора помнит медленные долги. Этот побор пустил корни слишком близко к дороге.',
  blue: 'Холодная ясность: спор можно заморозить уликой, прежде чем он станет кровью.',
  human: 'Имперский офицер обирает подданных без печати и приказа. Это можно доказать — или остановить силой.',
  default: 'Дюмон обирает крестьян у поста. Это не похоже на законную десятину.',
});

export const TAX_REWARDS = Object.freeze({
  community: {
    credits: 120,
    items: [],
    reputation: [
      { scope: 'factions', id: 'redPeasants', delta: 3 },
      { scope: 'locations', id: 'lang-do-services', delta: 1 },
    ],
  },
  legal: {
    credits: 200,
    items: ['imperialWitnessSeal'],
    reputation: [
      { scope: 'factions', id: 'empire', delta: 2 },
      { scope: 'factions', id: 'redPeasants', delta: 1 },
    ],
  },
  phase: {
    credits: 140,
    items: ['resonanceEvidenceShard'],
    reputation: [
      { scope: 'factions', id: 'redPeasants', delta: 2 },
      { scope: 'factions', id: 'phaseGuild', delta: 2 },
    ],
  },
  witness: {
    credits: 160,
    items: ['signedNyenTestimony'],
    reputation: [
      { scope: 'factions', id: 'redPeasants', delta: 2 },
      { scope: 'factions', id: 'empire', delta: 1 },
    ],
  },
  assassination: {
    credits: 250,
    items: ['dumontBadge'],
    reputation: [
      { scope: 'factions', id: 'redPeasants', delta: 1 },
      { scope: 'locations', id: 'richelieu-post', delta: -3 },
    ],
  },
  standoff: {
    credits: 350,
    items: ['richelieuServiceCarbine'],
    reputation: [
      { scope: 'factions', id: 'redPeasants', delta: 2 },
      { scope: 'locations', id: 'richelieu-post', delta: -2 },
    ],
  },
  rebels_clean: {
    credits: 80,
    items: ['rebelCourierNagant'],
    ammo: { revolver: 12 },
    reputation: [
      { scope: 'factions', id: 'rebels', delta: 3 },
      { scope: 'factions', id: 'redPeasants', delta: 2 },
    ],
  },
  rebels_bloody: {
    credits: 40,
    items: ['rebelSawedOff'],
    ammo: { scatter: 6 },
    reputation: [
      { scope: 'factions', id: 'rebels', delta: 2 },
      { scope: 'factions', id: 'redPeasants', delta: 1 },
      { scope: 'locations', id: 'richelieu-post', delta: -2 },
    ],
  },
});

export const TAX_REPLACEMENT_GARRISON = Object.freeze([
  {
    id: 'richelieu-replacement-reptiloid',
    name: 'Сержант Хеш Вар',
    faction: 'empire',
    role: 'patrol',
    x: -72,
    z: 78,
    text: 'Я дезертировал из одного приказа, чтобы служить другому. Этот хотя бы запрещает поборы.',
  },
  {
    id: 'richelieu-replacement-deimur',
    name: 'Матка-офицер Сел Рам',
    faction: 'empire',
    role: 'guard',
    x: -68,
    z: 80,
    text: 'Обменный корпус прислал меня проверить, почему один пост потреблял больше печатей, чем дороги.',
  },
  {
    id: 'richelieu-replacement-blue',
    name: 'Юнкерша Ильва Сно',
    faction: 'empire',
    role: 'patrol',
    x: -65,
    z: 76,
    text: 'Я летала выше облаков. Снизу особенно хорошо видно, где заканчивается закон и начинается карман.',
  },
]);

export const TAX_ARREST_SQUAD = Object.freeze([
  { id: 'tax-arrest-lead', name: 'Старший следователь Форта', faction: 'empire', role: 'guard' },
  { id: 'tax-arrest-rifle', name: 'Стрелок следственной группы', faction: 'empire', role: 'patrol' },
  { id: 'tax-arrest-clerk', name: 'Военный писарь', faction: 'empire', role: 'patrol' },
]);
