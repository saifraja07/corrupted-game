import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL05_DIALOGUE } from '../../config/dialogue.js'
import { createSequencePlayer } from '../../mechanics/sequencePlayer.js'
import { sequencePuzzle, SEQUENCE, SEQUENCE_ID, COLOR_COUNT } from './sequencePuzzle.js'
import { LEVEL05 } from './layout.js'

export function createLevel05Logic(options = {}) {
  const lamps = createSequencePlayer({ sequence: SEQUENCE, stepMs: LEVEL05.stepMs, gapMs: LEVEL05.gapMs })
  let flash = { index: -1, leftMs: 0 }
  let doorOpen = false
  const reset = () => {
    lamps.stop()
    flash = { index: -1, leftMs: 0 }
    doorOpen = false
  }

  const rt = createLevelRuntime({
    levelId: LEVEL05.id,
    puzzles: [sequencePuzzle],
    dialogueLines: LEVEL05_DIALOGUE,
    welcomeDelayMs: LEVEL05.welcomeDelayMs,
    completeDelayMs: LEVEL05.completeDelayMs,
    ...options,
    onEvent: (e) => {
      if (e.type === 'effect' && e.payload.effect === 'lamps_replay') lamps.play(e.payload.leadMs ?? 400)
    },
    onStart: () => {
      reset()
      lamps.play(LEVEL05.introLeadMs) // the lamps show the real order once, unprompted
    },
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const data = () => manager.get(SEQUENCE_ID)?.getData()
  const done = () => manager.isCompleted(SEQUENCE_ID)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Every frame while playing (dtMs in milliseconds). Pausing simply stops calling this.
    update(dtMs) {
      if (!rt.isStarted()) return
      lamps.update(dtMs)
      flash.leftMs = Math.max(0, flash.leftMs - dtMs)
    },

    pressColor(index) {
      if (!rt.isStarted() || data()?.solved || !Number.isInteger(index) || index < 0 || index >= COLOR_COUNT) return false
      flash = { index, leftMs: LEVEL05.flashMs }
      manager.dispatch('press', { color: index })
      return true
    },
    replay() {
      if (!rt.isStarted() || data()?.solved) return false
      manager.dispatch('replay')
      return true
    },
    useExit() {
      if (!rt.isStarted() || done()) return false
      manager.dispatch('exit_used')
      return done()
    },

    // 0..1 brightness of lamp i: lit by the sequence, or briefly by a button press.
    getLampLevel(i) {
      if (lamps.getActive() === i) return 1
      return flash.index === i && flash.leftMs > 0 ? 0.8 : 0
    },
    isReplaying: () => lamps.isPlaying(),
    isSolved: () => Boolean(data()?.solved),
    getProgress: () => data()?.progress ?? 0,
    getWrongCount: () => data()?.wrong ?? 0,
    isDoorOpen: () => doorOpen,
    isExitDone: done,
  }
}
