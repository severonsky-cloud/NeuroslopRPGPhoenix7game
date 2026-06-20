import { TAX_STAGES } from './taxQuestData.js';

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
    },
  },
};

function reachedStages(quest, stage) {
  const stages = Object.keys(quest.stages).map(Number).sort((a, b) => a - b);
  const routeBase = stage >= 40 ? 40 : stage >= 30 ? 30 : stage >= 20 ? 20 : 10;
  return stages.filter((entry) => entry === 10 || (entry >= routeBase && entry <= stage));
}

export function questJournalEntries(worldState) {
  return worldState.activeQuests()
    .map(({ id, stage, route, status, outcome }) => {
      const quest = QUESTS[id];
      if (!quest) return null;
      const reached = reachedStages(quest, stage);
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
