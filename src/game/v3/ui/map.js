function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function mapProjector(bounds, width, height, padding) {
  const rangeX = Math.max(1, bounds.maxX - bounds.minX);
  const rangeZ = Math.max(1, bounds.maxZ - bounds.minZ);
  return ({ x, z }) => ({
    x: padding + ((x - bounds.minX) / rangeX) * (width - padding * 2),
    y: height - padding - ((z - bounds.minZ) / rangeZ) * (height - padding * 2),
  });
}

function riskColor(risk) {
  return ['#82a66a', '#c0a85a', '#d68842', '#c45c36', '#9d302c'][Math.max(0, Math.min(4, Number(risk || 1) - 1))];
}

export function mapHtml({ locations = [], biomes = [], player, roads = [], settlements = [], bounds = null }) {
  if (!bounds || !settlements.length) {
    return `
      <h2>Карта Phoenix7 v3</h2>
      <p>Игрок: x ${player.x.toFixed(1)}, z ${player.z.toFixed(1)}</p>
      <h3>Биомы</h3>
      ${biomes.map((b) => `<div class="line"><b>${escapeHtml(b.name)}</b> — центр ${b.center[0]}, ${b.center[1]}</div>`).join('')}
      <h3>Локации</h3>
      ${locations.map((l) => `<div class="line"><b>${escapeHtml(l.name)}</b> — ${escapeHtml(l.type)} · ${l.x}, ${l.z}</div>`).join('')}
      <p><button id="closeMapBtn">Закрыть</button></p>
    `;
  }

  const width = 760;
  const height = 610;
  const padding = 34;
  const project = mapProjector(bounds, width, height, padding);
  const playerPoint = project(player);
  const grid = [];
  for (let x = Math.ceil(bounds.minX / 100) * 100; x <= bounds.maxX; x += 100) {
    const a = project({ x, z: bounds.minZ });
    const b = project({ x, z: bounds.maxZ });
    grid.push(`<path d="M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}"/><text x="${a.x.toFixed(1)}" y="${height - 8}">${x}</text>`);
  }
  for (let z = Math.ceil(bounds.minZ / 100) * 100; z <= bounds.maxZ; z += 100) {
    const a = project({ x: bounds.minX, z });
    const b = project({ x: bounds.maxX, z });
    grid.push(`<path d="M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}"/><text x="4" y="${(a.y - 3).toFixed(1)}">${z}</text>`);
  }
  const roadSvg = roads.map((road, index) => {
    const points = road.map((point) => {
      const p = project(point);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
    return `<polyline class="${index === 0 ? 'official-road' : 'minor-road'}" points="${points}"/>`;
  }).join('');
  const biomeSvg = biomes.map((biome) => {
    const p = project({ x: biome.center[0], z: biome.center[1] });
    return `<g class="biome-mark"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="29"/><text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}">${escapeHtml(biome.name)}</text></g>`;
  }).join('');
  const locationSvg = locations.map((location) => {
    const p = project(location);
    return `<g class="location-mark"><rect x="${(p.x - 2.5).toFixed(1)}" y="${(p.y - 2.5).toFixed(1)}" width="5" height="5"/><text x="${(p.x + 6).toFixed(1)}" y="${(p.y + 3).toFixed(1)}">${escapeHtml(location.name)}</text></g>`;
  }).join('');
  const settlementSvg = settlements.map((settlement, index) => {
    const p = project(settlement);
    // The eight nodes cluster tightly; fan labels outward (left/right of the
    // cluster split near x≈24) across four vertical tiers with a thin leader
    // line so the names no longer overlap each other on the parchment map.
    const leftSide = settlement.x < 24;
    const dx = leftSide ? -11 : 11;
    const anchor = leftSide ? 'end' : 'start';
    const dy = -20 + (index % 4) * 13;
    const tx = (p.x + dx).toFixed(1);
    const ty = (p.y + dy).toFixed(1);
    return `<g class="settlement-node" data-settlement-map="${escapeHtml(settlement.id)}" tabindex="0" role="button" aria-label="${escapeHtml(settlement.name)}">
      <line class="settlement-leader" x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${tx}" y2="${ty}"/>
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7" fill="${riskColor(settlement.riskLevel)}"/>
      <text x="${tx}" y="${ty}" text-anchor="${anchor}">${escapeHtml(settlement.name)}</text>
    </g>`;
  }).join('');
  const first = settlements[0];

  return `
    <style>
      .phoenix-map{background:#b89562;color:#24170e;border:2px solid #54351f;padding:10px;box-shadow:inset 0 0 45px #6d4729;font-family:Georgia,serif}
      .phoenix-map svg{display:block;width:100%;height:auto;background:radial-gradient(circle at 35% 25%,#d0b17a,#9e7447);border:1px solid #4d321e}
      .phoenix-map .grid path{stroke:#5d4935;stroke-width:.55;opacity:.42}.phoenix-map .grid text{font-size:9px;fill:#4c3827}
      .phoenix-map .official-road{fill:none;stroke:#4b291a;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;opacity:.88}
      .phoenix-map .minor-road{fill:none;stroke:#70513a;stroke-width:2;stroke-dasharray:7 5;opacity:.75}
      .phoenix-map .biome-mark circle{fill:#775b3e;opacity:.11;stroke:#5d452f;stroke-width:1}
      .phoenix-map .biome-mark text{font-size:8px;text-anchor:middle;fill:#513923;opacity:.7}
      .phoenix-map .location-mark rect{fill:#342116;opacity:.8}.phoenix-map .location-mark text{font-size:7px;fill:#45301f;opacity:.72}
      .phoenix-map .settlement-node{cursor:pointer}.phoenix-map .settlement-node circle{stroke:#21130c;stroke-width:2}
      .phoenix-map .settlement-leader{stroke:#5a3d23;stroke-width:1;opacity:.55}
      .phoenix-map .settlement-node:hover circle,.phoenix-map .settlement-node:focus circle{stroke:#f4d48a;stroke-width:4}
      .phoenix-map .settlement-node text{font-size:9px;font-weight:700;fill:#24170e;paint-order:stroke;stroke:#c8a875;stroke-width:2px}
      .phoenix-map .player-marker{fill:#f5df9d;stroke:#7f1f1b;stroke-width:3}
      .settlement-map-list button{margin:3px 3px 3px 0;background:#6f4528;color:#f4ddb0;border:1px solid #321b0e;padding:5px 7px}
    </style>
    <h2>Имперский дорожный план: Порт Рейчел — Форт Заря</h2>
    <p>Игрок: x ${player.x.toFixed(1)}, z ${player.z.toFixed(1)} · цвет узла показывает риск 1–5.</p>
    <div class="phoenix-map">
      <svg viewBox="0 0 ${width} ${height}" aria-label="Карта мира Phoenix7">
        <g class="grid">${grid.join('')}</g>
        <g>${biomeSvg}</g>
        <g>${roadSvg}</g>
        <g>${locationSvg}</g>
        <g>${settlementSvg}</g>
        <path class="player-marker" d="M${playerPoint.x.toFixed(1)} ${(playerPoint.y - 10).toFixed(1)}l8 17h-16z"/>
      </svg>
    </div>
    <div class="settlement-map-list">
      ${settlements.map((settlement) => `<button data-settlement-map="${escapeHtml(settlement.id)}">${escapeHtml(settlement.name)} · ${settlement.riskLevel}/5</button>`).join('')}
    </div>
    <div id="settlementMapDetails" class="line">
      <h3>${escapeHtml(first.name)} · риск ${first.riskLevel}/5</h3>
      <p>${escapeHtml(first.description)}</p>
      <p><b>Услуги:</b> ${first.services.map(escapeHtml).join(', ')}</p>
      <p><b>Координаты:</b> ${first.x}, ${first.z}</p>
    </div>
    <p><button id="closeMapBtn">Закрыть</button></p>
  `;
}

export function settlementDetailsHtml(settlement) {
  return `
    <h3>${escapeHtml(settlement.name)} · риск ${settlement.riskLevel}/5</h3>
    <p>${escapeHtml(settlement.description)}</p>
    <p><b>Услуги:</b> ${settlement.services.map(escapeHtml).join(', ')}</p>
    <p><b>Жители:</b> ${settlement.npcRoles.map(escapeHtml).join(', ')}</p>
    <p><b>Координаты:</b> ${settlement.x}, ${settlement.z}</p>
  `;
}

export function journalHtml(lines = [], settlements = []) {
  return `
    <h2>Журнал v3</h2>
    ${lines.map((line) => `<div class="line">${line}</div>`).join('') || '<p>Пока пусто.</p>'}
    ${settlements.length ? `
      <h3>Поселения тракта</h3>
      ${settlements.map((settlement) => `
        <div class="line">
          <b>${escapeHtml(settlement.name)}</b> · риск ${settlement.riskLevel}/5 · ${settlement.x}, ${settlement.z}<br>
          ${escapeHtml(settlement.description)}<br>
          <small>Услуги: ${settlement.services.map(escapeHtml).join(', ')}</small>
        </div>
      `).join('')}
    ` : ''}
    <p><button id="closeMapBtn">Закрыть</button></p>
  `;
}
