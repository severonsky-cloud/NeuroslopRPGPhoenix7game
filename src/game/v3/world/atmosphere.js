import * as THREE from '../vendor/three.module.js';

export const BIOME_ATMOSPHERE = {
  ocean: { fog: 0x4c6d73, density: 0.0042, sky: 0x7f6b55, hemi: 0xffd8a0, ground: 0x20343b },
  beach: { fog: 0xb36b3f, density: 0.0039, sky: 0xaa6640, hemi: 0xffd8a0, ground: 0x40241a },
  clay: { fog: 0xb36b3f, density: 0.0037, sky: 0xa45d34, hemi: 0xffd8a0, ground: 0x352318 },
  port: { fog: 0xa45d34, density: 0.0038, sky: 0x8f4e31, hemi: 0xffc47a, ground: 0x2c2118 },
  mangrove: { fog: 0x2f4329, density: 0.0052, sky: 0x4e5a38, hemi: 0xbedc9a, ground: 0x132016 },
  fort: { fog: 0x8f5f3a, density: 0.0035, sky: 0x8a5234, hemi: 0xffc07a, ground: 0x251c19 },
  rednode: { fog: 0xa05038, density: 0.0046, sky: 0x6b2f2a, hemi: 0xffa070, ground: 0x2a1210 },
  savanna: { fog: 0xae814f, density: 0.0048, sky: 0x9f7440, hemi: 0xffd28a, ground: 0x2f271a },
  tsarbor: { fog: 0x183322, density: 0.0062, sky: 0x1f3527, hemi: 0x9ec28a, ground: 0x0e1912 },
  glass: { fog: 0x182129, density: 0.0044, sky: 0x1b2630, hemi: 0x8fd8d2, ground: 0x08060c },
  ice: { fog: 0x7793a3, density: 0.005, sky: 0x8aa6b8, hemi: 0xcdeeff, ground: 0x26333a },
  battery: { fog: 0x6a5a47, density: 0.004, sky: 0x6f5440, hemi: 0xd8b080, ground: 0x26221f },
};

export function createAtmosphere(scene, quality) {
  const hemi = new THREE.HemisphereLight(0xffd8a0, 0x182129, 1.05);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffb36e, 1.75);
  sun.position.set(-70, 90, 42);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  scene.add(sun);

  const skyGeo = new THREE.SphereGeometry(1300, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x9b5a35, side: THREE.BackSide, fog: false });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.name = 'v3_art_sky_dome';
  scene.add(sky);

  return { hemi, sun, sky };
}

export function applyBiomeAtmosphere(scene, pack, biomeId, quality) {
  const a = BIOME_ATMOSPHERE[biomeId] || BIOME_ATMOSPHERE.clay;
  scene.fog.color.setHex(a.fog);
  scene.fog.density = Math.max(a.density, quality.fogDensity * 0.8);
  scene.background.setHex(a.sky);
  pack.sky.material.color.setHex(a.sky);
  pack.hemi.color.setHex(a.hemi);
  pack.hemi.groundColor.setHex(a.ground);
}
