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
    this.log.unshift('v3M2B: квестовый движок и диалоги-темы (Морровинд-стиль) подключены.');
    return result;
  };

  // E near an NPC opens topic dialogue if that NPC has authored dialogue;
  // otherwise the original simple interaction panel is used unchanged.
  const originalInteract = PhoenixV3Engine.prototype.interact;
  PhoenixV3Engine.prototype.interact = function interactWithDialogue() {
    if (this.paused || this.mode === 'boot') return;
    const agent = this.livingWorld?.findNear?.(this.rig) || null;
    const npc = agent
      ? null
      : (this.npcs || []).find((n) => Math.hypot(n.userData.x - this.rig.position.x, n.userData.z - this.rig.position.z) < 2.4) || null;
    const id = agent?.userData?.id || npc?.userData?.id;
    if (id && DIALOGUE[id]) {
      this.paused = true;
      this.rpg?.useSkill?.('speech', 0.5);
      this.dialogueSession = new DialogueSession(this, id);
      return;
    }
    return originalInteract.call(this);
  };

  PhoenixV3Engine.prototype.getQuestDiagnostics = function getQuestDiagnostics() {
    return {
      worldState: !!this.worldState,
      activeQuests: this.worldState?.activeQuests?.() || [],
      dialogueNpcs: Object.keys(DIALOGUE),
    };
  };
}
