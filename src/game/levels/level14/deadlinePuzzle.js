import { LEVEL14 } from './layout.js'

// "Time's Up": press all three buttons inside a window that starts at the first press. A missed window clears the
// buttons and the next window is longer (mercy), up to a cap. Timers are the puzzle's own tracked timers, so they
// are cancelled on completion, reset and cleanup.
export const DEADLINE_ID = 'deadline'
export const BUTTON_COUNT = LEVEL14.buttons.length

const windowFor = (attempts) => Math.min(LEVEL14.maxWindowMs, LEVEL14.windowMs + attempts * LEVEL14.mercyMs)

function expire(d, api) {
  if (d.unlocked) return
  d.pressed = Array(BUTTON_COUNT).fill(false)
  d.started = false
  d.timerId = null
  d.attempts++
  d.windowMs = windowFor(d.attempts)
  api.emit('effect', { effect: 'buttons_reset' })
  api.emit('dialogue', { trigger: 'times_up' })
  if (d.attempts >= LEVEL14.hintAfterMisses) api.emit('dialogue', { trigger: 'hint_fast' })
}

export const deadlinePuzzle = {
  id: DEADLINE_ID,
  createState: () => ({
    pressed: Array(BUTTON_COUNT).fill(false),
    started: false,
    attempts: 0,
    windowMs: LEVEL14.windowMs,
    timerId: null,
    unlocked: false,
    exitUsed: false,
  }),
  handlers: {
    press: (d, p, api) => {
      const i = p?.index
      if (d.unlocked || !Number.isInteger(i) || i < 0 || i >= BUTTON_COUNT || d.pressed[i]) return
      d.pressed[i] = true
      if (!d.started) {
        d.started = true
        api.emit('dialogue', { trigger: 'press_first' })
        d.timerId = api.after(d.windowMs, () => expire(d, api))
      }
      if (d.pressed.every(Boolean)) {
        d.unlocked = true
        if (d.timerId !== null) api.cancel(d.timerId)
        d.timerId = null
        api.emit('dialogue', { trigger: 'unlocked' })
      }
    },
    exit_used: (d, _p, api) => {
      if (d.unlocked) d.exitUsed = true
      else api.emit('dialogue', { trigger: 'door_locked' })
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.unlocked ? 0.8 : d.pressed.filter(Boolean).length / (BUTTON_COUNT * 1.25)),
}
