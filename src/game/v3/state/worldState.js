// Serializable world state, kept separate from the character profile.
// Holds boolean flags, quest stages, and a "seen" set for one-time effects.
const KEY = 'phoenix7_v3_world_state';
const VERSION = 1;

function freshState() {
  return { version: VERSION, flags: {}, quests: {}, seen: {} };
}

export class WorldState {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === VERSION) return { ...freshState(), ...parsed };
      }
    } catch (err) { /* fall through to fresh state */ }
    return freshState();
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (err) { /* storage unavailable */ }
  }

  reset() { this.data = freshState(); this.save(); }

  getFlag(name) { return !!this.data.flags[name]; }
  setFlag(name, value = true) { this.data.flags[name] = !!value; this.save(); }

  questStage(id) { return this.data.quests[id]?.stage ?? 0; }

  // Monotonic by default so re-reading a dialogue can never regress a quest.
  setQuestStage(id, stage) {
    const quest = this.data.quests[id] || (this.data.quests[id] = { stage: 0 });
    quest.stage = Math.max(quest.stage || 0, Number(stage) || 0);
    this.save();
    return quest.stage;
  }

  // One-time guard for effects (gives credits / sets a flag exactly once).
  markSeen(key) {
    if (this.data.seen[key]) return false;
    this.data.seen[key] = true;
    this.save();
    return true;
  }

  hasSeen(key) { return !!this.data.seen[key]; }

  activeQuests() {
    return Object.entries(this.data.quests)
      .filter(([, q]) => (q.stage || 0) > 0)
      .map(([id, q]) => ({ id, stage: q.stage }));
  }
}
