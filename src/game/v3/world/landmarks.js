import * as THREE from '../vendor/three.module.js';
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

  labels.push(labelSprite(scene, 'PORT RACHEL — СТАРТ У ОКЕАНА', -100, 18, 7.2, 0.72));
  for (let i = 0; i < 22; i++) {
    const x = -150 + i * 3.2;
    const z = -30 - (i % 4) * 1.5;
    pillar(scene, x, z, 7 + (i % 5), 0x21140d);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.1), Materials.wood);
    add(scene, cross, x, z, 5.8 + (i % 5));
  }
  for (let i = 0; i < 12; i++) {
    const salt = new THREE.Mesh(new THREE.ConeGeometry(1.3 + i * 0.03, 1.1, 9), makeMat(0xb9a477, { roughness: 0.92 }));
    add(scene, salt, -118 + i * 2.3, 38 + (i % 3) * 1.7, 0.55);
  }

  labels.push(labelSprite(scene, 'КРАСНАЯ ДОРОГА — ДАЛЬНИЙ ПУТЬ К ФОРТУ', 34, 96, 6.4, 0.64));
  for (let i = 0; i < 18; i++) {
    pillar(scene, 10 + i * 7.2, 82 + Math.sin(i) * 8.0, 2.5 + (i % 3), 0x4a2a18);
  }

  labels.push(labelSprite(scene, 'FORT ZARYA — ДАЛЕКИЙ ЮЖНЫЙ ПОСТ ИМПЕРИИ', 142, 176, 9.2, 0.72));
  for (let i = 0; i < 18; i++) {
    const x = 108 + i * 4.4;
    const z = 150 + Math.sin(i) * 3.0;
    pillar(scene, x, z, 5 + (i % 5), 0x24212a);
  }
  for (let i = 0; i < 6; i++) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(2.2, 8 + i % 2, 2.2), makeMat(0x2a2826));
    add(scene, tower, 116 + i * 11, 166 + (i % 2) * 18, 4 + (i % 2) * 0.5);
  }

  labels.push(labelSprite(scene, 'КРАЙ МЁРТВОЙ САВАННЫ', 250, 250, 6.4, 0.68));
  for (let i = 0; i < 22; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1.6 + (i % 3) * 0.2, 0.045, 6, 20, Math.PI * 0.92), makeMat(0xd0b27a, { roughness: 0.76 }));
    rib.rotation.z = Math.PI / 2;
    rib.rotation.y = Math.random() * Math.PI;
    add(scene, rib, 220 + Math.random() * 70, 226 + Math.random() * 72, 1.2 + Math.random() * 1.5);
  }

  labels.push(labelSprite(scene, 'ЛЕС ЦАРБОРЦЕВ — ПОСАДКИ ПРОТИВ ЧУМЫ', 174, 248, 9.5, 0.72));
  for (const p of [{x:150,z:236,h:17},{x:174,z:260,h:23},{x:198,z:236,h:18}]) {
    pillar(scene, p.x, p.z, p.h, 0x352312, 0x061d0f);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(4.8, 9, 8), makeMat(0x17361f, { emissive: 0x062410, emissiveIntensity: 0.3 }));
    add(scene, crown, p.x, p.z, p.h + 3.8);
  }

  labels.push(labelSprite(scene, 'СТЕКЛЯННАЯ ВОТЧИНА ЧЁРНЫХ ЭЛЕМЕНТАЛЕЙ', 288, 112, 9.2, 0.7));
  for (let i = 0; i < 36; i++) {
    const x = 246 + Math.random() * 92;
    const z = 72 + Math.random() * 88;
    const h = 4 + Math.random() * 10;
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.55 + Math.random() * 0.6, h, 5), Materials.glass);
    crystal.rotation.y = Math.random() * Math.PI;
    add(scene, crystal, x, z, h / 2);
  }
  for (let i = 0; i < 14; i++) {
    const x = 260 + Math.random() * 62;
    const z = 86 + Math.random() * 62;
    const h = 5 + Math.random() * 6;
    const ob = new THREE.Mesh(new THREE.ConeGeometry(0.55, h, 4), Materials.black);
    ob.rotation.y = Math.PI / 4;
    add(scene, ob, x, z, h / 2);
    if (quality.realtimeAccentLights) {
      const l = new THREE.PointLight(0x5a22ff, 0.35, 18);
      l.position.set(x, heightAt(x, z) + 4.2, z);
      scene.add(l);
    }
  }

  labels.push(labelSprite(scene, 'ЛЕДЯНОЙ ШЕЛЬФ — МОРСКАЯ АЛЬТЕРНАТИВА К ФОРТУ', 205, -145, 6.0, 0.68));
  for (let i = 0; i < 28; i++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2 + Math.random() * 8, 0.25 + Math.random() * 0.8, 2 + Math.random() * 6), Materials.ice);
    slab.rotation.y = Math.random() * Math.PI;
    add(scene, slab, 148 + Math.random() * 110, -180 + Math.random() * 90, 0.15);
  }

  return labels;
}
