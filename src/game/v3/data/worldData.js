import { PORT_FORT_SETTLEMENT_ROAD } from './settlementsData.js';

export const WORLD_BOUNDS = { minX: -360, maxX: 420, minZ: -240, maxZ: 430 };

export const PLAYER_START = { x: -142, z: 20 };

export const BIOMES = [
  { id: 'ocean', name: 'Океан', color: 0x12384d, fog: 0x4c6d73, center: [-215, 0] },
  { id: 'beach', name: 'Береговая красная глина', color: 0xb46b3d, fog: 0xb36b3f, center: [-142, 22] },
  { id: 'port', name: 'Порт Рейчел', color: 0x93401f, fog: 0xb36b3f, center: [-88, 22] },
  { id: 'mangrove', name: 'Мангровые болота', color: 0x344d2c, fog: 0x2f4329, center: [-66, 136] },
  { id: 'redroad', name: 'Красная дорога', color: 0x5b4025, fog: 0x965b35, center: [24, 86] },
  { id: 'fort', name: 'Форт Заря', color: 0x70492b, fog: 0xa7673d, center: [142, 176] },
  { id: 'rednode', name: 'Красный Узел', color: 0x713224, fog: 0xa05038, center: [44, -34] },
  { id: 'savanna', name: 'Мёртвая Саванна', color: 0x7a5732, fog: 0xae814f, center: [250, 250] },
  { id: 'tsarbor', name: 'Лес царборцев', color: 0x234936, fog: 0x183322, center: [174, 248] },
  { id: 'glass', name: 'Вотчина чёрных элементалей', color: 0x5fa6a4, fog: 0x182129, center: [288, 112] },
  { id: 'ice', name: 'Ледяной шельф', color: 0x9fc7d9, fog: 0x7793a3, center: [205, -145] },
];

export const ROADS = [
  [{ x: -142, z: 20 }, { x: -108, z: 22 }, ...PORT_FORT_SETTLEMENT_ROAD],
  [{ x: 142, z: 176 }, { x: 162, z: 215 }, { x: 174, z: 248 }, { x: 220, z: 262 }, { x: 250, z: 250 }],
  [{ x: 142, z: 176 }, { x: 192, z: 156 }, { x: 238, z: 132 }, { x: 288, z: 112 }],
  [{ x: -34, z: 38 }, { x: -10, z: 8 }, { x: 44, z: -34 }],
  [{ x: -108, z: 22 }, { x: -88, z: -38 }, { x: -18, z: -82 }, { x: 92, z: -118 }, { x: 205, z: -145 }, { x: 142, z: 176 }],
  [{ x: -72, z: 26 }, { x: -92, z: 82 }, { x: -66, z: 136 }],
];

export const VISUAL_ATMOSPHERE_POINTS = {
  roadsideCamps: [
    { id: 'coastal-watch', x: -119, z: 27, heading: 0.35, fire: true },
    { id: 'red-road-rest', x: 49, z: 103, heading: -0.4, fire: true },
    { id: 'savanna-waycamp', x: 216, z: 250, heading: 0.8, fire: true },
  ],
  distantMarkers: [
    { id: 'coast-tripod', x: -151, z: -24, height: 15, color: 0x2d2118, accent: 0x8a5c32 },
    { id: 'red-road-needle', x: 101, z: 92, height: 19, color: 0x3b2117, accent: 0xa54c2f },
    { id: 'fort-signal', x: 106, z: 166, height: 22, color: 0x252326, accent: 0xb36b3f },
    { id: 'forest-totem', x: 148, z: 264, height: 18, color: 0x203326, accent: 0x58764c },
    { id: 'savanna-bones', x: 274, z: 284, height: 16, color: 0x6c5636, accent: 0xc2a56d },
    { id: 'glass-spire', x: 318, z: 92, height: 26, color: 0x14252b, accent: 0x5ec7c4 },
  ],
};

export const LOCATIONS = [
  { id: 'customs', name: 'Таможня Рины', type: 'building', x: -88, z: 18 },
  { id: 'salt', name: 'Соляные доки', type: 'district', x: -118, z: 38 },
  { id: 'market', name: 'Грязный рынок', type: 'building', x: -62, z: 40 },
  { id: 'registry', name: 'Канцелярия Орана', type: 'building', x: 130, z: 166 },
  { id: 'gerda', name: 'Дом Герды', type: 'building', x: 152, z: 186 },
  { id: 'fortBarracks', name: 'Казармы Форта Заря', type: 'fort', x: 146, z: 206 },
  { id: 'fortGate', name: 'Врата Форта Заря', type: 'fort', x: 112, z: 154 },
  { id: 'rednode', name: 'Красный Узел', type: 'building', x: 44, z: -34 },
  { id: 'guidecamp', name: 'Лагерь проводников', type: 'camp', x: 176, z: 214 },
  { id: 'mangrovepump', name: 'Мангровые насосы', type: 'building', x: -66, z: 136 },
  { id: 'tsarborcamp', name: 'Стан царборцев', type: 'camp', x: 174, z: 248 },
  { id: 'glassdemesne', name: 'Вотчина чёрных элементалей', type: 'biome', x: 288, z: 112 },
  { id: 'blueCaravanYard', name: 'Двор синих караванов', type: 'camp', x: 238, z: 132 },
  { id: 'iceshelfpost', name: 'Пост ледяного шельфа', type: 'outpost', x: 205, z: -145 },
  { id: 'deadsavanna', name: 'Край Мёртвой Саванны', type: 'biome', x: 250, z: 250 },
];

export const NPCS = [
  { id: 'rina', name: 'Рина', role: 'customs', faction: 'Port Rachel', x: -88, z: 22, text: 'Порт Рейчел далеко от Форта Заря. Пешком это целое путешествие. Через ледяной шельф быстрее, но опаснее.' },
  { id: 'merchant', name: 'Торговец красной глиной', role: 'market', faction: 'Market', x: -62, z: 44, text: 'Глина помнит сапоги караванов. Купи слух — дойдёшь дальше.' },
  { id: 'dockPeasant', name: 'Крестьянин-глиняник', role: 'worker', faction: 'Peasants', x: -76, z: 60, text: 'Мы копаем глину, сушим её и платим налоги тем, кто носит железо.' },
  { id: 'oran', name: 'Оран Тив', role: 'registry', faction: 'Fort Zarya', x: 130, z: 160, text: 'Ты дошёл из порта? Значит, дорога тебя ещё не съела. Регистрация временная.' },
  { id: 'gerda', name: 'Герда Гайгерманика', role: 'act1', faction: 'Fort Zarya', x: 152, z: 182, text: 'Собери четыре подготовки: дорога, рынок, фракции, контрабанда. Форт далеко, но все дороги сходятся сюда.' },
  { id: 'sava', name: 'Сава', role: 'guide', faction: 'Guides', x: 176, z: 218, text: 'Я поведу тебя к саванне, когда Герда скажет, что ты не пропадёшь на первом ветру.' },
  { id: 'smuggler', name: 'Контрабандист', role: 'contraband', faction: 'Red Node', x: 44, z: -30, text: 'Бирка у меня. Цена — не спрашивать, с какого корабля её сняли.' },
  { id: 'tsarborScout', name: 'Разведчик царборцев', role: 'scout', faction: 'Tsarbor', x: 174, z: 242, text: 'Лес царборцев высаживают не ради красоты. Мы удерживаем край Мёртвой Саванны.', route: [{x:174,z:242},{x:188,z:262},{x:154,z:270},{x:174,z:242}] },
  { id: 'glassMonk', name: 'Стеклянный монах', role: 'monk', faction: 'Black Elementals', x: 288, z: 116, text: 'Это вотчина чёрных элементалей. Стекло растёт вокруг их теней.', route: [{x:288,z:116},{x:306,z:128},{x:274,z:142},{x:288,z:116}] },
  { id: 'iceRanger', name: 'Смотритель шельфа', role: 'ranger', faction: 'Ice Shelf', x: 205, z: -138, text: 'Лёд здесь не холодный. Он просто не признаёт местное солнце.', route: [{x:205,z:-138},{x:230,z:-162},{x:176,z:-170},{x:205,z:-138}] },
  { id: 'caravan', name: 'Караванщик', role: 'walker', faction: 'Caravan', x: -118, z: 42, text: 'Караван идёт от соли к Форту. Далеко, медленно, зато с охраной.', route: [{x:-118,z:42},{x:-62,z:40},{x:-20,z:66},{x:54,z:112},{x:142,z:176},{x:-118,z:42}] },
];

export const MONSTERS = [
  { id: 'roadBrute', name: 'Рогатый дорожный мутант', archetype: 'brute', biome: 'redroad', faction: 'wild', x: 24, z: 82, hp: 60, color: 0xb84634 },
  { id: 'swampLurker', name: 'Болотная тварь', archetype: 'lurker', biome: 'mangrove', faction: 'wild', x: -58, z: 154, hp: 58, color: 0x4d6a39 },
  { id: 'boneGhoul', name: 'Сухая костяная падаль', archetype: 'ghoul', biome: 'savanna', faction: 'wild', x: 250, z: 268, hp: 68, color: 0x7f633b },
  { id: 'glassPredator', name: 'Стеклянный хищник', archetype: 'glass', biome: 'glass', faction: 'blackElementals', x: 298, z: 124, hp: 76, color: 0x67a8a6 },
  { id: 'blackElemental', name: 'Чёрный элементаль стекла', archetype: 'black', biome: 'glass', faction: 'blackElementals', x: 288, z: 142, hp: 100, color: 0x0a0612 },
  { id: 'iceCarrion', name: 'Ледяной падальщик', archetype: 'ice', biome: 'ice', faction: 'wild', x: 220, z: -168, hp: 70, color: 0x9fc7d9 },
  { id: 'phaseEcho', name: 'Фазовое эхо', archetype: 'phase', biome: 'fort', faction: 'blackElementals', x: 118, z: 145, hp: 66, color: 0x8a78ff },
  { id: 'zhuzherRaider', name: 'Жужжер-налётчик', archetype: 'brute', biome: 'savanna', faction: 'zhuzher', x: 210, z: 226, hp: 72, color: 0x6b6f35 },

  { id: 'banditRiflemanRedRoad', name: 'Бандит с винтовкой', archetype: 'ghoul', biome: 'redroad', faction: 'bandits', x: 58, z: 112, hp: 46, color: 0x8b5a35, autoHostile: true, speed: 0.95 },
  { id: 'banditShotgunRedRoad', name: 'Бандит с дробовиком', archetype: 'brute', biome: 'redroad', faction: 'bandits', x: 72, z: 126, hp: 64, color: 0x9a6134, autoHostile: true, speed: 0.9 },
  { id: 'banditKnifeScout', name: 'Бандит-разведчик', archetype: 'lurker', biome: 'redroad', faction: 'bandits', x: 38, z: 96, hp: 38, color: 0x6f4a2d, autoHostile: true, speed: 1.35 },
  { id: 'redNodeSmugglerGuard', name: 'Охранник Красного Узла', archetype: 'brute', biome: 'rednode', faction: 'bandits', x: 22, z: -48, hp: 58, color: 0x7d3e2f, autoHostile: true, speed: 0.95 },
  { id: 'redNodePistolGang', name: 'Пистолетчик Красного Узла', archetype: 'ghoul', biome: 'rednode', faction: 'bandits', x: 62, z: -56, hp: 44, color: 0x744331, autoHostile: true, speed: 1.05 },

  { id: 'zhuzherPpshPatrol', name: 'Жужжер с ППШ', archetype: 'brute', biome: 'savanna', faction: 'zhuzher', x: 226, z: 238, hp: 76, color: 0x72763b, autoHostile: true, speed: 0.95 },
  { id: 'zhuzherMgCarrier', name: 'Жужжер-пулемётчик', archetype: 'brute', biome: 'savanna', faction: 'zhuzher', x: 238, z: 246, hp: 90, color: 0x595c32, autoHostile: true, speed: 0.72 },
  { id: 'zhuzherFlanker', name: 'Жужжер-фланкер', archetype: 'lurker', biome: 'savanna', faction: 'zhuzher', x: 204, z: 258, hp: 52, color: 0x6c713a, autoHostile: true, speed: 1.3 },
  { id: 'tsarborHostileRoot', name: 'Враждебный царборский корень', archetype: 'lurker', biome: 'tsarbor', faction: 'bandits', x: 154, z: 282, hp: 62, color: 0x38522d, autoHostile: true, speed: 0.82 },
  { id: 'glassRifleEcho', name: 'Стеклянный стрелок', archetype: 'glass', biome: 'glass', faction: 'blackElementals', x: 318, z: 102, hp: 84, color: 0x7fc7c0, conditionalHostile: true, autoHostile: true, speed: 0.72 },
  { id: 'iceShelfRaider', name: 'Рейдер ледяного шельфа', archetype: 'ghoul', biome: 'ice', faction: 'bandits', x: 184, z: -154, hp: 54, color: 0x8fb0b8, autoHostile: true, speed: 1.0 },

  { id: 'banditBuggy', name: 'Бандитская тачанка', archetype: 'lightVehicle', biome: 'redroad', faction: 'bandits', x: 86, z: 118, hp: 150, armor: 6, vehicle: true, vehicleArmor: 6, autoHostile: true, speed: 0.42, color: 0x5a4630 },
  { id: 'zhuzherHalftrack', name: 'Жужжерский полугусеничный броневик', archetype: 'armoredVehicle', biome: 'savanna', faction: 'zhuzher', x: 246, z: 232, hp: 280, armor: 13, vehicle: true, vehicleArmor: 13, autoHostile: true, speed: 0.28, color: 0x4b4f2c },
  { id: 'redNodeFuelTruck', name: 'Топливный грузовик Красного Узла', archetype: 'softVehicle', biome: 'rednode', faction: 'bandits', x: 70, z: -28, hp: 130, armor: 3, vehicle: true, vehicleArmor: 3, explosiveDeath: true, autoHostile: true, speed: 0.18, color: 0x6c3c2c },
  { id: 'blackGlassCrawler', name: 'Стеклянный боевой ходок', archetype: 'walkerVehicle', biome: 'glass', faction: 'blackElementals', x: 306, z: 138, hp: 240, armor: 10, vehicle: true, vehicleArmor: 10, conditionalHostile: true, autoHostile: true, speed: 0.24, color: 0x25343a },
];
