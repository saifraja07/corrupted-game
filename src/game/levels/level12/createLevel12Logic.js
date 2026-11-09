import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL12_DIALOGUE } from '../../config/dialogue.js'
import { metaExitPuzzle, META_EXIT_ID } from './metaExitPuzzle.js'
import { LEVEL12 } from './layout.js'

export function createLevel12Logic(options = {}) {
  const rt = createLevelRuntime({
    levelId: LEVEL12.id,
    puzzles: [metaExitPuzzle],
    dialogueLines: LEVEL12_DIALOGUE,
    welcomeDelayMs: LEVEL12.welcomeDelayMs,
    completeDelayMs: LEVEL12.completeDelayMs,
    ...options,
  })
  const manager = rt.manager
  const data = () => manager.get(META_EXIT_ID)?.getData()
  const done = () => manager.isCompleted(META_EXIT_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // A painted-on door: just a wall.
    probeDoorway(index) {
      if (!rt.isStarted() || done() || !Number.isInteger(index) || index < 0 || index >= LEVEL12.doorwayXs.length) return false
      manager.dispatch('doorway_probe', { door: index })
      return true
    },
    // The real exit: the pause menu's EXIT button. Available from the first second (no gate): only finding it is hard.
    useMetaExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('meta_exit')
      return done()
    },

    getProbes: () => data()?.probes ?? 0,
    isExitDone: done,
  }
}
