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

export function mapHtml({ locations = [], biomes = [], player, roads = [], settlements = [], bounds = null, pois = [] }) {
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
    const tx = p.x.toFixed(1);
    const ty = (p.y + 4).toFixed(1);
    return `<g class="biome-mark"><circle cx="${tx}" cy="${p.y.toFixed(1)}" r="29"/><text x="${tx}" y="${ty}" data-map-text-x="${tx}" data-map-text-y="${ty}">${escapeHtml(biome.name)}</text></g>`;
  }).join('');
  const locationSvg = locations.map((location) => {
    const p = project(location);
    const tx = (p.x + 6).toFixed(1);
    const ty = (p.y + 3).toFixed(1);
    return `<g class="location-mark"><rect x="${(p.x - 2.5).toFixed(1)}" y="${(p.y - 2.5).toFixed(1)}" width="5" height="5"/><text x="${tx}" y="${ty}" data-map-text-x="${tx}" data-map-text-y="${ty}">${escapeHtml(location.name)}</text></g>`;
  }).join('');
  const settlementSvg = settlements.map((settlement) => {
    const p = project(settlement);
    const tx = (p.x + 10).toFixed(1);
    const ty = (p.y - 8).toFixed(1);
    return `<g class="settlement-node" data-settlement-map="${escapeHtml(settlement.id)}" tabindex="0" role="button" aria-label="${escapeHtml(settlement.name)}">
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7" fill="${riskColor(settlement.riskLevel)}"/>
      <text x="${tx}" y="${ty}" data-map-text-x="${tx}" data-map-text-y="${ty}">${escapeHtml(settlement.name)}</text>
    </g>`;
  }).join('');
  const poiSvg = pois.map((poi) => {
    const p = project(poi);
    const cx = p.x.toFixed(1);
    const cy = p.y.toFixed(1);
    const tx = (p.x + 8).toFixed(1);
    const ty = (p.y + 3).toFixed(1);
    return `<g class="poi-mark"><path d="M${cx} ${(p.y - 6).toFixed(1)}L${(p.x + 6).toFixed(1)} ${cy}L${cx} ${(p.y + 6).toFixed(1)}L${(p.x - 6).toFixed(1)} ${cy}Z"/><text x="${tx}" y="${ty}" data-map-text-x="${tx}" data-map-text-y="${ty}">${escapeHtml(poi.name)}</text></g>`;
  }).join('');
  const first = settlements[0];

  return `
    <style>
      .phoenix-map{background:#b89562;color:#24170e;border:2px solid #54351f;padding:10px;box-shadow:inset 0 0 45px #6d4729;font-family:Georgia,serif}
      .phoenix-map{position:relative;overflow:hidden}
      .phoenix-map svg{display:block;width:100%;height:auto;touch-action:none;cursor:grab;background:radial-gradient(circle at 35% 25%,#d0b17a,#9e7447);border:1px solid #4d321e}
      .phoenix-map svg.map-dragging{cursor:grabbing}
      .phoenix-map .grid path{stroke:#5d4935;stroke-width:.55;opacity:.42}.phoenix-map .grid text{font-size:9px;fill:#4c3827}
      .phoenix-map .official-road{fill:none;stroke:#4b291a;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;opacity:.88}
      .phoenix-map .minor-road{fill:none;stroke:#70513a;stroke-width:2;stroke-dasharray:7 5;opacity:.75}
      .phoenix-map .biome-mark circle{fill:#775b3e;opacity:.11;stroke:#5d452f;stroke-width:1}
      .phoenix-map .biome-mark text{font-size:10px;text-anchor:middle;fill:#513923;opacity:.7}
      .phoenix-map .location-mark rect{fill:#342116;opacity:.8}.phoenix-map .location-mark text{display:none;font-size:9px;fill:#45301f;opacity:.72}
      .phoenix-map .settlement-node{cursor:pointer}.phoenix-map .settlement-node circle{stroke:#21130c;stroke-width:2}
      .phoenix-map .settlement-node:hover circle,.phoenix-map .settlement-node:focus circle{stroke:#f4d48a;stroke-width:4}
      .phoenix-map .settlement-node text{display:none;font-size:13px;font-weight:700;fill:#24170e;paint-order:stroke;stroke:#c8a875;stroke-width:2px}
      .phoenix-map.map-show-settlements .settlement-node text,.phoenix-map .settlement-node.map-selected text{display:block}
      .phoenix-map.map-show-locations .location-mark text{display:block}
      .phoenix-map .poi-mark path{fill:#6f5cff;stroke:#1a1330;stroke-width:1.5;opacity:.92}
      .phoenix-map .poi-mark text{font-size:9px;font-weight:700;fill:#241a52;paint-order:stroke;stroke:#cdbce6;stroke-width:1.6px}
      .phoenix-map .player-marker{fill:#f5df9d;stroke:#7f1f1b;stroke-width:3}
      .map-controls{position:absolute;z-index:2;right:16px;top:16px;display:flex;gap:4px;align-items:center;background:rgba(54,34,19,.82);border:1px solid #321b0e;padding:5px}
      .map-controls button{min-width:32px;margin:0;padding:5px 8px;background:#d0aa6f;color:#24170e;border:1px solid #51321d}
      .map-zoom-value{min-width:44px;text-align:center;color:#f4ddb0;font:700 12px system-ui}
      .settlement-map-list button{margin:3px 3px 3px 0;background:#6f4528;color:#f4ddb0;border:1px solid #321b0e;padding:5px 7px}
    </style>
    <h2>Имперский дорожный план: Порт Рейчел — Форт Заря</h2>
    <p>Игрок: x ${player.x.toFixed(1)}, z ${player.z.toFixed(1)} · цвет узла показывает риск 1–5.</p>
    <div class="phoenix-map" id="phoenixWorldMap">
      <div class="map-controls">
        <button type="button" id="mapZoomOut" aria-label="Уменьшить карту">−</button>
        <span class="map-zoom-value" id="mapZoomValue">1.0×</span>
        <button type="button" id="mapZoomIn" aria-label="Увеличить карту">+</button>
        <button type="button" id="mapZoomReset">Сброс</button>
      </div>
      <svg id="phoenixWorldMapSvg" viewBox="0 0 ${width} ${height}" data-map-width="${width}" data-map-height="${height}" aria-label="Карта мира Phoenix7">
        <g class="grid">${grid.join('')}</g>
        <g>${biomeSvg}</g>
        <g>${roadSvg}</g>
        <g>${locationSvg}</g>
        <g>${settlementSvg}</g>
        <g>${poiSvg}</g>
        <path class="player-marker" d="M${playerPoint.x.toFixed(1)} ${(playerPoint.y - 10).toFixed(1)}l8 17h-16z"/>
      </svg>
    </div>
    <small>Колесо — масштаб · перетаскивание — движение · названия поселений появляются от 1.6×, малых мест — от 2.5×.</small>
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

export function journalHtml(lines = [], settlements = [], discoveries = []) {
  return `
    <h2>Журнал v3</h2>
    ${lines.map((line) => `<div class="line">${line}</div>`).join('') || '<p>Пока пусто.</p>'}
    ${discoveries.length ? `
      <h3>Находки тракта (${discoveries.length})</h3>
      ${discoveries.map((poi) => `
        <div class="line">
          <b>◆ ${escapeHtml(poi.name)}</b> · ${poi.x}, ${poi.z}<br>
          ${escapeHtml(poi.lore)}
        </div>
      `).join('')}
    ` : ''}
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
