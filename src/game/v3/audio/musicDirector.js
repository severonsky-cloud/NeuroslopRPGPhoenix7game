export class MusicDirector {
  constructor() {
    this.ctx = null;
    this.audio = null;
    this.started = false;
    this.fallbackNodes = [];
    this.trackCandidates = [];
  }

  ensureCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume?.();
    return this.ctx;
  }

  async start() {
    if (this.started) return;
    this.started = true;
    for (const src of this.trackCandidates) {
      const ok = await this.tryAudio(src);
      if (ok) return;
    }
    this.startFallbackDrone();
  }

  async tryAudio(src) {
    return new Promise(resolve => {
      const a = new Audio(src);
      a.loop = true;
      a.volume = 0.26;
      a.preload = 'auto';
      const done = (ok) => { a.oncanplaythrough = null; a.onerror = null; resolve(ok); };
      a.oncanplaythrough = async () => {
        try { await a.play(); this.audio = a; done(true); } catch { done(false); }
      };
      a.onerror = () => done(false);
      setTimeout(() => done(false), 1200);
    });
  }

  startFallbackDrone() {
    const ctx = this.ensureCtx();
    const master = ctx.createGain();
    master.gain.value = 0.045;
    master.connect(ctx.destination);
    const freqs = [55, 82.5, 110, 164.8];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = f;
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      gain.gain.value = 0.12 / freqs.length;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();
      this.fallbackNodes.push(osc, gain, filter);
    }
    this.fallbackTimer = setInterval(() => {
      if (!this.ctx) return;
      for (const n of this.fallbackNodes) {
        if (n.frequency) n.frequency.setTargetAtTime(n.frequency.value * (0.995 + Math.random() * 0.01), this.ctx.currentTime, 1.2);
      }
    }, 1800);
  }

  setCombatIntensity(level) {
    const v = Math.max(0, Math.min(1, level));
    if (this.audio) this.audio.volume = 0.22 + v * 0.12;
  }
}
