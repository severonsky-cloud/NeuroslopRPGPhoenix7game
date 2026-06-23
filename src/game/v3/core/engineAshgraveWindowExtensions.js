const STORAGE_KEY = 'phoenix7_ashgrave_window_layout_v2';

function installWindowStyle() {
  if (document.getElementById('ashgraveWindowStyle')) return;
  const style = document.createElement('style');
  style.id = 'ashgraveWindowStyle';
  style.textContent = `
    #panel.ashWindowShell{position:fixed;box-sizing:border-box;display:none;right:auto!important;bottom:auto!important;padding:0!important;overflow:hidden!important;background:linear-gradient(145deg,rgba(35,24,16,.98),rgba(8,6,5,.98))!important;border:1px solid rgba(216,166,77,.62)!important;border-radius:14px!important;box-shadow:0 24px 90px rgba(0,0,0,.58),inset 0 0 0 1px rgba(255,229,172,.06);color:#f4dfb8;pointer-events:auto;z-index:64;max-height:none!important;}
    .ashWindowHeader{height:38px;display:flex;align-items:center;gap:10px;padding:0 10px 0 12px;cursor:move;user-select:none;background:linear-gradient(90deg,rgba(216,166,77,.22),rgba(0,0,0,.12));border-bottom:1px solid rgba(216,166,77,.25);}
    .ashWindowTitle{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ffd997;font:900 13px/1 system-ui;letter-spacing:.06em;text-transform:uppercase;text-shadow:0 1px 8px #000;}
    .ashWindowHint{color:#a99170;font:700 11px/1 system-ui;white-space:nowrap;}
    .ashWindowBody{height:calc(100% - 38px);overflow:auto;padding:14px;scrollbar-width:thin;scrollbar-color:#8b6a32 rgba(0,0,0,.18);}
    .ashWindowBody::-webkit-scrollbar{width:9px;height:9px}.ashWindowBody::-webkit-scrollbar-thumb{background:#8b6a32;border-radius:999px}.ashWindowBody::-webkit-scrollbar-track{background:rgba(0,0,0,.18)}
    .ashWindowResize{position:absolute;right:0;bottom:0;width:19px;height:19px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 0 45%,rgba(216,166,77,.7) 46% 55%,transparent 56%),linear-gradient(135deg,transparent 0 66%,rgba(216,166,77,.55) 67% 75%,transparent 76%);opacity:.9;}
    #panel.ashWindowShell button,#panel.ashWindowShell a.btn{box-shadow:0 6px 22px rgba(0,0,0,.24)}
    @media(max-width:720px){#panel.ashWindowShell{left:8px!important;top:8px!important;width:calc(100vw - 16px)!important;height:calc(100vh - 16px)!important}.ashWindowHint{display:none}}
  `;
  document.head.appendChild(style);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function defaultLayout() {
  const w = Math.min(820, Math.max(460, window.innerWidth - 48));
  const h = Math.min(690, Math.max(380, window.innerHeight - 52));
  return { x: Math.max(18, window.innerWidth - w - 18), y: 18, w, h };
}

function clampLayout(layout) {
  const minW = Math.min(380, Math.max(280, window.innerWidth - 20));
  const minH = Math.min(260, Math.max(220, window.innerHeight - 20));
  const w = clamp(Number(layout.w) || minW, minW, Math.max(minW, window.innerWidth - 16));
  const h = clamp(Number(layout.h) || minH, minH, Math.max(minH, window.innerHeight - 16));
  const x = clamp(Number(layout.x) || 8, 8, Math.max(8, window.innerWidth - w - 8));
  const y = clamp(Number(layout.y) || 8, 8, Math.max(8, window.innerHeight - h - 8));
  return { x, y, w, h };
}

function loadLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') return clampLayout(saved);
  } catch {}
  return clampLayout(defaultLayout());
}

function saveLayout(panel) {
  if (!panel) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      x: parseFloat(panel.style.left) || 0,
      y: parseFloat(panel.style.top) || 0,
      w: parseFloat(panel.style.width) || panel.offsetWidth,
      h: parseFloat(panel.style.height) || panel.offsetHeight,
    }));
  } catch {}
}

function applyLayout(panel, layout) {
  const next = clampLayout(layout);
  panel.style.left = `${next.x}px`;
  panel.style.top = `${next.y}px`;
  panel.style.width = `${next.w}px`;
  panel.style.height = `${next.h}px`;
}

function inferTitle(html) {
  const text = String(html || '');
  const route = text.match(/class=["']routeNpcTitle["'][^>]*>([^<]+)/i);
  if (route?.[1]) return route[1].trim();
  const h2 = text.match(/<h2[^>]*>(.*?)<\/h2>/is);
  if (h2?.[1]) return h2[1].replace(/<[^>]+>/g, '').trim();
  return 'Ashgrave panel';
}

function bindDrag(panel, header) {
  let drag = null;
  header.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    drag = {
      sx: event.clientX,
      sy: event.clientY,
      x: parseFloat(panel.style.left) || panel.getBoundingClientRect().left,
      y: parseFloat(panel.style.top) || panel.getBoundingClientRect().top,
    };
    event.preventDefault();
  });
  window.addEventListener('mousemove', (event) => {
    if (!drag) return;
    applyLayout(panel, {
      x: drag.x + event.clientX - drag.sx,
      y: drag.y + event.clientY - drag.sy,
      w: parseFloat(panel.style.width) || panel.offsetWidth,
      h: parseFloat(panel.style.height) || panel.offsetHeight,
    });
  });
  window.addEventListener('mouseup', () => {
    if (!drag) return;
    drag = null;
    saveLayout(panel);
  });
  header.addEventListener('dblclick', () => {
    applyLayout(panel, defaultLayout());
    saveLayout(panel);
  });
}

function bindResize(panel, handle) {
  let resize = null;
  handle.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    resize = {
      sx: event.clientX,
      sy: event.clientY,
      x: parseFloat(panel.style.left) || panel.getBoundingClientRect().left,
      y: parseFloat(panel.style.top) || panel.getBoundingClientRect().top,
      w: parseFloat(panel.style.width) || panel.offsetWidth,
      h: parseFloat(panel.style.height) || panel.offsetHeight,
    };
    event.preventDefault();
    event.stopPropagation();
  });
  window.addEventListener('mousemove', (event) => {
    if (!resize) return;
    applyLayout(panel, {
      x: resize.x,
      y: resize.y,
      w: resize.w + event.clientX - resize.sx,
      h: resize.h + event.clientY - resize.sy,
    });
  });
  window.addEventListener('mouseup', () => {
    if (!resize) return;
    resize = null;
    saveLayout(panel);
  });
}

function decoratePanel(panel, html) {
  installWindowStyle();
  panel.classList.add('ashWindowShell');
  const title = inferTitle(html);
  panel.innerHTML = `<div class="ashWindowHeader"><div class="ashWindowTitle">${title}</div><div class="ashWindowHint">drag · resize · double click reset</div></div><div class="ashWindowBody">${html}</div><div class="ashWindowResize" aria-hidden="true"></div>`;
  applyLayout(panel, loadLayout());
  const header = panel.querySelector('.ashWindowHeader');
  const handle = panel.querySelector('.ashWindowResize');
  bindDrag(panel, header);
  bindResize(panel, handle);
}

export function installAshgraveWindowExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__ashgraveWindowInstalled) return;
  PhoenixV3Engine.__ashgraveWindowInstalled = true;

  PhoenixV3Engine.prototype.installAshgraveWindowShell = function installAshgraveWindowShell() {
    if (!this.hud?.panel || this.hud.__ashgraveWindowWrapped) return;
    this.hud.__ashgraveWindowWrapped = true;
    const panel = this.hud.panel;
    const originalClosePanel = this.hud.closePanel.bind(this.hud);
    this.hud.openPanel = (html) => {
      decoratePanel(panel, html);
      panel.style.display = 'block';
    };
    this.hud.closePanel = () => {
      saveLayout(panel);
      originalClosePanel();
    };
    window.addEventListener('resize', () => {
      if (panel.style.display !== 'none') {
        applyLayout(panel, loadLayout());
        saveLayout(panel);
      }
    });
  };

  const originalBoot = PhoenixV3Engine.prototype.boot;
  PhoenixV3Engine.prototype.boot = function bootAshgraveWindows(...args) {
    const result = originalBoot.call(this, ...args);
    this.installAshgraveWindowShell();
    return result;
  };
}
