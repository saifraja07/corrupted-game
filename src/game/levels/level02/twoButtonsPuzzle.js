// "The Easy Part": the sign says "the button" but the door needs two. Order doesn't matter.
// A hint is scheduled with the puzzle's own tracked timer if only the obvious one is pressed.
export const TWO_BUTTONS_ID = 'two-buttons'
export const HINT_DELAY_MS = 25000

export const twoButtonsPuzzle = {
  id: TWO_BUTTONS_ID,
  createState: () => ({ a: false, b: false, exitUsed: false }),
  handlers: {
    press_a: (d, _p, api) => {
      if (d.a) return
      d.a = true
      api.emit('dialogue', { trigger: 'button_a' })
      if (!d.b) {
        api.after(HINT_DELAY_MS, () => {
          if (!d.b) api.emit('dialogue', { trigger: 'hint_look_up' })
        })
      }
    },
    press_b: (d, _p, api) => {
      if (d.b) return
      d.b = true
      api.emit('dialogue', { trigger: 'button_b' })
    },
    exit_used: (d, _p, api) => {
      if (d.a && d.b) d.exitUsed = true
      else api.emit('dialogue', { trigger: 'door_locked' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => ((d.a ? 1 : 0) + (d.b ? 1 : 0) + (d.exitUsed ? 1 : 0)) / 3,
}
