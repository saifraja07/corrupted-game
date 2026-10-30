import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL02_DIALOGUE } from '../../config/dialogue.js'
import { twoButtonsPuzzle, TWO_BUTTONS_ID } from './twoButtonsPuzzle.js'
import { LEVEL02 } from './layout.js'

export function createLevel02Logic(options = {}) {
  let doorOpen = false
  const reset = () => {
    doorOpen = false
  }
  const rt = createLevelRuntime({
    levelId: LEVEL02.id,
    puzzles: [twoButtonsPuzzle],
    dialogueLines: LEVEL02_DIALOGUE,
    welcomeDelayMs: LEVEL02.welcomeDelayMs,
    completeDelayMs: LEVEL02.completeDelayMs,
    ...options,
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(TWO_BUTTONS_ID)?.getData()

  // Press helpers return true only when the press changed something.
  const press = (event, flag) => {
    if (!rt.isStarted() || data()?.[flag]) return false
    manager.dispatch(event)
    return Boolean(data()?.[flag])
  }

  return {
    start: rt.start,
    dispose: rt.dispose,
    pressA: () => press('press_a', 'a'),
    pressB: () => press('press_b', 'b'),
    // Using the door early is allowed (it just says no); it opens only once both buttons are pressed.
    useExit() {
      if (!rt.isStarted() || manager.isCompleted(TWO_BUTTONS_ID)) return false
      manager.dispatch('exit_used')
      return manager.isCompleted(TWO_BUTTONS_ID)
    },
    isAPressed: () => Boolean(data()?.a),
    isBPressed: () => Boolean(data()?.b),
    isUnlocked: () => Boolean(data()?.a && data()?.b),
    isDoorOpen: () => doorOpen,
    isExitDone: () => manager.isCompleted(TWO_BUTTONS_ID),
  }
}
