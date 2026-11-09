import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL11_DIALOGUE } from '../../config/dialogue.js'
import { mazePuzzle, MAZE_ID } from './mazePuzzle.js'
import { DECOYS } from './maze.js'
import { LEVEL11 } from './layout.js'

export function createLevel11Logic(options = {}) {
  let doorOpen = false
  let trail = false
  const reset = () => {
    doorOpen = false
    trail = false
  }
  const rt = createLevelRuntime({
    levelId: LEVEL11.id,
    puzzles: [mazePuzzle],
    dialogueLines: LEVEL11_DIALOGUE,
    welcomeDelayMs: LEVEL11.welcomeDelayMs,
    completeDelayMs: LEVEL11.completeDelayMs,
    ...options,
    onEvent: (e) => {
      if (e.type === 'effect' && e.payload.effect === 'trail_on') trail = true
    },
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(MAZE_ID)?.getData()
  const done = () => manager.isCompleted(MAZE_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // A decoy door. Returns true when the scene should send the player back to the start.
    useDecoy(index) {
      if (!rt.isStarted() || done() || !Number.isInteger(index) || index < 0 || index >= DECOYS.length) return false
      manager.dispatch('decoy_used', { door: index })
      return true
    },
    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    isTrailOn: () => trail,
    getDecoyUses: () => data()?.decoyUses ?? 0,
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
