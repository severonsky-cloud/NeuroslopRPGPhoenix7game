const SAVE_KEY = 'phoenix7_v3_architecture_save';

export function saveGame(snapshot) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...snapshot, savedAt: Date.now() }));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
