// Quest definitions. `stages` map a stage number to the journal text shown for
// that stage. Dialogue effects ({type:'quest', id, stage}) move the stage; the
// journal reads the highest reached stage from world state.
export const QUESTS = {
  tax_and_clay: {
    name: 'Налог и глина',
    giver: 'Лейтенант Марсель Дюмон',
    where: 'Пост Ришелье',
    stages: {
      1: 'Ты видел, как лейтенант Дюмон обирает крестьян у Поста Ришелье. Это не законная десятина.',
      2: 'Ты убил Дюмона на глазах у всех. Беги от поста и скройся!',
      3: 'Ты скрылся после убийства Дюмона. Найди Герду в Форте Заря.',
      4: 'Герда замяла инцидент. Дело о налоге и глине закрыто.',
    },
  },
};

export function questJournalEntries(worldState) {
  return worldState.activeQuests()
    .map(({ id, stage }) => {
      const quest = QUESTS[id];
      if (!quest) return null;
      const reached = Object.keys(quest.stages)
        .map(Number)
        .filter((s) => s <= stage)
        .sort((a, b) => a - b);
      const current = reached[reached.length - 1];
      return {
        id,
        name: quest.name,
        done: stage >= Math.max(...Object.keys(quest.stages).map(Number)),
        log: reached.map((s) => quest.stages[s]),
        current: quest.stages[current] || '',
      };
    })
    .filter(Boolean);
}
