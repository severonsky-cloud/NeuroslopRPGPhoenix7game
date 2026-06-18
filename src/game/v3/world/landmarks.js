import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { heightAt } from './terrain.js';
import { makeMat, Materials, labelSprite } from './props.js';

function add(scene, mesh, x, z, yOffset = 0) {
  mesh.position.set(x, heightAt(x, z) + yOffset, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function pillar(scene, x, z, h, color, emissive = 0x000000) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.46, h, 6),
    makeMat(color, { emissive, emissiveIntensity: emissive ? 0.25 : 0, roughness: 0.7 })
  );
  add(scene, mesh, x, z, h / 2);
  return mesh;
}

export function createBiomeLandmarks(scene, quality) {
  const labels = [];

  // Port Rachel: masts, smoke-like silhouettes and salt piles.
  labels.push(labelSprite(scene, 'PORT RACHEL — СОЛЬ, ГЛИНА, ОКЕАН', -82, 10, 7.2, 0.72));
  for (let i = 0; i < 18; i++) {
    const x = -120 + i * 3.2;
    const z = -28 - (i % 4) * 1.5;
    pillar(scene, x, z, 7 + (i % 5), 0x21140d);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.1), Materials.wood);
    add(scene, cross, x, z, 5.8 + (i % 5));
  }
  for (let i = 0; i < 10; i++) {
    const salt = new THREE.Mesh(new THREE.ConeGeometry(1.3 + i * 0.03, 1.1, 9), makeMat(0xb9a477, { roughness: 0.92 }));
    add(scene, salt, -88 + i * 2.2, 30 + (i % 3) * 1.6, 0.55);
  }

  // Fort Zarya: ridge silhouette.
  labels.push(labelSprite(scene, 'FORT ZARYA — ВОЕННЫЙ ГРЕБЕНЬ', 38, 52, 8.6, 0.68));
  for (let i = 0; i < 12; i++) {
    const x = 18 + i * 4.2;
    const z = 44 + Math.sin(i) * 2.0;
    pillar(scene, x, z, 5 + (i % 4), 0x24212a);
  }

  // Dead savanna: ribs and dead trunks.
  labels.push(labelSprite(scene, 'КРАЙ МЁРТВОЙ САВАННЫ', 118, 98, 6.2, 0.65));
  for (let i = 0; i < 16; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1.6 + (i % 3) * 0.2, 0.045, 6, 20, Math.PI * 0.92), makeMat(0xd0b27a, { roughness: 0.76 }));
    rib.rotation.z = Math.PI / 2;
    rib.rotation.y = Math.random() * Math.PI;
    add(scene, rib, 102 + Math.random() * 42, 92 + Math.random() * 42, 1.2 + Math.random() * 1.5);
  }

  // Tsarbor forest: three giant living trunks.
  labels.push(labelSprite(scene, 'ЛЕС ЦАРБОРЦЕВ', 168, 190, 9.5, 0.72));
  for (const p of [{x:150,z:176,h:17},{x:172,z:198,h:22},{x:190,z:174,h:18}]) {
    pillar(scene, p.x, p.z, p.h, 0x352312, 0x061d0f);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(4.8, 9, 8), makeMat(0x17361f, { emissive: 0x062410, emissiveIntensity: 0.3 }));
    add(scene, crown, p.x, p.z, p.h + 3.8);
  }

  // Glass forest: black elemental demesne.
  labels.push(labelSprite(scene, 'СТЕКЛЯННАЯ ВОТЧИНА ЧЁРНЫХ ЭЛЕМЕНТАЛЕЙ', 226, 72, 9.2, 0.7));
  for (let i = 0; i < 32; i++) {
    const x = 184 + Math.random() * 84;
    const z = 30 + Math.random() * 76;
    const h = 4 + Math.random() * 10;
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.55 + Math.random() * 0.6, h, 5), Materials.glass);
    crystal.rotation.y = Math.random() * Math.PI;
    add(scene, crystal, x, z, h / 2);
  }
  for (let i = 0; i < 12; i++) {
    const x = 194 + Math.random() * 62;
    const z = 42 + Math.random() * 58;
    const ob = new THREE.Mesh(new THREE.ConeGeometry(0.55, 5 + Math.random() * 6, 4), Materials.black);
    ob.rotation.y = Math.PI / 4;
    add(scene, ob, x, z, ob.geometry.parameters.height / 2);
    if (quality.realtimeAccentLights) {
      const l = new THREE.PointLight(0x5a22ff, 0.35, 18);
      l.position.set(x, heightAt(x, z) + 4.2, z);
      scene.add(l);
    }
  }

  // Ice shelf: cold broken plates.
  labels.push(labelSprite(scene, 'ЛЕДЯНОЙ ШЕЛЬФ', 190, -118, 6.0, 0.68));
  for (let i = 0; i < 24; i++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2 + Math.random() * 8, 0.25 + Math.random() * 0.8, 2 + Math.random() * 6), Materials.ice);
    slab.rotation.y = Math.random() * Math.PI;
    add(scene, slab, 145 + Math.random() * 95, -145 + Math.random() * 78, 0.15);
  }

  return labels;
}
