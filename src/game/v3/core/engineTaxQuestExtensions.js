import * as THREE from '../vendor/three.module.js';
import { normalizePlayerCulture } from '../data/settlementsData.js';

// "Налог и глина" — vertical slice, violent branch.
// Opening is a SCRIPTED SCENE: a КЭК caravan argues with the officer (Дюмон) at
// the post while the player watches from the side (subtitles + journal). When it
// ends, "?" markers appear over the officer and a peasant — the quest is open.
const POST = { x: -69, z: 77 };

// АВТОР переписывает эти строки. Сцена вымогательства у поста.
const SCENE_LINES = [
  { who: 'Возчик КЭК', text: 'Лейтенант, мы уже отдали десятину Форту в этом году. Пропусти воз.' },
  { who: 'Лейтенант Дюмон', text: 'Десятина — Форту. А это пошлина за защиту поста. Десять кредитов с воза.' },
  { who: 'Возчик КЭК', text: 'Это грабёж. Мы везём глину, чтобы выменять припасы для деревни.' },
  { who: 'Лейтенант Дюмон', text: 'Это закон. Мой закон на этом посту. Плати — или глина останется здесь.' },
  { who: 'Возчик КЭК', text: '…Вот. Подавись.' },
];

// Race-flavoured inner reaction shown as the scene begins. АВТОР дополняет.
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

function subtitleEl() {
  let el = document.getElementById('phxSubtitle');
  if (!el) {
    el = document.createElement('div');
    el.id = 'phxSubtitle';
    el.style.cssText =
      'position:fixed;left:50%;bottom:104px;transform:translateX(-50%);z-index:13;max-width:740px;' +
      'text-align:center;pointer-events:none;font:600 17px Georgia,serif;color:#f3e6c4;' +
      'text-shadow:0 2px 8px #000;background:rgba(8,6,4,.5);padding:9px 18px;border-radius:4px;opacity:0;transition:opacity .25s';
    document.body.appendChild(el);
  }
  return el;
}

function questBannerEl() {
  let el = document.getElementById('phxQuestBanner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'phxQuestBanner';
    el.style.cssText =
      'position:fixed;left:50%;top:42px;transform:translateX(-50%);z-index:12;pointer-events:none;' +
      'font:700 13px system-ui;color:#ffe6b0;text-shadow:0 2px 6px #000;background:rgba(40,18,10,.6);' +
      'border:1px solid rgba(216,166,77,.4);border-radius:3px;padding:5px 12px;white-space:nowrap;opacity:0;transition:opacity .2s';
    document.body.appendChild(el);
  }
  return el;
}

function makeQuestionMarker() {
  const cnv = document.createElement('canvas');
  cnv.width = 64; cnv.height = 64;
  const c = cnv.getContext('2d');
  c.font = 'bold 52px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#000'; c.fillText('?', 34, 36);
  c.fillStyle = '#ffd24a'; c.fillText('?', 32, 34);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cnv), transparent: true, depthTest: false }));
  sprite.scale.set(1.3, 1.3, 1);
  sprite.renderOrder = 30;
  return sprite;
}

export function installTaxQuestExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__taxQuestInstalled) return;
  PhoenixV3Engine.__taxQuestInstalled = true;

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

  // Spawn "?" markers over the officer and the nearest red peasant near the post.
  PhoenixV3Engine.prototype.spawnTaxMarkers = function spawnTaxMarkers() {
    if (this.taxMarkers) return;
    this.taxMarkers = [];
    const agents = this.livingWorld?.agents || [];
    const peasant = agents
      .filter((a) => a.userData.faction === 'redPeasants')
      .sort((a, b) => Math.hypot(a.userData.x - POST.x, a.userData.z - POST.z) - Math.hypot(b.userData.x - POST.x, b.userData.z - POST.z))[0];
    for (const id of ['marcel-dumont', peasant?.userData.id].filter(Boolean)) {
      const marker = makeQuestionMarker();
      this.scene.add(marker);
      this.taxMarkers.push({ marker, id });
    }
  };

  PhoenixV3Engine.prototype.clearTaxMarkers = function clearTaxMarkers() {
    for (const m of (this.taxMarkers || [])) this.scene.remove(m.marker);
    this.taxMarkers = null;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithTaxQuest(dt) {
    originalUpdate.call(this, dt);
    if (this.mode === 'boot' || this.paused || !this.worldState) return;
    const ws = this.worldState;
    const stage = ws.questStage('tax_and_clay');
    const p = this.rig.position;
    const distPost = Math.hypot(p.x - POST.x, p.z - POST.z);

    // 0) Scripted extortion scene the first time you come near the post.
    if (stage === 0 && !ws.getFlag('dumont_dead')) {
      if (!this.taxScene && !ws.getFlag('tax_scene_seen') && distPost < 24) {
        const dumont = this.livingWorld?.agents?.find((a) => a.userData.id === 'marcel-dumont');
        if (dumont) {
          this.taxScene = { i: 0, t: 0, el: subtitleEl() };
          this.hud?.setObjective?.(WITNESS_LINES[playerRace(this)] || WITNESS_LINES.default);
        }
      }
      if (this.taxScene) this.advanceTaxScene(dt);
    }

    // Keep "?" markers floating over the officer / peasant until you engage.
    if (this.taxMarkers) {
      for (let i = this.taxMarkers.length - 1; i >= 0; i -= 1) {
        const m = this.taxMarkers[i];
        const a = this.livingWorld?.agents?.find((x) => x.userData.id === m.id);
        if (!a || (m.id === 'marcel-dumont' && ws.getFlag('dumont_dead'))) {
          this.scene.remove(m.marker);
          this.taxMarkers.splice(i, 1);
          continue;
        }
        m.marker.position.set(a.position.x, a.position.y + 2.7, a.position.z);
      }
      if (stage >= 2 || this.taxMarkers.length === 0) this.clearTaxMarkers();
    }

    // 1) The assassination choice set a flag — carry out the kill on screen.
    if (ws.getFlag('assassinate_dumont') && !ws.getFlag('dumont_dead')) {
      ws.setFlag('assassinate_dumont', false);
      ws.setFlag('dumont_dead');
      this.removeLifeAgent('marcel-dumont');
      ws.setQuestStage('tax_and_clay', 2);
      this.taxShockTimer = 120;
      this.hud?.setObjective?.('Ты убил Дюмона на глазах у всех. Беги от поста и скройся!');
      this.log?.unshift?.('Налог и глина: Дюмон мёртв. Шок! Беги и скройся.');
    }

    // 2) Shock window: flee timer + get clear of the post.
    if (stage === 2 && ws.getFlag('dumont_dead')) {
      this.taxShockTimer = Math.max(0, (this.taxShockTimer ?? 120) - dt);
      if (this.taxShockTimer <= 0 && distPost > 70) {
        ws.setQuestStage('tax_and_clay', 3);
        this.log?.unshift?.('Налог и глина: ты скрылся после убийства Дюмона. Найди Герду в Форте Заря.');
      }
    }

    // Persistent quest banner — own element so the HUD status line can't wipe it.
    const banner = questBannerEl();
    let text = '';
    if (this.taxScene) text = '';
    else if (stage === 1 && !ws.getFlag('dumont_dead')) text = '❗ Налог и глина — поговори с Дюмоном (E) или дай каравану уйти';
    else if (stage === 2) {
      const mm = Math.floor(this.taxShockTimer / 60);
      const ss = Math.floor(this.taxShockTimer % 60);
      text = `🩸 Беги и скройся!  ${mm}:${String(ss).padStart(2, '0')}  ·  ${Math.round(distPost)} м от поста`;
    } else if (stage === 3) text = '❗ Налог и глина — найди Герду в Форте Заря';
    banner.textContent = text;
    banner.style.opacity = text ? '1' : '0';
  };

  // Plays scripted subtitle lines, then opens the quest with "?" markers.
  PhoenixV3Engine.prototype.advanceTaxScene = function advanceTaxScene(dt) {
    const scene = this.taxScene;
    const line = SCENE_LINES[scene.i];
    if (!line) {
      // Scene finished.
      scene.el.style.opacity = '0';
      this.taxScene = null;
      this.worldState.setFlag('tax_scene_seen');
      this.worldState.setFlag('witnessed_extortion');
      this.worldState.setQuestStage('tax_and_clay', 1);
      this.spawnTaxMarkers();
      this.hud?.setObjective?.('Над Дюмоном и возчиком — «?». Поговори (E), чтобы вмешаться — или дай каравану уйти.');
      this.log?.unshift?.('Налог и глина: ты застал, как Дюмон обирает караван КЭК у поста.');
      return;
    }
    if (scene.t === 0) {
      scene.el.textContent = `${line.who}: ${line.text}`;
      scene.el.style.opacity = '1';
      this.log?.unshift?.(`[у поста] ${line.who}: ${line.text}`);
    }
    scene.t += dt;
    if (scene.t >= Math.max(2.6, line.text.length * 0.055)) {
      scene.i += 1;
      scene.t = 0;
    }
  };

  PhoenixV3Engine.prototype.getTaxQuestDiagnostics = function getTaxQuestDiagnostics() {
    const ws = this.worldState;
    if (!ws) return null;
    return {
      stage: ws.questStage('tax_and_clay'),
      sceneSeen: ws.getFlag('tax_scene_seen'),
      scenePlaying: !!this.taxScene,
      witnessed: ws.getFlag('witnessed_extortion'),
      dumontDead: ws.getFlag('dumont_dead'),
      markers: (this.taxMarkers || []).map((m) => m.id),
      shockTimer: Math.round((this.taxShockTimer ?? 0) * 10) / 10,
      gerdaDone: ws.getFlag('tax_gerda_done'),
    };
  };
}
