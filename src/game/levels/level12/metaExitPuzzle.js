// "Exit": every door is painted on. The way out is the EXIT button in the pause menu. Three hints, each more
// direct, the last one spelling it out ("Press Escape. Then choose EXIT."), so it is always discoverable.
export const META_EXIT_ID = 'meta-exit'

export const metaExitPuzzle = {
  id: META_EXIT_ID,
  createState: () => ({ probes: 0, exitUsed: false }),
  onActivate: (api) => {
    const hint = (ms, trigger) =>
      api.after(ms, () => {
        if (!api.getData().exitUsed) api.emit('dialogue', { trigger })
      })
    hint(45000, 'hint_no_door')
    hint(90000, 'hint_where')
    hint(150000, 'hint_escape')
  },
  handlers: {
    doorway_probe: (d, _p, api) => {
      d.probes++
      api.emit('dialogue', { trigger: 'doorway' })
    },
    meta_exit: (d, _p, api) => {
      if (d.exitUsed) return
      d.exitUsed = true
      api.emit('dialogue', { trigger: 'meta_found' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : Math.min(d.probes, 3) / 10),
}
