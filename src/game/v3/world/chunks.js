import { createInstancedRocks, createInstancedTsarborTrees, createInstancedGlassTrees, placeRoad } from './props.js';
import { ROADS } from '../data/worldData.js';

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class WorldChunks {
  constructor(scene) {
    this.scene = scene;
    this.loaded = false;
    this.objects = [];
  }

  buildStaticWorld() {
    if (this.loaded) return;
    this.loaded = true;

    for (const road of ROADS) placeRoad(this.scene, road, 5.0);

    const rnd = seededRandom(7331);
    const rocks = [];
    for (let i = 0; i < 650; i++) {
      rocks.push({
        x: -80 + rnd() * 340,
        z: -80 + rnd() * 340,
        s: 0.12 + rnd() * 0.7,
        ry: rnd() * 6.28,
      });
    }
    this.objects.push(createInstancedRocks(this.scene, rocks));

    const tsarbor = [];
    for (let i = 0; i < 95; i++) {
      tsarbor.push({ x: 112 + rnd() * 100, z: 130 + rnd() * 90, h: 6 + rnd() * 7, ry: rnd() * 6.28 });
    }
    const trees = createInstancedTsarborTrees(this.scene, tsarbor);
    this.objects.push(trees.trunks, trees.crowns);

    const glass = [];
    for (let i = 0; i < 86; i++) {
      glass.push({ x: 170 + rnd() * 90, z: 18 + rnd() * 96, h: 4 + rnd() * 8, ry: rnd() * 6.28 });
    }
    this.objects.push(createInstancedGlassTrees(this.scene, glass));
  }
}
