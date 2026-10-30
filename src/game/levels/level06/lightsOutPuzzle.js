// "Lights Out": press the right button. The sign claims the green one (always wrong). The truth is shown
// by a glowing mark during the blackouts, which repeat forever. Wrong presses cost nothing; the second
// one calls a blackout immediately (and a hint), so nobody is ever stuck waiting.
export const LIGHTS_OUT_ID = 'lights-out'
export const BUTTON_COUNT = 3
export const CORRECT_BUTTON = 2 // blue
export const SIGN_BUTTON = 1 // green: what the sign claims

export const lightsOutPuzzle = {
  id: LIGHTS_OUT_ID,
  createState: () => ({ wrong: 0, unlocked: false, exitUsed: false }),
  handlers: {
    press: (d, payload, api) => {
      if (d.unlocked) return
      const button = payload?.button
      if (!Number.isInteger(button) || button < 0 || button >= BUTTON_COUNT) return
      if (button === CORRECT_BUTTON) {
        d.unlocked = true
        api.emit('dialogue', { trigger: 'lights_unlocked' })
        return
      }
      d.wrong++
      if (d.wrong === 2) {
        api.emit('effect', { effect: 'blackout_now' }) // don't make them wait for the next one
        api.emit('dialogue', { trigger: 'hint_dark' })
      } else {
        api.emit('dialogue', { trigger: 'lights_wrong' })
      }
    },
    exit_used: (d, _p, api) => {
      if (d.unlocked) d.exitUsed = true
      else api.emit('dialogue', { trigger: 'door_locked' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.unlocked ? 0.7 : Math.min(d.wrong, 3) / 10),
}
