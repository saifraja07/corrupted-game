// "Backwards": crossing the zone reverses movement controls. The calibration button restores them and
// unlocks the exit. Solvable in any order: pressing calibrate first simply means no reversal ever happens.
export const BACKWARDS_ID = 'backwards'
export const REVERSED_HINT_DELAY_MS = 30000

export const backwardsPuzzle = {
  id: BACKWARDS_ID,
  createState: () => ({ reversed: false, calibrated: false, exitUsed: false }),
  handlers: {
    zone_entered: (d, _p, api) => {
      if (d.reversed || d.calibrated) return
      d.reversed = true
      api.emit('effect', { effect: 'reverse_controls', on: true })
      api.emit('dialogue', { trigger: 'controls_reversed' })
      api.after(REVERSED_HINT_DELAY_MS, () => {
        if (d.reversed && !d.calibrated) api.emit('dialogue', { trigger: 'hint_reversed' })
      })
    },
    calibrate_pressed: (d, _p, api) => {
      if (d.calibrated) return
      d.calibrated = true
      if (d.reversed) {
        d.reversed = false
        api.emit('effect', { effect: 'reverse_controls', on: false })
      }
      api.emit('dialogue', { trigger: 'calibrated' })
    },
    exit_used: (d) => {
      if (d.calibrated) d.exitUsed = true
    },
  },
  // A reset must never leave the player with reversed controls.
  onReset: (api) => api.emit('effect', { effect: 'reverse_controls', on: false }),
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.calibrated ? 0.66 : d.reversed ? 0.33 : 0),
}
