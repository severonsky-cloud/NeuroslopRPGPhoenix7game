export const WORLD_BOUNDS = { minX: -320, maxX: 340, minZ: -210, maxZ: 360 };

export const PLAYER_START = { x: -128, z: 18 };

export const BIOMES = [
  { id: 'ocean', name: 'Океан', color: 0x12384d, fog: 0x4c6d73, center: [-190, 0] },
  { id: 'beach', name: 'Береговая красная глина', color: 0xb46b3d, fog: 0xb36b3f, center: [-112, 18] },
  { id: 'port', name: 'Порт Рейчел', color: 0x93401f, fog: 0xb36b3f, center: [-68, 20] },
  { id: 'mangrove', name: 'Мангровые болота', color: 0x344d2c, fog: 0x2f4329, center: [-54, 128] },
  { id: 'fort', name: 'Форт Заря', color: 0x70492b, fog: 0xa7673d, center: [38, 58] },
  { id: 'rednode', name: 'Красный Узел', color: 0x713224, fog: 0xa05038, center: [52, -28] },
  { id: 'savanna', name: 'Мёртвая Саванна', color: 0x7a5732, fog: 0xae814f, center: [118, 96] },
  { id: 'tsarbor', name: 'Лес царборцев', color: 0x234936, fog: 0x183322, center: [168, 190] },
  { id: 'glass', name: 'Вотчина чёрных элементалей', color: 0x5fa6a4, fog: 0x182129, center: [226, 72] },
  { id: 'ice', name: 'Ледяной шельф', color: 0x9fc7d9, fog: 0x7793a3, center: [190, -118] },
];

export const ROADS = [
  [{ x: -128, z: 18 }, { x: -92, z: 17 }, { x: -62, z: 16 }, { x: -28, z: 18 }, { x: 18, z: 18 }, { x: 54, z: 34 }, { x: 88, z: 68 }, { x: 122, z: 108 }, { x: 156, z: 150 }, { x: 178, z: 192 }],
  [{ x: -62, z: 16 }, { x: -74, z: 36 }, { x: -82, z: 86 }, { x: -54, z: 128 }],
  [{ x: -28, z: 18 }, { x: -22, z: 52 }],
  [{ x: 18, z: 18 }, { x: 52, z: -28 }],
  [{ x: 54, z: 34 }, { x: 78, z: 8 }, { x: 190, z: -118 }],
  [{ x: 88, z: 68 }, { x: 226, z: 72 }],
  [{ x: 122, z: 108 }, { x: 168, z: 190 }],
];

export const LOCATIONS = [
  { id: 'customs', name: 'Таможня Рины', type: 'building', x: -54, z: 8 },
  { id: 'salt', name: 'Соляные доки', type: 'district', x: -86, z: 34 },
  { id: 'market', name: 'Грязный рынок', type: 'building', x: -32, z: 32 },
  { id: 'shelter', name: 'Дорожный навес', type: 'building', x: -22, z: 54 },
  { id: 'registry', name: 'Канцелярия Орана', type: 'building', x: 34, z: -8 },
  { id: 'gerda', name: 'Дом Герды', type: 'building', x: 48, z: 20 },
  { id: 'rednode', name: 'Красный Узел', type: 'building', x: 54, z: -32 },
  { id: 'guidecamp', name: 'Лагерь проводников', type: 'camp', x: 78, z: 58 },
  { id: 'battery', name: 'Старая батарея', type: 'ruin', x: 82, z: 6 },
  { id: 'mangrovepump', name: 'Мангровые насосы', type: 'building', x: -54, z: 128 },
  { id: 'tsarborcamp', name: 'Стан царборцев', type: 'camp', x: 168, z: 190 },
  { id: 'glassdemesne', name: 'Вотчина чёрных элементалей', type: 'biome', x: 226, z: 72 },
  { id: 'iceshelfpost', name: 'Пост ледяного шельфа', type: 'outpost', x: 190, z: -118 },
  { id: 'deadsavanna', name: 'Край Мёртвой Саванны', type: 'biome', x: 118, z: 96 },
];

export const NPCS = [
  { id: 'rina', name: 'Рина', role: 'customs', faction: 'Port Rachel', x: -54, z: 11, text: 'Порт Рейчел не любит пустых имён. Проверь навес, потом иди к Орану.' },
  { id: 'merchant', name: 'Торговец красной глиной', role: 'market', faction: 'Market', x: -32, z: 35, text: 'Глина помнит сапоги караванов. Купи слух — дойдёшь дальше.' },
  { id: 'oran', name: 'Оран Тив', role: 'registry', faction: 'Fort Zarya', x: 34, z: -11, text: 'Регистрация временная. Но теперь ты не ошибка без номера.' },
  { id: 'gerda', name: 'Герда Гайгерманика', role: 'act1', faction: 'Fort Zarya', x: 48, z: 16, text: 'Собери четыре подготовки: дорога, рынок, фракции, контрабанда.' },
  { id: 'sava', name: 'Сава', role: 'guide', faction: 'Guides', x: 78, z: 62, text: 'Я поведу тебя к саванне, когда Герда скажет, что ты не пропадёшь на первом ветру.' },
  { id: 'smuggler', name: 'Контрабандист', role: 'contraband', faction: 'Red Node', x: 54, z: -28, text: 'Бирка у меня. Цена — не спрашивать, с какого корабля её сняли.' },
  { id: 'tsarborScout', name: 'Разведчик царборцев', role: 'scout', faction: 'Tsarbor', x: 168, z: 184, text: 'Лес царборцев живой. Он не шелестит — он слушает.' },
  { id: 'glassMonk', name: 'Стеклянный монах', role: 'monk', faction: 'Black Elementals', x: 226, z: 76, text: 'Это вотчина чёрных элементалей. Стекло растёт вокруг их теней.' },
  { id: 'iceRanger', name: 'Смотритель шельфа', role: 'ranger', faction: 'Ice Shelf', x: 190, z: -112, text: 'Лёд здесь не холодный. Он просто не признаёт местное солнце.' },
  { id: 'caravan', name: 'Караванщик', role: 'walker', faction: 'Caravan', x: -92, z: 22, text: 'Караван идёт от соли к Форту. Дорога сама говорит, где безопасно.', route: [{x:-92,z:22},{x:-54,z:18},{x:-20,z:18},{x:34,z:26},{x:78,z:58},{x:-92,z:22}] },
];

export const MONSTERS = [
  { id: 'roadBrute', name: 'Рогатый дорожный мутант', archetype: 'brute', biome: 'port', x: -10, z: 18, hp: 60, color: 0xb84634 },
  { id: 'swampLurker', name: 'Болотная тварь', archetype: 'lurker', biome: 'mangrove', x: -50, z: 142, hp: 58, color: 0x4d6a39 },
  { id: 'boneGhoul', name: 'Сухая костяная падаль', archetype: 'ghoul', biome: 'savanna', x: 126, z: 104, hp: 68, color: 0x7f633b },
  { id: 'glassPredator', name: 'Стеклянный хищник', archetype: 'glass', biome: 'glass', x: 236, z: 82, hp: 76, color: 0x67a8a6 },
  { id: 'blackElemental', name: 'Чёрный элементаль стекла', archetype: 'black', biome: 'glass', x: 218, z: 98, hp: 100, color: 0x0a0612 },
  { id: 'iceCarrion', name: 'Ледяной падальщик', archetype: 'ice', biome: 'ice', x: 202, z: -128, hp: 70, color: 0x9fc7d9 },
  { id: 'phaseEcho', name: 'Фазовое эхо', archetype: 'phase', biome: 'fort', x: 82, z: 20, hp: 66, color: 0x8a78ff },
];
