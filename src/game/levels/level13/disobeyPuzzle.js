import { LEVEL13 } from './layout.js'

// "Do Not Press": the sign says not to touch the red button; pressing it three times unlocks the door. The green
// "safe" button resets the red presses, so the player who obeys the sign half-way is punished. Two hints arrive
// if they are stuck, the second one spelling it out, so it is always solvable.
export const DISOBEY_ID = 'disobey'

export const disobeyPuzzle = {
  id: DISOBEY_ID,
  createState: () => ({ red: 0, greenPresses: 0, unlocked: false, exitUsed: false }),
  onActivate: (api) => {
    api.after(LEVEL13.hint1Ms, () => {
      if (api.getData().red === 0) api.emit('dialogue', { trigger: 'hint_disobey' })
    })
    api.after(LEVEL13.hint2Ms, () => {
      if (!api.getData().unlocked) api.emit('dialogue', { trigger: 'hint_three' })
    })
  },
  handlers: {
    press_red: (d, _p, api) => {
      if (d.unlocked) return
      d.red++
      if (d.red >= LEVEL13.redPressesRequired) {
        d.unlocked = true
        api.emit('dialogue', { trigger: 'red_unlocked' })
      } else {
        api.emit('dialogue', { trigger: 'red_press' })
      }
    },
    press_green: (d, _p, api) => {
      if (d.unlocked) return
      d.greenPresses++
      if (d.red > 0) {
        d.red = 0 // the safe choice costs you your progress
        api.emit('dialogue', { trigger: 'green_reset' })
      } else {
        api.emit('dialogue', { trigger: 'green_nothing' })
      }
    },
    exit_used: (d, _p, api) => {
      if (d.unlocked) d.exitUsed = true
      else api.emit('dialogue', { trigger: 'door_locked' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.unlocked ? 0.7 : d.red / (LEVEL13.redPressesRequired * 2)),
}
