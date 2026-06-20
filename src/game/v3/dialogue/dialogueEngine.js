// Runtime for the Morrowind-style topic dialogue. Pure logic — no DOM.
// The data format lives in dialogueData.js (that is where dialogue is authored).
import { normalizePlayerCulture } from '../data/settlementsData.js';

function asArray(value) {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

// Build the condition context once per conversation from the live player state.
export function buildContext(engine) {
  const profile = engine.player?.characterProfile || {};
  const culture = normalizePlayerCulture({
    race: profile.race ?? engine.player?.race,
    background: profile.background ?? engine.player?.background,
    gender: profile.gender ?? engine.player?.gender,
  });
  const skills = engine.player?.rpg?.skills || {};
  const items = engine.player?.inventory || [];
  return {
    race: culture.race,
    background: culture.background,
    gender: culture.gender,
    ws: engine.worldState,
    skill: (key) => skills[key]?.level || 0,
    hasItem: (name) => items.includes(name),
    rng: Math.random,
  };
}

function compare(value, expr) {
  const match = String(expr).trim().match(/^(>=|<=|>|<|=)?\s*(-?\d+)$/);
  if (!match) return false;
  const op = match[1] || '=';
  const n = Number(match[2]);
  switch (op) {
    case '>=': return value >= n;
    case '<=': return value <= n;
    case '>': return value > n;
    case '<': return value < n;
    default: return value === n;
  }
}

// All keys present in `when` must pass (logical AND). Omit `when` for "always".
export function condOk(when, ctx) {
  if (!when) return true;
  if (when.race && !asArray(when.race).includes(ctx.race)) return false;
  if (when.notRace && asArray(when.notRace).includes(ctx.race)) return false;
  if (when.background && !asArray(when.background).includes(ctx.background)) return false;
  if (when.gender && !asArray(when.gender).includes(ctx.gender)) return false;
  for (const flag of asArray(when.flag)) if (!ctx.ws.getFlag(flag)) return false;
  for (const flag of asArray(when.notFlag)) if (ctx.ws.getFlag(flag)) return false;
  if (when.quest) {
    for (const [id, expr] of Object.entries(when.quest)) {
      if (!compare(ctx.ws.questStage(id), expr)) return false;
    }
  }
  if (when.skillAbove) {
    for (const [key, n] of Object.entries(when.skillAbove)) {
      if (ctx.skill(key) < n) return false;
    }
  }
  for (const item of asArray(when.hasItem)) if (!ctx.hasItem(item)) return false;
  if (typeof when.chance === 'number' && ctx.rng() > when.chance) return false;
  return true;
}

// First response whose condition passes wins, so authors order specific -> general.
export function pickResponse(responses, ctx) {
  for (const response of asArray(responses)) {
    if (condOk(response.when, ctx)) return response;
  }
  return null;
}

// Apply an array of effects. `once: true` effects fire a single time ever,
// guarded by the world-state seen-set under `onceKey`.
export function applyEffects(effects, ctx, engine, onceKey) {
  for (const effect of asArray(effects)) {
    if (effect.once && onceKey) {
      const key = `${onceKey}:${effect.type}:${effect.flag || effect.id || effect.amount || ''}`;
      if (!ctx.ws.markSeen(key)) continue;
    }
    switch (effect.type) {
      case 'setFlag': ctx.ws.setFlag(effect.flag, effect.value ?? true); break;
      case 'quest': ctx.ws.setQuestStage(effect.id, effect.stage); break;
      case 'credits': if (engine.player) engine.player.credits = (engine.player.credits || 0) + (effect.amount || 0); break;
      case 'journal': if (effect.text) engine.log?.unshift?.(effect.text); break;
      default: break;
    }
  }
}
