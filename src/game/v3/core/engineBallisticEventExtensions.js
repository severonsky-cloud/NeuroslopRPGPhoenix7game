export function installBallisticEventExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__ballisticEventExtensionInstalled) return;
  PhoenixV3Engine.__ballisticEventExtensionInstalled = true;

  const originalUpdate = PhoenixV3Engine.prototype.update;
  PhoenixV3Engine.prototype.update = function updateWithBallisticEvents(dt) {
    originalUpdate.call(this, dt);
    if (this.mode === 'boot' || this.paused) return;
    const events = this.ballistics?.drainEvents?.() || [];
    for (const event of events) {
      if (event.type === 'rocketLaunch') {
        this.hud.setObjective('Ракета ушла по баллистике: держи цель, смотри падение и попадание.');
        continue;
      }
      if (event.type === 'explosion') {
        this.combatAudio?.explosion?.(event.radius > 4.0 ? 'blast' : 'small');
        const strongest = [...(event.splash || [])].sort((a, b) => (b.damage || 0) - (a.damage || 0))[0];
        if (strongest?.damage > 0) this.hud.hitMarker(`-${strongest.damage}`);
        continue;
      }
      if (event.type === 'rocketImpact') {
        this.combatAudio?.explosion?.('blast');
        const direct = event.direct;
        if (direct?.damage > 0) {
          const name = direct.target?.userData?.name || 'цель';
          this.hud.hitMarker(`-${direct.damage}`);
          this.hud.setObjective(`${name}: прямое попадание ракеты + сплеш вокруг.`);
        } else {
          this.hud.setObjective('Ракета взорвалась: сплеш-урон по зоне.');
        }
      }
    }
  };
}
