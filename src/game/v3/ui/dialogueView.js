import { TOPIC_LABELS, DIALOGUE } from '../dialogue/dialogueData.js';
import { buildContext, pickResponse, applyEffects, condOk } from '../dialogue/dialogueEngine.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function escapeReg(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const STYLE = `
<style>
.dlg{display:flex;gap:14px;font-family:Georgia,serif;color:#efe0bd}
.dlg-main{flex:1 1 auto;min-width:0}
.dlg-name{font-weight:800;font-size:18px;color:#f4d48a;margin-bottom:8px;border-bottom:1px solid #6d4b29;padding-bottom:6px}
.dlg-text{font-size:15px;line-height:1.5;min-height:96px;white-space:pre-wrap}
.dlg-text a.dlg-topic{color:#9fd2ff;text-decoration:underline;cursor:pointer}
.dlg-text a.dlg-topic:hover{color:#d8eeff}
.dlg-choices{margin-top:14px;display:flex;flex-direction:column;gap:6px}
.dlg-choice{text-align:left;background:#3a2a18;color:#f4ddb0;border:1px solid #6d4b29;padding:8px 10px;cursor:pointer;font:600 14px Georgia,serif}
.dlg-choice:hover{background:#4d3720;border-color:#f4d48a}
.dlg-topics{flex:0 0 168px;border-left:1px solid #6d4b29;padding-left:12px}
.dlg-topics h4{margin:0 0 6px;font-size:12px;letter-spacing:1px;color:#cba76f;text-transform:uppercase}
.dlg-topic-item{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid rgba(140,100,60,.3);color:#e7d5ad;padding:6px 2px;cursor:pointer;font:600 14px Georgia,serif}
.dlg-topic-item:hover{color:#9fd2ff}
.dlg-close{margin-top:14px;background:#6f4528;color:#f4ddb0;border:1px solid #321b0e;padding:7px 12px;cursor:pointer}
</style>`;

export class DialogueSession {
  constructor(engine, npcId) {
    this.engine = engine;
    this.npcId = npcId;
    this.def = DIALOGUE[npcId];
    this.ctx = buildContext(engine);
    this.available = new Set(this.def?.start || []);
    this.text = '';
    this.choices = null;
    this.greet();
  }

  greet() { this.show(pickResponse(this.def.greeting, this.ctx), 'greeting'); }

  show(response, topicKey) {
    if (!response) { this.text = '…'; this.choices = null; this.render(); return; }
    this.text = response.text || '';
    this.choices = response.choices || null;
    for (const topic of (response.adds || [])) this.available.add(topic);
    applyEffects(response.effects, this.ctx, this.engine, `${this.npcId}:${topicKey}`);
    this.render();
  }

  openTopic(topicId) { this.show(pickResponse(this.def.topics?.[topicId], this.ctx), topicId); }

  choose(index) {
    const choice = this.choices?.[index];
    if (!choice) return;
    applyEffects(choice.effects, this.ctx, this.engine, `${this.npcId}:choice:${choice.label}`);
    if (choice.goto === '__close') { this.engine.closePausePanel(); return; }
    if (choice.say) { this.text = choice.say; this.choices = null; this.render(); return; }
    if (choice.goto) { this.openTopic(choice.goto); return; }
    this.choices = null;
    this.render();
  }

  visibleTopics() {
    return [...this.available].filter((id) => this.def.topics?.[id]);
  }

  linkify(text) {
    let out = escapeHtml(text);
    for (const id of this.visibleTopics()) {
      const label = TOPIC_LABELS[id];
      if (!label) continue;
      const re = new RegExp(`(^|[^\\wа-яё])(${escapeReg(label)})`, 'i');
      out = out.replace(re, (m, pre, word) => `${pre}<a class="dlg-topic" data-topic="${id}">${word}</a>`);
    }
    return out;
  }

  render() {
    const topics = this.visibleTopics();
    const choicesHtml = (this.choices || [])
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => this.ctx && (!c.when || this.choiceVisible(c)))
      .map(({ c, i }) => `<button class="dlg-choice" data-choice="${i}">${escapeHtml(c.label)}</button>`)
      .join('');
    const topicsHtml = topics.map((id) => `<button class="dlg-topic-item" data-topic="${id}">${escapeHtml(TOPIC_LABELS[id] || id)}</button>`).join('')
      || '<div style="opacity:.6;font-size:13px">— тем пока нет —</div>';

    this.engine.hud.openPanel(`${STYLE}
      <div class="dlg">
        <div class="dlg-main">
          <div class="dlg-name">${escapeHtml(this.def.name || this.npcId)}</div>
          <div class="dlg-text">${this.linkify(this.text)}</div>
          <div class="dlg-choices">${choicesHtml}</div>
          <button class="dlg-close" id="closeMapBtn">Закончить разговор</button>
        </div>
        <div class="dlg-topics"><h4>Темы</h4>${topicsHtml}</div>
      </div>`);
    this.bind();
  }

  choiceVisible(choice) {
    return condOk(choice.when, this.ctx);
  }

  bind() {
    const panel = document.getElementById('panel');
    if (!panel) return;
    panel.querySelectorAll('[data-topic]').forEach((node) => {
      node.addEventListener('click', () => this.openTopic(node.dataset.topic));
    });
    panel.querySelectorAll('[data-choice]').forEach((node) => {
      node.addEventListener('click', () => this.choose(Number(node.dataset.choice)));
    });
    document.getElementById('closeMapBtn')?.addEventListener('click', () => this.engine.closePausePanel());
  }
}
