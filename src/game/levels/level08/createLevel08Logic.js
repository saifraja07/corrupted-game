import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL08_DIALOGUE } from '../../config/dialogue.js'
import { createUnobservedMover } from '../../mechanics/unobservedMover.js'
import { isInView } from '../../mechanics/lookAway.js'
import { lastRoomPuzzle, LAST_ROOM_ID } from './lastRoomPuzzle.js'
import { getRoomLayout, LEVEL08 } from './layout.js'

const { presence: P } = LEVEL08

export function createLevel08Logic(options = {}) {
  let variant = 0
  let presenceVisible = false
  let observed = false
  const first = getRoomLayout(0)
  const mover = createUnobservedMover({ ...first.presenceAnchor, speed: P.speed, minDistance: P.minDistance, bounds: first.presenceBounds })

  // Put the presence at the anchor of the current room variant.
  const placePresence = () => {
    const layout = getRoomLayout(variant)
    mover.setBounds(layout.presenceBounds)
    mover.reset(layout.presenceAnchor.x, layout.presenceAnchor.z)
  }
  const reset = () => {
    variant = 0
    presenceVisible = false
    observed = false
    placePresence()
  }

  const rt = createLevelRuntime({
    levelId: LEVEL08.id,
    puzzles: [lastRoomPuzzle],
    dialogueLines: LEVEL08_DIALOGUE,
    welcomeDelayMs: LEVEL08.welcomeDelayMs,
    completeDelayMs: LEVEL08.completeDelayMs,
    ...options,
    onEvent: (e) => {
      if (e.type === 'effect' && e.payload.effect === 'room_change') {
        variant = e.payload.variant
        presenceVisible = true // appears with the first transformation and stays
        placePresence()
      }
    },
    onStart: reset,
    onDispose: reset,
  })
  const manager = rt.manager
  const done = () => manager.isCompleted(LAST_ROOM_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing. view: { x, y, z, fx, fy, fz } (see mechanics/lookAway.js).
    update(view, dt) {
      if (!rt.isStarted() || !presenceVisible) return
      observed = isInView(view, { x: mover.x, y: P.eyeY, z: mover.z }, P.view)
      mover.step({ x: view.x, z: view.z }, dt, observed)
    },

    // Every door is fake. Returns true when the scene should send the player back to the start
    // (read getSpawn() afterwards: the room may have just changed).
    useDoor(index) {
      if (!rt.isStarted() || done()) return false
      if (!Number.isInteger(index) || index < 0 || index >= getRoomLayout(variant).doors.length) return false
      manager.dispatch('door_used', { door: index })
      return true
    },
    // The real exit: only once the presence exists.
    followPresence() {
      if (!rt.isStarted() || !presenceVisible || done()) return false
      manager.dispatch('follow')
      return done()
    },

    getVariant: () => variant,
    getLayout: () => getRoomLayout(variant),
    getSpawn: () => getRoomLayout(variant).spawn,
    getPresence: () => ({ x: mover.x, z: mover.z }),
    isPresenceVisible: () => presenceVisible,
    isPresenceObserved: () => observed,
    isExitDone: done,
    getDoorUses: () => manager.get(LAST_ROOM_ID)?.getData()?.doorUses ?? 0,
  }
}
