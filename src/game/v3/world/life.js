import * as THREE from '../vendor/three.module.js';
import { LIFE_AGENTS, FACTIONS, GOODS, SETTLEMENT_ECONOMY } from '../data/lifeData.js';
import { resolveSettlementDialogue } from '../data/settlementsData.js';
import { createMonster } from '../entities/monster.js';
import { heightAt } from './terrain.js';
import { makeMat, labelSprite } from './props.js';
import { worldClock } from './dayNight.js';

const MAX_EVENT_LOG = 16;

function dist2d(a, b) {
  return Math.hypot((a.x ?? a.position?.x ?? 0) - (b.x ?? b.position?.x ?? 0), (a.z ?? a.position?.z ?? 0) - (b.z ?? b.position?.z ?? 0));
}

function cargoValue(cargo = {}) {
  return Object.entries(cargo).reduce((sum, [key, amount]) => sum + (GOODS[key]?.value || 1) * amount, 0);
}

function cargoTotal(cargo = {}) {
  return Object.values(cargo).reduce((sum, amount) => sum + amount, 0);
}

function cargoSummary(cargo = {}) {
  const rows = Object.entries(cargo).filter(([, amount]) => amount > 0);
  if (!rows.length) return 'пусто';
  return rows.map(([key, amount]) => `${GOODS[key]?.name || key} ×${amount}`).join(', ');
}

function cloneCargo(cargo = {}) {
  return Object.fromEntries(Object.entries(cargo).map(([key, amount]) => [key, amount]));
}

function reduceCargo(cargo = {}, amount = 1) {
  let left = amount;
  const taken = {};
  for (const key of Object.keys(cargo)) {
    if (left <= 0) break;
    const n = Math.min(cargo[key], left);
    if (n > 0) {
      cargo[key] -= n;
      taken[key] = (taken[key] || 0) + n;
      left -= n;
    }
  }
  return taken;
}

function makeStartingCargo(agent) {
  if (agent.cargo) return cloneCargo(agent.cargo);
  if (agent.originId === 'red_clay_village') return { redClay: 8, ashGlass: 1, driedMoss: 2 };
  if (agent.originId === 'port_rachel') return { salt: 8, tools: 1 };
  if (agent.originId === 'fort_zarya') return { tools: 2, salt: 3 };
  return { redClay: 4 };
}

function createAgentModel(agent) {
  const faction = FACTIONS[agent.faction] || { color: 0xffffff, name: 'Unknown' };
  const group = new THREE.Group();
  const bodyColor = faction.color || 0xffffff;
  const headColor = agent.faction === 'redPeasants' ? 0xc75b3f : agent.faction === 'zhuzher' ? 0x9a9f52 : 0xd3ad78;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.1, 4, 8), makeMat(bodyColor));
  body.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 8), makeMat(headColor));
  head.position.y = 1.84;
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.46, 0.16), makeMat(0x21140d));
  pack.position.set(0, 1.15, 0.33);
  group.add(body, head, pack);

  if (agent.role === 'caravan') {
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 1.35), makeMat(agent.faction === 'redPeasants' ? 0x6b2a1c : 0x4a2f1b));
    cart.position.set(0, 0.45, 1.15);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.35, 0.72), makeMat(0x7c5431));
    crate.position.set(0, 0.95, 1.08);
    const wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), makeMat(0x1d120c));
    const wheel2 = wheel1.clone();
    wheel1.rotation.z = Math.PI / 2; wheel2.rotation.z = Math.PI / 2;
    wheel1.position.set(-0.55, 0.22, 1.15); wheel2.position.set(0.55, 0.22, 1.15);
    group.add(cart, crate, wheel1, wheel2);
  }

  if (agent.role === 'orderKnight' || agent.role === 'knight') {
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.05), makeMat(0xc8c0a8, { metalness: 0.25, roughness: 0.35 }));
    sword.position.set(0.42, 1.05, 0.05);
    sword.rotation.z = -0.35;
    group.add(sword);
  }

  if (agent.role === 'planter') {
    const sapling = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 6), makeMat(0x2d6b3b, { emissive: 0x0b2312, emissiveIntensity: 0.3 }));
    sapling.position.set(0.45, 0.55, 0.2);
    group.add(sapling);
  }

  if (agent.role === 'raidPatrol') {
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.35, 6), makeMat(0xb0a060));
    spear.position.set(-0.45, 1.05, 0.05);
    spear.rotation.z = 0.25;
    group.add(spear);
  }

  if (agent.role === 'trainer') {
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({ color: 0x8a78ff, emissive: 0x5a22ff, emissiveIntensity: 0.9, transparent: true, opacity: 0.75 })
    );
    orb.position.set(0.42, 1.45, 0.2);
    group.add(orb);
  }

  return group;
}

export class LivingWorldSystem {
  constructor(scene, labels, playerProvider = null, systems = {}) {
    this.scene = scene;
    this.labels = labels;
    this.playerProvider = playerProvider;
    this.systems = systems;
    this.agents = [];
    this.eventLog = [];
    this.time = 0;
    this.encounterThink = 0;
    this.economy = typeof structuredClone === 'function' ? structuredClone(SETTLEMENT_ECONOMY) : JSON.parse(JSON.stringify(SETTLEMENT_ECONOMY));
    this.activeEncounters = [];
    this.completedEncounters = 0;
    this.spawnedHostiles = 0;
    this._daySegment = null;
  }

  build() {
    this.addAgents(LIFE_AGENTS);
    this.logEvent('v3N2: живой тракт включён — караваны, патрули, засады и экономика дороги.');
  }

  get player() {
    return this.systems.player || this.playerProvider?.() || globalThis.PHX_V3_ENGINE?.player || null;
  }

  get rpg() {
    return this.systems.rpg || globalThis.PHX_V3_ENGINE?.rpg || null;
  }

  get monsters() {
    return this.systems.monsters || globalThis.PHX_V3_ENGINE?.monsters || [];
  }

  logEvent(line, objective = false) {
    this.eventLog.unshift(line);
    if (this.eventLog.length > MAX_EVENT_LOG) this.eventLog.pop();
    if (objective) {
      const hud = this.systems.hud || globalThis.PHX_V3_ENGINE?.hud;
      hud?.setObjective?.(line);
    }
  }

  addAgent(agent) {
    const existing = this.agents.find((obj) => obj.userData.id === agent.id);
    if (existing) return existing;
    const obj = createAgentModel(agent);
    obj.position.set(agent.x, heightAt(agent.x, agent.z), agent.z);
    const label = labelSprite(this.scene, agent.name, agent.x, agent.z, 2.65, 0.42);
    const isCaravan = agent.role === 'caravan';
    obj.userData = {
      type: 'lifeAgent',
      ...agent,
      routeIndex: 1,
      speed: agent.speed ?? (isCaravan ? 0.75 : agent.role === 'patrol' ? 1.1 : agent.role === 'raidPatrol' ? 1.05 : 0.95),
      baseSpeed: agent.speed ?? (isCaravan ? 0.75 : agent.role === 'patrol' ? 1.1 : agent.role === 'raidPatrol' ? 1.05 : 0.95),
      factionName: FACTIONS[agent.faction]?.name || agent.faction,
      state: agent.role === 'worker' ? 'working' : agent.role === 'raidPatrol' ? 'raiding' : isCaravan ? 'travelling' : 'travelling',
      tradeState: isCaravan ? 'loaded_to_market' : null,
      cargo: isCaravan ? makeStartingCargo(agent) : null,
      baseCargo: isCaravan ? makeStartingCargo(agent) : null,
      credits: agent.credits ?? 0,
      tools: agent.tools ?? 0,
      encounterCooldown: 10 + Math.random() * 15,
      underAttack: false,
      // Settlement residents get a home anchor so they can drift home and idle at night.
      homeAnchor: agent.settlementId ? { x: agent.x, z: agent.z } : null,
      scheduleState: agent.settlementId ? 'working' : null,
      skillLevel: agent.skillLevel ?? (agent.role === 'knight' || agent.role === 'orderKnight' ? 1 : 0),
      gearTier: agent.gearTier ?? (agent.role === 'knight' || agent.role === 'orderKnight' ? 1 : 0),
      label,
    };
    label.userData.lifeAgent = obj;
    this.scene.add(obj);
    this.agents.push(obj);
    this.labels.push(label);
    return obj;
  }

  addAgents(agents = []) {
    return agents.map((agent) => this.addAgent(agent));
  }

  update(dt, playerRig) {
    this.time += dt;
    this.tickWorldClockEvents();
    this.updateAgents(dt, playerRig);
    this.updateEncounterThinking(dt, playerRig);
    this.updateActiveEncounters(dt, playerRig);
  }

  updateAgents(dt, playerRig) {
    const resting = worldClock.nightFactor > 0.55;
    for (const obj of this.agents) {
      const u = obj.userData;
      if (u.encounterCooldown > 0) u.encounterCooldown -= dt;
      const playerDistance = Math.hypot(u.x - playerRig.position.x, u.z - playerRig.position.z);
      if (u.settlementId) {
        const residentDistance = u.residentDistance || 68;
        const culled = playerDistance > residentDistance;
        u.settlementCulled = culled;
        obj.visible = !culled;
        if (u.label) u.label.visible = !culled;
        if (culled) continue;
      }

      if (u.underAttack) {
        u.state = 'fighting';
        u.speed = Math.max(0.12, u.baseSpeed * 0.2);
      } else {
        u.speed = u.baseSpeed;
      }

      if (u.homeAnchor && resting) {
        // Night: drift back to the home anchor and idle there at reduced pace.
        u.scheduleState = 'resting';
        const home = u.homeAnchor;
        const dh = Math.hypot(home.x - u.x, home.z - u.z);
        if (dh > 0.8) {
          const sp = (u.speed || 0.9) * 0.45;
          u.x += (home.x - u.x) / dh * dt * sp;
          u.z += (home.z - u.z) / dh * dt * sp;
          obj.position.set(u.x, heightAt(u.x, u.z), u.z);
          obj.lookAt(home.x, heightAt(home.x, home.z) + 1, home.z);
        }
      } else {
        if (u.homeAnchor) u.scheduleState = 'working';
        if (u.route && u.route.length && !u.underAttack) {
          const target = u.route[u.routeIndex % u.route.length];
          const d = Math.hypot(target.x - u.x, target.z - u.z);
          if (d < 0.75) {
            this.onRoutePoint(u, target);
            u.routeIndex++;
          } else {
            u.x += (target.x - u.x) / d * dt * u.speed;
            u.z += (target.z - u.z) / d * dt * u.speed;
            obj.position.set(u.x, heightAt(u.x, u.z), u.z);
            obj.lookAt(target.x, heightAt(target.x, target.z) + 1, target.z);
          }
        }
      }

      const nearPlayer = playerDistance < 22;
      if (nearPlayer && Math.random() < dt * 0.015) this.ambientLine(u);
    }
  }

  updateEncounterThinking(dt, playerRig) {
    this.encounterThink += dt;
    if (this.encounterThink < 1.0) return;
    this.encounterThink = 0;
    if (this.activeEncounters.filter(e => !e.resolved).length >= 3) return;

    const caravans = this.agents
      .map(obj => obj.userData)
      .filter(u => u.role === 'caravan' && !u.underAttack && cargoTotal(u.cargo) > 0 && u.encounterCooldown <= 0);

    for (const caravan of caravans) {
      const playerDistance = Math.hypot(caravan.x - playerRig.position.x, caravan.z - playerRig.position.z);
      if (playerDistance > 130) continue;

      const directThreat = this.findThreatNear(caravan, 38);
      if (directThreat) {
        this.spawnCaravanAmbush(caravan, directThreat.faction, `${directThreat.name} заметили груз`);
        return;
      }

      const danger = caravan.faction === 'redPeasants' ? 0.065 : 0.045;
      const nightMul = worldClock.nightFactor > 0.55 ? 1.7 : 1;
      if (Math.random() < danger * nightMul) {
        const faction = Math.random() < 0.62 ? 'bandits' : 'zhuzher';
        this.spawnCaravanAmbush(caravan, faction, faction === 'zhuzher' ? 'жужжерский налёт с края саванны' : 'засада у дороги');
        return;
      }
    }

    this.maybeOrderWarSpark(playerRig);
    this.maybePhaseProductionScene(playerRig);
  }

  findThreatNear(caravan, radius = 35) {
    return this.agents
      .map(obj => obj.userData)
      .find(u => (u.faction === 'bandits' || u.faction === 'zhuzher') && Math.hypot(u.x - caravan.x, u.z - caravan.z) < radius);
  }

  spawnCaravanAmbush(caravan, faction = 'bandits', reason = 'засада') {
    const hostileCount = faction === 'zhuzher' ? 3 : 2;
    const hostileIds = [];
    const encounterId = `enc_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const factionName = FACTIONS[faction]?.name || faction;
    caravan.underAttack = true;
    caravan.state = 'fighting';
    caravan.tradeState = 'under_attack';
    caravan.encounterCooldown = 75 + Math.random() * 45;

    for (let i = 0; i < hostileCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 7;
      const x = caravan.x + Math.cos(angle) * radius;
      const z = caravan.z + Math.sin(angle) * radius;
      const hostile = createMonster(this.scene, {
        id: `${encounterId}_hostile_${i}`,
        name: faction === 'zhuzher' ? `Жужжер-налётчик ${i + 1}` : `Бандит-грабитель ${i + 1}`,
        archetype: faction === 'zhuzher' ? 'brute' : 'raider',
        faction,
        color: faction === 'zhuzher' ? 0x7f843e : 0x5a3421,
        x, z,
        hp: faction === 'zhuzher' ? 46 : 34,
        damage: faction === 'zhuzher' ? 12 : 9,
        speed: faction === 'zhuzher' ? 1.05 : 1.22,
        encounterId,
        autoHostile: true,
      });
      hostileIds.push(hostile.userData.id);
      this.monsters.push(hostile);
      const label = labelSprite(this.scene, hostile.userData.name, x, z, 2.4, 0.36);
      this.labels.push(label);
      hostile.userData.label = label;
      this.spawnedHostiles++;
    }

    const initialLoss = Math.min(cargoTotal(caravan.cargo), faction === 'zhuzher' ? 2 : 1);
    const stolen = reduceCargo(caravan.cargo, initialLoss);
    this.activeEncounters.push({
      id: encounterId,
      kind: 'caravan_ambush',
      faction,
      caravanId: caravan.id,
      hostileIds,
      age: 0,
      lastLootTick: 0,
      initialCargoValue: cargoValue(caravan.cargo) + cargoValue(stolen),
      stolen,
      resolved: false,
      rewardGiven: false,
    });
    this.logEvent(`${caravan.name}: ${reason}. ${factionName} атакуют караван, груз уже теряется: ${cargoSummary(stolen)}.`, true);
  }

  updateActiveEncounters(dt, playerRig) {
    const monsters = this.monsters;
    for (const enc of this.activeEncounters) {
      if (enc.resolved) continue;
      enc.age += dt;
      enc.lastLootTick += dt;

      const caravan = this.agents.find(obj => obj.userData.id === enc.caravanId)?.userData;
      const hostiles = monsters.filter(m => enc.hostileIds.includes(m.userData.id));
      const alive = hostiles.filter(m => m.userData.alive);
      if (!caravan) {
        enc.resolved = true;
        continue;
      }

      if (alive.length && enc.lastLootTick > 9 && dist2d(caravan, playerRig.position) < 135) {
        enc.lastLootTick = 0;
        const stolen = reduceCargo(caravan.cargo, 1);
        if (cargoTotal(stolen) > 0) {
          enc.stolen = { ...enc.stolen, ...stolen };
          this.logEvent(`${caravan.name}: налётчики продолжают грабить телегу (${cargoSummary(stolen)}).`);
        }
      }

      if (alive.length === 0) {
        enc.resolved = true;
        caravan.underAttack = false;
        caravan.state = 'travelling';
        caravan.tradeState = cargoTotal(caravan.cargo) > 0 ? 'saved_after_attack' : 'looted_empty';
        this.completedEncounters++;
        this.rewardCaravanDefense(enc, caravan, playerRig);
      } else if (enc.age > 70 && cargoTotal(caravan.cargo) <= 0) {
        enc.resolved = true;
        caravan.underAttack = false;
        caravan.state = 'fleeing';
        caravan.tradeState = 'looted_empty';
        this.logEvent(`${caravan.name}: караван разграблен и пытается уйти с дороги.`);
      }
    }
  }

  rewardCaravanDefense(enc, caravan, playerRig) {
    if (enc.rewardGiven) return;
    enc.rewardGiven = true;
    const player = this.player;
    const rpg = this.rpg;
    const remaining = Math.max(0, cargoValue(caravan.cargo));
    const base = Math.max(3, Math.round(remaining * 0.22));
    const dangerBonus = enc.faction === 'zhuzher' ? 8 : 4;
    const credits = base + dangerBonus;
    if (player) {
      player.credits = (player.credits || 0) + credits;
      const gift = this.takeGiftFromCargo(caravan);
      if (gift) player.inventory?.push?.(`награда каравана: ${gift}`);
    }
    rpg?.addXp?.(enc.faction === 'zhuzher' ? 22 : 14);
    rpg?.useSkill?.('speech', 0.6);
    this.logEvent(`${caravan.name}: караван спасён. Награда: ${credits} кредитов${cargoTotal(caravan.cargo) > 0 ? ' и часть товара' : ''}.`, true);
  }

  takeGiftFromCargo(caravan) {
    const key = Object.keys(caravan.cargo || {}).find(k => caravan.cargo[k] > 1);
    if (!key) return '';
    caravan.cargo[key] -= 1;
    return `${GOODS[key]?.name || key} ×1`;
  }

  maybeOrderWarSpark(playerRig) {
    const sound = this.agents.find(obj => obj.userData.faction === 'soundOrder')?.userData;
    const error = this.agents.find(obj => obj.userData.faction === 'errorOrder')?.userData;
    if (!sound || !error) return;
    if (Math.hypot(sound.x - playerRig.position.x, sound.z - playerRig.position.z) > 140) return;
    if (Math.hypot(sound.x - error.x, sound.z - error.z) > 34) return;
    if (sound.orderWarCooldown > 0) { sound.orderWarCooldown -= 1; return; }
    sound.orderWarCooldown = 90;
    if (Math.random() < 0.45) {
      sound.skillLevel += 1;
      this.logEvent('Орден Звука и Орден Системных Ошибок сцепились у дороги. Победил Звук: влияние растёт.');
    } else {
      error.skillLevel += 1;
      this.logEvent('Орден Системных Ошибок сорвал ритуал Звука. В воздухе слышен неправильный аккорд.');
    }
  }

  maybePhaseProductionScene(playerRig) {
    const mage = this.agents.find(obj => obj.userData.faction === 'phaseGuild')?.userData;
    if (!mage) return;
    const village = this.economy.red_clay_village;
    if (!village) return;
    if (Math.hypot(mage.x - (-76), mage.z - 60) > 12) return;
    if (Math.hypot(playerRig.position.x - (-76), playerRig.position.z - 60) > 90) return;
    if (mage.productionCooldown > 0) { mage.productionCooldown -= 1; return; }
    mage.productionCooldown = 120;
    village.productionBonus = Math.min(2.2, village.productionBonus + 0.08);
    this.logEvent(`Фазовый маг зачаровывает поля Красной общины. Производство: ×${village.productionBonus.toFixed(2)}.`);
  }

  tickWorldClockEvents() {
    const seg = worldClock.segment;
    if (seg === this._daySegment) return;
    const first = this._daySegment == null;
    this._daySegment = seg;
    if (first) return; // don't fire on the very first frame
    const lines = {
      dawn: 'Рассвет: соляной караван выходит на официальный тракт.',
      day: 'День: общины тракта возвращаются к работе.',
      dusk: 'Сумерки: дозоры на тракте меняют смену; засады становятся смелее.',
      night: 'Ночь: в поселениях зажигают костры, жители расходятся по домам, дороги пустеют.',
    };
    if (lines[seg]) this.logEvent(lines[seg]);
  }

  onRoutePoint(agent, point = null) {
    if (agent.event === 'plant_tree') this.logEvent(`${agent.name}: посадка царборского саженца.`);
    if (agent.event === 'phase_training') this.logEvent(`${agent.name}: тренировка фазового удара у дороги.`);
    if (agent.event === 'mapping') this.logEvent(`${agent.name}: нанесён новый участок карты.`);
    if (agent.event === 'fort_raid_pressure') this.logEvent(`${agent.name}: давление на дальние посты Форта Заря.`);

    if (agent.role === 'caravan') this.onCaravanStop(agent, point);
    if (point?.stop === 'help_production') this.helpSettlementProduction(agent);
  }

  onCaravanStop(agent, point = null) {
    if (!point?.stop) return;
    if (point.stop === 'market') {
      const value = cargoValue(agent.cargo);
      if (value <= 0) {
        agent.tradeState = 'arrived_empty';
        this.logEvent(`${agent.name}: дошёл до рынка почти пустым. В деревню вернутся плохие новости.`);
        return;
      }
      const earned = Math.round(value * (0.85 + Math.random() * 0.3));
      agent.credits += earned;
      agent.tradeState = 'buying_tools';
      const toolsBought = Math.max(1, Math.min(4, Math.floor(agent.credits / 18)));
      agent.tools += toolsBought;
      agent.credits = Math.max(0, agent.credits - toolsBought * 18);
      agent.cargo = { tools: toolsBought };
      this.logEvent(`${agent.name}: продал товар на рынке за ${earned} кредитов и купил инструменты ×${toolsBought}.`);
    }

    if (point.stop === 'home') {
      if (agent.tools > 0 && agent.originId && this.economy[agent.originId]) {
        const village = this.economy[agent.originId];
        village.productionBonus = Math.min(2.5, (village.productionBonus || 1) + agent.tools * 0.035);
        this.logEvent(`${agent.name}: вернул инструменты домой. ${village.name} производит лучше: ×${village.productionBonus.toFixed(2)}.`);
        agent.tools = 0;
      }
      const bonus = this.economy[agent.originId]?.productionBonus || 1;
      const base = agent.baseCargo || makeStartingCargo(agent);
      agent.cargo = Object.fromEntries(Object.entries(base).map(([key, amount]) => [key, Math.max(1, Math.round(amount * bonus))]));
      agent.tradeState = 'loaded_to_market';
    }
  }

  helpSettlementProduction(agent) {
    if (agent.faction !== 'phaseGuild') return;
    const village = this.economy.red_clay_village;
    if (!village) return;
    village.productionBonus = Math.min(2.4, village.productionBonus + 0.06);
    this.logEvent(`${agent.name}: фазовое усиление телег и полей. Красная община получает производство ×${village.productionBonus.toFixed(2)}.`);
  }

  ambientLine(agent) {
    const lines = {
      empire: 'Имперцы проверяют дорогу и спорят о налогах.',
      rebels: 'Повстанцы-крестьяне шепчутся о сборщиках глины.',
      peasants: 'Крестьяне сушат красную глину и смотрят на небо.',
      redPeasants: 'Красные общины считают мешки глины и цену инструментов.',
      knights: 'Бродячий рыцарь ищет поединок или смысл.',
      errorOrder: 'Рыцарь Ошибок слушает треск мира между кадрами.',
      soundOrder: 'Рыцарь Звука прислушивается к фальшивым шагам на дороге.',
      bandits: 'Бандиты ждут, пока караван отстанет от патруля.',
      zhuzher: 'Жужжерский дозор считает расстояние до Форта Заря.',
      tsarbor: 'Царборцы несут саженцы к границе саванны.',
      blueElementals: 'Синие элементали проверяют караванные сосуды.',
      blackElementals: 'Чёрные элементали грузят стекло для Мёртвой Саванны.',
      phaseGuild: 'Фазовые маги тренируют дрожание воздуха.',
      travelers: 'Путешественники спорят о карте и горизонте.',
    };
    this.logEvent(`${agent.name}: ${lines[agent.faction] || 'жизнь продолжается.'}`);
  }

  findNear(playerRig, distance = 2.6) {
    return this.agents.find(a => !a.userData.settlementCulled && Math.hypot(a.userData.x - playerRig.position.x, a.userData.z - playerRig.position.z) < distance) || null;
  }

  describe(agent) {
    const u = agent.userData;
    const player = this.playerProvider?.() || {};
    const text = resolveSettlementDialogue(u, player);
    const schedule = u.scheduleState === 'resting' ? 'ночной отдых' : u.scheduleState === 'working' ? 'дневная работа' : '—';
    const scheduleLine = u.homeAnchor ? `<p><b>Распорядок:</b> ${schedule} · ${worldClock.clockText}</p>` : '';
    const cargoLine = u.role === 'caravan' ? `<p><b>Груз:</b> ${cargoSummary(u.cargo)}<br><b>Торговый цикл:</b> ${u.tradeState || '—'} · кредиты ${u.credits || 0}</p>` : '';
    const knightLine = (u.role === 'knight' || u.role === 'orderKnight') ? `<p><b>Рост:</b> навык ${u.skillLevel || 1} · снаряжение ${u.gearTier || 1}${u.contractFaction ? ` · контракт: ${FACTIONS[u.contractFaction]?.name || u.contractFaction}` : ''}</p>` : '';
    const travelerLine = u.sellsMapMarkers ? `<p><b>Услуга:</b> свежие метки карты и безопасный маршрут. Пока это журнал/диагностика, полноценная покупка будет следующим проходом.</p>` : '';
    const economy = u.originId && this.economy[u.originId] ? `<p><b>Родное поселение:</b> ${this.economy[u.originId].name} · производство ×${this.economy[u.originId].productionBonus.toFixed(2)}</p>` : '';
    return `<h2>${u.name}</h2><p>${text}</p><p><b>Фракция:</b> ${u.factionName}</p><p><b>Роль:</b> ${u.role}</p><p><b>Состояние:</b> ${u.state}</p>${scheduleLine}${cargoLine}${knightLine}${travelerLine}${economy}<p><button id="closeMapBtn">Закрыть</button></p>`;
  }

  diagnostics() {
    return {
      agents: this.agents.length,
      activeEncounters: this.activeEncounters.filter(e => !e.resolved).length,
      completedEncounters: this.completedEncounters,
      spawnedHostiles: this.spawnedHostiles,
      economy: this.economy,
      caravans: this.agents
        .map(obj => obj.userData)
        .filter(u => u.role === 'caravan')
        .map(u => ({ id: u.id, name: u.name, state: u.state, tradeState: u.tradeState, cargo: u.cargo, credits: u.credits, underAttack: u.underAttack })),
    };
  }
}
