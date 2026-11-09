import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL09_DIALOGUE } from '../../config/dialogue.js'
import { almostPuzzle, ALMOST_ID } from './almostPuzzle.js'
import { LEVEL09 } from './layout.js'

export function createLevel09Logic(options = {}) {
  let doorOpen = false
  const reset = () => {
    doorOpen = false
  }
  const rt = createLevelRuntime({
    levelId: LEVEL09.id,
    puzzles: [almostPuzzle],
    dialogueLines: LEVEL09_DIALOGUE,
    welcomeDelayMs: LEVEL09.welcomeDelayMs,
    completeDelayMs: LEVEL09.completeDelayMs,
    ...options,
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(ALMOST_ID)?.getData()
  const done = () => manager.isCompleted(ALMOST_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // The obvious exit. Returns true ONLY the first time: that is when the scene should show the fake
    // "Level complete" screen. Later uses just get a remark.
    useDecoy() {
      if (!rt.isStarted() || done()) return false
      const first = !data()?.fakeUsed
      manager.dispatch('decoy_used')
      return first
    },
    // The real door: works once the fake has happened.
    useRealExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('real_used')
      return done()
    },

    isRealUnlocked: () => Boolean(data()?.fakeUsed),
    getDecoyUses: () => data()?.decoyUses ?? 0,
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
