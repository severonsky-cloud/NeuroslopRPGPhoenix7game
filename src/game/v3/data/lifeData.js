export const FACTIONS = {
  empire: { name: 'Имперская армия', color: 0xc0b090, attitude: 'law' },
  rebels: { name: 'Повстанцы-крестьяне', color: 0xb44d33, attitude: 'resistance' },
  peasants: { name: 'Крестьяне', color: 0xb08058, attitude: 'civilian' },
  redPeasants: { name: 'Красные общины', color: 0xb64a32, attitude: 'taxed_autonomy' },
  knights: { name: 'Бродячие рыцари', color: 0xaaa39a, attitude: 'wandering' },
  errorOrder: { name: 'Орден Системных Ошибок', color: 0x8a78ff, attitude: 'strange' },
  soundOrder: { name: 'Орден Звука', color: 0xd8b56e, attitude: 'mystic' },
  bandits: { name: 'Бандиты', color: 0x4a2a1a, attitude: 'hostile' },
  zhuzher: { name: 'Жужжер', color: 0x6b6f35, attitude: 'raiders' },
  tsarbor: { name: 'Царборцы', color: 0x2d6b3b, attitude: 'growers' },
  blueElementals: { name: 'Синие элементали', color: 0x4d78b8, attitude: 'trade' },
  blackElementals: { name: 'Чёрные элементали', color: 0x0a0612, attitude: 'monastic' },
  phaseGuild: { name: 'Гильдия Фазовых Магов', color: 0x8a78ff, attitude: 'training' },
  travelers: { name: 'Гильдия путешественников', color: 0xc9a66c, attitude: 'mapping' },
};

export const GOODS = {
  redClay: { name: 'красная глина', value: 3 },
  ashGlass: { name: 'пепельное стекло', value: 7 },
  salt: { name: 'соль', value: 4 },
  driedMoss: { name: 'сухой мох', value: 5 },
  phaseReeds: { name: 'фазовый тростник', value: 9 },
  tools: { name: 'инструменты', value: 12 },
  shrineWax: { name: 'монастырский воск', value: 6 },
  mapNotes: { name: 'свежие метки карты', value: 10 },
};

export const SETTLEMENT_ECONOMY = {
  red_clay_village: {
    name: 'Красная глиняная община',
    productionBonus: 1,
    stock: { redClay: 12, ashGlass: 2, driedMoss: 3 },
    wanted: { tools: 1 },
  },
  port_rachel: {
    name: 'Порт Рейчел',
    productionBonus: 1,
    stock: { salt: 8, tools: 4 },
    wanted: { redClay: 1, ashGlass: 1 },
  },
  fort_zarya: {
    name: 'Форт Заря',
    productionBonus: 1,
    stock: { tools: 6, salt: 4 },
    wanted: { redClay: 1, phaseReeds: 1 },
  },
  dawn_monastery: {
    name: 'Малый монастырь у тракта',
    productionBonus: 1,
    stock: { shrineWax: 5 },
    wanted: { redClay: 1, driedMoss: 1 },
  },
};

export const LIFE_AGENTS = [
  {
    id: 'imperial_patrol_port', name: 'Имперский патруль Порта', faction: 'empire', role: 'patrol', routeType: 'patrol', x: -92, z: 22,
    text: 'Порт под имперским наблюдением. Не мешай досмотру грузов.',
    route: [{x:-110,z:22},{x:-88,z:18},{x:-62,z:40},{x:-78,z:58},{x:-110,z:22}],
  },
  {
    id: 'imperial_patrol_road', name: 'Дальний имперский патруль', faction: 'empire', role: 'patrol', routeType: 'patrol', x: 18, z: 72,
    text: 'До Форта Заря далеко. Мы держим Красную дорогу, пока она держит нас.',
    route: [{x:-20,z:66},{x:24,z:84},{x:70,z:120},{x:118,z:158},{x:24,z:84}],
  },
  {
    id: 'imperial_patrol_richelieu', name: 'Патруль Поста Ришилье', faction: 'empire', role: 'patrol', routeType: 'patrol', x: 74, z: 126,
    text: 'Пост Ришилье мал, но дорога через него кормит Форт Заря.',
    route: [{x:58,z:112},{x:78,z:132},{x:102,z:148},{x:86,z:118},{x:58,z:112}],
  },
  {
    id: 'fort_watch', name: 'Караульный Форта Заря', faction: 'empire', role: 'guard', routeType: 'patrol', x: 118, z: 154,
    text: 'Форт далеко от порта специально. Сюда доходят только нужные люди и плохие новости.',
    route: [{x:112,z:154},{x:144,z:170},{x:154,z:202},{x:122,z:190},{x:112,z:154}],
  },
  {
    id: 'salt_caravan', name: 'Соляной караван', faction: 'travelers', role: 'caravan', routeType: 'trade', x: -118, z: 42,
    text: 'Мы идём от соляных доков к Форту Заря. Это не прогулка, это полдня пути и три молитвы.',
    originId: 'port_rachel', destinationId: 'fort_zarya', cargo: { salt: 9, tools: 1 }, credits: 6,
    route: [{x:-118,z:42,stop:'home'},{x:-62,z:40},{x:-20,z:66},{x:54,z:112},{x:118,z:158,stop:'market'},{x:152,z:186},{x:-118,z:42,stop:'home'}],
  },
  {
    id: 'red_clay_caravan', name: 'Караван Красной общины', faction: 'redPeasants', role: 'caravan', routeType: 'trade', x: -76, z: 60,
    text: 'Везём глину и пепельное стекло. Если дорога нас съест, деревня опять останется без инструментов.',
    originId: 'red_clay_village', destinationId: 'fort_zarya', cargo: { redClay: 10, ashGlass: 2, driedMoss: 2 }, credits: 2,
    route: [{x:-76,z:60,stop:'home'},{x:-42,z:66},{x:-8,z:76},{x:40,z:98},{x:92,z:138},{x:136,z:174,stop:'market'},{x:70,z:120},{x:-8,z:76},{x:-76,z:60,stop:'home'}],
  },
  {
    id: 'monastery_supply_cart', name: 'Монастырская подвода красных', faction: 'redPeasants', role: 'caravan', routeType: 'trade', x: -64, z: 72,
    text: 'Монастырь берёт глину, воск и сухой мох. Платит мало, зато честно и без имперских печатей.',
    originId: 'red_clay_village', destinationId: 'dawn_monastery', cargo: { redClay: 6, driedMoss: 5 }, credits: 1,
    route: [{x:-64,z:72,stop:'home'},{x:-20,z:66},{x:18,z:92},{x:52,z:118,stop:'market'},{x:18,z:92},{x:-64,z:72,stop:'home'}],
  },
  {
    id: 'blue_caravan', name: 'Синий караван фазовых сосудов', faction: 'blueElementals', role: 'caravan', routeType: 'trade', x: 238, z: 132,
    text: 'Мы снаряжаем сосуды и соль. Синие караваны не спешат, но всегда доходят.',
    originId: 'port_rachel', destinationId: 'dawn_monastery', cargo: { phaseReeds: 3, salt: 4 }, credits: 8,
    route: [{x:238,z:132,stop:'home'},{x:288,z:112},{x:250,z:250,stop:'market'},{x:238,z:132,stop:'home'}],
  },
  {
    id: 'black_caravan', name: 'Чёрный караван в Мёртвую Саванну', faction: 'blackElementals', role: 'caravan', routeType: 'trade', x: 288, z: 112,
    text: 'Мы везём стекло туда, где земля перестала быть землёй.',
    originId: 'fort_zarya', destinationId: 'dawn_monastery', cargo: { ashGlass: 5, shrineWax: 2 }, credits: 10,
    route: [{x:288,z:112,stop:'home'},{x:250,z:250,stop:'market'},{x:220,z:262},{x:288,z:112,stop:'home'}],
  },
  {
    id: 'rebel_cell', name: 'Крестьянский повстанец', faction: 'rebels', role: 'rebel', routeType: 'patrol', x: -8, z: 76,
    text: 'Империя берёт налоги с глины, с воды и с дыхания. Мы это запомним.',
    route: [{x:-8,z:76},{x:18,z:92},{x:-22,z:54},{x:-8,z:76}],
  },
  {
    id: 'peasant_farmer', name: 'Крестьянин у глиняной ямы', faction: 'peasants', role: 'worker', routeType: 'work', settlementId: 'red_clay_village', x: -76, z: 60,
    text: 'Я сушу красную глину. Днём работа, ночью страх, утром опять работа.',
    route: [{x:-76,z:60},{x:-84,z:68},{x:-66,z:72},{x:-76,z:60}],
  },
  {
    id: 'wandering_knight', name: 'Бродячий рыцарь', faction: 'knights', role: 'knight', routeType: 'wander', x: 28, z: 102,
    text: 'Я иду туда, где у дороги появляется совесть. Обычно это перед засадой.',
    skillLevel: 2, gearTier: 1,
    route: [{x:28,z:102},{x:82,z:132},{x:142,z:176},{x:90,z:92},{x:28,z:102}],
  },
  {
    id: 'hired_road_knight', name: 'Наёмный рыцарь Красной дороги', faction: 'knights', role: 'knight', routeType: 'contract', x: 64, z: 114,
    text: 'Сегодня меня наняли не умирать рядом с чужой телегой. Завтра, возможно, наниматель сменится.',
    skillLevel: 1, gearTier: 1, contractFaction: 'redPeasants',
    route: [{x:64,z:114},{x:96,z:142},{x:128,z:170},{x:72,z:124},{x:64,z:114}],
  },
  {
    id: 'error_knight', name: 'Рыцарь Ордена Системных Ошибок', faction: 'errorOrder', role: 'orderKnight', routeType: 'warpath', x: 118, z: 160,
    text: 'Ошибка — это не сбой. Это дверь, которую мир не хотел показывать.',
    skillLevel: 3, gearTier: 2,
    route: [{x:118,z:160},{x:152,z:186},{x:170,z:212},{x:118,z:160}],
  },
  {
    id: 'sound_knight', name: 'Рыцарь Ордена Звука', faction: 'soundOrder', role: 'orderKnight', routeType: 'warpath', x: 96, z: 140,
    text: 'Слушай дорогу. Она фальшивит перед нападением.',
    skillLevel: 3, gearTier: 2,
    route: [{x:96,z:140},{x:130,z:170},{x:110,z:210},{x:96,z:140}],
  },
  {
    id: 'bandit_scout', name: 'Бандитский дозорный', faction: 'bandits', role: 'bandit', routeType: 'ambush', x: 40, z: -18,
    text: 'Не все, кто уходит с дороги, теряются. Некоторые просто ждут караван.',
    route: [{x:40,z:-18},{x:54,z:-34},{x:12,z:-8},{x:40,z:-18}],
  },
  {
    id: 'bandit_redroad_cutters', name: 'Банда Красной дороги', faction: 'bandits', role: 'bandit', routeType: 'ambush', x: 52, z: 104,
    text: 'Дорога берёт пошлину. Мы просто помогаем ей говорить.',
    route: [{x:52,z:104},{x:70,z:120},{x:34,z:92},{x:52,z:104}],
  },
  {
    id: 'zhuzher_raid_patrol', name: 'Патруль Жужжер', faction: 'zhuzher', role: 'raidPatrol', routeType: 'raid', x: 220, z: 226,
    text: 'Жужжерский патруль идёт к Форту Заря. Они ещё не напали, но уже считают добычу.',
    route: [{x:220,z:226},{x:180,z:205},{x:142,z:176},{x:220,z:226}],
    hostileTo: ['empire', 'redPeasants'], event: 'fort_raid_pressure'
  },
  {
    id: 'zhuzher_forward_raiders', name: 'Передовой налёт Жужжер', faction: 'zhuzher', role: 'raidPatrol', routeType: 'raid', x: 154, z: 178,
    text: 'Они нюхают дорогу к Форту Заря и ждут слабый караван.',
    route: [{x:154,z:178},{x:118,z:158},{x:92,z:138},{x:154,z:178}],
    hostileTo: ['empire', 'redPeasants', 'travelers'], event: 'fort_raid_pressure'
  },
  {
    id: 'tsarbor_planter', name: 'Царборец-садовник', faction: 'tsarbor', role: 'planter', routeType: 'work', x: 174, z: 248,
    text: 'Мы высаживаем деревья на границе с Мёртвой Саванной. Каждое дерево — это гвоздь в крышку чумы.',
    route: [{x:174,z:248},{x:190,z:270},{x:154,z:278},{x:174,z:248}], event: 'plant_tree'
  },
  {
    id: 'phase_guild_mage', name: 'Ученик Гильдии Фазовых Магов', faction: 'phaseGuild', role: 'trainer', routeType: 'support', x: 62, z: 112,
    text: 'Фаза — это не магия. Это привычка мира быть в двух местах и врать об этом.',
    route: [{x:62,z:112},{x:82,z:132},{x:118,z:158},{x:-76,z:60,stop:'help_production'},{x:62,z:112}], event: 'phase_training'
  },
  {
    id: 'traveler_cartographer', name: 'Путешественник-картограф', faction: 'travelers', role: 'cartographer', routeType: 'mapping', x: -20, z: 66,
    text: 'Я наношу на карту места, где люди обычно умирают без карты.',
    route: [{x:-20,z:66},{x:24,z:84},{x:82,z:132},{x:142,z:176},{x:226,z:112},{x:-20,z:66}], event: 'mapping',
    sellsMapMarkers: true,
  }
];
