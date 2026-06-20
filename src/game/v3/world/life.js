import * as THREE from '../vendor/three.module.js';
import { LIFE_AGENTS, FACTIONS } from '../data/lifeData.js';
import { resolveSettlementDialogue } from '../data/settlementsData.js';
import { heightAt } from './terrain.js';
import { makeMat, labelSprite } from './props.js';
import { worldClock } from './dayNight.js';

function createAgentModel(agent) {
  const faction = FACTIONS[agent.faction] || { color: 0xffffff, name: 'Unknown' };
  const group = new THREE.Group();
  const bodyColor = faction.color || 0xffffff;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.1, 4, 8), makeMat(bodyColor));
  body.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 8), makeMat(0xd3ad78));
  head.position.y = 1.84;
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.46, 0.16), makeMat(0x21140d));
  pack.position.set(0, 1.15, 0.33);
  group.add(body, head, pack);

  if (agent.role === 'caravan') {
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 1.35), makeMat(0x4a2f1b));
    cart.position.set(0, 0.45, 1.15);
    const wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), makeMat(0x1d120c));
    const wheel2 = wheel1.clone();
    wheel1.rotation.z = Math.PI / 2; wheel2.rotation.z = Math.PI / 2;
    wheel1.position.set(-0.55, 0.22, 1.15); wheel2.position.set(0.55, 0.22, 1.15);
    group.add(cart, wheel1, wheel2);
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

  return group;
}

export class LivingWorldSystem {
  constructor(scene, labels, playerProvider = null) {
    this.scene = scene;
    this.labels = labels;
    this.playerProvider = playerProvider;
    this.agents = [];
    this.eventLog = [];
    this.time = 0;
    this._daySegment = null;
  }

  build() {
    this.addAgents(LIFE_AGENTS);
  }

  addAgent(agent) {
    const existing = this.agents.find((obj) => obj.userData.id === agent.id);
    if (existing) return existing;
    const obj = createAgentModel(agent);
    obj.position.set(agent.x, heightAt(agent.x, agent.z), agent.z);
    const label = labelSprite(this.scene, agent.name, agent.x, agent.z, 2.65, 0.42);
    obj.userData = {
      type: 'lifeAgent',
      ...agent,
      routeIndex: 1,
      speed: agent.speed ?? (agent.role === 'caravan' ? 0.75 : agent.role === 'patrol' ? 1.1 : 0.95),
      factionName: FACTIONS[agent.faction]?.name || agent.faction,
      state: agent.role === 'worker' ? 'working' : agent.role === 'raidPatrol' ? 'raiding' : 'travelling',
      // Settlement residents get a home anchor so they can drift home and idle at night.
      homeAnchor: agent.settlementId ? { x: agent.x, z: agent.z } : null,
      scheduleState: agent.settlementId ? 'working' : null,
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
    const resting = worldClock.nightFactor > 0.55;
    for (const obj of this.agents) {
      const u = obj.userData;
      const playerDistance = Math.hypot(u.x - playerRig.position.x, u.z - playerRig.position.z);
      if (u.settlementId) {
        const residentDistance = u.residentDistance || 68;
        const culled = playerDistance > residentDistance;
        u.settlementCulled = culled;
        obj.visible = !culled;
        if (u.label) u.label.visible = !culled;
        if (culled) continue;
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
        if (u.route && u.route.length) {
          const target = u.route[u.routeIndex % u.route.length];
          const d = Math.hypot(target.x - u.x, target.z - u.z);
          if (d < 0.75) {
            u.routeIndex++;
            this.onRoutePoint(u);
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

  tickWorldClockEvents() {
    const seg = worldClock.segment;
    if (seg === this._daySegment) return;
    const first = this._daySegment == null;
    this._daySegment = seg;
    if (first) return; // don't fire on the very first frame
    const lines = {
      dawn: 'Рассвет: соляной караван выходит на официальный тракт.',
      day: 'День: общины тракта возвращаются к работе.',
      dusk: 'Сумерки: дозоры на тракте меняют смену.',
      night: 'Ночь: в поселениях зажигают костры, жители расходятся по домам.',
    };
    if (lines[seg]) {
      this.eventLog.unshift(lines[seg]);
      if (this.eventLog.length > 12) this.eventLog.pop();
    }
  }

  onRoutePoint(agent) {
    if (agent.event === 'plant_tree') this.eventLog.unshift(`${agent.name}: посадка царборского саженца.`);
    if (agent.event === 'phase_training') this.eventLog.unshift(`${agent.name}: тренировка фазового удара у дороги.`);
    if (agent.event === 'mapping') this.eventLog.unshift(`${agent.name}: нанесён новый участок карты.`);
    if (agent.event === 'fort_raid_pressure') this.eventLog.unshift(`${agent.name}: давление на дальние посты Форта Заря.`);
    if (this.eventLog.length > 12) this.eventLog.pop();
  }

  ambientLine(agent) {
    const lines = {
      empire: 'Имперцы проверяют дорогу и спорят о налогах.',
      rebels: 'Повстанцы-крестьяне шепчутся о сборщиках глины.',
      peasants: 'Крестьяне сушат красную глину и смотрят на небо.',
      knights: 'Бродячий рыцарь ищет поединок или смысл.',
      zhuzher: 'Жужжерский дозор считает расстояние до Форта Заря.',
      tsarbor: 'Царборцы несут саженцы к границе саванны.',
      blueElementals: 'Синие элементали проверяют караванные сосуды.',
      blackElementals: 'Чёрные элементали грузят стекло для Мёртвой Саванны.',
      phaseGuild: 'Фазовые маги тренируют дрожание воздуха.',
      travelers: 'Путешественники спорят о карте и горизонте.',
    };
    this.eventLog.unshift(`${agent.name}: ${lines[agent.faction] || 'жизнь продолжается.'}`);
    if (this.eventLog.length > 12) this.eventLog.pop();
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
    return `<h2>${u.name}</h2><p>${text}</p><p><b>Фракция:</b> ${u.factionName}</p><p><b>Роль:</b> ${u.role}</p><p><b>Состояние:</b> ${u.state}</p>${scheduleLine}<p><button id="closeMapBtn">Закрыть</button></p>`;
  }
}
