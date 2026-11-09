import { LEVEL15 } from './layout.js'

// "Lean In": stay against the west wall for five seconds and the wall gives way (the door unlocks). Two hints
// arrive if the player is stuck, the second one spelling it out, so it is always solvable.
export const LEAN_ID = 'lean'

export const leanPuzzle = {
  id: LEAN_ID,
  createState: () => ({ unlocked: false, begun: false, exitUsed: false }),
  onActivate: (api) => {
    api.after(LEVEL15.hint1Ms, () => {
      if (!api.getData().unlocked) api.emit('dialogue', { trigger: 'hint_walls' })
    })
    api.after(LEVEL15.hint2Ms, () => {
      if (!api.getData().unlocked) api.emit('dialogue', { trigger: 'hint_west' })
    })
  },
  handlers: {
    lean_begin: (d, _p, api) => {
      if (d.unlocked || d.begun) return
      d.begun = true
      api.emit('dialogue', { trigger: 'lean_begin' })
    },
    lean_enough: (d, _p, api) => {
      if (d.unlocked) return
      d.unlocked = true
      api.emit('dialogue', { trigger: 'wall_gives' })
    },
    exit_used: (d, _p, api) => {
      if (d.unlocked) d.exitUsed = true
      else api.emit('dialogue', { trigger: 'door_locked' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.unlocked ? 0.7 : 0),
}
