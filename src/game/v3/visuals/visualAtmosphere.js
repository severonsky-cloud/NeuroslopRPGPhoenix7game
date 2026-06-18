import * as THREE from '../vendor/three.module.js';
import { ROADS, VISUAL_ATMOSPHERE_POINTS } from '../data/worldData.js';
import { biomeAt, heightAt } from '../world/terrain.js';
import { makeMat } from '../world/props.js';

const PROFILES = {
  ocean: {
    zenith: 0x344a55, horizon: 0x9b7660, dust: 0x6f817f, fog: 0x587578,
    fogDensity: 0.0045, hemi: 0xd9c7a5, ground: 0x1b3237, ambient: 0x6e7470,
    ambientIntensity: 0.26, sun: 0xffb36f, sunIntensity: 1.35, haze: 0.5,
  },
  beach: {
    zenith: 0x4c6270, horizon: 0xc8794d, dust: 0xb26e4c, fog: 0x9b6a52,
    fogDensity: 0.00415, hemi: 0xe7c19a, ground: 0x3c291f, ambient: 0x78665a,
    ambientIntensity: 0.25, sun: 0xffad67, sunIntensity: 1.48, haze: 0.46,
  },
  port: {
    zenith: 0x514b49, horizon: 0xb5603d, dust: 0x8d5944, fog: 0x8b5a43,
    fogDensity: 0.00405, hemi: 0xdfb17d, ground: 0x30241c, ambient: 0x66584f,
    ambientIntensity: 0.24, sun: 0xffa45f, sunIntensity: 1.42, haze: 0.4,
  },
  clay: {
    zenith: 0x4b5361, horizon: 0xbd6741, dust: 0xa55337, fog: 0x9a5c43,
    fogDensity: 0.00375, hemi: 0xe0b17d, ground: 0x35231a, ambient: 0x68564d,
    ambientIntensity: 0.23, sun: 0xffa45f, sunIntensity: 1.48, haze: 0.35,
  },
  redroad: {
    zenith: 0x454a58, horizon: 0xa94c33, dust: 0x8d392d, fog: 0x8f4d3b,
    fogDensity: 0.0039, hemi: 0xd9a477, ground: 0x352017, ambient: 0x635047,
    ambientIntensity: 0.22, sun: 0xff9b58, sunIntensity: 1.5, haze: 0.38,
  },
  battery: {
    zenith: 0x504a48, horizon: 0x88634b, dust: 0x6d5745, fog: 0x6d5b4e,
    fogDensity: 0.0039, hemi: 0xcbae88, ground: 0x27231f, ambient: 0x5a5651,
    ambientIntensity: 0.23, sun: 0xeaa36a, sunIntensity: 1.38, haze: 0.33,
  },
  fort: {
    zenith: 0x554a49, horizon: 0xa96743, dust: 0x85503c, fog: 0x82604b,
    fogDensity: 0.00365, hemi: 0xdfb07c, ground: 0x2a211d, ambient: 0x625550,
    ambientIntensity: 0.24, sun: 0xffa45e, sunIntensity: 1.45, haze: 0.32,
  },
  rednode: {
    zenith: 0x352e3b, horizon: 0x77342f, dust: 0x5e2930, fog: 0x6f3b3b,
    fogDensity: 0.00465, hemi: 0xbe876f, ground: 0x25131a, ambient: 0x4f414b,
    ambientIntensity: 0.22, sun: 0xf28a5f, sunIntensity: 1.28, haze: 0.43,
  },
  mangrove: {
    zenith: 0x33443e, horizon: 0x59654b, dust: 0x425944, fog: 0x3e5140,
    fogDensity: 0.0054, hemi: 0xb7c59c, ground: 0x142019, ambient: 0x405249,
    ambientIntensity: 0.28, sun: 0xd3a674, sunIntensity: 1.1, haze: 0.58,
  },
  tsarbor: {
    zenith: 0x29463c, horizon: 0x536a4b, dust: 0x34563d, fog: 0x304737,
    fogDensity: 0.0055, hemi: 0xa9c096, ground: 0x111c15, ambient: 0x435b49,
    ambientIntensity: 0.36, sun: 0xc4aa74, sunIntensity: 1.02, haze: 0.58,
  },
  savanna: {
    zenith: 0x596575, horizon: 0xc28a55, dust: 0xa97949, fog: 0x9a7657,
    fogDensity: 0.00455, hemi: 0xe0c08c, ground: 0x31271b, ambient: 0x716452,
    ambientIntensity: 0.25, sun: 0xffb566, sunIntensity: 1.55, haze: 0.51,
  },
  glass: {
    zenith: 0x172836, horizon: 0x314d54, dust: 0x20383e, fog: 0x253942,
    fogDensity: 0.0045, hemi: 0x89c9c2, ground: 0x09080d, ambient: 0x354b51,
    ambientIntensity: 0.3, sun: 0xa7d7c4, sunIntensity: 1.0, haze: 0.42,
  },
  ice: {
    zenith: 0x657b8a, horizon: 0xb1b5aa, dust: 0x879ba2, fog: 0x80949d,
    fogDensity: 0.0049, hemi: 0xc9e3e7, ground: 0x29363b, ambient: 0x71848b,
    ambientIntensity: 0.3, sun: 0xffd1a0, sunIntensity: 1.18, haze: 0.52,
  },
};

const color = (value) => new THREE.Color(value);
function profileColor(profile, key) {
  profile.__colorCache ||= {};
  profile.__colorCache[key] ||= color(profile[key]);
  return profile.__colorCache[key];
}

const damp = (current, target, speed, dt) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * Math.max(0, dt)));

function dampColor(current, target, speed, dt) {
  current.lerp(target, 1 - Math.exp(-speed * Math.max(0, dt)));
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function skyMaterial(profile) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      zenithColor: { value: profileColor(profile, 'zenith').clone() },
      horizonColor: { value: profileColor(profile, 'horizon').clone() },
      dustColor: { value: profileColor(profile, 'dust').clone() },
      sunColor: { value: profileColor(profile, 'sun').clone() },
      sunDirection: { value: new THREE.Vector3(-0.74, 0.25, -0.36).normalize() },
      hazeStrength: { value: profile.haze },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      uniform vec3 zenithColor;
      uniform vec3 horizonColor;
      uniform vec3 dustColor;
      uniform vec3 sunColor;
      uniform vec3 sunDirection;
      uniform float hazeStrength;
      void main() {
        vec3 direction = normalize(vWorldPosition - cameraPosition);
        float heightMix = smoothstep(-0.08, 0.72, direction.y);
        vec3 sky = mix(horizonColor, zenithColor, heightMix);
        float horizonBand = pow(1.0 - clamp(abs(direction.y), 0.0, 1.0), 4.0);
        sky = mix(sky, dustColor, horizonBand * hazeStrength);
        float sunCore = pow(max(dot(direction, sunDirection), 0.0), 420.0);
        float sunGlow = pow(max(dot(direction, sunDirection), 0.0), 18.0);
        sky = sky * 1.16 + sunColor * (sunCore * 1.7 + sunGlow * 0.2);
        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });
  material.color = color(profile.horizon);
  return material;
}

function sampleRoadside(points, spacing, random, callback) {
  for (let segmentIndex = 0; segmentIndex < points.length - 1; segmentIndex += 1) {
    const a = points[segmentIndex];
    const b = points[segmentIndex + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    if (length < 1) continue;
    const count = Math.max(1, Math.floor(length / spacing));
    const nx = -dz / length;
    const nz = dx / length;
    for (let index = 0; index < count; index += 1) {
      const t = (index + 0.5 + (random() - 0.5) * 0.32) / count;
      const side = (index + segmentIndex) % 2 === 0 ? -1 : 1;
      const offset = 3.25 + random() * 2.8;
      callback({
        x: a.x + dx * t + nx * offset * side,
        z: a.z + dz * t + nz * offset * side,
        angle: Math.atan2(dx, dz),
        side,
        random,
      });
    }
  }
}

function createInstancedDressing(scene, quality) {
  const random = seededRandom(30404);
  const low = quality?.name === 'Low';
  const dirtPoints = [];
  const stonePoints = [];
  const grassPoints = [];
  const postPoints = [];
  const roads = low ? ROADS.slice(0, 4) : ROADS;

  roads.forEach((road, roadIndex) => {
    sampleRoadside(road, low ? 26 : 18, random, (point) => {
      dirtPoints.push({ ...point, scale: 0.7 + random() * 1.25 });
      if (random() > 0.2) stonePoints.push({ ...point, scale: 0.12 + random() * 0.25 });
      if (random() > 0.28) grassPoints.push({ ...point, scale: 0.45 + random() * 0.65 });
      if (roadIndex < 3 && random() > 0.72) postPoints.push(point);
    });
  });

  const group = new THREE.Group();
  group.name = 'v3l4-roadside-dressing';
  scene.add(group);

  const dummy = new THREE.Object3D();
  const dirtGeometry = new THREE.CircleGeometry(0.72, 10);
  const dirtMaterial = new THREE.MeshBasicMaterial({
    color: 0x3c291b,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const dirt = new THREE.InstancedMesh(dirtGeometry, dirtMaterial, dirtPoints.length);
  dirt.name = 'road-edge-dirt-patches';
  dirtPoints.forEach((point, index) => {
    dummy.position.set(point.x, heightAt(point.x, point.z) + 0.014, point.z);
    dummy.rotation.set(-Math.PI / 2, 0, point.angle + point.random() * 0.7);
    dummy.scale.set(point.scale * 1.45, point.scale * 0.68, 1);
    dummy.updateMatrix();
    dirt.setMatrixAt(index, dummy.matrix);
  });
  dirt.renderOrder = 1;
  group.add(dirt);

  const stones = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.35, 0),
    makeMat(0x4a3424, { roughness: 0.98 }),
    stonePoints.length,
  );
  stones.name = 'road-edge-small-stones';
  stonePoints.forEach((point, index) => {
    dummy.position.set(point.x, heightAt(point.x, point.z) + point.scale * 0.18, point.z);
    dummy.rotation.set(point.random(), point.random() * Math.PI * 2, point.random());
    dummy.scale.set(point.scale * 1.25, point.scale * 0.7, point.scale);
    dummy.updateMatrix();
    stones.setMatrixAt(index, dummy.matrix);
  });
  stones.receiveShadow = true;
  group.add(stones);

  const grass = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.16, 0.8, 4),
    makeMat(0x4d4a28, { roughness: 0.96 }),
    grassPoints.length,
  );
  grass.name = 'road-edge-dry-grass';
  grassPoints.forEach((point, index) => {
    dummy.position.set(point.x, heightAt(point.x, point.z) + point.scale * 0.32, point.z);
    dummy.rotation.set(0, point.random() * Math.PI, point.side * (0.08 + point.random() * 0.15));
    dummy.scale.set(point.scale, point.scale, point.scale);
    dummy.updateMatrix();
    grass.setMatrixAt(index, dummy.matrix);
  });
  group.add(grass);

  const posts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.075, 0.11, 2.5, 6),
    makeMat(0x3a2417, { roughness: 0.92 }),
    postPoints.length,
  );
  posts.name = 'roadside-way-posts';
  postPoints.forEach((point, index) => {
    dummy.position.set(point.x, heightAt(point.x, point.z) + 1.25, point.z);
    dummy.rotation.set(0, point.angle + (point.random() - 0.5) * 0.2, (point.random() - 0.5) * 0.08);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    posts.setMatrixAt(index, dummy.matrix);
  });
  posts.castShadow = true;
  group.add(posts);

  return {
    group,
    counts: {
      dirtPatches: dirtPoints.length,
      stones: stonePoints.length,
      grass: grassPoints.length,
      posts: postPoints.length,
    },
  };
}

function groundedMesh(geometry, material, x, z, yOffset = 0) {
  const node = new THREE.Mesh(geometry, material);
  node.position.set(x, heightAt(x, z) + yOffset, z);
  node.castShadow = true;
  node.receiveShadow = true;
  return node;
}

function createCamp(scene, data, quality) {
  const group = new THREE.Group();
  group.name = `roadside-camp-${data.id}`;
  group.position.set(data.x, heightAt(data.x, data.z), data.z);
  group.rotation.y = data.heading || 0;

  const stoneMaterial = makeMat(0x3d3126, { roughness: 0.98 });
  const woodMaterial = makeMat(0x3b2416, { roughness: 0.92 });
  const crateMaterial = makeMat(0x5b3920, { roughness: 0.9 });
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), stoneMaterial);
    stone.position.set(Math.cos(angle) * 0.55, 0.13, Math.sin(angle) * 0.55);
    stone.scale.set(1.25, 0.7, 1);
    group.add(stone);
  }
  const ember = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.18, 1),
    new THREE.MeshStandardMaterial({
      color: 0x7a2d18,
      emissive: 0xff5b20,
      emissiveIntensity: 1.3,
      roughness: 0.72,
    }),
  );
  ember.name = `${data.id}-camp-embers`;
  ember.position.y = 0.16;
  group.add(ember);
  for (const angle of [-0.55, 0.55]) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.1, 7), woodMaterial);
    log.rotation.set(Math.PI / 2, 0, angle);
    log.position.y = 0.16;
    group.add(log);
  }
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 0.72), crateMaterial);
  crate.name = `${data.id}-camp-crate`;
  crate.position.set(1.25, 0.31, 0.45);
  group.add(crate);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.34, 0.8), makeMat(0x2d3328, { roughness: 0.98 }));
  pack.position.set(-1.1, 0.17, 0.25);
  group.add(pack);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 2.7, 6), woodMaterial);
  pole.position.set(0.9, 1.35, -0.8);
  group.add(pole);
  if (quality?.realtimeAccentLights) {
    const light = new THREE.PointLight(0xff7135, 0.55, 11, 2);
    light.name = `${data.id}-camp-fire-light`;
    light.position.set(0, 0.55, 0);
    group.add(light);
  }
  scene.add(group);
  return group;
}

function createDistantMarker(scene, data) {
  const group = new THREE.Group();
  group.name = `distant-marker-${data.id}`;
  group.position.set(data.x, heightAt(data.x, data.z), data.z);
  const bodyMaterial = makeMat(data.color, { roughness: 0.9 });
  const accentMaterial = makeMat(data.accent, {
    roughness: 0.68,
    emissive: data.accent,
    emissiveIntensity: data.id === 'glass-spire' ? 0.24 : 0.06,
  });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.7, data.height, 6), bodyMaterial);
  pillar.position.y = data.height * 0.5;
  pillar.rotation.z = data.id.includes('tripod') ? 0.05 : 0;
  pillar.castShadow = true;
  group.add(pillar);
  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(1.25, Math.max(2.5, data.height * 0.24), 5),
    accentMaterial,
  );
  crown.position.y = data.height + Math.max(1.2, data.height * 0.1);
  crown.rotation.y = Math.PI / 4;
  group.add(crown);
  for (const side of [-1, 1]) {
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, data.height * 0.68, 5), bodyMaterial);
    brace.position.set(side * 1.2, data.height * 0.32, 0);
    brace.rotation.z = side * -0.18;
    group.add(brace);
  }
  scene.add(group);
  return group;
}

export class VisualAtmosphereSystem {
  constructor(engine) {
    this.engine = engine;
    this.profileId = biomeAt(engine.rig.position.x, engine.rig.position.z);
    this.profile = PROFILES[this.profileId] || PROFILES.clay;
    this.ambient = null;
    this.sky = null;
    this.skyMaterial = null;
    this.roadDressing = null;
    this.camps = [];
    this.markers = [];
    this.time = 0;
    this.frameSamples = [];
  }

  build() {
    const { scene, renderer, atmosphere, quality } = this.engine;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    atmosphere.sun.position.set(-165, 58, -92);
    atmosphere.sun.color.setHex(this.profile.sun);
    atmosphere.sun.intensity = this.profile.sunIntensity * 1.16;
    atmosphere.sun.shadow.bias = -0.00035;
    atmosphere.sun.shadow.normalBias = 0.035;
    atmosphere.hemi.intensity = 0.98;

    this.ambient = new THREE.AmbientLight(this.profile.ambient, this.profile.ambientIntensity * 1.55);
    this.ambient.name = 'v3l4-soft-ambient';
    scene.add(this.ambient);

    atmosphere.sky.material.dispose?.();
    this.skyMaterial = skyMaterial(this.profile);
    atmosphere.sky.material = this.skyMaterial;
    atmosphere.sky.name = 'v3l4-gradient-sky-dome';
    this.sky = atmosphere.sky;
    this.sky.position.copy(this.engine.rig.position);

    this.roadDressing = createInstancedDressing(scene, quality);
    this.camps = VISUAL_ATMOSPHERE_POINTS.roadsideCamps.map((data) => createCamp(scene, data, quality));
    this.markers = VISUAL_ATMOSPHERE_POINTS.distantMarkers.map((data) => createDistantMarker(scene, data));
    this.applyProfile(this.profile, true, 1 / 60);
    return this;
  }

  applyProfile(profile, immediate, dt) {
    const speed = immediate ? 1000 : 1.65;
    const fogTarget = profileColor(profile, 'fog');
    const hemiTarget = profileColor(profile, 'hemi');
    const groundTarget = profileColor(profile, 'ground');
    const ambientTarget = profileColor(profile, 'ambient');
    const sunTarget = profileColor(profile, 'sun');
    dampColor(this.engine.scene.fog.color, fogTarget, speed, dt);
    this.engine.scene.fog.density = damp(
      this.engine.scene.fog.density,
      Math.max(profile.fogDensity, this.engine.quality.fogDensity * 0.82),
      speed,
      dt,
    );
    dampColor(this.engine.atmosphere.hemi.color, hemiTarget, speed, dt);
    dampColor(this.engine.atmosphere.hemi.groundColor, groundTarget, speed, dt);
    dampColor(this.ambient.color, ambientTarget, speed, dt);
    this.ambient.intensity = damp(this.ambient.intensity, profile.ambientIntensity * 1.55, speed, dt);
    dampColor(this.engine.atmosphere.sun.color, sunTarget, speed, dt);
    this.engine.atmosphere.sun.intensity = damp(
      this.engine.atmosphere.sun.intensity,
      profile.sunIntensity * 1.16,
      speed,
      dt,
    );
    dampColor(this.skyMaterial.uniforms.zenithColor.value, profileColor(profile, 'zenith'), speed, dt);
    dampColor(this.skyMaterial.uniforms.horizonColor.value, profileColor(profile, 'horizon'), speed, dt);
    dampColor(this.skyMaterial.uniforms.dustColor.value, profileColor(profile, 'dust'), speed, dt);
    dampColor(this.skyMaterial.uniforms.sunColor.value, sunTarget, speed, dt);
    this.skyMaterial.uniforms.hazeStrength.value = damp(
      this.skyMaterial.uniforms.hazeStrength.value,
      profile.haze,
      speed,
      dt,
    );
    this.engine.scene.background.copy(this.engine.scene.fog.color);
  }

  update(dt) {
    this.time += dt;
    this.sky?.position.copy(this.engine.rig.position);
    const nextId = biomeAt(this.engine.rig.position.x, this.engine.rig.position.z);
    if (nextId !== this.profileId) {
      this.profileId = nextId;
      this.profile = PROFILES[nextId] || PROFILES.clay;
    }
    this.applyProfile(this.profile, false, dt);

    const wetPulse = 0.02 + Math.sin(this.time * 0.22) * 0.006;
    if (['ocean', 'beach', 'port', 'mangrove'].includes(this.profileId)) {
      this.engine.renderer.toneMappingExposure = damp(
        this.engine.renderer.toneMappingExposure,
        1.03 + wetPulse,
        0.8,
        dt,
      );
    } else {
      this.engine.renderer.toneMappingExposure = damp(
        this.engine.renderer.toneMappingExposure,
        1.08,
        0.8,
        dt,
      );
    }
  }

  recordFrame(frameMs) {
    this.frameSamples.push(frameMs);
    if (this.frameSamples.length > 240) this.frameSamples.shift();
  }

  diagnostics() {
    const averageFrameMs = this.frameSamples.length
      ? this.frameSamples.reduce((sum, value) => sum + value, 0) / this.frameSamples.length
      : 0;
    return {
      biome: this.profileId,
      fogDensity: this.engine.scene.fog?.density || 0,
      toneMapping: this.engine.renderer.toneMapping,
      exposure: this.engine.renderer.toneMappingExposure,
      sunPosition: this.engine.atmosphere.sun.position.toArray(),
      sunIntensity: this.engine.atmosphere.sun.intensity,
      ambientIntensity: this.ambient?.intensity || 0,
      sky: this.sky?.name || null,
      roadside: this.roadDressing?.counts || {},
      camps: this.camps.length,
      distantMarkers: this.markers.length,
      drawCalls: this.engine.renderer.info.render.calls,
      triangles: this.engine.renderer.info.render.triangles,
      averageFrameMs,
      estimatedFps: averageFrameMs > 0 ? 1000 / averageFrameMs : 0,
    };
  }
}
