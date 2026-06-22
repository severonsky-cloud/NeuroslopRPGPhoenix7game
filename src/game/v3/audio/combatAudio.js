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
    const gates = { smg: 28, lmg: 24, pistol: 75, revolver: 95, shotgun: 120, rocket: 260, rifle: 90 };
    if (!this.gate(`fire_${kind}`, gates[kind] || 90)) return;
    if (kind === 'smg') {
      this.noise({ dur: 0.045, gain: 0.07, filter: 1300, pan: -0.04 + Math.random() * 0.08 });
      this.tone({ freq: 110, dur: 0.05, type: 'square', gain: 0.035, slide: -50, pan: 0.02 });
      return;
    }
    if (kind === 'lmg') {
      this.noise({ dur: 0.065, gain: 0.095, filter: 900, pan: -0.05 + Math.random() * 0.1 });
      this.tone({ freq: 78, dur: 0.08, type: 'sawtooth', gain: 0.048, slide: -36 });
      this.tone({ freq: 180, dur: 0.032, type: 'square', gain: 0.018, slide: -80 });
      return;
    }
    if (kind === 'pistol') {
      this.noise({ dur: 0.05, gain: 0.058, filter: 1450, pan: 0.03 });
      this.tone({ freq: 170, dur: 0.045, type: 'square', gain: 0.03, slide: -70 });
      return;
    }
    if (kind === 'revolver' || kind === 'nagant') {
      this.noise({ dur: 0.06, gain: 0.07, filter: 1500 });
      this.tone({ freq: 145, dur: 0.06, type: 'square', gain: 0.035, slide: -65 });
      return;
    }
    if (kind === 'shotgun') {
      this.noise({ dur: 0.11, gain: 0.115, filter: 760 });
      this.tone({ freq: 70, dur: 0.1, type: 'sawtooth', gain: 0.055, slide: -38 });
      return;
    }
    if (kind === 'rocket') {
      this.noise({ dur: 0.22, gain: 0.13, filter: 520 });
      this.tone({ freq: 55, dur: 0.18, type: 'sawtooth', gain: 0.06, slide: -24 });
      setTimeout(() => this.noise({ dur: 0.08, gain: 0.06, filter: 1200 }), 55);
      return;
    }
    this.noise({ dur: 0.065, gain: 0.08, filter: 1150 });
    this.tone({ freq: 95, dur: 0.08, type: 'square', gain: 0.04, slide: -45 });
  }

  explosion(kind = 'blast') {
    if (!this.gate(`explosion_${kind}`, kind === 'small' ? 180 : 260)) return;
    const heavy = kind !== 'small';
    this.noise({ dur: heavy ? 0.34 : 0.2, gain: heavy ? 0.16 : 0.1, filter: heavy ? 220 : 420 });
    this.tone({ freq: heavy ? 42 : 70, dur: heavy ? 0.28 : 0.16, type: 'sawtooth', gain: heavy ? 0.07 : 0.045, slide: heavy ? -16 : -24 });
    setTimeout(() => this.noise({ dur: heavy ? 0.16 : 0.09, gain: heavy ? 0.065 : 0.045, filter: 1200 }), 45);
    setTimeout(() => this.tone({ freq: heavy ? 96 : 140, dur: 0.08, type: 'triangle', gain: 0.025, slide: -40 }), 95);
  }

  jam() {
    if (!this.gate('jam', 180)) return;
    this.tone({ freq: 520, dur: 0.035, type: 'square', gain: 0.035, slide: -120 });
    this.tone({ freq: 240, dur: 0.05, type: 'triangle', gain: 0.025, slide: -60 });
  }

  reload(kind = 'rifle') {
    if (!this.gate(`reload_${kind}`, 160)) return;
    const pitch = kind === 'lmg' ? 270 : kind === 'pistol' ? 420 : kind === 'rocket' ? 180 : 350;
    this.tone({ freq: pitch, dur: 0.05, type: 'triangle', gain: 0.025, slide: -80 });
    setTimeout(() => this.tone({ freq: pitch * 0.72, dur: 0.04, type: 'triangle', gain: 0.022, slide: 70 }), 110);
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
