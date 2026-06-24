import * as THREE from '../vendor/three.module.js';
import { WEAPONS } from '../combat/weapons.js';
import { ARSENAL, AMMO_TYPES, attackProfile } from '../combat/arsenal.js';
import { EnchantmentSystem } from '../combat/enchantments.js';
import { FirearmStateSystem } from '../combat/firearmState.js';
import { ImpactSystem } from '../combat/impact.js';
import { createWeaponViewModel, triggerWeaponViewModelAction } from '../items/weaponModels.js';
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

function fireModesFor(weapon) {
  if (!weapon?.ammoType) return [];
  if (weapon.automatic) return ['auto', 'burst', 'semi'];
  return ['semi'];
}

function fireModeLabel(mode) {
  return mode === 'auto' ? 'AUTO' : mode === 'burst' ? 'BURST×3' : 'SEMI';
}

function firearmStaminaCost(weapon, mode = 'semi') {
  if (!weapon?.ammoType) return weapon?.stamina || 0;
  if (weapon.fireStamina !== undefined) return weapon.fireStamina;
  const recoil = weapon.recoil || 0.2;
  let cost = weapon.automatic ? 0.42 : 0.75;
  if (weapon.pellets) cost = 1.05;
  if (weapon.archetype === 'atLauncher') cost = 1.85;
  if (weapon.archetype === 'atRifle') cost = 1.65;
  if (recoil > 0.6) cost += 0.25;
  if (mode === 'auto') cost *= 0.62;
  if (mode === 'burst') cost *= 0.75;
  return Math.max(0.18, Math.min(2.3, cost));
}

function canAutoContinue(engine) {
  if (!engine.input?.pointerLocked && !engine.input?.keys?.has('Space')) return false;
  return engine.input?.keys?.has('MouseLeft') || engine.input?.keys?.has('Space');
}

export function installArsenalExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__arsenalExtensionInstalled) return;
  PhoenixV3Engine.__arsenalExtensionInstalled = true;

  const originalBoot = PhoenixV3Engine.prototype.boot;
  PhoenixV3Engine.prototype.boot = function bootWithArsenal() {
    this.enchantments = new EnchantmentSystem(this.player, this.inventory);
    this.firearms = new FirearmStateSystem(this.player, this.inventory);
    this.impact = new ImpactSystem(this.scene, this.inventory);
    this.fireModeState = this.fireModeState || {};
    this.burstFireState = this.burstFireState || { weaponId: null, remaining: 0 };
    return originalBoot.call(this);
  };

  PhoenixV3Engine.prototype.buildViewModel = function buildArsenalViewModel() {
    if (this.hands) this.camera.remove(this.hands);
    this.hands = createWeaponViewModel(this.player.weapon, this.aimMode, this.player);
    this.camera.add(this.hands);
  };

  PhoenixV3Engine.prototype.currentFireMode = function currentFireMode(weaponId = this.player.weapon) {
    const weapon = ARSENAL[weaponId];
    const modes = fireModesFor(weapon);
    if (!modes.length) return null;
    const stored = this.fireModeState?.[weaponId];
    if (stored && modes.includes(stored)) return stored;
    return modes[0];
  };

  PhoenixV3Engine.prototype.cycleFireMode = function cycleFireMode() {
    const weaponId = this.player.weapon;
    const weapon = ARSENAL[weaponId];
    const modes = fireModesFor(weapon);
    if (modes.length <= 1) {
      this.hud.setObjective(`${weapon?.name || weaponId}: только ${fireModeLabel(modes[0] || 'semi')}`);
      return modes[0] || 'semi';
    }
    const current = this.currentFireMode(weaponId);
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    this.fireModeState[weaponId] = next;
    this.burstFireState = { weaponId: null, remaining: 0 };
    this.hud.setObjective(`${weapon.name}: режим огня ${fireModeLabel(next)}`);
    return next;
  };

  PhoenixV3Engine.prototype.startBurstFire = function startBurstFire() {
    const weaponId = this.player.weapon;
    const weapon = ARSENAL[weaponId];
    if (!weapon?.ammoType) return false;
    const state = this.firearms?.state?.(weaponId);
    const loaded = state?.loaded ?? weapon.clipSize ?? 1;
    this.burstFireState = {
      weaponId,
      remaining: Math.max(1, Math.min(3, loaded)),
    };
    return true;
  };

  const originalOnAction = PhoenixV3Engine.prototype.onAction;
  PhoenixV3Engine.prototype.onAction = function onActionArsenal(code, event) {
    if (code === 'KeyR') { this.reloadWeapon(); return; }
    if (code === 'KeyY') { this.openEnchanting(); return; }
    if (code === 'KeyH') { event?.preventDefault?.(); this.cycleFireMode(); return; }
    if ((code === 'MouseLeft' || code === 'Space') && this.currentFireMode?.() === 'burst') {
      event?.preventDefault?.();
      this.startBurstFire();
      return;
    }
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
    this.burstFireState = { weaponId: null, remaining: 0 };
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
      panel.innerHTML = panel.innerHTML.replace('<p><button id="closeMapBtn">Вернуться</button></p>', '<div class="line"><b>Y</b> — Зачарование активного оружия</div><div class="line"><b>R</b> — Перезарядка / устранить осечку</div><div class="line"><b>H</b> — Режим огня: semi / burst / auto</div><p><button id="closeMapBtn">Вернуться</button></p>');
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
      this.burstFireState = { weaponId: null, remaining: 0 };
      this.buildViewModel();
      this.openInventory();
    }));
    document.querySelectorAll('[data-equip-right]').forEach(btn => btn.addEventListener('click', () => {
      const ok = this.inventory.equip(btn.dataset.equipRight, 'rightHand');
      if (ok) this.hud.setObjective('Экипировано в правый набор.');
      this.player.weapon = this.inventory.activeWeaponId();
      this.burstFireState = { weaponId: null, remaining: 0 };
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
    const racialDamage = skillKey === 'phase'
      ? (this.player.characterRuntime?.phaseDamage || 1)
      : (this.player.characterRuntime?.meleeDamage || 1);
    const dmg = Math.round((baseWeapon.damage * (profile.damageMul || 1) * (1 + this.player.rpg.skills[skillKey].level / 110) * (enchanted.damageScale || 1) * racialDamage) + (enchanted.extraDamage || 0));
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
    if (this.paused || this.mode === 'boot') return false;
    const w = WEAPONS[this.player.weapon];
    if (!w || this.cooldown > 0) return false;
    const mode = this.currentFireMode?.(this.player.weapon) || 'semi';
    const staminaCost = w.kind === 'gun' ? firearmStaminaCost(w, mode) : (w.stamina || 0);
    if (this.player.st < staminaCost) { this.hud.setObjective('Нет выносливости.'); return false; }

    if (w.kind === 'phase') {
      this.player.st -= staminaCost;
      this.cooldown = w.cooldown;
      const cast = this.phaseMagic.castEquipped();
      if (!cast.ok) { this.hud.setObjective(cast.reason === 'no_phase' ? 'Не хватает фазы.' : 'Фазовое заклинание не выбрано.'); return false; }
      const profile = attackProfile('phase', 'primary');
      this.meleeAttackWithProfile(profile, w, 'phase');
      return true;
    }

    if (w.kind === 'gun') {
      const shotMods = this.enchantments.modifyShot(this.player.weapon, { damageScale: 1, spreadMul: 1, jamMul: 1, conditionWearMul: 1 });
      const fired = this.firearms.tryFire(this.player.weapon, shotMods.jamMul || 1, shotMods.conditionWearMul || 1);
      if (!fired.ok) {
        const msg = fired.reason === 'empty' ? 'Пусто. R — перезарядка.' : fired.reason === 'jammed' || fired.reason === 'jammed_now' ? 'Осечка! R — устранить.' : fired.reason === 'reloading' ? 'Перезаряжается...' : 'Оружие не выстрелило.';
        this.hud.setObjective(msg);
        this.burstFireState = { weaponId: null, remaining: 0 };
        return false;
      }
      this.player.st -= staminaCost;
      this.cooldown = w.cooldown;
      const scale = (1 + this.player.rpg.skills.firearms.level / 140) * (shotMods.damageScale || 1);
      const result = this.ballistics.fire({
        weaponId: this.player.weapon,
        camera: this.camera,
        monsters: this.monsters,
        aimMode: this.aimMode,
        skillLevel: this.player.rpg.skills.firearms.level,
        damageScale: scale,
        spreadMul: (shotMods.spreadMul || 1) * (this.player.characterRuntime?.firearmSpread || 1),
      });
      triggerWeaponViewModelAction(this.hands, 'primary', { duration: Math.max(0.07, Math.min(0.18, w.cooldown || 0.14)) });
      this.rpg.useSkill('firearms', 1.15);
      const hit = result.results?.find(r => r.hit);
      const modeText = fireModeLabel(mode);
      if (hit) {
        this.impact?.applyStagger(hit.target, 0.18 + (w.recoil || 0));
        let loot = [];
        if (!hit.target.userData.alive) loot = this.impact?.grantLootForKill(hit.target) || [];
        this.hud.hitMarker(`-${hit.damage}`);
        this.hud.setObjective(`${hit.target.userData.name}: попадание · ${modeText} · ${this.firearms.statusText(this.player.weapon)}${loot.length ? ' · лут: ' + loot.join(', ') : ''}`);
      } else {
        this.hud.setObjective(`${w.name}: промах · ${modeText} · ${this.firearms.statusText(this.player.weapon)}`);
      }
      return true;
    }

    this.player.st -= staminaCost;
    this.cooldown = w.cooldown;
    const profile = attackProfile(this.player.weapon, 'primary') || { name: 'удар', range: w.range, arc: w.arc, damageMul: 1 };
    const skill = w.kind === 'blade' ? 'blade' : 'blunt';
    return this.meleeAttackWithProfile(profile, w, skill);
  };

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateArsenal(dt) {
    originalUpdate.call(this, dt);
    if (this.mode !== 'boot' && !this.paused) {
      this.firearms?.update(dt);
      this.impact?.update(dt);
      const weaponId = this.player.weapon;
      const w = WEAPONS[weaponId];
      const mode = this.currentFireMode?.(weaponId) || 'semi';

      if (w?.kind === 'gun' && this.cooldown <= 0) {
        const burst = this.burstFireState;
        if (burst?.weaponId === weaponId && burst.remaining > 0) {
          if (this.attack()) burst.remaining -= 1;
        } else if (w.automatic && mode === 'auto' && canAutoContinue(this)) {
          this.attack();
        }
      }

      if (w?.ammo) {
        const status = this.firearms.statusText(this.player.weapon);
        const bottom = document.getElementById('bottom');
        if (bottom) bottom.textContent = `R reload · H ${fireModeLabel(mode)} · B alt · V aim · ${ARSENAL[this.player.weapon]?.name}: ${status} · Y enchant`;
      }
    }
  };
}
