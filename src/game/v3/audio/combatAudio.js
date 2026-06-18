export class CombatAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.last = {};
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume?.();
    return this.ctx;
  }

  gate(key, ms = 70) {
    const now = performance.now();
    if ((this.last[key] || 0) + ms > now) return false;
    this.last[key] = now;
    return true;
  }

  tone({ freq = 220, dur = 0.12, type = 'sine', gain = 0.08, slide = 0, pan = 0 }) {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), ctx.currentTime + dur);
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    if (panner) panner.pan.value = pan;
    osc.connect(amp);
    amp.connect(panner || ctx.destination);
    if (panner) panner.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  noise({ dur = 0.08, gain = 0.05, filter = 900, pan = 0 }) {
    const ctx = this.ensure();
    if (!ctx) return;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const amp = ctx.createGain();
    const biquad = ctx.createBiquadFilter();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    biquad.type = 'bandpass';
    biquad.frequency.value = filter;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    if (panner) panner.pan.value = pan;
    src.connect(biquad);
    biquad.connect(amp);
    amp.connect(panner || ctx.destination);
    if (panner) panner.connect(ctx.destination);
    src.start();
  }

  fire(kind = 'rifle') {
    if (!this.gate(`fire_${kind}`, kind === 'smg' ? 30 : 90)) return;
    if (kind === 'smg') {
      this.noise({ dur: 0.045, gain: 0.07, filter: 1300 });
      this.tone({ freq: 110, dur: 0.05, type: 'square', gain: 0.035, slide: -50 });
      return;
    }
    if (kind === 'lmg') {
      this.noise({ dur: 0.07, gain: 0.09, filter: 950 });
      this.tone({ freq: 82, dur: 0.09, type: 'sawtooth', gain: 0.045, slide: -38 });
      return;
    }
    if (kind === 'revolver' || kind === 'nagant') {
      this.noise({ dur: 0.055, gain: 0.065, filter: 1500 });
      this.tone({ freq: 145, dur: 0.06, type: 'square', gain: 0.035, slide: -65 });
      return;
    }
    this.noise({ dur: 0.065, gain: 0.08, filter: 1150 });
    this.tone({ freq: 95, dur: 0.08, type: 'square', gain: 0.04, slide: -45 });
  }

  jam() {
    if (!this.gate('jam', 180)) return;
    this.tone({ freq: 520, dur: 0.035, type: 'square', gain: 0.035, slide: -120 });
    this.tone({ freq: 240, dur: 0.05, type: 'triangle', gain: 0.025, slide: -60 });
  }

  reload(kind = 'rifle') {
    if (!this.gate(`reload_${kind}`, 160)) return;
    this.tone({ freq: 350, dur: 0.05, type: 'triangle', gain: 0.025, slide: -80 });
    setTimeout(() => this.tone({ freq: 260, dur: 0.04, type: 'triangle', gain: 0.022, slide: 70 }), 110);
  }

  melee(kind = 'blade') {
    if (!this.gate(`melee_${kind}`, 90)) return;
    const f = kind === 'club' ? 95 : kind === 'dagger' ? 410 : kind === 'bayonet' ? 330 : 210;
    this.noise({ dur: 0.045, gain: kind === 'club' ? 0.055 : 0.035, filter: kind === 'club' ? 330 : 1250 });
    this.tone({ freq: f, dur: 0.06, type: 'triangle', gain: 0.025, slide: kind === 'club' ? -35 : 90 });
  }

  hit(kind = 'body') {
    if (!this.gate(`hit_${kind}`, 60)) return;
    this.noise({ dur: 0.055, gain: kind === 'armor' ? 0.06 : 0.04, filter: kind === 'armor' ? 620 : 420 });
  }

  phase() {
    if (!this.gate('phase', 120)) return;
    this.tone({ freq: 180, dur: 0.16, type: 'sine', gain: 0.04, slide: 420 });
    this.tone({ freq: 720, dur: 0.12, type: 'triangle', gain: 0.025, slide: -180 });
  }

  aggro() {
    if (!this.gate('aggro', 650)) return;
    this.tone({ freq: 130, dur: 0.13, type: 'sawtooth', gain: 0.035, slide: -45 });
  }
}
