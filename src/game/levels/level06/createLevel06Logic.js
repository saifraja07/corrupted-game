import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL06_DIALOGUE } from '../../config/dialogue.js'
import { createBlackoutCycle } from '../../mechanics/blackoutCycle.js'
import { lightsOutPuzzle, LIGHTS_OUT_ID, BUTTON_COUNT } from './lightsOutPuzzle.js'
import { LEVEL06 } from './layout.js'

export function createLevel06Logic(options = {}) {
  const cycle = createBlackoutCycle(LEVEL06.cycle)
  let doorOpen = false
  const reset = () => {
    cycle.reset()
    doorOpen = false
  }

  const rt = createLevelRuntime({
    levelId: LEVEL06.id,
    puzzles: [lightsOutPuzzle],
    dialogueLines: LEVEL06_DIALOGUE,
    welcomeDelayMs: LEVEL06.welcomeDelayMs,
    completeDelayMs: LEVEL06.completeDelayMs,
    ...options,
    onEvent: (e) => {
      // A second wrong press calls a blackout right away (unless one is already running).
      if (e.type === 'effect' && e.payload.effect === 'blackout_now' && cycle.triggerNow()) rt.fire('blackout_start')
    },
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(LIGHTS_OUT_ID)?.getData()
  const done = () => manager.isCompleted(LIGHTS_OUT_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing (dtMs in milliseconds).
    update(dtMs) {
      if (!rt.isStarted()) return
      if (cycle.update(dtMs) === 'started') rt.fire('blackout_start')
    },

    pressButton(index) {
      if (!rt.isStarted() || data()?.unlocked || !Number.isInteger(index) || index < 0 || index >= BUTTON_COUNT) return false
      manager.dispatch('press', { button: index })
      return true
    },
    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    getDarkness: () => cycle.getDarkness(),
    isGlowVisible: () => cycle.getDarkness() > LEVEL06.glowVisibleAbove,
    isBlackout: () => cycle.isActive(),
    isUnlocked: () => Boolean(data()?.unlocked),
    getWrongCount: () => data()?.wrong ?? 0,
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
