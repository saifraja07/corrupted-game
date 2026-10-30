import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL04_DIALOGUE } from '../../config/dialogue.js'
import { createStagedText } from '../../mechanics/stagedText.js'
import { createLookAwayChanger, isInView } from '../../mechanics/lookAway.js'
import { fakeExitPuzzle, FAKE_EXIT_ID } from './fakeExitPuzzle.js'
import { LEVEL04 } from './layout.js'

export function createLevel04Logic(options = {}) {
  const signText = createStagedText(LEVEL04.sign.stages)
  const lookAway = createLookAwayChanger()
  let doorOpen = false
  const reset = () => {
    signText.reset()
    lookAway.clear()
    doorOpen = false
  }

  const rt = createLevelRuntime({
    levelId: LEVEL04.id,
    puzzles: [fakeExitPuzzle],
    dialogueLines: LEVEL04_DIALOGUE,
    welcomeDelayMs: LEVEL04.welcomeDelayMs,
    completeDelayMs: LEVEL04.completeDelayMs,
    ...options,
    onEvent: (e) => {
      if (e.type === 'effect' && e.payload.effect === 'sign_change') {
        // Look-away transformation: applied only while the sign is out of view.
        lookAway.queue(() => {
          signText.setStage(e.payload.stage)
          rt.fire('sign_changed')
        })
      }
    },
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing. view: { x, y, z, fx, fy, fz } (see mechanics/lookAway.js).
    update(view) {
      if (!rt.isStarted()) return
      lookAway.update(isInView(view, LEVEL04.sign.position, LEVEL04.sign.view))
    },
    // Returns true when the caller should send the player back to the start.
    useFakeExit() {
      if (!rt.isStarted() || manager.isCompleted(FAKE_EXIT_ID)) return false
      manager.dispatch('fake_exit_used')
      return true
    },
    // The right door is always available.
    useRealExit() {
      if (!rt.isStarted() || manager.isCompleted(FAKE_EXIT_ID)) return false
      manager.dispatch('exit_used')
      return manager.isCompleted(FAKE_EXIT_ID)
    },
    getSignText: signText.get,
    getSignStage: signText.getStage,
    getFakeExitCount: () => manager.get(FAKE_EXIT_ID)?.getData()?.fakeUses ?? 0,
    isDoorOpen: () => doorOpen,
    isExitDone: () => manager.isCompleted(FAKE_EXIT_ID),
  }
}
