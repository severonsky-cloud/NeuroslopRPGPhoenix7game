// Points of interest sit in the gaps between the eight settlements (never on a
// settlement coordinate, the Fort, or the zhuzher patrol perimeter) so the
// corridor Port Rachel -> Fort Zarya rewards stepping off the official tract.
export const POI_DISCOVER_RADIUS = 14;

export const POINTS_OF_INTEREST = Object.freeze([
  {
    id: 'sunken-pier',
    name: 'Утопленный причал',
    type: 'wreck',
    x: -128,
    z: 70,
    lore: 'Полузатопленные сваи старого причала. До имперской дороги Бен-Хао возил рыбу отсюда; теперь доски кормят только воду и слухи.',
  },
  {
    id: 'boundary-stone',
    name: 'Имперский межевой столб',
    type: 'standingStone',
    x: -50,
    z: 100,
    lore: 'Камень с печатью Империи и стёртой красной меткой общины. Две власти спорили здесь молча — зарубками на граните.',
  },
  {
    id: 'phase-chapel',
    name: 'Фазовая часовня',
    type: 'shrine',
    x: -10,
    z: 134,
    lore: 'Маленькое святилище фазовых наблюдателей. Воздух у камня дрожит и показывает дорогу, которой нет.',
  },
  {
    id: 'carter-graves',
    name: 'Могилы возчиков',
    type: 'graves',
    x: 35,
    z: 168,
    lore: 'Несколько безымянных холмиков у обочины. Возчики, не дошедшие до Тау-Вероны: колёса нашли, людей — нет.',
  },
  {
    id: 'mutant-bones',
    name: 'Кости дорожного мутанта',
    type: 'bones',
    x: 88,
    z: 110,
    lore: 'Огромный скелет у короткого пути. Старый дорожный мутант всё ещё пугает караваны — даже мёртвым.',
  },
  {
    id: 'fallen-relay',
    name: 'Поваленная вышка связи',
    type: 'ruin',
    x: 85,
    z: 90,
    lore: 'Опрокинутая мачта старой имперской связи. Кабельщики Тесла-6 сюда не ходят: говорят, она ещё слушает.',
  },
  {
    id: 'tsarbor-altar',
    name: 'Алтарь у тракта',
    type: 'shrine',
    x: 122,
    z: 162,
    lore: 'Царборский саженец в имперском кольце. Кто-то посадил жизнь там, где дорога становится военной зоной.',
  },
]);
