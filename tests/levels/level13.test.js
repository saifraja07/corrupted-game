import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel13Logic } from '../../src/game/levels/level13/createLevel13Logic.js'
import { LEVEL13 } from '../../src/game/levels/level13/layout.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel13Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}

describe('Level 13: Do Not Press', () => {
  it('is solved by pressing the red button three times, then using the door', () => {
    const { logic, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false) // locked
    for (let i = 0; i < LEVEL13.redPressesRequired; i++) expect(logic.pressRed()).toBe(true)
    expect(logic.isUnlocked()).toBe(true)
    expect(logic.isDoorOpen()).toBe(false) // opens only when used
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false) // no duplicate completion
    vi.advanceTimersByTime(LEVEL13.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('the green "safe" button wipes the red presses, and does nothing harmful when there are none', () => {
    const { logic, messages } = setup()
    logic.pressGreen()
    expect(messages).toContain('The green one is perfectly safe.')
    logic.pressRed()
    logic.pressRed()
    expect(logic.getRedCount()).toBe(2)
    logic.pressGreen()
    expect(logic.getRedCount()).toBe(0)
    expect(logic.isUnlocked()).toBe(false)
    for (let i = 0; i < LEVEL13.redPressesRequired; i++) logic.pressRed() // still solvable afterwards
    expect(logic.isUnlocked()).toBe(true)
  })

  it('ignores both buttons once unlocked', () => {
    const { logic } = setup()
    for (let i = 0; i < LEVEL13.redPressesRequired; i++) logic.pressRed()
    expect(logic.pressRed()).toBe(false)
    expect(logic.pressGreen()).toBe(false)
    expect(logic.isUnlocked()).toBe(true)
  })

  it('hints: "break the rule" if red was never touched, then the answer spelled out', () => {
    const { logic, messages } = setup()
    vi.advanceTimersByTime(LEVEL13.hint1Ms + 100)
    expect(messages).toContain('Some instructions are meant to be broken.')
    vi.advanceTimersByTime(LEVEL13.hint2Ms)
    expect(messages).toContain('The red one. Three times. Leave the green one alone.')
    expect(logic.isUnlocked()).toBe(false)
  })

  it('the first hint stays quiet for a player who already pressed red', () => {
    const { logic, messages } = setup()
    logic.pressRed()
    vi.advanceTimersByTime(LEVEL13.hint1Ms + 100)
    expect(messages).not.toContain('Some instructions are meant to be broken.')
  })

  it('dispose leaves nothing behind', () => {
    const { logic } = setup()
    logic.pressRed()
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    expect(logic.pressRed()).toBe(false) // not started any more
  })
})
