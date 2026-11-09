import { LEVEL18 } from './layout.js'

// "The Honest Room": every line of the sign is true. Press the left button, wait five seconds (the logic reports
// wait_done), then use the door. Pressing the right button, or using the door before the wait is over, restarts
// the wait (the 'wait_reset' effect tells the logic to zero its clock). A hint arrives for the player who cannot
// bring themselves to believe the sign.
export const TRUTH_ID = 'truth'

export const truthPuzzle = {
  id: TRUTH_ID,
  createState: () => ({ left: false, waited: false, rightPresses: 0, earlyTries: 0, exitUsed: false }),
  onActivate: (api) => {
    api.after(LEVEL18.hintMs, () => {
      if (!api.getData().exitUsed) api.emit('dialogue', { trigger: 'hint_truth' })
    })
  },
  handlers: {
    press_left: (d, _p, api) => {
      if (d.left) return
      d.left = true
      api.emit('dialogue', { trigger: 'left_pressed' })
    },
    press_right: (d, _p, api) => {
      d.rightPresses++
      d.left = false
      d.waited = false
      api.emit('effect', { effect: 'wait_reset' })
      api.emit('dialogue', { trigger: 'right_pressed' })
    },
    wait_done: (d, _p, api) => {
      if (!d.left || d.waited) return
      d.waited = true
      api.emit('dialogue', { trigger: 'wait_ready' })
    },
    exit_used: (d, _p, api) => {
      if (d.left && d.waited) {
        d.exitUsed = true
      } else if (d.left) {
        d.earlyTries++
        api.emit('effect', { effect: 'wait_reset' })
        api.emit('dialogue', { trigger: 'door_early' })
      } else {
        api.emit('dialogue', { trigger: 'door_locked' })
      }
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.waited ? 0.8 : d.left ? 0.4 : 0),
}
