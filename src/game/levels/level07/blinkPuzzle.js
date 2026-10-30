// "Blink": get through the gate, which only opens while you aren't watching it, then use the exit. The
// gate never closes on you, and two escalating hints arrive if you linger at it, so it is always solvable.
export const BLINK_ID = 'blink'

export const blinkPuzzle = {
  id: BLINK_ID,
  createState: () => ({ crossed: false, hints: 0, exitUsed: false }),
  handlers: {
    crossed: (d, _p, api) => {
      if (d.crossed) return
      d.crossed = true
      api.emit('dialogue', { trigger: 'crossed' })
    },
    linger: (d, payload, api) => {
      if (d.crossed) return
      if (payload?.level === 1 && d.hints < 1) {
        d.hints = 1
        api.emit('dialogue', { trigger: 'hint_blink' })
      } else if (payload?.level === 2 && d.hints < 2) {
        d.hints = 2
        api.emit('dialogue', { trigger: 'hint_backwards' })
      }
    },
    exit_used: (d) => {
      if (d.crossed) d.exitUsed = true // the exit is only reachable past the gate
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.crossed ? 0.7 : d.hints / 6),
}
