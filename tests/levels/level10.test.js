import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel10Logic } from '../../src/game/levels/level10/createLevel10Logic.js'
import { LEVEL10 } from '../../src/game/levels/level10/layout.js'

const FRAME = 1000 / 60
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const events = []
  const onLevelComplete = vi.fn()
  const logic = createLevel10Logic({
    onMessage: (l) => messages.push(l ? l.text : null),
    onGameEvent: (n) => {
      events.push(n)
      return null
    },
    onLevelComplete,
  })
  logic.start()
  return { logic, messages, events, onLevelComplete }
}
const at = (x = 0, z = 5, yaw = 0, pitch = 0) => ({ x, z, yaw, pitch })
// Feed the logic `ms` of frames; `state` may be a function of elapsed time.
function frames(logic, ms, state) {
  for (let t = 0; t < ms; t += FRAME) {
    logic.update(typeof state === 'function' ? state(t) : state, FRAME)
    vi.advanceTimersByTime(FRAME)
  }
}

describe('Level 10: stillness unlocks the exit', () => {
  it('eight seconds of doing nothing unlocks it; a little less does not', () => {
    const a = setup()
    frames(a.logic, LEVEL10.stillRequiredMs - 300, at())
    expect(a.logic.isUnlocked()).toBe(false)
    frames(a.logic, 600, at())
    expect(a.logic.isUnlocked()).toBe(true)
    expect(a.messages).toContain('...Fine.')
  })

  it('walking resets it, and so does turning your head', () => {
    const { logic } = setup()
    frames(logic, 6000, at())
    expect(logic.getStillMs()).toBeGreaterThan(5000)
    logic.update(at(0.05, 5), FRAME) // one small step
    expect(logic.getStillMs()).toBe(0)
    frames(logic, 6000, at(0.05, 5))
    logic.update(at(0.05, 5, 0.01), FRAME) // a small look
    expect(logic.getStillMs()).toBe(0)
    frames(logic, 6000, at(0.05, 5, 0.01))
    logic.update(at(0.05, 5, 0.01, 0.02), FRAME) // a small tilt
    expect(logic.getStillMs()).toBe(0)
    expect(logic.isUnlocked()).toBe(false)
  })

  it('tiny floating-point noise does not count as moving (so a resting player is not punished)', () => {
    const { logic } = setup()
    frames(logic, LEVEL10.stillRequiredMs + 500, (t) => at(1e-7 * Math.sin(t), 5 + 1e-7 * Math.cos(t), 1e-7 * Math.sin(t), 1e-7))
    expect(logic.isUnlocked()).toBe(true)
  })

  it('the very first frame cannot unlock anything (there is nothing to compare it with)', () => {
    const { logic } = setup()
    logic.update(at(), 100000)
    expect(logic.isUnlocked()).toBe(false)
  })

  it('once unlocked it stays unlocked, however you move afterwards, and the exit completes once', () => {
    const { logic, onLevelComplete } = setup()
    frames(logic, LEVEL10.stillRequiredMs + 500, at())
    frames(logic, 5000, (t) => at(Math.sin(t / 300), 5 - t / 1000))
    expect(logic.isUnlocked()).toBe(true)
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(LEVEL10.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('the exit stays locked, with a line, until you have been still', () => {
    const { logic, messages, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false)
    expect(messages).toContain('Locked.')
    vi.advanceTimersByTime(30000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })

  it('pausing (no updates) changes nothing, so stillness cannot be gained or lost while paused', () => {
    const { logic } = setup()
    frames(logic, 5000, at())
    const before = logic.getStillMs()
    vi.advanceTimersByTime(60000) // the game is paused: no update calls
    expect(logic.getStillMs()).toBe(before)
  })
})

describe('Level 10: the lies', () => {
  it('the countdown only ticks while you move, and freezes while you are still (the clue)', () => {
    const { logic } = setup()
    expect(logic.getCountdownText()).toBe('EXIT CLOSES IN 30')
    frames(logic, 5200, (t) => at(Math.sin(t / 200), 5)) // moving
    const moving = logic.getCountdownText()
    expect(moving).toMatch(/EXIT CLOSES IN (2[4-6])/)
    const hold = at(0, 5)
    logic.update(hold, FRAME)
    frames(logic, 4000, hold) // standing still (not long enough to unlock)
    expect(logic.getCountdownText()).toBe(moving) // frozen
  })

  it('at zero it says TOO LATE for a few seconds, nothing real happens, then it starts over', () => {
    const { logic, messages, events, onLevelComplete } = setup()
    frames(logic, 31000, (t) => at(Math.sin(t / 150), 5 + Math.cos(t / 190)))
    expect(logic.getCountdownText()).toBe('TOO LATE.')
    expect(events).toContain('too_late')
    expect(messages).toContain('Too late. Start again.')
    frames(logic, LEVEL10.tooLateMs + 300, (t) => at(Math.sin(t / 150), 5 + Math.cos(t / 190)))
    expect(logic.getCountdownText()).toMatch(/^EXIT CLOSES IN \d+$/)
    expect(logic.isUnlocked()).toBe(false)
    expect(onLevelComplete).not.toHaveBeenCalled()
    expect(logic.useExit()).toBe(false) // the countdown reaching zero did not "close" anything
  })

  it('the decoy button only costs you your stillness, and does nothing else', () => {
    const { logic, messages } = setup()
    frames(logic, 7000, at())
    expect(logic.getStillMs()).toBeGreaterThan(6500)
    expect(logic.pressDecoy()).toBe(true)
    expect(logic.getStillMs()).toBe(0)
    expect(messages.some((m) => m && /effort|Pressing things/.test(m))).toBe(true)
    frames(logic, LEVEL10.stillRequiredMs + 500, at()) // and you can still win afterwards
    expect(logic.isUnlocked()).toBe(true)
    expect(logic.pressDecoy()).toBe(false) // once solved the button is inert
  })

  it('hints arrive for a stuck player: a gentle one, then one that spells it out', () => {
    const { logic, messages } = setup()
    frames(logic, LEVEL10.hint1Ms + 500, (t) => at(Math.sin(t / 300), 5)) // keeps moving: stuck
    expect(messages).toContain('Have you tried not doing anything?')
    expect(messages).not.toContain('Stand still. For eight seconds.')
    frames(logic, LEVEL10.hint2Ms - LEVEL10.hint1Ms, (t) => at(Math.sin(t / 300), 5))
    expect(messages).toContain('Stand still. For eight seconds.')
  })

  it('no hints once it is solved', () => {
    const { logic, messages } = setup()
    frames(logic, LEVEL10.stillRequiredMs + 500, at())
    vi.advanceTimersByTime(LEVEL10.hint2Ms * 2)
    expect(messages).not.toContain('Stand still. For eight seconds.')
  })
})

describe('Level 10: cleanup', () => {
  it('dispose resets the stillness and countdown, leaves no timers, and restart is pristine', () => {
    const { logic, onLevelComplete } = setup()
    frames(logic, 20000, (t) => at(Math.sin(t / 150), 5))
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(200000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    logic.start()
    expect(logic.getCountdownText()).toBe('EXIT CLOSES IN 30')
    expect(logic.getStillMs()).toBe(0)
    expect(logic.isUnlocked()).toBe(false)
  })
})
