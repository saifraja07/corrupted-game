import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL16_DIALOGUE } from '../../config/dialogue.js'
import { isInView } from '../../mechanics/lookAway.js'
import { staringPuzzle, STARING_ID } from './staringPuzzle.js'
import { LEVEL16 } from './layout.js'

export function createLevel16Logic(options = {}) {
  let doorOpen = false
  let stareMs = 0
  let awayMs = 0
  let sent1 = false
  let sent2 = false
  let watching = false
  const reset = () => {
    doorOpen = false
    stareMs = 0
    awayMs = 0
    sent1 = false
    sent2 = false
    watching = false
  }
  const rt = createLevelRuntime({
    levelId: LEVEL16.id,
    puzzles: [staringPuzzle],
    dialogueLines: LEVEL16_DIALOGUE,
    welcomeDelayMs: LEVEL16.welcomeDelayMs,
    completeDelayMs: LEVEL16.completeDelayMs,
    ...options,
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(STARING_ID)?.getData()
  const done = () => manager.isCompleted(STARING_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing. view: { x, y, z, fx, fy, fz } (see mechanics/lookAway.js); dtMs in ms.
    update(view, dtMs) {
      if (!rt.isStarted() || data()?.unlocked) return
      watching = isInView(view, LEVEL16.eye, LEVEL16.view)
      if (watching) {
        awayMs = 0
        stareMs += dtMs
        if (!sent1 && stareMs >= LEVEL16.stare1Ms) {
          sent1 = true
          manager.dispatch('stare_1')
        }
        if (!sent2 && stareMs >= LEVEL16.stare2Ms) {
          sent2 = true
          manager.dispatch('stare_2')
        }
        if (stareMs >= LEVEL16.stareRequiredMs) manager.dispatch('stare_win')
      } else if (stareMs > 0) {
        awayMs += dtMs
        if (awayMs > LEVEL16.graceMs) {
          if (stareMs >= LEVEL16.brokenAfterMs) manager.dispatch('stare_broken')
          stareMs = 0
          awayMs = 0
          sent1 = false
          sent2 = false
        }
      }
    },

    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    getStareProgress: () => Math.min(1, stareMs / LEVEL16.stareRequiredMs),
    isWatching: () => watching,
    isUnlocked: () => Boolean(data()?.unlocked),
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
