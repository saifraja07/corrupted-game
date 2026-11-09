import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL13_DIALOGUE } from '../../config/dialogue.js'
import { disobeyPuzzle, DISOBEY_ID } from './disobeyPuzzle.js'
import { LEVEL13 } from './layout.js'

export function createLevel13Logic(options = {}) {
  let doorOpen = false
  const reset = () => {
    doorOpen = false
  }
  const rt = createLevelRuntime({
    levelId: LEVEL13.id,
    puzzles: [disobeyPuzzle],
    dialogueLines: LEVEL13_DIALOGUE,
    welcomeDelayMs: LEVEL13.welcomeDelayMs,
    completeDelayMs: LEVEL13.completeDelayMs,
    ...options,
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(DISOBEY_ID)?.getData()
  const done = () => manager.isCompleted(DISOBEY_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Both press helpers return true when the press was counted (they do nothing once the door is unlocked).
    pressRed() {
      if (!rt.isStarted() || data()?.unlocked) return false
      manager.dispatch('press_red')
      return true
    },
    pressGreen() {
      if (!rt.isStarted() || data()?.unlocked) return false
      manager.dispatch('press_green')
      return true
    },
    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    getRedCount: () => data()?.red ?? 0,
    isUnlocked: () => Boolean(data()?.unlocked),
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
