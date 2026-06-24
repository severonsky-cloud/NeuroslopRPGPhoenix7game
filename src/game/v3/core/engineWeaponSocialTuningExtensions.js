import { ARSENAL } from '../combat/arsenal.js';
import { ITEM_DEFS } from '../items/inventory.js';

const OFFER_SCAN_INTERVAL = 14.0;
const PLAYER_OFFER_COOLDOWN_MS = 180000;
const AGENT_OFFER_COOLDOWN_MS = 420000;
const SETTLEMENT_OFFER_COOLDOWN_MS = 300000;
const SAME_WEAPON_COOLDOWN_MS = 600000;
const MIN_SOCIAL_VALUE = 620;

function weaponValue(weaponId, itemId = null) {
  const w = ARSENAL[weaponId] || {};
  const item = ITEM_DEFS[itemId] || {};
  let value = 35 + (w.damage || 8) * 3.1 + (w.range || 2) * 0.55 + (item.weight || 1) * 5;
  if (w.ww2) value += 120;
  if (w.automatic) value += 85;
  if (w.pellets) value += 45;
  if (w.archetype === 'lmgBelt' || w.archetype === 'lmgMag') value += 150;
  if (w.archetype === 'atLauncher') value += 260;
  if (w.archetype === 'atRifle') value += 210;
  if (w.ammoType === 'rocketAT') value += 90;
  if (w.bayonet) value += 20;
  return Math.round(value);
}

function prestigeClass(weapon = {}) {
  if (weapon.archetype === 'atLauncher') return 'anti-vehicle launcher';
  if (weapon.archetype === 'atRifle') return 'anti-vehicle rifle';
  if (weapon.archetype === 'lmgBelt' || weapon.archetype === 'lmgMag') return 'squad automatic weapon';
  if (weapon.ammoType === 'rocketAT') return 'rocket weapon';
  if ((weapon.damage || 0) >= 95 && (weapon.range || 0) >= 40) return 'heavy battlefield weapon';
  return '';
}

function isActuallyWorthCommunityOffer(weaponId, itemId) {
  const weapon = ARSENAL[weaponId];
  if (!weapon || weaponId === 'fists' || weaponId === 'phase') return false;
  const value = weaponValue(weaponId, itemId);
  if (value >= MIN_SOCIAL_VALUE) return true;
  return Boolean(prestigeClass(weapon)) && value >= 520;
}

function offerPrice(weaponId, itemId, agent = null) {
  const base = weaponValue(weaponId, itemId);
  const faction = agent?.userData?.faction;
  const factionMul = faction === 'bandits' ? 1.04 : faction === 'peasants' || faction === 'redPeasants' ? 1.16 : 1.23;
  return Math.round((base * factionMul + 120) / 10) * 10;
}

function socialTuningState(engine) {
  const state = engine.weaponWorldState?.() || (engine.weaponWorld = engine.weaponWorld || {});
  if (!state.offerCooldowns) {
    state.offerCooldowns = {
      player: 0,
      agent: {},
      settlement: {},
      weapon: {},
    };
  }
  return state;
}

function canMakeOffer(engine, agent, social, now) {
  const state = socialTuningState(engine);
  const u = agent?.userData || {};
  const settlement = u.settlementId || 'road';
  if (state.offers?.some((offer) => offer.itemId === social.itemId && engine.hasInventoryItem?.(offer.itemId))) return false;
  if (state.campaigns?.some((campaign) => campaign.itemId === social.itemId && campaign.active && engine.hasInventoryItem?.(campaign.itemId))) return false;
  if ((state.offerCooldowns.player || 0) > now) return false;
  if ((state.offerCooldowns.agent[u.id] || 0) > now) return false;
  if ((state.offerCooldowns.settlement[settlement] || 0) > now) return false;
  if ((state.offerCooldowns.weapon[social.weaponId] || 0) > now) return false;
  return true;
}

function markOfferCooldown(engine, agent, social, now) {
  const state = socialTuningState(engine);
  const u = agent?.userData || {};
  const settlement = u.settlementId || 'road';
  state.offerCooldowns.player = now + PLAYER_OFFER_COOLDOWN_MS;
  state.offerCooldowns.agent[u.id] = now + AGENT_OFFER_COOLDOWN_MS;
  state.offerCooldowns.settlement[settlement] = now + SETTLEMENT_OFFER_COOLDOWN_MS;
  state.offerCooldowns.weapon[social.weaponId] = now + SAME_WEAPON_COOLDOWN_MS;
}

function subtleReactionLine(agent, weaponName, price, social) {
  const name = agent?.userData?.name || 'Кто-то';
  const cls = social.prestige || 'редкое оружие';
  return `${name} заметил ${weaponName}: это уже ${cls}. Предложение общины: ${price} кредитов.`;
}

export function installWeaponSocialTuningExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__weaponSocialTuningInstalled) return;
  PhoenixV3Engine.__weaponSocialTuningInstalled = true;

  PhoenixV3Engine.prototype.currentSocialWeapon = function currentSocialWeaponTuned() {
    const itemId = this.activeWeaponItemId?.();
    const item = ITEM_DEFS[itemId];
    if (!item?.weaponId) return null;
    const weaponId = item.weaponId;
    if (!isActuallyWorthCommunityOffer(weaponId, itemId)) return null;
    const weapon = ARSENAL[weaponId];
    return {
      itemId,
      weaponId,
      item,
      weapon,
      value: weaponValue(weaponId, itemId),
      prestige: prestigeClass(weapon) || 'rare high-value weapon',
    };
  };

  PhoenixV3Engine.prototype.scanArsenalSocial = function scanArsenalSocialTuned(dt) {
    const state = socialTuningState(this);
    state.scanT -= dt;
    if (state.scanT > 0) return;
    state.scanT = OFFER_SCAN_INTERVAL + Math.random() * 9.0;

    const social = this.currentSocialWeapon?.();
    if (!social) return;
    const now = performance.now();
    const agents = this.livingWorld?.agents || [];
    const candidates = [];

    for (const agent of agents) {
      const u = agent.userData || {};
      if (!u.id || u.settlementCulled) continue;
      const d = Math.hypot(agent.position.x - this.rig.position.x, agent.position.z - this.rig.position.z);
      if (d > 10.5) continue;
      if (!canMakeOffer(this, agent, social, now)) continue;
      const factionInterest = ['peasants', 'redPeasants', 'empire', 'zhuzher', 'bandits'].includes(u.faction) ? 1 : 0.58;
      const distanceWeight = Math.max(0.2, 1 - d / 11);
      const interest = factionInterest * distanceWeight * (0.35 + Math.random() * 0.65);
      candidates.push({ agent, interest });
    }

    candidates.sort((a, b) => b.interest - a.interest);
    const pick = candidates[0];
    if (!pick || pick.interest < 0.26) return;
    if (Math.random() > 0.38) return;

    const agent = pick.agent;
    const u = agent.userData || {};
    const price = offerPrice(social.weaponId, social.itemId, agent);
    const offer = {
      id: `offer_${Date.now()}_${u.id}_${social.itemId}`,
      agentId: u.id,
      agentName: u.name,
      settlementId: u.settlementId || 'road',
      itemId: social.itemId,
      weaponId: social.weaponId,
      weaponName: social.item.name,
      price,
      createdAt: now,
      prestige: social.prestige,
    };
    state.offers.push(offer);
    markOfferCooldown(this, agent, social, now);
    this.livingWorld?.eventLog?.unshift(subtleReactionLine(agent, offer.weaponName, price, social));
    if (this.livingWorld?.eventLog?.length > 12) this.livingWorld.eventLog.pop();
    this.hud.setObjective(`${u.name} редко заинтересовался ${offer.weaponName}. Подойди и нажми E, если хочешь обсудить цену ${price}.`);
  };

  PhoenixV3Engine.prototype.updateWeaponCampaigns = function updateWeaponCampaignsTuned(dt) {
    const state = socialTuningState(this);
    state.campaignT -= dt;
    if (state.campaignT > 0) return;
    state.campaignT = 18.0 + Math.random() * 12.0;
    for (const campaign of state.campaigns || []) {
      if (!campaign.active || !this.hasInventoryItem?.(campaign.itemId)) continue;
      const agent = this.livingWorld?.agents?.find((a) => a.userData.id === campaign.agentId);
      if (!agent || agent.userData.settlementCulled) continue;
      const playerDistance = agent.position.distanceTo(this.rig.position);
      const tick = Math.max(2, Math.round(3 + Math.random() * 9 + (playerDistance < 30 ? 5 : 0)));
      campaign.fund = Math.min(campaign.price, campaign.fund + tick);
      const need = Math.max(0, campaign.price - campaign.fund);
      const line = `${campaign.agentName}: тихий сбор на ${campaign.weaponName}. Ещё ${tick} кредитов, осталось ${need}.`;
      this.livingWorld.eventLog.unshift(line);
      if (this.livingWorld.eventLog.length > 12) this.livingWorld.eventLog.pop();
      if (playerDistance < 22 && Math.random() < 0.35) this.hud.setObjective(line);
    }
  };
}
