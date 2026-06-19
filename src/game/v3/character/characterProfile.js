import {
  BACKGROUNDS,
  CHARACTER_PROFILE_VERSION,
  RACES,
  backgroundDefinition,
  raceDefinition,
} from '../data/characterData.js';

export const CHARACTER_PROFILE_KEY = 'phoenix7_v3_character_profile';
export const LEGACY_CHARACTER_KEY = 'phx2l_character';
export const LEGACY_CHARACTER_BACKUP_KEY = 'phx2l_character_migrated_backup';

const LEGACY_RACES = Object.freeze({
  human: 'human',
  deimur: 'deimur',
  red: 'red',
  blue: 'blue',
  black: 'black',
  reptile: 'juniorReptiloid',
  reptiloid: 'juniorReptiloid',
  juniorreptiloid: 'juniorReptiloid',
  seniorreptiloid: 'seniorReptiloid',
  carbor: 'tsarbor',
  tsarbor: 'tsarbor',
});

const LEGACY_BACKGROUNDS = Object.freeze({
  prisoner: 'lunar',
  lunar: 'lunar',
  archive: 'archive',
  caravan: 'caravan',
  duelist: 'duelist',
  deserter: 'deserter',
  guide: 'guide',
  zhuzh: 'guide',
  clerk: 'clerk',
  resonant: 'resonant',
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function colorToHex(value, fallback) {
  if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  if (Array.isArray(value) && value.length >= 3) {
    const parts = value.slice(0, 3).map((component) => {
      const normalized = component <= 1 ? component * 255 : component;
      return Math.max(0, Math.min(255, Math.round(normalized))).toString(16).padStart(2, '0');
    });
    return `#${parts.join('')}`;
  }
  return fallback;
}

export function biographyFlagsFor(profile) {
  const flags = new Set(Array.isArray(profile?.biographyFlags) ? profile.biographyFlags : []);
  flags.add('phoenix7_exile');
  flags.add(`background:${profile.background}`);
  if (profile.race === 'red' && profile.gender === 'male') flags.add('red_male_wife_permission');
  return [...flags];
}

export function normalizeCharacterProfile(input = {}) {
  const race = RACES[input.race] ? input.race : 'human';
  const raceDef = raceDefinition(race);
  const requestedGender = input.gender === 'female' ? 'female' : 'male';
  const gender = raceDef.allowedGenders.includes(requestedGender)
    ? requestedGender
    : raceDef.allowedGenders[0];
  const background = BACKGROUNDS[input.background] ? input.background : 'lunar';
  const primaryFallback = raceDef.palette.primary[0];
  const accentFallback = raceDef.palette.accent[0];
  const normalized = {
    version: CHARACTER_PROFILE_VERSION,
    name: String(input.name || '').trim().slice(0, 28) || 'Безымянный ссыльный',
    race,
    gender,
    background,
    primaryColor: colorToHex(input.primaryColor, primaryFallback),
    accentColor: colorToHex(input.accentColor, accentFallback),
    heightOffset: clamp(input.heightOffset, -0.05, 0.05),
    biographyFlags: [],
    migratedFrom: input.migratedFrom || null,
  };
  normalized.biographyFlags = biographyFlagsFor({ ...input, ...normalized });
  return normalized;
}

export function createDefaultCharacterProfile() {
  return normalizeCharacterProfile({
    name: 'Безымянный ссыльный',
    race: 'human',
    gender: 'male',
    background: 'lunar',
  });
}

export function loadCharacterProfile(storage = globalThis.localStorage) {
  if (!storage) return null;
  const raw = storage.getItem(CHARACTER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return normalizeCharacterProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCharacterProfile(profile, storage = globalThis.localStorage) {
  const normalized = normalizeCharacterProfile(profile);
  storage?.setItem?.(CHARACTER_PROFILE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearCharacterProfile(storage = globalThis.localStorage) {
  storage?.removeItem?.(CHARACTER_PROFILE_KEY);
}

export function migrateLegacyCharacterProfile(storage = globalThis.localStorage) {
  const current = loadCharacterProfile(storage);
  if (current) return { profile: current, migrated: false };
  const raw = storage?.getItem?.(LEGACY_CHARACTER_KEY);
  if (!raw) return { profile: null, migrated: false };

  try {
    const legacy = JSON.parse(raw);
    const raceKey = String(legacy.race || 'human').trim().toLowerCase().replace(/[\s_-]+/g, '');
    const backgroundKey = String(legacy.background || legacy.bg || 'prisoner').trim().toLowerCase();
    const race = LEGACY_RACES[raceKey] || 'human';
    const background = LEGACY_BACKGROUNDS[backgroundKey] || 'lunar';
    const raceDef = raceDefinition(race);
    const oldHeight = Number(legacy.height);
    const heightOffset = Number.isFinite(oldHeight) ? clamp(oldHeight - 1, -0.05, 0.05) : 0;
    const profile = normalizeCharacterProfile({
      name: legacy.name,
      race,
      gender: legacy.gender || 'male',
      background,
      primaryColor: colorToHex(legacy.primary, raceDef.palette.primary[0]),
      accentColor: colorToHex(legacy.accent, raceDef.palette.accent[0]),
      heightOffset,
      migratedFrom: LEGACY_CHARACTER_KEY,
      biographyFlags: legacy.biographyFlags,
    });

    storage.setItem(LEGACY_CHARACTER_BACKUP_KEY, raw);
    storage.setItem(CHARACTER_PROFILE_KEY, JSON.stringify(profile));
    storage.removeItem(LEGACY_CHARACTER_KEY);
    return { profile, migrated: true };
  } catch {
    return { profile: null, migrated: false };
  }
}

export function characterProfileSummary(profile) {
  const normalized = normalizeCharacterProfile(profile);
  return {
    ...normalized,
    raceName: raceDefinition(normalized.race).name,
    backgroundName: backgroundDefinition(normalized.background).name,
  };
}
