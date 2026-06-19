export const QUALITY_PRESETS = {
  low: {
    name: 'Low',
    pixelRatio: 1.0,
    terrainSegmentsX: 110,
    terrainSegmentsZ: 90,
    shadowMapSize: 512,
    fogDensity: 0.0045,
    instancedRocks: 360,
    instancedTsarborTrees: 55,
    instancedGlassTrees: 48,
    realtimeAccentLights: false,
    labelsDistance: 55,
    settlementLandmarkDistance: 135,
    settlementDetailDistance: 62,
    settlementResidentDistance: 48,
    settlementRoadsideDensity: 0.55,
  },
  medium: {
    name: 'Medium',
    pixelRatio: 1.25,
    terrainSegmentsX: 150,
    terrainSegmentsZ: 120,
    shadowMapSize: 768,
    fogDensity: 0.0038,
    instancedRocks: 520,
    instancedTsarborTrees: 78,
    instancedGlassTrees: 66,
    realtimeAccentLights: true,
    labelsDistance: 75,
    settlementLandmarkDistance: 175,
    settlementDetailDistance: 82,
    settlementResidentDistance: 68,
    settlementRoadsideDensity: 0.8,
  },
  high: {
    name: 'High',
    pixelRatio: 1.5,
    terrainSegmentsX: 180,
    terrainSegmentsZ: 150,
    shadowMapSize: 1024,
    fogDensity: 0.0034,
    instancedRocks: 650,
    instancedTsarborTrees: 95,
    instancedGlassTrees: 86,
    realtimeAccentLights: true,
    labelsDistance: 95,
    settlementLandmarkDistance: 220,
    settlementDetailDistance: 105,
    settlementResidentDistance: 88,
    settlementRoadsideDensity: 1,
  },
};

export function getQualityPreset() {
  const url = new URL(location.href);
  const q = url.searchParams.get('quality') || localStorage.getItem('phoenix7_v3_quality') || 'medium';
  return QUALITY_PRESETS[q] || QUALITY_PRESETS.medium;
}

export function setQualityPreset(name) {
  if (QUALITY_PRESETS[name]) localStorage.setItem('phoenix7_v3_quality', name);
}
