import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL03_DIALOGUE } from '../../config/dialogue.js'
import { createControlModifiers } from '../../mechanics/controlModifiers.js'
import { createTriggerZone } from '../../mechanics/triggerZone.js'
import { backwardsPuzzle, BACKWARDS_ID } from './backwardsPuzzle.js'
import { LEVEL03 } from './layout.js'

export function createLevel03Logic(options = {}) {
  const modifiers = createControlModifiers() // owned by this level; cleared on every start and dispose
  const zone = createTriggerZone({ contains: (p) => p.z < LEVEL03.zoneZ })
  let doorOpen = false
  const reset = () => {
    modifiers.clear()
    zone.reset()
    doorOpen = false
  }

  const rt = createLevelRuntime({
    levelId: LEVEL03.id,
    puzzles: [backwardsPuzzle],
    dialogueLines: LEVEL03_DIALOGUE,
    welcomeDelayMs: LEVEL03.welcomeDelayMs,
    completeDelayMs: LEVEL03.completeDelayMs,
    ...options,
    onEvent: (e) => {
      if (e.type === 'effect' && e.payload.effect === 'reverse_controls') {
        modifiers.set({ invertForward: e.payload.on, invertStrafe: e.payload.on })
      }
    },
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(BACKWARDS_ID)?.getData()

  return {
    start: rt.start,
    dispose: rt.dispose,
    modifiers,

    // Every frame while playing. player: { x, z }.
    update(player) {
      if (rt.isStarted() && zone.update(player)) manager.dispatch('zone_entered')
    },
    pressCalibrate() {
      if (!rt.isStarted() || data()?.calibrated) return false
      manager.dispatch('calibrate_pressed')
      return Boolean(data()?.calibrated)
    },
    // Locked until calibrated.
    useExit() {
      if (!rt.isStarted() || !data()?.calibrated || manager.isCompleted(BACKWARDS_ID)) return false
      manager.dispatch('exit_used')
      return manager.isCompleted(BACKWARDS_ID)
    },
    isCalibrated: () => Boolean(data()?.calibrated),
    isReversed: () => modifiers.isActive(),
    isDoorOpen: () => doorOpen,
    isExitDone: () => manager.isCompleted(BACKWARDS_ID),
  }
}
