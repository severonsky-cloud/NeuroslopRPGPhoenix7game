import { createInstancedRocks, createInstancedTsarborTrees, createInstancedGlassTrees, placeRoad } from './props.js';
import { ROADS, WORLD_BOUNDS } from '../data/worldData.js';

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class WorldChunks {
  constructor(scene, quality) {
    this.scene = scene;
    this.quality = quality;
    this.loaded = false;
    this.objects = [];
  }

  buildStaticWorld() {
    if (this.loaded) return;
    this.loaded = true;

    for (const road of ROADS) placeRoad(this.scene, road, 5.0);

    const rnd = seededRandom(7331);

    const rockCount = this.quality?.instancedRocks ?? 520;
    const rocks = [];
    for (let i = 0; i < rockCount; i++) {
      rocks.push({
        x: WORLD_BOUNDS.minX + 55 + rnd() * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX - 110),
        z: WORLD_BOUNDS.minZ + 40 + rnd() * (WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ - 80),
        s: 0.12 + rnd() * 0.7,
        ry: rnd() * 6.28,
      });
    }
    this.objects.push(createInstancedRocks(this.scene, rocks));

    const treeCount = this.quality?.instancedTsarborTrees ?? 78;
    const tsarbor = [];
    for (let i = 0; i < treeCount; i++) {
      tsarbor.push({ x: 128 + rnd() * 100, z: 218 + rnd() * 92, h: 6 + rnd() * 7, ry: rnd() * 6.28 });
    }
    const trees = createInstancedTsarborTrees(this.scene, tsarbor);
    this.objects.push(trees.trunks, trees.crowns);

    const glassCount = this.quality?.instancedGlassTrees ?? 66;
    const glass = [];
    for (let i = 0; i < glassCount; i++) {
      glass.push({ x: 246 + rnd() * 92, z: 72 + rnd() * 88, h: 4 + rnd() * 8, ry: rnd() * 6.28 });
    }
    this.objects.push(createInstancedGlassTrees(this.scene, glass));
  }
}
