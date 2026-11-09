import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel18Logic } from '../../src/game/levels/level18/createLevel18Logic.js'
import { LEVEL18 } from '../../src/game/levels/level18/layout.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel18Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}

describe('Level 18: The Honest Room', () => {
  it('does exactly what the sign says: left button, wait five seconds, use the door', () => {
    const { logic, onLevelComplete } = setup()
    expect(LEVEL18.signLines).toEqual(['1. PRESS THE LEFT BUTTON.', '2. WAIT FIVE SECONDS.', '3. USE THE DOOR.'])
    expect(logic.useExit()).toBe(false) // nothing done yet
    expect(logic.pressLeft()).toBe(true)
    logic.update(LEVEL18.waitMs + 10)
    expect(logic.isReady()).toBe(true)
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(LEVEL18.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('the wait is five real seconds of game time, counted over many frames', () => {
    const { logic } = setup()
    logic.pressLeft()
    for (let t = 0; t < LEVEL18.waitMs - 100; t += 16) logic.update(16)
    expect(logic.isReady()).toBe(false)
    for (let t = 0; t < 300; t += 16) logic.update(16)
    expect(logic.isReady()).toBe(true)
  })

  it('the wait does not run until the left button has been pressed', () => {
    const { logic } = setup()
    logic.update(LEVEL18.waitMs * 3)
    expect(logic.isReady()).toBe(false)
    logic.pressLeft()
    expect(logic.getWaitMs()).toBe(0)
    logic.update(LEVEL18.waitMs + 10)
    expect(logic.useExit()).toBe(true)
  })

  it('using the door too early is refused and restarts the wait', () => {
    const { logic, messages } = setup()
    logic.pressLeft()
    logic.update(LEVEL18.waitMs - 1000)
    expect(logic.useExit()).toBe(false)
    expect(logic.getWaitMs()).toBe(0)
    vi.advanceTimersByTime(5000)
    expect(messages).toContain('I said wait. Start the wait again.')
    logic.update(LEVEL18.waitMs - 1000)
    expect(logic.useExit()).toBe(false) // only 4 s since the restart
    logic.update(LEVEL18.waitMs)
    expect(logic.useExit()).toBe(true)
  })

  it('the right button (not on the sign) undoes everything, and the room is still solvable after it', () => {
    const { logic, messages } = setup()
    logic.pressLeft()
    logic.update(LEVEL18.waitMs + 10)
    expect(logic.pressRight()).toBe(true)
    expect(logic.isLeftPressed()).toBe(false)
    expect(logic.isReady()).toBe(false)
    expect(logic.getWaitMs()).toBe(0)
    vi.advanceTimersByTime(5000)
    expect(messages).toContain('That one was not on the sign.')
    expect(logic.pressLeft()).toBe(true)
    logic.update(LEVEL18.waitMs + 10)
    expect(logic.useExit()).toBe(true)
  })

  it('pressing the left button twice does not restart anything', () => {
    const { logic } = setup()
    logic.pressLeft()
    logic.update(3000)
    expect(logic.pressLeft()).toBe(false)
    expect(logic.getWaitMs()).toBe(3000)
  })

  it('hint for the player who cannot believe it', () => {
    const { logic, messages } = setup()
    vi.advanceTimersByTime(LEVEL18.hintMs + 100)
    expect(messages).toContain('The sign is not lying. I know. I am surprised too.')
    expect(logic.isExitDone()).toBe(false)
  })

  it('dispose leaves nothing behind', () => {
    const { logic } = setup()
    logic.pressLeft()
    logic.update(2000)
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    expect(logic.getWaitMs()).toBe(0)
  })
})
