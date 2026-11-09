// "Almost": the decoy door fakes a level-complete screen (once), and that unlocks the real door. The fake
// screen is bounded (see config/fakeouts.js), records nothing, and has a real "Main menu" exit, so the
// level can never be lost to it. A hint points at the obvious exit if nobody has tried it for a minute.
export const ALMOST_ID = 'almost'

export const almostPuzzle = {
  id: ALMOST_ID,
  createState: () => ({ fakeUsed: false, decoyUses: 0, exitUsed: false }),
  onActivate: (api) => {
    api.after(60000, () => {
      if (!api.getData().fakeUsed) api.emit('dialogue', { trigger: 'hint_obvious' })
    })
  },
  handlers: {
    decoy_used: (d, _p, api) => {
      d.decoyUses++
      if (!d.fakeUsed) {
        d.fakeUsed = true // from now on the real door is unlocked
        api.emit('effect', { effect: 'fake_victory' })
        api.emit('dialogue', { trigger: 'fake_victory' })
        api.after(7000, () => api.emit('dialogue', { trigger: 'fake_back' }))
      } else {
        api.emit('dialogue', { trigger: 'decoy_again' })
      }
    },
    real_used: (d, _p, api) => {
      if (d.fakeUsed) {
        d.exitUsed = true
        api.emit('dialogue', { trigger: 'real_open' })
      } else {
        api.emit('dialogue', { trigger: 'door_locked' })
      }
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.fakeUsed ? 0.6 : 0),
}
