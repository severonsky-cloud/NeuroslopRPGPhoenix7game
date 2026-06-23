import * as THREE from '../vendor/three.module.js';
import { heightAt } from '../world/terrain.js';
import { labelSprite, makeMat } from '../world/props.js';
import { ARSENAL, AMMO_TYPES } from '../combat/arsenal.js';
import { ITEM_DEFS } from '../items/inventory.js';

function bindClose(engine) {
  document.getElementById('closeMapBtn')?.addEventListener('click', () => engine.closePausePanel());
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

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

function socialPrice(weaponId, itemId, agent = null) {
  const base = weaponValue(weaponId, itemId);
  const factionMul = agent?.userData?.faction === 'bandits' ? 1.08 : agent?.userData?.faction === 'peasants' || agent?.userData?.faction === 'redPeasants' ? 1.18 : 1.25;
  return Math.round((base * factionMul + 80) / 5) * 5;
}

function isSociallyInteresting(weaponId, itemId) {
  const w = ARSENAL[weaponId];
  if (!w || weaponId === 'fists' || weaponId === 'phase') return false;
  return weaponValue(weaponId, itemId) >= 235 || Boolean(w.ww2 || w.automatic || w.archetype === 'atLauncher' || w.archetype === 'atRifle');
}

function reactionLine(agent, weaponName, price) {
  const f = agent?.userData?.faction;
  const name = agent?.userData?.name || 'Кто-то';
  if (f === 'bandits') return `${name} прищурился: «За ${weaponName} тут можно купить целую дорогу. Я бы договорился, пока вежливо».`;
  if (f === 'peasants' || f === 'redPeasants') return `${name}: «${weaponName} нужен общине. Мы соберём ${price} кредитов честно, только не уноси его».`;
  if (f === 'empire') return `${name}: «Зарегистрируй ${weaponName}. Или продай гарнизону — будет меньше вопросов».`;
  if (f === 'zhuzher') return `${name}: «Жужжеры дали бы за ${weaponName} стаю патронов и песню».`;
  if (f === 'blackElementals' || f === 'blueElementals') return `${name}: «Предмет силы замечен. Цена ${price} — условная, желание общины — настоящее».`;
  return `${name}: «${weaponName} выглядит дорого. Я могу собрать людей и предложить хорошую цену».`;
}

function campaignLine(campaign, tick) {
  const weapon = campaign.weaponName;
  const need = Math.max(0, campaign.price - campaign.fund);
  const lines = [
    `${campaign.agentName}: сбор на ${weapon}. В шапку кинули ещё ${tick} кредитов. Осталось ${need}.`,
    `${campaign.agentName}: митинг у костра — «${weapon} должен служить поселению, а не висеть за спиной одиночки!» Осталось ${need}.`,
    `${campaign.agentName}: маленький концерт для сбора на ${weapon}. Кто-то фальшивит, но кредиты идут. Осталось ${need}.`,
    `${campaign.agentName}: община спорит, кому доверить ${weapon}, если сделка состоится. Осталось ${need}.`,
  ];
  campaign.lineIndex = (campaign.lineIndex || 0) + 1;
  return lines[campaign.lineIndex % lines.length];
}

function makeDroppedWeaponMesh(weaponId) {
  const w = ARSENAL[weaponId] || {};
  const root = new THREE.Group();
  root.name = `dropped_weapon_${weaponId}`;
  const metal = makeMat(w.ww2 ? 0x5f584a : 0x8a7c68, { roughness: 0.62, metalness: 0.22 });
  const dark = makeMat(0x17110c, { roughness: 0.86, metalness: 0.12 });
  const wood = makeMat(0x5a351d, { roughness: 0.9 });
  const brass = makeMat(0xd0a75f, { roughness: 0.55, metalness: 0.12 });

  const archetype = w.archetype || '';
  const longGun = w.range > 30 || archetype.includes('rifle') || archetype.includes('lmg') || archetype === 'atLauncher' || archetype === 'atRifle';
  const length = archetype === 'atRifle' ? 2.3 : archetype === 'atLauncher' ? 1.75 : archetype.includes('lmg') ? 1.55 : longGun ? 1.25 : 0.62;
  const barrelRadius = archetype === 'atLauncher' ? 0.1 : archetype === 'atRifle' ? 0.045 : longGun ? 0.026 : 0.022;

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRadius, barrelRadius, length, 10), metal);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.y = 0.18;
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(longGun ? 0.45 : 0.34, 0.18, longGun ? 0.18 : 0.14), dark);
  receiver.position.set(-length * 0.12, 0.18, 0);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(longGun ? 0.44 : 0.18, 0.16, 0.2), wood);
  stock.position.set(-length * 0.52, 0.14, 0);
  root.add(barrel, receiver, stock);

  if (w.automatic || archetype.includes('lmg') || archetype === 'smg') {
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.09), metal);
    mag.position.set(-0.05, -0.02, 0);
    root.add(mag);
  }
  if (archetype.includes('lmg')) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14), brass);
    drum.rotation.x = Math.PI / 2;
    drum.position.set(0.04, 0.33, 0);
    root.add(drum);
  }
  if (archetype === 'atLauncher') {
    const rear = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.16, 12), dark);
    rear.rotation.z = Math.PI / 2;
    rear.position.set(-length * 0.56, 0.18, 0);
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), brass);
    sight.position.set(0.1, 0.35, 0.08);
    root.add(rear, sight);
  }
  if (w.ammoType) {
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.035), brass);
    tag.position.set(length * 0.18, 0.32, 0.12);
    root.add(tag);
  }
  return root;
}

function disposeNode(scene, node) {
  if (!node) return;
  scene.remove(node);
  node.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((mat) => mat?.dispose?.());
    else child.material?.dispose?.();
  });
}

export function installWeaponWorldExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__weaponWorldExtensionInstalled) return;
  PhoenixV3Engine.__weaponWorldExtensionInstalled = true;

  PhoenixV3Engine.prototype.weaponWorldState = function weaponWorldState() {
    if (!this.weaponWorld) {
      this.weaponWorld = {
        dropped: [],
        offers: [],
        campaigns: [],
        lastHp: this.player.hp,
        scanT: 0,
        campaignT: 0,
        seen: {},
      };
    }
    return this.weaponWorld;
  };

  PhoenixV3Engine.prototype.activeWeaponItemId = function activeWeaponItemId() {
    const eq = this.player.inventoryState?.equipment;
    const hand = eq?.activeHand || 'rightHand';
    return eq?.[hand] || null;
  };

  PhoenixV3Engine.prototype.hasInventoryItem = function hasInventoryItem(itemId) {
    return this.player.inventoryState?.items?.includes(itemId);
  };

  PhoenixV3Engine.prototype.removeInventoryItemEverywhere = function removeInventoryItemEverywhere(itemId) {
    const inv = this.player.inventoryState;
    if (!inv?.items?.includes(itemId)) return false;
    inv.items = inv.items.filter((id) => id !== itemId);
    for (const slot of ['leftHand', 'rightHand']) {
      if (inv.equipment[slot] === itemId) inv.equipment[slot] = 'fists';
    }
    if (!inv.items.includes('fists')) inv.items.push('fists');
    this.player.weapon = this.inventory.activeWeaponId();
    this.aimMode = false;
    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.burstFireState = { weaponId: null, remaining: 0 };
    this.buildViewModel?.();
    this.updateCrosshair?.();
    return true;
  };

  PhoenixV3Engine.prototype.addInventoryItemFromWorld = function addInventoryItemFromWorld(itemId) {
    const inv = this.player.inventoryState;
    if (!inv.items.includes(itemId)) inv.items.push(itemId);
    return true;
  };

  PhoenixV3Engine.prototype.dropActiveWeapon = function dropActiveWeapon(reason = 'manual') {
    if (this.mode === 'boot') return false;
    const itemId = this.activeWeaponItemId();
    const item = ITEM_DEFS[itemId];
    if (!item || item.type !== 'weapon' || item.weaponId === 'fists' || item.weaponId === 'phase') {
      this.hud.setObjective('Нечего ронять: в руке нет физического оружия.');
      return false;
    }
    const weaponId = item.weaponId;
    if (!this.removeInventoryItemEverywhere(itemId)) return false;

    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
    const pos = this.rig.position.clone().addScaledVector(dir, 1.2);
    pos.y = heightAt(pos.x, pos.z) + 0.9;
    const mesh = makeDroppedWeaponMesh(weaponId);
    mesh.position.copy(pos);
    mesh.rotation.set(Math.random() * 0.4, this.yaw + Math.PI * 0.5 + (Math.random() - 0.5) * 0.5, Math.random() * 0.7);
    mesh.userData = {
      type: 'droppedWeapon',
      itemId,
      weaponId,
      name: item.name,
      value: weaponValue(weaponId, itemId),
      vel: dir.multiplyScalar(2.2 + Math.random() * 1.2).add(new THREE.Vector3((Math.random() - 0.5) * 1.3, 2.0 + Math.random() * 0.7, (Math.random() - 0.5) * 1.3)),
      angular: new THREE.Vector3(Math.random() * 2.4, Math.random() * 1.2, Math.random() * 2.0),
      restT: 0,
    };
    this.scene.add(mesh);
    const label = labelSprite(this.scene, `E — поднять ${item.name}`, pos.x, pos.z, 1.2, 0.45);
    label.userData.droppedWeapon = mesh;
    this.labels.push(label);
    this.weaponWorldState().dropped.push({ mesh, label });
    this.hud.setObjective(reason === 'hit' ? `${item.name} выбило из рук! E — подобрать.` : `${item.name} брошен на землю. E — подобрать.`);
    return true;
  };

  PhoenixV3Engine.prototype.pickupNearbyDroppedWeapon = function pickupNearbyDroppedWeapon() {
    const state = this.weaponWorldState();
    let best = null;
    let bestD = Infinity;
    for (const drop of state.dropped) {
      const d = drop.mesh.position.distanceTo(this.rig.position);
      if (d < 2.4 && d < bestD) { best = drop; bestD = d; }
    }
    if (!best) return false;
    const itemId = best.mesh.userData.itemId;
    this.addInventoryItemFromWorld(itemId);
    disposeNode(this.scene, best.mesh);
    disposeNode(this.scene, best.label);
    this.labels = this.labels.filter((l) => l !== best.label);
    state.dropped = state.dropped.filter((drop) => drop !== best);
    this.hud.setObjective(`Поднято: ${ITEM_DEFS[itemId]?.name || itemId}.`);
    return true;
  };

  PhoenixV3Engine.prototype.updateDroppedWeapons = function updateDroppedWeapons(dt) {
    const state = this.weaponWorldState();
    for (const drop of state.dropped) {
      const mesh = drop.mesh;
      const u = mesh.userData;
      if (u.vel.lengthSq() > 0.0001) {
        u.vel.y -= 8.8 * dt;
        mesh.position.addScaledVector(u.vel, dt);
        mesh.rotation.x += u.angular.x * dt;
        mesh.rotation.y += u.angular.y * dt;
        mesh.rotation.z += u.angular.z * dt;
        const ground = heightAt(mesh.position.x, mesh.position.z) + 0.12;
        if (mesh.position.y <= ground) {
          mesh.position.y = ground;
          u.vel.y = Math.abs(u.vel.y) * 0.24;
          u.vel.x *= 0.58;
          u.vel.z *= 0.58;
          u.angular.multiplyScalar(0.62);
          if (u.vel.length() < 0.2) u.vel.set(0, 0, 0);
        }
      }
      drop.label.position.set(mesh.position.x, heightAt(mesh.position.x, mesh.position.z) + 1.05, mesh.position.z);
      drop.label.quaternion.copy(this.camera.quaternion);
    }
    const near = state.dropped.find((drop) => drop.mesh.position.distanceTo(this.rig.position) < 2.4);
    if (near && !this.paused) this.hud.showPrompt(`E — поднять: ${near.mesh.userData.name}`);
  };

  PhoenixV3Engine.prototype.currentSocialWeapon = function currentSocialWeapon() {
    const itemId = this.activeWeaponItemId();
    const item = ITEM_DEFS[itemId];
    if (!item?.weaponId) return null;
    const weaponId = item.weaponId;
    if (!isSociallyInteresting(weaponId, itemId)) return null;
    return { itemId, weaponId, item, weapon: ARSENAL[weaponId], value: weaponValue(weaponId, itemId) };
  };

  PhoenixV3Engine.prototype.scanArsenalSocial = function scanArsenalSocial(dt) {
    const state = this.weaponWorldState();
    state.scanT -= dt;
    if (state.scanT > 0) return;
    state.scanT = 3.5;
    const social = this.currentSocialWeapon();
    if (!social) return;
    const agents = this.livingWorld?.agents || [];
    const now = performance.now();
    for (const agent of agents) {
      const u = agent.userData;
      if (u.settlementCulled) continue;
      const d = Math.hypot(agent.position.x - this.rig.position.x, agent.position.z - this.rig.position.z);
      if (d > 15) continue;
      const key = `${u.id}:${social.itemId}`;
      if ((state.seen[key] || 0) + 45000 > now) continue;
      state.seen[key] = now;
      const price = socialPrice(social.weaponId, social.itemId, agent);
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
      };
      state.offers.push(offer);
      this.livingWorld?.eventLog?.unshift(reactionLine(agent, offer.weaponName, price));
      if (this.livingWorld?.eventLog?.length > 12) this.livingWorld.eventLog.pop();
      this.hud.setObjective(`${u.name} заметил ${offer.weaponName}. E рядом с ним — обсудить цену ${price}.`);
      break;
    }
  };

  PhoenixV3Engine.prototype.offerForAgent = function offerForAgent(agent) {
    const state = this.weaponWorldState();
    const id = agent?.userData?.id;
    const campaign = state.campaigns.find((c) => c.agentId === id && c.active && this.hasInventoryItem(c.itemId));
    if (campaign) return { type: 'campaign', ...campaign };
    const offer = [...state.offers].reverse().find((o) => o.agentId === id && this.hasInventoryItem(o.itemId));
    if (offer) return { type: 'offer', ...offer };
    return null;
  };

  PhoenixV3Engine.prototype.sellWeaponOffer = function sellWeaponOffer(offer) {
    if (!this.hasInventoryItem(offer.itemId)) { this.hud.setObjective('Этого оружия уже нет у тебя.'); return false; }
    this.removeInventoryItemEverywhere(offer.itemId);
    this.player.credits += offer.price;
    const state = this.weaponWorldState();
    state.offers = state.offers.filter((o) => o.id !== offer.id);
    state.campaigns = state.campaigns.filter((c) => c.id !== offer.id && c.itemId !== offer.itemId);
    this.closePausePanel();
    this.hud.setObjective(`Продано: ${offer.weaponName} за ${offer.price} кредитов. Община празднует сделку.`);
    this.livingWorld?.eventLog?.unshift(`${offer.agentName}: сделка состоялась — ${offer.weaponName} переходит общине.`);
    return true;
  };

  PhoenixV3Engine.prototype.refuseWeaponOffer = function refuseWeaponOffer(offer) {
    const state = this.weaponWorldState();
    state.offers = state.offers.filter((o) => o.id !== offer.id);
    const campaign = {
      ...offer,
      id: `campaign_${offer.agentId}_${offer.itemId}`,
      active: true,
      fund: Math.max(25, Math.round(offer.price * 0.14)),
      lineIndex: 0,
      nextEvent: 0,
    };
    state.campaigns = state.campaigns.filter((c) => !(c.agentId === campaign.agentId && c.itemId === campaign.itemId));
    state.campaigns.push(campaign);
    this.closePausePanel();
    this.hud.setObjective(`${offer.agentName} не сдаётся: начинается сбор средств на ${offer.weaponName}.`);
    this.livingWorld?.eventLog?.unshift(`${offer.agentName}: объявлен общественный сбор на ${offer.weaponName}.`);
    return true;
  };

  PhoenixV3Engine.prototype.openWeaponSocialOffer = function openWeaponSocialOffer(agent, offer) {
    this.paused = true;
    const fund = offer.type === 'campaign' ? `<p><b>Собрано общиной:</b> ${offer.fund}/${offer.price} кредитов.</p>` : '';
    const tone = offer.type === 'campaign'
      ? 'Он уже ходит по поселению, собирает пожертвования, устраивает речи и маленькие концерты, чтобы убедить тебя продать оружие общине.'
      : 'Он заметил оружие и предлагает честную цену. Если отказаться, он может попробовать собрать деньги всем поселением.';
    this.hud.openPanel(`<h2>${escapeHtml(offer.agentName)} хочет ${escapeHtml(offer.weaponName)}</h2>
      <p>${escapeHtml(tone)}</p>
      ${fund}
      <p><b>Цена:</b> ${offer.price} кредитов.</p>
      <button id="sellWeaponOfferBtn">Продать оружие</button>
      <button id="refuseWeaponOfferBtn">Отказать</button>
      <p><button id="closeMapBtn">Закрыть</button></p>`);
    document.getElementById('sellWeaponOfferBtn')?.addEventListener('click', () => this.sellWeaponOffer(offer));
    document.getElementById('refuseWeaponOfferBtn')?.addEventListener('click', () => this.refuseWeaponOffer(offer));
    bindClose(this);
  };

  PhoenixV3Engine.prototype.updateWeaponCampaigns = function updateWeaponCampaigns(dt) {
    const state = this.weaponWorldState();
    state.campaignT -= dt;
    if (state.campaignT > 0) return;
    state.campaignT = 5.5;
    for (const campaign of state.campaigns) {
      if (!campaign.active || !this.hasInventoryItem(campaign.itemId)) continue;
      const agent = this.livingWorld?.agents?.find((a) => a.userData.id === campaign.agentId);
      if (!agent || agent.userData.settlementCulled) continue;
      const playerDistance = agent.position.distanceTo(this.rig.position);
      const tick = Math.max(3, Math.round(6 + Math.random() * 18 + (playerDistance < 30 ? 8 : 0)));
      campaign.fund = Math.min(campaign.price, campaign.fund + tick);
      const line = campaignLine(campaign, tick);
      this.livingWorld.eventLog.unshift(line);
      if (this.livingWorld.eventLog.length > 12) this.livingWorld.eventLog.pop();
      if (playerDistance < 35) this.hud.setObjective(line);
    }
  };

  PhoenixV3Engine.prototype.checkCombatWeaponDrop = function checkCombatWeaponDrop() {
    const state = this.weaponWorldState();
    const hp = this.player.hp;
    const lost = state.lastHp - hp;
    state.lastHp = hp;
    if (lost < 7 || this.paused || this.mode === 'boot') return;
    const itemId = this.activeWeaponItemId();
    const item = ITEM_DEFS[itemId];
    if (!item?.weaponId || item.weaponId === 'fists') return;
    const w = ARSENAL[item.weaponId] || {};
    const chance = Math.min(0.34, 0.07 + lost * 0.008 + (w.recoil || 0) * 0.08 + (ITEM_DEFS[itemId]?.weight || 1) * 0.006);
    if (Math.random() < chance) this.dropActiveWeapon('hit');
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionWeaponWorld(code, event) {
    if (code === 'KeyN' && this.mode !== 'boot' && !this.paused) {
      event?.preventDefault?.();
      this.dropActiveWeapon('manual');
      return;
    }
    if (code === 'KeyE' && this.mode !== 'boot' && !this.paused) {
      if (this.pickupNearbyDroppedWeapon()) return;
      const agent = this.livingWorld?.findNear(this.rig, 3.2);
      const offer = this.offerForAgent(agent);
      if (agent && offer) { this.openWeaponSocialOffer(agent, offer); return; }
    }
    return originalOnAction.call(this, code, event);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWeaponWorld(dt) {
    originalUpdate.call(this, dt);
    if (this.mode === 'boot') return;
    this.updateDroppedWeapons(dt);
    this.checkCombatWeaponDrop();
    if (!this.paused) {
      this.scanArsenalSocial(dt);
      this.updateWeaponCampaigns(dt);
    }
  };
}
