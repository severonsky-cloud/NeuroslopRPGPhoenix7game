import { WorldState } from '../state/worldState.js';
import { DIALOGUE } from '../dialogue/dialogueData.js';
import { DialogueSession } from '../ui/dialogueView.js';

export function installDialogueExtensions(PhoenixV3Engine) {
  if (PhoenixV3Engine.__dialogueExtensionInstalled) return;
  PhoenixV3Engine.__dialogueExtensionInstalled = true;

  const originalBuildScene = PhoenixV3Engine.prototype.buildScene;
  PhoenixV3Engine.prototype.buildScene = function buildSceneWithDialogue() {
    const result = originalBuildScene.call(this);
    if (!this.worldState) this.worldState = new WorldState();
    this.worldState.applyPersistentRewards(this);
    this.log.unshift('v3M2B: квестовый движок и диалоги-темы (Морровинд-стиль) подключены.');
    return result;
  };

  // E near an NPC opens topic dialogue if that NPC has authored dialogue;
  // otherwise the original simple interaction panel is used unchanged.
  const originalInteract = PhoenixV3Engine.prototype.interact;
  PhoenixV3Engine.prototype.interact = function interactWithDialogue() {
    if (this.paused || this.mode === 'boot') return;
    const candidates = [
      ...(this.livingWorld?.agents || []).filter((agent) => !agent.userData.settlementCulled),
      ...(this.npcs || []),
    ]
      .map((actor) => ({
        actor,
        id: actor.userData?.id,
        distance: Math.hypot(
          (actor.userData?.x ?? actor.position.x) - this.rig.position.x,
          (actor.userData?.z ?? actor.position.z) - this.rig.position.z,
        ),
      }))
      .filter((entry) => DIALOGUE[entry.id] && entry.distance < 2.8)
      .sort((a, b) => a.distance - b.distance);
    const id = candidates[0]?.id;
    if (id && DIALOGUE[id]) {
      this.paused = true;
      this.rpg?.useSkill?.('speech', 0.5);
      this.dialogueSession = new DialogueSession(this, id);
      return;
    }
    return originalInteract.call(this);
  };

  // Persistent rewards are re-applied when continuing an existing profile.
  // New Game itself is reset only from the creator's onConfirm callback so
  // cancelling the creator cannot destroy the current world state.
  const originalRequestGameStart = PhoenixV3Engine.prototype.requestGameStart;
  if (originalRequestGameStart) {
    PhoenixV3Engine.prototype.requestGameStart = function requestGameStartWithWorldReset(options = {}) {
      const result = originalRequestGameStart.call(this, options);
      if (result && !options?.newGame) this.worldState?.applyPersistentRewards?.(this);
      return result;
    };
  }

  PhoenixV3Engine.prototype.getQuestDiagnostics = function getQuestDiagnostics() {
    return {
      worldState: !!this.worldState,
      activeQuests: this.worldState?.activeQuests?.() || [],
      dialogueNpcs: Object.keys(DIALOGUE),
    };
  };
}
