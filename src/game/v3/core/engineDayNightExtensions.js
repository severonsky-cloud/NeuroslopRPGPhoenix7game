import * as THREE from '../vendor/three.module.js';
import { TimeOfDay, worldClock } from '../world/dayNight.js';

// Night-target palettes that the biome colours bend toward as nightFactor rises.
const NIGHT_ZENITH = new THREE.Color(0x0a1326);
const NIGHT_HORIZON = new THREE.Color(0x162033);
const NIGHT_DUST = new THREE.Color(0x111a2b);
const NIGHT_FOG = new THREE.Color(0x141b2b);
const NIGHT_AMBIENT = new THREE.Color(0x394a63);
const TWILIGHT_WARM = new THREE.Color(0xff6a2c);
const TWILIGHT_HORIZON = new THREE.Color(0xd17b40);
const TWILIGHT_FOG = new THREE.Color(0xa85f38);

function createStarfield(quality) {
  const count = quality?.name === 'Low' ? 280 : 620;
  const positions = new Float32Array(count * 3);
  const radius = 900;
  // Deterministic hemisphere-biased scatter (more stars overhead, none far below).
  let seed = 90171;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i += 1) {
    const u = rand();
    const v = rand() * 0.92 + 0.06; // bias above horizon
    const theta = u * Math.PI * 2;
    const phi = Math.acos(v);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xcdd7ff,
    size: 2.1,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const stars = new THREE.Points(geometry, material);
  stars.name = 'v3n1-starfield';
  stars.renderOrder = 1;
  stars.frustumCulled = false;
  return stars;
}

function ensureClockElement() {
  let el = document.getElementById('dayNightClock');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dayNightClock';
    el.style.cssText =
      'position:fixed;right:16px;top:14px;z-index:12;pointer-events:none;' +
      'font:800 15px system-ui;color:#f3dca8;text-shadow:0 2px 6px #000;' +
      'background:rgba(0,0,0,.42);border-left:3px solid #d8a64d;padding:6px 10px;letter-spacing:.4px';
    document.body.appendChild(el);
  }
  return el;
}

function applyDayNight(engine) {
  const va = engine.visualAtmosphere;
  const dn = engine.dayNight;
  if (!va || !dn || !va.profile) return;
  const base = va.profile;
  const c = worldClock;
  const { c1, c2, sunDir } = dn;

  engine.timeOfDay.sunDirection(sunDir);
  const sunVisible = THREE.MathUtils.smoothstep(c.sunAltitude, -0.04, 0.20);

  // --- Sun light: arc position, day-gated intensity, twilight-warm colour ---
  engine.atmosphere.sun.position.copy(sunDir).multiplyScalar(220);
  engine.atmosphere.sun.intensity = base.sunIntensity * 1.16 * sunVisible;
  c1.set(base.sun).lerp(TWILIGHT_WARM, c.twilight * 0.6);
  engine.atmosphere.sun.color.copy(c1);

  // --- Sky shader uniforms ---
  const u = va.skyMaterial?.uniforms;
  if (u) {
    u.sunDirection.value.copy(sunDir);
    u.zenithColor.value.set(base.zenith).lerp(NIGHT_ZENITH, c.nightFactor * 0.92);
    c2.set(base.horizon).lerp(NIGHT_HORIZON, c.nightFactor * 0.85).lerp(TWILIGHT_HORIZON, c.twilight * 0.55);
    u.horizonColor.value.copy(c2);
    u.dustColor.value.set(base.dust).lerp(NIGHT_DUST, c.nightFactor * 0.8);
    u.sunColor.value.copy(engine.atmosphere.sun.color).multiplyScalar(0.35 + 0.65 * sunVisible);
  }

  // --- Fog + background: denser and cooler at night, warm at dawn/dusk ---
  const baseFog = Math.max(base.fogDensity, engine.quality.fogDensity * 0.82);
  engine.scene.fog.density = baseFog * (1 + 0.55 * c.nightFactor);
  c1.set(base.fog).lerp(NIGHT_FOG, c.nightFactor * 0.72).lerp(TWILIGHT_FOG, c.twilight * 0.22);
  engine.scene.fog.color.copy(c1);
  engine.scene.background.copy(c1);

  // --- Ambient + hemisphere: dim at night ---
  va.ambient.intensity = base.ambientIntensity * 1.55 * (0.30 + 0.70 * c.dayFactor);
  va.ambient.color.set(base.ambient).lerp(NIGHT_AMBIENT, c.nightFactor * 0.6);
  engine.atmosphere.hemi.intensity = 0.98 * (0.32 + 0.68 * c.dayFactor);

  // --- Moon (Medium/High only) opposite the sun ---
  if (dn.moon) {
    dn.moon.position.copy(sunDir).multiplyScalar(-220);
    dn.moon.intensity = 0.34 * c.nightFactor;
    dn.moon.visible = c.nightFactor > 0.02;
  }

  // --- Stars fade in at night, re-centred on the player so they never parallax ---
  if (dn.stars) {
    dn.stars.position.copy(engine.rig.position);
    dn.stars.material.opacity = c.nightFactor * 0.9;
    dn.stars.visible = c.nightFactor > 0.015;
  }

  // --- HUD clock ---
  const text = `${c.clockText} · ${c.label}${engine.timeOfDay.timeScale > 1 ? ` ·×${engine.timeOfDay.timeScale}` : ''}`;
  if (dn.clockEl && dn.clockText !== text) {
    dn.clockEl.textContent = text;
    dn.clockText = text;
  }
}

export function installDayNightExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__dayNightExtensionInstalled) return;
  PhoenixV3Engine.__dayNightExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithDayNight() {
    const result = originalBuildScene.call(this);
    this.timeOfDay = new TimeOfDay();
    const stars = createStarfield(this.quality);
    this.scene.add(stars);
    let moon = null;
    if (this.quality.realtimeAccentLights) {
      moon = new THREE.DirectionalLight(0x9fb4d8, 0);
      moon.name = 'v3n1-moon-light';
      moon.castShadow = false;
      this.scene.add(moon);
    }
    this.dayNight = {
      stars,
      moon,
      clockEl: ensureClockElement(),
      clockText: '',
      c1: new THREE.Color(),
      c2: new THREE.Color(),
      sunDir: new THREE.Vector3(),
    };
    this.timeOfDay.update(0);
    applyDayNight(this);
    this.log.unshift('v3N1: цикл день-ночь, распорядок жителей и ночное небо (клавиша T — ускорение времени).');
    return result;
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithDayNight(dt) {
    // Advance the clock first so NPC schedules (life.js) read a fresh worldClock
    // inside the original update chain.
    if (this.mode !== 'boot' && !this.paused) this.timeOfDay?.update(dt);
    originalUpdate.call(this, dt);
    if (this.mode === 'boot') return;
    applyDayNight(this);
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWithDayNight(code, event) {
    if (code === 'KeyT' && !this.paused && this.mode !== 'boot') {
      const scale = this.timeOfDay?.cycleTimeScale();
      this.hud?.setObjective?.(`Время суток: ×${scale} (T — переключить)`);
      return;
    }
    originalOnAction.call(this, code, event);
  };

  PhoenixV3Engine.prototype.getDayNightDiagnostics = function getDayNightDiagnostics() {
    if (!this.timeOfDay) return null;
    return {
      phase: Math.round(worldClock.phase * 1000) / 1000,
      clock: worldClock.clockText,
      segment: worldClock.segment,
      sunAltitude: Math.round(worldClock.sunAltitude * 1000) / 1000,
      dayFactor: Math.round(worldClock.dayFactor * 1000) / 1000,
      nightFactor: Math.round(worldClock.nightFactor * 1000) / 1000,
      twilight: Math.round(worldClock.twilight * 1000) / 1000,
      timeScale: this.timeOfDay.timeScale,
      sunIntensity: Math.round(this.atmosphere.sun.intensity * 1000) / 1000,
      ambientIntensity: Math.round((this.visualAtmosphere?.ambient?.intensity || 0) * 1000) / 1000,
      fogDensity: Math.round((this.scene.fog?.density || 0) * 100000) / 100000,
      moon: this.dayNight?.moon ? Math.round(this.dayNight.moon.intensity * 1000) / 1000 : 'disabled (Low)',
      starsOpacity: Math.round((this.dayNight?.stars?.material.opacity || 0) * 1000) / 1000,
    };
  };
}
