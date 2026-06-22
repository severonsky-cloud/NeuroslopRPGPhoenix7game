export class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointerLocked = false;
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.onAction = null;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (this.onAction) this.onAction(e.code, e);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('pointerup', (e) => {
      if (e.button === 0) this.keys.delete('MouseLeft');
    });
    window.addEventListener('blur', () => this.keys.delete('MouseLeft'));
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.canvas) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      if (!this.pointerLocked) this.keys.delete('MouseLeft');
    });
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.keys.add('MouseLeft');
      if (document.pointerLockElement === canvas && this.onAction) this.onAction('MouseLeft', e);
    });
    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    });
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.onAction) this.onAction('MouseRight', e);
    });
  }

  consumeMouse() {
    const out = { dx: this.mouseDX, dy: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return out;
  }

  axis() {
    let x = 0, z = 0;
    if (this.keys.has('KeyW')) z -= 1;
    if (this.keys.has('KeyS')) z += 1;
    if (this.keys.has('KeyA')) x -= 1;
    if (this.keys.has('KeyD')) x += 1;
    return { x, z };
  }

  sprinting() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }

  blocking() {
    return this.keys.has('KeyR');
  }
}
