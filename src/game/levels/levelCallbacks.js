import { useGameStore } from '../state/gameStore.js'
import { useDialogueStore } from '../state/dialogueStore.js'
import { useProgressStore } from '../state/progressStore.js'
import { audio } from '../systems/audio.js'
import { corruption, reportGameEvent, resetCorruption, startCorruptionForLevel } from '../state/corruptionController.js'

// Wires a level's runtime callbacks to the shared stores. Used by every level scene.
export function createLevelCallbacks(levelId) {
  return {
    onMessage: (line) => {
      useDialogueStore.getState().setMessage(line)
      if (line) audio.play('dialogue')
    },
    getStage: () => corruption.getStage(),
    // Corruption reacts first (so lines see the new stage); sounds follow. Returns the new stage if it rose.
    onGameEvent: (name) => {
      const raised = reportGameEvent(name)
      audio.playEvent(name)
      if (typeof raised === 'number') audio.playEvent(`corruption_stage_${raised}`)
      return raised
    },
    onLevelStart: () => startCorruptionForLevel(levelId),
    onLevelDispose: () => resetCorruption(),
    onPuzzleCompleted: (id) => {
      useGameStore.getState().markPuzzleComplete(id)
      audio.play('success')
    },
    onLevelComplete: () => {
      // levelComplete() is guarded, so a level can only complete once per run.
      if (useGameStore.getState().levelComplete()) {
        useProgressStore.getState().completeLevel(levelId)
        globalThis.document?.exitPointerLock?.()
      }
    },
  }
}
