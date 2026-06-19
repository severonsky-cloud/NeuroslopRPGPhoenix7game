import * as THREE from '../vendor/three.module.js';
import { PlayerBodySystem } from './playerBody.js';

export class CharacterPreview {
  constructor(host, profile) {
    this.host = host;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x15100d);
    this.scene.fog = new THREE.Fog(0x15100d, 7, 15);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
    this.host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
    this.camera.position.set(3.1, 2.05, 3.8);
    this.camera.lookAt(0, 1.15, 0);
    this.scene.add(new THREE.HemisphereLight(0xd8c99f, 0x181018, 1.45));
    const sun = new THREE.DirectionalLight(0xffbd78, 2.15);
    sun.position.set(3, 7, 4);
    sun.castShadow = true;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x758cff, 0.9);
    rim.position.set(-4, 3, -2);
    this.scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 40),
      new THREE.MeshStandardMaterial({ color: 0x493324, roughness: 0.98 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.rig = new THREE.Group();
    this.scene.add(this.rig);
    this.mockEngine = {
      rig: this.rig,
      player: {
        race: profile.race,
        gender: profile.gender,
        characterProfile: profile,
        motion: { vx: 0, vz: 0, bob: 0 },
      },
      yaw: 0,
    };
    this.body = new PlayerBodySystem(this.mockEngine);
    this.body.build();
    this.body.setThirdPerson(true);
    this.body.setPoseMode('idle');

    this.yaw = Math.PI + 0.35;
    this.dragging = false;
    this.lastPointerX = 0;
    this.lastTime = performance.now();
    this.frame = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.bindPointer();
    this.resize();
    this.loop = this.loop.bind(this);
    this.frame = requestAnimationFrame(this.loop);
  }

  bindPointer() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (event) => {
      this.dragging = true;
      this.lastPointerX = event.clientX;
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.dragging) return;
      this.yaw += (event.clientX - this.lastPointerX) * 0.012;
      this.lastPointerX = event.clientX;
    });
    const stop = (event) => {
      this.dragging = false;
      canvas.releasePointerCapture?.(event.pointerId);
    };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
  }

  setProfile(profile) {
    this.mockEngine.player.race = profile.race;
    this.mockEngine.player.gender = profile.gender;
    this.mockEngine.player.characterProfile = profile;
    this.body.setRace(profile);
    this.body.setThirdPerson(true);
  }

  setPose(mode) {
    this.body.setPoseMode(mode);
  }

  resize() {
    const rect = this.host.getBoundingClientRect();
    const width = Math.max(240, Math.round(rect.width));
    const height = Math.max(280, Math.round(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.rig.rotation.y = THREE.MathUtils.damp(this.rig.rotation.y, this.yaw, 10, dt);
    this.mockEngine.player.motion.bob += dt * (this.body.poseMode === 'walk' ? 7 : 2);
    this.body.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.loop);
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.body?.container?.traverse?.((node) => {
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((material) => material?.dispose?.());
      else node.material?.dispose?.();
    });
    this.body?.container?.removeFromParent?.();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
