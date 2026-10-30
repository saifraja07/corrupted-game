// "Simple Instructions": press the four buttons in the order the LAMPS showed. The sign claims another
// order (red, green, blue, yellow), which is always wrong. A wrong press only resets your progress, so it
// can be retried forever. Replaying the lamps never costs anything. After three mistakes the game
// replays them for you and drops a hint, so the solution is always discoverable.
export const SEQUENCE_ID = 'simple-instructions'
export const COLOR_COUNT = 4
// Indices into COLORS: blue, red, yellow, green. (Deliberately not the sign's order 0,1,2,3.)
export const SEQUENCE = Object.freeze([2, 0, 3, 1])
export const SIGN_ORDER = Object.freeze([0, 1, 2, 3])

export const sequencePuzzle = {
  id: SEQUENCE_ID,
  createState: () => ({ progress: 0, wrong: 0, solved: false, exitUsed: false }),
  handlers: {
    press: (d, payload, api) => {
      if (d.solved) return
      const color = payload?.color
      if (!Number.isInteger(color) || color < 0 || color >= COLOR_COUNT) return
      if (color === SEQUENCE[d.progress]) {
        d.progress++
        if (d.progress === SEQUENCE.length) {
          d.solved = true
          api.emit('dialogue', { trigger: 'sequence_solved' })
        } else {
          api.emit('dialogue', { trigger: 'sequence_step' })
        }
      } else {
        d.wrong++
        d.progress = 0
        if (d.wrong === 3) {
          api.emit('effect', { effect: 'lamps_replay', leadMs: 800 }) // the game gives up and shows you
          api.emit('dialogue', { trigger: 'hint_lamps' })
        } else {
          api.emit('dialogue', { trigger: 'sequence_wrong' })
        }
      }
    },
    replay: (d, _p, api) => {
      if (d.solved) return
      api.emit('effect', { effect: 'lamps_replay', leadMs: 400 })
      api.emit('dialogue', { trigger: 'sequence_replay' })
    },
    exit_used: (d, _p, api) => {
      if (d.solved) d.exitUsed = true
      else api.emit('dialogue', { trigger: 'door_locked' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.solved ? 0.8 : (d.progress / SEQUENCE.length) * 0.7),
}
