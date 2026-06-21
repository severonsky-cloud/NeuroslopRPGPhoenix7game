import * as THREE from '../vendor/three.module.js';
import {
  TAX_POSITIONS,
  TAX_QUEST_ID,
  TAX_SCENE_LINES,
  TAX_STAGES,
  TAX_WITNESS_LINES,
} from '../data/taxQuestData.js';
import { normalizePlayerCulture } from '../data/settlementsData.js';
import { TaxEvidenceSystem } from './taxEvidenceSystem.js';
import { TaxCombatSystem } from './taxCombatSystem.js';
import { TaxRebelSystem } from './taxRebelSystem.js';

function ensureSubtitleElement() {
  let element = document.getElementById('phxSubtitle');
  if (!element) {
    element = document.createElement('div');
    element.id = 'phxSubtitle';
    element.style.cssText =
      'position:fixed;left:50%;bottom:104px;transform:translateX(-50%);z-index:13;max-width:760px;' +
      'text-align:center;pointer-events:none;font:600 17px Georgia,serif;color:#f3e6c4;' +
      'text-shadow:0 2px 8px #000;background:rgba(8,6,4,.58);padding:9px 18px;border-radius:4px;' +
      'opacity:0;transition:opacity .25s';
    document.body.appendChild(element);
  }
  return element;
}

function ensureBannerElement() {
  let element = document.getElementById('phxQuestBanner');
  if (!element) {
    element = document.createElement('div');
    element.id = 'phxQuestBanner';
    element.style.cssText =
      'position:fixed;left:50%;top:42px;transform:translateX(-50%);z-index:12;pointer-events:none;' +
      'font:700 13px system-ui;color:#ffe6b0;text-shadow:0 2px 6px #000;background:rgba(40,18,10,.68);' +
      'border:1px solid rgba(216,166,77,.4);border-radius:3px;padding:5px 12px;max-width:82vw;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;transition:opacity .2s';
    document.body.appendChild(element);
  }
  return element;
}

function makeQuestionMarker() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  context.font = 'bold 52px system-ui';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#000';
  context.fillText('?', 34, 36);
  context.fillStyle = '#ffd24a';
  context.fillText('?', 32, 34);
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true,
    depthTest: false,
  }));
  marker.scale.set(1.3, 1.3, 1);
  marker.renderOrder = 30;
  return marker;
}

function distXZ(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

const ARREST_LINES = Object.freeze({
  community: [
    ['Ньен Ло', 'Перед тобой не толпа, Дюмон. Перед тобой община, которая научилась считать свои потери.'],
    ['Дюмон', 'Община не имеет права арестовывать офицера.'],
    ['Следователь', 'Зато я имею. Сдайте оружие, лейтенант.'],
  ],
  legal: [
    ['Следователь', 'Печать Форта, ведомость поборов и свидетель. Процедура соблюдена.'],
    ['Дюмон', 'Процедуры переживают людей. Я ещё вернусь к этой дороге.'],
    ['Военный писарь', 'Угрозу внесём в протокол отдельно.'],
  ],
  phase: [
    ['Игрок', 'Резонанс помнит каждую передачу денег. Бумагу можно сжечь, след — нет.'],
    ['Дюмон', 'Фазовый бред не имеет силы в имперском суде.'],
    ['Следователь', 'Сегодня имеет. Руки за спину.'],
  ],
  witness: [
    ['Ньен Ло', 'Я переводила ваши угрозы дословно. Теперь переведу их следователю.'],
    ['Дюмон', 'Я исполнял приказ.'],
    ['Следователь', 'Тогда назовёте того, кто его отдал. В Форте.'],
  ],
});

export class TaxQuestSystem {
  constructor(engine) {
    this.engine = engine;
    this.subtitle = ensureSubtitleElement();
    this.banner = ensureBannerElement();
    this.scene = null;
    this.arrestScene = null;
    this.markers = [];
    this.evidence = new TaxEvidenceSystem(engine);
    this.combat = new TaxCombatSystem(engine);
    this.rebels = new TaxRebelSystem(engine, this.subtitle);
    if (this.quest().stage === TAX_STAGES.OFFERED) this.spawnMarkers();
    if (this.quest().stage === TAX_STAGES.ASSASSINATION_SCENE) this.combat.startAssassination();
    if (this.quest().stage === TAX_STAGES.ARREST_SCENE && this.quest().vars.arrestOutcome) {
      this.beginArrestScene(this.quest().vars.arrestOutcome);
    }
  }

  quest() {
    return this.engine.worldState.questState(TAX_QUEST_ID);
  }

  playerCulture() {
    return normalizePlayerCulture(this.engine.player?.characterProfile || this.engine.player || {});
  }

  lifeAgent(id) {
    return this.engine.livingWorld?.agents?.find((agent) => agent.userData.id === id) || null;
  }

  spawnMarkers() {
    if (this.markers.length) return;
    const caravan = this.lifeAgent('red_rural_caravan');
    for (const id of ['marcel-dumont', caravan?.userData.id].filter(Boolean)) {
      const marker = makeQuestionMarker();
      this.engine.scene.add(marker);
      this.markers.push({ marker, id });
    }
  }

  clearMarkers() {
    for (const entry of this.markers) this.engine.scene.remove(entry.marker);
    this.markers = [];
  }

  updateMarkers() {
    for (let index = this.markers.length - 1; index >= 0; index -= 1) {
      const entry = this.markers[index];
      const agent = this.lifeAgent(entry.id);
      if (!agent || !agent.visible) {
        entry.marker.visible = false;
        continue;
      }
      entry.marker.visible = true;
      entry.marker.position.set(agent.position.x, agent.position.y + 2.7, agent.position.z);
    }
  }

  startOpeningScene() {
    if (this.scene || this.engine.worldState.getFlag('tax_scene_seen')) return;
    this.scene = { index: 0, elapsed: 0 };
    this.evidence.setCaravanHold(true);
    const culture = this.playerCulture();
    this.engine.hud.setObjective(TAX_WITNESS_LINES[culture.race] || TAX_WITNESS_LINES.default);
  }

  finishOpeningScene() {
    this.subtitle.style.opacity = '0';
    this.scene = null;
    this.engine.worldState.setFlag('tax_scene_seen');
    this.engine.worldState.setFlag('witnessed_extortion');
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.OFFERED,
      route: null,
      status: 'active',
      outcome: null,
    });
    this.evidence.setCaravanHold(false);
    this.spawnMarkers();
    this.engine.hud.setObjective('Поговори с Дюмоном: расследовать поборы, казнить его или вызвать на открытую ссору.');
    this.engine.log.unshift('Налог и глина: ты застал незаконный сбор пошлины у Поста Ришелье.');
  }

  updateOpeningScene(dt) {
    if (!this.scene) return;
    const line = TAX_SCENE_LINES[this.scene.index];
    if (!line) {
      this.finishOpeningScene();
      return;
    }
    if (this.scene.elapsed === 0) {
      this.subtitle.textContent = `${line.who}: ${line.text}`;
      this.subtitle.style.opacity = '1';
      this.engine.log.unshift(`[у поста] ${line.who}: ${line.text}`);
    }
    this.scene.elapsed += dt;
    if (this.scene.elapsed >= Math.max(2.5, line.text.length * 0.05)) {
      this.scene.index += 1;
      this.scene.elapsed = 0;
    }
  }

  consumeDialogueFlags() {
    const ws = this.engine.worldState;
    if (ws.getFlag('tax_choose_investigation')) {
      ws.setFlag('tax_choose_investigation', false);
      ws.patchQuest(TAX_QUEST_ID, {
        stage: TAX_STAGES.INVESTIGATING,
        route: 'investigation',
        status: 'active',
        outcome: null,
      });
      this.clearMarkers();
      this.engine.hud.setObjective('Возьми камеру у Рины или укради ведомость Дюмона ночью.');
    }
    if (ws.getFlag('tax_start_assassination')) {
      ws.setFlag('tax_start_assassination', false);
      this.clearMarkers();
      this.combat.startAssassination();
    }
    if (ws.getFlag('tax_prepare_standoff')) {
      ws.setFlag('tax_prepare_standoff', false);
      ws.patchQuest(TAX_QUEST_ID, {
        stage: TAX_STAGES.STANDOFF_READY,
        route: 'standoff',
        status: 'active',
      });
      this.engine.hud.setObjective('Открытая ссора начнёт бой. Поговори с Дюмоном ещё раз, когда готов.');
    }
    if (ws.getFlag('tax_start_standoff')) {
      ws.setFlag('tax_start_standoff', false);
      this.clearMarkers();
      this.combat.startStandoff();
    }
    if (ws.getFlag('tax_rest_requested')) {
      ws.setFlag('tax_rest_requested', false);
      this.engine.timeOfDay?.setPhase?.(0.31);
      ws.patchQuest(TAX_QUEST_ID, {
        stage: TAX_STAGES.ARREST_MARCH,
        route: 'investigation',
        status: 'active',
        vars: { restedAtFort: true },
      });
      this.combat.spawnArrestSquad();
      this.engine.player.hp = this.engine.player.hpMax;
      this.engine.player.st = this.engine.player.stMax;
      this.engine.player.ph = this.engine.player.phMax;
      this.engine.hud.setObjective('Утро. Проведи следственную группу обратно к Посту Ришелье.');
    }
    for (const outcome of ['community', 'legal', 'phase', 'witness']) {
      const flag = `tax_arrest_${outcome}`;
      if (!ws.getFlag(flag)) continue;
      ws.setFlag(flag, false);
      this.beginArrestScene(outcome);
    }
  }

  beginArrestScene(outcome) {
    if (this.arrestScene) return;
    this.engine.worldState.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.ARREST_SCENE,
      route: 'investigation',
      status: 'active',
      vars: { arrestPending: true, arrestOutcome: outcome },
    });
    this.arrestScene = { outcome, index: 0, elapsed: 0 };
    this.engine.player.characterRuntime.rooted = true;
  }

  updateArrestScene(dt) {
    if (!this.arrestScene) return;
    const lines = ARREST_LINES[this.arrestScene.outcome] || ARREST_LINES.witness;
    const line = lines[this.arrestScene.index];
    if (!line) {
      const outcome = this.arrestScene.outcome;
      this.subtitle.style.opacity = '0';
      this.arrestScene = null;
      this.engine.player.characterRuntime.rooted = false;
      this.combat.finishArrest(outcome);
      return;
    }
    if (this.arrestScene.elapsed === 0) {
      this.subtitle.textContent = `${line[0]}: ${line[1]}`;
      this.subtitle.style.opacity = '1';
    }
    this.arrestScene.elapsed += dt;
    if (this.arrestScene.elapsed >= Math.max(2.3, line[1].length * 0.045)) {
      this.arrestScene.index += 1;
      this.arrestScene.elapsed = 0;
    }
  }

  finishAssassinationAtGerda() {
    const ws = this.engine.worldState;
    ws.grantRewardOnce('tax:assassination', {
      credits: 250,
      items: ['dumontBadge'],
      reputation: [
        { scope: 'factions', id: 'redPeasants', delta: 1 },
        { scope: 'locations', id: 'richelieu-post', delta: -3 },
      ],
    });
    ws.patchQuest(TAX_QUEST_ID, {
      stage: TAX_STAGES.ASSASSINATION_DONE,
      route: 'assassination',
      status: 'complete',
      outcome: 'assassination',
    });
    ws.setFlag('tax_gerda_done');
    ws.applyPersistentRewards(this.engine);
  }

  consumeCompletionFlags() {
    if (this.engine.worldState.getFlag('tax_finish_assassination')) {
      this.engine.worldState.setFlag('tax_finish_assassination', false);
      this.finishAssassinationAtGerda();
    }
  }

  bannerText() {
    const quest = this.quest();
    const rebelText = this.rebels.bannerText();
    if (rebelText) return rebelText;
    const distance = Math.round(distXZ(this.engine.rig.position, TAX_POSITIONS.post));
    switch (quest.stage) {
      case TAX_STAGES.OFFERED: return '❗ Налог и глина — выбери путь в разговоре с Дюмоном';
      case TAX_STAGES.INVESTIGATING: return '🔎 Налог и глина — камера Рины или ночная ведомость';
      case TAX_STAGES.EVIDENCE_READY: return '📜 Налог и глина — отнеси улику Герде';
      case TAX_STAGES.GERDA_REVIEW: return '☾ Налог и глина — отдохни у Герды до утра';
      case TAX_STAGES.ARREST_MARCH: return '⚖ Налог и глина — проведи отряд к Посту Ришелье';
      case TAX_STAGES.ARREST_CHOICE: return '⚖ Налог и глина — поговори с окружённым Дюмоном';
      case TAX_STAGES.ASSASSINATION_ESCAPE: {
        const minutes = Math.floor(this.combat.shockTimer / 60);
        const seconds = Math.floor(this.combat.shockTimer % 60);
        return `🩸 Беги! ${minutes}:${String(seconds).padStart(2, '0')} · ${distance} м от поста`;
      }
      case TAX_STAGES.ASSASSINATION_GERDA: return '❗ Налог и глина — найди Герду в Форте Заря';
      case TAX_STAGES.STANDOFF_COMBAT:
        return `⚔ Оборона поста — ${Math.ceil(this.combat.standoff?.remaining || 0)} сек`;
      default: return '';
    }
  }

  interact() {
    return this.rebels.interact() || this.evidence.interact();
  }

  update(dt) {
    const quest = this.quest();
    if (quest.stage === 0 && !this.engine.worldState.getFlag('tax_scene_seen')
      && distXZ(this.engine.rig.position, TAX_POSITIONS.post) < 24
      && this.lifeAgent('marcel-dumont')) {
      this.startOpeningScene();
    }
    this.updateOpeningScene(dt);
    this.consumeDialogueFlags();
    this.consumeCompletionFlags();
    this.updateArrestScene(dt);
    this.evidence.update(dt);
    this.combat.update(dt);
    this.rebels.update(dt);
    this.updateMarkers();
    if (quest.stage !== TAX_STAGES.OFFERED && quest.stage !== TAX_STAGES.STANDOFF_READY) this.clearMarkers();
    const text = this.scene || this.arrestScene ? '' : this.bannerText();
    this.banner.textContent = text;
    this.banner.style.opacity = text ? '1' : '0';
  }

  resetRuntime() {
    this.scene = null;
    this.arrestScene = null;
    this.clearMarkers();
    this.subtitle.style.opacity = '0';
    this.banner.style.opacity = '0';
    this.evidence.resetRuntime();
    this.combat.resetRuntime();
    this.rebels.resetRuntime();
  }

  setDebugStage(stage, route = null) {
    const status = [TAX_STAGES.ASSASSINATION_DONE, TAX_STAGES.STANDOFF_DONE, TAX_STAGES.ARREST_DONE, TAX_STAGES.REBELS_DONE].includes(stage)
      ? 'complete'
      : 'active';
    this.engine.worldState.patchQuest(TAX_QUEST_ID, { stage, route, status, outcome: null });
    this.resetRuntime();
    if (stage === TAX_STAGES.OFFERED) this.spawnMarkers();
    if (stage === TAX_STAGES.ARREST_MARCH) this.combat.spawnArrestSquad();
    this.rebels.setDebugStage(stage);
    return this.diagnostics();
  }

  diagnostics() {
    const quest = this.quest();
    return {
      stage: quest.stage,
      route: quest.route,
      status: quest.status,
      outcome: quest.outcome,
      vars: { ...(quest.vars || {}) },
      scenePlaying: !!this.scene,
      arrestScene: this.arrestScene?.outcome || null,
      markers: this.markers.map((entry) => entry.id),
      evidence: this.evidence.diagnostics(),
      combat: this.combat.diagnostics(),
      rebels: this.rebels.diagnostics(),
      questItems: { ...this.engine.worldState.data.questItems },
      rewards: Object.keys(this.engine.worldState.data.rewards),
      reputation: JSON.parse(JSON.stringify(this.engine.worldState.data.reputation)),
    };
  }
}
