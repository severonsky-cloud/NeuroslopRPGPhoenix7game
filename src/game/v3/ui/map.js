export function mapHtml({ locations, biomes, player }) {
  return `
    <h2>Карта Phoenix7 v3</h2>
    <p>Новая архитектурная карта. Игрок: x ${player.x.toFixed(1)}, z ${player.z.toFixed(1)}</p>
    <h3>Биомы</h3>
    ${biomes.map(b => `<div class="line"><b>${b.name}</b> — центр ${b.center[0]}, ${b.center[1]}</div>`).join('')}
    <h3>Локации</h3>
    ${locations.map(l => `<div class="line"><b>${l.name}</b> — ${l.type} · ${l.x}, ${l.z}</div>`).join('')}
    <p><button id="closeMapBtn">Закрыть</button></p>
  `;
}

export function journalHtml(lines = []) {
  return `
    <h2>Журнал v3</h2>
    ${lines.map(l => `<div class="line">${l}</div>`).join('') || '<p>Пока пусто.</p>'}
    <p><button id="closeMapBtn">Закрыть</button></p>
  `;
}
