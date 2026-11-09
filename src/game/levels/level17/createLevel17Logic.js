import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL17_DIALOGUE } from '../../config/dialogue.js'
import { knockPuzzle, KNOCK_ID } from './knockPuzzle.js'
import { LEVEL17 } from './layout.js'

export function createLevel17Logic(options = {}) {
  let doorOpen = false
  let sinceKnockMs = LEVEL17.knockGapMs // the first knock is always allowed
  const reset = () => {
    doorOpen = false
    sinceKnockMs = LEVEL17.knockGapMs
  }
  const rt = createLevelRuntime({
    levelId: LEVEL17.id,
    puzzles: [knockPuzzle],
    dialogueLines: LEVEL17_DIALOGUE,
    welcomeDelayMs: LEVEL17.welcomeDelayMs,
    completeDelayMs: LEVEL17.completeDelayMs,
    ...options,
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(KNOCK_ID)?.getData()
  const done = () => manager.isCompleted(KNOCK_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing (game time, so pausing pauses the gap). dtMs in ms.
    update(dtMs) {
      if (!rt.isStarted()) return
      sinceKnockMs += dtMs
    },

    // The door interaction. True only when the knock was counted (a too-fast knock is refused, not punished).
    knock() {
      if (!rt.isStarted() || done()) return false
      if (sinceKnockMs < LEVEL17.knockGapMs) {
        manager.dispatch('knock_fast')
        return false
      }
      sinceKnockMs = 0
      manager.dispatch('knock')
      return true
    },
    pressDecoy() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('decoy')
      return true
    },

    getKnocks: () => data()?.knocks ?? 0,
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
