import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel14Logic } from '../../src/game/levels/level14/createLevel14Logic.js'
import { LEVEL14 } from '../../src/game/levels/level14/layout.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel14Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}

describe("Level 14: Time's Up", () => {
  it('is solved by pressing all three buttons inside the window, in any order', () => {
    for (const order of [[0, 1, 2], [2, 1, 0], [1, 2, 0]]) {
      const { logic, onLevelComplete } = setup()
      expect(logic.useExit()).toBe(false)
      for (const i of order) expect(logic.press(i)).toBe(true)
      expect(logic.isUnlocked()).toBe(true)
      expect(logic.useExit()).toBe(true)
      vi.advanceTimersByTime(LEVEL14.completeDelayMs + 10)
      expect(onLevelComplete).toHaveBeenCalledTimes(1)
      logic.dispose()
    }
  })

  it('presses are idempotent and bad indexes do nothing', () => {
    const { logic } = setup()
    expect(logic.press(0)).toBe(true)
    expect(logic.press(0)).toBe(false)
    for (const bad of [-1, 3, 1.5, NaN, undefined]) expect(logic.press(bad)).toBe(false)
  })

  it('the first press starts a hidden timer; missing it switches every button off again', () => {
    const { logic, messages } = setup()
    logic.press(0)
    logic.press(1)
    expect(messages).not.toContain('Time is up. Everything is off again.')
    vi.advanceTimersByTime(LEVEL14.windowMs + 10)
    expect(logic.getPressed()).toEqual([false, false, false])
    expect(logic.getAttempts()).toBe(1)
    vi.advanceTimersByTime(10)
    expect(messages).toContain('Oh. Did I mention the timer?')
  })

  it('every miss makes the next window longer (mercy), up to a cap, so nobody is locked out', () => {
    const { logic } = setup()
    let expected = LEVEL14.windowMs
    for (let miss = 1; miss <= 6; miss++) {
      expect(logic.getWindowMs()).toBe(expected)
      logic.press(0)
      vi.advanceTimersByTime(expected + 10)
      expect(logic.getAttempts()).toBe(miss)
      expected = Math.min(LEVEL14.maxWindowMs, LEVEL14.windowMs + miss * LEVEL14.mercyMs)
    }
    expect(logic.getWindowMs()).toBe(LEVEL14.maxWindowMs)
    logic.press(0) // and it is still solvable after all those misses
    logic.press(1)
    logic.press(2)
    expect(logic.isUnlocked()).toBe(true)
  })

  it('a longer window really does last longer', () => {
    const { logic } = setup()
    logic.press(0)
    vi.advanceTimersByTime(LEVEL14.windowMs + 10) // first miss
    logic.press(0)
    vi.advanceTimersByTime(LEVEL14.windowMs + 1000) // would have expired under the old window
    expect(logic.getPressed()[0]).toBe(true)
  })

  it('the deadline stops mattering once unlocked', () => {
    const { logic } = setup()
    logic.press(0)
    logic.press(1)
    logic.press(2)
    vi.advanceTimersByTime(LEVEL14.maxWindowMs * 2)
    expect(logic.isUnlocked()).toBe(true)
    expect(logic.getPressed()).toEqual([true, true, true])
  })

  it('after two misses a hint says to press them all without stopping', () => {
    const { logic, messages } = setup()
    for (let miss = 0; miss < LEVEL14.hintAfterMisses; miss++) {
      logic.press(0)
      vi.advanceTimersByTime(LEVEL14.maxWindowMs + 10)
      vi.advanceTimersByTime(5000) // let queued lines play
    }
    expect(messages).toContain('All three buttons. Without stopping.')
  })

  it('dispose cancels a running deadline', () => {
    const { logic } = setup()
    logic.press(0)
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})
