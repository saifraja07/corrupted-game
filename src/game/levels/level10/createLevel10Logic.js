import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL10_DIALOGUE } from '../../config/dialogue.js'
import { stillnessPuzzle, STILLNESS_ID } from './stillnessPuzzle.js'
import { LEVEL10 } from './layout.js'

export function createLevel10Logic(options = {}) {
  let doorOpen = false
  let last = null // the previous { x, z, yaw, pitch }
  let stillMs = 0
  let movingMs = 0
  let countdown = LEVEL10.countdownStart
  let tooLateMsLeft = 0
  const reset = () => {
    doorOpen = false
    last = null
    stillMs = 0
    movingMs = 0
    countdown = LEVEL10.countdownStart
    tooLateMsLeft = 0
  }

  const rt = createLevelRuntime({
    levelId: LEVEL10.id,
    puzzles: [stillnessPuzzle],
    dialogueLines: LEVEL10_DIALOGUE,
    welcomeDelayMs: LEVEL10.welcomeDelayMs,
    completeDelayMs: LEVEL10.completeDelayMs,
    ...options,
    onEvent: (e) => {
      if (e.type === 'effect' && e.payload.effect === 'still_reset') stillMs = 0 // the decoy button costs you your stillness
    },
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(STILLNESS_ID)?.getData()
  const done = () => manager.isCompleted(STILLNESS_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing. state: { x, z, yaw, pitch } of the camera. dtMs in ms. Pausing stops the calls.
    update(state, dtMs) {
      if (!rt.isStarted()) return
      const prev = last
      last = { x: state.x, z: state.z, yaw: state.yaw, pitch: state.pitch }
      if (!prev) return // first frame: nothing to compare with yet
      if (data()?.unlocked) return // solved: the fake countdown stops mattering

      // "TOO LATE." shows for a few seconds of game time, then the fake countdown starts over.
      if (tooLateMsLeft > 0) {
        tooLateMsLeft -= dtMs
        if (tooLateMsLeft <= 0) {
          tooLateMsLeft = 0
          countdown = LEVEL10.countdownStart
        }
      }

      const moved =
        Math.abs(state.x - prev.x) + Math.abs(state.z - prev.z) > LEVEL10.moveEps ||
        Math.abs(state.yaw - prev.yaw) + Math.abs(state.pitch - prev.pitch) > LEVEL10.lookEps

      if (moved) {
        stillMs = 0
        movingMs += dtMs
        const ticks = Math.floor(movingMs / 1000) // the fake countdown only advances while you move
        movingMs -= ticks * 1000
        if (ticks > 0 && tooLateMsLeft === 0) {
          countdown -= ticks
          if (countdown <= 0) {
            countdown = 0
            tooLateMsLeft = LEVEL10.tooLateMs
            manager.dispatch('countdown_zero') // pure rage-bait: nothing real happens
          }
        }
      } else {
        stillMs += dtMs
        if (stillMs >= LEVEL10.stillRequiredMs) manager.dispatch('still_enough')
      }
    },

    // The decoy button: just resets your stillness.
    pressDecoy() {
      if (!rt.isStarted() || data()?.unlocked) return false
      manager.dispatch('decoy_pressed')
      return true
    },
    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    getCountdownText: () => (tooLateMsLeft > 0 ? 'TOO LATE.' : `EXIT CLOSES IN ${countdown}`),
    getStillMs: () => stillMs,
    isUnlocked: () => Boolean(data()?.unlocked),
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
