import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL14_DIALOGUE } from '../../config/dialogue.js'
import { deadlinePuzzle, DEADLINE_ID, BUTTON_COUNT } from './deadlinePuzzle.js'
import { LEVEL14 } from './layout.js'

export function createLevel14Logic(options = {}) {
  let doorOpen = false
  const reset = () => {
    doorOpen = false
  }
  const rt = createLevelRuntime({
    levelId: LEVEL14.id,
    puzzles: [deadlinePuzzle],
    dialogueLines: LEVEL14_DIALOGUE,
    welcomeDelayMs: LEVEL14.welcomeDelayMs,
    completeDelayMs: LEVEL14.completeDelayMs,
    ...options,
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(DEADLINE_ID)?.getData()
  const done = () => manager.isCompleted(DEADLINE_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // True only when this press changed something (a second press of the same button does nothing).
    press(index) {
      if (!rt.isStarted() || !Number.isInteger(index) || index < 0 || index >= BUTTON_COUNT) return false
      const d = data()
      if (!d || d.unlocked || d.pressed[index]) return false
      manager.dispatch('press', { index })
      return true
    },
    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    getPressed: () => data()?.pressed ?? Array(BUTTON_COUNT).fill(false),
    getAttempts: () => data()?.attempts ?? 0,
    getWindowMs: () => data()?.windowMs ?? LEVEL14.windowMs,
    isUnlocked: () => Boolean(data()?.unlocked),
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
