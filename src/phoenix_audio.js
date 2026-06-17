// Phoenix7 2.0O Audio Manager
// Browser-safe WebAudio fallback layer.
// It tries to use real files later, but never breaks the game when files are missing.

export class PhoenixAudio {
  constructor(options = {}) {
    this.manifestUrl = options.manifestUrl || 'public/assets/audio/audio-manifest.json';
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.buffers = new Map();
    this.manifest = null;
    this.started = false;
    this.ambientNodes = [];
  }

  async init() {
    if (this.started) return true;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.65;
      this.masterGain.connect(this.ctx.destination);
      this.started = true;
      await this.loadManifestSafe();
      return true;
    } catch (err) {
      console.warn('[PhoenixAudio] init failed', err);
      this.enabled = false;
      return false;
    }
  }

  async unlock() {
    if (!this.ctx) await this.init();
    if (this.ctx && this.ctx.state === 'suspended') await this.ctx.resume();
  }

  async loadManifestSafe() {
    try {
      const res = await fetch(this.manifestUrl, { cache: 'no-store' });
      if (!res.ok) return;
      this.manifest = await res.json();
    } catch (err) {
      console.warn('[PhoenixAudio] manifest unavailable, using procedural fallback');
    }
  }

  async loadBuffer(key) {
    if (!this.ctx || !this.manifest || !this.manifest.files || !this.manifest.files[key]) return null;
    if (this.buffers.has(key)) return this.buffers.get(key);
    try {
      const res = await fetch(this.manifest.files[key]);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.buffers.set(key, buf);
      return buf;
    } catch (err) {
      console.warn('[PhoenixAudio] missing audio asset for', key);
      return null;
    }
  }

  async play(key, fallbackName = key, volume = 0.9) {
    await this.unlock();
    if (!this.enabled || !this.ctx) return;
    const buf = await this.loadBuffer(key);
    if (buf) {
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      src.buffer = buf;
      src.connect(gain);
      gain.connect(this.masterGain);
      src.start();
      return;
    }
    this.fallback(fallbackName, volume);
  }

  fallback(name, volume = 1) {
    if (!this.ctx) return;
    switch (name) {
      case 'uiClick': return this.click(volume);
      case 'startGame': return this.startGame(volume);
      case 'bookOpen': return this.bookOpen(volume);
      case 'pageTurn': return this.pageTurn(volume);
      case 'questUpdate': return this.questUpdate(volume);
      case 'questComplete': return this.questComplete(volume);
      case 'mapOpen': return this.mapOpen(volume);
      default: return this.click(volume * 0.7);
    }
  }

  osc(freq, dur, type = 'sine', gain = 0.12, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.masterGain);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  noise(dur = 0.2, gain = 0.06, delay = 0, filterFreq = 1200) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    src.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    src.start(t);
  }

  click(volume = 1) {
    this.osc(210, 0.045, 'triangle', 0.05 * volume);
    this.osc(340, 0.035, 'sine', 0.035 * volume, 0.025);
    this.noise(0.035, 0.018 * volume, 0, 1800);
  }

  startGame(volume = 1) {
    this.osc(74, 1.1, 'sine', 0.08 * volume);
    this.osc(148, 0.7, 'triangle', 0.055 * volume, 0.12);
    this.osc(222, 1.0, 'sawtooth', 0.025 * volume, 0.28);
    this.noise(1.2, 0.025 * volume, 0, 500);
  }

  bookOpen(volume = 1) {
    this.noise(0.18, 0.08 * volume, 0, 950);
    this.osc(160, 0.16, 'triangle', 0.035 * volume, 0.04);
  }

  pageTurn(volume = 1) {
    this.noise(0.12, 0.055 * volume, 0, 1800);
    this.noise(0.1, 0.04 * volume, 0.08, 1200);
  }

  questUpdate(volume = 1) {
    this.osc(220, 0.12, 'triangle', 0.055 * volume);
    this.osc(330, 0.16, 'triangle', 0.045 * volume, 0.08);
    this.noise(0.18, 0.018 * volume, 0.02, 1400);
  }

  questComplete(volume = 1) {
    this.osc(196, 0.14, 'triangle', 0.055 * volume);
    this.osc(247, 0.16, 'triangle', 0.055 * volume, 0.09);
    this.osc(330, 0.22, 'sine', 0.05 * volume, 0.18);
    this.osc(98, 0.7, 'sine', 0.05 * volume, 0.05);
  }

  mapOpen(volume = 1) {
    this.pageTurn(volume * 0.9);
    this.osc(110, 0.3, 'sine', 0.035 * volume, 0.06);
  }

  startAmbience(kind = 'port') {
    if (!this.ctx || !this.masterGain) return;
    this.stopAmbience();
    const base = kind === 'fort' ? 68 : 52;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    gain.connect(this.masterGain);
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    o1.type = 'sine';
    o2.type = 'triangle';
    o1.frequency.value = base;
    o2.frequency.value = base * 1.5;
    o1.connect(gain);
    o2.connect(gain);
    o1.start();
    o2.start();
    this.ambientNodes.push(o1, o2, gain);
    const pulse = setInterval(() => {
      if (!this.ctx || !this.enabled) return;
      this.noise(0.25, 0.01, 0, kind === 'port' ? 700 : 420);
    }, kind === 'port' ? 2300 : 3100);
    this.ambientNodes.push({ stop: () => clearInterval(pulse) });
  }

  stopAmbience() {
    for (const n of this.ambientNodes) {
      try { n.stop?.(); } catch (_) {}
      try { n.disconnect?.(); } catch (_) {}
    }
    this.ambientNodes = [];
  }
}

export function installPhoenixAudioGlobals() {
  const audio = new PhoenixAudio();
  window.PhoenixAudio = audio;
  window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
  return audio;
}
