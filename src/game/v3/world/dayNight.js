import * as THREE from '../vendor/three.module.js';

// Shared, mutable world clock. Other systems (NPC schedules in life.js) read this
// without coupling to the engine or the visual extension. Updated once per frame
// by the day-night engine extension before the rest of the update chain runs.
export const worldClock = {
  phase: 0.32, // 0..1 — 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
  sunAltitude: 0, // -1..1 (sin of the sun arc)
  dayFactor: 0, // 0 night .. 1 full daylight (smoothed)
  nightFactor: 1, // 0 day .. 1 deep night (smoothed)
  twilight: 0, // 0..1, peaks when the sun is near the horizon (dawn/dusk)
  segment: 'night', // dawn | day | dusk | night
  label: 'Ночь',
  clockText: '00:00',
};

const SEGMENT_LABEL = { dawn: 'Рассвет', day: 'День', dusk: 'Сумерки', night: 'Ночь' };

function segmentOf(phase) {
  if (phase >= 0.21 && phase < 0.31) return 'dawn';
  if (phase >= 0.31 && phase < 0.70) return 'day';
  if (phase >= 0.70 && phase < 0.80) return 'dusk';
  return 'night';
}

// One full day takes ~12 real minutes at ×1. The time-lapse key cycles faster
// scales so the whole cycle is easy to inspect without waiting.
export class TimeOfDay {
  constructor({ dayLengthSeconds = 720, startPhase = 0.32 } = {}) {
    this.dayLength = dayLengthSeconds;
    this.phase = ((startPhase % 1) + 1) % 1;
    this.scales = [1, 30, 180, 900];
    this.scaleIndex = 0;
    this.timeScale = this.scales[0];
    this._dir = new THREE.Vector3();
    this.recompute();
  }

  cycleTimeScale() {
    this.scaleIndex = (this.scaleIndex + 1) % this.scales.length;
    this.timeScale = this.scales[this.scaleIndex];
    return this.timeScale;
  }

  setPhase(phase) {
    this.phase = ((phase % 1) + 1) % 1;
    this.recompute();
  }

  update(dt) {
    if (dt > 0) this.phase = (this.phase + (dt * this.timeScale) / this.dayLength) % 1;
    this.recompute();
  }

  recompute() {
    const p = this.phase;
    const ang = Math.PI * 2 * (p - 0.25); // sunrise at ang=0, noon at +pi/2
    const sunAltitude = Math.sin(ang);
    worldClock.phase = p;
    worldClock.sunAltitude = sunAltitude;
    worldClock.dayFactor = THREE.MathUtils.smoothstep(sunAltitude, -0.05, 0.32);
    worldClock.nightFactor = THREE.MathUtils.smoothstep(-sunAltitude, 0.02, 0.45);
    worldClock.twilight = Math.max(0, 1 - Math.abs(sunAltitude) / 0.26);
    const seg = segmentOf(p);
    worldClock.segment = seg;
    worldClock.label = SEGMENT_LABEL[seg];
    const totalMinutes = Math.floor(p * 24 * 60);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    worldClock.clockText = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  // Direction *toward* the sun (for the sky disc and the sun light position).
  sunDirection(out = this._dir) {
    const ang = Math.PI * 2 * (this.phase - 0.25);
    return out.set(Math.cos(ang) * 0.82, Math.sin(ang), -0.42).normalize();
  }
}
