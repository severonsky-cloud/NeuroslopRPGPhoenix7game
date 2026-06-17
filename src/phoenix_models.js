// Phoenix7 2.0Q Model Layer
// GLB loader + procedural fallback.
// The game should never break because a model file is missing.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

export class PhoenixModels {
  constructor(options = {}) {
    this.manifestUrl = options.manifestUrl || 'public/assets/models/model-manifest.json';
    this.manifest = null;
    this.GLTFLoader = null;
    this.loader = null;
    this.cache = new Map();
    this.ready = false;
  }

  async init() {
    await Promise.all([this.loadManifestSafe(), this.loadGLTFSafe()]);
    this.ready = true;
    return true;
  }

  async loadManifestSafe() {
    try {
      const res = await fetch(this.manifestUrl, { cache: 'no-store' });
      if (!res.ok) return;
      this.manifest = await res.json();
    } catch (err) {
      console.warn('[PhoenixModels] manifest unavailable, using procedural fallback');
    }
  }

  async loadGLTFSafe() {
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/loaders/GLTFLoader.js');
      this.GLTFLoader = mod.GLTFLoader;
      this.loader = new this.GLTFLoader();
    } catch (err) {
      console.warn('[PhoenixModels] GLTFLoader unavailable, using procedural fallback', err);
    }
  }

  getManifestPath(kind, key) {
    if (!this.manifest) return null;
    if (kind === 'character') return this.manifest.characters?.[key] || null;
    if (kind === 'prop') return this.manifest.props?.[key] || null;
    return null;
  }

  async loadGLB(path) {
    if (!path || !this.loader) return null;
    if (this.cache.has(path)) return this.cache.get(path).clone(true);
    try {
      const gltf = await this.loader.loadAsync(path);
      const root = gltf.scene;
      root.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      this.cache.set(path, root);
      return root.clone(true);
    } catch (err) {
      console.warn('[PhoenixModels] failed to load GLB:', path);
      return null;
    }
  }

  async character(key, options = {}) {
    const path = this.getManifestPath('character', key);
    const glb = await this.loadGLB(path);
    if (glb) {
      glb.userData.modelSource = 'glb';
      this.applyTransform(glb, options);
      return glb;
    }
    const fallback = this.proceduralCharacter(key, options);
    fallback.userData.modelSource = 'procedural';
    return fallback;
  }

  async prop(key, options = {}) {
    const path = this.getManifestPath('prop', key);
    const glb = await this.loadGLB(path);
    if (glb) {
      glb.userData.modelSource = 'glb';
      this.applyTransform(glb, options);
      return glb;
    }
    const fallback = this.proceduralProp(key, options);
    fallback.userData.modelSource = 'procedural';
    return fallback;
  }

  applyTransform(obj, options = {}) {
    const s = options.scale ?? 1;
    obj.scale.setScalar(s);
    if (options.position) obj.position.copy(options.position);
    if (typeof options.rotationY === 'number') obj.rotation.y = options.rotationY;
  }

  material(color, emissive = 0x000000, intensity = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.86,
      metalness: 0.03,
      emissive,
      emissiveIntensity: intensity,
    });
  }

  mesh(group, geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  proceduralCharacter(key, options = {}) {
    const group = new THREE.Group();
    const palette = this.paletteFor(key);
    const primary = this.material(palette.primary, palette.emissive, palette.glow);
    const secondary = this.material(palette.secondary);
    const skin = this.material(palette.skin, palette.skinGlow || 0x000000, palette.skinGlow ? 0.18 : 0);
    const accent = this.material(palette.accent, palette.accent, 0.35);

    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.65, 1.45, 14);
    const limbGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.85, 10);
    const headGeo = new THREE.SphereGeometry(0.34, 14, 12);
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const coneGeo = new THREE.ConeGeometry(0.22, 0.55, 10);

    const w = palette.width;
    const h = palette.height;
    this.mesh(group, bodyGeo, primary, 0, 1.05 * h, 0, 0.9 * w, 1.08 * h, 0.72 * w);
    this.mesh(group, boxGeo, secondary, 0, 0.72 * h, -0.02, 0.92 * w, 0.15, 0.55 * w);
    this.mesh(group, limbGeo, primary, -0.52 * w, 1.07 * h, 0, 1, 1, 1).rotation.z = 0.16;
    this.mesh(group, limbGeo, primary, 0.52 * w, 1.07 * h, 0, 1, 1, 1).rotation.z = -0.16;
    this.mesh(group, limbGeo, primary, -0.23 * w, 0.36 * h, 0, 1.15, 1.05, 1.15);
    this.mesh(group, limbGeo, primary, 0.23 * w, 0.36 * h, 0, 1.15, 1.05, 1.15);
    this.mesh(group, headGeo, skin, 0, 1.93 * h, 0, 1.0 * w, 1, 1.0 * w);
    this.mesh(group, new THREE.OctahedronGeometry(0.18), accent, 0, 1.18 * h, 0.43, 1, 1, 1);

    if (key.includes('green')) {
      this.mesh(group, coneGeo, accent, 0, 2.32 * h, 0, 0.55, 1.1, 0.55);
      this.mesh(group, boxGeo, accent, -0.62, 1.55, 0.22, 0.1, 0.1, 0.5);
    }
    if (key.includes('blue')) {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 24), accent);
      torus.position.set(0, 2.25 * h, 0);
      torus.rotation.x = Math.PI / 2;
      torus.castShadow = true;
      group.add(torus);
    }
    if (key.includes('gerda')) {
      this.mesh(group, boxGeo, this.material(0x2b1e1a), 0, 1.35 * h, -0.28, 1.22, 1.45, 0.16);
      this.mesh(group, new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), accent, 0.62, 1.05, 0.2, 1, 1, 1).rotation.z = -0.45;
    }
    if (key.includes('oran')) {
      this.mesh(group, boxGeo, this.material(0xc49a58), 0, 1.46 * h, 0.35, 0.75, 0.18, 0.08);
      this.mesh(group, boxGeo, this.material(0x322514), 0, 0.9 * h, 0.48, 0.65, 0.06, 0.35);
    }

    group.userData.modelKey = key;
    this.applyTransform(group, options);
    return group;
  }

  proceduralProp(key, options = {}) {
    const group = new THREE.Group();
    const base = this.material(0x4b3825);
    const accent = this.material(0xd8b56e, 0x3b2300, 0.2);
    const stone = this.material(0x3d3b34);

    if (key.includes('port')) {
      for (let i = 0; i < 5; i++) {
        this.mesh(group, new THREE.BoxGeometry(1.4, 0.7, 1.1), base, i * 1.5 - 3, 0.35, Math.sin(i) * 0.5, 1, 1, 1).rotation.y = i * 0.4;
      }
    } else if (key.includes('fort')) {
      this.mesh(group, new THREE.BoxGeometry(5, 3, 0.6), stone, 0, 1.5, 0, 1, 1, 1);
      this.mesh(group, new THREE.BoxGeometry(0.6, 4, 0.8), stone, -2.5, 2, 0, 1, 1, 1);
      this.mesh(group, new THREE.BoxGeometry(0.6, 4, 0.8), stone, 2.5, 2, 0, 1, 1, 1);
    } else if (key.includes('green')) {
      this.mesh(group, new THREE.OctahedronGeometry(1), this.material(0x5c8f61, 0x143515, 0.5), 0, 1.2, 0, 1, 1, 1);
    } else if (key.includes('blue')) {
      const torus = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.09, 64, 8), this.material(0x557fb8, 0x112d5c, 0.5));
      torus.position.y = 1.2;
      torus.castShadow = true;
      group.add(torus);
    } else {
      this.mesh(group, new THREE.DodecahedronGeometry(1), stone, 0, 1, 0, 1, 1, 1);
    }

    group.userData.modelKey = key;
    this.applyTransform(group, options);
    return group;
  }

  paletteFor(key) {
    if (key.includes('green')) return { primary: 0x244529, secondary: 0x171d13, skin: 0xa98264, accent: 0x78c86d, emissive: 0x0b2a0d, glow: 0.18, width: 1, height: 1 };
    if (key.includes('blue')) return { primary: 0x24364f, secondary: 0x151b27, skin: 0xa98264, accent: 0x73a8ff, emissive: 0x0b1830, glow: 0.18, width: 1, height: 1 };
    if (key.includes('gerda')) return { primary: 0x5d4435, secondary: 0x2b1e1a, skin: 0xc09673, accent: 0xd8b56e, width: 0.95, height: 1.02 };
    if (key.includes('oran')) return { primary: 0x6d5a3b, secondary: 0x2b2418, skin: 0xcaa37d, accent: 0xf0d28a, width: 0.9, height: 0.98 };
    if (key.includes('portWorker')) return { primary: 0x7b5a35, secondary: 0x2b251d, skin: 0xbb8b68, accent: 0xb48a52, width: 1.08, height: 0.98 };
    return { primary: 0x686056, secondary: 0x28251f, skin: 0xbb8b68, accent: 0xd8b56e, width: 1, height: 1 };
  }
}

export async function installPhoenixModelsGlobals() {
  const models = new PhoenixModels();
  await models.init();
  window.PhoenixModels = models;
  return models;
}
