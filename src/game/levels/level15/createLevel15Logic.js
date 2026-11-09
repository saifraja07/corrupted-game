import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL15_DIALOGUE } from '../../config/dialogue.js'
import { leanPuzzle, LEAN_ID } from './leanPuzzle.js'
import { LEVEL15 } from './layout.js'

export function createLevel15Logic(options = {}) {
  let doorOpen = false
  let leanMs = 0
  const reset = () => {
    doorOpen = false
    leanMs = 0
  }
  const rt = createLevelRuntime({
    levelId: LEVEL15.id,
    puzzles: [leanPuzzle],
    dialogueLines: LEVEL15_DIALOGUE,
    welcomeDelayMs: LEVEL15.welcomeDelayMs,
    completeDelayMs: LEVEL15.completeDelayMs,
    ...options,
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(LEAN_ID)?.getData()
  const done = () => manager.isCompleted(LEAN_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing. state: { x, z } of the camera; dtMs in ms. Pausing stops the calls.
    update(state, dtMs) {
      if (!rt.isStarted() || data()?.unlocked) return
      const against = state.x <= LEVEL15.leanX && Math.abs(state.z - LEVEL15.leanZ) <= LEVEL15.leanHalfZ
      if (!against) {
        leanMs = 0 // leaving the wall starts the count again
        return
      }
      leanMs += dtMs
      if (leanMs >= LEVEL15.beginMs) manager.dispatch('lean_begin')
      if (leanMs >= LEVEL15.leanRequiredMs) manager.dispatch('lean_enough')
    },

    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    getLeanMs: () => leanMs,
    isUnlocked: () => Boolean(data()?.unlocked),
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
