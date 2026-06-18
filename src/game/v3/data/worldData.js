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
  [{ x: -142, z: 20 }, { x: -108, z: 22 }, { x: -72, z: 26 }, { x: -34, z: 38 }, { x: 16, z: 70 }, { x: 62, z: 110 }, { x: 102, z: 145 }, { x: 142, z: 176 }],
  [{ x: 142, z: 176 }, { x: 162, z: 215 }, { x: 174, z: 248 }, { x: 220, z: 262 }, { x: 250, z: 250 }],
  [{ x: 142, z: 176 }, { x: 192, z: 156 }, { x: 238, z: 132 }, { x: 288, z: 112 }],
  [{ x: -34, z: 38 }, { x: -10, z: 8 }, { x: 44, z: -34 }],
  [{ x: -108, z: 22 }, { x: -88, z: -38 }, { x: -18, z: -82 }, { x: 92, z: -118 }, { x: 205, z: -145 }, { x: 142, z: 176 }],
  [{ x: -72, z: 26 }, { x: -92, z: 82 }, { x: -66, z: 136 }],
];

export const LOCATIONS = [
  { id: 'customs', name: 'Таможня Рины', type: 'building', x: -88, z: 18 },
  { id: 'salt', name: 'Соляные доки', type: 'district', x: -118, z: 38 },
  { id: 'market', name: 'Грязный рынок', type: 'building', x: -62, z: 40 },
  { id: 'portVillage', name: 'Посёлок докеров', type: 'village', x: -72, z: 58 },
  { id: 'shelter', name: 'Дорожный навес', type: 'building', x: -20, z: 66 },
  { id: 'redroadcamp', name: 'Лагерь Красной дороги', type: 'camp', x: 54, z: 112 },
  { id: 'registry', name: 'Канцелярия Орана', type: 'building', x: 130, z: 166 },
  { id: 'gerda', name: 'Дом Герды', type: 'building', x: 152, z: 186 },
  { id: 'fortBarracks', name: 'Казармы Форта Заря', type: 'fort', x: 146, z: 206 },
  { id: 'fortGate', name: 'Врата Форта Заря', type: 'fort', x: 112, z: 154 },
  { id: 'rednode', name: 'Красный Узел', type: 'building', x: 44, z: -34 },
  { id: 'guidecamp', name: 'Лагерь проводников', type: 'camp', x: 176, z: 214 },
  { id: 'battery', name: 'Старая батарея', type: 'ruin', x: 82, z: 78 },
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
  { id: 'roadBrute', name: 'Рогатый дорожный мутант', archetype: 'brute', biome: 'redroad', x: 24, z: 82, hp: 60, color: 0xb84634 },
  { id: 'swampLurker', name: 'Болотная тварь', archetype: 'lurker', biome: 'mangrove', x: -58, z: 154, hp: 58, color: 0x4d6a39 },
  { id: 'boneGhoul', name: 'Сухая костяная падаль', archetype: 'ghoul', biome: 'savanna', x: 250, z: 268, hp: 68, color: 0x7f633b },
  { id: 'glassPredator', name: 'Стеклянный хищник', archetype: 'glass', biome: 'glass', x: 298, z: 124, hp: 76, color: 0x67a8a6 },
  { id: 'blackElemental', name: 'Чёрный элементаль стекла', archetype: 'black', biome: 'glass', x: 288, z: 142, hp: 100, color: 0x0a0612 },
  { id: 'iceCarrion', name: 'Ледяной падальщик', archetype: 'ice', biome: 'ice', x: 220, z: -168, hp: 70, color: 0x9fc7d9 },
  { id: 'phaseEcho', name: 'Фазовое эхо', archetype: 'phase', biome: 'fort', x: 118, z: 145, hp: 66, color: 0x8a78ff },
  { id: 'zhuzherRaider', name: 'Жужжер-налётчик', archetype: 'brute', biome: 'savanna', x: 210, z: 226, hp: 72, color: 0x6b6f35 },
];
