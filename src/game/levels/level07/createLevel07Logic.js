import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL07_DIALOGUE } from '../../config/dialogue.js'
import { createUnobservedGate } from '../../mechanics/unobservedGate.js'
import { isInView } from '../../mechanics/lookAway.js'
import { blinkPuzzle, BLINK_ID } from './blinkPuzzle.js'
import { LEVEL07 } from './layout.js'

const { gate: G, footprint: F } = LEVEL07

export function createLevel07Logic(options = {}) {
  const gate = createUnobservedGate({ openAfterMs: LEVEL07.openAfterMs, closeAfterMs: LEVEL07.closeAfterMs })
  const points = LEVEL07.viewHeights.map((y) => ({ x: 0, y, z: G.z }))
  let doorOpen = false
  let watched = true
  let crossedSent = false
  let nearClosedMs = 0
  let hint1Sent = false
  let hint2Sent = false
  const reset = () => {
    gate.reset()
    doorOpen = false
    watched = true
    crossedSent = false
    nearClosedMs = 0
    hint1Sent = false
    hint2Sent = false
  }

  const rt = createLevelRuntime({
    levelId: LEVEL07.id,
    puzzles: [blinkPuzzle],
    dialogueLines: LEVEL07_DIALOGUE,
    welcomeDelayMs: LEVEL07.welcomeDelayMs,
    completeDelayMs: LEVEL07.completeDelayMs,
    ...options,
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const done = () => manager.isCompleted(BLINK_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing. view: { x, y, z, fx, fy, fz } (see mechanics/lookAway.js); dtMs in ms.
    update(view, dtMs) {
      if (!rt.isStarted()) return
      watched = points.some((p) => isInView(view, p, LEVEL07.view))
      const blocked = Math.abs(view.x) <= F.halfX && Math.abs(view.z - G.z) <= F.halfZ // never close on the player
      const change = gate.update(dtMs, watched, blocked)
      if (change) rt.fire(change === 'opened' ? 'gate_open' : 'gate_close') // announces itself (sound)

      if (!crossedSent && view.z < LEVEL07.crossedZ) {
        crossedSent = true
        manager.dispatch('crossed')
      }
      // Lingering at a closed gate escalates the hints.
      if (!gate.isOpen() && !crossedSent && Math.hypot(view.x, view.z - G.z) <= LEVEL07.hintNear) {
        nearClosedMs += dtMs
        if (!hint1Sent && nearClosedMs >= LEVEL07.hint1Ms) {
          hint1Sent = true
          manager.dispatch('linger', { level: 1 })
        }
        if (!hint2Sent && nearClosedMs >= LEVEL07.hint2Ms) {
          hint2Sent = true
          manager.dispatch('linger', { level: 2 })
        }
      }
    },

    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    isGateOpen: () => gate.isOpen(),
    isGateWatched: () => watched,
    hasCrossed: () => crossedSent,
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
