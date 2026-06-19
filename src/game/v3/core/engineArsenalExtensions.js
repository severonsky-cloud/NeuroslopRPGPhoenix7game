import * as THREE from '../vendor/three.module.js';
import { WEAPONS } from '../combat/weapons.js';
import { ARSENAL, AMMO_TYPES, attackProfile } from '../combat/arsenal.js';
import { EnchantmentSystem } from '../combat/enchantments.js';
import { FirearmStateSystem } from '../combat/firearmState.js';
import { ImpactSystem } from '../combat/impact.js';
import { createWeaponViewModel } from '../items/weaponModels.js';
import { findMeleeTarget, damageMonster } from '../combat/combat.js';

function weaponClass(weaponId) {
  const w = ARSENAL[weaponId];
  if (!w) return 'melee';
  if (w.ammoType) return 'firearm';
  if (w.archetype === 'phase') return 'phase';
  return 'melee';
}

function bindClose(engine) {
  document.getElementById('closeMapBtn')?.addEventListener('click', () => engine.closePausePanel());
}

export function installArsenalExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__arsenalExtensionInstalled) return;
  PhoenixV3Engine.__arsenalExtensionInstalled = true;

  const originalBoot = PhoenixV3Engine.prototype.boot;
  PhoenixV3Engine.prototype.boot = function bootWithArsenal() {
    this.enchantments = new EnchantmentSystem(this.player, this.inventory);
    this.firearms = new FirearmStateSystem(this.player, this.inventory);
    this.impact = new ImpactSystem(this.scene, this.inventory);
    return originalBoot.call(this);
  };

  PhoenixV3Engine.prototype.buildViewModel = function buildArsenalViewModel() {
    if (this.hands) this.camera.remove(this.hands);
    this.hands = createWeaponViewModel(this.player.weapon, this.aimMode);
    this.camera.add(this.hands);
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionArsenal(code, event) {
    if (code === 'KeyR') { this.reloadWeapon(); return; }
    if (code === 'KeyY') { this.openEnchanting(); return; }
    return originalOnAction.call(this, code, event);
  };

  PhoenixV3Engine.prototype.reloadWeapon = function reloadWeapon() {
    const w = ARSENAL[this.player.weapon];
    if (!w?.ammoType) { this.hud.setObjective('Перезарядка нужна только огнестрелу.'); return; }
    const res = this.firearms.startReload(this.player.weapon);
    if (!res.ok) {
      const msg = res.reason === 'full' ? 'Оружие уже заряжено.' : res.reason === 'no_ammo' ? 'Нет патронов для перезарядки.' : 'Нельзя перезарядить.';
      this.hud.setObjective(msg);
      return;
    }
    this.hud.setObjective(res.clearing ? 'Устраняешь осечку...' : `Перезарядка: ${w.name}`);
  };

  PhoenixV3Engine.prototype.openEnchanting = function openEnchanting() {
    this.paused = true;
    const cls = weaponClass(this.player.weapon);
    this.hud.openPanel(this.enchantments.html(this.player.weapon, cls));
    document.querySelectorAll('[data-enchant]').forEach(btn => btn.addEventListener('click', () => {
      const res = this.enchantments.apply(this.player.weapon, btn.dataset.enchant, cls);
      this.hud.setObjective(res.ok ? `Зачаровано: ${res.enchantment.name}` : res.reason);
      this.openEnchanting();
    }));
    bindClose(this);
  };

  const originalOpenContext = PhoenixV3Engine.prototype.openContextMenu;
  PhoenixV3Engine.prototype.openContextMenu = function openContextMenuExtended() {
    originalOpenContext.call(this);
    const panel = document.getElementById('panel');
    if (panel && !panel.innerHTML.includes('Зачарование')) {
      panel.innerHTML = panel.innerHTML.replace('<p><button id="closeMapBtn">Вернуться</button></p>', '<div class="line"><b>Y</b> — Зачарование активного оружия</div><div class="line"><b>R</b> — Перезарядка / устранить осечку</div><p><button id="closeMapBtn">Вернуться</button></p>');
      bindClose(this);
    }
  };

  PhoenixV3Engine.prototype.openInventory = function openInventoryExtended() {
    this.paused = true;
    this.hud.openPanel(this.inventory.html());
    document.querySelectorAll('[data-equip-left]').forEach(btn => btn.addEventListener('click', () => {
      const ok = this.inventory.equip(btn.dataset.equipLeft, 'leftHand');
      if (ok) this.hud.setObjective('Экипировано в левый набор.');
      this.player.weapon = this.inventory.activeWeaponId();
      this.buildViewModel();
      this.openInventory();
    }));
    document.querySelectorAll('[data-equip-right]').forEach(btn => btn.addEventListener('click', () => {
      const ok = this.inventory.equip(btn.dataset.equipRight, 'rightHand');
      if (ok) this.hud.setObjective('Экипировано в правый набор.');
      this.player.weapon = this.inventory.activeWeaponId();
      this.buildViewModel();
      this.openInventory();
    }));
    document.querySelectorAll('[data-equip-armor]').forEach(btn => btn.addEventListener('click', () => {
      const slot = btn.dataset.slot;
      const ok = this.inventory.equip(btn.dataset.equipArmor, slot);
      if (ok) this.hud.setObjective(`Экипировано: ${slot}`);
      this.openInventory();
    }));
    bindClose(this);
  };

  PhoenixV3Engine.prototype.meleeAttackWithProfile = function meleeAttackWithProfile(profile, baseWeapon, skillKey = 'blade') {
    const enchanted = this.enchantments.modifyMelee(this.player.weapon, { damageScale: 1 });
    const virtualWeapon = { ...baseWeapon, range: profile.range, arc: profile.arc };
    const old = WEAPONS.__virtual;
    WEAPONS.__virtual = virtualWeapon;
    const target = findMeleeTarget({ weaponId: '__virtual', playerRig: this.rig, camera: this.camera, monsters: this.monsters });
    if (old) WEAPONS.__virtual = old; else delete WEAPONS.__virtual;
    const heavy = profile.type?.toLowerCase().includes('heavy') || profile.type === 'chop' || profile.type === 'bayonet';
    this.impact?.meleeTrail(this.camera, enchanted.effects?.[0]?.color || 0xffd28a, heavy);
    if (!target) { this.hud.setObjective(`${profile.name}: не достаёт`); return false; }
    const dmg = Math.round((baseWeapon.damage * (profile.damageMul || 1) * (1 + this.player.rpg.skills[skillKey].level / 110) * (enchanted.damageScale || 1)) + (enchanted.extraDamage || 0));
    const m = damageMonster(target, dmg);
    this.impact?.hitImpact(target.position.clone().add(new THREE.Vector3(0, 1, 0)), profile.impact || 'blade');
    this.impact?.applyStagger(target, 0.25 + (enchanted.staggerBonus || 0));
    this.hitFeel?.hitActor?.(target, { damage: dmg, kind: heavy ? 'heavy' : 'medium', phase: skillKey === 'phase' });
    this.rpg.useSkill(skillKey, 1.5);
    this.hud.hitMarker(`-${dmg}`);
    let loot = [];
    if (!m.alive) loot = this.impact?.grantLootForKill(target) || [];
    this.hud.setObjective(`${m.name}: ${profile.name}${loot.length ? ' · лут: ' + loot.join(', ') : ''}`);
    return true;
  };

  PhoenixV3Engine.prototype.attack = function attackExtended() {
    if (this.paused || this.mode === 'boot') return;
    const w = WEAPONS[this.player.weapon];
    if (this.cooldown > 0) return;
    if (this.player.st < (w.stamina || 0)) { this.hud.setObjective('Нет выносливости.'); return; }
    this.player.st -= w.stamina || 0;
    this.cooldown = w.cooldown;

    if (w.kind === 'phase') {
      const cast = this.phaseMagic.castEquipped();
      if (!cast.ok) { this.hud.setObjective(cast.reason === 'no_phase' ? 'Не хватает фазы.' : 'Фазовое заклинание не выбрано.'); return; }
      const profile = attackProfile('phase', 'primary');
      this.meleeAttackWithProfile(profile, w, 'phase');
      return;
    }

    if (w.kind === 'gun') {
      const shotMods = this.enchantments.modifyShot(this.player.weapon, { damageScale: 1, spreadMul: 1, jamMul: 1, conditionWearMul: 1 });
      const fired = this.firearms.tryFire(this.player.weapon, shotMods.jamMul || 1, shotMods.conditionWearMul || 1);
      if (!fired.ok) {
        const msg = fired.reason === 'empty' ? 'Пусто. R — перезарядка.' : fired.reason === 'jammed' || fired.reason === 'jammed_now' ? 'Осечка! R — устранить.' : fired.reason === 'reloading' ? 'Перезаряжается...' : 'Оружие не выстрелило.';
        this.hud.setObjective(msg);
        return;
      }
      const scale = (1 + this.player.rpg.skills.firearms.level / 140) * (shotMods.damageScale || 1);
      const result = this.ballistics.fire({ weaponId: this.player.weapon, camera: this.camera, monsters: this.monsters, aimMode: this.aimMode, skillLevel: this.player.rpg.skills.firearms.level, damageScale: scale, spreadMul: shotMods.spreadMul || 1 });
      this.rpg.useSkill('firearms', 1.4);
      const hit = result.results?.find(r => r.hit);
      if (hit) {
        this.impact?.applyStagger(hit.target, 0.18 + (w.recoil || 0));
        let loot = [];
        if (!hit.target.userData.alive) loot = this.impact?.grantLootForKill(hit.target) || [];
        this.hud.hitMarker(`-${hit.damage}`);
        this.hud.setObjective(`${hit.target.userData.name}: попадание · ${this.firearms.statusText(this.player.weapon)}${loot.length ? ' · лут: ' + loot.join(', ') : ''}`);
      } else {
        this.hud.setObjective(`${w.name}: промах · ${this.firearms.statusText(this.player.weapon)}`);
      }
      return;
    }

    const profile = attackProfile(this.player.weapon, 'primary') || { name: 'удар', range: w.range, arc: w.arc, damageMul: 1 };
    const skill = w.kind === 'blade' ? 'blade' : 'blunt';
    this.meleeAttackWithProfile(profile, w, skill);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateArsenal(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot' && !this.paused) {
      this.firearms?.update(dt);
      this.impact?.update(dt);
      const w = WEAPONS[this.player.weapon];
      if (w?.ammo) {
        const status = this.firearms.statusText(this.player.weapon);
        const bottom = document.getElementById('bottom');
        if (bottom) bottom.textContent = `R reload/clear jam · B alt · V aim · ${ARSENAL[this.player.weapon]?.name}: ${status} · Y enchant`;
      }
    }
  };
}
