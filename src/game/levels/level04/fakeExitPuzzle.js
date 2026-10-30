// "The Wrong Exit": the left door is fake (it only ever sends you back); the right door is always the
// real exit, so the level can never become unsolvable. The sign's text is NOT part of these rules.
export const FAKE_EXIT_ID = 'fake-exit'
export const SIGN_CHANGE_AFTER = 2

export const fakeExitPuzzle = {
  id: FAKE_EXIT_ID,
  createState: () => ({ fakeUses: 0, exitUsed: false }),
  handlers: {
    fake_exit_used: (d, _p, api) => {
      d.fakeUses++
      api.emit('dialogue', { trigger: 'fake_exit' })
      if (d.fakeUses === SIGN_CHANGE_AFTER) api.emit('effect', { effect: 'sign_change', stage: 1 })
    },
    exit_used: (d) => {
      d.exitUsed = true
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : Math.min(d.fakeUses, 3) / 6),
}
