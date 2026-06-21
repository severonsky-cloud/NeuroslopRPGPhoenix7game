# «Налог и глина» — Тир-2: план сборки для Codex/GPT

Ветка: `claude/v3-integration-build`. Тир-1 (3 маршрута) готов и проверен. Ниже —
конкретные инструкции на оставшиеся Тир-2 ветки: какой route/stage/flag добавить,
в каких файлах, какими существующими API. Автор пишет тексты реплик; машину строит
Codex/GPT. Стадии Тир-1 заняты диапазонами 10/20/30/40/45/49 — для новых маршрутов
бери новые диапазоны (60/70/80…), чтобы не пересекаться.

## Что уже есть (API, на котором всё строится)

- **world-state v2** (`state/worldState.js`): `setQuestStage(id,n)`, `patchQuest(id,{route,stage,status,outcome,vars})`, `addQuestItem/removeQuestItem/hasQuestItem`, `grantRewardOnce(key,reward)`, `applyPersistentRewards(engine)`, `changeReputation(scope,id,delta)`, `getFlag/setFlag`.
- **dialogue-эффекты** (`dialogue/dialogueEngine.js`): `setFlag`, `quest`, `questPatch`, `questItem`, `reward`, `reputation`, `credits`, `journal`. Условия: `race/notRace`, `background`, `gender`, `flag/notFlag`, `quest:{id:'>=N'}`, `skillAbove`, `hasItem`, `any/all`, `chance`.
- **квест-системы** (`quests/taxCombatSystem.js`, `taxEvidenceSystem.js`, `taxQuestSystem.js`): `spawnCombatant({id,name,x,z,hp},profile)`, `hideLifeAgent(id)`, `removeLifeAgent(id)`, `restoreLifeAgent(id)`, `lifeAgent(id)`, субтитры/объективы через `engine.hud.setObjective`.
- **время суток** (`world/dayNight.js`): импортируй `worldClock` → `worldClock.nightFactor` (>0.55 = ночь), `worldClock.segment`.
- **существующий флаг** `lang_do_services_unlocked` (Codex уже ставит его при мирном исходе community) — переиспользуй для «крестьяне открыли услуги».
- Координаты: пост Дюмона `(-69,77)`; КЭК-караван агент `red_rural_caravan`; Герда `gerda` (Форт); Ньен Ло `nyen-lo`; глава артели `mei-hoan` (Ланг-До).

## Ветка C2 — Повстанцы ночью (route `rebels`, stage 60→69)

Поток: у Ньен Ло/крестьянина выбор «передать послание повстанцам» → `questPatch route:'rebels' stage:60` + flag `tax_rebels_contacted`. Затем **ночное** действие: игрок у поста ночью вырубает свет → срабатывает похищение.

Сборка (новый `core/engineTaxRebelsExtensions.js` или в `taxQuestSystem`):
- В update: если `route==='rebels'`, `stage===60`, `worldClock.nightFactor>0.55`, игрок у поста (<14 м) и нажал `E` на «рубильник» (или просто пробыл 3с) → `setFlag tax_power_cut`, stage 61.
- Спавн 2-3 «повстанцев» (`spawnCombatant`, нейтральны к игроку), они идут к Дюмону → через ~6с `removeLifeAgent('marcel-dumont')`, `setFlag dumont_arrested`, `patchQuest stage:69 outcome:'rebels'`.
- Награда: `grantRewardOnce('tax:rebels',{credits:N, items:[...]})` + `changeReputation('faction','rebels',+1)` + реплика повстанца «офицера ждёт ночной кошмар».
- Тексты-слоты: реплики Ньен Ло (выбор повстанцев), реплика повстанца, журнал.

## Ветка C3 — Мобилизация крестьян (route `mobilize`, stage 70→79)

Поток: у крестьянина/Мэй Хоан выбор «обучить общину» (гейт по стилю: `skillAbove` или `race`) → `questPatch route:'mobilize' stage:70` + flag `tax_peasants_rallied`. Реплики зависят от того, что игрок «показал» крестьянам (раса/навык).

Сборка: при следующей облаве Дюмона (триггер: игрок у поста днём, stage 70) → вооружённые крестьяне (`spawnCombatant` на стороне игрока) прогоняют Дюмона → `hideLifeAgent('marcel-dumont')` (убегает), stage 71. Позже (таймер ~30с игрового или при заходе к посту) — журнал «жужжерские налётчики добили Дюмона», `setFlag dumont_dead via raiders`, `patchQuest stage:79 outcome:'mobilize'`. Крестьяне благодарны → `setFlag lang_do_services_unlocked`, награда.
- Тексты-слоты: обучающие реплики (по расам/навыкам), благодарность крестьян.

## Ветка A4 — Фазовый путь (route `phase`, stage 80→89)

Поток: в хабе Дюмона добавь choice, гейт `when:{ any:[{race:['black','deimur']},{background:'resonant'}] }` (или `skillAbove:{phase:N}`) → `questPatch route:'phase' stage:80` + flag `tax_summon_ghosts`.

Сборка: при flag `tax_summon_ghosts` спавн 3-4 «фазовых призрака планеты» (переиспользуй `createMonster` с archetype `phase`/`glass`, эмиссивный вид; на фазовой ветке нейтральны к игроку) у Дюмона → они теснят/пугают офицера → `removeLifeAgent('marcel-dumont')` (бежит/исчезает), `patchQuest stage:89 outcome:'phase_ghosts'`. Крестьяне/артельщики боятся игрока → `changeReputation('faction','redPeasants',-1)` но «справедливость восстановлена» (журнал). Без шок-таймера.
- Тексты-слоты: реплика призыва, реакция крестьян (страх + благодарность).

## Цикл каравана Порт↔Форт (живой мир, не блокирует исходы)

Добавь отдельный КЭК-караван (новый агент `clay_caravan`, faction `redPeasants`, role `caravan`) с маршрутом: Порт-зона → Пост Ришелье `(-70,80)` → Форт `(142,176)` [пауза-торговля] → назад → Пост [сцена оплаты] → петля. На проходе поста (если Дюмон жив) — переиспользуй уже готовую `engineLivingExtortionExtensions` (она показывает повторную сцену поборов). Не меняй существующий `red_rural_caravan`.

## Озвучка субтитров (TTS, без ассетов)

Новый `audio/voice.js`: `export function speak(text){ if(!enabled||!window.speechSynthesis) return; const u=new SpeechSynthesisUtterance(text); u.lang='ru-RU'; u.rate=0.95; const v=speechSynthesis.getVoices().find(x=>/ru/i.test(x.lang)); if(v)u.voice=v; speechSynthesis.cancel(); speechSynthesis.speak(u); }` + `window.PHX_SPEAK={speak,setEnabled}`. Дефолт OFF + клавиша-тумблер. Вызвать `PHX_SPEAK.speak(line)` в точках показа субтитров (опенинг-сцена, `engineLivingExtortionExtensions`, реплики NPC при открытии). Degrade gracefully, если голоса нет.

## Правила

Каждая ветка — отдельный коммит (можно отдельная ветка/PR). Новые стадии — новые
диапазоны. `engine.js` не переписывать — extensions через `main.js`. Не менять
координаты Форта/поселений, формат профиля v1, поведение оружия/рук. Тексты пишет
автор; после сборки прогнать `npm.cmd run build` и `npm.cmd run test:v3m2b`, проверить
консоль, оставить обновлённый хендоф.
