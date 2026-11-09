// "Which Way Out": find the real exit. Decoy doors send you back to the start. If you are lost, a hint names
// the corner after two minutes, and after five a glowing trail marks the way, so nobody is lost forever.
export const MAZE_ID = 'maze'

export const mazePuzzle = {
  id: MAZE_ID,
  createState: () => ({ decoyUses: 0, trail: false, exitUsed: false }),
  onActivate: (api) => {
    api.after(120000, () => {
      if (!api.getData().exitUsed) api.emit('dialogue', { trigger: 'hint_corner' })
    })
    api.after(300000, () => {
      const d = api.getData()
      if (d.exitUsed) return
      d.trail = true
      api.emit('effect', { effect: 'trail_on' })
      api.emit('dialogue', { trigger: 'hint_trail' })
    })
  },
  handlers: {
    decoy_used: (d, _p, api) => {
      d.decoyUses++
      api.emit('dialogue', { trigger: 'maze_decoy' })
    },
    exit_used: (d) => {
      d.exitUsed = true
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : Math.min(d.decoyUses, 3) / 10),
}
