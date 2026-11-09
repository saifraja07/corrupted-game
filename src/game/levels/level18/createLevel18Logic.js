import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL18_DIALOGUE } from '../../config/dialogue.js'
import { truthPuzzle, TRUTH_ID } from './truthPuzzle.js'
import { LEVEL18 } from './layout.js'

export function createLevel18Logic(options = {}) {
  let doorOpen = false
  let waitMs = 0
  const reset = () => {
    doorOpen = false
    waitMs = 0
  }
  const rt = createLevelRuntime({
    levelId: LEVEL18.id,
    puzzles: [truthPuzzle],
    dialogueLines: LEVEL18_DIALOGUE,
    welcomeDelayMs: LEVEL18.welcomeDelayMs,
    completeDelayMs: LEVEL18.completeDelayMs,
    ...options,
    onEvent: (e) => {
      if (e.type === 'effect' && e.payload.effect === 'wait_reset') waitMs = 0 // right button or an impatient door
    },
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(TRUTH_ID)?.getData()
  const done = () => manager.isCompleted(TRUTH_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing (game time, so pausing pauses the wait). dtMs in ms.
    update(dtMs) {
      if (!rt.isStarted()) return
      const d = data()
      if (!d || !d.left || d.waited) return
      waitMs += dtMs
      if (waitMs >= LEVEL18.waitMs) manager.dispatch('wait_done')
    },

    pressLeft() {
      if (!rt.isStarted() || data()?.left) return false
      manager.dispatch('press_left')
      return true
    },
    pressRight() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('press_right')
      return true
    },
    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    isLeftPressed: () => Boolean(data()?.left),
    isReady: () => Boolean(data()?.waited),
    getWaitMs: () => waitMs,
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
