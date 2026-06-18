import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { ARSENAL, WEAPON_ARCHETYPES, AMMO_TYPES } from '../combat/arsenal.js';
import { Materials, makeMat } from '../world/props.js';

function skinMat() { return makeMat(0xc09673); }
function darkMat() { return makeMat(0x0d0b09); }
function woodMat() { return makeMat(0x5b3b22); }
function steelMat() { return makeMat(0xc8c0a8, { roughness: 0.34, metalness: 0.28 }); }

function addHands(root) {
  const skin = skinMat();
  const armGeo = new THREE.CapsuleGeometry(0.055, 0.32, 5, 8);
  const fistGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const left = new THREE.Group();
  const right = new THREE.Group();
  const la = new THREE.Mesh(armGeo, skin); la.rotation.x = 1.18;
  const ra = new THREE.Mesh(armGeo, skin); ra.rotation.x = 1.18;
  const lf = new THREE.Mesh(fistGeo, skin); lf.position.set(0, -0.01, -0.29);
  const rf = new THREE.Mesh(fistGeo, skin); rf.position.set(0, -0.01, -0.29);
  left.add(la, lf); right.add(ra, rf);
  left.position.set(-0.22, -0.49, -0.82);
  right.position.set(0.25, -0.49, -0.82);
  left.rotation.set(-0.2, 0.16, -0.12);
  right.rotation.set(-0.2, -0.16, 0.12);
  root.add(left, right);
}

function box(root, w, h, d, x, y, z, mat, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  root.add(m);
  return m;
}

function cyl(root, r, h, x, y, z, mat, axis = 'z') {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), mat);
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  m.position.set(x, y, z);
  root.add(m);
  return m;
}

function frontSight(root, x, y, z) {
  box(root, 0.035, 0.13, 0.035, x, y + 0.1, z, darkMat());
  box(root, 0.16, 0.025, 0.025, x - 0.05, y + 0.04, z, darkMat());
}

function firearm(root, weapon, aimMode) {
  const model = WEAPON_ARCHETYPES[weapon.archetype]?.model || 'rifle';
  const centerX = aimMode ? 0.02 : 0.32;
  const centerY = aimMode ? -0.36 : -0.43;
  const centerZ = aimMode ? -0.92 : -0.75;
  const len = model === 'revolver' ? 0.38 : model === 'carbine' ? 0.72 : model === 'shotgun' ? 0.88 : model === 'lmg' ? 0.9 : 1.05;
  const thick = model === 'lmg' ? 0.17 : model === 'shotgun' ? 0.14 : 0.12;
  box(root, len, thick, 0.16, centerX, centerY, centerZ, Materials.metal, 0, aimMode ? 0 : -0.08, 0);
  cyl(root, model === 'shotgun' ? 0.025 : 0.018, len * 0.92, centerX + len * 0.52, centerY + 0.01, centerZ, Materials.metal, 'z');
  box(root, 0.12, 0.26, 0.09, centerX - len * 0.25, centerY - 0.18, centerZ + 0.05, woodMat(), 0.18, 0, 0);
  frontSight(root, centerX + len * 0.94, centerY + 0.02, centerZ);

  if (model === 'revolver') {
    cyl(root, 0.11, 0.12, centerX + 0.02, centerY, centerZ, Materials.metal, 'x');
    box(root, 0.16, 0.12, 0.05, centerX + 0.25, centerY - 0.02, centerZ, darkMat());
  }
  if (model === 'lmg') {
    box(root, 0.28, 0.38, 0.12, centerX + 0.08, centerY + 0.22, centerZ, Materials.metal);
    box(root, 0.55, 0.05, 0.65, centerX + 0.25, centerY - 0.2, centerZ + 0.1, Materials.metal, 0, 0, 0.2);
  }
  if (weapon.bayonet) {
    const blade = box(root, 0.035, 0.035, 0.42, centerX + len * 1.04, centerY + 0.01, centerZ, steelMat());
    blade.name = 'bayonet_viewmodel';
  }
}

function blade(root, weapon) {
  const model = WEAPON_ARCHETYPES[weapon.archetype]?.model;
  if (model === 'axe') {
    box(root, 0.06, 0.06, 0.82, 0.34, -0.42, -0.94, woodMat());
    box(root, 0.42, 0.12, 0.08, 0.34, -0.38, -1.35, steelMat());
    return;
  }
  if (model === 'dagger') {
    box(root, 0.035, 0.035, 0.45, 0.34, -0.42, -0.86, steelMat());
    box(root, 0.22, 0.035, 0.05, 0.34, -0.44, -0.62, Materials.brass);
    return;
  }
  const bladeLen = model === 'rapier' ? 0.86 : 1.1;
  const bladeWidth = model === 'rapier' ? 0.024 : 0.06;
  box(root, bladeWidth, bladeWidth, bladeLen, 0.34, -0.42, -1.04, steelMat());
  box(root, model === 'rapier' ? 0.34 : 0.52, 0.045, 0.06, 0.34, -0.44, -0.66, Materials.brass);
}

export function createWeaponViewModel(weaponId, aimMode = false) {
  const root = new THREE.Group();
  addHands(root);
  const weapon = ARSENAL[weaponId] || ARSENAL.fists;
  const cls = WEAPON_ARCHETYPES[weapon.archetype]?.class;
  if (cls === 'firearm') firearm(root, weapon, aimMode);
  else if (cls === 'phase') {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), new THREE.MeshStandardMaterial({ color: 0x8a78ff, emissive: 0x5845ff, emissiveIntensity: 1.7, transparent: true, opacity: 0.82 }));
    orb.position.set(0.02, -0.32, -0.9);
    root.add(orb);
  } else if (weaponId !== 'fists') blade(root, weapon);
  return root;
}

export function itemIconHtml(itemOrWeaponId) {
  const w = ARSENAL[itemOrWeaponId];
  if (w) return `<span class="itemIcon">${w.icon || '?'}</span>`;
  const a = AMMO_TYPES[itemOrWeaponId];
  if (a) return `<span class="itemIcon">${a.icon}</span>`;
  return '<span class="itemIcon">□</span>';
}
