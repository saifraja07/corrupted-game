import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel17Logic } from '../../src/game/levels/level17/createLevel17Logic.js'
import { LEVEL17 } from '../../src/game/levels/level17/layout.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel17Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}

const knockSlowly = (logic, n) => {
  for (let i = 0; i < n; i++) {
    logic.update(LEVEL17.knockGapMs + 10)
    logic.knock()
  }
}

describe('Level 17: Knock Knock', () => {
  it('opens on the seventh knock, and completes once', () => {
    const { logic, onLevelComplete } = setup()
    knockSlowly(logic, LEVEL17.knocksRequired - 1)
    expect(logic.isDoorOpen()).toBe(false)
    expect(logic.getKnocks()).toBe(LEVEL17.knocksRequired - 1)
    knockSlowly(logic, 1)
    expect(logic.isExitDone()).toBe(true)
    expect(logic.isDoorOpen()).toBe(true)
    expect(logic.knock()).toBe(false) // done
    vi.advanceTimersByTime(LEVEL17.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('the first knock is always accepted; a knock before the gap has passed is refused, not punished', () => {
    const { logic, messages } = setup()
    expect(logic.knock()).toBe(true)
    expect(logic.knock()).toBe(false)
    expect(logic.knock()).toBe(false)
    expect(logic.getKnocks()).toBe(1) // refused knocks neither count nor reset anything
    vi.advanceTimersByTime(3000)
    expect(messages).toContain('Slow down. Doors have feelings.')
    logic.update(LEVEL17.knockGapMs - 1)
    expect(logic.knock()).toBe(false) // one millisecond short
    logic.update(1)
    expect(logic.knock()).toBe(true)
  })

  it('hammering the door cannot skip the wait: the gap is measured from the last ACCEPTED knock', () => {
    const { logic } = setup()
    logic.knock()
    for (let i = 0; i < 50; i++) {
      logic.update(LEVEL17.knockGapMs / 100)
      logic.knock() // refused every time until the gap has really passed
    }
    expect(logic.getKnocks()).toBeLessThanOrEqual(2)
  })

  it('the emergency button wipes the knocks, and the level is still solvable afterwards', () => {
    const { logic, messages } = setup()
    knockSlowly(logic, 4)
    expect(logic.pressDecoy()).toBe(true)
    expect(logic.getKnocks()).toBe(0)
    vi.advanceTimersByTime(5000)
    expect(messages).toContain('Emergency exits are for emergencies. Start over.')
    knockSlowly(logic, LEVEL17.knocksRequired)
    expect(logic.isExitDone()).toBe(true)
  })

  it('has a different line for each of the first six knocks, and one for the opening', () => {
    const { logic, messages } = setup()
    for (let i = 0; i < LEVEL17.knocksRequired; i++) {
      knockSlowly(logic, 1)
      vi.advanceTimersByTime(2500)
    }
    for (const line of ['Locked.', 'Still locked.', 'Please stop.', 'Nobody is home.', 'You are persistent.', 'Almost.', 'Finally. Someone is home.']) expect(messages).toContain(line)
  })

  it('hints: patience if you never knocked, then the number spelled out', () => {
    const { logic, messages } = setup()
    vi.advanceTimersByTime(LEVEL17.hint1Ms + 100)
    expect(messages).toContain('Doors answer to persistence. Slowly.')
    vi.advanceTimersByTime(LEVEL17.hint2Ms)
    expect(messages).toContain('Seven knocks. One at a time.')
    expect(logic.isExitDone()).toBe(false)
  })

  it('dispose leaves nothing behind and resets the gap clock', () => {
    const { logic } = setup()
    logic.knock()
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    logic.start()
    expect(logic.knock()).toBe(true) // a fresh run: the first knock is allowed again
    logic.dispose()
  })
})
