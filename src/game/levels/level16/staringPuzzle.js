import { LEVEL16 } from './layout.js'

// "Staring Contest": hold the eye's gaze for six seconds and the door unlocks. The logic feeds in the milestones
// (stare_1, stare_2, stare_win) and a stare_broken when a long stare is abandoned. Two hints arrive if the player
// is stuck, the second one spelling it out, so it is always solvable.
export const STARING_ID = 'staring'

export const staringPuzzle = {
  id: STARING_ID,
  createState: () => ({ unlocked: false, exitUsed: false }),
  onActivate: (api) => {
    api.after(LEVEL16.hint1Ms, () => {
      if (!api.getData().unlocked) api.emit('dialogue', { trigger: 'hint_stare' })
    })
    api.after(LEVEL16.hint2Ms, () => {
      if (!api.getData().unlocked) api.emit('dialogue', { trigger: 'hint_win' })
    })
  },
  handlers: {
    stare_1: (d, _p, api) => {
      if (!d.unlocked) api.emit('dialogue', { trigger: 'stare_1' })
    },
    stare_2: (d, _p, api) => {
      if (!d.unlocked) api.emit('dialogue', { trigger: 'stare_2' })
    },
    stare_broken: (d, _p, api) => {
      if (!d.unlocked) api.emit('dialogue', { trigger: 'stare_broken' })
    },
    stare_win: (d, _p, api) => {
      if (d.unlocked) return
      d.unlocked = true
      api.emit('dialogue', { trigger: 'stare_win' })
    },
    exit_used: (d, _p, api) => {
      if (d.unlocked) d.exitUsed = true
      else api.emit('dialogue', { trigger: 'door_locked' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.unlocked ? 0.7 : 0),
}
