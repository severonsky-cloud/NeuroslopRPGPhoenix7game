export const WORLD_STATE_KEY = 'phoenix7_v3_world_state';
export const WORLD_STATE_VERSION = 2;

const LEGACY_TAX_STAGES = Object.freeze({
  1: 10,
  2: 21,
  3: 22,
  4: 29,
});

function freshState() {
  return {
    version: WORLD_STATE_VERSION,
    flags: {},
    quests: {},
    seen: {},
    questItems: {},
    rewards: {},
    reputation: {
      factions: {},
      locations: {},
    },
  };
}

function normalizeQuest(id, raw = {}) {
  const legacyStage = id === 'tax_and_clay' ? LEGACY_TAX_STAGES[raw.stage] : null;
  const stage = legacyStage ?? Math.max(0, Number(raw.stage) || 0);
  const migratedOutcome = id === 'tax_and_clay' && stage === 29 ? 'assassination' : null;
  return {
    stage,
    route: raw.route || (stage >= 20 && stage < 30 ? 'assassination' : null),
    status: raw.status || (migratedOutcome ? 'complete' : stage > 0 ? 'active' : 'inactive'),
    outcome: raw.outcome || migratedOutcome,
    vars: raw.vars && typeof raw.vars === 'object' ? { ...raw.vars } : {},
  };
}

export function migrateWorldState(raw) {
  const next = freshState();
  if (!raw || typeof raw !== 'object') return next;

  next.flags = { ...(raw.flags || {}) };
  next.seen = { ...(raw.seen || {}) };
  next.questItems = { ...(raw.questItems || {}) };
  next.rewards = { ...(raw.rewards || {}) };
  next.reputation = {
    factions: { ...(raw.reputation?.factions || {}) },
    locations: { ...(raw.reputation?.locations || {}) },
  };
  for (const [id, quest] of Object.entries(raw.quests || {})) {
    next.quests[id] = normalizeQuest(id, quest);
  }
  next.version = WORLD_STATE_VERSION;
  return next;
}

function storageOrDefault(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

export class WorldState {
  constructor(storage = null) {
    this.storage = storageOrDefault(storage);
    this.data = this.load();
  }

  load() {
    try {
      const raw = this.storage?.getItem?.(WORLD_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const migrated = migrateWorldState(parsed);
        if (parsed.version !== WORLD_STATE_VERSION) this.storage?.setItem?.(WORLD_STATE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch {
      // A fresh state is safer than blocking boot when localStorage is unavailable.
    }
    return freshState();
  }

  save() {
    try {
      this.storage?.setItem?.(WORLD_STATE_KEY, JSON.stringify(this.data));
    } catch {
      // Quests remain playable for the current session without persistent storage.
    }
  }

  reset() {
    this.data = freshState();
    this.save();
  }

  getFlag(name) {
    return !!this.data.flags[name];
  }

  setFlag(name, value = true) {
    this.data.flags[name] = !!value;
    this.save();
    return this.data.flags[name];
  }

  questState(id) {
    if (!this.data.quests[id]) this.data.quests[id] = normalizeQuest(id);
    return this.data.quests[id];
  }

  questStage(id) {
    return this.data.quests[id]?.stage ?? 0;
  }

  setQuestStage(id, stage) {
    const quest = this.questState(id);
    quest.stage = Math.max(quest.stage || 0, Number(stage) || 0);
    if (quest.stage > 0 && quest.status === 'inactive') quest.status = 'active';
    this.save();
    return quest.stage;
  }

  patchQuest(id, patch = {}) {
    const quest = this.questState(id);
    if (patch.stage !== undefined) quest.stage = Math.max(0, Number(patch.stage) || 0);
    if (patch.route !== undefined) quest.route = patch.route;
    if (patch.status !== undefined) quest.status = patch.status;
    if (patch.outcome !== undefined) quest.outcome = patch.outcome;
    if (patch.vars) quest.vars = { ...quest.vars, ...patch.vars };
    this.save();
    return quest;
  }

  markSeen(key) {
    if (this.data.seen[key]) return false;
    this.data.seen[key] = true;
    this.save();
    return true;
  }

  hasSeen(key) {
    return !!this.data.seen[key];
  }

  addQuestItem(id, amount = 1) {
    const next = Math.max(0, (Number(this.data.questItems[id]) || 0) + amount);
    this.data.questItems[id] = next;
    this.save();
    return next;
  }

  removeQuestItem(id, amount = 1) {
    const next = Math.max(0, (Number(this.data.questItems[id]) || 0) - amount);
    if (next) this.data.questItems[id] = next;
    else delete this.data.questItems[id];
    this.save();
    return next;
  }

  hasQuestItem(id, amount = 1) {
    return (Number(this.data.questItems[id]) || 0) >= amount;
  }

  changeReputation(scope, id, delta) {
    if (!['factions', 'locations'].includes(scope) || !id) return 0;
    const table = this.data.reputation[scope];
    table[id] = (Number(table[id]) || 0) + (Number(delta) || 0);
    this.save();
    return table[id];
  }

  grantRewardOnce(key, reward = {}) {
    if (!key || this.data.rewards[key]) return false;
    const normalized = {
      credits: Number(reward.credits) || 0,
      items: [...new Set(reward.items || [])],
      reputation: (reward.reputation || []).map((entry) => ({
        scope: entry.scope,
        id: entry.id,
        delta: Number(entry.delta) || 0,
      })),
    };
    this.data.rewards[key] = normalized;
    for (const item of normalized.items) this.data.questItems[item] = Math.max(1, Number(this.data.questItems[item]) || 0);
    for (const entry of normalized.reputation) {
      if (!['factions', 'locations'].includes(entry.scope) || !entry.id) continue;
      const table = this.data.reputation[entry.scope];
      table[entry.id] = (Number(table[entry.id]) || 0) + entry.delta;
    }
    this.save();
    return true;
  }

  applyPersistentRewards(engine) {
    const player = engine?.player;
    if (!player) return { credits: 0, items: [] };
    const totalCredits = Object.values(this.data.rewards)
      .reduce((sum, reward) => sum + (Number(reward.credits) || 0), 0);
    const applied = Number(player.__worldRewardCreditsApplied) || 0;
    if (totalCredits !== applied) {
      player.credits = (Number(player.credits) || 0) + totalCredits - applied;
      player.__worldRewardCreditsApplied = totalCredits;
    }

    const inventoryItems = player.inventoryState?.items;
    const items = Object.keys(this.data.questItems).filter((id) => this.hasQuestItem(id));
    if (Array.isArray(inventoryItems)) {
      for (const id of items) if (!inventoryItems.includes(id)) inventoryItems.push(id);
    }
    return { credits: totalCredits, items };
  }

  activeQuests() {
    return Object.entries(this.data.quests)
      .filter(([, quest]) => (quest.stage || 0) > 0)
      .map(([id, quest]) => ({ id, ...quest, vars: { ...(quest.vars || {}) } }));
  }
}
