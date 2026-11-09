import { LEVEL17 } from './layout.js'

// "Knock Knock": the seventh accepted knock opens the door. The logic filters knocks that come too fast
// (knock_fast); the decoy button wipes the count. Two hints arrive if the player is stuck, the second one spelling
// it out, so it is always solvable.
export const KNOCK_ID = 'knock'

export const knockPuzzle = {
  id: KNOCK_ID,
  createState: () => ({ knocks: 0, decoyPresses: 0, exitUsed: false }),
  onActivate: (api) => {
    api.after(LEVEL17.hint1Ms, () => {
      if (api.getData().knocks === 0) api.emit('dialogue', { trigger: 'hint_patience' })
    })
    api.after(LEVEL17.hint2Ms, () => {
      if (!api.getData().exitUsed) api.emit('dialogue', { trigger: 'hint_seven' })
    })
  },
  handlers: {
    knock: (d, _p, api) => {
      if (d.exitUsed) return
      d.knocks++
      if (d.knocks >= LEVEL17.knocksRequired) {
        d.exitUsed = true
        api.emit('dialogue', { trigger: 'knock_open' })
      } else {
        api.emit('dialogue', { trigger: 'knock' })
      }
    },
    knock_fast: (d, _p, api) => {
      if (!d.exitUsed) api.emit('dialogue', { trigger: 'knock_fast' })
    },
    decoy: (d, _p, api) => {
      if (d.exitUsed) return
      d.decoyPresses++
      d.knocks = 0 // the "emergency" way out costs you your knocks
      api.emit('dialogue', { trigger: 'decoy_open' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => Math.min(1, d.knocks / LEVEL17.knocksRequired),
}
