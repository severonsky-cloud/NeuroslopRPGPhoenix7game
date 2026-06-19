import * as THREE from '../vendor/three.module.js';
import { createTerrainMesh, heightAt, biomeAt } from '../world/terrain.js';
import { WorldChunks } from '../world/chunks.js';
import { LOCATIONS, BIOMES, NPCS, MONSTERS } from '../data/worldData.js';
import { createPlayer, createPlayerRig, movePlayer } from '../entities/player.js';
import { createNpc, updateNpcRoutes } from '../entities/npc.js';
import { createMonster, updateMonsters } from '../entities/monster.js';
import { InputSystem } from './input.js';
import { Hud } from '../ui/hud.js';
import { mapHtml, journalHtml } from '../ui/map.js';
import { WEAPONS, weaponByDigit } from '../combat/weapons.js';
import { findMeleeTarget, damageMonster, updateProjectiles } from '../combat/combat.js';
import { Materials, makeMat, placeBox, labelSprite } from '../world/props.js';
import { getQualityPreset, setQualityPreset } from './quality.js';
import { createAtmosphere, applyBiomeAtmosphere } from '../world/atmosphere.js';
import { createBiomeLandmarks } from '../world/landmarks.js';
import { LivingWorldSystem } from '../world/life.js';
import { RpgSystem } from '../rpg/rpgSystem.js';
import { InventorySystem } from '../items/inventory.js';
import { PhaseMagicSystem, PHASE_SPELLS } from '../magic/phaseMagic.js';
import { BallisticSystem } from '../combat/ballistics.js';
import { ARSENAL, AMMO_TYPES, attackProfile } from '../combat/arsenal.js';
import { createWeaponViewModel, updateWeaponViewModel } from '../items/weaponModels.js';

export class PhoenixV3Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.quality = getQualityPreset();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9b5a35);
    this.scene.fog = new THREE.FogExp2(0xb36b3f, this.quality.fogDensity);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const rigPack = createPlayerRig(this.scene);
    this.rig = rigPack.rig;
    this.camera = rigPack.camera;
    this.player = createPlayer();
    this.rpg = new RpgSystem(this.player);
    this.inventory = new InventorySystem(this.player);
    this.phaseMagic = new PhaseMagicSystem(this.player, this.rpg);
    this.player.weapon = this.inventory.activeWeaponId();
    this.input = new InputSystem(canvas);
    this.hud = new Hud();
    this.ballistics = new BallisticSystem(this.scene);

    this.mode = 'boot';
    this.paused = false;
    this.aimMode = false;
    this.yaw = Math.PI * 0.45;
    this.pitch = 0;
    this.last = performance.now();
    this.cooldown = 0;
    this.projectiles = [];
    this.npcs = [];
    this.monsters = [];
    this.labels = [];
    this.log = ['v3.0E: arsenal, ballistics, ammo, weapon models, buttstock and bayonet foundation.'];
    this.debugIndex = 0;
    this.currentBiomeId = 'clay';

    this.input.onAction = (code, event) => this.onAction(code, event);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  boot() { this.buildScene(); this.loop(performance.now()); }

  buildScene() {
    this.atmosphere = createAtmosphere(this.scene, this.quality);
    if (this.quality.realtimeAccentLights) {
      const violet = new THREE.PointLight(0x5a22ff, 0.75, 115);
      violet.position.set(288, 20, 112);
      this.scene.add(violet);
    }
    this.scene.add(createTerrainMesh({ segmentsX: this.quality.terrainSegmentsX, segmentsZ: this.quality.terrainSegmentsZ }));
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(250, 340),
      new THREE.MeshStandardMaterial({ color: 0x12384d, roughness: 0.22, metalness: 0.12, transparent: true, opacity: 0.86 })
    );
    ocean.position.set(-235, -0.65, 15);
    ocean.rotation.x = -Math.PI / 2;
    this.scene.add(ocean);

    this.chunks = new WorldChunks(this.scene, this.quality);
    this.chunks.buildStaticWorld();
    this.buildLocations();
    this.labels.push(...createBiomeLandmarks(this.scene, this.quality));
    this.buildEntities();
    this.livingWorld = new LivingWorldSystem(this.scene, this.labels, () => this.player);
    this.livingWorld.build();
    this.buildViewModel();
    this.updateCrosshair();
    this.hud.setObjective(`v3.0E Arsenal · V sight · B butt/bayonet · O ammo shop`);
  }

  buildLocations() {
    const colorById = {
      customs: 0x6b5534, salt: 0x4d3928, market: 0x5e4630, shelter: 0x584429,
      registry: 0x76603e, gerda: 0x49382b, rednode: 0x6d3528, guidecamp: 0x4d3c55,
      mangrovepump: 0x344028, tsarborcamp: 0x2f4c35, glassdemesne: 0x15121f, iceshelfpost: 0x496574,
      fortBarracks: 0x33302d, fortGate: 0x2a2826, blueCaravanYard: 0x314c72,
    };
    for (const loc of LOCATIONS) {
      if (loc.type === 'biome' || loc.type === 'district' || loc.type === 'ruin') {
        this.labels.push(labelSprite(this.scene, loc.name, loc.x, loc.z, 3.3, 0.55));
        if (loc.type === 'ruin') this.makeBattery(loc.x, loc.z);
        continue;
      }
      this.makeBuilding(loc.name, loc.x, loc.z, colorById[loc.id] ?? 0x5e4630);
    }
  }

  makeBuilding(name, x, z, color) {
    placeBox(this.scene, x, z, 9, 6, 0.08, makeMat(0x302319), false);
    placeBox(this.scene, x - 4.35, z, 0.3, 6, 3.4, makeMat(color));
    placeBox(this.scene, x + 4.35, z, 0.3, 6, 3.4, makeMat(color));
    placeBox(this.scene, x, z - 2.85, 9, 0.3, 3.4, makeMat(color));
    placeBox(this.scene, x - 2.9, z + 2.85, 2.4, 0.3, 3.4, makeMat(color));
    placeBox(this.scene, x + 2.9, z + 2.85, 2.4, 0.3, 3.4, makeMat(color));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 1.4, 4), Materials.roof);
    roof.position.set(x, heightAt(x, z) + 4.05, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    this.scene.add(roof);
    this.labels.push(labelSprite(this.scene, name, x, z, 5.4, 0.55));
  }

  makeBattery(x, z) {
    placeBox(this.scene, x, z, 6, 3, 1.4, Materials.metal);
    placeBox(this.scene, x - 2.2, z + 1.1, 0.8, 1.2, 2.3, Materials.metal);
    placeBox(this.scene, x + 2.1, z + 1.0, 1.0, 1.0, 2.0, Materials.metal);
  }

  buildEntities() {
    this.npcs = NPCS.map(n => createNpc(this.scene, n));
    this.monsters = MONSTERS.map(m => createMonster(this.scene, m));
    for (const n of this.npcs) this.labels.push(labelSprite(this.scene, n.userData.name, n.userData.x, n.userData.z, 2.7, 0.45));
    for (const m of this.monsters) this.labels.push(labelSprite(this.scene, m.userData.name, m.userData.x, m.userData.z, 2.5, 0.4));
  }

  buildViewModel() {
    if (this.hands) this.camera.remove(this.hands);
    this.hands = createWeaponViewModel(this.player.weapon, this.aimMode);
    this.camera.add(this.hands);
  }

  start() {
    document.getElementById('boot')?.classList.add('hidden');
    this.mode = 'play';
    this.paused = false;
    this.hud.setObjective(`v3.0E ready · ${ARSENAL[this.player.weapon].name} · V sight · B butt/bayonet · O ammo`);
  }

  onAction(code, event) {
    if (code === 'Escape') { this.closePausePanel(); return; }
    if (code === 'MouseRight') { this.openContextMenu(); return; }
    if (code === 'KeyI') { this.openInventory(); return; }
    if (code === 'KeyK') { this.openCharacter(); return; }
    if (code === 'KeyP') { this.openPhasePanel(); return; }
    if (code === 'KeyO') { this.openAmmoShop(); return; }
    if (code === 'KeyV') { this.toggleAim(); return; }
    if (code === 'KeyB') { this.altWeaponAttack(); return; }
    if (code === 'Tab') { event?.preventDefault?.(); this.switchHandSet(); return; }
    if (this.paused && code !== 'KeyM' && code !== 'KeyJ') return;

    const weapon = weaponByDigit(code);
    if (weapon) {
      this.player.weapon = weapon;
      this.aimMode = false;
      this.camera.fov = 72;
      this.camera.updateProjectionMatrix();
      this.buildViewModel();
      this.updateCrosshair();
    }
    if (code === 'MouseLeft' || code === 'Space') this.attack();
    if (code === 'KeyM') this.openMap();
    if (code === 'KeyJ') this.openJournal();
    if (code === 'F1') { event?.preventDefault?.(); this.teleportNext(); }
    if (code === 'KeyE') this.interact();
    if (code === 'KeyZ') this.activateAbility(0);
    if (code === 'KeyX') this.activateAbility(1);
    if (code === 'KeyC') this.activateAbility(2);
    if (code === 'KeyF') this.activateAbility(3);
    if (code === 'F9') this.setQuality('low');
    if (code === 'F10') this.setQuality('medium');
    if (code === 'F11') this.setQuality('high');
  }

  setQuality(name) { setQualityPreset(name); this.hud.setObjective(`Quality set to ${name}. Перезагрузи страницу Ctrl+F5.`); }

  toggleAim() {
    const w = WEAPONS[this.player.weapon];
    if (w.kind !== 'gun') { this.hud.setObjective('Прицельный режим доступен только для огнестрела.'); return; }
    this.aimMode = !this.aimMode;
    this.camera.fov = this.aimMode ? 50 : 72;
    this.camera.updateProjectionMatrix();
    this.buildViewModel();
    this.updateCrosshair();
    this.hud.setObjective(this.aimMode ? 'Мушка включена · V чтобы выйти' : 'Обычный обзор');
  }

  updateCrosshair() {
    let c = document.getElementById('crosshair');
    if (!c) {
      c = document.createElement('div');
      c.id = 'crosshair';
      c.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:15;pointer-events:none;color:#ffd28a;text-shadow:0 0 8px #000;font:900 22px system-ui;opacity:.8';
      document.body.appendChild(c);
    }
    c.textContent = this.aimMode ? '┼' : '·';
    c.style.fontSize = this.aimMode ? '24px' : '28px';
    c.style.opacity = this.aimMode ? '0.95' : '0.65';
  }

  switchHandSet() {
    const newWeapon = this.inventory.switchHands();
    this.player.weapon = newWeapon;
    this.aimMode = false;
    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.buildViewModel();
    this.updateCrosshair();
    this.hud.setObjective(`Переключён набор оружия: ${ARSENAL[newWeapon]?.name || newWeapon}`);
  }

  openContextMenu() {
    this.paused = true;
    this.hud.openPanel(`<h2>Контекстное меню</h2>
      <p>Игра на паузе.</p>
      <div class="line"><b>I</b> — Инвентарь / кукла персонажа</div>
      <div class="line"><b>K</b> — Персонаж / навыки</div>
      <div class="line"><b>P</b> — Фазовая магия</div>
      <div class="line"><b>O</b> — Купить патроны</div>
      <div class="line"><b>B</b> — Приклад / штык</div>
      <div class="line"><b>V</b> — Мушка / прицел</div>
      <p><button id="closeMapBtn">Вернуться</button></p>`);
    document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
  }

  closePausePanel() { this.paused = false; this.hud.closePanel(); }
  openInventory() { this.paused = true; this.hud.openPanel(this.inventory.html()); document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel()); }
  openCharacter() { this.paused = true; this.hud.openPanel(this.rpg.summaryHtml()); document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel()); }
  openPhasePanel() { this.paused = true; this.hud.openPanel(this.phaseMagic.html()); document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel()); }

  openAmmoShop() {
    this.paused = true;
    const rows = Object.entries(AMMO_TYPES).map(([type, ammo]) => `<div class="line"><b>${ammo.icon} ${ammo.name}</b> · цена ${ammo.price}<br><button data-ammo="${type}">Купить 5</button></div>`).join('');
    this.hud.openPanel(`<h2>Покупка патронов</h2><p>Кредиты: ${this.player.credits}</p>${rows}<p><button id="closeMapBtn">Закрыть</button></p>`);
    document.querySelectorAll('[data-ammo]').forEach(btn => btn.addEventListener('click', () => {
      const ok = this.inventory.buyAmmo(btn.dataset.ammo, 5);
      this.hud.setObjective(ok ? `Куплено: ${AMMO_TYPES[btn.dataset.ammo].name} ×5` : 'Не хватает кредитов.');
      this.openAmmoShop();
    }));
    document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
  }

  activateAbility(index) {
    const ability = this.player.rpg.abilityHotbar[index];
    if (!ability) { this.hud.setObjective(`Слот способности ${index + 1} пуст.`); return; }
    if (ability === 'shortBlink') {
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
      if (this.player.ph < 22) { this.hud.setObjective('Не хватает фазы для короткого сдвига.'); return; }
      this.player.ph -= 22;
      this.rpg.useSkill('phase', 1.8);
      this.rig.position.x += dir.x * 5.2;
      this.rig.position.z += dir.z * 5.2;
      this.rig.position.y = heightAt(this.rig.position.x, this.rig.position.z);
      this.hud.setObjective('Короткий фазовый сдвиг.');
      return;
    }
    const res = this.phaseMagic.cast(ability);
    this.hud.setObjective(res.ok ? `Фазовая способность: ${PHASE_SPELLS[ability]?.name || ability}` : `Фаза не сработала: ${res.reason}`);
  }

  meleeAttackWithProfile(profile, baseWeapon, skillKey = 'blade') {
    const virtualWeapon = { ...baseWeapon, range: profile.range, arc: profile.arc };
    const old = WEAPONS.__virtual;
    WEAPONS.__virtual = virtualWeapon;
    const target = findMeleeTarget({ weaponId: '__virtual', playerRig: this.rig, camera: this.camera, monsters: this.monsters });
    if (old) WEAPONS.__virtual = old; else delete WEAPONS.__virtual;
    if (!target) { this.hud.setObjective(`${profile.name}: не достаёт`); return false; }
    const dmg = Math.round(baseWeapon.damage * (profile.damageMul || 1) * (1 + this.player.rpg.skills[skillKey].level / 110));
    const m = damageMonster(target, dmg);
    this.rpg.useSkill(skillKey, 1.5);
    this.hud.hitMarker(`-${dmg}`);
    this.hud.setObjective(`${m.name}: ${profile.name}`);
    return true;
  }

  altWeaponAttack() {
    if (this.paused || this.mode === 'boot') return;
    const w = WEAPONS[this.player.weapon];
    const profile = w.bayonet ? attackProfile(this.player.weapon, 'bayonet') : attackProfile(this.player.weapon, 'butt') || attackProfile(this.player.weapon, 'heavy');
    if (!profile) { this.hud.setObjective('У этого оружия нет альтернативной атаки.'); return; }
    const stamina = Math.ceil((w.stamina || 8) * (profile.staminaMul || 1.1));
    if (this.player.st < stamina) { this.hud.setObjective('Нет выносливости для альтернативной атаки.'); return; }
    this.player.st -= stamina;
    this.cooldown = Math.max(this.cooldown, (w.cooldown || 0.5) * 1.25);
    const skill = profile.type === 'butt' ? 'blunt' : profile.type === 'bayonet' ? 'blade' : w.kind === 'gun' ? 'blunt' : 'blade';
    this.meleeAttackWithProfile(profile, w, skill);
  }

  attack() {
    if (this.paused || this.mode === 'boot') return;
    const w = WEAPONS[this.player.weapon];
    if (this.cooldown > 0) return;
    if (this.player.st < (w.stamina || 0)) { this.hud.setObjective('Нет выносливости.'); return; }
    this.player.st -= w.stamina || 0;
    this.cooldown = w.cooldown;

    if (w.kind === 'phase') {
      const cast = this.phaseMagic.castEquipped();
      if (!cast.ok) { this.hud.setObjective(cast.reason === 'no_phase' ? 'Не хватает фазы.' : 'Фазовое заклинание не выбрано.'); return; }
      const target = findMeleeTarget({ weaponId: 'phase', playerRig: this.rig, camera: this.camera, monsters: this.monsters });
      if (!target) { this.hud.setObjective('Фаза ушла в воздух.'); return; }
      const dmg = Math.round(w.damage * (cast.spell.damageMul || 1) * (1 + this.player.rpg.skills.phase.level / 120));
      const m = damageMonster(target, dmg);
      this.rpg.useSkill('phase', 2.5);
      this.hud.hitMarker(`-${dmg}`);
      this.hud.setObjective(`${m.name}: ${cast.spell.name}`);
      return;
    }

    if (w.kind === 'gun') {
      const shotCount = w.pellets ? 1 : 1;
      if (!this.inventory.spendAmmo(this.player.weapon, shotCount)) { this.hud.setObjective(`Нет патронов: ${AMMO_TYPES[w.ammo]?.name || w.name}`); return; }
      const scale = 1 + this.player.rpg.skills.firearms.level / 140;
      const result = this.ballistics.fire({ weaponId: this.player.weapon, camera: this.camera, monsters: this.monsters, aimMode: this.aimMode, skillLevel: this.player.rpg.skills.firearms.level, damageScale: scale });
      this.rpg.useSkill('firearms', 1.4);
      const hit = result.results?.find(r => r.hit);
      this.hud.setObjective(hit ? `${hit.target.userData.name}: ballistic hit` : `${w.name}: трассер ушёл в даль`);
      if (hit) this.hud.hitMarker(`-${hit.damage}`);
      return;
    }

    const profile = attackProfile(this.player.weapon, 'primary') || { name: 'удар', range: w.range, arc: w.arc, damageMul: 1 };
    const skill = w.kind === 'blade' ? 'blade' : 'blunt';
    this.meleeAttackWithProfile(profile, w, skill);
  }

  interact() {
    if (this.paused) return;
    const lifeAgent = this.livingWorld?.findNear(this.rig);
    if (lifeAgent) {
      this.paused = true;
      this.rpg.useSkill('speech', 0.5);
      this.hud.openPanel(this.livingWorld.describe(lifeAgent));
      document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
      return;
    }
    const nearNpc = this.npcs.find(n => Math.hypot(n.userData.x - this.rig.position.x, n.userData.z - this.rig.position.z) < 2.4);
    if (nearNpc) {
      const n = nearNpc.userData;
      this.paused = true;
      this.rpg.useSkill('speech', 0.5);
      this.hud.openPanel(`<h2>${n.name}</h2><p>${n.text}</p><p><b>Фракция:</b> ${n.faction}</p><p><button id="closeMapBtn">Закрыть</button></p>`);
      document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
    }
  }

  openMap() {
    this.paused = true;
    this.hud.openPanel(mapHtml({ locations: LOCATIONS, biomes: BIOMES, player: { x: this.rig.position.x, z: this.rig.position.z } }));
    document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
  }

  openJournal() {
    this.paused = true;
    const lifeEvents = this.livingWorld?.eventLog || [];
    this.hud.openPanel(journalHtml([...lifeEvents, ...this.log]));
    document.getElementById('closeMapBtn')?.addEventListener('click', () => this.closePausePanel());
  }

  teleportNext() {
    const points = [
      { x: -142, z: 20, n: 'Берег Порта Рейчел' }, { x: -88, z: 22, n: 'Рина / Порт' }, { x: -20, z: 66, n: 'Дорожный навес' },
      { x: 62, z: 110, n: 'Красная дорога' }, { x: 142, z: 176, n: 'Форт Заря далеко от порта' }, { x: 250, z: 250, n: 'Мёртвая Саванна' },
      { x: 174, z: 248, n: 'Лес царборцев' }, { x: 288, z: 112, n: 'Вотчина чёрных элементалей' }, { x: 205, z: -145, n: 'Ледяной шельф' },
    ];
    const p = points[this.debugIndex++ % points.length];
    this.rig.position.set(p.x, heightAt(p.x, p.z), p.z);
    this.hud.setObjective(`F1 teleport: ${p.n}`);
  }

  updateLabelVisibility() {
    const max = this.quality.labelsDistance;
    for (const l of this.labels) {
      if (l.userData.lifeAgent?.userData.settlementCulled) {
        l.visible = false;
        continue;
      }
      const d = Math.hypot(l.position.x - this.rig.position.x, l.position.z - this.rig.position.z);
      l.visible = d < max;
      if (l.visible) l.quaternion.copy(this.camera.quaternion);
    }
  }

  update(dt) {
    if (this.mode === 'boot') return;
    const mouse = this.input.consumeMouse();
    if (!this.paused && this.input.pointerLocked) {
      const sensitivity = this.aimMode ? 0.0012 : 0.0022;
      this.yaw -= mouse.dx * sensitivity;
      this.pitch = THREE.MathUtils.clamp(this.pitch - mouse.dy * sensitivity, -1.15, 1.15);
      this.rig.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    }
    if (!this.paused) {
      const sprint = movePlayer({ rig: this.rig, input: this.input, yaw: this.yaw, dt, player: this.player });
      if (sprint) { this.player.st = Math.max(0, this.player.st - dt * 12); this.rpg.useSkill('athletics', dt * 0.6); }
      else this.player.st = Math.min(this.player.stMax, this.player.st + dt * 10);
      this.player.ph = Math.min(this.player.phMax, this.player.ph + dt * 8);
      this.cooldown = Math.max(0, this.cooldown - dt);
      updateNpcRoutes(this.npcs, dt);
      this.livingWorld?.update(dt, this.rig);
      updateMonsters(this.monsters, this.rig, dt);
      this.phaseMagic.update(dt);
      this.ballistics.update(dt);
      this.projectiles = updateProjectiles({ scene: this.scene, projectiles: this.projectiles, monsters: this.monsters, dt, onHit: (obj, dmg) => this.hud.hitMarker(`-${dmg}`) });
    }

    const biomeId = biomeAt(this.rig.position.x, this.rig.position.z);
    if (biomeId !== this.currentBiomeId) { this.currentBiomeId = biomeId; applyBiomeAtmosphere(this.scene, this.atmosphere, biomeId, this.quality); }
    const biome = BIOMES.find(b => b.id === biomeId);
    const w = WEAPONS[this.player.weapon];
    const ammoText = w.ammo ? ` · ammo ${this.inventory.ammoForWeapon(this.player.weapon)}` : '';
    this.hud.update(this.player, biome?.name ?? 'Неизвестная зона', `${ARSENAL[this.player.weapon]?.name || w.name}${ammoText} · ${this.paused ? 'PAUSED' : 'live'} · B alt · V aim`);
    const lifeAgent = this.livingWorld?.findNear(this.rig);
    if (!this.paused && lifeAgent) this.hud.showPrompt(`E — говорить: ${lifeAgent.userData.name}`);
    else {
      const nearNpc = this.npcs.find(n => Math.hypot(n.userData.x - this.rig.position.x, n.userData.z - this.rig.position.z) < 2.4);
      if (!this.paused && nearNpc) this.hud.showPrompt(`E — говорить: ${nearNpc.userData.name}`);
      else this.hud.hidePrompt();
    }
    if (this.hands) {
      const sway = this.aimMode ? 0.003 : 0.012;
      this.hands.position.x = Math.sin(performance.now() * 0.006) * sway;
      this.hands.position.y = Math.sin(this.player.motion?.bob || 0) * (this.aimMode ? 0.002 : 0.008);
      updateWeaponViewModel(this.hands, {
        dt,
        motion: this.player.motion,
        aimMode: this.aimMode,
        paused: this.paused,
      });
    }
  }

  render() { this.updateLabelVisibility(); this.renderer.render(this.scene, this.camera); }
  loop(now) { const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016); this.last = now; this.update(dt); this.render(); requestAnimationFrame(t => this.loop(t)); }
  resize() { this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.quality.pixelRatio)); this.renderer.setSize(innerWidth, innerHeight); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); }
}
