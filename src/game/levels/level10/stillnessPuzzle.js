// "Stillness": stand still (no movement, no looking) for 8 seconds and the exit unlocks. The sign says HURRY
// and a fake countdown agrees; the decoy button just resets your stillness. Two hints arrive if you are stuck,
// the second one spelling it out, so it is always solvable.
export const STILLNESS_ID = 'stillness'

export const stillnessPuzzle = {
  id: STILLNESS_ID,
  createState: () => ({ unlocked: false, decoyPresses: 0, exitUsed: false }),
  onActivate: (api) => {
    api.after(60000, () => {
      if (!api.getData().unlocked) api.emit('dialogue', { trigger: 'hint_wait' })
    })
    api.after(120000, () => {
      if (!api.getData().unlocked) api.emit('dialogue', { trigger: 'hint_still' })
    })
  },
  handlers: {
    still_enough: (d, _p, api) => {
      if (d.unlocked) return
      d.unlocked = true
      api.emit('dialogue', { trigger: 'still_unlocked' })
    },
    decoy_pressed: (d, _p, api) => {
      if (d.unlocked) return
      d.decoyPresses++
      api.emit('effect', { effect: 'still_reset' })
      api.emit('dialogue', { trigger: 'still_decoy' })
    },
    countdown_zero: (_d, _p, api) => api.emit('dialogue', { trigger: 'too_late' }),
    exit_used: (d, _p, api) => {
      if (d.unlocked) d.exitUsed = true
      else api.emit('dialogue', { trigger: 'door_locked' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.unlocked ? 0.7 : 0),
}
