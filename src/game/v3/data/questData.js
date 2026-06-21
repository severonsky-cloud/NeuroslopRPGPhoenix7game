import { TAX_ROUTE_RANGES, TAX_STAGES } from './taxQuestData.js';

export const QUESTS = {
  tax_and_clay: {
    name: 'Налог и глина',
    giver: 'Красная сельская артель',
    where: 'Пост Ришелье',
    stages: {
      [TAX_STAGES.OFFERED]: 'Ты видел, как Дюмон обирает артель КЭК. Можно собрать доказательства, казнить его или вызвать на открытый бой.',
      [TAX_STAGES.ASSASSINATION_SCENE]: 'Ты решился казнить Дюмона на глазах у поста.',
      [TAX_STAGES.ASSASSINATION_ESCAPE]: 'Дюмон мёртв. Местная охрана поднята по тревоге: продержись и уйди дальше чем на 70 метров.',
      [TAX_STAGES.ASSASSINATION_GERDA]: 'Ты скрылся после убийства Дюмона. Найди Герду в Форте Заря.',
      [TAX_STAGES.ASSASSINATION_DONE]: 'Герда закрыла дело о смерти Дюмона. Пост запомнил твоё лицо.',
      [TAX_STAGES.STANDOFF_READY]: 'Ты вызвал Дюмона на открытую ссору. Вернись к разговору, когда готов к бою.',
      [TAX_STAGES.STANDOFF_COMBAT]: 'Старый гарнизон атакует. Продержись до возвращения крестьян.',
      [TAX_STAGES.STANDOFF_DONE]: 'Крестьяне вернулись с подкреплением. Старый гарнизон разбит и заменён.',
      [TAX_STAGES.INVESTIGATING]: 'Добудь доказательство: возьми камеру у Рины или ночью укради ведомость из офиса Дюмона.',
      [TAX_STAGES.EVIDENCE_READY]: 'У тебя есть доказательство поборов. Отнеси его Герде в Форт Заря.',
      [TAX_STAGES.GERDA_REVIEW]: 'Герда приняла улику. Отдохни в Форте до утра перед арестом.',
      [TAX_STAGES.ARREST_MARCH]: 'Следственная группа готова. Проведи трёх солдат Герды к Посту Ришелье.',
      [TAX_STAGES.ARREST_CHOICE]: 'Дюмон окружён. Выбери, как оформить его арест.',
      [TAX_STAGES.ARREST_SCENE]: 'Арест начался. Дюмон вынужден отвечать перед свидетелями.',
      [TAX_STAGES.ARREST_DONE]: 'Дюмон арестован. Ньен Ло и Восс временно управляют Постом Ришелье.',
      [TAX_STAGES.REBELS_CODE]: 'Ньен Ло передала кодовую фразу. Найди связного повстанцев на Красной дороге.',
      [TAX_STAGES.REBELS_CONTACT]: 'Связной узнал код. Подтверди, что готов участвовать в ночной операции.',
      [TAX_STAGES.REBELS_CAMP]: 'Повстанцы ждут у дорожного костра. Дождись ночи и начинай операцию.',
      [TAX_STAGES.REBELS_APPROACH]: 'Два повстанца идут за тобой к Посту Ришелье.',
      [TAX_STAGES.REBELS_INFILTRATION]: 'Проберись к рубильнику за постом и отключи свет, не попав в поле зрения охраны.',
      [TAX_STAGES.REBELS_CLEAN]: 'Свет погас. Повстанцы выводят Дюмона из офиса без открытого боя.',
      [TAX_STAGES.REBELS_COMBAT]: 'Тревога поднята. Прикрой похищение Дюмона и продержись до отхода группы.',
      [TAX_STAGES.REBELS_EXTRACTION]: 'Дюмона уводят с поста. Прикрой последние секунды отхода.',
      [TAX_STAGES.REBELS_DONE]: 'Дюмон исчез. Ньен Ло и Восс временно удерживают пост, но никто не говорит, куда увели лейтенанта.',
    },
  },
};

function reachedStages(quest, stage, route) {
  const stages = Object.keys(quest.stages).map(Number).sort((a, b) => a - b);
  const range = TAX_ROUTE_RANGES[route];
  if (!range) return stages.filter((entry) => entry === 10 && entry <= stage);
  return stages.filter((entry) => entry === 10 || (entry >= range.min && entry <= range.max && entry <= stage));
}

export function questJournalEntries(worldState) {
  return worldState.activeQuests()
    .map(({ id, stage, route, status, outcome }) => {
      const quest = QUESTS[id];
      if (!quest) return null;
      const reached = reachedStages(quest, stage, route);
      const current = reached.at(-1);
      return {
        id,
        name: quest.name,
        done: status === 'complete',
        route,
        outcome,
        log: reached.map((entry) => quest.stages[entry]),
        current: quest.stages[current] || '',
      };
    })
    .filter(Boolean);
}
