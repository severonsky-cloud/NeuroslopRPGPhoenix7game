export const PORT_FORT_SETTLEMENT_ROAD = Object.freeze([
  { x: -88, z: 22 },
  { x: -112, z: 56 },
  { x: -70, z: 80 },
  { x: -35, z: 120 },
  { x: 12, z: 156 },
  { x: 60, z: 182 },
  { x: 98, z: 146 },
  { x: 118, z: 78 },
  { x: 130, z: 146 },
  { x: 142, z: 176 },
]);

export const SETTLEMENTS = Object.freeze([
  {
    id: 'ben-hao',
    name: 'Бен-Хао',
    type: 'fishingVillage',
    faction: 'redPeasants',
    x: -112,
    z: 56,
    description: 'Красно-элементальская рыбацкая община у влажной низины. Старосты платят Империи водный и дорожный налог, но сохраняют свои сети, речь и береговые обряды.',
    riskLevel: 1,
    services: ['вода', 'рыба', 'слухи'],
    npcRoles: ['старшая рыбачка', 'лодочник', 'рыбак'],
    props: ['stiltHouses', 'nets', 'boat', 'waterBarrels', 'fishRacks'],
    mapLabel: 'БЕН-ХАО · РЫБАЦКАЯ ОБЩИНА',
  },
  {
    id: 'richelieu-post',
    name: 'Пост Ришелье',
    type: 'imperialTollPost',
    faction: 'empire',
    x: -70,
    z: 80,
    description: 'Имперская дорожная застава, собирающая пошлины с глины, воды и караванных колёс. По разные стороны шлагбаума постоянно стоят солдаты и недовольные общинники.',
    riskLevel: 3,
    services: ['маршрут', 'разрешения', 'охраняемый привал'],
    npcRoles: ['лейтенант', 'переводчица', 'капрал'],
    props: ['watchTower', 'barrier', 'confiscatedCart', 'crates', 'warningSigns'],
    mapLabel: 'ПОСТ РИШЕЛЬЕ · ИМПЕРСКАЯ ПОШЛИНА',
  },
  {
    id: 'lang-do',
    name: 'Артель Ланг-До',
    type: 'clayWorkersCamp',
    faction: 'redPeasants',
    x: -35,
    z: 120,
    description: 'Сезонная артель красной глины. Здесь сушат кирпич, чинят леса и прячут часть добычи от имперских счётчиков.',
    riskLevel: 2,
    services: ['вода', 'навес', 'ремонт инструментов'],
    npcRoles: ['бригадир', 'сушильщик глины', 'рабочий'],
    props: ['scaffolds', 'clayRacks', 'tents', 'toolTables', 'barrels'],
    mapLabel: 'ЛАНГ-ДО · ГЛИНЯНАЯ АРТЕЛЬ',
  },
  {
    id: 'tau-verona',
    name: 'Тау-Верона',
    type: 'caravanserai',
    faction: 'travelers',
    x: 12,
    z: 156,
    description: 'Смешанный караван-сарай, где земные фамилии становятся элементальскими прозвищами. Синие и Чёрные торговцы спорят о фазовых сосудах рядом с красными возчиками.',
    riskLevel: 2,
    services: ['торговля', 'ночлег', 'караванные слухи'],
    npcRoles: ['синий торговец', 'чёрный оценщик', 'караванный охранник'],
    props: ['awnings', 'traderTables', 'warehouse', 'parkedCarts', 'campfire'],
    mapLabel: 'ТАУ-ВЕРОНА · КАРАВАН-САРАЙ',
  },
  {
    id: 'nam-hoa',
    name: 'Нам-Хоа',
    type: 'farmingSettlement',
    faction: 'redPeasants',
    x: 60,
    z: 182,
    description: 'Земледельческая община с привычными домами и чужой агрокультурой: красные водные тростники, жаровые клубни и соляные грядки.',
    riskLevel: 2,
    services: ['пища', 'вода', 'местные проводники'],
    npcRoles: ['староста', 'агроном', 'полевой рабочий'],
    props: ['farmHouses', 'reedFields', 'heatTubers', 'irrigationPosts', 'fences'],
    mapLabel: 'НАМ-ХОА · КРАСНЫЕ ПОЛЯ',
  },
  {
    id: 'tesla-6',
    name: 'Реле «Тесла-6»',
    type: 'abandonedRelay',
    faction: 'travelers',
    x: 98,
    z: 146,
    description: 'Разрушенная имперская станция связи. Сборщики кабеля держат у мачты холодный лагерь и продают сведения о безопасных проходах через руины.',
    riskLevel: 3,
    services: ['укрытие', 'сведения о руинах'],
    npcRoles: ['смотрительница реле', 'кабельщик', 'сборщик металла'],
    props: ['brokenMast', 'coldCamp', 'rustPanels', 'oldCables', 'scrapPiles'],
    mapLabel: 'РЕЛЕ ТЕСЛА-6 · ЗАБРОШЕННАЯ СВЯЗЬ',
  },
  {
    id: 'chi-cassini',
    name: 'Чи-Кассини',
    type: 'phaseObservationCamp',
    faction: 'phaseGuild',
    x: 118,
    z: 78,
    description: 'Лагерь наблюдателей в точке, где официальный тракт делает странную петлю. Фазовые измерения здесь надёжнее компаса, но хуже действуют на нервы.',
    riskLevel: 3,
    services: ['фазовый прогноз', 'знания', 'охраняемый отдых'],
    npcRoles: ['фазовый наблюдатель', 'синий вычислитель', 'местная проводница'],
    props: ['measuringPoles', 'clothMarkers', 'phaseRings', 'researchTent', 'instrumentTables'],
    mapLabel: 'ЧИ-КАССИНИ · ФАЗОВЫЙ ЛАГЕРЬ',
  },
  {
    id: 'arcole-bivouac',
    name: 'Бивак Арколь',
    type: 'forwardMilitaryCamp',
    faction: 'empire',
    x: 130,
    z: 146,
    description: 'Последний имперский привал перед Вратами Форта Заря. Здесь дорога превращается в военный коридор, а слухи о жужжерских дозорах становятся конкретными.',
    riskLevel: 4,
    services: ['вода', 'военные слухи', 'обслуживание оружия'],
    npcRoles: ['капитан снабжения', 'полевой механик', 'часовой'],
    props: ['militaryTents', 'roadFlags', 'ammoCrates', 'firingPositions', 'waterBarrels'],
    mapLabel: 'БИВАК АРКОЛЬ · ПЕРЕДОВОЙ ПРИВАЛ',
  },
]);

const localLoop = (x, z, dx = 5, dz = 4) => [
  { x, z },
  { x: x + dx, z: z + dz },
  { x: x - dx * 0.7, z: z + dz * 0.8 },
  { x, z },
];

function dialogue(base, race = {}, background = {}, gender = {}) {
  return { base, race, background, gender };
}

const redPeasantRaceLines = {
  red: 'Своя кровь приехала вместе с чужой властью. Мы торгуем с тобой, но не проси благодарности Императрице.',
  human: 'Имперский человек всегда спрашивает дорогу после того, как уже поставил на ней сборщика.',
  deimur: 'Деймурийцев здесь видят редко. Ты смотришь на наш огонь так, будто помнишь другой.',
  blue: 'Синие умеют платить и умеют слушать. Для дороги это почти добродетель.',
  black: 'Чёрным не лгут о фазе и мёртвых. Про остальное можно договориться.',
  reptiloid: 'Если твои когти держат инструмент лучше печати — место у огня найдётся.',
  juniorReptiloid: 'Мал ростом, быстрым шагом. Не наступи на сушащуюся глину.',
  tsarbor: 'Царборцы сами выбрали, кому кланяться. Мы это уважаем.',
  zhuzher: 'Мы слышали жужжание у дальнего тракта. Если ты пришёл говорить — говори медленно.',
};

const commonBackgroundLines = {
  lunar: 'Лунная тюрьма оставляет взгляд, который узнают даже на красной земле.',
  archive: 'Архивные беглецы знают цену каждой печати и каждой пропавшей страницы.',
  caravan: 'Ребёнку каравана не нужно объяснять, почему дорога важнее обещания.',
  duelist: 'Дуэлянту здесь рады, пока клинок остаётся в ножнах.',
};

export const SETTLEMENT_AGENTS = Object.freeze([
  {
    id: 'lien-tho', name: 'Лиен Тхо', faction: 'redPeasants', role: 'fisherElder', settlementId: 'ben-hao', x: -114, z: 56,
    text: 'Сети стоят дольше империй, если их вовремя сушить.',
    dialogue: dialogue('Вода у нас общая, рыба — по договору, а слухи дорожают к вечеру.', redPeasantRaceLines, commonBackgroundLines, {
      redMale: 'Красному мужчине далеко от родной планеты требуется редкое разрешение. Покажи его не мне — покажи тем, кто тебя отпустил.',
    }),
    route: localLoop(-114, 56, 3, 2),
  },
  {
    id: 'bao-ngi', name: 'Бао Нги', faction: 'redPeasants', role: 'boatman', settlementId: 'ben-hao', x: -109, z: 59,
    text: 'Лодка знает берег лучше любого имперского плана.',
    dialogue: dialogue('До Форта по официальной дороге далеко. Напрямик короче, но там земля не обещала быть дорогой.', redPeasantRaceLines, commonBackgroundLines),
    route: localLoop(-109, 59, 4, -2),
  },
  {
    id: 'ben-hao-fisher', name: 'Рыбак Бен-Хао', faction: 'redPeasants', role: 'fisher', settlementId: 'ben-hao', x: -116, z: 61,
    text: 'Рыбак развешивает тёмные сети над красной водой.',
    route: localLoop(-116, 61, 2, 3),
  },
  {
    id: 'marcel-dumont', name: 'Лейтенант Марсель Дюмон', faction: 'empire', role: 'guard', settlementId: 'richelieu-post', x: -69, z: 77,
    text: 'Пошлина поддерживает дорогу, даже если дорога с этим не согласна.',
    dialogue: dialogue('Пост Ришелье проверяет документы и груз. Проход свободный после осмотра — в пределах разумного.', {
      red: 'Приказ Императрицы Красных признал нашу юрисдикцию. Ваше недовольство не отменяет печать.',
      human: 'Гражданин Империи обязан показывать пример дорожной дисциплины.',
      zhuzher: 'Оружие на землю. Медленно.',
    }, commonBackgroundLines),
    route: localLoop(-69, 77, 4, 2),
  },
  {
    id: 'nyen-lo', name: 'Переводчица Ньен Ло', faction: 'redPeasants', role: 'interpreter', settlementId: 'richelieu-post', x: -73, z: 82,
    text: 'Она переводит не слова, а степень допустимого унижения.',
    dialogue: dialogue('Я объясняю солдатам, почему нельзя облагать налогом дождь. Пока они считают его водой.', redPeasantRaceLines, commonBackgroundLines),
    route: localLoop(-73, 82, 2, 2),
  },
  {
    id: 'corporal-voss', name: 'Капрал Восс', faction: 'empire', role: 'patrol', settlementId: 'richelieu-post', x: -65, z: 82,
    text: 'Капрал следит за шлагбаумом и руками путников.',
    route: localLoop(-65, 82, 4, -3),
  },
  {
    id: 'mei-hoan', name: 'Мэй Хоан', faction: 'redPeasants', role: 'workerBoss', settlementId: 'lang-do', x: -37, z: 120,
    text: 'Бригадир артели знает, сколько глины исчезает до имперской описи.',
    dialogue: dialogue('Мы сушим кирпич для чужих стен и строим свои дома из того, что не попало в ведомость.', redPeasantRaceLines, commonBackgroundLines),
    route: localLoop(-37, 120, 4, 3),
  },
  {
    id: 'thanh-lou', name: 'Тхань Лоу', faction: 'redPeasants', role: 'clayDryer', settlementId: 'lang-do', x: -31, z: 124,
    text: 'Тхань проверяет глину ладонью, не приборами.',
    dialogue: dialogue('Под навесом можно переждать жар. Инструмент починим, если металл не имперский секрет.', redPeasantRaceLines, commonBackgroundLines),
    route: localLoop(-31, 124, 3, -3),
  },
  {
    id: 'lang-do-worker', name: 'Рабочий Ланг-До', faction: 'redPeasants', role: 'worker', settlementId: 'lang-do', x: -40, z: 126,
    text: 'Рабочий переносит сырые блоки между сушильными рамами.',
    route: localLoop(-40, 126, 5, 2),
  },
  {
    id: 'vea-marco', name: 'Веа-Марко', faction: 'blueElementals', role: 'trader', settlementId: 'tau-verona', x: 9, z: 157,
    text: 'Синий торговец собирает земные имена, как другие собирают монеты.',
    dialogue: dialogue('Тау-Верона принимает любую речь, если в ней есть цена и направление.', {
      blue: 'Своим сосудам я доверяю больше, чем собственным родичам. Это комплимент.',
      black: 'Чёрные всегда торгуются молча. От этого цифры звучат честнее.',
      red: 'Красная глина снова в цене. Политика — нет.',
    }, commonBackgroundLines),
    route: localLoop(9, 157, 4, 3),
  },
  {
    id: 'kwan-solomon', name: 'Кван-Соломон', faction: 'blackElementals', role: 'appraiser', settlementId: 'tau-verona', x: 15, z: 154,
    text: 'Чёрный оценщик различает трещины в стекле и обещаниях.',
    dialogue: dialogue('Ночлег безопасен настолько, насколько безопасны соседи по навесу.', {
      black: 'Твою тень здесь не станут взвешивать.',
      blue: 'Синий свет делает дефекты заметнее. Останься у стола.',
      red: 'Ваша Императрица открыла дорогу Империи. Торговля благодарна; люди — не всегда.',
    }, commonBackgroundLines),
    route: localLoop(15, 154, 3, -3),
  },
  {
    id: 'tau-verona-guard', name: 'Охранник Тау-Вероны', faction: 'travelers', role: 'caravan', settlementId: 'tau-verona', x: 17, z: 161,
    text: 'Охранник считает повозки, выходы и чужие кобуры.',
    route: localLoop(17, 161, 5, 2),
  },
  {
    id: 'hanh-tu', name: 'Хань Ту', faction: 'redPeasants', role: 'farmerElder', settlementId: 'nam-hoa', x: 58, z: 180,
    text: 'Староста Нам-Хоа помнит поля до прихода имперских мерных шестов.',
    dialogue: dialogue('Жаровые клубни не любят сапог и печатей. Мы тоже.', redPeasantRaceLines, commonBackgroundLines),
    route: localLoop(58, 180, 4, 3),
  },
  {
    id: 'minh-lao', name: 'Минь Лао', faction: 'redPeasants', role: 'agronomist', settlementId: 'nam-hoa', x: 64, z: 184,
    text: 'Минь выращивает красный тростник в солоноватых каналах.',
    dialogue: dialogue('Пища и вода есть. Проводник тоже найдётся, если ты не спрашиваешь дорогу к чужому амбару.', redPeasantRaceLines, commonBackgroundLines),
    route: localLoop(64, 184, 3, -3),
  },
  {
    id: 'nam-hoa-worker', name: 'Полевой рабочий Нам-Хоа', faction: 'redPeasants', role: 'farmer', settlementId: 'nam-hoa', x: 55, z: 187,
    text: 'Рабочий проверяет канавы между тростником и жаровыми клубнями.',
    route: localLoop(55, 187, 5, 2),
  },
  {
    id: 'inessa-volt', name: 'Инесса Вольт', faction: 'travelers', role: 'relayKeeper', settlementId: 'tesla-6', x: 96, z: 145,
    text: 'Смотрительница слушает мёртвое реле, будто оно может ответить.',
    dialogue: dialogue('Тесла-6 молчит официально. Неофициально кабели иногда называют координаты, которых нет на карте.', {}, commonBackgroundLines),
    route: localLoop(96, 145, 4, 3),
  },
  {
    id: 'chau-vinh', name: 'Чау Винь', faction: 'redPeasants', role: 'cableWorker', settlementId: 'tesla-6', x: 102, z: 149,
    text: 'Чау снимает медь, не касаясь старых фазовых контактов.',
    dialogue: dialogue('Укрытие холодное, зато мачта принимает удар раньше палатки.', redPeasantRaceLines, commonBackgroundLines),
    route: localLoop(102, 149, 3, -3),
  },
  {
    id: 'tesla-scrapper', name: 'Сборщик кабеля', faction: 'travelers', role: 'worker', settlementId: 'tesla-6', x: 94, z: 151,
    text: 'Сборщик укладывает ржавые панели в сортированные груды.',
    route: localLoop(94, 151, 5, 2),
  },
  {
    id: 'chi-galileo', name: 'Чи-Галилей', faction: 'phaseGuild', role: 'trainer', settlementId: 'chi-cassini', x: 116, z: 78,
    text: 'Наблюдатель сверяет дрожание воздуха с земным звёздным каталогом.',
    dialogue: dialogue('Фаза здесь складывает дальний путь в короткую тень. Не пытайся идти за тенью.', {
      deimur: 'Деймурийская чувствительность полезна. Скажи, если услышишь второй горизонт.',
      black: 'Чёрная фаза спокойнее приборов. Постой рядом с кольцом.',
      red: 'Твой внутренний жар искажает нижнюю шкалу. Это не вина, только поправка.',
    }, commonBackgroundLines),
    route: localLoop(116, 78, 3, 3),
  },
  {
    id: 'kwan-pascal', name: 'Кван-Паскаль', faction: 'blueElementals', role: 'phaseCalculator', settlementId: 'chi-cassini', x: 121, z: 82,
    text: 'Синий вычислитель переводит фазовую погоду в таблицы.',
    dialogue: dialogue('Прогноз: тракт существует. Вероятность, что он существует именно под ногами, — восемьдесят семь процентов.', {}, commonBackgroundLines),
    route: localLoop(121, 82, 4, -3),
  },
  {
    id: 'xuan-le', name: 'Суан Ле', faction: 'redPeasants', role: 'guide', settlementId: 'chi-cassini', x: 113, z: 84,
    text: 'Проводница переставляет тканевые маркеры после каждого фазового ветра.',
    route: localLoop(113, 84, 5, 2),
  },
  {
    id: 'adrian-morrow', name: 'Адриан Морро', faction: 'empire', role: 'guard', settlementId: 'arcole-bivouac', x: 128, z: 144,
    text: 'Капитан снабжения охраняет привал, где пока нет настоящей системы снабжения.',
    dialogue: dialogue('Арколь — последний спокойный чай перед Фортом. Дальше всё считается военной зоной.', {
      human: 'Имперскому гражданину здесь найдётся место у карты.',
      red: 'Проход разрешён договором с вашей Императрицей. Не заставляй меня цитировать приложение.',
      zhuzher: 'Ещё шаг — и разговор станет баллистическим.',
    }, commonBackgroundLines),
    route: localLoop(128, 144, 4, 3),
  },
  {
    id: 'nina-bagration', name: 'Нина Багратион', faction: 'empire', role: 'mechanic', settlementId: 'arcole-bivouac', x: 134, z: 149,
    text: 'Полевой механик знает оружие по звуку затвора и характеру владельца.',
    dialogue: dialogue('Почистить оружие можем только в разговоре — мастерская ещё не получила отдельную механику.', {}, commonBackgroundLines),
    route: localLoop(134, 149, 3, -3),
  },
  {
    id: 'arcole-sentry', name: 'Часовой Арколя', faction: 'empire', role: 'patrol', settlementId: 'arcole-bivouac', x: 126, z: 151,
    text: 'Часовой смотрит не на Форт, а назад по дороге.',
    route: localLoop(126, 151, 5, 2),
  },
]);

export const SETTLEMENT_CARAVANS = Object.freeze([
  {
    id: 'salt_caravan',
    route: PORT_FORT_SETTLEMENT_ROAD.map(({ x, z }) => ({ x, z })),
  },
  {
    id: 'red_rural_caravan',
    name: 'Красная сельская артель',
    faction: 'redPeasants',
    role: 'caravan',
    x: -112,
    z: 56,
    text: 'Артель возит рыбу, жаровые клубни и красную глину между местными общинами.',
    route: [
      { x: -112, z: 56 },
      { x: -35, z: 120 },
      { x: 60, z: 182 },
      { x: 12, z: 156 },
      { x: -112, z: 56 },
    ],
    speed: 0.68,
  },
]);

export const SETTLEMENT_ROADSIDE_SCENES = Object.freeze([
  { id: 'confiscated-cart', type: 'brokenCart', x: -76, z: 88, heading: 0.6 },
  { id: 'cold-camp', type: 'coldCamp', x: 89, z: 157, heading: -0.4 },
  { id: 'old-cables', type: 'cables', x: 105, z: 129, heading: 0.2 },
  { id: 'rusty-spaceport', type: 'rustScrap', x: 110, z: 102, heading: 1.1 },
  { id: 'road-flags-west', type: 'flags', x: -52, z: 103, heading: 0.4 },
  { id: 'road-flags-east', type: 'flags', x: 124, z: 123, heading: -0.2 },
]);

export const ZHUZHER_ROAD_PATROL = Object.freeze([
  {
    id: 'zhuzher_road_listener',
    name: 'Жужжерский слушатель дороги',
    archetype: 'brute',
    faction: 'zhuzher',
    x: 111,
    z: 116,
    hp: 72,
    color: 0x6b6f35,
    conditionalHostile: true,
    perimeterCenter: { x: 112, z: 112 },
  },
  {
    id: 'zhuzher_road_gunner',
    name: 'Жужжерский дальний дозорный',
    archetype: 'brute',
    faction: 'zhuzher',
    x: 116,
    z: 108,
    hp: 76,
    color: 0x777a42,
    conditionalHostile: true,
    perimeterCenter: { x: 112, z: 112 },
  },
]);

export function settlementRoadLength(points = PORT_FORT_SETTLEMENT_ROAD) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += Math.hypot(points[index].x - points[index - 1].x, points[index].z - points[index - 1].z);
  }
  return length;
}

export function normalizePlayerCulture(player = {}) {
  const rawRace = String(player.race || player.species || player.bodyRace || 'unknown').trim().toLowerCase().replace(/[\s_-]+/g, '');
  const raceAliases = {
    humans: 'human',
    empire: 'human',
    imperial: 'human',
    redelemental: 'red',
    blueelemental: 'blue',
    blackelemental: 'black',
    deimurian: 'deimur',
    juniorreptiloid: 'juniorReptiloid',
    minorreptiloid: 'juniorReptiloid',
    tsarborian: 'tsarbor',
  };
  const race = raceAliases[rawRace] || rawRace || 'unknown';
  const background = String(player.background || player.bg || player.origin || 'unknown').trim().toLowerCase();
  const gender = String(player.gender || player.sex || 'unknown').trim().toLowerCase();
  return { race, background, gender };
}

export function resolveSettlementDialogue(agent, player = {}) {
  const data = agent?.dialogue;
  if (!data) return agent?.text || '';
  const culture = normalizePlayerCulture(player);
  const lines = [data.base || agent.text || ''];
  const raceLine = data.race?.[culture.race];
  const backgroundLine = data.background?.[culture.background];
  const redMale = culture.race === 'red' && ['male', 'man', 'мужчина', 'мужской'].includes(culture.gender);
  const genderLine = redMale ? data.gender?.redMale : null;
  if (raceLine) lines.push(raceLine);
  if (backgroundLine) lines.push(backgroundLine);
  if (genderLine) lines.push(genderLine);
  return lines.filter(Boolean).join(' ');
}
