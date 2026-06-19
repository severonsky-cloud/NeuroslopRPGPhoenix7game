import {
  BACKGROUNDS,
  GENDERS,
  PLAYABLE_RACE_IDS,
  RACES,
  raceDefinition,
} from '../data/characterData.js';
import {
  createDefaultCharacterProfile,
  normalizeCharacterProfile,
} from '../character/characterProfile.js';
import { CharacterPreview } from '../visuals/characterPreview.js';

const STYLE_ID = 'phoenix-character-creator-style';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .phx-creator{position:fixed;inset:0;z-index:120;display:grid;grid-template-columns:minmax(420px,620px) minmax(360px,1fr);background:radial-gradient(circle at 72% 30%,rgba(64,41,30,.58),rgba(5,4,4,.97) 62%);color:#f2dfb7;font-family:system-ui,sans-serif}
    .phx-creator-panel{padding:clamp(18px,3vw,38px);overflow:auto;border-right:1px solid rgba(216,166,77,.42);background:linear-gradient(110deg,rgba(24,15,10,.98),rgba(10,8,8,.9))}
    .phx-creator-preview{position:relative;min-height:360px;overflow:hidden}
    .phx-creator-preview canvas{width:100%;height:100%;display:block;touch-action:none}
    .phx-creator-kicker{text-transform:uppercase;letter-spacing:.19em;color:#d8a64d;font-size:12px}
    .phx-creator h1{font:700 clamp(28px,4vw,48px) Georgia,serif;margin:8px 0 6px;color:#ffe0a1}
    .phx-creator h2{font:700 25px Georgia,serif;color:#ffd18b;margin:18px 0 8px}
    .phx-creator p{line-height:1.52;color:#cdbd9e}
    .phx-stepbar{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:20px 0}
    .phx-step{height:5px;background:#33251a}.phx-step.active{background:#d8a64d;box-shadow:0 0 14px rgba(216,166,77,.55)}
    .phx-field{display:grid;gap:7px;margin:16px 0}.phx-field label{font-weight:800;color:#ebcf97}
    .phx-field input[type=text]{box-sizing:border-box;width:100%;padding:12px 14px;background:#100c0a;color:#ffe7be;border:1px solid #806039;font:700 17px system-ui}
    .phx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0}
    .phx-choice{display:block;text-align:left;padding:12px;border:1px solid #57432a;background:#16100c;color:#e8d6b2;cursor:pointer;min-height:82px}
    .phx-choice:hover{border-color:#b98a45}.phx-choice.selected{border-color:#ffd18b;background:#2a1c11;box-shadow:0 0 18px rgba(216,166,77,.16)}
    .phx-choice strong{display:block;color:#ffd797;font-size:15px}.phx-choice small{display:block;margin-top:5px;color:#aa9d87;line-height:1.35}
    .phx-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.phx-stat{padding:8px;background:#0f0c0b;border:1px solid rgba(216,166,77,.18);text-align:center}.phx-stat b{display:block;color:#ffd18b;font-size:18px}.phx-stat small{color:#9f947f}
    .phx-actions{display:flex;gap:8px;align-items:center;margin-top:20px}.phx-actions button,.phx-posebar button{border:1px solid #9d7438;background:#d8a64d;color:#21150d;padding:10px 14px;font-weight:900;cursor:pointer}.phx-actions button.secondary,.phx-posebar button{background:#17110d;color:#e8d6b2}.phx-actions .grow{flex:1}
    .phx-palette{display:flex;flex-wrap:wrap;gap:8px}.phx-swatch{width:42px;height:42px;border:2px solid #30241a;cursor:pointer}.phx-swatch.selected{border-color:#fff0bd;box-shadow:0 0 13px rgba(255,209,139,.65)}
    .phx-posebar{position:absolute;left:18px;right:18px;bottom:18px;display:flex;justify-content:center;gap:6px;z-index:2}.phx-posebar button.selected{background:#d8a64d;color:#21150d}
    .phx-preview-caption{position:absolute;left:20px;top:20px;z-index:2;padding:9px 12px;background:rgba(8,6,5,.72);border:1px solid rgba(216,166,77,.4);color:#ead8b5}
    .phx-range-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}.phx-range-row input{width:100%}
    .phx-confirm{padding:12px;border-left:3px solid #d8a64d;background:rgba(216,166,77,.08)}
    @media(max-width:900px){.phx-creator{grid-template-columns:1fr;grid-template-rows:minmax(0,58vh) minmax(300px,42vh)}.phx-creator-panel{border-right:0;border-bottom:1px solid rgba(216,166,77,.42)}.phx-grid{grid-template-columns:1fr}.phx-stats{grid-template-columns:repeat(2,1fr)}}
  `;
  document.head.appendChild(style);
}

function button(label, className, handler) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  node.textContent = label;
  node.addEventListener('click', handler);
  return node;
}

export class CharacterCreator {
  constructor({ existingProfile = null, onConfirm, onCancel = null } = {}) {
    ensureStyles();
    this.existingProfile = existingProfile;
    this.profile = normalizeCharacterProfile(existingProfile || createDefaultCharacterProfile());
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.step = 0;
    this.pose = 'idle';
    this.root = document.createElement('div');
    this.root.className = 'phx-creator';
    this.panel = document.createElement('section');
    this.panel.className = 'phx-creator-panel';
    this.previewHost = document.createElement('section');
    this.previewHost.className = 'phx-creator-preview';
    this.root.append(this.panel, this.previewHost);
    document.body.appendChild(this.root);
    this.preview = new CharacterPreview(this.previewHost, this.profile);
    this.renderPreviewChrome();
    this.render();
  }

  renderPreviewChrome() {
    const caption = document.createElement('div');
    caption.className = 'phx-preview-caption';
    caption.textContent = 'Тяни мышью — вращение модели';
    const poses = document.createElement('div');
    poses.className = 'phx-posebar';
    const poseLabels = { idle: 'Idle', walk: 'Walk', attack: 'Attack', racial: 'Q ability' };
    for (const [id, label] of Object.entries(poseLabels)) {
      const poseButton = button(label, id === this.pose ? 'selected' : '', () => {
        this.pose = id;
        this.preview.setPose(id);
        [...poses.children].forEach((entry) => entry.classList.toggle('selected', entry === poseButton));
      });
      poses.appendChild(poseButton);
    }
    this.previewHost.append(caption, poses);
  }

  syncProfile(patch) {
    this.profile = normalizeCharacterProfile({ ...this.profile, ...patch });
    this.preview.setProfile(this.profile);
    this.render();
  }

  header(title, subtitle) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="phx-creator-kicker">Phoenix7 v3M2A · создание ссыльного</div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <div class="phx-stepbar">${[0, 1, 2, 3].map((index) => `<i class="phx-step ${index <= this.step ? 'active' : ''}"></i>`).join('')}</div>
    `;
    this.panel.appendChild(wrapper);
  }

  renderStepOne() {
    this.header('Имя в пустом деле', 'Все герои начинают ссыльными в Порту Рейчел. Империя оставила вам статус, но имя вы выбираете сами.');
    const field = document.createElement('div');
    field.className = 'phx-field';
    field.innerHTML = '<label for="phxCharacterName">Имя персонажа</label>';
    const input = document.createElement('input');
    input.id = 'phxCharacterName';
    input.type = 'text';
    input.maxLength = 28;
    input.value = this.profile.name;
    input.addEventListener('input', () => { this.profile.name = input.value; });
    field.appendChild(input);
    this.panel.appendChild(field);
    const status = document.createElement('div');
    status.className = 'phx-confirm';
    status.innerHTML = '<b>Статус:</b> ссыльный без права покинуть Феникс-7.<br><small>Это биографическая основа, а не выбор мировоззрения.</small>';
    this.panel.appendChild(status);
  }

  renderStepTwo() {
    this.header('Раса и пол', 'Раса меняет тело, руки, характеристики, пассив и способность Q. Пол влияет на силуэт, обращения и культурные реакции, но не на характеристики.');
    const grid = document.createElement('div');
    grid.className = 'phx-grid';
    for (const raceId of PLAYABLE_RACE_IDS) {
      const race = RACES[raceId];
      const choice = button('', `phx-choice ${raceId === this.profile.race ? 'selected' : ''}`, () => {
        const gender = race.allowedGenders.includes(this.profile.gender) ? this.profile.gender : race.allowedGenders[0];
        this.syncProfile({
          race: raceId,
          gender,
          primaryColor: race.palette.primary[0],
          accentColor: race.palette.accent[0],
        });
      });
      choice.innerHTML = `<strong>${race.name}</strong><small>${race.subtitle}<br>${race.description}</small>`;
      grid.appendChild(choice);
    }
    this.panel.appendChild(grid);

    const genders = document.createElement('div');
    genders.className = 'phx-grid';
    const race = raceDefinition(this.profile.race);
    for (const [genderId, gender] of Object.entries(GENDERS)) {
      if (!race.allowedGenders.includes(genderId)) continue;
      const choice = button(gender.name, `phx-choice ${genderId === this.profile.gender ? 'selected' : ''}`, () => this.syncProfile({ gender: genderId }));
      genders.appendChild(choice);
    }
    this.panel.appendChild(genders);
    if (this.profile.race === 'deimur') {
      const note = document.createElement('p');
      note.className = 'phx-confirm';
      note.textContent = 'Деймурские женщины и матриархи почти не покидают родные земли; в этом проходе доступен только мужчина-деймур.';
      this.panel.appendChild(note);
    }
    const stats = document.createElement('div');
    stats.className = 'phx-stats';
    const raceStats = race.stats;
    stats.innerHTML = `
      <div class="phx-stat"><b>${raceStats.hp}</b><small>здоровье</small></div>
      <div class="phx-stat"><b>${raceStats.stamina}</b><small>stamina</small></div>
      <div class="phx-stat"><b>${raceStats.phase}</b><small>фаза</small></div>
      <div class="phx-stat"><b>${Math.round(raceStats.moveSpeed * 100)}%</b><small>скорость</small></div>
    `;
    this.panel.appendChild(stats);
  }

  renderStepThree() {
    this.header('Предыстория', 'Предыстория задаёт стартовые навыки, одежду, оружие, кредиты и будущие диалоговые зацепки. Полного арсенала в кармане больше нет.');
    const grid = document.createElement('div');
    grid.className = 'phx-grid';
    for (const background of Object.values(BACKGROUNDS)) {
      const skills = Object.entries(background.skillBonuses).map(([skill, value]) => `${skill} +${value}`).join(', ');
      const choice = button('', `phx-choice ${background.id === this.profile.background ? 'selected' : ''}`, () => this.syncProfile({ background: background.id }));
      choice.innerHTML = `<strong>${background.name}</strong><small>${background.description}<br>${skills} · кредиты ${background.credits}</small>`;
      grid.appendChild(choice);
    }
    this.panel.appendChild(grid);
  }

  renderStepFour() {
    const race = raceDefinition(this.profile.race);
    const background = BACKGROUNDS[this.profile.background];
    this.header('Внешность и подтверждение', 'Цвета ограничены культурной палитрой расы. Рост меняется в пределах ±5% от расовой нормы.');

    for (const [key, title] of [['primaryColor', 'Основной цвет'], ['accentColor', 'Акцент']]) {
      const field = document.createElement('div');
      field.className = 'phx-field';
      const label = document.createElement('label');
      label.textContent = title;
      const palette = document.createElement('div');
      palette.className = 'phx-palette';
      const values = key === 'primaryColor' ? race.palette.primary : race.palette.accent;
      for (const value of values) {
        const swatch = button('', `phx-swatch ${this.profile[key] === value ? 'selected' : ''}`, () => this.syncProfile({ [key]: value }));
        swatch.style.background = value;
        swatch.title = value;
        palette.appendChild(swatch);
      }
      field.append(label, palette);
      this.panel.appendChild(field);
    }

    const heightField = document.createElement('div');
    heightField.className = 'phx-field';
    const heightPercent = Math.round((1 + this.profile.heightOffset) * 100);
    heightField.innerHTML = `<label>Рост относительно нормы расы</label><div class="phx-range-row"><input id="phxHeight" type="range" min="-0.05" max="0.05" step="0.01" value="${this.profile.heightOffset}"><b>${heightPercent}%</b></div>`;
    const heightInput = heightField.querySelector('input');
    const heightValue = heightField.querySelector('b');
    heightInput.addEventListener('input', (event) => {
      this.profile = normalizeCharacterProfile({ ...this.profile, heightOffset: Number(event.target.value) });
      heightValue.textContent = `${Math.round((1 + this.profile.heightOffset) * 100)}%`;
      this.preview.setProfile(this.profile);
    });
    this.panel.appendChild(heightField);

    const summary = document.createElement('div');
    summary.className = 'phx-confirm';
    summary.innerHTML = `
      <b>${escapeHtml(this.profile.name || 'Безымянный ссыльный')}</b><br>
      ${race.name} · ${GENDERS[this.profile.gender].name} · ${background.name}<br>
      <small>${race.passive}<br><b>Q — ${race.ability.name}:</b> ${race.ability.description}</small>
    `;
    this.panel.appendChild(summary);
  }

  renderNavigation() {
    const actions = document.createElement('div');
    actions.className = 'phx-actions';
    if (this.step > 0) actions.appendChild(button('Назад', 'secondary', () => { this.step -= 1; this.render(); }));
    if (this.onCancel) actions.appendChild(button('Отмена', 'secondary', () => this.cancel()));
    const spacer = document.createElement('span');
    spacer.className = 'grow';
    actions.appendChild(spacer);
    if (this.step < 3) {
      actions.appendChild(button('Далее', '', () => {
        if (this.step === 0) this.profile = normalizeCharacterProfile(this.profile);
        this.step += 1;
        this.render();
      }));
    } else {
      actions.appendChild(button('Начать ссылку', '', () => this.confirm()));
    }
    this.panel.appendChild(actions);
  }

  render() {
    this.panel.innerHTML = '';
    if (this.step === 0) this.renderStepOne();
    if (this.step === 1) this.renderStepTwo();
    if (this.step === 2) this.renderStepThree();
    if (this.step === 3) this.renderStepFour();
    this.renderNavigation();
  }

  confirm() {
    const profile = normalizeCharacterProfile(this.profile);
    this.destroy();
    this.onConfirm?.(profile);
  }

  cancel() {
    this.destroy();
    this.onCancel?.();
  }

  destroy() {
    this.preview.dispose();
    this.root.remove();
  }
}

export function openCharacterCreator(options) {
  return new CharacterCreator(options);
}
