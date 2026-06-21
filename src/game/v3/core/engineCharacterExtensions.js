import { BACKGROUNDS, RACES, backgroundDefinition, raceDefinition } from '../data/characterData.js';
import {
  characterProfileSummary,
  loadCharacterProfile,
  migrateLegacyCharacterProfile,
  normalizeCharacterProfile,
  saveCharacterProfile,
} from '../character/characterProfile.js';
import { RacialAbilitySystem } from '../character/racialAbilities.js';
import { openCharacterCreator } from '../ui/characterCreator.js';
import { makeRpgState } from '../rpg/rpgData.js';
import { makeCharacterInventoryState } from '../items/inventory.js';
import { makeFirearmState } from '../combat/firearmState.js';
import { PLAYER_START } from '../data/worldData.js';
import { heightAt } from '../world/terrain.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function applySkillBonuses(player, bonuses = {}) {
  for (const [skill, value] of Object.entries(bonuses)) {
    if (player.rpg.skills[skill]) player.rpg.skills[skill].level += value;
  }
}

export function applyCharacterProfile(engine, rawProfile, { rebuild = true } = {}) {
  const profile = normalizeCharacterProfile(rawProfile);
  const race = raceDefinition(profile.race);
  const background = backgroundDefinition(profile.background);
  const player = engine.player;

  player.characterProfile = profile;
  player.name = profile.name;
  player.race = profile.race;
  player.gender = profile.gender;
  player.background = profile.background;
  player.biographyFlags = [...profile.biographyFlags];
  player.dialogueHooks = [...background.dialogueHooks];
  player.rpg = makeRpgState();
  applySkillBonuses(player, race.skillBonuses);
  applySkillBonuses(player, background.skillBonuses);
  player.hpMax = race.stats.hp;
  player.stMax = race.stats.stamina;
  player.phMax = race.stats.phase;
  player.hp = player.hpMax;
  player.st = player.stMax;
  player.ph = player.phMax;
  player.credits = background.credits;
  player.inventoryState = makeCharacterInventoryState(profile.background);
  player.firearmState = makeFirearmState();
  player.characterRuntime = {
    moveSpeed: race.stats.moveSpeed,
    staminaRegen: 1,
    phaseRegen: 1,
    meleeDamage: 1,
    phaseDamage: 1,
    firearmSpread: 1,
    reloadDuration: 1,
    incomingDamage: 1,
    nullVeil: false,
    rooted: false,
  };
  player.weapon = engine.inventory.activeWeaponId();
  player.__worldRewardCreditsApplied = 0;
  player.__worldRewardAmmoApplied = {};
  engine.characterProfile = profile;
  engine.characterProfileReady = true;
  engine.worldState?.applyPersistentRewards?.(engine);

  if (rebuild) {
    engine.setPlayerBodyRace?.(profile);
    engine.buildViewModel?.();
    engine.racialAbility = new RacialAbilitySystem(engine);
  }
  return profile;
}

function profileHtml(profile) {
  const summary = characterProfileSummary(profile);
  const race = RACES[profile.race];
  const background = BACKGROUNDS[profile.background];
  return `<div class="line"><b>${escapeHtml(summary.name)}</b> · ${summary.raceName} · ${profile.gender === 'female' ? 'женщина' : 'мужчина'}</div>
    <div class="line"><b>Предыстория:</b> ${summary.backgroundName}</div>
    <div class="line"><b>Пассив:</b> ${race.passive}</div>
    <div class="line"><b>Q — ${race.ability.name}:</b> ${race.ability.description}</div>
    <div class="line"><b>Диалоговые флаги:</b> ${background.dialogueHooks.join(', ')}</div>`;
}

export function installCharacterExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__characterExtensionInstalled) return;
  PhoenixV3Engine.__characterExtensionInstalled = true;

  const originalBoot = PhoenixV3Engine.prototype.boot;
  PhoenixV3Engine.prototype.boot = function bootWithCharacterProfile() {
    const migration = migrateLegacyCharacterProfile();
    const profile = migration.profile || loadCharacterProfile();
    if (profile) {
      applyCharacterProfile(this, profile, { rebuild: false });
      if (migration.migrated) this.log.unshift('v3M2A: старый профиль phx2l_character автоматически мигрирован и сохранён в backup.');
    } else {
      this.characterProfileReady = false;
    }
    const result = originalBoot.call(this);
    this.racialAbility = new RacialAbilitySystem(this);
    this.configureCharacterEntryButtons();
    this.log.unshift('v3M2A: встроенный creator, восемь рас, восемь предысторий и расовые способности Q.');
    return result;
  };

  const originalStart = PhoenixV3Engine.prototype.start;
  PhoenixV3Engine.prototype.start = function startWithCharacterGate() {
    if (!this.characterProfileReady) {
      this.requestGameStart({ newGame: true });
      return false;
    }
    return originalStart.call(this);
  };

  PhoenixV3Engine.prototype.configureCharacterEntryButtons = function configureCharacterEntryButtons() {
    const start = document.getElementById('startBtn');
    const newGame = document.getElementById('newGameBtn');
    if (start) start.textContent = this.characterProfileReady ? 'Продолжить' : 'Создать персонажа';
    if (newGame) newGame.hidden = !this.characterProfileReady;
  };

  PhoenixV3Engine.prototype.requestGameStart = function requestGameStart({ newGame = false } = {}) {
    const stored = loadCharacterProfile();
    if (!newGame && stored) {
      applyCharacterProfile(this, stored);
      return this.start();
    }
    if (newGame && stored && !globalThis.confirm('Новая игра заменит активный профиль персонажа. Продолжить?')) return false;
    if (this.characterCreator) return false;
    this.characterCreator = openCharacterCreator({
      existingProfile: newGame ? null : stored,
      onConfirm: (profile) => {
        this.characterCreator = null;
        if (newGame) {
          this.worldState?.reset?.();
          this.taxQuestSystem?.resetRuntime?.();
        }
        const saved = saveCharacterProfile(profile);
        applyCharacterProfile(this, saved);
        this.rig.position.set(PLAYER_START.x, heightAt(PLAYER_START.x, PLAYER_START.z), PLAYER_START.z);
        this.configureCharacterEntryButtons();
        this.start();
      },
      onCancel: stored ? () => { this.characterCreator = null; } : null,
    });
    return true;
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWithRacialAbility(code, event) {
    if (code === 'KeyQ' && this.mode !== 'boot' && !this.paused) {
      event?.preventDefault?.();
      this.racialAbility?.activate();
      return;
    }
    return originalOnAction.call(this, code, event);
  };

  const originalOpenCharacter = PhoenixV3Engine.prototype.openCharacter;
  PhoenixV3Engine.prototype.openCharacter = function openCharacterWithIdentity() {
    originalOpenCharacter.call(this);
    const panel = document.getElementById('panel');
    if (panel && this.characterProfile) {
      panel.innerHTML = panel.innerHTML.replace('<h2>', `${profileHtml(this.characterProfile)}<h2>`);
      document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
    }
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithCharacterSystems(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot' && !this.paused) this.racialAbility?.update(dt);
  };

  PhoenixV3Engine.prototype.getCharacterDiagnostics = function getCharacterDiagnostics() {
    return {
      profile: this.characterProfile ? characterProfileSummary(this.characterProfile) : null,
      profileReady: Boolean(this.characterProfileReady),
      inventoryItems: [...(this.player.inventoryState?.items || [])],
      skillLevels: Object.fromEntries(Object.entries(this.player.rpg.skills).map(([key, value]) => [key, value.level])),
      ability: this.racialAbility?.diagnostics?.() || null,
      body: this.getPlayerBodyDiagnostics?.() || null,
      hands: this.getPlayerHandsDiagnostics?.() || null,
    };
  };
}
