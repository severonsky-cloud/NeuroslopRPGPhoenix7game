import { normalizePlayerCulture } from '../data/settlementsData.js';

// "Налог и глина" — vertical slice, violent branch (assassinate the officer).
// The dialogue (dialogueData.js) only sets flags / quest stage; this extension
// runs the world reactions: witnessing the extortion, the on-screen removal of
// the officer, the flee timer, and reaching safety. Officer = Дюмон at the post.
const POST = { x: -69, z: 77 };

// Race-flavoured micro-moment shown the first time you witness the extortion.
// АВТОР может расширять/переписывать эти строки.
const WITNESS_LINES = {
  black: 'Тихий шёпот антиматерии: «Тоооолькооо не взззздуууумай… Не убббивввай его… Он нееее засслуууужил…»',
  red: 'Своя кровь гнётся под имперским сапогом у поста. Внутри закипает.',
  zhuzher: 'Ты считаешь выходы, как дозорный. Офицер берёт лишнее — это слабость.',
  reptiloid: 'Холодный расчёт: офицер нарушает собственный указ. Это рычаг.',
  default: 'Лейтенант Дюмон обирает крестьян у поста — это не похоже на законную десятину.',
};

function playerRace(engine) {
  const profile = engine.player?.characterProfile || engine.player || {};
  return normalizePlayerCulture(profile).race;
}

export function installTaxQuestExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__taxQuestInstalled) return;
  PhoenixV3Engine.__taxQuestInstalled = true;

  // Permanently remove a living-world agent (mesh + label) from the scene.
  PhoenixV3Engine.prototype.removeLifeAgent = function removeLifeAgent(id) {
    const lw = this.livingWorld;
    if (!lw) return false;
    const idx = lw.agents.findIndex((a) => a.userData.id === id);
    if (idx < 0) return false;
    const obj = lw.agents[idx];
    if (obj.userData.label) obj.userData.label.visible = false;
    this.scene.remove(obj);
    lw.agents.splice(idx, 1);
    return true;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithTaxQuest(dt) {
    originalUpdate.call(this, dt);
    if (this.mode === 'boot' || this.paused || !this.worldState) return;
    const ws = this.worldState;
    const stage = ws.questStage('tax_and_clay');
    const p = this.rig.position;
    const distPost = Math.hypot(p.x - POST.x, p.z - POST.z);

    // 1) Witness the extortion the first time you reach the post.
    if (stage === 0 && distPost < 12 && !ws.getFlag('dumont_dead')) {
      const dumont = this.livingWorld?.agents?.find((a) => a.userData.id === 'marcel-dumont');
      if (dumont) {
        ws.setQuestStage('tax_and_clay', 1);
        ws.setFlag('witnessed_extortion');
        const line = WITNESS_LINES[playerRace(this)] || WITNESS_LINES.default;
        this.hud?.setObjective?.(line);
        this.log?.unshift?.(`Налог и глина: ${line}`);
      }
    }

    // 2) The assassination choice set a flag — carry out the kill on screen.
    if (ws.getFlag('assassinate_dumont') && !ws.getFlag('dumont_dead')) {
      ws.setFlag('assassinate_dumont', false);
      ws.setFlag('dumont_dead');
      this.removeLifeAgent('marcel-dumont');
      ws.setQuestStage('tax_and_clay', 2);
      this.taxShockTimer = 120;
      this.hud?.setObjective?.('Ты убил Дюмона на глазах у всех. Беги от поста и скройся!');
      this.log?.unshift?.('Налог и глина: Дюмон мёртв. Шок! Беги и скройся.');
    }

    // 3) Shock window: flee timer + get clear of the post.
    if (stage === 2 && ws.getFlag('dumont_dead')) {
      this.taxShockTimer = Math.max(0, (this.taxShockTimer ?? 120) - dt);
      const mm = Math.floor(this.taxShockTimer / 60);
      const ss = Math.floor(this.taxShockTimer % 60);
      if (this.taxShockTimer > 0 || distPost <= 70) {
        this.hud?.setObjective?.(`Беги и скройся!  ${mm}:${String(ss).padStart(2, '0')}  ·  отойди от поста (${Math.round(distPost)} м)`);
      }
      if (this.taxShockTimer <= 0 && distPost > 70) {
        ws.setQuestStage('tax_and_clay', 3);
        this.hud?.setObjective?.('Ты скрылся. Найди Герду в Форте Заря.');
        this.log?.unshift?.('Налог и глина: ты скрылся после убийства Дюмона. Найди Герду в Форте Заря.');
      }
    }
  };

  PhoenixV3Engine.prototype.getTaxQuestDiagnostics = function getTaxQuestDiagnostics() {
    const ws = this.worldState;
    if (!ws) return null;
    return {
      stage: ws.questStage('tax_and_clay'),
      witnessed: ws.getFlag('witnessed_extortion'),
      dumontDead: ws.getFlag('dumont_dead'),
      shockTimer: Math.round((this.taxShockTimer ?? 0) * 10) / 10,
      gerdaDone: ws.getFlag('tax_gerda_done'),
    };
  };
}
